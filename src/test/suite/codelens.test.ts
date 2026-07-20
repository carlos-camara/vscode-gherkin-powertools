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
        
        assert.strictEqual(lenses.length, 9, 'Should generate 9 CodeLenses');
        
        // Feature
        assert.strictEqual(lenses[0].command?.title, '▶ Run Feature');
        assert.strictEqual(lenses[0].command?.command, 'gherkinPowerTools.runFeature');
        assert.strictEqual(lenses[0].range.start.line, 1, 'Feature should be on line 1 (0-indexed)');
        
        assert.strictEqual(lenses[1].command?.title, '🐞 Debug');
        
        assert.strictEqual(lenses[2].command?.title, '$(edit) Edit');
        assert.strictEqual(lenses[2].command?.command, 'gherkinPowerTools.runFeatureWithArgs');
        assert.strictEqual(lenses[2].range.start.line, 1, 'Feature args lens should be on line 1 (0-indexed)');
        
        // Scenario
        assert.strictEqual(lenses[3].command?.title, '▶ Run Scenario');
        assert.strictEqual(lenses[3].command?.command, 'gherkinPowerTools.runScenario');
        assert.strictEqual(lenses[3].range.start.line, 2, 'Scenario should be on line 2 (0-indexed)');
        assert.strictEqual(lenses[3].command?.arguments?.[1], 3, 'Should pass line number 3 to runScenario command');
        
        assert.strictEqual(lenses[4].command?.title, '🐞 Debug');
        
        assert.strictEqual(lenses[5].command?.title, '$(edit) Edit');
        assert.strictEqual(lenses[5].command?.command, 'gherkinPowerTools.runScenarioWithArgs');
        assert.strictEqual(lenses[5].range.start.line, 2, 'Scenario args lens should be on line 2 (0-indexed)');
        assert.strictEqual(lenses[5].command?.arguments?.[1], 3, 'Should pass line number 3 to runScenarioWithArgs command');

        // Scenario Outline
        assert.strictEqual(lenses[6].command?.title, '▶ Run Scenario');
        assert.strictEqual(lenses[6].command?.command, 'gherkinPowerTools.runScenario');
        assert.strictEqual(lenses[6].range.start.line, 5, 'Scenario Outline should be on line 5 (0-indexed)');
        assert.strictEqual(lenses[6].command?.arguments?.[1], 6, 'Should pass line number 6 to runScenario command');

        assert.strictEqual(lenses[7].command?.title, '🐞 Debug');

        assert.strictEqual(lenses[8].command?.title, '$(edit) Edit');
        assert.strictEqual(lenses[8].command?.command, 'gherkinPowerTools.runScenarioWithArgs');
        assert.strictEqual(lenses[8].range.start.line, 5, 'Scenario Outline args lens should be on line 5 (0-indexed)');
        assert.strictEqual(lenses[8].command?.arguments?.[1], 6, 'Should pass line number 6 to runScenarioWithArgs command');
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

    test('Provides CodeLens for Rules', async () => {
        const text = `
Feature: Sample with Rules
  Rule: A rule
    Scenario: Rule Scenario
      Given a step inside rule
`;
        const document = {
            languageId: 'feature',
            getText: () => text,
            uri: vscode.Uri.file('/path/to/test.feature')
        } as unknown as vscode.TextDocument;
        
        const provider = new BehaveCodeLensProvider();
        const cancelToken = new vscode.CancellationTokenSource().token;
        const lenses = await provider.provideCodeLenses(document, cancelToken);
        
        // 3 for Feature, 0 for Rule (we don't run rules directly), 3 for Rule Scenario
        assert.strictEqual(lenses.length, 6, 'Should generate 6 CodeLenses');
        
        // Check Rule Scenario
        assert.strictEqual(lenses[3].command?.title, '▶ Run Scenario');
        assert.strictEqual(lenses[3].range.start.line, 3, 'Scenario should be on line 3 (0-indexed)');
    });

    test('Stops generating CodeLenses if cancellation is requested', async () => {
        const text = `
Feature: Sample
  Scenario: First
    Given a step
  Scenario: Second
    Given another step
`;
        const document = {
            languageId: 'feature',
            getText: () => text,
            uri: vscode.Uri.file('/path/to/test.feature')
        } as unknown as vscode.TextDocument;
        
        const provider = new BehaveCodeLensProvider();
        const cancelTokenSource = new vscode.CancellationTokenSource();
        cancelTokenSource.cancel();
        
        const lenses = await provider.provideCodeLenses(document, cancelTokenSource.token);
        
        // It should still give the feature lenses before the loop, but break on children
        assert.strictEqual(lenses.length, 3, 'Should only generate Feature CodeLenses and stop');
    });

    test('Stops generating CodeLenses if cancellation is requested inside Rule', async () => {
        const text = `
Feature: Sample
  Rule: Some rule
    Scenario: First
      Given a step
`;
        const document = {
            languageId: 'feature',
            getText: () => text,
            uri: vscode.Uri.file('/path/to/test.feature')
        } as unknown as vscode.TextDocument;
        
        const provider = new BehaveCodeLensProvider();
        
        // Mock token that cancels after Feature is processed
        let callCount = 0;
        const mockToken = {
            get isCancellationRequested() {
                callCount++;
                return callCount > 1; // Cancels when inside the Rule loop
            },
            onCancellationRequested: new vscode.EventEmitter<any>().event
        } as vscode.CancellationToken;
        
        const lenses = await provider.provideCodeLenses(document, mockToken);
        
        // Should have feature lenses, but no scenario inside rule because it got cancelled
        assert.strictEqual(lenses.length, 3, 'Should not generate scenario lenses if cancelled inside rule');
    });

    test('Returns empty array on invalid Gherkin', async () => {
        const text = `Invalid syntax completely \n \n`;
        const document = {
            languageId: 'feature',
            getText: () => text,
            uri: vscode.Uri.file('/path/to/test.feature')
        } as unknown as vscode.TextDocument;
        
        const provider = new BehaveCodeLensProvider();
        const cancelToken = new vscode.CancellationTokenSource().token;
        const lenses = await provider.provideCodeLenses(document, cancelToken);
        
        assert.strictEqual(lenses.length, 0, 'Should not generate CodeLenses for invalid file');
    });
});
