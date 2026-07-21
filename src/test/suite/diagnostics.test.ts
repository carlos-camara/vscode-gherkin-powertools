import * as assert from 'assert';
import * as vscode from 'vscode';
import { DiagnosticEngine, redactPath, redactReportText } from '../../diagnostics';

suite('DiagnosticEngine & Redaction Test Suite', () => {
    let engine: DiagnosticEngine;

    setup(() => {
        engine = new DiagnosticEngine();
    });

    test('redactPath sanitizes usernames and home directories', () => {
        const homePath = '/Users/johndoe/projects/my-project';
        const redacted = redactPath(homePath, '/Users/johndoe', 'johndoe');
        assert.ok(!redacted.includes('johndoe'));
        assert.ok(redacted.includes('<redacted>'));
    });

    test('redactReportText sanitizes text output containing user paths', () => {
        const sampleOutput = 'Error opening /Users/alice/workspace/features/steps/login.py';
        const sanitized = redactReportText(redactPath(sampleOutput, '/Users/alice', 'alice'));
        assert.ok(!sanitized.includes('alice'));
        assert.ok(sanitized.includes('<redacted>'));
    });

    test('collectDiagnostics gathers metrics and produces report object', async () => {
        const report = await engine.collectDiagnostics();

        assert.ok(report.extensionVersion);
        assert.ok(report.vscodeVersion);
        assert.ok(report.operatingSystem);
        assert.ok(Array.isArray(report.stepGlobs));
        assert.ok(Array.isArray(report.ignoreGlobs));
        assert.ok(Array.isArray(report.warnings));
        assert.ok(Array.isArray(report.recommendations));
    });

    test('generateReportMarkdown formats report as readable text', async () => {
        const report = await engine.collectDiagnostics();
        const markdown = engine.generateReportMarkdown(report);

        assert.ok(markdown.includes('=== GHERKIN POWERTOOLS DIAGNOSTIC REPORT ==='));
        assert.ok(markdown.includes('--- ENVIRONMENT ---'));
        assert.ok(markdown.includes('--- DISCOVERY & INDEXING ---'));
        assert.ok(markdown.includes('--- PYTHON & BEHAVE ENVIRONMENT ---'));
        assert.ok(markdown.includes('=== END OF REPORT ==='));
    });

    test('collectDiagnostics generates warnings for empty workspace or missing files', async () => {
        const originalFolders = vscode.workspace.workspaceFolders;
        Object.defineProperty(vscode.workspace, 'workspaceFolders', { get: () => [] });

        const report = await engine.collectDiagnostics();
        assert.ok(report.warnings.some(w => w.includes('No workspace folder')));

        Object.defineProperty(vscode.workspace, 'workspaceFolders', { get: () => originalFolders });
    });
});
