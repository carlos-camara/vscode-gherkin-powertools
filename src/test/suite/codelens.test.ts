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
        const lines = text.split('\n');
        const document = {
            languageId: 'feature',
            getText: () => text,
            uri: vscode.Uri.file('/path/to/test.feature'),
            lineCount: lines.length,
            lineAt: (i: number) => ({ 
                text: lines[i], 
                firstNonWhitespaceCharacterIndex: lines[i].length - lines[i].trimStart().length 
            })
        } as unknown as vscode.TextDocument;
        
        const provider = new BehaveCodeLensProvider();
        const cancelToken = new vscode.CancellationTokenSource().token;
        const lenses = await provider.provideCodeLenses(document, cancelToken);
        
        assert.strictEqual(lenses.length, 11, 'Should generate 11 CodeLenses');
        
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

        // Example Data Row
        assert.strictEqual(lenses[9].command?.title, '▶');
        assert.strictEqual(lenses[9].command?.command, 'gherkinPowerTools.runScenario');
        assert.strictEqual(lenses[9].range.start.line, 9, 'Example data row should be on line 9 (0-indexed)');
        assert.strictEqual(lenses[9].range.start.character, 6, 'Example data row should align to first non-whitespace (index 6)');
        assert.strictEqual(lenses[9].command?.arguments?.[1], 10, 'Should pass line number 10 to runScenario command');

        assert.strictEqual(lenses[10].command?.title, '🐞');
    });

    test('Ignores non-feature documents', async () => {
        const lines = ['print("hello")'];
        const document = {
            languageId: 'python',
            getText: () => lines.join('\n'),
            uri: vscode.Uri.file('/path/to/test.py'),
            lineCount: lines.length,
            lineAt: (i: number) => ({ 
                text: lines[i], 
                firstNonWhitespaceCharacterIndex: lines[i].length - lines[i].trimStart().length 
            })
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
        const lines = text.split('\n');
        const document = {
            languageId: 'feature',
            getText: () => text,
            uri: vscode.Uri.file('/path/to/test.feature'),
            lineCount: lines.length,
            lineAt: (i: number) => ({ 
                text: lines[i], 
                firstNonWhitespaceCharacterIndex: lines[i].length - lines[i].trimStart().length 
            })
        } as unknown as vscode.TextDocument;
        
        const provider = new BehaveCodeLensProvider();
        const cancelToken = new vscode.CancellationTokenSource().token;
        const lenses = await provider.provideCodeLenses(document, cancelToken);
        
        // 3 for Feature, 3 for Rule, 3 for Rule Scenario
        assert.strictEqual(lenses.length, 9, 'Should generate 9 CodeLenses');
        
        // Check Rule Scenario
        assert.strictEqual(lenses[6].command?.title, '▶ Run Scenario');
        assert.strictEqual(lenses[6].range.start.line, 3, 'Scenario should be on line 3 (0-indexed)');
    });

    test('Stops generating CodeLenses if cancellation is requested', async () => {
        const text = `
Feature: Sample
  Scenario: First
    Given a step
  Scenario: Second
    Given another step
`;
        const lines = text.split('\n');
        const document = {
            languageId: 'feature',
            getText: () => text,
            uri: vscode.Uri.file('/path/to/test.feature'),
            lineCount: lines.length,
            lineAt: (i: number) => ({ 
                text: lines[i], 
                firstNonWhitespaceCharacterIndex: lines[i].length - lines[i].trimStart().length 
            })
        } as unknown as vscode.TextDocument;
        
        const provider = new BehaveCodeLensProvider();
        const cancelTokenSource = new vscode.CancellationTokenSource();
        cancelTokenSource.cancel();
        
        const lenses = await provider.provideCodeLenses(document, cancelTokenSource.token);
        
        // It immediately checks token and breaks, returning 0
        assert.strictEqual(lenses.length, 0, 'Should not generate CodeLenses if cancelled immediately');
    });

    test('Stops generating CodeLenses if cancellation is requested inside Rule', async () => {
        const text = `
Feature: Sample
  Rule: Some rule
    Scenario: First
      Given a step
`;
        const lines = text.split('\n');
        const document = {
            languageId: 'feature',
            getText: () => text,
            uri: vscode.Uri.file('/path/to/test.feature'),
            lineCount: lines.length,
            lineAt: (i: number) => ({ 
                text: lines[i], 
                firstNonWhitespaceCharacterIndex: lines[i].length - lines[i].trimStart().length 
            })
        } as unknown as vscode.TextDocument;
        
        const provider = new BehaveCodeLensProvider();
        
        // Mock token that cancels after Feature is processed
        let callCount = 0;
        const mockToken = {
            get isCancellationRequested() {
                callCount++;
                return callCount > 3; // Line 0 (empty), Line 1 (Feature), Line 2 (Rule) - cancels after Feature
            },
            onCancellationRequested: new vscode.EventEmitter<any>().event
        } as vscode.CancellationToken;
        
        const lenses = await provider.provideCodeLenses(document, mockToken);
        
        assert.strictEqual(lenses.length, 6, 'Should generate feature lenses but stop before scenarios');
    });

    test('Returns empty array on invalid Gherkin', async () => {
        const text = `Invalid syntax completely \n \n`;
        const lines = text.split('\n');
        const document = {
            languageId: 'feature',
            getText: () => text,
            uri: vscode.Uri.file('/path/to/test.feature'),
            lineCount: lines.length,
            lineAt: (i: number) => ({ 
                text: lines[i], 
                firstNonWhitespaceCharacterIndex: lines[i].length - lines[i].trimStart().length 
            })
        } as unknown as vscode.TextDocument;
        
        const provider = new BehaveCodeLensProvider();
        const cancelToken = new vscode.CancellationTokenSource().token;
        const lenses = await provider.provideCodeLenses(document, cancelToken);
        
        assert.strictEqual(lenses.length, 0, 'Should not generate CodeLenses for invalid file');
    });
});
