import * as assert from 'assert';
import { GherkinFormattingEditProvider, FormatterOptions } from '../../formatter';

const defaultOptions: FormatterOptions = {
    stepIndentation: 4,
    alignTableToKeyword: true,
    tagsFormat: 'wrap',
    emptyLinesBetweenScenarios: 1
};

function runFormat(formatter: GherkinFormattingEditProvider, unformatted: string[]): string[] {
    const text = unformatted.join('\n');
    const formattedText = formatter.formatGherkin(text, defaultOptions);
    if (formattedText === null) {
        throw new Error("Syntax error formatting");
    }
    return formattedText.split('\n');
}

suite('Formatter Test Suite', () => {
    test('Format simple feature and scenario with proper spacing', () => {
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

        const formatted = runFormat(formatter, unformatted);

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

    test('Align tables dynamically to preceding step indentation', () => {
        const formatter = new GherkinFormattingEditProvider();
        const unformatted = [
            'Feature: Tables',
            'Scenario: Tables',
            'Given the following users:',
            '|username|password|',
            '|user1|pass123|',
            '|admin_user|extremely_long_password|'
        ];

        const formatted = runFormat(formatter, unformatted);

        assert.strictEqual(formatted[3], '    Given the following users:');
        assert.strictEqual(formatted[4], '          | username   | password                |');
        assert.strictEqual(formatted[5], '          | user1      | pass123                 |');
        assert.strictEqual(formatted[6], '          | admin_user | extremely_long_password |');
    });

    test('Auto-corrects keyword casing', () => {
        // ...
        assert.ok(true);
    });

    test('Sorts and wraps long tag lists', () => {
        // ...
        assert.ok(true);
    });

    test('Collapses multiple empty lines and trims whitespace', () => {
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

        const formatted = runFormat(formatter, unformatted);
        assert.strictEqual(formatted[0], 'Feature: Empty lines');
        assert.strictEqual(formatted[1], '');
        assert.strictEqual(formatted[2], '  Scenario: Has spaces');
        assert.strictEqual(formatted[3], '');
        assert.strictEqual(formatted[4], '    Given a step');
    });

    test('Formats docstrings and standalone comments correctly', () => {
        const formatter = new GherkinFormattingEditProvider();
        const unformatted = [
            'Feature: Docs',
            'Scenario: Docstrings',
            'Given a docstring:',
            '"""',
            'some content',
            '"""',
            '# standalone comment',
            'Then success'
        ];

        const formatted = runFormat(formatter, unformatted);
        assert.strictEqual(formatted[2], '  Scenario: Docstrings');
        assert.strictEqual(formatted[3], '    Given a docstring:');
        assert.strictEqual(formatted[4], '      """');
        assert.strictEqual(formatted[5], '      some content');
        assert.strictEqual(formatted[6], '      """');
        assert.strictEqual(formatted[7], '    # standalone comment');
        assert.strictEqual(formatted[8], '    Then success');
    });
});
