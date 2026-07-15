import * as assert from 'assert';
import * as vscode from 'vscode';
import { GherkinDefinitionProvider } from '../../definition';
import { SymbolCache } from '../../cache';

suite('Definition Provider Test Suite', () => {
    let mockCache: SymbolCache;

    setup(() => {
        // We'll mock the cache with a simple stub
        mockCache = {
            getStepDefinitions: (text: string) => {
                if (text === 'I login') {
                    return Promise.resolve([{ uri: vscode.Uri.file('/fake/path.py'), decoratorRange: new vscode.Range(0, 0, 0, 0) }] as any);
                }
                return Promise.resolve([]);
            }
        } as any;
    });

    test('Returns definition for valid step', async () => {
        const provider = new GherkinDefinitionProvider(mockCache);
        
        const doc = await vscode.workspace.openTextDocument({
            language: 'feature',
            content: 'Given I login'
        });
        
        const token = new vscode.CancellationTokenSource().token;
        const pos = new vscode.Position(0, 7); // inside 'I login'
        
        const result = await provider.provideDefinition(doc, pos, token) as vscode.Location[];
        assert.ok(result);
        assert.strictEqual(result.length, 1);
        assert.strictEqual(result[0].uri.fsPath.endsWith('path.py'), true);
    });

    test('Returns null for non-step line', async () => {
        const provider = new GherkinDefinitionProvider(mockCache);
        
        const doc = await vscode.workspace.openTextDocument({
            language: 'feature',
            content: 'Feature: Some feature'
        });
        
        const token = new vscode.CancellationTokenSource().token;
        const pos = new vscode.Position(0, 0);
        
        const result = await provider.provideDefinition(doc, pos, token);
        assert.strictEqual(result, null);
    });

    test('Returns null if cancellation requested', async () => {
        const provider = new GherkinDefinitionProvider(mockCache);
        
        const doc = await vscode.workspace.openTextDocument({
            language: 'feature',
            content: 'Given I login'
        });
        
        const tokenSource = new vscode.CancellationTokenSource();
        tokenSource.cancel();
        const pos = new vscode.Position(0, 0);
        
        const result = await provider.provideDefinition(doc, pos, tokenSource.token);
        assert.strictEqual(result, null);
    });
});
