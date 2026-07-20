import * as assert from 'assert';
import * as vscode from 'vscode';
import { buildBehaveCommand, runBehave, runBehaveWithPrompt } from '../../execution';
import { ConfigurationService } from '../../configuration';

suite('Execution Test Suite', () => {
    let originalCreateTerminal: any;
    let originalShowInputBox: any;
    let originalTerminals: any;
    let mockTerminal: any;
    let sendTextCalledWith: string | undefined;
    let showCalled: boolean;

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
    });

    teardown(() => {
        (vscode.window as any).createTerminal = originalCreateTerminal;
        (vscode.window as any).showInputBox = originalShowInputBox;
        if (originalTerminals) {
            Object.defineProperty(vscode.window, 'terminals', { get: originalTerminals });
        }
    });

    test('buildBehaveCommand builds command correctly for file', async () => {
        const uri = vscode.Uri.file('/path/to/test.feature');
        const cmd = await buildBehaveCommand(uri, undefined, mockConfigService);
        assert.strictEqual(cmd, 'behave --no-capture "/path/to/test.feature"');
    });

    test('buildBehaveCommand builds command correctly for specific line', async () => {
        const uri = vscode.Uri.file('/path/to/test.feature');
        const cmd = await buildBehaveCommand(uri, 42, mockConfigService);
        assert.strictEqual(cmd, 'behave --no-capture "/path/to/test.feature:42"');
    });

    test('runBehave creates terminal and sends command', async () => {
        const uri = vscode.Uri.file('/path/to/test.feature');
        await runBehave(uri, undefined, mockConfigService);
        
        assert.strictEqual(showCalled, true, 'Terminal should be shown');
        assert.strictEqual(sendTextCalledWith, 'behave --no-capture "/path/to/test.feature"');
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
        assert.strictEqual(sendTextCalledWith, 'behave --no-capture "/path/to/test.feature"');
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
        assert.strictEqual(cmd, 'behave --no-capture --tags=@wip "/path/to/test.feature"');
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
        // It should still have the previously saved --no-capture --tags=@wip
        assert.strictEqual(cmd, 'behave --no-capture --tags=@wip "/path/to/test.feature"');
    });
});
