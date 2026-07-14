import * as assert from 'assert';
import * as vscode from 'vscode';
import { GherkinHighlighter } from '../../highlighter';

suite('Highlighter Test Suite', () => {
    test('Highlights structural, action, and tag keywords correctly', async () => {
        const highlighter = new GherkinHighlighter();
        
        const doc = await vscode.workspace.openTextDocument({
            language: 'feature',
            content: `
            @ui @regression
            Feature: Test Feature
            
            Background:
                Given I log in
                
            Scenario: Test Scenario
                When I do an action
                Then I see results
                And it works
            `
        });

        // We can't easily mock the active text editor in an end-to-end test without opening a real window,
        // but we can open one!
        const editor = await vscode.window.showTextDocument(doc);
        
        // Create a duck-typed mock TextEditor
        const decorationsMap = new Map<vscode.TextEditorDecorationType, vscode.Range[]>();
        const mockEditor = {
            document: doc,
            setDecorations: (decorationType: vscode.TextEditorDecorationType, rangesOrOptions: readonly vscode.Range[] | readonly vscode.DecorationOptions[]) => {
                decorationsMap.set(decorationType, rangesOrOptions as vscode.Range[]);
            }
        } as any as vscode.TextEditor;

        highlighter.highlight(mockEditor);

        // We have 3 decoration types internally, we just know that 3 types were set
        assert.strictEqual(decorationsMap.size, 3);
        
        let totalTags = 0;
        let totalStructures = 0;
        let totalActions = 0;
        
        decorationsMap.forEach((ranges) => {
            // Depending on the length of ranges, we can infer which decoration it is
            // tags: @ui, @regression -> 2
            // structures: Feature, Background, Scenario -> 3
            // actions: Given, When, Then, And -> 4
            if (ranges.length === 2) totalTags = 2;
            if (ranges.length === 3) totalStructures = 3;
            if (ranges.length === 4) totalActions = 4;
        });

        assert.strictEqual(totalTags, 2, 'Should find 2 tags');
        assert.strictEqual(totalStructures, 3, 'Should find 3 structural keywords');
        assert.strictEqual(totalActions, 4, 'Should find 4 action keywords');

        highlighter.dispose();
    });

    test('Does not highlight non-feature files', async () => {
        const highlighter = new GherkinHighlighter();
        const doc = await vscode.workspace.openTextDocument({
            language: 'plaintext',
            content: 'Feature: Not a feature'
        });
        let called = false;
        const mockEditor = {
            document: doc,
            setDecorations: () => { called = true; }
        } as any as vscode.TextEditor;
        
        highlighter.highlight(mockEditor);
        assert.strictEqual(called, false);
        
        highlighter.dispose();
    });
});
