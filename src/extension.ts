import * as vscode from 'vscode';
import { GherkinFormattingEditProvider } from './formatter';
import { GherkinDocumentSymbolProvider } from './outline';
import { GherkinLinter } from './linter';
import { GherkinHighlighter } from './highlighter';
import { showStatisticsDashboard } from './statistics';
import { GherkinDefinitionProvider } from './definition';
import { SymbolCache } from './cache';
import { GherkinCodeActionProvider, createStepDefinition } from './codeAction';
import { GherkinCompletionProvider } from './completion';
import { GherkinHoverProvider } from './hover';

const GHERKIN_LANGUAGES = ['feature', 'gherkin'];

/**
 * Activates the Gherkin PowerTools extension.
 * This method is called when the extension is activated by VS Code.
 * 
 * @param context The extension context provided by VS Code.
 */
export function activate(context: vscode.ExtensionContext) {
    console.log('Extension "vscode-gherkin-powertools" is now active.');

    const formatter = new GherkinFormattingEditProvider();
    const symbolProvider = new GherkinDocumentSymbolProvider();
    
    // Initialize Symbol Cache for definitions
    const symbolCache = new SymbolCache();
    symbolCache.initialize();

    const linter = new GherkinLinter(symbolCache);

    const reLintOpenFiles = () => {
        vscode.workspace.textDocuments.forEach(doc => {
            if (GHERKIN_LANGUAGES.includes(doc.languageId)) {
                linter.lint(doc);
            }
        });
    };

    // Watch for changes in Python step files
    const watcher = vscode.workspace.createFileSystemWatcher('**/steps/**/*.py');
    watcher.onDidCreate(uri => { symbolCache.updateFile(uri); reLintOpenFiles(); });
    watcher.onDidChange(uri => { symbolCache.updateFile(uri); reLintOpenFiles(); });
    watcher.onDidDelete(uri => { symbolCache.removeFile(uri); reLintOpenFiles(); });
    context.subscriptions.push(watcher);
    
    // Register the context menu command to format the document
    context.subscriptions.push(
        vscode.commands.registerCommand('gherkinBeautifier.format', () => {
            vscode.commands.executeCommand('editor.action.formatDocument');
        })
    );

    // Register the statistics dashboard command
    context.subscriptions.push(
        vscode.commands.registerCommand('gherkinBeautifier.showStatistics', () => {
            showStatisticsDashboard(context);
        })
    );

    // Register the custom command for creating step definitions
    context.subscriptions.push(
        vscode.commands.registerCommand('gherkinBeautifier.createStepDefinition', createStepDefinition)
    );
    
    context.subscriptions.push(linter);


    const highlighter = new GherkinHighlighter();
    context.subscriptions.push(highlighter);

    // Initial lint & highlight for all open feature files
    vscode.workspace.textDocuments.forEach(doc => {
        linter.lint(doc);
    });
    if (vscode.window.activeTextEditor) {
        highlighter.highlight(vscode.window.activeTextEditor);
    }

    // On file open or active editor change
    context.subscriptions.push(
        vscode.window.onDidChangeActiveTextEditor(editor => {
            if (editor) {
                highlighter.highlight(editor);
            }
        })
    );

    context.subscriptions.push(
        vscode.workspace.onDidOpenTextDocument(doc => {
            linter.lint(doc);
        })
    );

    // On text change
    context.subscriptions.push(
        vscode.workspace.onDidChangeTextDocument(e => {
            linter.lint(e.document);
            if (vscode.window.activeTextEditor && e.document === vscode.window.activeTextEditor.document) {
                highlighter.highlight(vscode.window.activeTextEditor);
            }
        })
    );

    // Clear on close
    context.subscriptions.push(
        vscode.workspace.onDidCloseTextDocument(doc => linter.clear(doc))
    );

    // Register the formatter for both full documents and selections/ranges
    // We register for both 'feature' and 'gherkin' language identifiers to ensure maximum compatibility
    GHERKIN_LANGUAGES.forEach(language => {
        context.subscriptions.push(
            vscode.languages.registerDocumentFormattingEditProvider(
                { language }, 
                formatter
            ),
            vscode.languages.registerDocumentRangeFormattingEditProvider(
                { language }, 
                formatter
            ),
            vscode.languages.registerDocumentSymbolProvider(
                { language },
                symbolProvider
            ),
            vscode.languages.registerDefinitionProvider(
                { language },
                new GherkinDefinitionProvider(symbolCache)
            ),
            vscode.languages.registerCompletionItemProvider(
                { language },
                new GherkinCompletionProvider(symbolCache),
                ' ' // trigger on space
            ),
            vscode.languages.registerHoverProvider(
                { language },
                new GherkinHoverProvider(symbolCache)
            ),
            vscode.languages.registerCodeActionsProvider(
                { language },
                new GherkinCodeActionProvider(),
                {
                    providedCodeActionKinds: GherkinCodeActionProvider.providedCodeActionKinds
                }
            )
        );
    });
}

/**
 * Deactivates the Gherkin PowerTools extension.
 * This method is called when the extension is deactivated.
 */
export function deactivate() {
    // Currently no specific cleanup is required beyond what is handled by context.subscriptions
}
