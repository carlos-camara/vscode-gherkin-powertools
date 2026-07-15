import * as assert from 'assert';
import { parseGherkin } from '../../parser';

suite('Parser Architecture Test Suite', () => {

    test('should successfully parse a valid Gherkin document and return no errors', async () => {
        const text = `Feature: Valid feature
  Scenario: Valid scenario
    Given a step
`;
        const result = await parseGherkin(text);
        assert.ok(result.document);
        assert.ok(result.document.feature);
        assert.strictEqual(result.errors.length, 0);
    });

    test('should return partial document and errors when given invalid Gherkin syntax', async () => {
        const text = `Feature: Valid feature
  Scenario: Valid scenario
    Given a step
    Garbage line that is not a step!
`;
        const result = await parseGherkin(text);
        assert.ok(result.document, 'Document should still be returned (partial AST)');
        assert.ok(result.document.feature, 'Feature should be parsed');
        assert.ok(result.errors.length > 0, 'Should contain syntax errors');
        assert.match(result.errors[0].message, /got 'Garbage line/);
    });

    test('should not share parser state across concurrent operations', async () => {
        const validText = `Feature: Valid
  Scenario: S1
    Given valid
`;
        const invalidText = `Feature Invalid
  Scenario Missing Colon
    Given valid
`;

        const [validResult, invalidResult] = await Promise.all([
            parseGherkin(validText),
            parseGherkin(invalidText)
        ]);

        assert.strictEqual(validResult.errors.length, 0);
        assert.ok(invalidResult.errors.length > 0, 'Invalid text should have errors');
    });
});
