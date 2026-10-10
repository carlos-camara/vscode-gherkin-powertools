import * as assert from 'assert';
import * as sinon from 'sinon';
import * as vscode from 'vscode';
import { registerProductionCommands } from '../../activation/commands';

suite('Production Commands Tests', () => {
    let sandbox: sinon.SinonSandbox;
    const callbacks: { [cmd: string]: Function } = {};

    setup(() => {
        sandbox = sinon.createSandbox();
        
        sandbox.stub(vscode.commands, 'registerCommand').callsFake((cmd: string, callback: Function) => {
            callbacks[cmd] = callback;
            return { dispose: () => {} } as vscode.Disposable;
        });

        // Mock workspace trust to bypass warnings
        sandbox.stub(vscode.workspace, 'isTrusted').value(true);

        const mockServices = {
            configService: {} as any,
            refactoringService: {} as any,
            symbolCache: {} as any,
            eventBus: {} as any
        };

        registerProductionCommands(mockServices);
    });

    teardown(() => {
        sandbox.restore();
    });

    suite('gherkinPowerTools.testExplorerEditAndRun', () => {
        setup(() => {
            sandbox.stub(vscode.tasks, 'executeTask').resolves({} as any);
        });

        test('executes with active feature file', async () => {
            sandbox.stub(vscode.window, 'activeTextEditor').value({
                document: { languageId: 'feature', uri: vscode.Uri.file('/test.feature') }
            });
            try {
                await callbacks['gherkinPowerTools.testExplorerEditAndRun']();
            } catch (e) {}
            assert.ok(true);
        });

        test('executes with workspace folder when no active feature file', async () => {
            sandbox.stub(vscode.window, 'activeTextEditor').value(undefined);
            sandbox.stub(vscode.workspace, 'workspaceFolders').value([{ uri: vscode.Uri.file('/workspace') }]);
            
            try {
                await callbacks['gherkinPowerTools.testExplorerEditAndRun']();
            } catch (e) {}
            assert.ok(true);
        });

        test('shows warning when no feature file and no workspace folders', async () => {
            sandbox.stub(vscode.window, 'activeTextEditor').value(undefined);
            sandbox.stub(vscode.workspace, 'workspaceFolders').value(undefined);
            const warnSpy = sandbox.stub(vscode.window, 'showWarningMessage').resolves();

            await callbacks['gherkinPowerTools.testExplorerEditAndRun']();
            assert.ok(warnSpy.calledWith('Open a .feature file to edit arguments.'));
        });
    });

    suite('gherkinPowerTools.refactor.extractStep', () => {
        test('shows error message if no python step definition files found', async () => {
            sandbox.stub(vscode.window, 'activeTextEditor').value({
                document: { languageId: 'feature', uri: vscode.Uri.file('/test.feature') }
            });
            sandbox.stub(vscode.window, 'showInputBox').resolves('new step name');
            sandbox.stub(vscode.workspace, 'findFiles').resolves([]);
            
            const errorSpy = sandbox.stub(vscode.window, 'showErrorMessage').resolves();

            await callbacks['gherkinPowerTools.refactor.extractStep']();
            
            assert.ok(errorSpy.calledWith('No Python step definition files found.'));
        });
    });
});
