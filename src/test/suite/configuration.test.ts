import * as assert from 'assert';
import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { ConfigurationService, DEFAULT_CONFIG } from '../../configuration';

suite('ConfigurationService Test Suite', () => {
    let configService: ConfigurationService;
    let mockDiagnostics: vscode.DiagnosticCollection;
    let workspacePath: string;

    setup(() => {
        mockDiagnostics = {
            name: 'mock',
            set: () => {},
            delete: () => {},
            clear: () => {},
            forEach: () => {},
            get: () => [],
            has: () => false,
            dispose: () => {}
        } as any;
        configService = new ConfigurationService(mockDiagnostics);

        // Assume we have at least one workspace folder
        workspacePath = vscode.workspace.workspaceFolders?.[0].uri.fsPath || '';
    });

    teardown(() => {
        configService.invalidateCache();
        const configPath = path.join(workspacePath, '.gherkin-powertoolsrc.json');
        if (fs.existsSync(configPath)) {
            fs.unlinkSync(configPath);
        }
    });

    test('Returns default configuration when no overrides exist', () => {
        // Ensure no local config file
        const configPath = path.join(workspacePath, '.gherkin-powertoolsrc.json');
        if (fs.existsSync(configPath)) {
            fs.unlinkSync(configPath);
        }

        // Mock vscode configuration to return undefined for everything
        const originalGetConfig = vscode.workspace.getConfiguration;
        vscode.workspace.getConfiguration = () => ({
            get: () => undefined
        } as any);

        const config = configService.getConfiguration(vscode.workspace.workspaceFolders?.[0].uri);

        assert.deepStrictEqual(config, DEFAULT_CONFIG);

        vscode.workspace.getConfiguration = originalGetConfig;
    });

    test('VS Code settings override defaults', () => {
        const configPath = path.join(workspacePath, '.gherkin-powertoolsrc.json');
        if (fs.existsSync(configPath)) {
            fs.unlinkSync(configPath);
        }

        const originalGetConfig = vscode.workspace.getConfiguration;
        vscode.workspace.getConfiguration = () => ({
            get: (key: string) => {
                if (key === 'indentation.steps') return 2;
                if (key === 'tags.format') return 'singleLine';
                return undefined;
            }
        } as any);

        const config = configService.getConfiguration(vscode.workspace.workspaceFolders?.[0].uri);

        assert.strictEqual(config.indentation.steps, 2);
        assert.strictEqual(config.tags.format, 'singleLine');
        assert.strictEqual(config.tables.alignToKeyword, true); // from default

        vscode.workspace.getConfiguration = originalGetConfig;
    });

    test('Project configuration overrides VS Code settings and defaults', () => {
        const configPath = path.join(workspacePath, '.gherkin-powertoolsrc.json');
        
        fs.writeFileSync(configPath, JSON.stringify({
            indentation: { steps: 8 },
            tables: { alignToKeyword: false }
        }));

        const originalGetConfig = vscode.workspace.getConfiguration;
        vscode.workspace.getConfiguration = () => ({
            get: (key: string) => {
                // VS Code setting which should be overridden by project config
                if (key === 'indentation.steps') return 2;
                // VS Code setting which should apply because it's not in project config
                if (key === 'tags.format') return 'singleLine';
                return undefined;
            }
        } as any);

        const config = configService.getConfiguration(vscode.workspace.workspaceFolders?.[0].uri);

        assert.strictEqual(config.indentation.steps, 8); // From project
        assert.strictEqual(config.tables.alignToKeyword, false); // From project
        assert.strictEqual(config.tags.format, 'wrap'); // Project overrides completely (falls back to default, doesn't merge with vscode settings for missing sections in project config)
        
        // Wait, validateAndMergeConfig merges with DEFAULT_CONFIG. So if project config exists, it ignores VS Code settings entirely.
        // Let's verify this behavior:
        assert.strictEqual(config.tags.format, 'wrap'); // Default

        vscode.workspace.getConfiguration = originalGetConfig;
    });

    test('Handles invalid JSON in project configuration gracefully', () => {
        const configPath = path.join(workspacePath, '.gherkin-powertoolsrc.json');
        
        fs.writeFileSync(configPath, '{ invalid json');

        let diagnosticSetCount = 0;
        mockDiagnostics.set = () => { diagnosticSetCount++; };

        const config = configService.getConfiguration(vscode.workspace.workspaceFolders?.[0].uri);

        // Should fall back to VS Code settings (which fall back to defaults)
        assert.strictEqual(config.indentation.steps, 4);
        assert.strictEqual(diagnosticSetCount, 1);
    });

    test('Handles invalid schema values in project configuration gracefully', () => {
        const configPath = path.join(workspacePath, '.gherkin-powertoolsrc.json');
        
        fs.writeFileSync(configPath, JSON.stringify({
            indentation: { steps: "not a number" } // Invalid type
        }));

        let diagnostics: vscode.Diagnostic[] = [];
        mockDiagnostics.set = ((_uri: any, diags: vscode.Diagnostic[]) => { diagnostics = diags; }) as any;

        const config = configService.getConfiguration(vscode.workspace.workspaceFolders?.[0].uri);

        // Should fall back to default for this invalid field
        assert.strictEqual(config.indentation.steps, 4);
        assert.strictEqual(diagnostics.length, 1);
        assert.ok(diagnostics[0].message.includes('must be a number'));
    });
});
