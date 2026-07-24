import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';

export interface Configuration {
    indentation: { steps: number; };
    tables: { alignToKeyword: boolean; };
    tags: { format: 'wrap' | 'singleLine'; sort: 'preserve' | 'alphabetical'; };
    emptyLines: { betweenScenarios: number; };
    behave: { stepGlobs: string[]; ignoreGlobs: string[]; additionalArguments: string[]; command: string; };
}

export const DEFAULT_CONFIG: Configuration = {
    indentation: { steps: 4 },
    tables: { alignToKeyword: true },
    tags: { format: 'wrap', sort: 'preserve' },
    emptyLines: { betweenScenarios: 1 },
    behave: {
        stepGlobs: ["**/steps/**/*.py", "**/features/steps/**/*.py"],
        ignoreGlobs: ["**/node_modules/**", "**/.venv/**", "**/venv/**", "**/env/**"],
        additionalArguments: [],
        command: "behave"
    }
};

export const PROFILES: Record<string, Configuration> = {
    custom: JSON.parse(JSON.stringify(DEFAULT_CONFIG)),
    strict: {
        ...JSON.parse(JSON.stringify(DEFAULT_CONFIG)),
        tags: { format: 'wrap', sort: 'alphabetical' }
    },
    team: JSON.parse(JSON.stringify(DEFAULT_CONFIG)),
    minimal: {
        ...JSON.parse(JSON.stringify(DEFAULT_CONFIG)),
        indentation: { steps: 2 },
        tables: { alignToKeyword: false },
        tags: { format: 'singleLine', sort: 'preserve' },
        emptyLines: { betweenScenarios: 0 }
    },
    legacy: {
        ...JSON.parse(JSON.stringify(DEFAULT_CONFIG)),
        indentation: { steps: 2 },
        tables: { alignToKeyword: false }
    }
};
export interface ConfigError {
    key: string;
    message: string;
}

/**
 * Pure function to validate and merge parsed JSON against the base configuration.
 * Respects precedence when baseConfig is provided (Project > Workspace > User > Default).
 * Extracted to allow CLI/testing usage without depending on VS Code API.
 */
export function validateAndMergeConfig(parsed: any, baseConfig?: Configuration): { errors: ConfigError[], config: Configuration } {
    const errors: ConfigError[] = [];
    const config: Configuration = JSON.parse(JSON.stringify(baseConfig || DEFAULT_CONFIG));

    if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
        errors.push({ key: 'root', message: 'Configuration must be a JSON object.' });
        return { errors, config };
    }

    const validSections = ['indentation', 'tables', 'tags', 'emptyLines', 'behave'];

    for (const key of Object.keys(parsed)) {
        if (!validSections.includes(key)) {
            errors.push({ key, message: `Unknown configuration section: "${key}".` });
            continue;
        }

        if (typeof parsed[key] !== 'object' || parsed[key] === null || Array.isArray(parsed[key])) {
            errors.push({ key, message: `Section "${key}" must be an object.` });
            continue;
        }

        const section = parsed[key];

        if (key === 'indentation') {
            for (const subKey of Object.keys(section)) {
                if (subKey === 'steps') {
                    if (typeof section[subKey] !== 'number') {
                        errors.push({ key: subKey, message: `"indentation.steps" must be a number.` });
                    } else {
                        config.indentation.steps = section[subKey];
                    }
                } else {
                    errors.push({ key: subKey, message: `Unknown property in indentation: "${subKey}".` });
                }
            }
        } else if (key === 'tables') {
            for (const subKey of Object.keys(section)) {
                if (subKey === 'alignToKeyword') {
                    if (typeof section[subKey] !== 'boolean') {
                        errors.push({ key: subKey, message: `"tables.alignToKeyword" must be a boolean.` });
                    } else {
                        config.tables.alignToKeyword = section[subKey];
                    }
                } else {
                    errors.push({ key: subKey, message: `Unknown property in tables: "${subKey}".` });
                }
            }
        } else if (key === 'tags') {
            for (const subKey of Object.keys(section)) {
                if (subKey === 'format') {
                    if (section[subKey] !== 'wrap' && section[subKey] !== 'singleLine') {
                        errors.push({ key: subKey, message: `"tags.format" must be 'wrap' or 'singleLine'.` });
                    } else {
                        config.tags.format = section[subKey];
                    }
                } else if (subKey === 'sort') {
                    if (section[subKey] !== 'preserve' && section[subKey] !== 'alphabetical') {
                        errors.push({ key: subKey, message: `"tags.sort" must be 'preserve' or 'alphabetical'.` });
                    } else {
                        config.tags.sort = section[subKey];
                    }
                } else {
                    errors.push({ key: subKey, message: `Unknown property in tags: "${subKey}".` });
                }
            }
        } else if (key === 'emptyLines') {
            for (const subKey of Object.keys(section)) {
                if (subKey === 'betweenScenarios') {
                    if (typeof section[subKey] !== 'number') {
                        errors.push({ key: subKey, message: `"emptyLines.betweenScenarios" must be a number.` });
                    } else {
                        config.emptyLines.betweenScenarios = section[subKey];
                    }
                } else {
                    errors.push({ key: subKey, message: `Unknown property in emptyLines: "${subKey}".` });
                }
            }
        } else if (key === 'behave') {
            for (const subKey of Object.keys(section)) {
                if (subKey === 'stepGlobs' || subKey === 'ignoreGlobs' || subKey === 'additionalArguments') {
                    if (!Array.isArray(section[subKey]) || !section[subKey].every((i: any) => typeof i === 'string')) {
                        errors.push({ key: subKey, message: `"behave.${subKey}" must be an array of strings.` });
                    } else {
                        if (subKey === 'stepGlobs') { config.behave.stepGlobs = section[subKey]; }
                        if (subKey === 'ignoreGlobs') { config.behave.ignoreGlobs = section[subKey]; }
                        if (subKey === 'additionalArguments') { config.behave.additionalArguments = section[subKey]; }
                    }
                } else if (subKey === 'command') {
                    if (typeof section[subKey] !== 'string') {
                        errors.push({ key: subKey, message: `"behave.command" must be a string.` });
                    } else {
                        config.behave.command = section[subKey];
                    }
                } else {
                    errors.push({ key: subKey, message: `Unknown property in behave: "${subKey}".` });
                }
            }
        }
    }

    return { errors, config };
}

export class ConfigurationService {
    private cache = new Map<string, Configuration>();
    private diagnosticCollection: vscode.DiagnosticCollection;

    constructor(diagnosticCollection: vscode.DiagnosticCollection) {
        this.diagnosticCollection = diagnosticCollection;
    }

    public getConfiguration(uri: vscode.Uri | undefined): Configuration {
        const workspaceFolder = uri ? vscode.workspace.getWorkspaceFolder(uri) : undefined;
        const folderUri = workspaceFolder ? workspaceFolder.uri.toString() : 'global';

        if (this.cache.has(folderUri)) {
            return this.cache.get(folderUri)!;
        }

        const config = this.resolveConfiguration(workspaceFolder, uri);
        this.cache.set(folderUri, config);
        return config;
    }

    public invalidateCache(uri?: vscode.Uri) {
        if (uri) {
            const workspaceFolder = vscode.workspace.getWorkspaceFolder(uri);
            if (workspaceFolder) {
                this.cache.delete(workspaceFolder.uri.toString());
                const configPath = path.join(workspaceFolder.uri.fsPath, '.gherkin-powertoolsrc.json');
                this.diagnosticCollection.delete(vscode.Uri.file(configPath));
            }
        } else {
            this.cache.clear();
            this.diagnosticCollection.clear();
        }
    }

    private resolveConfiguration(workspaceFolder: vscode.WorkspaceFolder | undefined, uri: vscode.Uri | undefined): Configuration {
        const vsCodeConfig = this.getVsCodeSettings(uri);

        if (!workspaceFolder) {
            return vsCodeConfig;
        }

        const configPath = path.join(workspaceFolder.uri.fsPath, '.gherkin-powertoolsrc.json');
        
        if (fs.existsSync(configPath)) {
            try {
                const content = fs.readFileSync(configPath, 'utf8');
                const parsed = JSON.parse(content);
                const { errors, config } = validateAndMergeConfig(parsed, vsCodeConfig);
                
                if (errors.length > 0) {
                    const diagnostics = errors.map(err => {
                        let line = 0;
                        const lines = content.split('\n');
                        const idx = lines.findIndex(l => l.includes(`"${err.key}"`));
                        if (idx >= 0) { line = idx; }
                        const range = new vscode.Range(line, 0, line, 100);
                        return new vscode.Diagnostic(range, err.message, vscode.DiagnosticSeverity.Error);
                    });
                    this.diagnosticCollection.set(vscode.Uri.file(configPath), diagnostics);
                } else {
                    this.diagnosticCollection.delete(vscode.Uri.file(configPath));
                }
                
                return config;
            } catch (e) {
                const range = new vscode.Range(0, 0, 0, 100);
                const diag = new vscode.Diagnostic(range, `Invalid JSON: ${(e as Error).message}`, vscode.DiagnosticSeverity.Error);
                this.diagnosticCollection.set(vscode.Uri.file(configPath), [diag]);
                return vsCodeConfig;
            }
        }

        this.diagnosticCollection.delete(vscode.Uri.file(configPath));
        return vsCodeConfig;
    }

    private getVsCodeSettings(uri: vscode.Uri | undefined): Configuration {
        const workspaceConfig = vscode.workspace.getConfiguration('gherkinPowerTools', uri);
        const profileName = workspaceConfig.get<string>('profile') || 'custom';
        const baseConfig = PROFILES[profileName] || PROFILES['custom'];
        const config: Configuration = JSON.parse(JSON.stringify(baseConfig));

        const getOverride = <T>(key: string): T | undefined => {
            const inspect = workspaceConfig.inspect<T>(key);
            if (inspect) {
                if (inspect.workspaceFolderValue !== undefined) return inspect.workspaceFolderValue;
                if (inspect.workspaceValue !== undefined) return inspect.workspaceValue;
                if (inspect.globalValue !== undefined) return inspect.globalValue;
            }
            return undefined;
        };

        const indentationSteps = getOverride<number>('indentation.steps');
        if (indentationSteps !== undefined && typeof indentationSteps === 'number') {
            config.indentation.steps = indentationSteps;
        }

        const alignToKeyword = getOverride<boolean>('tables.alignToKeyword');
        if (alignToKeyword !== undefined && typeof alignToKeyword === 'boolean') {
            config.tables.alignToKeyword = alignToKeyword;
        }

        const tagsFormat = getOverride<'wrap' | 'singleLine'>('tags.format');
        if (tagsFormat !== undefined && (tagsFormat === 'wrap' || tagsFormat === 'singleLine')) {
            config.tags.format = tagsFormat;
        }

        const tagsSort = getOverride<'preserve' | 'alphabetical'>('tags.sort');
        if (tagsSort !== undefined && (tagsSort === 'preserve' || tagsSort === 'alphabetical')) {
            config.tags.sort = tagsSort;
        }

        const emptyLinesBetween = getOverride<number>('emptyLines.betweenScenarios');
        if (emptyLinesBetween !== undefined && typeof emptyLinesBetween === 'number') {
            config.emptyLines.betweenScenarios = emptyLinesBetween;
        }

        const stepGlobs = getOverride<string[]>('behave.stepGlobs');
        if (stepGlobs !== undefined && Array.isArray(stepGlobs) && stepGlobs.every(i => typeof i === 'string')) {
            config.behave.stepGlobs = stepGlobs;
        }

        const ignoreGlobs = getOverride<string[]>('behave.ignoreGlobs');
        if (ignoreGlobs !== undefined && Array.isArray(ignoreGlobs) && ignoreGlobs.every(i => typeof i === 'string')) {
            config.behave.ignoreGlobs = ignoreGlobs;
        }

        const additionalArguments = getOverride<string[]>('behave.additionalArguments');
        if (additionalArguments !== undefined && Array.isArray(additionalArguments) && additionalArguments.every(i => typeof i === 'string')) {
            config.behave.additionalArguments = additionalArguments;
        }

        const command = getOverride<string>('behave.command');
        if (command !== undefined && typeof command === 'string') {
            config.behave.command = command;
        }

        return config;
    }
}

