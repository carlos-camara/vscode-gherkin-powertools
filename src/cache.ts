import * as vscode from 'vscode';
import { logger } from './logger';
import * as fs from 'fs';

export interface StepDefinition {
    regex: RegExp;
    location: vscode.Location;
    patternText: string;
    functionSignature?: string;
    documentation?: string;
}

export class SymbolCache {
    // Map of file URI string to a list of step definitions in that file
    private cache: Map<string, StepDefinition[]> = new Map();
    private isInitialized = false;

    public async initialize(): Promise<void> {
        if (this.isInitialized) return;
        
        try {
            const stepFiles = await vscode.workspace.findFiles('**/steps/**/*.py', '**/node_modules/**');
            for (const file of stepFiles) {
                this.updateFile(file);
            }
            this.isInitialized = true;
            logger.info(`Gherkin PowerTools: Symbol cache initialized with ${stepFiles.length} files.`);
        } catch (err) {
            logger.error('Error initializing symbol cache:', err);
        }
    }

    public updateFile(uri: vscode.Uri): void {
        try {
            const content = fs.readFileSync(uri.fsPath, 'utf8');
            const lines = content.split(/\r?\n/);
            const definitions: StepDefinition[] = [];

            for (let i = 0; i < lines.length; i++) {
                const pyLine = lines[i].trim();

                // Look for Behave decorators: @given('...'), @when(r"..."), etc.
                const decoratorMatch = pyLine.match(/^@(given|when|then|step)\s*\(\s*(?:r|u|f|b)?(['"])(.*?)\2/i);
                if (decoratorMatch) {
                    const patternText = decoratorMatch[3];
                    
                    // Convert Behave pattern to JS RegExp
                    // Replace {variable} or (?P<variable>...) with .*
                    let regexPattern = patternText
                        .replace(/\{[^}]*\}/g, '.*')
                        .replace(/\(\?P<[^>]+>.*?\)/g, '.*');

                    // Escape special regex characters except .*
                    regexPattern = regexPattern.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&').replace(/\\\.\\\*/g, '.*');

                    // Prevent exponential backtracking (ReDoS) by collapsing consecutive .*
                    regexPattern = regexPattern.replace(/(?:\.\*)+/g, '.*');

                    let functionSignature: string | undefined;
                    let documentation: string | undefined;

                    // Look ahead for function signature and docstring (up to 15 lines)
                    for (let j = i + 1; j < Math.min(i + 15, lines.length); j++) {
                        const aheadLine = lines[j].trim();
                        if (!functionSignature && aheadLine.startsWith('def ')) {
                            functionSignature = aheadLine;
                            let currentLineIdx = j;
                            
                            // If it doesn't end with a colon, it might be a multiline signature
                            while (!functionSignature.endsWith(':') && currentLineIdx + 1 < lines.length) {
                                currentLineIdx++;
                                const nextLine = lines[currentLineIdx].trim();
                                functionSignature += ' ' + nextLine;
                            }

                            if (functionSignature.endsWith(':')) {
                                functionSignature = functionSignature.slice(0, -1);
                            }
                            
                            // Now look for docstring directly after def
                            for (let k = currentLineIdx + 1; k < Math.min(currentLineIdx + 10, lines.length); k++) {
                                const docLine = lines[k].trim();
                                if (docLine.startsWith('"""') || docLine.startsWith("'''")) {
                                    const quote = docLine.substring(0, 3);
                                    let doc = docLine.substring(3);
                                    if (doc.endsWith(quote) && docLine.length > 3) {
                                        documentation = doc.slice(0, -3).trim();
                                        break; // single line docstring
                                    } else {
                                        // multi-line docstring
                                        let fullDoc = doc + '\n';
                                        for (let m = k + 1; m < lines.length; m++) {
                                            const mLine = lines[m];
                                            const mTrimmed = mLine.trim();
                                            if (mTrimmed.endsWith(quote)) {
                                                fullDoc += mLine.substring(0, mLine.lastIndexOf(quote));
                                                break;
                                            }
                                            fullDoc += mLine + '\n';
                                        }
                                        documentation = fullDoc.trim();
                                        break;
                                    }
                                } else if (docLine !== '') {
                                    break; // not a docstring if it's some other code
                                }
                            }
                            break;
                        }
                    }

                    try {
                        const regex = new RegExp('^' + regexPattern + '$', 'i');
                        definitions.push({
                            regex,
                            location: new vscode.Location(
                                uri,
                                new vscode.Position(i, pyLine.indexOf(decoratorMatch[1]) - 1)
                            ),
                            patternText,
                            functionSignature,
                            documentation
                        });
                    } catch (e) {
                        // Ignore invalid regex generated from python string
                    }
                }
            }

            this.cache.set(uri.toString(), definitions);
        } catch (err) {
            logger.error(`Error updating cache for file ${uri.fsPath}:`, err);
            this.removeFile(uri); // Remove if file cannot be read
        }
    }

    public removeFile(uri: vscode.Uri): void {
        this.cache.delete(uri.toString());
    }

    public getStepDefinitions(stepText: string): StepDefinition[] {
        const matches: StepDefinition[] = [];
        for (const [_, definitions] of this.cache) {
            for (const def of definitions) {
                if (def.regex.test(stepText)) {
                    matches.push(def);
                }
            }
        }
        return matches;
    }

    public getStepDefinition(stepText: string): StepDefinition | null {
        const matches = this.getStepDefinitions(stepText);
        return matches.length > 0 ? matches[0] : null;
    }

    public findDefinition(stepText: string): vscode.Location | null {
        const def = this.getStepDefinition(stepText);
        return def ? def.location : null;
    }

    public getAllStepPatterns(): string[] {
        const patterns = new Set<string>();
        for (const [_, definitions] of this.cache) {
            for (const def of definitions) {
                patterns.add(def.patternText);
            }
        }
        return Array.from(patterns).sort();
    }
}

export class FeatureCache {
    private fileTagCounts: Map<string, Map<string, number>> = new Map();
    private globalTagCount: Map<string, number> = new Map();
    private parserPromise?: Promise<any>;
    private isInitialized = false;

    private async parseFeature(content: string): Promise<any> {
        if (!this.parserPromise) {
            this.parserPromise = (async () => {
                const dynamicImport = new Function('specifier', 'return import(specifier)');
                const gherkin = await dynamicImport('@cucumber/gherkin');
                const messages = await dynamicImport('@cucumber/messages');
                return { gherkin, messages };
            })();
        }
        
        const { gherkin, messages } = await this.parserPromise;
        const uuidFn = messages.IdGenerator.uuid();
        const builder = new gherkin.AstBuilder(uuidFn);
        const matcher = new gherkin.GherkinClassicTokenMatcher();
        const parser = new gherkin.Parser(builder, matcher);
        
        try {
            return parser.parse(content);
        } catch (e) {
            // If parsing fails due to syntax errors, extract whatever valid AST was built so far
            return builder.getResult();
        }
    }

    public async initialize(): Promise<void> {
        if (this.isInitialized) return;
        try {
            const featureFiles = await vscode.workspace.findFiles('**/*.feature', '**/node_modules/**');
            for (const file of featureFiles) {
                await this.updateFile(file);
            }
            this.isInitialized = true;
            logger.info(`Gherkin PowerTools: Feature cache initialized with ${featureFiles.length} files.`);
        } catch (err) {
            logger.error('Error initializing feature cache:', err);
        }
    }

    public async updateFile(uri: vscode.Uri): Promise<void> {
        try {
            const content = await fs.promises.readFile(uri.fsPath, 'utf8');
            const doc = await this.parseFeature(content);
            if (!doc) {
                // If completely unparsable, retain the last valid state
                return;
            }

            const tagCounts = new Map<string, number>();

            const addTagCount = (tag: string, count: number) => {
                tagCounts.set(tag, (tagCounts.get(tag) || 0) + count);
            };

            const processTags = (tags: any[] | undefined): string[] => {
                if (!tags) return [];
                return tags.map((t: any) => t.name);
            };

            const traverse = (node: any, inheritedTags: string[]) => {
                const currentTags = processTags(node.tags);
                const allTags = [...new Set([...inheritedTags, ...currentTags])];

                // Check if the scenario has examples (Scenario Outline)
                if (node.examples && node.examples.length > 0) {
                    // Scenario Outline
                    for (const example of node.examples) {
                        const exampleTags = processTags(example.tags);
                        const combinedTags = [...new Set([...allTags, ...exampleTags])];
                        const rowCount = example.tableBody ? example.tableBody.length : 0;
                        if (rowCount > 0) {
                            for (const tag of combinedTags) { addTagCount(tag, rowCount); }
                        } else {
                            // Fallback: If the table is empty or malformed but the outline exists, count it as 1
                            for (const tag of combinedTags) { addTagCount(tag, 1); }
                        }
                    }
                } else {
                    // Standard Scenario (or Outline without examples)
                    for (const tag of allTags) { addTagCount(tag, 1); }
                }
            };

            if (doc && doc.feature) {
                const featureTags = processTags(doc.feature.tags);
                if (doc.feature.children) {
                    for (const child of doc.feature.children) {
                        if (child.rule) {
                            const ruleTags = processTags(child.rule.tags);
                            const combinedRuleTags = [...new Set([...featureTags, ...ruleTags])];
                            if (child.rule.children) {
                                for (const rChild of child.rule.children) {
                                    if (rChild.scenario) traverse(rChild.scenario, combinedRuleTags);
                                }
                            }
                        } else if (child.scenario) {
                            traverse(child.scenario, featureTags);
                        }
                    }
                }
            }

            this.fileTagCounts.set(uri.toString(), tagCounts);
            this.recalculateGlobalTags();
        } catch (err) {
            logger.error(`Error updating feature cache for file ${uri.fsPath}:`, err);
            this.removeFile(uri);
        }
    }

    public removeFile(uri: vscode.Uri): void {
        this.fileTagCounts.delete(uri.toString());
        this.recalculateGlobalTags();
    }

    private recalculateGlobalTags() {
        this.globalTagCount.clear();
        for (const fileCounts of this.fileTagCounts.values()) {
            for (const [tag, count] of fileCounts.entries()) {
                this.globalTagCount.set(tag, (this.globalTagCount.get(tag) || 0) + count);
            }
        }
    }

    public getTagBlastRadius(tag: string): number {
        return this.globalTagCount.get(tag) || 0;
    }
}
