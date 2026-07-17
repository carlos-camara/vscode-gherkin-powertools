import * as assert from 'assert';
import * as vscode from 'vscode';
import { GherkinCodeActionProvider, createStepDefinition, serializeToPythonString, generateStepFunctionName } from '../../codeAction';
import { discoveryService } from '../../discovery';

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

suite('Code Action Helper Functions Test Suite', () => {
    test('serializeToPythonString safely handles edge cases', () => {
        assert.strictEqual(serializeToPythonString("I'm logged in"), "u'I\\'m logged in'");
        assert.strictEqual(serializeToPythonString("the path is C:\\temp"), "u'the path is C:\\\\temp'");
        assert.strictEqual(serializeToPythonString('the value is "quoted"'), "u'the value is \"quoted\"'");
        assert.strictEqual(serializeToPythonString("café is available"), "u'café is available'");
        assert.strictEqual(serializeToPythonString("line one\nline two"), "u'line one\\nline two'");
        assert.strictEqual(serializeToPythonString("emoji 😀"), "u'emoji 😀'");
        assert.strictEqual(serializeToPythonString("tabs\tand\x00control"), "u'tabs\\tand\\x00control'");
    });

    test('generateStepFunctionName generates valid deterministic python identifiers', () => {
        assert.strictEqual(generateStepFunctionName("I'm logged in"), "i_m_logged_in");
        assert.strictEqual(generateStepFunctionName("the path is C:\\temp"), "the_path_is_c_temp");
        assert.strictEqual(generateStepFunctionName('the value is "quoted"'), "the_value_is_quoted");
        assert.strictEqual(generateStepFunctionName("café is available"), "caf_is_available");
        assert.strictEqual(generateStepFunctionName("123 starts with number"), "step_123_starts_with_number");
        assert.strictEqual(generateStepFunctionName("emoji 😀 test"), "emoji_test");
        assert.strictEqual(generateStepFunctionName("___lots_of__underscores___"), "lots_of_underscores");
        assert.strictEqual(generateStepFunctionName(""), "step_impl");
    });
});

suite('Code Action Provider Test Suite', () => {
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
        assert.deepStrictEqual(actions[0].command?.arguments, ['undefined step', 'then', doc.uri]);
    });

    test('Resolves previous keyword for And/But steps', () => {
        const doc = createMockDocument('Given some setup\nAnd undefined step', 'file:///code-actions.feature');
        const diagnostic = new vscode.Diagnostic(
            new vscode.Range(1,0,1,18),
            "Undefined step: \"undefined step\"",
            vscode.DiagnosticSeverity.Warning
        );
        diagnostic.code = 'UNDEFINED_STEP';
        diagnostic.relatedInformation = [
            new vscode.DiagnosticRelatedInformation(new vscode.Location(doc.uri, new vscode.Range(1,0,1,18)), 'And')
        ];

        const actions = provider.provideCodeActions(doc, new vscode.Range(1,0,1,0), { diagnostics: [diagnostic] } as any, {} as any);
        assert.ok(actions);
        assert.strictEqual(actions.length, 1);
        // It should resolve 'And' to 'given' because line 0 starts with 'Given'
        assert.deepStrictEqual(actions[0].command?.arguments, ['undefined step', 'given', doc.uri]);
    });
});

suite('createStepDefinition Test Suite', () => {
    let originalFindFiles: any;
    let originalShowInformationMessage: any;
    let originalShowQuickPick: any;
    let originalShowErrorMessage: any;
    let originalWorkspaceFolders: any;
    let originalFs: any;
    let originalApplyEdit: any;
    let originalShowTextDocument: any;
    let originalOpenTextDocument: any;

    let originalGetStepFiles: any;
    let originalGetBestWorkspaceFolder: any;

    setup(() => {
        originalGetStepFiles = discoveryService.getStepFiles.bind(discoveryService);
        originalGetBestWorkspaceFolder = discoveryService.getBestWorkspaceFolder.bind(discoveryService);
        originalShowInformationMessage = vscode.window.showInformationMessage;
        originalShowQuickPick = vscode.window.showQuickPick;
        originalShowErrorMessage = vscode.window.showErrorMessage;
        originalWorkspaceFolders = vscode.workspace.workspaceFolders;
        originalFs = vscode.workspace.fs;
        originalApplyEdit = vscode.workspace.applyEdit;
        originalShowTextDocument = vscode.window.showTextDocument;
        originalOpenTextDocument = vscode.workspace.openTextDocument;
    });

    teardown(() => {
        discoveryService.getStepFiles = originalGetStepFiles;
        discoveryService.getBestWorkspaceFolder = originalGetBestWorkspaceFolder;
        (vscode.window as any).showInformationMessage = originalShowInformationMessage;
        (vscode.window as any).showQuickPick = originalShowQuickPick;
        (vscode.window as any).showErrorMessage = originalShowErrorMessage;
        Object.defineProperty(vscode.workspace, 'workspaceFolders', { get: () => originalWorkspaceFolders });
        Object.defineProperty(vscode.workspace, 'fs', { get: () => originalFs });
        (vscode.workspace as any).applyEdit = originalApplyEdit;
        (vscode.window as any).showTextDocument = originalShowTextDocument;
        (vscode.workspace as any).openTextDocument = originalOpenTextDocument;
    });

    test('Shows error message if no workspace is opened', async () => {
        let errorMessage = '';
        discoveryService.getStepFiles = async () => [];
        (vscode.window as any).showErrorMessage = async (msg: string) => { errorMessage = msg; };
        discoveryService.getBestWorkspaceFolder = () => undefined;

        await createStepDefinition('step', 'Given');

        assert.strictEqual(errorMessage, 'Please open a workspace to create step definitions.');
    });

    test('Creates a new file if none exists and user confirms', async () => {
        let infoMessage = '';
        let directoryCreated = false;
        let editApplied = false;

        discoveryService.getStepFiles = async () => [];
        (vscode.window as any).showInformationMessage = async (msg: string, action: string) => { 
            infoMessage = msg;
            return action;
        };
        discoveryService.getBestWorkspaceFolder = () => ({ uri: vscode.Uri.file('/tmp'), name: 'tmp', index: 0 });
        
        Object.defineProperty(vscode.workspace, 'fs', { get: () => ({
            createDirectory: async () => { directoryCreated = true; },
            readFile: async () => { throw new Error('Not found'); }
        })});

        (vscode.workspace as any).applyEdit = async () => { editApplied = true; return true; };
        (vscode.workspace as any).openTextDocument = async () => createMockDocument('', 'file:///tmp/features/steps/step_definitions.py');
        (vscode.window as any).showTextDocument = async () => ({ 
            document: { lineCount: 1, lineAt: () => ({text: ''}) },
            revealRange: () => {} 
        } as any);

        await createStepDefinition('I test new file', 'Given');

        assert.ok(infoMessage.includes('Would you like to create one?'));
        assert.ok(directoryCreated, "Should have created directory");
        assert.ok(editApplied, "Should have applied workspace edit without saving");
    });

    test('Appends without collision to an existing file', async () => {
        let editApplied = false;

        discoveryService.getStepFiles = async () => [vscode.Uri.file('/tmp/file1.py')];
        
        Object.defineProperty(vscode.workspace, 'fs', { get: () => ({
            readFile: async () => Buffer.from("def i_test_collision(context):\n    pass\n")
        })});

        let insertedText = '';
        (vscode.workspace as any).applyEdit = async (edit: vscode.WorkspaceEdit) => { 
            editApplied = true; 
            insertedText = edit.entries()[0][1][0].newText;
            return true; 
        };
        (vscode.workspace as any).openTextDocument = async () => createMockDocument('', 'file:///tmp/file1.py');
        (vscode.window as any).showTextDocument = async () => ({ 
            document: { lineCount: 1, lineAt: () => ({text: ''}) },
            revealRange: () => {} 
        } as any);

        await createStepDefinition('I test collision', 'Given');

        assert.ok(editApplied);
        // Because i_test_collision exists, it should generate i_test_collision_1
        assert.ok(insertedText.includes('def i_test_collision_1(context):'));
    });
});

