"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GherkinFormattingEditProvider = void 0;
const vscode = require("vscode");
class GherkinFormattingEditProvider {
    getOptions() {
        const config = vscode.workspace.getConfiguration('gherkinBeautifier');
        return {
            stepIndentation: config.get('indentation.steps', 4),
            alignTableToKeyword: config.get('tables.alignToKeyword', true)
        };
    }
    provideDocumentFormattingEdits(document, options, token) {
        const edits = [];
        const lines = [];
        const formatOptions = this.getOptions();
        for (let i = 0; i < document.lineCount; i++) {
            lines.push(document.lineAt(i).text);
        }
        const formattedLines = this.formatGherkin(lines, formatOptions.stepIndentation, formatOptions);
        const start = new vscode.Position(0, 0);
        const end = new vscode.Position(document.lineCount, 0);
        const range = new vscode.Range(start, end);
        edits.push(vscode.TextEdit.replace(range, formattedLines.join('\n') + '\n'));
        return edits;
    }
    provideDocumentRangeFormattingEdits(document, range, options, token) {
        const edits = [];
        const lines = [];
        const formatOptions = this.getOptions();
        const startLine = range.start.line;
        const endLine = range.end.line;
        for (let i = startLine; i <= endLine; i++) {
            lines.push(document.lineAt(i).text);
        }
        let initialStepIndent = formatOptions.stepIndentation;
        if (startLine > 0) {
            const prevLine = document.lineAt(startLine - 1).text;
            const match = prevLine.trimStart().match(/^(Given|When|Then|And|But|\*)\s+(.*)/i);
            if (match) {
                const keywordLength = match[1].length;
                const baseIndent = prevLine.length - prevLine.trimStart().length;
                if (formatOptions.alignTableToKeyword) {
                    initialStepIndent = baseIndent + keywordLength + 1;
                }
                else {
                    initialStepIndent = baseIndent + 2;
                }
            }
        }
        const formattedLines = this.formatGherkin(lines, initialStepIndent, formatOptions);
        const formatRange = new vscode.Range(new vscode.Position(startLine, 0), new vscode.Position(endLine, document.lineAt(endLine).text.length));
        edits.push(vscode.TextEdit.replace(formatRange, formattedLines.join('\n')));
        return edits;
    }
    formatGherkin(lines, initialStepIndent = 4, options = { stepIndentation: 4, alignTableToKeyword: true }) {
        const result = [];
        let inTable = false;
        let tableLines = [];
        let tagBuffer = [];
        let lastStepIndent = initialStepIndent;
        for (let i = 0; i < lines.length; i++) {
            let line = lines[i].trim(); // This inherently trims trailing whitespace
            // Normalize Example Variables: < email > to <email>
            line = line.replace(/< *([\w\s-]+?) *>/g, (match, inner) => '<' + inner.trim() + '>');
            if (line.startsWith('|') && line.endsWith('|')) {
                inTable = true;
                tableLines.push(line);
            }
            else {
                if (inTable) {
                    result.push(...this.alignTable(tableLines, lastStepIndent));
                    tableLines = [];
                    inTable = false;
                }
                if (line !== '') {
                    if (line.startsWith('@')) {
                        tagBuffer.push(...line.split(/\s+/).filter(t => t.startsWith('@')));
                        continue;
                    }
                    if (tagBuffer.length > 0) {
                        const nextLower = line.toLowerCase();
                        const tagIndent = nextLower.startsWith('feature:') ? 0 : 2;
                        // Check spacing before blocks/tags
                        if (result.length > 0) {
                            const lastLine = result[result.length - 1];
                            if (lastLine.trim() !== '') {
                                result.push('');
                            }
                        }
                        result.push(...this.formatTags(tagBuffer, tagIndent));
                        tagBuffer = [];
                    }
                    const indentedLine = this.indentLine(line, options);
                    const lowerLine = line.toLowerCase();
                    if (lowerLine.match(/^(given|when|then|and|but|\*|examples:)/)) {
                        const match = indentedLine.trimStart().match(/^(Given|When|Then|And|But|\*)\s+(.*)/i);
                        const baseIndent = indentedLine.length - indentedLine.trimStart().length;
                        if (options.alignTableToKeyword && match) {
                            const keywordLength = match[1].length;
                            lastStepIndent = baseIndent + keywordLength + 1;
                        }
                        else {
                            lastStepIndent = baseIndent + 2;
                        }
                    }
                    const isNewBlock = lowerLine.startsWith('scenario:') ||
                        lowerLine.startsWith('scenario outline:') ||
                        lowerLine.startsWith('background:') ||
                        lowerLine.startsWith('rule:');
                    if (isNewBlock && result.length > 0) {
                        const lastLine = result[result.length - 1];
                        if (lastLine.trim() !== '' && !lastLine.trim().startsWith('@')) {
                            result.push('');
                        }
                    }
                    result.push(indentedLine);
                }
                else {
                    // Empty line logic (collapses multiple to single)
                    if (result.length > 0 && result[result.length - 1].trim() !== '') {
                        result.push('');
                    }
                }
            }
        }
        if (tagBuffer.length > 0) {
            result.push(...this.formatTags(tagBuffer, 2));
        }
        if (inTable) {
            result.push(...this.alignTable(tableLines, lastStepIndent));
        }
        // Remove trailing empty lines completely
        while (result.length > 0 && result[result.length - 1].trim() === '') {
            result.pop();
        }
        return result;
    }
    formatTags(tags, indentSpaces) {
        const uniqueTags = [...new Set(tags)].sort();
        const result = [];
        const padding = ' '.repeat(indentSpaces);
        let currentLine = padding;
        for (const tag of uniqueTags) {
            if (currentLine.length + tag.length > 80 && currentLine.trim() !== '') {
                result.push(currentLine.trimEnd());
                currentLine = padding + tag + ' ';
            }
            else {
                currentLine += tag + ' ';
            }
        }
        if (currentLine.trim() !== '') {
            result.push(currentLine.trimEnd());
        }
        return result;
    }
    autoCase(line) {
        return line.replace(/^(feature|scenario outline|scenario|background|rule|examples|given|when|then|and|but|\*)(:|\s|$)/i, (match, p1, p2) => {
            const lower = p1.toLowerCase();
            let cased = p1;
            if (lower === 'feature')
                cased = 'Feature';
            else if (lower === 'scenario')
                cased = 'Scenario';
            else if (lower === 'scenario outline')
                cased = 'Scenario Outline';
            else if (lower === 'background')
                cased = 'Background';
            else if (lower === 'rule')
                cased = 'Rule';
            else if (lower === 'examples')
                cased = 'Examples';
            else if (lower === 'given')
                cased = 'Given';
            else if (lower === 'when')
                cased = 'When';
            else if (lower === 'then')
                cased = 'Then';
            else if (lower === 'and')
                cased = 'And';
            else if (lower === 'but')
                cased = 'But';
            return cased + p2;
        });
    }
    indentLine(line, options) {
        line = this.autoCase(line);
        const lowerLine = line.toLowerCase();
        if (lowerLine.startsWith('feature:')) {
            return line; // 0 spaces
        }
        if (lowerLine.startsWith('rule:') ||
            lowerLine.startsWith('background:') ||
            lowerLine.startsWith('scenario:') ||
            lowerLine.startsWith('scenario outline:') ||
            lowerLine.startsWith('@')) {
            return '  ' + line; // 2 spaces
        }
        const stepIndentStr = ' '.repeat(options.stepIndentation);
        if (lowerLine.startsWith('examples:')) {
            return stepIndentStr + line;
        }
        if (lowerLine.match(/^(given|when|then|and|but|\*)\s/)) {
            return stepIndentStr + line;
        }
        if (line.startsWith('"""')) {
            return stepIndentStr + '  ' + line;
        }
        if (line.startsWith('#')) {
            return '  ' + line;
        }
        return stepIndentStr + line;
    }
    alignTable(tableLines, indentSpaces) {
        const columnWidths = [];
        const parsedRows = tableLines.map(line => {
            const cols = line.split('|');
            cols.shift();
            cols.pop();
            return cols.map(c => c.trim());
        });
        parsedRows.forEach(row => {
            row.forEach((col, idx) => {
                if (!columnWidths[idx] || col.length > columnWidths[idx]) {
                    columnWidths[idx] = col.length;
                }
            });
        });
        const padding = ' '.repeat(indentSpaces);
        return parsedRows.map(row => {
            const paddedCols = row.map((col, idx) => {
                return col.padEnd(columnWidths[idx], ' ');
            });
            return padding + '| ' + paddedCols.join(' | ') + ' |';
        });
    }
}
exports.GherkinFormattingEditProvider = GherkinFormattingEditProvider;
//# sourceMappingURL=formatter.js.map