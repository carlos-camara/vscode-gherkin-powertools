import * as vscode from 'vscode';
import * as fs from 'fs';
import { logger } from './logger';

export interface StepDefinition {
    type: 'given' | 'when' | 'then' | 'step';
    rawPattern: string;
    matcherType: 'parse' | 'cfparse' | 're';
    regex: RegExp;
    decoratorRange: vscode.Range;
    functionRange?: vscode.Range;
    functionName?: string;
    documentation?: string;
    uri: vscode.Uri;
}

export type CacheState = 'uninitialized' | 'initializing' | 'ready' | 'failed';

export class SymbolCache {
    // Map of file URI string to a list of step definitions in that file
    private cache: Map<string, StepDefinition[]> = new Map();
    public state: CacheState = 'uninitialized';
    private initPromise: Promise<void> | null = null;

    public initialize(): Promise<void> {
        if (this.state === 'initializing' || this.state === 'ready') {
            return this.initPromise!;
        }
        
        this.state = 'initializing';
        this.initPromise = (async () => {
            try {
                const config = vscode.workspace.getConfiguration('gherkinPowerTools.behave');
                const stepGlobs = config.get<string[]>('stepGlobs', ['**/steps/**/*.py', '**/features/steps/**/*.py']);
                const ignoreGlobs = config.get<string[]>('ignoreGlobs', ['**/node_modules/**', '**/.venv/**', '**/venv/**', '**/env/**']);

                const globPattern = stepGlobs.length > 1 ? `{${stepGlobs.join(',')}}` : stepGlobs[0];
                const excludePattern = ignoreGlobs.length > 1 ? `{${ignoreGlobs.join(',')}}` : ignoreGlobs[0];

                const stepFiles = await vscode.workspace.findFiles(globPattern, excludePattern);
                await Promise.all(stepFiles.map(file => this.updateFile(file)));

                this.state = 'ready';
                logger.info(`Gherkin PowerTools: Symbol cache initialized with ${stepFiles.length} files.`);
            } catch (err) {
                this.state = 'failed';
                logger.error('Error initializing symbol cache:', err);
            }
        })();
        
        return this.initPromise;
    }

    public async updateFile(uri: vscode.Uri): Promise<void> {
        try {
            const rawBytes = await vscode.workspace.fs.readFile(uri);
            const content = new TextDecoder('utf8').decode(rawBytes);
            const lines = content.split(/\r?\n/);
            const definitions: StepDefinition[] = [];

            for (let i = 0; i < lines.length; i++) {
                const pyLine = lines[i];
                const pyLineTrimmed = pyLine.trim();

                // Look for Behave decorators: @given('...'), @when(r"..."), etc.
                const decoratorMatch = pyLineTrimmed.match(/^@(given|when|then|step)\s*\(\s*(?:r|u|f|b)?(['"])(.*)$/i);
                if (decoratorMatch) {
                    const stepType = decoratorMatch[1].toLowerCase() as 'given'|'when'|'then'|'step';
                    const quoteChar = decoratorMatch[2];
                    let rawPattern = decoratorMatch[3];
                    let startLine = i;
                    let endLine = i;

                    // Support multiline decorators
                    if (!rawPattern.endsWith(quoteChar + ')') && !rawPattern.endsWith(quoteChar)) {
                        let foundEnd = false;
                        for (let m = i + 1; m < Math.min(i + 10, lines.length); m++) {
                            const nLine = lines[m];
                            rawPattern += '\n' + nLine;
                            if (nLine.includes(quoteChar)) {
                                foundEnd = true;
                                endLine = m;
                                break;
                            }
                        }
                        if (foundEnd) {
                            const closingIdx = rawPattern.lastIndexOf(quoteChar);
                            if (closingIdx !== -1) {
                                rawPattern = rawPattern.substring(0, closingIdx);
                            }
                        }
                    } else {
                        // It's on a single line. Trim the closing quote and paren.
                        rawPattern = rawPattern.replace(new RegExp(`${quoteChar}\\)?\\s*$`), '');
                    }

                    let matcherType: 'parse' | 'cfparse' | 're' = 'parse';
                    if (pyLineTrimmed.match(/@(given|when|then|step)\s*\(\s*re\./i) || rawPattern.includes('(?P<')) {
                        matcherType = 're';
                    } else if (rawPattern.includes('{') && rawPattern.includes('}')) {
                        matcherType = 'parse';
                    }

                    let regexPattern = rawPattern;
                    if (matcherType === 're') {
                        regexPattern = regexPattern.replace(/\(\?P<[^>]+>/g, '(');
                    } else {
                        // Escape regex characters and replace \{param\} with .*
                        regexPattern = regexPattern.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&').replace(/\\\{[^}]+\\\}/g, '.*');
                    }

                    // Prevent exponential backtracking
                    regexPattern = regexPattern.replace(/(?:\.\*)+/g, '.*');

                    const decoratorStartCol = lines[startLine].indexOf('@' + decoratorMatch[1]);
                    const decoratorEndCol = lines[endLine].length;
                    const decoratorRange = new vscode.Range(startLine, Math.max(0, decoratorStartCol), endLine, decoratorEndCol);

                    let functionName: string | undefined;
                    let functionRange: vscode.Range | undefined;
                    let documentation: string | undefined;

                    for (let j = endLine + 1; j < Math.min(endLine + 15, lines.length); j++) {
                        const aheadLine = lines[j].trim();
                        if (!functionName && aheadLine.startsWith('def ')) {
                            const defMatch = aheadLine.match(/^def\s+([a-zA-Z0-9_]+)\s*\(/);
                            if (defMatch) {
                                functionName = defMatch[1];
                                const defStartLine = j;
                                const defStartCol = lines[j].indexOf('def ');
                                
                                let currentLineIdx = j;
                                let functionSignature = aheadLine;
                                while (!functionSignature.endsWith(':') && currentLineIdx + 1 < lines.length) {
                                    currentLineIdx++;
                                    const nextLine = lines[currentLineIdx].trim();
                                    functionSignature += ' ' + nextLine;
                                }
                                
                                functionRange = new vscode.Range(
                                    defStartLine, Math.max(0, defStartCol),
                                    currentLineIdx, lines[currentLineIdx].length
                                );
                                
                                for (let k = currentLineIdx + 1; k < Math.min(currentLineIdx + 10, lines.length); k++) {
                                    const docLine = lines[k].trim();
                                    if (docLine.startsWith('"""') || docLine.startsWith("'''")) {
                                        const quote = docLine.substring(0, 3);
                                        let doc = docLine.substring(3);
                                        if (doc.endsWith(quote) && docLine.length > 3) {
                                            documentation = doc.slice(0, -3).trim();
                                            break;
                                        } else {
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
                                        break;
                                    }
                                }
                            }
                            break;
                        }
                    }

                    try {
                        const regex = new RegExp('^' + regexPattern + '$', 'i');
                        definitions.push({
                            type: stepType,
                            rawPattern,
                            matcherType,
                            regex,
                            decoratorRange,
                            functionRange,
                            functionName,
                            documentation,
                            uri
                        });
                    } catch (e) {
                        // Ignore invalid regex
                    }
                }
            }

            this.cache.set(uri.toString(), definitions);
        } catch (err) {
            logger.error(`Error updating cache for file ${uri.fsPath}:`, err);
            this.removeFile(uri);
        }
    }

    public removeFile(uri: vscode.Uri): void {
        this.cache.delete(uri.toString());
    }

    public async getStepDefinitions(stepText: string): Promise<StepDefinition[]> {
        await this.initialize();
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

    public async getStepDefinition(stepText: string): Promise<StepDefinition | null> {
        const matches = await this.getStepDefinitions(stepText);
        return matches.length > 0 ? matches[0] : null;
    }

    public async getAllStepDefinitions(): Promise<StepDefinition[]> {
        await this.initialize();
        const definitions: StepDefinition[] = [];
        for (const [_, defs] of this.cache) {
            definitions.push(...defs);
        }
        return definitions;
    }
}

export class FeatureCache {
    private fileTagCounts: Map<string, Map<string, number>> = new Map();
    private globalTagCount: Map<string, number> = new Map();
    private parserPromise?: Promise<any>;
    public state: CacheState = 'uninitialized';
    private initPromise: Promise<void> | null = null;

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

    public initialize(): Promise<void> {
        if (this.state === 'initializing' || this.state === 'ready') {
            return this.initPromise!;
        }
        
        this.state = 'initializing';
        this.initPromise = (async () => {
            try {
                const featureFiles = await vscode.workspace.findFiles('**/*.feature', '**/node_modules/**');
                for (const file of featureFiles) {
                    await this.updateFile(file);
                }
                this.state = 'ready';
                logger.info(`Gherkin PowerTools: Feature cache initialized with ${featureFiles.length} files.`);
            } catch (err) {
                this.state = 'failed';
                logger.error('Error initializing feature cache:', err);
            }
        })();
        
        return this.initPromise;
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
