import * as assert from 'assert';
import * as path from 'path';
import * as fs from 'fs';
import * as vscode from 'vscode';
import { SuppressionEngine, Suppression } from '../../suppressions';

suite('SuppressionEngine Test Suite', () => {
    const testWorkspace = path.join(__dirname, 'test-workspace-suppressions');
    const suppressionsFile = path.join(testWorkspace, '.gherkin-pt-suppressions.json');

    setup(() => {
        if (!fs.existsSync(testWorkspace)) {
            fs.mkdirSync(testWorkspace, { recursive: true });
        }
        if (fs.existsSync(suppressionsFile)) {
            fs.unlinkSync(suppressionsFile);
        }
    });

    teardown(() => {
        if (fs.existsSync(suppressionsFile)) {
            fs.unlinkSync(suppressionsFile);
        }
        if (fs.existsSync(testWorkspace)) {
            fs.rmSync(testWorkspace, { recursive: true, force: true });
        }
    });

    test('Loads empty suppressions if file does not exist', () => {
        const engine = new SuppressionEngine(testWorkspace);
        assert.strictEqual(engine.getSuppressedCount(), 0);
    });

    test('Creates and saves suppressions correctly', () => {
        const engine = new SuppressionEngine(testWorkspace);
        
        const supp: Suppression = {
            ruleId: 'UndefinedStepRule',
            uri: path.join(testWorkspace, 'test.feature')
        };

        engine.addSuppression(supp);
        assert.strictEqual(engine.getSuppressedCount(), 1);

        assert.ok(fs.existsSync(suppressionsFile));
        const content = JSON.parse(fs.readFileSync(suppressionsFile, 'utf8'));
        assert.strictEqual(content.length, 1);
        assert.strictEqual(content[0].ruleId, 'UndefinedStepRule');
        assert.strictEqual(content[0].uri, 'test.feature');
    });

    test('Checks if suppressed based on rule and uri', () => {
        const engine = new SuppressionEngine(testWorkspace);
        
        engine.addSuppression({
            ruleId: 'UndefinedStepRule',
            uri: path.join(testWorkspace, 'test.feature')
        });

        assert.strictEqual(engine.isSuppressed('UndefinedStepRule', vscode.Uri.file(path.join(testWorkspace, 'test.feature'))), true);
        assert.strictEqual(engine.isSuppressed('OtherRule', vscode.Uri.file(path.join(testWorkspace, 'test.feature'))), false);
        assert.strictEqual(engine.isSuppressed('UndefinedStepRule', vscode.Uri.file(path.join(testWorkspace, 'other.feature'))), false);
    });

    test('Checks if suppressed based on scopes', () => {
        const engine = new SuppressionEngine(testWorkspace);
        
        engine.addSuppression({
            ruleId: 'UndefinedStepRule',
            uri: '*',
            scopeType: 'scenario',
            scopeValue: 'My Scenario'
        });

        assert.strictEqual(engine.isSuppressed('UndefinedStepRule', 'any-uri', 'scenario', 'My Scenario'), true);
        assert.strictEqual(engine.isSuppressed('UndefinedStepRule', 'any-uri', 'scenario', 'Other Scenario'), false);
        assert.strictEqual(engine.isSuppressed('UndefinedStepRule', 'any-uri', 'feature', 'My Scenario'), false);
    });

    test('Handles malformed suppressions file', () => {
        fs.writeFileSync(suppressionsFile, '{ malformed json ]', 'utf8');
        const engine = new SuppressionEngine(testWorkspace);
        assert.strictEqual(engine.getSuppressedCount(), 0);
    });

    test('Handles non-array suppressions file', () => {
        fs.writeFileSync(suppressionsFile, '{"not": "array"}', 'utf8');
        const engine = new SuppressionEngine(testWorkspace);
        assert.strictEqual(engine.getSuppressedCount(), 0);
    });
});
