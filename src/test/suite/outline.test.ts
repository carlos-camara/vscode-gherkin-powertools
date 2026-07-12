import * as assert from 'assert';
import * as vscode from 'vscode';
import { GherkinDocumentSymbolProvider } from '../../outline';

function createMockDocument(text: string): vscode.TextDocument {
    const lines = text.split('\n');
    return {
        languageId: 'feature',
        getText: () => text,
        lineAt: (line: number) => ({ text: lines[line] }),
        lineCount: lines.length,
        uri: vscode.Uri.parse('file:///mock.feature')
    } as any as vscode.TextDocument;
}

suite('Outline Test Suite', () => {
    let provider: GherkinDocumentSymbolProvider;

    setup(() => {
        provider = new GherkinDocumentSymbolProvider();
    });

    test('Generates symbols for Feature, Scenario, and Steps', async () => {
        const text = `
Feature: Test Feature
  Scenario: Test Scenario
    Given I have a step
    When I take action
    Then I see results
        `.trim();
        const doc = createMockDocument(text);
        const symbols = await provider.provideDocumentSymbols(doc, {} as vscode.CancellationToken);
        
        assert.ok(symbols);
        assert.strictEqual(symbols.length, 1);
        
        const featureSymbol = symbols[0];
        assert.strictEqual(featureSymbol.name, 'Feature: Test Feature');
        assert.strictEqual(featureSymbol.kind, vscode.SymbolKind.Class);
        assert.strictEqual(featureSymbol.children.length, 1);

        const scenarioSymbol = featureSymbol.children[0];
        assert.strictEqual(scenarioSymbol.name, 'Scenario: Test Scenario');
        assert.strictEqual(scenarioSymbol.kind, vscode.SymbolKind.Method);
        assert.strictEqual(scenarioSymbol.children.length, 3);

        const stepSymbol = scenarioSymbol.children[0];
        assert.strictEqual(stepSymbol.name, 'Given I have a step');
        assert.strictEqual(stepSymbol.kind, vscode.SymbolKind.String);
    });

    test('Handles Rule and Background', async () => {
        const text = `
Feature: Feature with Rule
  Rule: A rule
    Background:
      Given a setup
    Scenario: A scenario
      Then it works
        `.trim();
        const doc = createMockDocument(text);
        const symbols = await provider.provideDocumentSymbols(doc, {} as vscode.CancellationToken);
        
        assert.ok(symbols);
        assert.strictEqual(symbols[0].children.length, 1);
        
        const ruleSymbol = symbols[0].children[0];
        assert.strictEqual(ruleSymbol.name, 'Rule: A rule');
        assert.strictEqual(ruleSymbol.kind, vscode.SymbolKind.Namespace);
        assert.strictEqual(ruleSymbol.children.length, 2);

        const backgroundSymbol = ruleSymbol.children[0];
        assert.strictEqual(backgroundSymbol.name, 'Background:');
        
        const scenarioSymbol = ruleSymbol.children[1];
        assert.strictEqual(scenarioSymbol.name, 'Scenario: A scenario');
    });
});
