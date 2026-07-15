import * as vscode from 'vscode';
import type { GherkinDocument, Feature, Rule, Scenario, Background, Step, Examples, TableRow, TableCell, Tag } from '@cucumber/messages';

export interface FormatterOptions {
    stepIndentation: number;
    alignTableToKeyword: boolean;
    tagsFormat: 'wrap' | 'singleLine';
    emptyLinesBetweenScenarios: number;
}

interface NodeInfo {
    type: 'Feature' | 'Rule' | 'Scenario' | 'Background' | 'Step' | 'Examples' | 'TableRow' | 'DocString' | 'FormattedTags' | 'Skip' | 'Comment';
    indent: number;
    keyword?: string;
    cells?: readonly TableCell[];
    lines?: string[]; // for FormattedTags or DocString content
    emptyLinesBefore?: number;
}

export class GherkinFormattingEditProvider implements vscode.DocumentFormattingEditProvider {
    
    private getOptions(): FormatterOptions {
        const config = vscode.workspace.getConfiguration('gherkinPowerTools');
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
        token: vscode.CancellationToken
    ): Promise<vscode.TextEdit[]> {
        const options = this.getOptions();
        const text = document.getText();
        const eol = document.eol === vscode.EndOfLine.CRLF ? '\r\n' : '\n';
        const hasFinalNewline = text.endsWith('\n');

        const formattedText = await this.formatGherkin(text, options, token, eol);
        if (formattedText === null || token.isCancellationRequested) return [];

        const finalText = hasFinalNewline && !formattedText.endsWith(eol) ? formattedText + eol : formattedText;

        if (finalText === text) {
            return []; // Idempotent check
        }

        const start = new vscode.Position(0, 0);
        const end = new vscode.Position(document.lineCount, 0);
        const range = new vscode.Range(start, end);

        return [vscode.TextEdit.replace(range, finalText)];
    }

    public async formatGherkin(text: string, options: FormatterOptions, token: vscode.CancellationToken, eol: string = '\n'): Promise<string | null> {
        const dynamicImport = new Function('specifier', 'return import(specifier)');
        const { AstBuilder, GherkinClassicTokenMatcher, Parser } = await dynamicImport('@cucumber/gherkin');
        const { IdGenerator } = await dynamicImport('@cucumber/messages');

        const uuidFn = IdGenerator.uuid();
        const builder = new AstBuilder(uuidFn);
        const matcher = new GherkinClassicTokenMatcher();
        const parser = new Parser(builder, matcher);
        
        let gherkinDocument: GherkinDocument;
        try {
            gherkinDocument = parser.parse(text);
        } catch (e) {
            vscode.window.showWarningMessage("Gherkin PowerTools: Cannot format document due to syntax errors.");
            return null;
        }

        const astMap = new Map<number, NodeInfo>();
        this.buildASTMap(gherkinDocument, options, astMap);

        const lines = text.split(/\r?\n/);
        const out: string[] = [];
        let tableRows: { cells: readonly TableCell[], indent: number }[] = [];

        for (let i = 0; i < lines.length; i++) {
            if (token.isCancellationRequested) return null;

            const lineNum = i + 1;
            const rawLine = lines[i];
            const trimmedLine = rawLine.trim();
            const node = astMap.get(lineNum);

            // 1. Enforce empty lines before blocks
            if (node && node.emptyLinesBefore !== undefined) {
                if (out.length > 0) {
                    let blankCount = 0;
                    for (let j = out.length - 1; j >= 0; j--) {
                        if (out[j].trim() === '') blankCount++;
                        else break;
                    }
                    if (blankCount > node.emptyLinesBefore) {
                        for (let j = 0; j < blankCount - node.emptyLinesBefore; j++) out.pop();
                    } else if (blankCount < node.emptyLinesBefore) {
                        for (let j = 0; j < node.emptyLinesBefore - blankCount; j++) out.push('');
                    }
                }
            }

            // 2. Skip marked lines (e.g. DocString contents or duplicate tag lines)
            if (node && node.type === 'Skip') continue;

            // 3. Handle raw empty lines
            if (trimmedLine === '') {
                // Preserve at most 1 empty line in the middle of blocks (e.g. between steps)
                if (out.length > 0 && out[out.length - 1].trim() !== '') {
                    out.push('');
                }
                continue;
            }

            // 4. Handle Tables
            if (node && node.type === 'TableRow' && node.cells) {
                tableRows.push({ cells: node.cells, indent: node.indent });
                const nextNode = astMap.get(lineNum + 1);
                if (!nextNode || nextNode.type !== 'TableRow') {
                    out.push(...this.alignTable(tableRows));
                    tableRows.length = 0;
                }
                continue;
            }

            // 5. Handle Mapped Nodes
            if (node) {
                if (node.type === 'FormattedTags' && node.lines) {
                    out.push(...node.lines);
                    continue;
                }

                if (node.type === 'DocString' && node.keyword && node.lines !== undefined) {
                    out.push(' '.repeat(node.indent) + node.keyword);
                    node.lines.forEach(cl => {
                        out.push(cl === '' ? '' : ' '.repeat(node.indent) + cl);
                    });
                    out.push(' '.repeat(node.indent) + node.keyword);
                    continue;
                }

                if (node.type === 'Comment') {
                    let contextIndent = 0;
                    for (let j = lineNum; j <= lines.length; j++) {
                        const nextNode = astMap.get(j);
                        if (nextNode && nextNode.type !== 'Comment' && nextNode.type !== 'Skip' && nextNode.type !== 'FormattedTags') {
                            contextIndent = nextNode.indent;
                            break;
                        }
                    }
                    out.push(' '.repeat(contextIndent) + trimmedLine);
                    continue;
                }

                // Handle standard nodes (Feature, Rule, Scenario, Background, Step, Examples)
                let textToAppend = trimmedLine;
                out.push(' '.repeat(node.indent) + textToAppend);

            } else {
                // 6. Handle unmapped lines (Descriptions)
                let parentIndent = 0;
                for (let j = lineNum - 1; j > 0; j--) {
                    const pNode = astMap.get(j);
                    if (pNode && pNode.type !== 'Comment' && pNode.type !== 'Skip' && pNode.type !== 'FormattedTags') {
                        parentIndent = pNode.indent;
                        break;
                    }
                }
                out.push(' '.repeat(parentIndent + 2) + trimmedLine);
            }
        }

        // Clean trailing empty lines to let the finalNewline logic take over
        while (out.length > 0 && out[out.length - 1].trim() === '') {
            out.pop();
        }

        return out.join(eol);
    }

    private buildASTMap(document: GherkinDocument, options: FormatterOptions, map: Map<number, NodeInfo>) {
        if (!document.feature) return;

        this.processTags(document.feature.tags, 0, options, map);
        this.markEmptyLinesBefore(document.feature.tags, document.feature.location.line, 0, map);

        map.set(document.feature.location.line, { type: 'Feature', indent: 0, keyword: document.feature.keyword, emptyLinesBefore: map.get(document.feature.location.line)?.emptyLinesBefore });

        document.feature.children?.forEach(child => {
            if (child.rule) {
                this.processTags(child.rule.tags, 2, options, map);
                this.markEmptyLinesBefore(child.rule.tags, child.rule.location.line, options.emptyLinesBetweenScenarios, map);
                map.set(child.rule.location.line, { type: 'Rule', indent: 2, keyword: child.rule.keyword, emptyLinesBefore: map.get(child.rule.location.line)?.emptyLinesBefore });

                child.rule.children?.forEach(rc => {
                    this.mapScenario(rc.background || rc.scenario, 4, options, map);
                });
            } else {
                this.mapScenario(child.background || child.scenario, 2, options, map);
            }
        });

        document.comments?.forEach(c => {
            map.set(c.location.line, { type: 'Comment', indent: -1 });
        });
    }

    private mapScenario(scenario: Scenario | Background | undefined, indent: number, options: FormatterOptions, map: Map<number, NodeInfo>) {
        if (!scenario) return;

        const tags = 'tags' in scenario ? scenario.tags : undefined;
        
        this.processTags(tags, indent, options, map);
        this.markEmptyLinesBefore(tags, scenario.location.line, options.emptyLinesBetweenScenarios, map);
        
        map.set(scenario.location.line, { 
            type: 'Background' in scenario ? 'Background' : 'Scenario', 
            indent, 
            keyword: scenario.keyword,
            emptyLinesBefore: map.get(scenario.location.line)?.emptyLinesBefore
        });

        scenario.steps?.forEach(step => {
            const stepIndent = indent + options.stepIndentation;
            map.set(step.location.line, { type: 'Step', indent: stepIndent, keyword: step.keyword });
            
            if (step.dataTable) {
                const tableIndent = options.alignTableToKeyword ? stepIndent + (step.keyword?.length || 6) : stepIndent + 2;
                step.dataTable.rows?.forEach(r => map.set(r.location.line, { type: 'TableRow', indent: tableIndent, cells: r.cells }));
            }
            if (step.docString) {
                const startLine = step.docString.location.line;
                const contentLines = step.docString.content.split(/\r?\n/);
                const endLine = startLine + contentLines.length + 1;
                
                map.set(startLine, { 
                    type: 'DocString', 
                    indent: stepIndent + 2, 
                    keyword: step.docString.delimiter,
                    lines: contentLines
                });
                
                for (let j = startLine + 1; j <= endLine; j++) {
                    map.set(j, { type: 'Skip', indent: 0 });
                }
            }
        });

        if ('examples' in scenario && scenario.examples) {
            scenario.examples.forEach(ex => {
                const examplesIndent = indent + options.stepIndentation;
                this.processTags(ex.tags, examplesIndent, options, map);
                this.markEmptyLinesBefore(ex.tags, ex.location.line, options.emptyLinesBetweenScenarios, map);

                map.set(ex.location.line, { type: 'Examples', indent: examplesIndent, keyword: ex.keyword, emptyLinesBefore: map.get(ex.location.line)?.emptyLinesBefore });
                
                const tableIndent = examplesIndent + 2;
                if (ex.tableHeader) {
                    map.set(ex.tableHeader.location.line, { type: 'TableRow', indent: tableIndent, cells: ex.tableHeader.cells });
                }
                ex.tableBody?.forEach(r => map.set(r.location.line, { type: 'TableRow', indent: tableIndent, cells: r.cells }));
            });
        }
    }

    private processTags(tags: readonly Tag[] | undefined, indent: number, options: FormatterOptions, map: Map<number, NodeInfo>) {
        if (!tags || tags.length === 0) return;
        
        const tagLines = Array.from(new Set(tags.map(t => t.location.line))).sort((a,b) => a - b);
        const tagNames = tags.map(t => t.name).sort();
        const formattedTagLines: string[] = [];
        const indentStr = ' '.repeat(indent);
        
        if (options.tagsFormat === 'singleLine') {
            formattedTagLines.push(indentStr + tagNames.join(' '));
        } else {
            let currentLine = indentStr;
            for (const tag of tagNames) {
                if (currentLine.length + 1 + tag.length > 80 && currentLine.trim().length > 0) {
                    formattedTagLines.push(currentLine);
                    currentLine = indentStr + tag;
                } else {
                    currentLine = currentLine.trim().length === 0 ? currentLine + tag : currentLine + ' ' + tag;
                }
            }
            if (currentLine.trim().length > 0) {
                formattedTagLines.push(currentLine);
            }
        }
        
        for (let i = 0; i < tagLines.length; i++) {
            const line = tagLines[i];
            if (i === 0) {
                map.set(line, { type: 'FormattedTags', indent, lines: formattedTagLines });
            } else {
                map.set(line, { type: 'Skip', indent: 0 });
            }
        }
    }

    private markEmptyLinesBefore(tags: readonly Tag[] | undefined, keywordLine: number, lines: number, map: Map<number, NodeInfo>) {
        const firstLine = tags && tags.length > 0 ? Math.min(...tags.map(t => t.location.line)) : keywordLine;
        const existing = map.get(firstLine) || { type: 'Skip', indent: 0 };
        existing.emptyLinesBefore = lines;
        map.set(firstLine, existing);
    }

    private alignTable(tableRows: { cells: readonly TableCell[], indent: number }[]): string[] {
        const colWidths: number[] = [];
        const escapedRows = tableRows.map(r => {
            return r.cells.map(c => {
                return c.value.replace(/\\/g, '\\\\').replace(/\|/g, '\\|').replace(/\n/g, '\\n');
            });
        });

        escapedRows.forEach(row => {
            row.forEach((cellStr, idx) => {
                if (!colWidths[idx] || cellStr.length > colWidths[idx]) {
                    colWidths[idx] = cellStr.length;
                }
            });
        });

        return escapedRows.map((row, rowIdx) => {
            const indentStr = ' '.repeat(tableRows[rowIdx].indent);
            const paddedCells = row.map((cellStr, idx) => cellStr.padEnd(colWidths[idx], ' '));
            return indentStr + '| ' + paddedCells.join(' | ') + ' |';
        });
    }
}
