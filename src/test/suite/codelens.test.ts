import * as assert from 'assert';
import * as vscode from 'vscode';
import { BehaveCodeLensProvider } from '../../codelens';

suite('BehaveCodeLensProvider Test Suite', () => {
    test('Provides CodeLens for Feature and Scenarios', async () => {
        const text = `
Feature: Sample
  Scenario: First
    Given a step
  
  Scenario Outline: Second
    Given a <thing>
    Examples:
      | thing |
      | 1     |
`;
        const document = {
            languageId: 'feature',
            getText: () => text,
            uri: vscode.Uri.file('/path/to/test.feature')
        } as unknown as vscode.TextDocument;
        
        const provider = new BehaveCodeLensProvider();
        const cancelToken = new vscode.CancellationTokenSource().token;
        const lenses = await provider.provideCodeLenses(document, cancelToken);
        
        assert.strictEqual(lenses.length, 6, 'Should generate 6 CodeLenses');
        
        // Feature
        assert.strictEqual(lenses[0].command?.title, '▶ Run Feature');
        assert.strictEqual(lenses[0].command?.command, 'gherkinPowerTools.runFeature');
        assert.strictEqual(lenses[0].range.start.line, 1, 'Feature should be on line 1 (0-indexed)');
        
        assert.strictEqual(lenses[1].command?.title, '$(edit)\u00A0Edit');
        assert.strictEqual(lenses[1].command?.command, 'gherkinPowerTools.runFeatureWithArgs');
        assert.strictEqual(lenses[1].range.start.line, 1, 'Feature args lens should be on line 1 (0-indexed)');
        
        // Scenario
        assert.strictEqual(lenses[2].command?.title, '▶ Run Scenario');
        assert.strictEqual(lenses[2].command?.command, 'gherkinPowerTools.runScenario');
        assert.strictEqual(lenses[2].range.start.line, 2, 'Scenario should be on line 2 (0-indexed)');
        assert.strictEqual(lenses[2].command?.arguments?.[1], 3, 'Should pass line number 3 to runScenario command');
        
        assert.strictEqual(lenses[3].command?.title, '$(edit)\u00A0Edit');
        assert.strictEqual(lenses[3].command?.command, 'gherkinPowerTools.runScenarioWithArgs');
        assert.strictEqual(lenses[3].range.start.line, 2, 'Scenario args lens should be on line 2 (0-indexed)');
        assert.strictEqual(lenses[3].command?.arguments?.[1], 3, 'Should pass line number 3 to runScenarioWithArgs command');

        // Scenario Outline
        assert.strictEqual(lenses[4].command?.title, '▶ Run Scenario');
        assert.strictEqual(lenses[4].command?.command, 'gherkinPowerTools.runScenario');
        assert.strictEqual(lenses[4].range.start.line, 5, 'Scenario Outline should be on line 5 (0-indexed)');
        assert.strictEqual(lenses[4].command?.arguments?.[1], 6, 'Should pass line number 6 to runScenario command');

        assert.strictEqual(lenses[5].command?.title, '$(edit)\u00A0Edit');
        assert.strictEqual(lenses[5].command?.command, 'gherkinPowerTools.runScenarioWithArgs');
        assert.strictEqual(lenses[5].range.start.line, 5, 'Scenario Outline args lens should be on line 5 (0-indexed)');
        assert.strictEqual(lenses[5].command?.arguments?.[1], 6, 'Should pass line number 6 to runScenarioWithArgs command');
    });

    test('Ignores non-feature documents', async () => {
        const document = {
            languageId: 'python',
            getText: () => 'print("hello")',
            uri: vscode.Uri.file('/path/to/test.py')
        } as unknown as vscode.TextDocument;
        
        const provider = new BehaveCodeLensProvider();
        const cancelToken = new vscode.CancellationTokenSource().token;
        const lenses = await provider.provideCodeLenses(document, cancelToken);
        
        assert.strictEqual(lenses.length, 0, 'Should not generate CodeLenses for non-feature files');
    });
});
