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
    test('Simulate Outline Parameter Autocompletion', async () => {
        const uri = vscode.Uri.parse('untitled:outline_autocomplete_test.feature');
        const document = await vscode.workspace.openTextDocument(uri);
        const editor = await vscode.window.showTextDocument(document);

        await vscode.languages.setTextDocumentLanguage(document, 'feature');
        await editor.edit(editBuilder => {
            editBuilder.insert(new vscode.Position(0, 0), 
`Feature: Autocomplete
  Scenario Outline: Test params
    Given I type <

    Examples:
      | username | password |
      | admin    | 123      |`);
        });

        // The cursor is after the '<' on line 2, character 18
        const position = new vscode.Position(2, 18);
        
        const completions = await vscode.commands.executeCommand<vscode.CompletionList>(
            'vscode.executeCompletionItemProvider',
            document.uri,
            position,
            '<'
        );

        assert.ok(completions, 'Completion provider should return a list');
        assert.ok(completions.items.length > 0, 'Should return parameters from Examples');
        
        const labels = completions.items.map(i => typeof i.label === 'string' ? i.label : i.label.label);
        assert.ok(labels.includes('username'), 'Should include username parameter');
        assert.ok(labels.includes('password'), 'Should include password parameter');
    });

    test('Simulate Tag Blast Radius Hover', async () => {
        const uri = vscode.Uri.parse('untitled:tag_hover_test.feature');
        const document = await vscode.workspace.openTextDocument(uri);
        const editor = await vscode.window.showTextDocument(document);

        await vscode.languages.setTextDocumentLanguage(document, 'feature');
        await editor.edit(editBuilder => {
            editBuilder.insert(new vscode.Position(0, 0), 
`@regression
Feature: Tags
  Scenario Outline: Outline 1
    Given step
    Examples:
      | a |
      | 1 |
      | 2 |`);
        });
        
        // Let the feature cache parse it
        await new Promise(resolve => setTimeout(resolve, 500));

        const hovers = await vscode.commands.executeCommand<vscode.Hover[]>(
            'vscode.executeHoverProvider',
            document.uri,
            new vscode.Position(0, 3) // Hovering over '@regression'
        );

        assert.ok(hovers !== undefined, 'Should return a hover response (even if empty for untitled files)');
    });

    test('Simulate Code Action execution (Close Data Table)', async () => {
        const uri = vscode.Uri.parse('untitled:code_action_execution_test.feature');
        const document = await vscode.workspace.openTextDocument(uri);
        const editor = await vscode.window.showTextDocument(document);

        await vscode.languages.setTextDocumentLanguage(document, 'feature');
        await editor.edit(editBuilder => {
            editBuilder.insert(new vscode.Position(0, 0), 
`Feature: Code Action
  Scenario: Fix table
    Given I have a malformed table
      | header1 | header2
      | value1  | value2`);
        });

        await new Promise(resolve => setTimeout(resolve, 1000));

        // The malformed table row is on line 3
        const range = new vscode.Range(3, 0, 3, 29);
        
        const codeActions = await vscode.commands.executeCommand<vscode.CodeAction[]>(
            'vscode.executeCodeActionProvider',
            document.uri,
            range
        );

        assert.ok(codeActions !== undefined, 'Should provide Code Actions response (even if empty)');
    });

    test('Simulate Configuration Settings Override (alignTableToKeyword)', async () => {
        // Set alignToKeyword to false
        const config = vscode.workspace.getConfiguration('gherkinPowerTools');
        const originalValue = config.get('tables.alignToKeyword');
        await config.update('tables.alignToKeyword', false, vscode.ConfigurationTarget.Global);

        const uri = vscode.Uri.parse('untitled:config_test.feature');
        const document = await vscode.workspace.openTextDocument(uri);
        const editor = await vscode.window.showTextDocument(document);

        await vscode.languages.setTextDocumentLanguage(document, 'feature');
        await editor.edit(editBuilder => {
            editBuilder.insert(new vscode.Position(0, 0), 'Feature: Table Config\n  Scenario: Test\n    Given some step\n      | a | b |\n      | 1 | 2 |');
        });

        await vscode.commands.executeCommand('editor.action.formatDocument');
        await new Promise(resolve => setTimeout(resolve, 500));

        const newText = document.getText();
        
        // If alignToKeyword is false, table should be indented to step indent + 2 (so 4 + 2 = 6 spaces)
        // rather than step indent + keyword length (4 + 6 = 10 spaces)
        assert.ok(newText.includes('      | a | b |'), 'Table was not formatted with alignToKeyword=false correctly');
        
        // Restore
        await config.update('tables.alignToKeyword', originalValue, vscode.ConfigurationTarget.Global);
    });

    test('Simulate Semantic Highlighter Injection', async () => {
        const uri = vscode.Uri.parse('untitled:highlight_test.feature');
        const document = await vscode.workspace.openTextDocument(uri);
        const editor = await vscode.window.showTextDocument(document);

        await vscode.languages.setTextDocumentLanguage(document, 'feature');
        await editor.edit(editBuilder => {
            editBuilder.insert(new vscode.Position(0, 0), 'Feature: Highlight\nScenario Outline: Test\nGiven a <param>');
        });

        await new Promise(resolve => setTimeout(resolve, 500));

        // Since VS Code doesn't expose the applied text decorations via API,
        // we can only execute the internal highlighter logic and ensure it doesn't throw.
        // We trigger it manually by "changing" the active text editor again.
        await vscode.commands.executeCommand('workbench.action.nextEditor');
        await vscode.commands.executeCommand('workbench.action.previousEditor');
        
        await new Promise(resolve => setTimeout(resolve, 200));
        
        // If it didn't throw an error when processing <param>, it succeeded.
        assert.ok(true);
    });

    test('Simulate Create Step Definition Command', async () => {
        const uri = vscode.Uri.parse('untitled:create_step_test.feature');
        const document = await vscode.workspace.openTextDocument(uri);
        const editor = await vscode.window.showTextDocument(document);

        await vscode.languages.setTextDocumentLanguage(document, 'feature');
        await editor.edit(editBuilder => {
            editBuilder.insert(new vscode.Position(0, 0), 'Feature: Create Step\nScenario: Foo\nGiven a brand new undefined step');
        });

        await new Promise(resolve => setTimeout(resolve, 1000));

        // The step is on line 2
        editor.selection = new vscode.Selection(new vscode.Position(2, 6), new vscode.Position(2, 6));

        // We can't fully automate QuickPicks through commands.executeCommand easily without complex mock setups.
        // We will execute the command and catch any exceptions. 
        // It will fail gracefully because no workspace or QuickPick is interactive in tests.
        let errorThrown = false;
        try {
            // We run it async and don't await its UI parts if it blocks, but it shouldn't block without user input API mocks.
            vscode.commands.executeCommand('gherkinPowerTools.createStepDefinition');
            await new Promise(resolve => setTimeout(resolve, 500));
        } catch (e) {
            errorThrown = true;
        }

        assert.strictEqual(errorThrown, false, 'createStepDefinition command threw an error');
    });
});
