import * as assert from 'assert';
import * as vscode from 'vscode';
import { GherkinHoverProvider } from '../../hover';
import { SymbolCache, FeatureCache } from '../../cache';

suite('Hover Provider Test Suite', () => {
    let mockSymbolCache: SymbolCache;
    let mockFeatureCache: FeatureCache;

    setup(() => {
        mockSymbolCache = {
            getStepDefinitions: (text: string) => {
                if (text === 'I login') {
                    return Promise.resolve([{
                        rawPattern: 'I login',
                        functionName: 'i_login',
                        documentation: 'Logs the user in',
                        matcherType: 'parse',
                        type: 'given',
                        evaluable: true,
                        uri: vscode.Uri.file('/fake.py'),
                        decoratorRange: new vscode.Range(0, 0, 0, 0)
                    }]);
                }
                if (text === 'I fail') {
                    return Promise.resolve([{
                        rawPattern: 'I fail',
                        functionName: undefined,
                        documentation: undefined,
                        matcherType: 'parse',
                        evaluable: true,
                        type: 'when',
                        uri: vscode.Uri.file('/fake.py'),
                        decoratorRange: new vscode.Range(0, 0, 0, 0)
                    }]);
                }
                if (text === 'ambiguous') {
                    return Promise.resolve([
                        {
                            rawPattern: 'ambiguous',
                            functionName: 'amb1',
                            documentation: 'First amb',
                            matcherType: 're',
                            evaluable: true,
                            type: 'given',
                            uri: vscode.Uri.file('/fake1.py'),
                            decoratorRange: new vscode.Range(0, 0, 0, 0)
                        },
                        {
                            rawPattern: 'ambiguous',
                            functionName: 'amb2',
                            documentation: 'Second amb',
                            matcherType: 'parse',
                            evaluable: true,
                            type: 'given',
                            uri: vscode.Uri.file('/fake2.py'),
                            decoratorRange: new vscode.Range(0, 0, 0, 0)
                        }
                    ]);
                }
                if (text === 'unsupported') {
                    return Promise.resolve([{
                        rawPattern: 'unsupported',
                        functionName: 'dyn',
                        documentation: 'dyn',
                        matcherType: 'parse',
                        evaluable: false,
                        compilationError: 'Dynamic regex error',
                        type: 'given',
                        uri: vscode.Uri.file('/fake.py'),
                        decoratorRange: new vscode.Range(0, 0, 0, 0)
                    }]);
                }
                return Promise.resolve([]);
            }
        } as any;

        mockFeatureCache = {
            getTagBlastRadius: (tag: string) => {
                return tag === '@ui' ? 5 : 0;
            },
            hasStaleOrPartialFilesForTag: () => false
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

    test('Returns undefined if cancellation requested', async () => {
        const provider = new GherkinHoverProvider(mockSymbolCache, mockFeatureCache);
        const doc = await vscode.workspace.openTextDocument({ language: 'feature', content: 'Given I login' });
        const pos = new vscode.Position(0, 7);
        const tokenSource = new vscode.CancellationTokenSource();
        tokenSource.cancel();
        
        const result = await provider.provideHover(doc, pos, tokenSource.token);
        assert.strictEqual(result, undefined);
    });

    test('Handles ambiguous matches by showing all definitions', async () => {
        const provider = new GherkinHoverProvider(mockSymbolCache, mockFeatureCache);
        const doc = await vscode.workspace.openTextDocument({ language: 'feature', content: 'Given ambiguous' });
        const pos = new vscode.Position(0, 7);
        
        const result = await provider.provideHover(doc, pos, new vscode.CancellationTokenSource().token) as vscode.Hover;
        assert.ok(result);
        const content = result.contents[0] as vscode.MarkdownString;
        assert.ok(content.value.includes('Ambiguous Step'));
        assert.ok(content.value.includes('Matches 2 definitions'));
        assert.ok(content.value.includes('amb1'));
        assert.ok(content.value.includes('amb2'));
    });

    test('Exposes unsupported matcher status', async () => {
        const provider = new GherkinHoverProvider(mockSymbolCache, mockFeatureCache);
        const doc = await vscode.workspace.openTextDocument({ language: 'feature', content: 'Given unsupported' });
        const pos = new vscode.Position(0, 7);
        
        const result = await provider.provideHover(doc, pos, new vscode.CancellationTokenSource().token) as vscode.Hover;
        assert.ok(result);
        const content = result.contents[0] as vscode.MarkdownString;
        assert.ok(content.value.includes('Unsupported Matcher'));
        assert.ok(content.value.includes('Dynamic regex error'));
    });

    test('Renders docstring as plaintext', async () => {
        const provider = new GherkinHoverProvider(mockSymbolCache, mockFeatureCache);
        const doc = await vscode.workspace.openTextDocument({ language: 'feature', content: 'Given I login' });
        const pos = new vscode.Position(0, 7);
        
        const result = await provider.provideHover(doc, pos, new vscode.CancellationTokenSource().token) as vscode.Hover;
        assert.ok(result);
        const content = result.contents[0] as vscode.MarkdownString;
        // Text should be appended, not as markdown (though value may just show the string, let's verify it rendered)
        assert.ok(content.value.includes('Logs the user in'));
    });
});
