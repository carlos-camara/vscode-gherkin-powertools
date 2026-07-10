import * as vscode from 'vscode';
import { SymbolCache } from './cache';

/**
 * Diagnostic Provider that acts as a realtime Linter for Gherkin files.
 * It uses the official @cucumber/gherkin AST parser to catch syntax errors instantly.
 */
export class GherkinLinter {
    private diagnosticCollection: vscode.DiagnosticCollection;
    private parserPromise?: Promise<any>;
    private symbolCache: SymbolCache;

    constructor(symbolCache: SymbolCache) {
        this.diagnosticCollection = vscode.languages.createDiagnosticCollection('gherkin');
        this.symbolCache = symbolCache;
    }

    private async getParser() {
        if (!this.parserPromise) {
            this.parserPromise = (async () => {
                const dynamicImport = new Function('specifier', 'return import(specifier)');
                const { AstBuilder, GherkinClassicTokenMatcher, Parser } = await dynamicImport('@cucumber/gherkin');
                const { IdGenerator } = await dynamicImport('@cucumber/messages');
                const uuidFn = IdGenerator.uuid();
                const builder = new AstBuilder(uuidFn);
                const matcher = new GherkinClassicTokenMatcher();
                return new Parser(builder, matcher);
            })();
        }
        return this.parserPromise;
    }

    /**
     * Lints the document and applies diagnostics.
     * @param document The VS Code text document to lint.
     */
    public async lint(document: vscode.TextDocument) {
        if (document.languageId !== 'feature' && document.languageId !== 'gherkin') {
            return;
        }

        const diagnostics: vscode.Diagnostic[] = [];
        const text = document.getText();
        let gherkinDocument: any = null;

        try {
            const parser = await this.getParser();
            // We parse the document to catch syntax errors
            gherkinDocument = parser.parse(text);
        } catch (e: any) {
            // @cucumber/gherkin throws an array of errors for syntax issues
            const errors = Array.isArray(e.errors) ? e.errors : [e];
            
            for (const error of errors) {
                if (error.location && typeof error.location.line === 'number') {
                    // AST locations are 1-indexed, VS Code positions are 0-indexed
                    const lineIndex = Math.max(0, error.location.line - 1);
                    const lineText = document.lineAt(lineIndex).text;
                    
                    // Column from AST is 1-indexed. If not present or 0, default to first non-whitespace char.
                    let startChar = error.location.column ? Math.max(0, error.location.column - 1) : 0;
                    if (startChar === 0) {
                        const firstWordMatch = lineText.match(/\S+/);
                        startChar = firstWordMatch ? lineText.indexOf(firstWordMatch[0]) : 0;
                    }
                    
                    // Try to highlight the word at the error column, or just the rest of the line
                    const matchRest = lineText.substring(startChar).match(/\S+/);
                    let endChar = matchRest ? startChar + matchRest[0].length : lineText.length;
                    
                    // Format the error message cleanly
                    let message = error.message;
                    let code = 'SYNTAX_ERROR';
                    let suggestedEdit = '';

                    const gotMatch = message.match(/got '(.*?)'/);
                    if (gotMatch) {
                        const gotText = gotMatch[1];
                        
                        const blockKeywords = ['Feature', 'Rule', 'Background', 'Scenario Outline', 'Scenario Template', 'Scenario', 'Examples', 'Scenarios'];
                        const startsWithBlockKeyword = blockKeywords.find(k => gotText.startsWith(k));
                        
                        if (startsWithBlockKeyword && !gotText.startsWith(startsWithBlockKeyword + ':')) {
                            code = 'MISSING_COLON';
                            message = `Missing colon (':') after ${startsWithBlockKeyword}`;
                            suggestedEdit = startsWithBlockKeyword + ':';
                            // Adjust endChar to cover the full keyword
                            endChar = startChar + startsWithBlockKeyword.length;
                        } else {
                            const firstWord = gotText.split(/\s+/)[0];
                            const misspelledMap: { [key: string]: string } = {
                                'Givn': 'Given', 'Gven': 'Given', 'Give': 'Given',
                                'Whn': 'When', 'Wehn': 'When', 'Wen': 'When',
                                'Thn': 'Then', 'Tehn': 'Then', 'Ten': 'Then',
                                'Adn': 'And', 'An': 'And',
                                'Btu': 'But', 'Bt': 'But',
                                'Fature': 'Feature', 'Featur': 'Feature', 'Fetaure': 'Feature',
                                'Scenari': 'Scenario', 'Scanario': 'Scenario', 'Scenaro': 'Scenario'
                            };
                            
                            if (misspelledMap[firstWord]) {
                                code = 'MISSPELLED_KEYWORD';
                                const correctKeyword = misspelledMap[firstWord];
                                message = `Misspelled keyword: '${firstWord}'. Did you mean '${correctKeyword}'?`;
                                suggestedEdit = correctKeyword;
                                endChar = startChar + firstWord.length;
                            } else {
                                if (message.includes('expected:')) {
                                    message = 'Invalid Gherkin syntax. Expected a valid keyword (Feature, Scenario, Given, When, Then, etc.)';
                                } else {
                                    message = message.replace(/^(\d+:\d+):\s*/, '');
                                }
                            }
                        }
                    } else if (message.includes('inconsistent cell count')) {
                        code = 'INCONSISTENT_CELL_COUNT';
                        message = 'Inconsistent cell count in table row.';
                        // Check if the line is missing a closing pipe
                        if (!lineText.trim().endsWith('|')) {
                            message = 'Inconsistent cell count. Missing closing pipe?';
                            startChar = lineText.length;
                            endChar = lineText.length;
                            suggestedEdit = ' |';
                        }
                    } else {
                        if (message.includes('expected:')) {
                            message = 'Invalid Gherkin syntax. Expected a valid keyword (Feature, Scenario, Given, When, Then, etc.)';
                        } else {
                            message = message.replace(/^(\d+:\d+):\s*/, '');
                        }
                    }

                    const range = new vscode.Range(lineIndex, startChar, lineIndex, Math.max(startChar, endChar));

                    const diagnostic = new vscode.Diagnostic(
                        range,
                        message,
                        vscode.DiagnosticSeverity.Error
                    );
                    diagnostic.source = 'Gherkin Parser';
                    diagnostic.code = code;
                    
                    if (suggestedEdit) {
                        diagnostic.relatedInformation = [
                            new vscode.DiagnosticRelatedInformation(
                                new vscode.Location(document.uri, range),
                                suggestedEdit
                            )
                        ];
                    }
                    
                    diagnostics.push(diagnostic);
                }
            }
        }

        // If parsed successfully, check for undefined steps and semantic issues
        if (gherkinDocument && gherkinDocument.feature && gherkinDocument.feature.children) {
            for (const child of gherkinDocument.feature.children) {
                if (child.rule && child.rule.children) {
                    for (const ruleChild of child.rule.children) {
                        const ruleScenario = ruleChild.scenario || ruleChild.background;
                        if (ruleScenario) {
                            this.checkSteps(ruleScenario.steps || [], diagnostics, document);
                            this.checkScenarioExamples(ruleChild.scenario, diagnostics);
                        }
                    }
                } else {
                    const scenario = child.scenario || child.background;
                    if (scenario) {
                        this.checkSteps(scenario.steps || [], diagnostics, document);
                        this.checkScenarioExamples(child.scenario, diagnostics);
                    }
                }
            }
        }

        this.diagnosticCollection.set(document.uri, diagnostics);
    }

    private checkScenarioExamples(scenario: any, diagnostics: vscode.Diagnostic[]) {
        if (scenario && scenario.keyword && scenario.keyword.trim() === 'Scenario' && scenario.examples && scenario.examples.length > 0) {
            const lineIndex = Math.max(0, scenario.location.line - 1);
            const startChar = Math.max(0, scenario.location.column - 1);
            const endChar = startChar + scenario.keyword.length;
            
            const range = new vscode.Range(lineIndex, startChar, lineIndex, endChar);
            const diagnostic = new vscode.Diagnostic(
                range,
                "A 'Scenario' cannot have 'Examples'. Use 'Scenario Outline' instead.",
                vscode.DiagnosticSeverity.Warning
            );
            diagnostic.source = 'Gherkin Semantic';
            diagnostic.code = 'SCENARIO_WITH_EXAMPLES';
            diagnostics.push(diagnostic);
        }
    }

    private checkSteps(steps: any[], diagnostics: vscode.Diagnostic[], document: vscode.TextDocument) {
        for (const step of steps) {
            const stepText = step.text.trim();
            const def = this.symbolCache.findDefinition(stepText);
            if (!def) {
                const lineIndex = Math.max(0, step.location.line - 1);
                const lineText = document.lineAt(lineIndex).text;
                
                // Highlight just the step text (after the keyword)
                const keywordLength = step.keyword ? step.keyword.length : 0;
                let startChar = step.location.column ? Math.max(0, step.location.column - 1) : 0;
                
                // Adjust start character to skip keyword and following space if possible
                const textIndex = lineText.indexOf(stepText, startChar);
                if (textIndex !== -1) {
                    startChar = textIndex;
                }

                const endChar = startChar + stepText.length;
                const range = new vscode.Range(lineIndex, startChar, lineIndex, Math.max(startChar + 1, endChar));

                const diagnostic = new vscode.Diagnostic(
                    range,
                    `Undefined step: "${stepText}"`,
                    vscode.DiagnosticSeverity.Warning
                );
                diagnostic.source = 'Gherkin Definition';
                diagnostic.code = 'UNDEFINED_STEP';
                
                // Attach the keyword as related information string for the code action to use
                diagnostic.relatedInformation = [
                    new vscode.DiagnosticRelatedInformation(
                        new vscode.Location(document.uri, range),
                        step.keyword.trim()
                    )
                ];

                diagnostics.push(diagnostic);
            }
        }
    }

    /**
     * Clears diagnostics for a specific document.
     */
    public clear(document: vscode.TextDocument) {
        this.diagnosticCollection.delete(document.uri);
    }

    /**
     * Disposes the diagnostic collection.
     */
    public dispose() {
        this.diagnosticCollection.dispose();
    }
}
