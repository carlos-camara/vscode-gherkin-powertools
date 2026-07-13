import * as assert from 'assert';
import * as vscode from 'vscode';
import { GherkinCompletionProvider } from '../../completion';
import { SymbolCache, StepDefinition } from '../../cache';

function createMockDocument(text: string, lineIndex: number): [vscode.TextDocument, vscode.Position] {
    const lines = text.split('\n');
    const doc = {
        languageId: 'feature',
        getText: () => text,
        lineAt: (lineOrPos: any) => ({ text: lines[typeof lineOrPos === 'number' ? lineOrPos : lineOrPos.line] }),
        lineCount: lines.length,
        uri: vscode.Uri.parse('file:///mock.feature')
    } as any as vscode.TextDocument;
    
    // Position at the end of the specified line
    const pos = new vscode.Position(lineIndex, lines[lineIndex].length);
    return [doc, pos];
}

suite('Completion Test Suite', () => {
    let provider: GherkinCompletionProvider;
    let mockCache: SymbolCache;

    setup(() => {
        mockCache = new SymbolCache();
        
        // Mock the cache with some step definitions
        const steps: StepDefinition[] = [
            {
                patternText: 'I have {count} apples',
                regex: /I have {count} apples/,
                location: new vscode.Location(vscode.Uri.parse('file:///steps.py'), new vscode.Position(0, 0))
            },
            {
                patternText: 'I eat (?P<amount>\\d+) apples',
                regex: /dummy/,
                location: new vscode.Location(vscode.Uri.parse('file:///steps.py'), new vscode.Position(1, 0))
            }
        ];
        
        // Override the cache method for testing
        mockCache.getAllStepPatterns = () => steps.map(s => s.patternText);
        
        provider = new GherkinCompletionProvider(mockCache);
    });

    test('Provides completion items for Given step', async () => {
        const text = `
Feature: Test
  Scenario: Test
    Given I ha
        `.trim();
        // Line index 2 is "    Given I ha"
        const [doc, pos] = createMockDocument(text, 2);
        
        const completions = await provider.provideCompletionItems(doc, pos, {} as vscode.CancellationToken, {} as vscode.CompletionContext) as vscode.CompletionItem[];
        
        assert.ok(completions);
        assert.strictEqual(completions.length, 2);
        
        // Check first completion snippet conversion for {count}
        const item1 = completions.find(c => c.filterText === 'I have {count} apples');
        assert.ok(item1);
        assert.ok(item1.insertText instanceof vscode.SnippetString);
        assert.strictEqual(item1.insertText.value, 'I have \${1:count} apples');
        
        // Check second completion snippet conversion for (?P<amount>\d+)
        const item2 = completions.find(c => c.filterText === 'I eat (?P<amount>\\d+) apples');
        assert.ok(item2);
        assert.ok(item2.insertText instanceof vscode.SnippetString);
        assert.strictEqual(item2.insertText.value, 'I eat \${1:amount} apples');
    });

    test('Does not provide completions without a keyword', async () => {
        const text = `
Feature: Test
  Scenario: Test
    I ha
        `.trim();
        const [doc, pos] = createMockDocument(text, 2);
        
        const completions = await provider.provideCompletionItems(doc, pos, {} as vscode.CancellationToken, {} as vscode.CompletionContext);
        assert.strictEqual(completions, undefined);
    });

    test('Provides parameter completions for Scenario Outline Examples', async () => {
        const text = `
Feature: Test
  Scenario Outline: Test Outline
    Given I type <us
  
    Examples:
      | username | password |
      | admin    | 12345    |
        `.trim();
        // Line index 2 is "    Given I type <us"
        const [doc, pos] = createMockDocument(text, 2);
        
        const completions = await provider.provideCompletionItems(doc, pos, {} as vscode.CancellationToken, {} as vscode.CompletionContext) as vscode.CompletionItem[];
        
        assert.ok(completions);
        assert.strictEqual(completions.length, 2);
        
        const labels = completions.map(c => typeof c.label === 'string' ? c.label : c.label.label);
        assert.ok(labels.includes('username'));
        assert.ok(labels.includes('password'));
        
        // Ensure insert text has closing bracket
        const userItem = completions.find(c => (typeof c.label === 'string' ? c.label : c.label.label) === 'username');
        assert.ok(userItem?.insertText instanceof vscode.SnippetString);
        assert.strictEqual(userItem?.insertText.value, 'username>$0');
    });
});
