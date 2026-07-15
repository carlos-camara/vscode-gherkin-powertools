import * as vscode from 'vscode';
import { SymbolCache } from './cache';
import { dialectService } from './dialect';
import type { Dialect } from '@cucumber/gherkin';

export class GherkinCompletionProvider implements vscode.CompletionItemProvider {
    private symbolCache: SymbolCache;

    constructor(symbolCache: SymbolCache) {
        this.symbolCache = symbolCache;
    }

    public provideCompletionItems(
        document: vscode.TextDocument,
        position: vscode.Position,
        _token: vscode.CancellationToken,
        _context: vscode.CompletionContext
    ): vscode.ProviderResult<vscode.CompletionItem[] | vscode.CompletionList> {
        
        const linePrefix = document.lineAt(position).text.substr(0, position.character);
        const dialect = dialectService.getDialect(document);
        
        // Check if we are inside a parameter typing state: e.g. "Given I do <fo"
        const paramMatch = linePrefix.match(/<([^>]*)$/);
        
        if (paramMatch) {
            const typedParamText = paramMatch[1];
            const headers = this.getOutlineHeaders(document, position.line, dialect);
            
            if (headers.length > 0) {
                const replaceRange = new vscode.Range(
                    position.line,
                    position.character - typedParamText.length,
                    position.line,
                    position.character
                );

                const items = headers.map(header => {
                    const item = new vscode.CompletionItem(header, vscode.CompletionItemKind.Variable);
                    // Add the closing bracket. The SnippetString allows putting the cursor after it.
                    item.insertText = new vscode.SnippetString(`${header}>$0`);
                    item.range = replaceRange;
                    item.detail = 'Examples Table Column';
                    item.sortText = '0_' + header; // Force to the top of the completion list
                    return item;
                });
                return items;
            }
        }
        
        // Ensure we only autocomplete when a valid step keyword is present
        const stepKeywords = dialectService.getStepKeywords(dialect);
        if (!stepKeywords.includes('* ')) stepKeywords.push('* ');
        stepKeywords.sort((a, b) => b.length - a.length);
        const escapedSteps = stepKeywords.map(k => k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
        const stepRegex = new RegExp(`^(\\s*(?:${escapedSteps.join('|')}))`);
        
        const match = linePrefix.match(stepRegex);
        if (!match) {
            return undefined;
        }

        const keywordPrefix = match[1];

        // Range to replace (everything after the keyword up to the cursor)
        const replaceRange = new vscode.Range(
            position.line,
            keywordPrefix.length,
            position.line,
            position.character
        );

        const patterns = this.symbolCache.getAllStepPatterns();
        const completionItems: vscode.CompletionItem[] = [];

        for (const pattern of patterns) {
            const item = new vscode.CompletionItem(pattern, vscode.CompletionItemKind.Snippet);
            
            // Convert Behave parameters {param} and regex (?P<param>.*) to Snippets ${1:param}
            let snippetString = pattern;
            let counter = 1;

            // Replace {param} -> ${1:param}
            snippetString = snippetString.replace(/\{([^}]+)\}/g, (_match, paramName) => {
                return `\${${counter++}:${paramName}}`;
            });

            // Replace (?P<param>.*) -> ${1:param}
            snippetString = snippetString.replace(/\(\?P<([^>]+)>.*?\)/g, (_match, paramName) => {
                return `\${${counter++}:${paramName}}`;
            });

            item.insertText = new vscode.SnippetString(snippetString);
            item.detail = 'Python Step Definition';
            
            // Set the range to replace the entire typed text after the keyword
            item.range = replaceRange;
            
            // Allow VS Code to filter by matching what the user typed against the full pattern
            item.filterText = pattern;
            
            // Add a sort text to put them alphabetically
            item.sortText = pattern;
            
            completionItems.push(item);
        }

        return completionItems;
    }

    private getOutlineHeaders(document: vscode.TextDocument, currentLine: number, dialect: Dialect): string[] {
        const outlineKeywords = dialect.scenarioOutline.map(k => k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|');
        const scenarioKeywords = dialect.scenario.map(k => k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|');
        const rootKeywords = [...dialect.feature, ...dialect.rule, ...dialect.background]
            .map(k => k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|');
        const examplesKeywords = dialect.examples.map(k => k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|');
        
        const outlineRegex = new RegExp(`^\\s*(?:${outlineKeywords})\\s*:`);
        const scenarioRegex = new RegExp(`^\\s*(?:${scenarioKeywords})\\s*:`);
        const rootRegex = new RegExp(`^\\s*(?:${rootKeywords})\\s*:`);
        const examplesRegex = new RegExp(`^\\s*(?:${examplesKeywords})\\s*:`);
        const blockRegex = dialectService.getStructureRegex(dialect);

        let outlineStartLine = -1;
        for (let i = currentLine; i >= 0; i--) {
            const line = document.lineAt(i).text.trim();
            if (outlineRegex.test(line)) {
                outlineStartLine = i;
                break;
            }
            if (scenarioRegex.test(line)) {
                return []; // Not in an outline
            }
            if (rootRegex.test(line)) {
                return []; // Hit the top boundaries
            }
        }

        if (outlineStartLine === -1) return [];

        let inExamples = false;
        for (let i = outlineStartLine + 1; i < document.lineCount; i++) {
            const line = document.lineAt(i).text.trim();
            if (examplesRegex.test(line)) {
                inExamples = true;
                continue;
            }
            if (inExamples && line.startsWith('|')) {
                // Return the cells of the first table row
                return line.split('|')
                    .filter(c => c.trim() !== '')
                    .map(c => c.trim());
            }
            if (blockRegex.test(line)) {
                break; // hit the next block
            }
        }
        return [];
    }
}
