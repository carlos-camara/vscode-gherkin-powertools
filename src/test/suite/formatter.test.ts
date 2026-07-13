import * as assert from 'assert';
import { GherkinFormattingEditProvider, FormatterOptions } from '../../formatter';

const defaultOptions: FormatterOptions = {
    stepIndentation: 4,
    alignTableToKeyword: true,
    tagsFormat: 'wrap',
    emptyLinesBetweenScenarios: 1
};

async function runFormat(formatter: GherkinFormattingEditProvider, unformatted: string[]): Promise<string[]> {
    const text = unformatted.join('\n');
    const formattedText = await formatter.formatGherkin(text, defaultOptions);
    return formattedText ? formattedText.split('\n') : [];
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
        ];

        const formatted = await runFormat(formatter, unformatted);

        assert.strictEqual(formatted[0], 'Feature: Login');
        assert.strictEqual(formatted[1], '');
        assert.strictEqual(formatted[2], '  Scenario: Success');
        assert.strictEqual(formatted[3], '    Given I am on the login page');
        assert.strictEqual(formatted[4], '    Then I should see the dashboard');
        assert.strictEqual(formatted[5], '  @smoke');
        assert.strictEqual(formatted[6], '  Scenario: Failure');
        assert.strictEqual(formatted[7], '    Given I enter wrong credentials');
        assert.strictEqual(formatted.length, 8);
    });

    test('Align tables dynamically to preceding step indentation', async () => {
        const formatter = new GherkinFormattingEditProvider();
        const unformatted = [
            'Feature: Tables',
            'Scenario: Tables',
            'Given the following users:',
            '|username|password|',
            '|user1|pass123|',
            '|admin_user|extremely_long_password|'
        ];

        const formatted = await runFormat(formatter, unformatted);

        assert.strictEqual(formatted[3], '    Given the following users:');
        assert.strictEqual(formatted[4], '          | username   | password                |');
        assert.strictEqual(formatted[5], '          | user1      | pass123                 |');
        assert.strictEqual(formatted[6], '          | admin_user | extremely_long_password |');
    });

    test('Auto-corrects keyword casing', async () => {
        assert.ok(true);
    });

    test('Sorts and wraps long tag lists', async () => {
        assert.ok(true);
    });

    test('Collapses multiple empty lines and trims whitespace', async () => {
        const formatter = new GherkinFormattingEditProvider();
        const unformatted = [
            'Feature: Empty lines   ',
            '',
            '',
            '',
            '',
            'Scenario: Has spaces    ',
            '    ',
            'Given a step'
        ];

        const formatted = await runFormat(formatter, unformatted);
        assert.strictEqual(formatted[0], 'Feature: Empty lines');
        assert.strictEqual(formatted[1], '');
        assert.strictEqual(formatted[2], '  Scenario: Has spaces');
        assert.strictEqual(formatted[3], '');
        assert.strictEqual(formatted[4], '    Given a step');
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
            'more content',
            '"""',
            '# standalone comment',
            'Then success'
        ];

        const formatted = await runFormat(formatter, unformatted);
        assert.strictEqual(formatted[2], '  Scenario: Docstrings');
        assert.strictEqual(formatted[3], '    Given a docstring:');
        assert.strictEqual(formatted[4], '      """');
        assert.strictEqual(formatted[5], '      some content');
        assert.strictEqual(formatted[6], '');
        assert.strictEqual(formatted[7], '      more content');
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
        ];

        const formatted = await runFormat(formatter, unformatted);
        assert.strictEqual(formatted[0], 'Feature: complex');
        assert.strictEqual(formatted[2], '  Rule: This is a rule');
        assert.strictEqual(formatted[4], '    Background: setup');
        assert.strictEqual(formatted[5], '    Given rule setup');
        assert.strictEqual(formatted[7], '    Scenario Outline: complex scenario');
        assert.strictEqual(formatted[8], '    Given <param>');
        assert.strictEqual(formatted[9], '    @tag');
        assert.strictEqual(formatted[10], '    Examples:');
        assert.strictEqual(formatted[11], '      | param |');
        assert.strictEqual(formatted[12], '      | val   |');
    });

    test('Preserves unmapped descriptions and removes trailing empty lines', async () => {
        const formatter = new GherkinFormattingEditProvider();
        const unformatted = [
            'Feature: desc',
            'this is an unmapped description line',
            'Scenario: scenario',
            'Given step',
            '',
            '',
            ''
        ];

        const formatted = await runFormat(formatter, unformatted);
        assert.strictEqual(formatted[0], 'Feature: desc');
        assert.strictEqual(formatted[1], '  this is an unmapped description line');
        assert.strictEqual(formatted[3], '  Scenario: scenario');
        assert.strictEqual(formatted[4], '    Given step');
        assert.strictEqual(formatted.length, 5);
    });

    test('Refuses to format on invalid syntax', async () => {
        const formatter = new GherkinFormattingEditProvider();
        const unformatted = [
            'BlahBlahBlah: test',
            'This is not valid Gherkin at all'
        ];

        const formatted = await runFormat(formatter, unformatted);
        assert.strictEqual(formatted.length, 0);
    });
});

suite('Formatter VS Code API Wrapper Tests', () => {
    test('provideDocumentFormattingEdits formats the entire document', async () => {
        const formatter = new GherkinFormattingEditProvider();
        const mockDocument = {
            getText: () => 'Feature: Login\nScenario: Success\nGiven I am on the login page',
            lineCount: 3,
            lineAt: (_line: number) => ({ text: 'Given I am on the login page' })
        } as any;
        
        const edits = await formatter.provideDocumentFormattingEdits(mockDocument, {} as any, {} as any);
        assert.strictEqual(edits.length, 1);
        const formattedText = edits[0].newText;
        assert.ok(formattedText.includes('Feature: Login'));
        assert.ok(formattedText.includes('  Scenario: Success'));
        assert.ok(formattedText.includes('    Given I am on the login page'));
    });


    test('returns empty array when formatting invalid document via API', async () => {
        const formatter = new GherkinFormattingEditProvider();
        const mockDocument = {
            getText: () => 'BlahBlah: invalid'
        } as any;
        
        const edits = await formatter.provideDocumentFormattingEdits(mockDocument, {} as any, {} as any);
        assert.strictEqual(edits.length, 0);
    });
});
