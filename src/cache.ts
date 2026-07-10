import * as vscode from 'vscode';
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
            console.log(`Gherkin Beautifier: Symbol cache initialized with ${stepFiles.length} files.`);
        } catch (err) {
            console.error('Error initializing symbol cache:', err);
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
                            if (functionSignature.endsWith(':')) {
                                functionSignature = functionSignature.slice(0, -1);
                            }
                            
                            // Now look for docstring directly after def
                            for (let k = j + 1; k < Math.min(j + 10, lines.length); k++) {
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
            console.error(`Error updating cache for file ${uri.fsPath}:`, err);
            this.removeFile(uri); // Remove if file cannot be read
        }
    }

    public removeFile(uri: vscode.Uri): void {
        this.cache.delete(uri.toString());
    }

    public getStepDefinition(stepText: string): StepDefinition | null {
        for (const [_, definitions] of this.cache) {
            for (const def of definitions) {
                if (def.regex.test(stepText)) {
                    return def;
                }
            }
        }
        return null;
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
