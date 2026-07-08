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
                    const endChar = matchRest ? startChar + matchRest[0].length : lineText.length;

                    const range = new vscode.Range(lineIndex, startChar, lineIndex, Math.max(startChar + 1, endChar));
                    
                    // Format the error message cleanly
                    let message = error.message;
                    if (message.includes('expected:')) {
                        // Simplify the technical cucumber token names for the user
                        message = 'Invalid Gherkin syntax. Expected a valid keyword (Feature, Scenario, Given, When, Then, etc.)';
                    } else {
                        // Strip the (line:col): prefix from the error message if present
                        message = message.replace(/^(\d+:\d+):\s*/, '');
                    }

                    const diagnostic = new vscode.Diagnostic(
                        range,
                        message,
                        vscode.DiagnosticSeverity.Error
                    );
                    diagnostic.source = 'Gherkin Parser';
                    diagnostic.code = 'SYNTAX_ERROR';
                    diagnostics.push(diagnostic);
                }
            }
        }

        // If parsed successfully, check for undefined steps
        if (gherkinDocument && gherkinDocument.feature && gherkinDocument.feature.children) {
            for (const child of gherkinDocument.feature.children) {
                if (child.rule && child.rule.children) {
                    for (const ruleChild of child.rule.children) {
                        this.checkSteps(ruleChild.background?.steps || [], diagnostics, document);
                        this.checkSteps(ruleChild.scenario?.steps || [], diagnostics, document);
                    }
                } else {
                    this.checkSteps(child.background?.steps || [], diagnostics, document);
                    this.checkSteps(child.scenario?.steps || [], diagnostics, document);
                }
            }
        }

        this.diagnosticCollection.set(document.uri, diagnostics);
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
