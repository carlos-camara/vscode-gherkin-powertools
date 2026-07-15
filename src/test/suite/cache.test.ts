import * as assert from 'assert';
import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { SymbolCache, FeatureCache } from '../../cache';

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

    test('Parses Python step definitions from file', async () => {
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
        await cache.updateFile(uri);

        const patterns = await cache.getAllStepPatterns();
        assert.strictEqual(patterns.length, 2);
        assert.ok(patterns.includes('I have {count} apples'));
        assert.ok(patterns.includes('I eat (?P<amount>\\d+) apples'));

        // Test matching
        const givenDef = await cache.getStepDefinition('I have 5 apples');
        assert.ok(givenDef);
        assert.strictEqual(givenDef?.documentation, 'Docstring here');
        assert.strictEqual(givenDef?.functionName, 'step_impl');

        const whenDef = await cache.getStepDefinition('I eat 2 apples');
        assert.ok(whenDef);
        assert.strictEqual(whenDef?.functionName, 'step_impl_when');

        const locations = await cache.getStepDefinitions('I have 3 apples');
        assert.strictEqual(locations.length, 1);
        assert.strictEqual(locations[0].uri.toString(), uri.toString());
        assert.strictEqual(locations[0].decoratorRange.start.line, 1);

        // Test multiple ambiguous definitions
        const ambiguousCode = `
@given('I have 10 apples')
def specific(context): pass

@given(r'I have \\d+ apples')
def general(context): pass
        `;
        const ambigFile = path.join(tempDir, 'ambig.py');
        fs.writeFileSync(ambigFile, ambiguousCode);
        await cache.updateFile(vscode.Uri.file(ambigFile));

        const multipleDefs = await cache.getStepDefinitions('I have 10 apples');
        assert.strictEqual(multipleDefs.length, 2, 'Should return both matching definitions');
    });

    test('Removes file from cache', async () => {
        const tempFile = path.join(tempDir, 'remove.py');
        fs.writeFileSync(tempFile, `@given('A step')\ndef step_impl():\n  pass`);
        
        const uri = vscode.Uri.file(tempFile);
        await cache.updateFile(uri);
        
        assert.strictEqual((await cache.getAllStepPatterns()).length, 1);
        
        cache.removeFile(uri);
        assert.strictEqual((await cache.getAllStepPatterns()).length, 0);
    });

    test('Handles read errors gracefully', async () => {
        const uri = vscode.Uri.file(path.join(tempDir, 'non_existent.py'));
        
        // Pre-populate so we can see it gets removed
        (cache as any).cache.set(uri.toString(), [{ patternText: 'A step' }]);
        
        // This should trigger the catch block and call removeFile
        await cache.updateFile(uri);
        
        assert.strictEqual((await cache.getAllStepPatterns()).length, 0);
    });

    test('Handles multiline function signatures and docstrings', async () => {
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
        await cache.updateFile(uri);
        
        const def = await cache.getStepDefinition('I have multi');
        assert.ok(def);
        assert.strictEqual(def?.functionName, 'step_impl');
        assert.ok(def?.documentation?.includes('Line 1'));
        assert.ok(def?.documentation?.includes('Line 2'));
    });

    test('Initializes cache from workspace files', async () => {
        // We can't easily mock vscode.workspace.findFiles, but we can verify 
        // that calling initialize() doesn't crash and sets state.
        const p1 = cache.initialize();
        assert.strictEqual(cache.state, 'initializing');
        
        // Multiple simultaneous calls should return the same promise
        const p2 = cache.initialize();
        assert.strictEqual(p1, p2, 'Multiple initialize calls should return the exact same promise instance');
        
        await p1;
        assert.strictEqual(cache.state, 'ready');
        
        // Calling it again after ready should also return the resolved promise
        const p3 = cache.initialize();
        assert.strictEqual(p1, p3);
    });

    test('Tag Blast Radius: Handles inherited tags from Feature and multiplies by Examples', async () => {
        const featureCache = new FeatureCache();
        const featurePath = path.join(tempDir, 'tags.feature');
        const content = `
@regression
Feature: Blast Radius
  @smoke
  Scenario: Simple Scenario
    Given step

  Scenario Outline: Outline with Examples
    Given step <param>
    Examples:
      | param |
      | 1     |
      | 2     |
      | 3     |
        `;
        fs.writeFileSync(featurePath, content);
        await featureCache.updateFile(vscode.Uri.file(featurePath));
        
        // Feature has @regression, which is inherited by 1 Scenario + 1 Outline (3 examples) = 4 total
        assert.strictEqual(featureCache.getTagBlastRadius('@regression'), 4, '@regression should inherit down to all 4 executable scenarios');
        
        // @smoke is only on the Simple Scenario
        assert.strictEqual(featureCache.getTagBlastRadius('@smoke'), 1, '@smoke should only affect 1 scenario');
    });

    test('AST Fallback: Retains data even with severe syntax errors', async () => {
        const featureCache = new FeatureCache();
        const featurePath = path.join(tempDir, 'syntax_error.feature');
        // This file has an unclosed table which causes parser.parse() to throw an error.
        // If our fallback (builder.getResult()) works, it will still parse the tags above the error.
        const content = `
@salvaged
Feature: Fallback Test
  Scenario: Broken Scenario
    Given unclosed table
      | header1 | header2
        `;
        fs.writeFileSync(featurePath, content);
        
        await featureCache.updateFile(vscode.Uri.file(featurePath));
        
        // If the AST was entirely dropped, this would be 0.
        // Because of our fallback, the AST is salvaged up to the error, retaining the @salvaged tag.
        assert.strictEqual(featureCache.getTagBlastRadius('@salvaged'), 1, 'Tags should still be parsed via AST fallback');
    });
});
