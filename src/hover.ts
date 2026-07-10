import * as vscode from 'vscode';
import { SymbolCache, StepDefinition } from './cache';

export class GherkinHoverProvider implements vscode.HoverProvider {
    private symbolCache: SymbolCache;

    constructor(symbolCache: SymbolCache) {
        this.symbolCache = symbolCache;
    }

    public provideHover(
        document: vscode.TextDocument,
        position: vscode.Position,
        token: vscode.CancellationToken
    ): vscode.ProviderResult<vscode.Hover> {

        const lineText = document.lineAt(position.line).text;
        const match = lineText.match(/^\s*(Given|When|Then|And|But)\s+(.*)$/);

        if (!match) {
            return undefined;
        }

        const stepKeyword = match[1];
        const stepText = match[2].trim();

        // Ensure we are actually hovering over the text of the step, not just empty space
        // Let's just allow it for the whole line for simplicity
        
        const stepDef: StepDefinition | null = this.symbolCache.getStepDefinition(stepText);

        if (!stepDef) {
            return undefined; // No underlying implementation found
        }

        // Construct Hover Markdown
        const hoverContent = new vscode.MarkdownString();
        
        // Add the python function signature
        if (stepDef.functionSignature) {
            hoverContent.appendCodeblock(stepDef.functionSignature, 'python');
        } else {
            // Fallback if we couldn't parse the signature
            hoverContent.appendCodeblock(`@${stepKeyword.toLowerCase()}('${stepDef.patternText}')\ndef step_impl(context, ...):`, 'python');
        }

        // Add the docstring if it exists
        if (stepDef.documentation) {
            hoverContent.appendMarkdown(`\n---\n\n${stepDef.documentation}`);
        }

        return new vscode.Hover(hoverContent);
    }
}
