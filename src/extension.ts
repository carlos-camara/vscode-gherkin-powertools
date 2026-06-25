import * as vscode from 'vscode';
import { GherkinFormattingEditProvider } from './formatter';

export function activate(context: vscode.ExtensionContext) {
    console.log('Extension "vscode-gherkin-beautifier" is now active.');

    const formatter = new GherkinFormattingEditProvider();
    
    // Register for 'feature' language (Full Document)
    const disposable = vscode.languages.registerDocumentFormattingEditProvider(
        { language: 'feature' },
        formatter
    );
    
    // Register for 'feature' language (Range / Selection)
    const disposableRange = vscode.languages.registerDocumentRangeFormattingEditProvider(
        { language: 'feature' },
        formatter
    );

    // Also register for 'gherkin' just in case some extensions use it
    const disposable2 = vscode.languages.registerDocumentFormattingEditProvider(
        { language: 'gherkin' },
        formatter
    );
    
    const disposableRange2 = vscode.languages.registerDocumentRangeFormattingEditProvider(
        { language: 'gherkin' },
        formatter
    );

    context.subscriptions.push(disposable, disposableRange, disposable2, disposableRange2);
}

export function deactivate() {}
