import * as assert from 'assert';
import * as vscode from 'vscode';
import { isFileIgnored, getBehaveConfiguration } from '../../configuration';

suite('Configuration & Watcher Test Suite', () => {
    test('isFileIgnored correctly matches ** patterns', () => {
        const ignoreGlobs = ['**/node_modules/**', '**/.venv/**', '**/venv/**'];
        
        // Match node_modules
        assert.strictEqual(isFileIgnored(vscode.Uri.file('/my/project/node_modules/behave/steps.py'), ignoreGlobs), true);
        
        // Match .venv
        assert.strictEqual(isFileIgnored(vscode.Uri.file('/my/project/.venv/lib/site-packages/steps.py'), ignoreGlobs), true);
        
        // Do not match normal paths
        assert.strictEqual(isFileIgnored(vscode.Uri.file('/my/project/features/steps/steps.py'), ignoreGlobs), false);
        assert.strictEqual(isFileIgnored(vscode.Uri.file('/my/project/myenv/steps.py'), ignoreGlobs), false);
    });

    test('isFileIgnored handles non-** starting globs', () => {
        const ignoreGlobs = ['dist/**', 'out/*'];
        
        // Should match since it automatically prefixes ^.* if it doesn't start with **
        assert.strictEqual(isFileIgnored(vscode.Uri.file('/my/project/dist/steps.py'), ignoreGlobs), true);
        assert.strictEqual(isFileIgnored(vscode.Uri.file('/my/project/out/steps.py'), ignoreGlobs), true);
        
        // But not randomly inside
        assert.strictEqual(isFileIgnored(vscode.Uri.file('/my/project/src/dist_test/steps.py'), ignoreGlobs), false);
    });

    test('getBehaveConfiguration returns expected defaults or config', () => {
        const config = getBehaveConfiguration();
        assert.ok(Array.isArray(config.stepGlobs));
        assert.ok(Array.isArray(config.ignoreGlobs));
        assert.ok(typeof config.stepGlobPattern === 'string');
        assert.ok(typeof config.ignoreGlobPattern === 'string');
    });
});
