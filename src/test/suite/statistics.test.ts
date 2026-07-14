import * as assert from 'assert';
import { escapeHtml } from '../../statistics';

suite('Statistics Security (XSS & Escaping) Test Suite', () => {

    test('escapeHtml: Escapes <script> tags', () => {
        const input = '<script>alert(1)</script>';
        const expected = '&lt;script&gt;alert(1)&lt;/script&gt;';
        assert.strictEqual(escapeHtml(input), expected);
    });

    test('escapeHtml: Escapes <img onerror>', () => {
        const input = '<img src="x" onerror="alert(1)">';
        const expected = '&lt;img src=&quot;x&quot; onerror=&quot;alert(1)&quot;&gt;';
        assert.strictEqual(escapeHtml(input), expected);
    });

    test('escapeHtml: Escapes ampersands', () => {
        const input = 'Foo & Bar';
        const expected = 'Foo &amp; Bar';
        assert.strictEqual(escapeHtml(input), expected);
    });

    test('escapeHtml: Escapes single and double quotes', () => {
        const input = 'O\'Brian said "Hello"';
        const expected = 'O&#039;Brian said &quot;Hello&quot;';
        assert.strictEqual(escapeHtml(input), expected);
    });

    test('escapeHtml: Handles complex SVG payload', () => {
        const input = '<svg onload="alert(1)"></svg>';
        const expected = '&lt;svg onload=&quot;alert(1)&quot;&gt;&lt;/svg&gt;';
        assert.strictEqual(escapeHtml(input), expected);
    });

    test('escapeHtml: Preserves safe Unicode characters without corrupting them', () => {
        const input = 'Escenario: 🚀 Testing Ñandú & "Château"';
        const expected = 'Escenario: 🚀 Testing Ñandú &amp; &quot;Château&quot;';
        assert.strictEqual(escapeHtml(input), expected);
    });

    test('escapeHtml: Handles empty strings correctly', () => {
        assert.strictEqual(escapeHtml(''), '');
    });

});
