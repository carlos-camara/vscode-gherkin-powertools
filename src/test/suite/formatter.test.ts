import * as assert from 'assert';
import * as vscode from 'vscode';
import { GherkinFormattingEditProvider, FormatterOptions } from '../../formatter';

const defaultOptions: FormatterOptions = {
    stepIndentation: 2,
    alignTableToKeyword: true,
    tagsFormat: 'wrap',
    emptyLinesBetweenScenarios: 1
};

async function runFormat(formatter: GherkinFormattingEditProvider, unformatted: string): Promise<string> {
    const formattedLines = await formatter.formatGherkin(unformatted, defaultOptions, { isCancellationRequested: false } as vscode.CancellationToken);
    return formattedLines ? formattedLines.map(l => l.text).join('\n') : '';
}

async function runRangeFormat(formatter: GherkinFormattingEditProvider, unformatted: string, startLine: number, endLine: number): Promise<string> {
    const lines = unformatted.split('\n');
    const doc = {
        getText: (range?: vscode.Range) => {
            if (!range) return unformatted;
            return lines.slice(range.start.line, range.end.line + 1).join('\n');
        },
        eol: vscode.EndOfLine.LF,
        lineAt: (line: number) => ({ text: lines[line] || '' }),
        lineCount: lines.length
    } as any as vscode.TextDocument;
    
    const range = new vscode.Range(startLine, 0, endLine, doc.lineAt(endLine).text.length);
    const edits = await formatter.provideDocumentRangeFormattingEdits(doc, range, {} as vscode.FormattingOptions, { isCancellationRequested: false } as vscode.CancellationToken);
    
    if (edits && edits.length > 0) {
        return edits[0].newText;
    }
    return doc.getText(range); // Idempotent or no-op
}

suite('Formatter Test Suite', () => {
    test('Format simple feature and scenario with proper spacing', async () => {
        const formatter = new GherkinFormattingEditProvider();
        const unformatted = [
            'Feature: Login',
            'Scenario: Success',
            'Given I am on the login page',
            'Then I should see the dashboard',
            '@smoke',
            'Scenario: Failure',
            'Given I enter wrong credentials'
        ].join('\n');

        const result = await runFormat(formatter, unformatted);
        const formatted = result.split('\n');

        assert.strictEqual(formatted[0], 'Feature: Login');
        assert.strictEqual(formatted[1], '');
        assert.strictEqual(formatted[2], '  Scenario: Success');
        assert.strictEqual(formatted[3], '    Given I am on the login page');
        assert.strictEqual(formatted[4], '    Then I should see the dashboard');
        assert.strictEqual(formatted[5], '');
        assert.strictEqual(formatted[6], '  @smoke');
        assert.strictEqual(formatted[7], '  Scenario: Failure');
        assert.strictEqual(formatted[8], '    Given I enter wrong credentials');
    });

    test('Align tables dynamically to preceding step indentation and handle escaped pipes', async () => {
        const formatter = new GherkinFormattingEditProvider();
        const unformatted = [
            'Feature: Tables',
            'Scenario: Tables',
            'Given the following users:',
            '|username|password|',
            '|user1|pass\\|123|',
            '|admin_user|extremely_long_password|'
        ].join('\n');

        const result = await runFormat(formatter, unformatted);
        const formatted = result.split('\n');

        assert.strictEqual(formatted[3], '    Given the following users:');
        assert.strictEqual(formatted[4], '          | username   | password                |');
        assert.strictEqual(formatted[5], '          | user1      | pass\\|123               |');
        assert.strictEqual(formatted[6], '          | admin_user | extremely_long_password |');
    });



    test('Sorts and wraps long tag lists', async () => {
        const formatter = new GherkinFormattingEditProvider();
        const tags = Array.from({ length: 10 }, (_, i) => `@tag${i}`).join(' ');
        const unformatted = [
            tags,
            'Feature: Tag wrap'
        ].join('\n');

        const result = await runFormat(formatter, unformatted);
        // The first tag line will contain tags up to 80 chars
        const formatted = result.split('\n');
        assert.ok(formatted[0].length <= 80);
        assert.ok(formatted[1].length <= 80);
        assert.strictEqual(formatted[formatted.length - 1], 'Feature: Tag wrap');
    });

    test('Formats docstrings and standalone comments correctly', async () => {
        const formatter = new GherkinFormattingEditProvider();
        const unformatted = [
            'Feature: Docs',
            'Scenario: Docstrings',
            'Given a docstring:',
            '"""',
            'some content',
            '',
            '  more content',
            '"""',
            '# standalone comment',
            'Then success'
        ].join('\n');

        const result = await runFormat(formatter, unformatted);
        const formatted = result.split('\n');
        
        assert.strictEqual(formatted[2], '  Scenario: Docstrings');
        assert.strictEqual(formatted[3], '    Given a docstring:');
        assert.strictEqual(formatted[4], '      """');
        assert.strictEqual(formatted[5], '      some content');
        assert.strictEqual(formatted[6], '');
        assert.strictEqual(formatted[7], '        more content'); // preserve inner whitespace relative to docstring
        assert.strictEqual(formatted[8], '      """');
        assert.strictEqual(formatted[9], '    # standalone comment');
        assert.strictEqual(formatted[10], '    Then success');
    });

    test('Formats Rules, Backgrounds, and Examples', async () => {
        const formatter = new GherkinFormattingEditProvider();
        const unformatted = [
            'Feature: complex',
            'Rule: This is a rule',
            'Background: setup',
            'Given rule setup',
            'Scenario Outline: complex scenario',
            'Given <param>',
            '@tag',
            'Examples:',
            '|param|',
            '|val|'
        ].join('\n');

        const result = await runFormat(formatter, unformatted);
        const formatted = result.split('\n');

        assert.strictEqual(formatted[0], 'Feature: complex');
        assert.strictEqual(formatted[2], '  Rule: This is a rule');
        assert.strictEqual(formatted[4], '    Background: setup');
        assert.strictEqual(formatted[5], '      Given rule setup');
        assert.strictEqual(formatted[7], '    Scenario Outline: complex scenario');
        assert.strictEqual(formatted[8], '      Given <param>');
        assert.strictEqual(formatted[10], '      @tag');
        assert.strictEqual(formatted[11], '      Examples:');
        assert.strictEqual(formatted[12], '        | param |');
        assert.strictEqual(formatted[13], '        | val   |');
    });

    test('Preserves parent-relative descriptions and removes trailing empty lines', async () => {
        const formatter = new GherkinFormattingEditProvider();
        const unformatted = [
            'Feature: desc',
            'this is a feature description line',
            'Scenario: scenario',
            'this is a scenario description',
            'Given step',
            '',
            ''
        ].join('\n');

        const result = await runFormat(formatter, unformatted);
        const formatted = result.split('\n');
        
        assert.strictEqual(formatted[0], 'Feature: desc');
        assert.strictEqual(formatted[1], '  this is a feature description line');
        assert.strictEqual(formatted[3], '  Scenario: scenario');
        assert.strictEqual(formatted[4], '    this is a scenario description');
        assert.strictEqual(formatted[5], '    Given step');
        assert.strictEqual(formatted.length, 6); // no trailing empty lines outputted by formatGherkin directly
    });

    test('Refuses to format on invalid syntax', async () => {
        const formatter = new GherkinFormattingEditProvider();
        const unformatted = [
            'BlahBlahBlah: test',
            'This is not valid Gherkin at all'
        ].join('\n');

        const result = await runFormat(formatter, unformatted);
        assert.strictEqual(result, '');
    });

    test('Preserves CRLF', async () => {
        const formatter = new GherkinFormattingEditProvider();
        const unformatted = 'Feature: CRLF\r\nScenario: test\r\nGiven a step';
        const mockDocument = {
            getText: () => unformatted,
            lineCount: 3,
            eol: vscode.EndOfLine.CRLF
        } as any;
        const edits = await formatter.provideDocumentFormattingEdits(mockDocument, {} as any, { isCancellationRequested: false } as any);
        if (edits.length > 0) {
            assert.ok(edits[0].newText.includes('\r\n'));
            assert.ok(!edits[0].newText.includes('\nScenario')); 
        }
    });

    test('Idempotency - formatting twice yields the same output', async () => {
        const formatter = new GherkinFormattingEditProvider();
        const unformatted = [
            'Feature: Idempotency',
            '  Description',
            '',
            '  Scenario: First',
            '    Given setup'
        ].join('\n');

        const result1 = await runFormat(formatter, unformatted);
        const result2 = await runFormat(formatter, result1);
        
        assert.strictEqual(result1, result2);
    });
});

suite('Formatter VS Code API Wrapper Tests', () => {
    test('provideDocumentFormattingEdits checks idempotency and final newline', async () => {
        const formatter = new GherkinFormattingEditProvider();
        
        const textWithNewline = 'Feature: Final Newline\n';
        const mockDocument = {
            getText: () => textWithNewline,
            lineCount: 2,
            eol: vscode.EndOfLine.LF
        } as any;
        
        const edits = await formatter.provideDocumentFormattingEdits(mockDocument, {} as any, { isCancellationRequested: false } as any);
        
        // Should return [] because it's already correctly formatted and idempotent
        assert.strictEqual(edits.length, 0);

        const textWithoutNewline = 'Feature: Final Newline';
        const mockDocument2 = {
            getText: () => textWithoutNewline,
            lineCount: 1,
            eol: vscode.EndOfLine.LF
        } as any;
        
        const edits2 = await formatter.provideDocumentFormattingEdits(mockDocument2, {} as any, { isCancellationRequested: false } as any);
        
        // Output will be the same as input, but without final newline
        assert.strictEqual(edits2.length, 0);
    });

    test('Range formatting: selection inside a step', async () => {
        const formatter = new GherkinFormattingEditProvider();
        const unformatted = [
            'Feature: F',
            'Scenario: S',
            'Given     unformatted step',
            'Then end'
        ].join('\n');
        
        // line 2: 'Given     unformatted step'
        const result = await runRangeFormat(formatter, unformatted, 2, 2);
        // VS Code defaults stepIndentation to 4. Scenario is 2, Step is 6.
        assert.strictEqual(result, '      Given     unformatted step');
    });

    test('Range formatting: selection across multiple steps', async () => {
        const formatter = new GherkinFormattingEditProvider();
        const unformatted = [
            'Feature: F',
            'Scenario: S',
            'Given     1',
            'Then     2',
            'And   3'
        ].join('\n');
        
        // line 2 to 3
        const result = await runRangeFormat(formatter, unformatted, 2, 3);
        assert.strictEqual(result, '      Given     1\n      Then     2');
    });

    test('Range formatting: table selection', async () => {
        const formatter = new GherkinFormattingEditProvider();
        const unformatted = [
            'Feature: F',
            'Scenario: S',
            'Given users:',
            '|username|pass|',
            '|u1|p1|'
        ].join('\n');
        
        // line 4 (the second row) -> will be aligned based on the entire table calculation
        const result = await runRangeFormat(formatter, unformatted, 4, 4);
        assert.strictEqual(result, '            | u1       | p1   |');
    });

    test('Range formatting: DocString selection', async () => {
        const formatter = new GherkinFormattingEditProvider();
        const unformatted = [
            'Feature: F',
            'Scenario: S',
            'Given doc:',
            '"""',
            '  hello',
            '"""'
        ].join('\n');
        
        // line 4 ('  hello')
        const result = await runRangeFormat(formatter, unformatted, 4, 4);
        assert.strictEqual(result, '          hello');
    });

    test('Range formatting: tags', async () => {
        const formatter = new GherkinFormattingEditProvider();
        const unformatted = [
            '@t1 @t2 @t3',
            'Feature: F'
        ].join('\n');
        
        // line 0
        const result = await runRangeFormat(formatter, unformatted, 0, 0);
        assert.strictEqual(result, '@t1 @t2 @t3');
    });

    test('Range formatting: Rule and formatting that inserts blank lines', async () => {
        const formatter = new GherkinFormattingEditProvider();
        const unformatted = [
            'Feature: F',
            'Rule: R',
            'Scenario: S1',
            'Given 1',
            'Scenario: S2',
            'Given 2'
        ].join('\n');
        
        // Formatter should insert a blank line before Scenario: S2
        // If we select just Scenario: S2 (line 4)
        const result = await runRangeFormat(formatter, unformatted, 4, 4);
        // It should yield an empty line followed by the properly indented Scenario
        assert.strictEqual(result, '\n    Scenario: S2');
    });
});
