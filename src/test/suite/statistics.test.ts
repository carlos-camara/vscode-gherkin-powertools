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

import { calculateStatistics, getDashboardHtml, getErrorHtml, getLoadingHtml, GherkinStats } from '../../statistics';

suite('Statistics Core Logic Test Suite', () => {
    
    test('calculateStatistics: Analyzes workspace feature files', async () => {
        const stats = await calculateStatistics();
        assert.ok(stats);
        assert.ok(stats.totalFiles >= 0);
        assert.ok(stats.totalSteps >= 0);
        assert.ok(stats.totalScenarios >= 0);
        // Ensure tagFrequencies and topRepeatedSteps are populated or empty
        assert.ok(Array.isArray(stats.tagFrequencies));
        assert.ok(Array.isArray(stats.topRepeatedSteps));
    });

    test('getLoadingHtml: Returns valid HTML', () => {
        const html = getLoadingHtml();
        assert.ok(html.includes('Analyzing Workspace'));
        assert.ok(html.includes('spinner'));
    });

    test('getErrorHtml: Returns valid HTML', () => {
        const html = getErrorHtml();
        assert.ok(html.includes('Error parsing workspace'));
    });

    test('getDashboardHtml: Renders stats correctly', () => {
        const dummyStats: GherkinStats = {
            totalFiles: 1,
            totalFeatures: 1,
            totalRules: 0,
            totalScenarios: 2,
            totalScenarioOutlines: 1,
            totalBackgrounds: 1,
            totalTags: 5,
            totalSteps: 10,
            totalGiven: 2,
            totalWhen: 4,
            totalThen: 2,
            totalAnd: 1,
            totalBut: 1,
            totalDataRows: 3,
            totalComments: 2,
            totalLines: 50,
            totalEmptyLines: 5,
            tagFrequencies: [['@smoke', 3], ['@regression', 2]],
            uiSteps: 2,
            apiSteps: 1,
            dbSteps: 0,
            uniqueStepsCount: 8,
            topRepeatedSteps: [['I login', 2]],
            totalWordsInSteps: 40,
            longestScenarioName: "Very long scenario name with <script>",
            maxStepsInScenario: 5
        };

        const html = getDashboardHtml(dummyStats, '1.8.0');
        
        // Assert HTML escaping in scenario name
        assert.ok(html.includes('Very long scenario name with &lt;script&gt;'));
        
        // Assert statistics are rendered
        assert.ok(html.includes('Score Breakdown'));
        assert.ok(html.includes('@smoke'));
        assert.ok(html.includes('I login'));
        
        // Test zero/empty edge cases
        const emptyStats: GherkinStats = { ...dummyStats, totalSteps: 0, uniqueStepsCount: 0, tagFrequencies: [], topRepeatedSteps: [] };
        const emptyHtml = getDashboardHtml(emptyStats, '1.8.0');
        assert.ok(emptyHtml.includes('No tags found'));
        assert.ok(emptyHtml.includes('No repeated steps'));
    });
});
