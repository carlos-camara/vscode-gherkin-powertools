import * as vscode from 'vscode';
export interface FormatterOptions {
    stepIndentation: number;
    alignTableToKeyword: boolean;
    tagsFormat: 'wrap' | 'singleLine';
    emptyLinesBetweenScenarios: number;
}

export class GherkinFormattingEditProvider implements vscode.DocumentFormattingEditProvider, vscode.DocumentRangeFormattingEditProvider {
    
    private getOptions(): FormatterOptions {
        const config = vscode.workspace.getConfiguration('gherkinBeautifier');
        return {
            stepIndentation: config.get<number>('indentation.steps', 4),
            alignTableToKeyword: config.get<boolean>('tables.alignToKeyword', true),
            tagsFormat: config.get<'wrap' | 'singleLine'>('tags.format', 'wrap'),
            emptyLinesBetweenScenarios: config.get<number>('emptyLines.betweenScenarios', 1)
        };
    }

    public async provideDocumentFormattingEdits(
        document: vscode.TextDocument,
        _options: vscode.FormattingOptions,
        _token: vscode.CancellationToken
    ): Promise<vscode.TextEdit[]> {
        const formatOptions = this.getOptions();
        const text = document.getText();
        
        const formattedText = await this.formatGherkin(text, formatOptions);
        if (!formattedText) return [];

        const start = new vscode.Position(0, 0);
        const end = new vscode.Position(document.lineCount, 0);
        const range = new vscode.Range(start, end);

        return [vscode.TextEdit.replace(range, formattedText + '\n')];
    }

    public async provideDocumentRangeFormattingEdits(
        document: vscode.TextDocument,
        range: vscode.Range,
        _options: vscode.FormattingOptions,
        _token: vscode.CancellationToken
    ): Promise<vscode.TextEdit[]> {
        // Range formatting is tricky with AST since AST requires a full valid document.
        // We will format the whole document and then only extract the requested range.
        const formatOptions = this.getOptions();
        const text = document.getText();
        
        const formattedText = await this.formatGherkin(text, formatOptions);
        if (!formattedText) return [];

        const formattedLines = formattedText.split('\n');
        
        const startLine = range.start.line;
        const endLine = Math.min(range.end.line, formattedLines.length - 1);

        const linesInRange = formattedLines.slice(startLine, endLine + 1);

        const formatRange = new vscode.Range(
            new vscode.Position(startLine, 0),
            new vscode.Position(endLine, document.lineAt(range.end.line).text.length)
        );

        return [vscode.TextEdit.replace(formatRange, linesInRange.join('\n'))];
    }

    public async formatGherkin(text: string, options: FormatterOptions): Promise<string | null> {
        const dynamicImport = new Function('specifier', 'return import(specifier)');
        const { AstBuilder, GherkinClassicTokenMatcher, Parser } = await dynamicImport('@cucumber/gherkin');
        const { IdGenerator } = await dynamicImport('@cucumber/messages');

        const uuidFn = IdGenerator.uuid();
        const builder = new AstBuilder(uuidFn);
        const matcher = new GherkinClassicTokenMatcher();
        const parser = new Parser(builder, matcher);
        
        let gherkinDocument;
        try {
            gherkinDocument = parser.parse(text);
        } catch (e) {
            // If syntax is invalid, we refuse to format to avoid breaking the document.
            // This is standard behavior for AST-based formatters like Prettier.
            vscode.window.showWarningMessage("Gherkin PowerTools: Cannot format document due to syntax errors.");
            return null;
        }

        const astMap = new Map<number, { type: string, indent: number, extra?: any }>();
        this.buildASTMap(gherkinDocument.feature, options, astMap);
        
        if (gherkinDocument.comments) {
            gherkinDocument.comments.forEach((c: any) => {
                astMap.set(c.location.line, { type: 'Comment', indent: -1 }); // Indent depends on context
            });
        }

        const lines = text.split(/\r?\n/);
        const result: string[] = [];
        let inDocString = false;
        let docStringIndent = 0;
        let tableLines: { line: string, indent: number }[] = [];

        for (let i = 0; i < lines.length; i++) {
            const lineNum = i + 1; // AST uses 1-based indexing
            const rawLine = lines[i];
            const trimmedLine = rawLine.trim();

            if (trimmedLine === '') {
                if (!inDocString && result.length > 0 && result[result.length - 1].trim() !== '') {
                    // Only preserve one empty line outside docstrings
                    result.push('');
                } else if (inDocString) {
                    result.push('');
                }
                continue;
            }

            const nodeInfo = astMap.get(lineNum);

            // Handle DocStrings
            if (trimmedLine.startsWith('"""')) {
                if (!inDocString) {
                    inDocString = true;
                    docStringIndent = nodeInfo ? nodeInfo.indent : 0;
                    result.push(' '.repeat(docStringIndent) + trimmedLine);
                } else {
                    inDocString = false;
                    result.push(' '.repeat(docStringIndent) + trimmedLine);
                }
                continue;
            }

            if (inDocString) {
                result.push(' '.repeat(docStringIndent) + rawLine.trimStart());
                continue;
            }

            // Handle Tables
            if (nodeInfo && nodeInfo.type === 'TableRow') {
                tableLines.push({ line: trimmedLine, indent: nodeInfo.indent });
                
                // If next line is not a table row, align and flush
                const nextNode = astMap.get(lineNum + 1);
                const isNextLineTable = (nextNode && nextNode.type === 'TableRow') || (lines[i+1] && lines[i+1].trim().startsWith('|'));
                
                if (!isNextLineTable) {
                    result.push(...this.alignTable(tableLines));
                    tableLines = [];
                }
                continue;
            }

            // Handle other mapped lines
            if (nodeInfo) {
                // Ensure scenario blocks have empty lines before them
                if (['Feature', 'Scenario', 'Rule'].includes(nodeInfo.type) && result.length > 0) {
                    const lastLine = result[result.length - 1];
                    if (lastLine.trim() !== '' && !lastLine.trim().startsWith('@')) {
                        for (let j = 0; j < options.emptyLinesBetweenScenarios; j++) {
                            result.push('');
                        }
                    }
                }

                if (nodeInfo.type === 'Comment') {
                    // Find context indent
                    let contextIndent = 0;
                    for (let j = lineNum; j <= lines.length; j++) {
                        if (astMap.has(j) && astMap.get(j)!.type !== 'Comment') {
                            contextIndent = astMap.get(j)!.indent;
                            break;
                        }
                    }
                    result.push(' '.repeat(contextIndent) + trimmedLine);
                } else if (nodeInfo.type === 'Tag') {
                    // Tags are handled separately for wrapping if needed, but for simplicity here we just indent
                    result.push(' '.repeat(nodeInfo.indent) + trimmedLine);
                } else {
                    result.push(' '.repeat(nodeInfo.indent) + trimmedLine);
                }
            } else {
                // Unmapped line (could be a description line under a Scenario or Feature)
                // Default to 2 spaces or align to the parent
                result.push('  ' + trimmedLine);
            }
        }

        // Clean up trailing empty lines
        while (result.length > 0 && result[result.length - 1].trim() === '') {
            result.pop();
        }

        return result.join('\n');
    }

    private buildASTMap(feature: any, options: FormatterOptions, map: Map<number, any>) {
        if (!feature) return;

        map.set(feature.location.line, { type: 'Feature', indent: 0 });
        feature.tags?.forEach((t: any) => map.set(t.location.line, { type: 'Tag', indent: 0 }));
        
        feature.children?.forEach((child: any) => {
            if (child.rule) {
                map.set(child.rule.location.line, { type: 'Rule', indent: 2 });
                child.rule.tags?.forEach((t: any) => map.set(t.location.line, { type: 'Tag', indent: 2 }));
                child.rule.children?.forEach((rc: any) => {
                    this.mapScenario(rc.background || rc.scenario, 4, options, map);
                });
            } else {
                this.mapScenario(child.background || child.scenario, 2, options, map);
            }
        });
    }

    private mapScenario(scenario: any, indent: number, options: FormatterOptions, map: Map<number, any>) {
        if (!scenario) return;
        map.set(scenario.location.line, { type: 'Scenario', indent });
        scenario.tags?.forEach((t: any) => map.set(t.location.line, { type: 'Tag', indent }));
        
        scenario.steps?.forEach((step: any) => {
            const stepIndent = options.stepIndentation;
            map.set(step.location.line, { type: 'Step', indent: stepIndent });
            
            if (step.dataTable) {
                // AST step keyword includes trailing space e.g. "Given "
                const tableIndent = options.alignTableToKeyword ? stepIndent + (step.keyword.length || 6) : stepIndent + 2;
                step.dataTable.rows.forEach((r: any) => map.set(r.location.line, { type: 'TableRow', indent: tableIndent }));
            }
            if (step.docString) {
                map.set(step.docString.location.line, { type: 'DocStringDelimiter', indent: stepIndent + 2 });
            }
        });

        scenario.examples?.forEach((ex: any) => {
            const examplesIndent = options.stepIndentation;
            map.set(ex.location.line, { type: 'Examples', indent: examplesIndent });
            ex.tags?.forEach((t: any) => map.set(t.location.line, { type: 'Tag', indent: examplesIndent }));
            
            const tableIndent = examplesIndent + 2; // Old formatter typically indented tables under examples
            if (ex.tableHeader) map.set(ex.tableHeader.location.line, { type: 'TableRow', indent: tableIndent });
            ex.tableBody?.forEach((r: any) => map.set(r.location.line, { type: 'TableRow', indent: tableIndent }));
        });
    }

    private alignTable(tableLines: { line: string, indent: number }[]): string[] {
        const columnWidths: number[] = [];
        const parsedRows = tableLines.map(t => {
            const cols = t.line.split('|');
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

        return parsedRows.map((row, rowIdx) => {
            const padding = ' '.repeat(tableLines[rowIdx].indent);
            const paddedCols = row.map((col, idx) => {
                return col.padEnd(columnWidths[idx], ' ');
            });
            return padding + '| ' + paddedCols.join(' | ') + ' |';
        });
    }
}
