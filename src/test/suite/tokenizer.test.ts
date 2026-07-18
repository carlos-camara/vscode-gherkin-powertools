import * as assert from 'assert';
import { parsePythonDecorators } from '../../tokenizer';

suite('Python Tokenizer Test Suite', () => {
    test('Basic decorator', () => {
        const content = `@given("I login")\ndef foo(): pass`;
        const res = parsePythonDecorators(content);
        assert.strictEqual(res.length, 1);
        assert.strictEqual(res[0].type, 'given');
        assert.strictEqual(res[0].argumentText, 'I login');
        assert.strictEqual(res[0].isStringLiteral, true);
        assert.strictEqual(res[0].startLine, 0);
        assert.strictEqual(res[0].endLine, 0);
    });

    test('Single quotes', () => {
        const content = `@when('I click')`;
        const res = parsePythonDecorators(content);
        assert.strictEqual(res.length, 1);
        assert.strictEqual(res[0].argumentText, 'I click');
        assert.strictEqual(res[0].isStringLiteral, true);
    });

    test('String prefixes', () => {
        const prefixes = ['r', 'u', 'f', 'b', 'fr', 'rf', 'br', 'rb'];
        for (const p of prefixes) {
            const res = parsePythonDecorators(`@then(${p}"foo")`);
            assert.strictEqual(res.length, 1);
            assert.strictEqual(res[0].argumentText, 'foo');
            assert.strictEqual(res[0].isStringLiteral, true);
        }
    });

    test('Triple quotes and multiline', () => {
        const content = `@given("""I login
with valid credentials""")`;
        const res = parsePythonDecorators(content);
        assert.strictEqual(res.length, 1);
        assert.strictEqual(res[0].argumentText, 'I login\nwith valid credentials');
        assert.strictEqual(res[0].isStringLiteral, true);
        assert.strictEqual(res[0].endLine, 1);
    });

    test('Escaped quotes', () => {
        const content = `@step("I type \\"hello\\"")`;
        const res = parsePythonDecorators(content);
        assert.strictEqual(res.length, 1);
        assert.strictEqual(res[0].argumentText, 'I type \\"hello\\"');
        assert.strictEqual(res[0].isStringLiteral, true);
    });

    test('Dynamic expressions (not string literals)', () => {
        const content = `@given(MY_CONSTANT)\n@when(get_step_name())\n@then("str" + "ing")`;
        const res = parsePythonDecorators(content);
        assert.strictEqual(res.length, 3);
        
        assert.strictEqual(res[0].type, 'given');
        assert.strictEqual(res[0].argumentText, 'MY_CONSTANT');
        assert.strictEqual(res[0].isStringLiteral, false);

        assert.strictEqual(res[1].type, 'when');
        assert.strictEqual(res[1].argumentText, 'get_step_name()');
        assert.strictEqual(res[1].isStringLiteral, false);

        assert.strictEqual(res[2].type, 'then');
        assert.strictEqual(res[2].argumentText, '"str" + "ing"');
        assert.strictEqual(res[2].isStringLiteral, false);
    });

    test('Spaces and comments inside parens', () => {
        const content = `@given(  \n  # this is a comment\n  "foo"  \n)`;
        const res = parsePythonDecorators(content);
        assert.strictEqual(res.length, 1);
        assert.strictEqual(res[0].argumentText, 'foo');
        assert.strictEqual(res[0].isStringLiteral, true);
    });

    test('Extraneous parenthesis in string', () => {
        const content = `@step("foo (bar)")`;
        const res = parsePythonDecorators(content);
        assert.strictEqual(res.length, 1);
        assert.strictEqual(res[0].argumentText, 'foo (bar)');
        assert.strictEqual(res[0].isStringLiteral, true);
    });
});
