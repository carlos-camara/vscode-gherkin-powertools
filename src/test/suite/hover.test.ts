import * as assert from 'assert';
import * as vscode from 'vscode';
import { GherkinHoverProvider } from '../../hover';
import { SymbolCache, FeatureCache } from '../../cache';

suite('Hover Provider Test Suite', () => {
    let mockSymbolCache: SymbolCache;
    let mockFeatureCache: FeatureCache;

    setup(() => {
        mockSymbolCache = {
            getStepDefinition: (text: string) => {
                if (text === 'I login') {
                    return Promise.resolve({
                        rawPattern: 'I login',
                        functionName: 'i_login',
                        documentation: 'Logs the user in',
                        matcherType: 'parse',
                        type: 'given',
                        uri: vscode.Uri.file('/fake.py'),
                        decoratorRange: new vscode.Range(0, 0, 0, 0)
                    });
                }
                if (text === 'I fail') {
                    return Promise.resolve({
                        rawPattern: 'I fail',
                        functionName: undefined,
                        documentation: undefined,
                        matcherType: 'parse',
                        type: 'when',
                        uri: vscode.Uri.file('/fake.py'),
                        decoratorRange: new vscode.Range(0, 0, 0, 0)
                    });
                }
                return Promise.resolve(null);
            }
        } as any;

        mockFeatureCache = {
            getTagBlastRadius: (tag: string) => {
                return tag === '@ui' ? 5 : 0;
            }
        } as any;
    });

    test('Provides hover for tags', async () => {
        const provider = new GherkinHoverProvider(mockSymbolCache, mockFeatureCache);
        const doc = await vscode.workspace.openTextDocument({ language: 'feature', content: '@ui' });
        const pos = new vscode.Position(0, 1);
        
        const result = await provider.provideHover(doc, pos, new vscode.CancellationTokenSource().token) as vscode.Hover;
        assert.ok(result);
        const content = result.contents[0] as vscode.MarkdownString;
        assert.ok(content.value.includes('**5** scenarios'));
    });

    test('Provides hover for steps with docstring', async () => {
        const provider = new GherkinHoverProvider(mockSymbolCache, mockFeatureCache);
        const doc = await vscode.workspace.openTextDocument({ language: 'feature', content: 'Given I login' });
        const pos = new vscode.Position(0, 7);
        
        const result = await provider.provideHover(doc, pos, new vscode.CancellationTokenSource().token) as vscode.Hover;
        assert.ok(result);
        const content = result.contents[0] as vscode.MarkdownString;
        assert.ok(content.value.includes('def i_login(context, ...):'));
        assert.ok(content.value.includes('Logs the user in'));
        assert.ok(content.value.includes('`parse`'));
    });

    test('Provides hover for steps without docstring/signature', async () => {
        const provider = new GherkinHoverProvider(mockSymbolCache, mockFeatureCache);
        const doc = await vscode.workspace.openTextDocument({ language: 'feature', content: 'When I fail' });
        const pos = new vscode.Position(0, 7);
        
        const result = await provider.provideHover(doc, pos, new vscode.CancellationTokenSource().token) as vscode.Hover;
        assert.ok(result);
        const content = result.contents[0] as vscode.MarkdownString;
        assert.ok(content.value.includes('@when(\'I fail\')'));
    });

    test('Returns undefined for unknown steps', async () => {
        const provider = new GherkinHoverProvider(mockSymbolCache, mockFeatureCache);
        const doc = await vscode.workspace.openTextDocument({ language: 'feature', content: 'Given unknown step' });
        const pos = new vscode.Position(0, 7);
        
        const result = await provider.provideHover(doc, pos, new vscode.CancellationTokenSource().token);
        assert.strictEqual(result, undefined);
    });

    test('Returns undefined for empty lines', async () => {
        const provider = new GherkinHoverProvider(mockSymbolCache, mockFeatureCache);
        const doc = await vscode.workspace.openTextDocument({ language: 'feature', content: '   ' });
        const pos = new vscode.Position(0, 1);
        
        const result = await provider.provideHover(doc, pos, new vscode.CancellationTokenSource().token);
        assert.strictEqual(result, undefined);
    });
});
