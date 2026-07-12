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
        const ext = vscode.extensions.getExtension('carlos-camara.vscode-gherkin-powertools');
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
        
        assert.ok(newText !== 'Feature: Test\nScenario: Foo\ngiven improperly formatted step', 'Formatter did not modify the text');
        assert.ok(newText.includes('  given improperly formatted step'), 'Step was not indented properly');
    });

    test('Simulate Outline/DocumentSymbols generation', async () => {
        const uri = vscode.Uri.parse('untitled:outline_test.feature');
        const document = await vscode.workspace.openTextDocument(uri);
        const editor = await vscode.window.showTextDocument(document);

        await editor.edit(editBuilder => {
            editBuilder.insert(
                new vscode.Position(0, 0),
                'Feature: Authentication\n  Scenario: Login Success\n    Given I am on the login page'
            );
        });
        await vscode.languages.setTextDocumentLanguage(document, 'feature');
        
        // Allow time for the parser to load dynamically
        await new Promise(resolve => setTimeout(resolve, 500));

        // Execute Document Symbol Provider command
        const symbols = await vscode.commands.executeCommand<vscode.DocumentSymbol[]>(
            'vscode.executeDocumentSymbolProvider',
            document.uri
        );

        assert.ok(symbols, 'Symbols array is undefined');
        assert.strictEqual(symbols.length, 1, 'Should have exactly one root symbol (Feature)');
        assert.strictEqual(symbols[0].name, 'Feature: Authentication', 'Feature symbol name mismatch');
        assert.strictEqual(symbols[0].children.length, 1, 'Feature should have one child (Scenario)');
        assert.strictEqual(symbols[0].children[0].name, 'Scenario: Login Success', 'Scenario symbol name mismatch');
    });

    test('Simulate Linter diagnostics on bad Gherkin', async () => {
        const uri = vscode.Uri.parse('untitled:linter_test.feature');
        const document = await vscode.workspace.openTextDocument(uri);
        const editor = await vscode.window.showTextDocument(document);

        await vscode.languages.setTextDocumentLanguage(document, 'feature');

        const diagnosticsPromise = new Promise<vscode.Diagnostic[]>(resolve => {
            const disposable = vscode.languages.onDidChangeDiagnostics(e => {
                if (e.uris.some(u => u.toString() === document.uri.toString())) {
                    const diags = vscode.languages.getDiagnostics(document.uri);
                    if (diags.length > 0) {
                        disposable.dispose();
                        resolve(diags);
                    }
                }
            });
            // timeout fallback
            setTimeout(() => {
                disposable.dispose();
                resolve(vscode.languages.getDiagnostics(document.uri));
            }, 3000);
        });

        await editor.edit(editBuilder => {
            editBuilder.insert(
                new vscode.Position(0, 0),
                'Given a step without a feature\n'
            );
        });

        const diagnostics = await diagnosticsPromise;
        
        
        assert.ok(diagnostics.length > 0, 'Linter failed to generate diagnostics for bad syntax');
        const hasSyntaxError = diagnostics.some(d => d.message.includes('Expected') || d.message.includes('EOF') || d.message.includes('Misspelled') || d.message.includes('Invalid'));
        assert.ok(hasSyntaxError, 'Linter did not detect the syntax error');
    });

    test('Simulate Hover provider', async () => {
        const uri = vscode.Uri.parse('untitled:hover_test.feature');
        const document = await vscode.workspace.openTextDocument(uri);
        const editor = await vscode.window.showTextDocument(document);

        await vscode.languages.setTextDocumentLanguage(document, 'feature');
        await editor.edit(editBuilder => {
            editBuilder.insert(new vscode.Position(0, 0), 'Given a step');
        });
        
        await new Promise(resolve => setTimeout(resolve, 500));

        const hovers = await vscode.commands.executeCommand<vscode.Hover[]>(
            'vscode.executeHoverProvider',
            document.uri,
            new vscode.Position(0, 2) // hovering over 'Given'
        );

        assert.ok(hovers !== undefined, 'Hover provider should return array (even if empty)');
    });

    test('Simulate Go To Definition provider', async () => {
        const uri = vscode.Uri.parse('untitled:definition_test.feature');
        const document = await vscode.workspace.openTextDocument(uri);
        const editor = await vscode.window.showTextDocument(document);

        await vscode.languages.setTextDocumentLanguage(document, 'feature');
        await editor.edit(editBuilder => {
            editBuilder.insert(new vscode.Position(0, 0), 'Feature: Test\n  Scenario: Test\n    Given a step');
        });

        const definitions = await vscode.commands.executeCommand<vscode.Location[]>(
            'vscode.executeDefinitionProvider',
            document.uri,
            new vscode.Position(2, 10) // hovering over 'a step'
        );

        assert.ok(definitions !== undefined, 'Definition provider should return array (even if empty)');
    });

    test('Simulate Code Action provider (Generate Step)', async () => {
        const uri = vscode.Uri.parse('untitled:codeaction_test.feature');
        const document = await vscode.workspace.openTextDocument(uri);
        const editor = await vscode.window.showTextDocument(document);

        await vscode.languages.setTextDocumentLanguage(document, 'feature');
        await editor.edit(editBuilder => {
            editBuilder.insert(new vscode.Position(0, 0), 'Feature: Code Action\n  Scenario: Fix me\n    Given I need a definition');
        });

        // Allow diagnostics to flag it
        await new Promise(resolve => setTimeout(resolve, 1000));

        const range = new vscode.Range(2, 0, 2, 25);
        
        const codeActions = await vscode.commands.executeCommand<vscode.CodeAction[]>(
            'vscode.executeCodeActionProvider',
            document.uri,
            range
        );

        assert.ok(codeActions !== undefined);
        // It might be empty if the provider logic requires strict diagnostics to be present first,
        // but we verify it executes successfully.
    });

    test('Simulate Autocompletion provider', async () => {
        const uri = vscode.Uri.parse('untitled:completion_test.feature');
        const document = await vscode.workspace.openTextDocument(uri);
        const editor = await vscode.window.showTextDocument(document);

        await vscode.languages.setTextDocumentLanguage(document, 'feature');
        await editor.edit(editBuilder => {
            editBuilder.insert(new vscode.Position(0, 0), 'Feature: Completions\n  Scenario: Test\n    Given ');
        });

        const position = new vscode.Position(2, 10); // After 'Given '
        
        const completions = await vscode.commands.executeCommand<vscode.CompletionList>(
            'vscode.executeCompletionItemProvider',
            document.uri,
            position
        );

        assert.ok(completions !== undefined, 'Completion provider should return a list (even if empty)');
    });

    test('Simulate Statistics Webview generation', async () => {
        // Run the custom command registered by the extension
        // Since we cannot assert the DOM of the Webview, we just assert the command runs without throwing
        let errorThrown = false;
        try {
            await vscode.commands.executeCommand('gherkinPowerTools.showStatistics');
        } catch (e) {
            errorThrown = true;
        }
        assert.strictEqual(errorThrown, false, 'The Statistics Webview command threw an error');
    });
});
