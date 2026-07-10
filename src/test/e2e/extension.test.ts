import * as assert from 'assert';
import * as vscode from 'vscode';

suite('E2E UI Test Suite', () => {
    test('Simulate user clicking "Format Document"', async () => {
        // 1. Create a temporary messy Gherkin file
        const uri = vscode.Uri.parse('untitled:test.feature');
        const document = await vscode.workspace.openTextDocument(uri);
        const editor = await vscode.window.showTextDocument(document);

        await editor.edit(editBuilder => {
            editBuilder.insert(
                new vscode.Position(0, 0),
                'Feature: Test\nScenario: Foo\ngiven improperly formatted step'
            );
        });

        // Ensure the language is set to Gherkin so our formatter is invoked
        await vscode.languages.setTextDocumentLanguage(document, 'feature');

        // Give the extension a moment to activate if it hasn't already
        const ext = vscode.extensions.getExtension('carlos-camara.vscode-gherkin-beautifier');
        if (ext) {
            await ext.activate();
        }
        await new Promise(resolve => setTimeout(resolve, 1000));

        // 2. The E2E Magic: Execute the native VS Code format command
        // (Simulates the user pressing Shift + Alt + F)
        await vscode.commands.executeCommand('editor.action.formatDocument');
        // Give formatting a moment to apply
        await new Promise(resolve => setTimeout(resolve, 500));

        // 3. Verify that OUR extension reacted to the UI and formatted the text
        const newText = document.getText();
        console.log('--- NEW TEXT ---');
        console.log(newText);
        console.log('----------------');
        
        assert.ok(newText !== 'Feature: Test\nScenario: Foo\ngiven improperly formatted step', 'Formatter did not modify the text');
        assert.ok(newText.includes('  given improperly formatted step'), 'Step was not indented properly');
    });
});
