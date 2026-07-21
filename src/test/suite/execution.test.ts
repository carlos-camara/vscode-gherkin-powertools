import * as assert from 'assert';
import * as vscode from 'vscode';
import { buildBehaveCommand, runBehave, runBehaveWithPrompt, parseArgsStringToVector, debugBehave, clearMemoryArgs } from '../../execution';
import { ConfigurationService } from '../../configuration';

suite('Execution Test Suite', () => {
    let originalCreateTerminal: any;
    let originalShowInputBox: any;
    let originalTerminals: any;
    let mockTerminal: any;
    let sendTextCalledWith: string | undefined;
    let showCalled: boolean;
    let originalGetExtension: any;
    let originalStartDebugging: any;
    let originalAsRelativePath: any;
    let originalWorkspaceFolder: any;
    let getExtensionMock: (name: string) => any;
    let startDebuggingCalledWith: any;

    const mockConfigService = {
        getConfiguration: () => ({
            behave: {
                command: 'behave',
                additionalArguments: ['--no-capture']
            }
        })
    } as unknown as ConfigurationService;

    setup(() => {
        sendTextCalledWith = undefined;
        showCalled = false;
        
        mockTerminal = {
            show: (_preserveFocus?: boolean) => { showCalled = true; },
            sendText: (text: string) => { sendTextCalledWith = text; }
        };

        originalCreateTerminal = vscode.window.createTerminal;
        originalShowInputBox = vscode.window.showInputBox;
        
        const descriptor = Object.getOwnPropertyDescriptor(vscode.window, 'terminals');
        originalTerminals = descriptor ? descriptor.get : undefined;

        let lastCreatedTerminal: any = null;
        (vscode.window as any).createTerminal = () => {
            lastCreatedTerminal = mockTerminal;
            return mockTerminal;
        };
        // Always make window.terminals return the last created terminal so `includes` check passes
        Object.defineProperty(vscode.window, 'terminals', { get: () => lastCreatedTerminal ? [lastCreatedTerminal] : [], configurable: true });

        originalGetExtension = vscode.extensions.getExtension;
        originalStartDebugging = vscode.debug.startDebugging;
        originalWorkspaceFolder = vscode.workspace.getWorkspaceFolder;
        originalAsRelativePath = vscode.workspace.asRelativePath;
        
        getExtensionMock = (name: string) => {
            if (name === 'ms-python.python') { return { id: name }; }
            return undefined;
        };
        (vscode.extensions as any).getExtension = (name: string) => getExtensionMock(name);
        
        startDebuggingCalledWith = undefined;
        (vscode.debug as any).startDebugging = async (folder: any, config: any) => {
            startDebuggingCalledWith = { folder, config };
            return true;
        };
        (vscode.workspace as any).getWorkspaceFolder = () => undefined; // Default: no workspace
        (vscode.workspace as any).asRelativePath = () => 'features/test.feature';
    });

    teardown(() => {
        (vscode.window as any).createTerminal = originalCreateTerminal;
        (vscode.window as any).showInputBox = originalShowInputBox;
        if (originalTerminals) {
            Object.defineProperty(vscode.window, 'terminals', { get: originalTerminals });
        }
        (vscode.extensions as any).getExtension = originalGetExtension;
        (vscode.debug as any).startDebugging = originalStartDebugging;
        (vscode.workspace as any).getWorkspaceFolder = originalWorkspaceFolder;
        (vscode.workspace as any).asRelativePath = originalAsRelativePath;
        clearMemoryArgs();
    });

    test('buildBehaveCommand builds command correctly for file', async () => {
        const uri = vscode.Uri.file('/path/to/test.feature');
        const cmd = await buildBehaveCommand(uri, undefined, mockConfigService);
        assert.strictEqual(cmd, `behave --no-capture "${uri.fsPath}"`);
    });

    test('buildBehaveCommand builds command correctly for specific line', async () => {
        const uri = vscode.Uri.file('/path/to/test.feature');
        const cmd = await buildBehaveCommand(uri, 42, mockConfigService);
        assert.strictEqual(cmd, `behave --no-capture "${uri.fsPath}:42"`);
    });

    test('runBehave creates terminal and sends command', async () => {
        const uri = vscode.Uri.file('/path/to/test.feature');
        await runBehave(uri, undefined, mockConfigService);
        
        assert.strictEqual(showCalled, true, 'Terminal should be shown');
        assert.strictEqual(sendTextCalledWith, `behave --no-capture "${uri.fsPath}"`);
    });

    test('runBehave reuses existing terminal if available', async () => {
        const uri = vscode.Uri.file('/path/to/test.feature');
        
        let createTerminalCallCount = 0;
        (vscode.window as any).createTerminal = () => {
            createTerminalCallCount++;
            return mockTerminal;
        };
        Object.defineProperty(vscode.window, 'terminals', { get: () => [mockTerminal], configurable: true });

        // First run - might create if it's the first time in the module's life, or reuse if not
        await runBehave(uri, undefined, mockConfigService);
        
        // Reset the flag and run again
        createTerminalCallCount = 0;
        await runBehave(uri, undefined, mockConfigService);
        
        assert.strictEqual(createTerminalCallCount, 0, 'Should not create a new terminal if one exists');
        assert.strictEqual(sendTextCalledWith, `behave --no-capture "${uri.fsPath}"`);
    });

    test('runBehaveWithPrompt does nothing if user cancels prompt', async () => {
        (vscode.window as any).showInputBox = async () => undefined;
        
        const uri = vscode.Uri.file('/path/to/test.feature');
        await runBehaveWithPrompt(uri, undefined, mockConfigService);
        
        assert.strictEqual(showCalled, false);
        assert.strictEqual(sendTextCalledWith, undefined);
    });

    test('runBehaveWithPrompt saves modified args in memory but does not execute', async () => {
        const uri = vscode.Uri.file('/path/to/test.feature');
        
        let infoMessageShown = false;
        (vscode.window as any).showInformationMessage = async () => { infoMessageShown = true; };
        
        (vscode.window as any).showInputBox = async (options: any) => {
            return options.value.replace('--no-capture', '--no-capture --tags=@wip');
        };
        
        await runBehaveWithPrompt(uri, undefined, mockConfigService);
        
        assert.strictEqual(showCalled, false, 'Terminal should NOT be shown on edit');
        assert.strictEqual(sendTextCalledWith, undefined, 'Command should NOT be executed on edit');
        assert.strictEqual(infoMessageShown, true, 'Information message should be shown');

        // Next time buildBehaveCommand is called, it should use the memory args
        const cmd = await buildBehaveCommand(uri, undefined, mockConfigService);
        assert.strictEqual(cmd, `behave --no-capture --tags=@wip "${uri.fsPath}"`);
    });
    
    test('runBehaveWithPrompt does not save memory args if command format is completely changed', async () => {
        const uri = vscode.Uri.file('/path/to/test.feature');
        
        let errorMessageShown = false;
        (vscode.window as any).showErrorMessage = async () => { errorMessageShown = true; };
        
        (vscode.window as any).showInputBox = async () => 'echo "hello"';
        
        await runBehaveWithPrompt(uri, undefined, mockConfigService);
        
        assert.strictEqual(showCalled, false);
        assert.strictEqual(sendTextCalledWith, undefined);
        assert.strictEqual(errorMessageShown, true, 'Error message should be shown for invalid command format');

        // Memory should not be updated with echo hello
        const cmd = await buildBehaveCommand(uri, undefined, mockConfigService);
        // It should remain undefined, so it uses the original additional arguments
        assert.strictEqual(cmd, `behave --no-capture "${uri.fsPath}"`);
    });

    test('clearMemoryArgs correctly resets additional arguments to configuration defaults', async () => {
        const uri = vscode.Uri.file('/path/to/test.feature');
        
        // Mock prompt to set custom args
        (vscode.window as any).showInputBox = async (options: any) => {
            return options.value.replace('--no-capture', '--tags=@fast');
        };
        (vscode.window as any).showInformationMessage = async () => {};
        
        await runBehaveWithPrompt(uri, undefined, mockConfigService);
        
        // Verify args are changed
        let cmd = await buildBehaveCommand(uri, undefined, mockConfigService);
        assert.strictEqual(cmd, `behave --tags=@fast "${uri.fsPath}"`);
        
        // Clear memory
        clearMemoryArgs();
        
        // Verify args are back to default config
        cmd = await buildBehaveCommand(uri, undefined, mockConfigService);
        assert.strictEqual(cmd, `behave --no-capture "${uri.fsPath}"`);
    });

    test('parseArgsStringToVector correctly splits arguments and unquotes strings', () => {
        const args = parseArgsStringToVector('--no-capture --tags "@wip or @dev" -D env=test');
        assert.deepStrictEqual(args, ['--no-capture', '--tags', '@wip or @dev', '-D', 'env=test']);
    });

    test('debugBehave creates valid debug configuration', async () => {
        (vscode.workspace as any).getWorkspaceFolder = () => ({ uri: vscode.Uri.file('/workspace'), name: 'workspace', index: 0 });
        const uri = vscode.Uri.file('/workspace/features/test.feature');
        await debugBehave(uri, 42, mockConfigService);
        
        assert.ok(startDebuggingCalledWith, 'startDebugging should have been called');
        const config = startDebuggingCalledWith.config;
        assert.strictEqual(config.name, 'Debug Behave (PowerTools)');
        assert.strictEqual(config.type, 'python');
        assert.strictEqual(config.request, 'launch');
        assert.strictEqual(config.module, 'behave');
        assert.deepStrictEqual(config.args, ['--no-capture', './features/test.feature:42']);
        assert.strictEqual(config.console, 'integratedTerminal');
    });

    test('debugBehave prompts for missing Python extension and handles install action', async () => {
        getExtensionMock = () => undefined; // Simulate no Python extension
        
        let errorMessageShown = false;
        let commandExecuted = '';
        (vscode.window as any).showErrorMessage = async (_msg: string, _action: string) => {
            errorMessageShown = true;
            return 'Install Python Extension';
        };
        (vscode.commands as any).executeCommand = async (cmd: string, arg: string) => {
            commandExecuted = `${cmd}:${arg}`;
        };
        
        const uri = vscode.Uri.file('/workspace/features/test.feature');
        await debugBehave(uri, undefined, mockConfigService);
        
        assert.strictEqual(startDebuggingCalledWith, undefined, 'startDebugging should NOT have been called');
        assert.strictEqual(errorMessageShown, true, 'Error message should be shown prompting installation');
        assert.strictEqual(commandExecuted, 'extension.open:ms-python.python');
    });

    test('debugBehave shows error if no workspace folder is open', async () => {
        getExtensionMock = () => ({ id: 'ms-python.python' });
        (vscode.workspace as any).getWorkspaceFolder = () => undefined;

        let errorMessage = '';
        (vscode.window as any).showErrorMessage = async (msg: string) => { errorMessage = msg; };

        const uri = vscode.Uri.file('/tmp/test.feature');
        await debugBehave(uri, undefined, mockConfigService);

        assert.strictEqual(errorMessage, 'A workspace folder must be open to start debugging.');
    });

    test('runBehaveWithPrompt handles unquoted relative path replacement', async () => {
        const uri = vscode.Uri.file('/workspace/features/test.feature');
        (vscode.workspace as any).getWorkspaceFolder = () => ({ uri: vscode.Uri.file('/workspace'), name: 'workspace', index: 0 });
        (vscode.workspace as any).asRelativePath = () => 'features/test.feature';

        (vscode.window as any).showInputBox = async () => 'behave --tags=@wip ./features/test.feature';
        (vscode.window as any).showInformationMessage = async () => {};

        await runBehaveWithPrompt(uri, undefined, mockConfigService);
        const cmd = await buildBehaveCommand(uri, undefined, mockConfigService);
        assert.ok(cmd.includes('--tags=@wip'));
    });
});
