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

    public async provideHover(
        document: vscode.TextDocument,
        position: vscode.Position,
        _token: vscode.CancellationToken
    ): Promise<vscode.Hover | undefined> {

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


        const stepText = match[2].trim();
        const semanticType = dialectService.resolveAndBut(document, position.line);

        const stepDef: StepDefinition | null = await this.symbolCache.getStepDefinition(stepText, semanticType);

        if (!stepDef) {
            return undefined; // No underlying implementation found
        }

        // Construct Hover Markdown
        const hoverContent = new vscode.MarkdownString();
        
        // Add the python function signature
        if (stepDef.functionName) {
            if (stepDef.functionRange) {
                // If we want we could read the actual line, but we can just show a nice format
            }
        }
        
        // Show matcher type and pattern
        hoverContent.appendMarkdown(`**Type:** \`${stepDef.matcherType}\`\n\n`);
        
        if (stepDef.rawPattern) {
            const quote = stepDef.rawPattern.includes('\n') ? '"""' : "'";
            hoverContent.appendCodeblock(`@${stepDef.type}(${quote}${stepDef.rawPattern}${quote})\ndef ${stepDef.functionName || 'step_impl'}(context, ...):`, 'python');
        }

        // Add the docstring if it exists
        if (stepDef.documentation) {
            hoverContent.appendMarkdown(`\n---\n\n${stepDef.documentation}`);
        }

        return new vscode.Hover(hoverContent);
    }
}
