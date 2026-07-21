import * as assert from 'assert';
import * as vscode from 'vscode';
import { BehaveFileDiscoveryService } from '../../discovery';

suite('BehaveFileDiscoveryService Test Suite', () => {
    let service: BehaveFileDiscoveryService;

    setup(() => {
        service = new BehaveFileDiscoveryService();
        service.configService = {
            getConfiguration: () => ({
                behave: {
                    stepGlobs: ['**/steps/**/*.py', '**/features/steps/**/*.py'],
                    ignoreGlobs: ['**/node_modules/**', '**/.venv/**', '**/venv/**', '**/env/**']
                }
            })
        } as any;
    });

    teardown(() => {
        service.disposeWatchers();
    });

    test('normalizeGlobs returns defaults when provided invalid or empty inputs', () => {
        const defaults = ['**/steps/**/*.py'];

        assert.deepStrictEqual(service.normalizeGlobs(null, defaults), defaults);
        assert.deepStrictEqual(service.normalizeGlobs(undefined, defaults), defaults);
        assert.deepStrictEqual(service.normalizeGlobs([], defaults), defaults);
        assert.deepStrictEqual(service.normalizeGlobs([123, null], defaults), defaults);
        assert.deepStrictEqual(service.normalizeGlobs([''], defaults), defaults);
        assert.deepStrictEqual(service.normalizeGlobs(['   '], defaults), defaults);
    });

    test('normalizeGlobs filters invalid elements but keeps valid ones', () => {
        const defaults = ['**/steps/**/*.py'];
        const input = ['valid/**/*.py', 123, '', '   ', null, 'another/**/*.py'];
        const expected = ['valid/**/*.py', 'another/**/*.py'];

        assert.deepStrictEqual(service.normalizeGlobs(input, defaults), expected);
    });

    test('isIgnored correctly identifies virtual environments and node_modules', () => {
        const ignoreGlobs = ['**/node_modules/**', '**/.venv/**', '**/venv/**', '**/env/**'];

        const venvFile = vscode.Uri.file('/workspace/.venv/lib/python3.9/site-packages/steps.py');
        const nodeModulesFile = vscode.Uri.file('/workspace/node_modules/pkg/steps.py');
        const envFile = vscode.Uri.file('/workspace/env/lib/steps.py');
        const validStepFile = vscode.Uri.file('/workspace/features/steps/login_steps.py');

        assert.strictEqual(service.isIgnored(venvFile, ignoreGlobs), true);
        assert.strictEqual(service.isIgnored(nodeModulesFile, ignoreGlobs), true);
        assert.strictEqual(service.isIgnored(envFile, ignoreGlobs), true);
        assert.strictEqual(service.isIgnored(validStepFile, ignoreGlobs), false);
    });

    test('isIgnored supports custom ignore glob patterns', () => {
        const ignoreGlobs = ['**/custom_ignore/*.py'];

        const ignoredFile = vscode.Uri.file('/workspace/custom_ignore/test_steps.py');
        const validFile = vscode.Uri.file('/workspace/features/steps/test_steps.py');

        assert.strictEqual(service.isIgnored(ignoredFile, ignoreGlobs), true);
        assert.strictEqual(service.isIgnored(validFile, ignoreGlobs), false);
    });

    test('getStepFiles filters out ignored files automatically', async () => {
        const originalFindFiles = vscode.workspace.findFiles;

        (vscode.workspace as any).findFiles = async (_include: string, _exclude: string) => {
            return [
                vscode.Uri.file('/workspace/features/steps/login_steps.py'),
                vscode.Uri.file('/workspace/.venv/lib/python3.9/site-packages/ignored_steps.py')
            ];
        };

        const files = await service.getStepFiles();
        assert.strictEqual(files.length, 1);
        assert.ok(files[0].fsPath.includes('login_steps.py'));

        (vscode.workspace as any).findFiles = originalFindFiles;
    });

    test('getBestWorkspaceFolder returns given folder', () => {
        const dummyUri = vscode.Uri.file('/my/workspace/folder/file.py');
        const dummyFolder: vscode.WorkspaceFolder = {
            uri: vscode.Uri.file('/my/workspace/folder'),
            name: 'folder',
            index: 0
        };

        const originalWorkspaceFolders = vscode.workspace.workspaceFolders;
        const originalGetWorkspaceFolder = vscode.workspace.getWorkspaceFolder;

        Object.defineProperty(vscode.workspace, 'workspaceFolders', { get: () => [dummyFolder] });
        (vscode.workspace as any).getWorkspaceFolder = () => dummyFolder;

        const result = service.getBestWorkspaceFolder(dummyUri);
        assert.deepStrictEqual(result, dummyFolder);

        Object.defineProperty(vscode.workspace, 'workspaceFolders', { get: () => originalWorkspaceFolders });
        (vscode.workspace as any).getWorkspaceFolder = originalGetWorkspaceFolder;
    });

    test('getBestWorkspaceFolder falls back to first workspace folder if getWorkspaceFolder returns undefined', () => {
        const dummyUri = vscode.Uri.file('/outside/workspace/file.py');
        const dummyFolder: vscode.WorkspaceFolder = {
            uri: vscode.Uri.file('/my/workspace/folder'),
            name: 'folder',
            index: 0
        };

        const originalWorkspaceFolders = vscode.workspace.workspaceFolders;
        const originalGetWorkspaceFolder = vscode.workspace.getWorkspaceFolder;

        Object.defineProperty(vscode.workspace, 'workspaceFolders', { get: () => [dummyFolder] });
        (vscode.workspace as any).getWorkspaceFolder = () => undefined;

        const result = service.getBestWorkspaceFolder(dummyUri);
        assert.deepStrictEqual(result, dummyFolder);

        Object.defineProperty(vscode.workspace, 'workspaceFolders', { get: () => originalWorkspaceFolders });
        (vscode.workspace as any).getWorkspaceFolder = originalGetWorkspaceFolder;
    });

    test('setupWatchers deduplicates globs and registers listeners', () => {
        const originalCreateFileSystemWatcher = vscode.workspace.createFileSystemWatcher;

        let createdWatchers = 0;

        service.configService = {
            getConfiguration: () => ({
                behave: {
                    stepGlobs: ['**/steps/**/*.py', '**/steps/**/*.py'],
                    ignoreGlobs: ['**/venv/**']
                }
            })
        } as any;

        (vscode.workspace as any).createFileSystemWatcher = () => {
            createdWatchers++;
            return {
                onDidCreate: () => {},
                onDidChange: () => {},
                onDidDelete: () => {},
                dispose: () => {}
            };
        };

        const watchers = service.setupWatchers(() => {}, () => {}, () => {});
        assert.strictEqual(watchers.length, 1);
        assert.strictEqual(createdWatchers, 1);

        service.disposeWatchers();

        (vscode.workspace as any).createFileSystemWatcher = originalCreateFileSystemWatcher;
    });

    test('setupWatchers filters events on ignored files', (done) => {
        const originalCreateFileSystemWatcher = vscode.workspace.createFileSystemWatcher;

        let onCreatedListener: ((uri: vscode.Uri) => void) | undefined;
        let eventFired = false;

        service.configService = {
            getConfiguration: () => ({
                behave: {
                    stepGlobs: ['**/steps/**/*.py'],
                    ignoreGlobs: ['**/venv/**']
                }
            })
        } as any;

        (vscode.workspace as any).createFileSystemWatcher = () => {
            return {
                onDidCreate: (cb: any) => { onCreatedListener = cb; },
                onDidChange: () => {},
                onDidDelete: () => {},
                dispose: () => {}
            };
        };

        service.setupWatchers(
            () => { eventFired = true; },
            () => {},
            () => {}
        );

        // Fire event on ignored file
        if (onCreatedListener) {
            onCreatedListener(vscode.Uri.file('/workspace/venv/lib/steps.py'));
        }

        setTimeout(() => {
            assert.strictEqual(eventFired, false, 'Ignored file event should not trigger callback');
            service.disposeWatchers();
            (vscode.workspace as any).createFileSystemWatcher = originalCreateFileSystemWatcher;
            done();
        }, 150);
    });

    test('globPattern and excludePattern return correctly formatted strings', () => {
        service.configService = {
            getConfiguration: () => ({
                behave: {
                    stepGlobs: ['glob1', 'glob2'],
                    ignoreGlobs: ['ignore1', 'ignore2']
                }
            })
        } as any;

        assert.strictEqual(service.getGlobPattern(), '{glob1,glob2}');
        assert.strictEqual(service.getExcludePattern(), '{ignore1,ignore2}');

        // Single glob
        service.configService = {
            getConfiguration: () => ({
                behave: {
                    stepGlobs: ['glob1'],
                    ignoreGlobs: ['ignore1']
                }
            })
        } as any;

        assert.strictEqual(service.getGlobPattern(), 'glob1');
        assert.strictEqual(service.getExcludePattern(), 'ignore1');
    });

    test('getBestWorkspaceFolder returns undefined if no workspace folders exist', () => {
        const originalWorkspaceFolders = vscode.workspace.workspaceFolders;
        
        Object.defineProperty(vscode.workspace, 'workspaceFolders', { get: () => undefined });
        
        const result = service.getBestWorkspaceFolder(vscode.Uri.file('/tmp/file.py'));
        assert.strictEqual(result, undefined);
        
        Object.defineProperty(vscode.workspace, 'workspaceFolders', { get: () => [] });
        const result2 = service.getBestWorkspaceFolder(vscode.Uri.file('/tmp/file.py'));
        assert.strictEqual(result2, undefined);

        Object.defineProperty(vscode.workspace, 'workspaceFolders', { get: () => originalWorkspaceFolders });
    });
});