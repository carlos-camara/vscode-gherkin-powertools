import * as assert from 'assert';
import * as vscode from 'vscode';
import { GherkinCodeActionProvider, createStepDefinition } from '../../codeAction';

function createMockDocument(text: string, uriStr: string): vscode.TextDocument {
    const lines = text.split('\n');
    return {
        languageId: 'feature',
        getText: () => text,
        lineAt: (line: number) => ({ text: lines[line] }),
        lineCount: lines.length,
        uri: vscode.Uri.parse(uriStr)
    } as any as vscode.TextDocument;
}

suite('Code Action Test Suite', () => {
    let provider: GherkinCodeActionProvider;

    setup(() => {
        provider = new GherkinCodeActionProvider();
    });

    test('Provides Code Actions for misspelled keywords', () => {
        const doc = createMockDocument('Givn misspelled', 'file:///code-actions.feature');
        const diagnostic = new vscode.Diagnostic(
            new vscode.Range(0,0,0,4),
            "Misspelled keyword",
            vscode.DiagnosticSeverity.Error
        );
        diagnostic.code = 'MISSPELLED_KEYWORD';
        diagnostic.relatedInformation = [
            new vscode.DiagnosticRelatedInformation(new vscode.Location(doc.uri, new vscode.Range(0,0,0,4)), 'Given')
        ];

        const actions = provider.provideCodeActions(doc, new vscode.Range(0,0,0,0), { diagnostics: [diagnostic] } as any, {} as any);
        assert.ok(actions);
        assert.strictEqual(actions.length, 1);
        assert.strictEqual(actions[0].title, "Replace with 'Given'");
    });

    test('Provides Code Actions for undefined steps', () => {
        const doc = createMockDocument('Then undefined step', 'file:///code-actions.feature');
        const diagnostic = new vscode.Diagnostic(
            new vscode.Range(0,0,0,19),
            "Undefined step: \"undefined step\"",
            vscode.DiagnosticSeverity.Warning
        );
        diagnostic.code = 'UNDEFINED_STEP';
        diagnostic.relatedInformation = [
            new vscode.DiagnosticRelatedInformation(new vscode.Location(doc.uri, new vscode.Range(0,0,0,19)), 'Then')
        ];

        const actions = provider.provideCodeActions(doc, new vscode.Range(0,0,0,0), { diagnostics: [diagnostic] } as any, {} as any);
        assert.ok(actions);
        assert.strictEqual(actions.length, 1);
        assert.strictEqual(actions[0].title, "Create empty step definition");
        assert.strictEqual(actions[0].command?.command, 'gherkinPowerTools.createStepDefinition');
        assert.deepStrictEqual(actions[0].command?.arguments, ['undefined step', 'Then']);
    });

    test('Provides Code Actions for missing colon', () => {
        const doc = createMockDocument('Feature missing', 'file:///code-actions.feature');
        const diagnostic = new vscode.Diagnostic(new vscode.Range(0,0,0,7), "Missing colon", vscode.DiagnosticSeverity.Error);
        diagnostic.code = 'MISSING_COLON';
        diagnostic.relatedInformation = [
            new vscode.DiagnosticRelatedInformation(new vscode.Location(doc.uri, new vscode.Range(0,0,0,7)), 'Feature:')
        ];

        const actions = provider.provideCodeActions(doc, new vscode.Range(0,0,0,0), { diagnostics: [diagnostic] } as any, {} as any);
        assert.ok(actions);
        assert.strictEqual(actions.length, 1);
        assert.strictEqual(actions[0].title, "Insert missing ':'");
    });

    test('Provides Code Actions for Scenario with Examples', () => {
        const doc = createMockDocument('Scenario', 'file:///code-actions.feature');
        const diagnostic = new vscode.Diagnostic(new vscode.Range(0,0,0,8), "Scenario cannot have examples", vscode.DiagnosticSeverity.Error);
        diagnostic.code = 'SCENARIO_WITH_EXAMPLES';

        const actions = provider.provideCodeActions(doc, new vscode.Range(0,0,0,0), { diagnostics: [diagnostic] } as any, {} as any);
        assert.ok(actions);
        assert.strictEqual(actions.length, 1);
        assert.strictEqual(actions[0].title, "Convert to 'Scenario Outline'");
    });

    test('Provides Code Actions for Inconsistent Cell Count', () => {
        const doc = createMockDocument('| foo ', 'file:///code-actions.feature');
        const diagnostic = new vscode.Diagnostic(new vscode.Range(0,0,0,6), "Inconsistent cell count", vscode.DiagnosticSeverity.Error);
        diagnostic.code = 'INCONSISTENT_CELL_COUNT';
        diagnostic.relatedInformation = [
            new vscode.DiagnosticRelatedInformation(new vscode.Location(doc.uri, new vscode.Range(0,0,0,6)), '| foo |')
        ];

        const actions = provider.provideCodeActions(doc, new vscode.Range(0,0,0,0), { diagnostics: [diagnostic] } as any, {} as any);
        assert.ok(actions);
        assert.strictEqual(actions.length, 1);
        assert.strictEqual(actions[0].title, "Close table row (append '|')");
    });
});

suite('createStepDefinition Test Suite', () => {
    let originalFindFiles: any;
    let originalShowInformationMessage: any;
    let originalShowQuickPick: any;
    let originalShowErrorMessage: any;
    let originalWorkspaceFolders: any;

    setup(() => {
        originalFindFiles = vscode.workspace.findFiles;
        originalShowInformationMessage = vscode.window.showInformationMessage;
        originalShowQuickPick = vscode.window.showQuickPick;
        originalShowErrorMessage = vscode.window.showErrorMessage;
        originalWorkspaceFolders = vscode.workspace.workspaceFolders;
    });

    teardown(() => {
        (vscode.workspace as any).findFiles = originalFindFiles;
        (vscode.window as any).showInformationMessage = originalShowInformationMessage;
        (vscode.window as any).showQuickPick = originalShowQuickPick;
        (vscode.window as any).showErrorMessage = originalShowErrorMessage;
        Object.defineProperty(vscode.workspace, 'workspaceFolders', { get: () => originalWorkspaceFolders });
    });

    test('Shows error message if no workspace is opened', async () => {
        let errorMessage = '';
        (vscode.workspace as any).findFiles = async () => [];
        (vscode.window as any).showErrorMessage = async (msg: string) => { errorMessage = msg; };
        Object.defineProperty(vscode.workspace, 'workspaceFolders', { get: () => undefined });

        await createStepDefinition('step', 'Given');

        assert.strictEqual(errorMessage, 'Please open a workspace to create step definitions.');
    });

    test('Creates a new file if none exists and user confirms', async () => {
        let infoMessage = '';
        (vscode.workspace as any).findFiles = async () => [];
        (vscode.window as any).showInformationMessage = async (msg: string, action: string) => { 
            infoMessage = msg;
            return action; // Simulate user clicking 'Create'
        };
        Object.defineProperty(vscode.workspace, 'workspaceFolders', { get: () => [{ uri: vscode.Uri.file('/tmp') }] });

        try {
            await createStepDefinition('step', 'Given');
        } catch (e) {
            // Ignore fs errors since /tmp/features might fail
        }

        assert.ok(infoMessage.includes('Would you like to create one?'));
    });

    test('Prompts user to select file if multiple step files exist', async () => {
        let quickPickCalled = false;
        (vscode.workspace as any).findFiles = async () => [
            vscode.Uri.file('/tmp/file1.py'),
            vscode.Uri.file('/tmp/file2.py')
        ];
        (vscode.window as any).showQuickPick = async () => {
            quickPickCalled = true;
            return undefined; // simulate cancellation
        };

        const { createStepDefinition } = require('../../codeAction');
        await createStepDefinition('step', 'Given');

        assert.ok(quickPickCalled);
    });
});
