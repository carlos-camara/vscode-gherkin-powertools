"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.activate = activate;
exports.deactivate = deactivate;
const vscode = require("vscode");
const formatter_1 = require("./formatter");
function activate(context) {
    console.log('Extension "vscode-gherkin-beautifier" is now active.');
    const formatter = new formatter_1.GherkinFormattingEditProvider();
    // Register for 'feature' language (Full Document)
    const disposable = vscode.languages.registerDocumentFormattingEditProvider({ language: 'feature' }, formatter);
    // Register for 'feature' language (Range / Selection)
    const disposableRange = vscode.languages.registerDocumentRangeFormattingEditProvider({ language: 'feature' }, formatter);
    // Also register for 'gherkin' just in case some extensions use it
    const disposable2 = vscode.languages.registerDocumentFormattingEditProvider({ language: 'gherkin' }, formatter);
    const disposableRange2 = vscode.languages.registerDocumentRangeFormattingEditProvider({ language: 'gherkin' }, formatter);
    context.subscriptions.push(disposable, disposableRange, disposable2, disposableRange2);
}
function deactivate() { }
//# sourceMappingURL=extension.js.map