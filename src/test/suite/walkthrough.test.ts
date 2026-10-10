import * as assert from 'assert';
import * as fs from 'fs';
import * as path from 'path';

suite('Walkthrough Manifest Tests', () => {
    let packageJson: any;
    let workspaceRoot: string;

    suiteSetup(() => {
        workspaceRoot = path.resolve(__dirname, '../../../');
        const packageJsonPath = path.join(workspaceRoot, 'package.json');
        packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    });

    test('All commands referenced in completionEvents must exist', () => {
        const commands = new Set<string>();
        packageJson.contributes.commands.forEach((c: any) => commands.add(c.command));

        // Built-in VS Code commands we use
        commands.add('workbench.action.openSettings');
        commands.add('workbench.view.testing.focus');

        packageJson.contributes.walkthroughs.forEach((walkthrough: any) => {
            walkthrough.steps.forEach((step: any) => {
                if (step.completionEvents) {
                    step.completionEvents.forEach((event: string) => {
                        if (event.startsWith('onCommand:')) {
                            const commandId = event.replace('onCommand:', '');
                            assert.ok(
                                commands.has(commandId),
                                `Walkthrough step '${step.id}' completionEvent references missing command: ${commandId}`
                            );
                        }
                    });
                }
                
                if (step.description) {
                    const commandRegex = /\]\(command:([^?)]+)(\?[^)]+)?\)/g;
                    let match;
                    while ((match = commandRegex.exec(step.description)) !== null) {
                        const commandId = match[1];
                        assert.ok(
                            commands.has(commandId),
                            `Walkthrough step '${step.id}' description references missing command: ${commandId}`
                        );
                    }
                }
            });
        });
    });

    test('All media paths must exist in the file system', () => {
        packageJson.contributes.walkthroughs.forEach((walkthrough: any) => {
            walkthrough.steps.forEach((step: any) => {
                if (step.media) {
                    const markdownPath = step.media.markdown;
                    if (markdownPath) {
                        const fullPath = path.join(workspaceRoot, markdownPath);
                        assert.ok(
                            fs.existsSync(fullPath),
                            `Walkthrough step '${step.id}' media path does not exist: ${markdownPath}`
                        );
                    }
                }
            });
        });
    });
});

import * as sinon from 'sinon';
import * as vscode from 'vscode';
import { GherkinFormattingEditProvider } from '../../formatter';
import { ConfigurationService } from '../../configuration';

suite('Walkthrough Commands Tests', () => {
    let mockFormatter: sinon.SinonStubbedInstance<GherkinFormattingEditProvider>;
    let mockConfigService: sinon.SinonStubbedInstance<ConfigurationService>;
    let sandbox: sinon.SinonSandbox;
    const callbacks: { [cmd: string]: Function } = {};

    setup(() => {
        sandbox = sinon.createSandbox();
        mockFormatter = sandbox.createStubInstance(GherkinFormattingEditProvider);
        mockConfigService = sandbox.createStubInstance(ConfigurationService);
        
        // Default config: enabled
        mockConfigService.getConfiguration.returns({
            formatter: { enabled: true }
        } as any);

        sandbox.stub(vscode.commands, 'registerCommand').callsFake((cmd: string, callback: Function) => {
            callbacks[cmd] = callback;
            return { dispose: () => {} } as vscode.Disposable;
        });

        // Register the commands
        const { registerWalkthroughCommands } = require('../../activation/walkthrough');
        registerWalkthroughCommands(mockFormatter, mockConfigService);
    });

    teardown(() => {
        sandbox.restore();
    });

    test('gherkinPowerTools.demoQuickFix executes quick fix when feature file is active', async () => {
        sandbox.stub(vscode.window, 'activeTextEditor').value({ document: { languageId: 'feature' } });
        const executeSpy = sandbox.stub(vscode.commands, 'executeCommand').resolves();

        await callbacks['gherkinPowerTools.demoQuickFix']();
        
        assert.ok(executeSpy.calledWith('editor.action.quickFix'));
    });

    test('gherkinPowerTools.demoQuickFix opens new document when no feature file is active', async () => {
        sandbox.stub(vscode.window, 'activeTextEditor').value(undefined);
        const openStub = sandbox.stub(vscode.workspace, 'openTextDocument').resolves({} as any);
        const showStub = sandbox.stub(vscode.window, 'showTextDocument').resolves({ selection: null } as any);
        const executeSpy = sandbox.stub(vscode.commands, 'executeCommand').resolves();
        sandbox.stub(vscode.window, 'showInformationMessage').resolves();

        const clock = sandbox.useFakeTimers();
        
        await callbacks['gherkinPowerTools.demoQuickFix']();
        
        assert.ok(openStub.calledOnce);
        assert.ok(showStub.calledOnce);
        
        clock.tick(2000);
        assert.ok(executeSpy.calledWith('editor.action.quickFix'));
    });

    test('gherkinPowerTools.demoGoToDefinition executes revealDefinition when feature file is active', async () => {
        sandbox.stub(vscode.window, 'activeTextEditor').value({ document: { languageId: 'feature' } });
        const executeSpy = sandbox.stub(vscode.commands, 'executeCommand').resolves();

        await callbacks['gherkinPowerTools.demoGoToDefinition']();
        
        assert.ok(executeSpy.calledWith('editor.action.revealDefinition'));
    });

    test('gherkinPowerTools.demoGoToDefinition shows message when no feature file is active', async () => {
        sandbox.stub(vscode.window, 'activeTextEditor').value(undefined);
        const infoSpy = sandbox.stub(vscode.window, 'showInformationMessage').resolves();

        await callbacks['gherkinPowerTools.demoGoToDefinition']();
        
        assert.ok(infoSpy.calledOnce);
    });

    test('gherkinPowerTools.format formats existing active feature file', async () => {
        const mockEdit = sandbox.stub().callsFake((callback) => {
            const builder = { replace: sandbox.stub() };
            callback(builder);
            return Promise.resolve(true);
        });
        const doc = { languageId: 'feature', uri: vscode.Uri.file('/test.feature') };
        sandbox.stub(vscode.window, 'activeTextEditor').value({
            document: doc,
            edit: mockEdit
        });

        mockFormatter.provideDocumentFormattingEdits.resolves([
            new vscode.TextEdit(new vscode.Range(0, 0, 0, 0), "formatted")
        ]);

        await callbacks['gherkinPowerTools.format']();
        
        assert.ok(mockFormatter.provideDocumentFormattingEdits.calledOnce);
        assert.ok(mockEdit.calledOnce);
    });

    test('gherkinPowerTools.format creates new messy feature file if no feature file is visible', async () => {
        sandbox.stub(vscode.window, 'activeTextEditor').value(undefined);
        sandbox.stub(vscode.window, 'visibleTextEditors').value([]);
        
        const openStub = sandbox.stub(vscode.workspace, 'openTextDocument').resolves({ uri: vscode.Uri.file('/new.feature') } as any);
        const mockEdit = sandbox.stub().resolves(true);
        const showStub = sandbox.stub(vscode.window, 'showTextDocument').resolves({
            document: { uri: vscode.Uri.file('/new.feature') },
            edit: mockEdit
        } as any);
        sandbox.stub(vscode.window, 'showInformationMessage').resolves();

        mockFormatter.provideDocumentFormattingEdits.resolves([
            new vscode.TextEdit(new vscode.Range(0, 0, 0, 0), "formatted")
        ]);
        
        await callbacks['gherkinPowerTools.format']();
        
        assert.ok(openStub.calledOnce);
        assert.ok(showStub.calledOnce);
        assert.ok(mockFormatter.provideDocumentFormattingEdits.calledOnce);
        assert.ok(mockEdit.calledOnce);
    });

    test('gherkinPowerTools.format stops if formatting disabled in settings', async () => {
        sandbox.stub(vscode.window, 'activeTextEditor').value({
            document: { languageId: 'feature', uri: vscode.Uri.file('/test.feature') }
        });
        mockConfigService.getConfiguration.returns({ formatter: { enabled: false } } as any);
        
        const warnSpy = sandbox.stub(vscode.window, 'showWarningMessage').resolves();

        await callbacks['gherkinPowerTools.format']();
        
        assert.ok(warnSpy.calledWith("Formatting is disabled in settings."));
        assert.ok(mockFormatter.provideDocumentFormattingEdits.notCalled);
    });

    test('gherkinPowerTools.format warns if syntax errors exist and no edits', async () => {
        sandbox.stub(vscode.window, 'activeTextEditor').value({
            document: { languageId: 'feature', uri: vscode.Uri.file('/test.feature') }
        });
        mockFormatter.provideDocumentFormattingEdits.resolves([]);
        
        const { astRepository } = require('../../ast');
        sandbox.stub(astRepository, 'getAST').resolves({ errors: [{}] });
        
        const warnSpy = sandbox.stub(vscode.window, 'showWarningMessage').resolves();

        await callbacks['gherkinPowerTools.format']();
        
        assert.ok(warnSpy.calledWith("Cannot format document with syntax errors. Check diagnostics."));
    });
});

