import * as assert from 'assert';
import * as vscode from 'vscode';
import { BehaveFileDiscoveryService } from '../../discovery';

suite('BehaveFileDiscoveryService Test Suite', () => {
    let service: BehaveFileDiscoveryService;

    setup(() => {
        service = new BehaveFileDiscoveryService();
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

    test('setupWatchers deduplicates globs', () => {
        const originalGetConfiguration = vscode.workspace.getConfiguration;
        const originalCreateFileSystemWatcher = vscode.workspace.createFileSystemWatcher;

        let createdWatchers = 0;

        vscode.workspace.getConfiguration = () => ({
            get: (key: string) => {
                if (key === 'stepGlobs') return ['**/steps/**/*.py', '**/steps/**/*.py'];
                return undefined;
            }
        } as any);

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

        vscode.workspace.getConfiguration = originalGetConfiguration;
        (vscode.workspace as any).createFileSystemWatcher = originalCreateFileSystemWatcher;
    });

    test('globPattern and excludePattern return correctly formatted strings', () => {
        const originalGetConfiguration = vscode.workspace.getConfiguration;
        vscode.workspace.getConfiguration = () => ({
            get: (key: string) => {
                if (key === 'stepGlobs') return ['glob1', 'glob2'];
                if (key === 'ignoreGlobs') return ['ignore1', 'ignore2'];
                return undefined;
            }
        } as any);

        assert.strictEqual(service.globPattern, '{glob1,glob2}');
        assert.strictEqual(service.excludePattern, '{ignore1,ignore2}');

        // Single glob
        vscode.workspace.getConfiguration = () => ({
            get: (key: string) => {
                if (key === 'stepGlobs') return ['glob1'];
                if (key === 'ignoreGlobs') return ['ignore1'];
                return undefined;
            }
        } as any);

        assert.strictEqual(service.globPattern, 'glob1');
        assert.strictEqual(service.excludePattern, 'ignore1');

        vscode.workspace.getConfiguration = originalGetConfiguration;
    });

    test('getStepFiles returns array of URIs', async () => {
        const originalFindFiles = vscode.workspace.findFiles;
        
        (vscode.workspace as any).findFiles = async (_include: string, _exclude: string) => {
            return [vscode.Uri.file('/tmp/file1.py'), vscode.Uri.file('/tmp/file2.py')];
        };

        const originalGetConfiguration = vscode.workspace.getConfiguration;
        vscode.workspace.getConfiguration = () => ({
            get: (key: string) => {
                if (key === 'stepGlobs') return ['glob1'];
                return undefined;
            }
        } as any);

        const files = await service.getStepFiles();
        assert.strictEqual(files.length, 2);
        assert.ok(files.some(f => f.fsPath.includes('file1.py')));

        (vscode.workspace as any).findFiles = originalFindFiles;
        vscode.workspace.getConfiguration = originalGetConfiguration;
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
