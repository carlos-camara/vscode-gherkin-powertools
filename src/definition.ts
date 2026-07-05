import * as vscode from 'vscode';
import { SymbolCache } from './cache';

export class GherkinDefinitionProvider implements vscode.DefinitionProvider {
    private cache: SymbolCache;

    constructor(cache: SymbolCache) {
        this.cache = cache;
    }

    public async provideDefinition(
        document: vscode.TextDocument,
        position: vscode.Position,
        token: vscode.CancellationToken
    ): Promise<vscode.Location | null> {

        const lineText = document.lineAt(position.line).text.trim();
        
        // Extract the step text by removing the keyword (Given, When, Then, And, But, *)
        const match = lineText.match(/^(?:Given|When|Then|And|But|\*|Dado|Cuando|Entonces|Y|Pero|Soit|Quand|Alors|Et|Mais|Angenommen|Wenn|Dann|Und|Aber)\s+(.*)/i);
        
        if (!match) {
            return null; // Not a valid step
        }

        const stepText = match[1].trim();

        if (token.isCancellationRequested) {
            return null;
        }

        // Query the in-memory Symbol Cache instantly
        return this.cache.findDefinition(stepText);
    }
}
