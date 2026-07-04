import * as vscode from 'vscode';
import { AstBuilder, GherkinClassicTokenMatcher, Parser } from '@cucumber/gherkin';
import { IdGenerator } from '@cucumber/messages';

/**
 * Diagnostic Provider that acts as a realtime Linter for Gherkin files.
 * It uses the official @cucumber/gherkin AST parser to catch syntax errors instantly.
 */
export class GherkinLinter {
    private diagnosticCollection: vscode.DiagnosticCollection;
    private builder: AstBuilder;
    private matcher: GherkinClassicTokenMatcher;
    private parser: Parser<any>;

    constructor() {
        this.diagnosticCollection = vscode.languages.createDiagnosticCollection('gherkin');
        
        const uuidFn = IdGenerator.uuid();
        this.builder = new AstBuilder(uuidFn);
        this.matcher = new GherkinClassicTokenMatcher();
        this.parser = new Parser(this.builder, this.matcher);
    }

    /**
     * Lints the document and applies diagnostics.
     * @param document The VS Code text document to lint.
     */
    public lint(document: vscode.TextDocument) {
        if (document.languageId !== 'feature' && document.languageId !== 'gherkin') {
            return;
        }

        const diagnostics: vscode.Diagnostic[] = [];
        const text = document.getText();

        try {
            // We parse the document to catch syntax errors
            this.parser.parse(text);
        } catch (e: any) {
            // @cucumber/gherkin throws an array of errors for syntax issues
            const errors = Array.isArray(e.errors) ? e.errors : [e];
            
            for (const error of errors) {
                if (error.location && typeof error.location.line === 'number') {
                    // AST locations are 1-indexed, VS Code positions are 0-indexed
                    const lineIndex = Math.max(0, error.location.line - 1);
                    const lineText = document.lineAt(lineIndex).text;
                    
                    // Column from AST is 1-indexed. If not present or 0, default to first non-whitespace char.
                    let startChar = error.location.column ? Math.max(0, error.location.column - 1) : 0;
                    if (startChar === 0) {
                        const firstWordMatch = lineText.match(/\\S+/);
                        startChar = firstWordMatch ? lineText.indexOf(firstWordMatch[0]) : 0;
                    }
                    
                    // Try to highlight the word at the error column, or just the rest of the line
                    const matchRest = lineText.substring(startChar).match(/\\S+/);
                    const endChar = matchRest ? startChar + matchRest[0].length : lineText.length;

                    const range = new vscode.Range(lineIndex, startChar, lineIndex, Math.max(startChar + 1, endChar));
                    
                    // Format the error message cleanly
                    let message = error.message;
                    if (message.includes('expected:')) {
                        // Simplify the technical cucumber token names for the user
                        message = 'Invalid Gherkin syntax. Expected a valid keyword (Feature, Scenario, Given, When, Then, etc.)';
                    } else {
                        // Strip the (line:col): prefix from the error message if present
                        message = message.replace(/^\\(\\d+:\\d+\\):\\s*/, '');
                    }

                    const diagnostic = new vscode.Diagnostic(
                        range,
                        message,
                        vscode.DiagnosticSeverity.Error
                    );
                    diagnostic.source = 'Gherkin Parser';
                    diagnostics.push(diagnostic);
                }
            }
        }

        this.diagnosticCollection.set(document.uri, diagnostics);
    }

    /**
     * Clears diagnostics for a specific document.
     */
    public clear(document: vscode.TextDocument) {
        this.diagnosticCollection.delete(document.uri);
    }

    /**
     * Disposes the diagnostic collection.
     */
    public dispose() {
        this.diagnosticCollection.dispose();
    }
}
