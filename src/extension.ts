import * as vscode from 'vscode';
import { GherkinFormattingEditProvider } from './formatter';
import { GherkinDocumentSymbolProvider } from './outline';
import { GherkinLinter } from './linter';
import { GherkinHighlighter } from './highlighter';
import { showStatisticsDashboard } from './statistics';
import { GherkinDefinitionProvider } from './definition';
import { SymbolCache, FeatureCache } from './cache';
import { logger } from './logger';
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
export async function activate(context: vscode.ExtensionContext) {
    logger.info('Extension "vscode-gherkin-powertools" is now active.');

    const formatter = new GherkinFormattingEditProvider();
    const symbolProvider = new GherkinDocumentSymbolProvider();
    
    // Initialize Symbol Cache for definitions
    const symbolCache = new SymbolCache();
    const symbolInit = symbolCache.initialize();

    // Initialize Feature Cache for workspace-wide tag statistics
    const featureCache = new FeatureCache();
    const featureInit = featureCache.initialize();

    // Deterministic activation: wait for caches to initialize
    await Promise.all([symbolInit, featureInit]);

    const linter = new GherkinLinter(symbolCache);

    const reLintOpenFiles = () => {
        vscode.workspace.textDocuments.forEach(doc => {
            if (GHERKIN_LANGUAGES.includes(doc.languageId)) {
                linter.immediateLint(doc);
            }
        });
    };

    // Watch for changes in Python step files
    const watcher = vscode.workspace.createFileSystemWatcher('**/steps/**/*.py');
    watcher.onDidCreate(async uri => { await symbolCache.updateFile(uri); reLintOpenFiles(); });
    watcher.onDidChange(async uri => { await symbolCache.updateFile(uri); reLintOpenFiles(); });
    watcher.onDidDelete(uri => { symbolCache.removeFile(uri); reLintOpenFiles(); });
    context.subscriptions.push(watcher);
    
    // Watch for changes in feature files to update tag statistics
    const featureWatcher = vscode.workspace.createFileSystemWatcher('**/*.feature');
    featureWatcher.onDidCreate(async uri => { await featureCache.updateFile(uri); });
    featureWatcher.onDidChange(async uri => { await featureCache.updateFile(uri); });
    featureWatcher.onDidDelete(uri => { featureCache.removeFile(uri); });
    context.subscriptions.push(featureWatcher);
    
    // Register the context menu command to format the document
    context.subscriptions.push(
        vscode.commands.registerCommand('gherkinPowerTools.format', () => {
            vscode.commands.executeCommand('editor.action.formatDocument');
        })
    );

    // Register the statistics dashboard command
    context.subscriptions.push(
        vscode.commands.registerCommand('gherkinPowerTools.showStatistics', () => {
            showStatisticsDashboard(context);
        })
    );

    // Register the custom command for creating step definitions
    context.subscriptions.push(
        vscode.commands.registerCommand('gherkinPowerTools.createStepDefinition', createStepDefinition)
    );
    
    context.subscriptions.push(linter);


    const highlighter = new GherkinHighlighter();
    context.subscriptions.push(highlighter);

    // Initial lint & highlight for all open feature files
    vscode.workspace.textDocuments.forEach(doc => {
        linter.immediateLint(doc);
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
            linter.immediateLint(doc);
        })
    );

    context.subscriptions.push(
        vscode.workspace.onDidSaveTextDocument(doc => {
            linter.immediateLint(doc);
        })
    );

    // On text change
    context.subscriptions.push(
        vscode.workspace.onDidChangeTextDocument(e => {
            linter.scheduleLint(e.document);
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
                ' ', '<' // trigger on space or <
            ),
            vscode.languages.registerHoverProvider(
                { language },
                new GherkinHoverProvider(symbolCache, featureCache)
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
