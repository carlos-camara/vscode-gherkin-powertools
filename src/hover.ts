import * as vscode from 'vscode';
import { SymbolCache, FeatureCache, StepDefinition } from './cache';
import { dialectService } from './dialect';

export class GherkinHoverProvider implements vscode.HoverProvider {
    private symbolCache: SymbolCache;
    private featureCache: FeatureCache;

    constructor(symbolCache: SymbolCache, featureCache: FeatureCache) {
        this.symbolCache = symbolCache;
        this.featureCache = featureCache;
    }

    public provideHover(
        document: vscode.TextDocument,
        position: vscode.Position,
        _token: vscode.CancellationToken
    ): vscode.ProviderResult<vscode.Hover> {

        // First, check if the user is hovering over a tag
        const tagRange = document.getWordRangeAtPosition(position, /@[^\s@]+/);
        if (tagRange) {
            const tagName = document.getText(tagRange);
            const blastRadius = this.featureCache.getTagBlastRadius(tagName);
            
            const hoverContent = new vscode.MarkdownString();
            hoverContent.appendMarkdown(`🏷️ **${tagName}**\n\nApplies to **${blastRadius}** scenarios across the workspace.`);
            return new vscode.Hover(hoverContent);
        }

        // Otherwise, check if hovering over a step
        const lineText = document.lineAt(position.line).text;
        const dialect = dialectService.getDialect(document);
        const match = lineText.match(dialectService.getStepRegex(dialect));

        if (!match) {
            return undefined;
        }

        const stepKeyword = match[1].trim();
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
            // Ensure the signature ends with a colon for correct python syntax rendering
            const sig = stepDef.functionSignature.endsWith(':') ? stepDef.functionSignature : stepDef.functionSignature + ':';
            hoverContent.appendCodeblock(sig, 'python');
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
