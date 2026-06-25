import * as assert from 'assert';
import { GherkinFormattingEditProvider } from '../../formatter';

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

        const formatted = formatter.formatGherkin(unformatted);

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

    test('Align tables dynamically to preceding step indentation', () => {
        const formatter = new GherkinFormattingEditProvider();
        const unformatted = [
            'Given the following users:',
            '|username|password|',
            '|user1|pass123|',
            '|admin_user|extremely_long_password|'
        ];

        const formatted = formatter.formatGherkin(unformatted);

        assert.strictEqual(formatted[0], '    Given the following users:');
        assert.strictEqual(formatted[1], '          | username   | password                |');
        assert.strictEqual(formatted[2], '          | user1      | pass123                 |');
        assert.strictEqual(formatted[3], '          | admin_user | extremely_long_password |');
    });

    test('Auto-corrects keyword casing', () => {
        const formatter = new GherkinFormattingEditProvider();
        const unformatted = [
            'fEATURE: lowercase feature',
            '  gIvEn I am weirdly cased',
            '  WHEN I submit',
            '  then it should work'
        ];

        const formatted = formatter.formatGherkin(unformatted);
        assert.strictEqual(formatted[0], 'Feature: lowercase feature');
        assert.strictEqual(formatted[1], '    Given I am weirdly cased');
        assert.strictEqual(formatted[2], '    When I submit');
        assert.strictEqual(formatted[3], '    Then it should work');
    });

    test('Sorts and wraps long tag lists', () => {
        const formatter = new GherkinFormattingEditProvider();
        const unformatted = [
            '@smoke @login @regression',
            '@api',
            'Scenario: Sorted tags',
            '@tag1 @tag2 @tag3 @tag4 @tag5 @tag6 @tag7 @tag8 @tag9 @tag10 @tag11 @tag12 @tag13 @tag14 @tag15',
            'Scenario: Long tags'
        ];

        const formatted = formatter.formatGherkin(unformatted);
        // @api @login @regression @smoke
        assert.strictEqual(formatted[0], '  @api @login @regression @smoke');
        assert.strictEqual(formatted[1], '  Scenario: Sorted tags');
        assert.strictEqual(formatted[2], '');
        
        // Ensure wrapping happens correctly
        const longTagLine1 = formatted[3];
        const longTagLine2 = formatted[4];
        assert.ok(longTagLine1.length <= 80);
        assert.strictEqual(longTagLine2.trim().startsWith('@tag'), true);
        assert.strictEqual(formatted[5], '  Scenario: Long tags');
    });

    test('Collapses multiple empty lines and trims whitespace', () => {
        const formatter = new GherkinFormattingEditProvider();
        const unformatted = [
            'Feature: Empty lines   ', // trailing whitespace
            '',
            '',
            '',
            '',
            'Scenario: Has spaces    ',
            '    ' // just spaces
        ];

        const formatted = formatter.formatGherkin(unformatted);
        assert.strictEqual(formatted.length, 3);
        assert.strictEqual(formatted[0], 'Feature: Empty lines');
        assert.strictEqual(formatted[1], '');
        assert.strictEqual(formatted[2], '  Scenario: Has spaces');
    });

    test('Normalizes Scenario Outline variables by trimming spaces inside brackets', () => {
        const formatter = new GherkinFormattingEditProvider();
        const unformatted = [
            'Scenario Outline: Test variables',
            '  Given I login as < username >',
            '  And my password is <   pass word   >',
            '  Examples:',
            '    | < username > | <   pass word   > |',
            '    | admin | 1234 |'
        ];

        const formatted = formatter.formatGherkin(unformatted);
        assert.strictEqual(formatted[0], '  Scenario Outline: Test variables');
        assert.strictEqual(formatted[1], '    Given I login as <username>');
        assert.strictEqual(formatted[2], '    And my password is <pass word>');
        assert.strictEqual(formatted[3], '    Examples:');
        assert.strictEqual(formatted[4], '      | <username> | <pass word> |');
        assert.strictEqual(formatted[5], '      | admin      | 1234        |');
    });
});
