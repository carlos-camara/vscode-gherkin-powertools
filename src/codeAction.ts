import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';

export class GherkinCodeActionProvider implements vscode.CodeActionProvider {
    public static readonly providedCodeActionKinds = [
        vscode.CodeActionKind.QuickFix
    ];

    public provideCodeActions(document: vscode.TextDocument, range: vscode.Range | vscode.Selection, context: vscode.CodeActionContext, token: vscode.CancellationToken): vscode.CodeAction[] {
        const actions: vscode.CodeAction[] = [];

        for (const diagnostic of context.diagnostics) {
            // We removed SYNTAX_ERROR because a document with invalid syntax cannot be formatted.
            if (diagnostic.code === 'UNDEFINED_STEP') {
                const action = new vscode.CodeAction('Create empty step definition', vscode.CodeActionKind.QuickFix);
                
                // Retrieve the keyword from relatedInformation
                const keyword = diagnostic.relatedInformation && diagnostic.relatedInformation.length > 0
                    ? diagnostic.relatedInformation[0].message
                    : 'step';
                
                // Extract step text (remove quotes if any)
                const stepTextMatch = diagnostic.message.match(/Undefined step: "(.*)"/);
                const stepText = stepTextMatch ? stepTextMatch[1] : '';

                action.command = {
                    command: 'gherkinBeautifier.createStepDefinition',
                    title: 'Create empty step definition',
                    arguments: [stepText, keyword]
                };
                action.diagnostics = [diagnostic];
                action.isPreferred = true;
                actions.push(action);
            }
        }

        return actions;
    }
}

/**
 * Handles the creation of a new Python step definition.
 */
export async function createStepDefinition(stepText: string, keyword: string) {
    if (!stepText) return;

    // Normalize keyword to lowercase for python decorators
    let pyKeyword = keyword.toLowerCase().trim();
    if (pyKeyword === 'and' || pyKeyword === 'but' || pyKeyword === '*') {
        pyKeyword = 'step'; // Use @step for generic/continuation keywords
    }

    const snippet = `\n@${pyKeyword}(u'${stepText}')\ndef step_impl(context):\n    raise NotImplementedError(u'STEP: ${stepText}')\n`;

    // Find python files in steps folder
    const pyFiles = await vscode.workspace.findFiles('**/steps/**/*.py', '**/node_modules/**');

    let targetUri: vscode.Uri | undefined;

    if (pyFiles.length === 0) {
        // No step files found. Ask to create a new one.
        const workspaceFolders = vscode.workspace.workspaceFolders;
        if (!workspaceFolders) {
            vscode.window.showErrorMessage("Please open a workspace to create step definitions.");
            return;
        }

        const rootPath = workspaceFolders[0].uri.fsPath;
        const defaultStepsDir = path.join(rootPath, 'features', 'steps');
        const defaultFilePath = path.join(defaultStepsDir, 'step_definitions.py');

        const createAction = "Create features/steps/step_definitions.py";
        const selection = await vscode.window.showInformationMessage(
            "No Python step files found. Would you like to create one?",
            createAction
        );

        if (selection === createAction) {
            fs.mkdirSync(defaultStepsDir, { recursive: true });
            const initialContent = "from behave import *\n";
            fs.writeFileSync(defaultFilePath, initialContent);
            targetUri = vscode.Uri.file(defaultFilePath);
        } else {
            return;
        }
    } else if (pyFiles.length === 1) {
        targetUri = pyFiles[0];
    } else {
        // Multiple files. Ask user to pick one.
        const items = pyFiles.map(uri => ({
            label: vscode.workspace.asRelativePath(uri),
            uri: uri
        }));
        
        const selection = await vscode.window.showQuickPick(items, {
            placeHolder: 'Select a Python file to append the step definition to'
        });

        if (selection) {
            targetUri = selection.uri;
        } else {
            return; // User cancelled
        }
    }

    if (targetUri) {
        const document = await vscode.workspace.openTextDocument(targetUri);
        
        // Use WorkspaceEdit instead of fs to update the file within VS Code's editor state
        const edit = new vscode.WorkspaceEdit();
        const lastLine = document.lineCount > 0 ? document.lineCount - 1 : 0;
        const lastLineLength = document.lineCount > 0 ? document.lineAt(lastLine).text.length : 0;
        const endPos = new vscode.Position(lastLine, lastLineLength);
        
        const fileContent = document.getText();
        const separator = fileContent.length === 0 || fileContent.endsWith('\n') ? '' : '\n';
        
        edit.insert(targetUri, endPos, separator + snippet);
        await vscode.workspace.applyEdit(edit);
        await document.save(); // Automatically save the document

        // Show the document
        const editor = await vscode.window.showTextDocument(document);
        const newEndPos = new vscode.Position(editor.document.lineCount - 1, editor.document.lineAt(editor.document.lineCount - 1).text.length);
        editor.selection = new vscode.Selection(newEndPos, newEndPos);
        editor.revealRange(new vscode.Range(newEndPos, newEndPos));
    }
}
