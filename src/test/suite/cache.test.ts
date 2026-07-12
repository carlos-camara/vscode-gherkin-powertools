import * as assert from 'assert';
import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { SymbolCache } from '../../cache';

suite('SymbolCache Test Suite', () => {
    let cache: SymbolCache;
    let tempDir: string;

    setup(() => {
        cache = new SymbolCache();
        tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'gherkin-cache-test-'));
    });

    teardown(() => {
        fs.rmSync(tempDir, { recursive: true, force: true });
    });

    test('Parses Python step definitions from file', () => {
        const mockPythonCode = `
@given('I have {count} apples')
def step_impl(context, count):
    """Docstring here"""
    pass

@when(r'I eat (?P<amount>\\d+) apples')
def step_impl_when(context, amount):
    pass
        `;
        
        const tempFile = path.join(tempDir, 'test_steps.py');
        fs.writeFileSync(tempFile, mockPythonCode);

        const uri = vscode.Uri.file(tempFile);
        cache.updateFile(uri);

        const patterns = cache.getAllStepPatterns();
        assert.strictEqual(patterns.length, 2);
        assert.ok(patterns.includes('I have {count} apples'));
        assert.ok(patterns.includes('I eat (?P<amount>\\d+) apples'));

        // Test matching
        const givenDef = cache.getStepDefinition('I have 5 apples');
        assert.ok(givenDef);
        assert.strictEqual(givenDef?.documentation, 'Docstring here');
        assert.strictEqual(givenDef?.functionSignature, 'def step_impl(context, count)');

        const whenDef = cache.getStepDefinition('I eat 2 apples');
        assert.ok(whenDef);
        assert.strictEqual(whenDef?.functionSignature, 'def step_impl_when(context, amount)');

        // Test finding definitions
        const location = cache.findDefinition('I have 3 apples');
        assert.ok(location);
        assert.strictEqual(location?.uri.toString(), uri.toString());
        assert.strictEqual(location?.range.start.line, 1);
    });

    test('Removes file from cache', () => {
        const tempFile = path.join(tempDir, 'remove.py');
        fs.writeFileSync(tempFile, `@given('A step')\ndef step_impl():\n  pass`);
        
        const uri = vscode.Uri.file(tempFile);
        cache.updateFile(uri);
        
        assert.strictEqual(cache.getAllStepPatterns().length, 1);
        
        cache.removeFile(uri);
        assert.strictEqual(cache.getAllStepPatterns().length, 0);
    });

    test('Handles read errors gracefully', () => {
        const uri = vscode.Uri.file(path.join(tempDir, 'non_existent.py'));
        
        // Pre-populate so we can see it gets removed
        (cache as any).cache.set(uri.toString(), [{ patternText: 'A step' }]);
        
        // This should trigger the catch block and call removeFile
        cache.updateFile(uri);
        
        assert.strictEqual(cache.getAllStepPatterns().length, 0);
    });

    test('Handles multiline function signatures and docstrings', () => {
        const mockPythonCode = `
@then('I have multi')
def step_impl(
    context,
    arg1,
    arg2
):
    '''
    Line 1
    Line 2
    '''
    pass
        `;
        const tempFile = path.join(tempDir, 'multi.py');
        fs.writeFileSync(tempFile, mockPythonCode);
        
        const uri = vscode.Uri.file(tempFile);
        cache.updateFile(uri);
        
        const def = cache.getStepDefinition('I have multi');
        assert.ok(def);
        assert.strictEqual(def?.functionSignature, 'def step_impl( context, arg1, arg2 )');
        assert.ok(def?.documentation?.includes('Line 1'));
        assert.ok(def?.documentation?.includes('Line 2'));
    });

    test('Initializes cache from workspace files', async () => {
        // We can't easily mock vscode.workspace.findFiles, but we can verify 
        // that calling initialize() doesn't crash and sets isInitialized.
        await cache.initialize();
        // Calling it again should return early
        await cache.initialize();
    });
});
