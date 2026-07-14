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

    test('analyzeText and showStatisticsDashboard: Achieves full coverage by scanning a complex document', async () => {
        const docContent = `
        @ui @regression
        Feature: Coverage Test
        
        # This is a comment
        Background: Setup
          Given I click the button
          And I navigate to the url
        
        Rule: A simple rule
        
        @api
        Scenario: API Request
          When I send an api request
          Then the status code is 200
          But the response json is valid
        
        Scenario Outline: DB Query
          Given I query the database table
          | id |
          | 1  |
        `;
        
        // Open the document in memory so calculateStatistics can find it via openDocs
        const vscode = require('vscode');
        const doc = await vscode.workspace.openTextDocument({ language: 'feature', content: docContent });
        
        // Run calculateStatistics directly to assert parser logic
        const stats = await calculateStatistics();
        assert.strictEqual(stats.totalFeatures, 1, 'Should find 1 Feature');
        assert.strictEqual(stats.totalRules, 1, 'Should find 1 Rule');
        assert.strictEqual(stats.totalBackgrounds, 1, 'Should find 1 Background');
        assert.strictEqual(stats.totalScenarios, 1, 'Should find 1 Scenario');
        assert.strictEqual(stats.totalScenarioOutlines, 1, 'Should find 1 Scenario Outline');
        assert.strictEqual(stats.totalComments, 1, 'Should find 1 Comment');
        assert.strictEqual(stats.totalDataRows, 2, 'Should find 2 Data Rows (header + 1 row)');
        assert.ok(stats.totalTags >= 3, 'Should find at least 3 Tags (@ui, @regression, @api)');
        assert.ok(stats.uiSteps >= 2, 'Should find UI steps');
        assert.ok(stats.apiSteps >= 2, 'Should find API steps');
        assert.ok(stats.dbSteps >= 1, 'Should find DB steps');
        assert.ok(stats.totalGiven >= 2, 'Should find Given steps');
        assert.ok(stats.totalWhen >= 1, 'Should find When steps');
        assert.ok(stats.totalThen >= 1, 'Should find Then steps');
        assert.ok(stats.totalAnd >= 1, 'Should find And steps');
        assert.ok(stats.totalBut >= 1, 'Should find But steps');

        // Test the showStatisticsDashboard wrapper to cover lines 49-65
        const { showStatisticsDashboard } = require('../../statistics');
        const dummyContext = { extension: { packageJSON: { version: '1.0.0' } } } as any;
        
        // It creates a webview panel internally and shouldn't throw
        await showStatisticsDashboard(dummyContext);
        
        // Close the mock document
        // We can't close it directly without showing it, but it will be garbage collected or discarded at end of test.
    });
});
