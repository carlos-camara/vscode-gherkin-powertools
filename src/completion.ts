import * as vscode from 'vscode';
import { SymbolCache } from './cache';

export class GherkinCompletionProvider implements vscode.CompletionItemProvider {
    private symbolCache: SymbolCache;

    constructor(symbolCache: SymbolCache) {
        this.symbolCache = symbolCache;
    }

    public provideCompletionItems(
        document: vscode.TextDocument,
        position: vscode.Position,
        token: vscode.CancellationToken,
        context: vscode.CompletionContext
    ): vscode.ProviderResult<vscode.CompletionItem[] | vscode.CompletionList> {
        
        const linePrefix = document.lineAt(position).text.substr(0, position.character);
        const trimmedPrefix = linePrefix.trim();
        
        // Ensure we only autocomplete when a valid step keyword is present
        const match = linePrefix.match(/^(\s*(?:Given|When|Then|And|But)\s+)/);
        if (!match) {
            return undefined;
        }

        const keywordPrefix = match[1];
        const typedText = linePrefix.substring(keywordPrefix.length);

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
            snippetString = snippetString.replace(/\{([^}]+)\}/g, (match, paramName) => {
                return `\${${counter++}:${paramName}}`;
            });

            // Replace (?P<param>.*) -> ${1:param}
            snippetString = snippetString.replace(/\(\?P<([^>]+)>.*?\)/g, (match, paramName) => {
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
}
