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
            if (diagnostic.code === 'SYNTAX_ERROR') {
                const action = new vscode.CodeAction('Format document', vscode.CodeActionKind.QuickFix);
                action.command = {
                    command: 'editor.action.formatDocument',
                    title: 'Format document'
                };
                action.diagnostics = [diagnostic];
                action.isPreferred = true;
                actions.push(action);
            } else if (diagnostic.code === 'UNDEFINED_STEP') {
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
        // Append snippet to file
        const content = fs.readFileSync(targetUri.fsPath, 'utf8');
        const separator = content.endsWith('\n') ? '' : '\n';
        fs.appendFileSync(targetUri.fsPath, separator + snippet);

        // Open the document and move cursor to the end
        const document = await vscode.workspace.openTextDocument(targetUri);
        const editor = await vscode.window.showTextDocument(document);
        
        // Move cursor to the end
        const lastLine = document.lineCount - 1;
        const endPos = new vscode.Position(lastLine, document.lineAt(lastLine).text.length);
        editor.selection = new vscode.Selection(endPos, endPos);
        editor.revealRange(new vscode.Range(endPos, endPos));
    }
}
