import * as assert from 'assert';
import * as path from 'path';
import * as fs from 'fs';
import * as vscode from 'vscode';
import { WorkspaceEventBus } from '../../eventBus';
import { SymbolCache } from '../../cache';
import { ConfigurationService } from '../../configuration';
import { discoveryService } from '../../discovery';

suite('Configuration Synchronization and Cache Invalidation', () => {
    let tempDir: string;
    let eventBus: WorkspaceEventBus;
    let cache: SymbolCache;
    let configService: ConfigurationService;

    setup(async () => {
        tempDir = path.join(__dirname, '..', '..', '..', 'test-fixtures', 'sync-test');
        if (!fs.existsSync(tempDir)) {
            fs.mkdirSync(tempDir, { recursive: true });
        }

        eventBus = new WorkspaceEventBus();
        
        configService = { getConfiguration: () => ({}) } as unknown as ConfigurationService;

        cache = new SymbolCache();
        cache.setEventBus(eventBus);
        
        // Setup discovery
        discoveryService.configService = configService;
        discoveryService.eventBus = eventBus;
    });

    teardown(() => {
        fs.rmSync(tempDir, { recursive: true, force: true });
        if (vscode.workspace.workspaceFolders) {
            fs.rmSync(path.join(vscode.workspace.workspaceFolders[0].uri.fsPath, 'sync-test-bug'), { recursive: true, force: true });
        }
        cache.dispose();
        eventBus.dispose();
    });

    test('Project configuration changes must invalidate cache (Reproduction)', async () => {
        const workspaceRoot = vscode.workspace.workspaceFolders ? vscode.workspace.workspaceFolders[0].uri.fsPath : tempDir;
        const commonPyDir = path.join(workspaceRoot, 'sync-test-bug', 'shared_steps');
        await vscode.workspace.fs.createDirectory(vscode.Uri.file(commonPyDir));
        const commonPyPath = path.join(commonPyDir, 'common.py');
        await vscode.workspace.fs.writeFile(vscode.Uri.file(commonPyPath), Buffer.from(`@given('I have a shared step')\ndef step_impl(): pass`));

        let currentGlobs = ["features/steps/**/*.py"];
        configService.getConfiguration = () => {
            return {
                behave: {
                    stepGlobs: currentGlobs,
                    ignoreGlobs: ["**/node_modules/**"]
                }
            } as any;
        };

        // Initialize cache and discovery
        discoveryService.rebuildWatchers(); // setup watchers
        await cache.ensureInitialized();
        
        // Assert shared_steps/common.py is NOT indexed
        let defs = await cache.getAllStepDefinitions();
        assert.strictEqual(defs.length, 0, 'Should have 0 definitions initially since glob does not match');

        // Change project configuration
        currentGlobs = ["features/steps/**/*.py", "sync-test-bug/shared_steps/**/*.py"];
        
        // Simulate event emitted by ConfigurationService
        const folder = vscode.workspace.workspaceFolders ? vscode.workspace.workspaceFolders[0] : undefined;
        eventBus.publish({ type: 'stepDiscoveryConfigChanged', folder });
        
        // Wait for asynchronous processing (give it some time to process the event)
        await new Promise(resolve => setTimeout(resolve, 2000));

        // After configuration changes, cache should reflect the new glob and index common.py
        defs = await cache.getAllStepDefinitions();
        assert.strictEqual(defs.length, 1, 'Bug Reproducer: Cache failed to update after stepGlobs changed via project config');
    });
});
