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

export interface SettingDefinition {
    key: string;
    section: keyof Configuration;
    property: string;
    type: 'number' | 'boolean' | 'string' | 'enum' | 'array';
    enumValues?: string[];
    default: any;
    description: string;
}

export const CONFIG_SCHEMA_CONTRACT: SettingDefinition[] = [
    {
        key: 'gherkinPowerTools.indentation.steps',
        section: 'indentation',
        property: 'steps',
        type: 'number',
        default: 4,
        description: 'Number of spaces to indent steps.'
    },
    {
        key: 'gherkinPowerTools.tables.alignToKeyword',
        section: 'tables',
        property: 'alignToKeyword',
        type: 'boolean',
        default: true,
        description: 'If true, tables align dynamically to the start of the step text.'
    },
    {
        key: 'gherkinPowerTools.tags.format',
        section: 'tags',
        property: 'format',
        type: 'enum',
        enumValues: ['wrap', 'singleLine'],
        default: 'wrap',
        description: "How to format long lists of tags."
    },
    {
        key: 'gherkinPowerTools.tags.sort',
        section: 'tags',
        property: 'sort',
        type: 'enum',
        enumValues: ['preserve', 'alphabetical'],
        default: 'preserve',
        description: "How to sort tags."
    },
    {
        key: 'gherkinPowerTools.emptyLines.betweenScenarios',
        section: 'emptyLines',
        property: 'betweenScenarios',
        type: 'number',
        default: 1,
        description: 'Number of empty lines to enforce between Scenario/Rule/Background blocks.'
    },
    {
        key: 'gherkinPowerTools.behave.stepGlobs',
        section: 'behave',
        property: 'stepGlobs',
        type: 'array',
        default: ["**/steps/**/*.py", "**/features/steps/**/*.py"],
        description: 'Glob patterns to locate Python/Behave step definition files.'
    },
    {
        key: 'gherkinPowerTools.behave.ignoreGlobs',
        section: 'behave',
        property: 'ignoreGlobs',
        type: 'array',
        default: ["**/node_modules/**", "**/.venv/**", "**/venv/**", "**/env/**"],
        description: 'Glob patterns to ignore when locating Python/Behave step definition files.'
    },
    {
        key: 'gherkinPowerTools.behave.additionalArguments',
        section: 'behave',
        property: 'additionalArguments',
        type: 'array',
        default: [],
        description: 'Additional arguments to pass to Behave when executing via CodeLens.'
    },
    {
        key: 'gherkinPowerTools.behave.command',
        section: 'behave',
        property: 'command',
        type: 'string',
        default: 'behave',
        description: 'The base command to run Behave.'
    }
];

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
        const config: Configuration = JSON.parse(JSON.stringify(DEFAULT_CONFIG));

        const indentationSteps = workspaceConfig.get<number>('indentation.steps');
        if (indentationSteps !== undefined && typeof indentationSteps === 'number') {
            config.indentation.steps = indentationSteps;
        }

        const alignToKeyword = workspaceConfig.get<boolean>('tables.alignToKeyword');
        if (alignToKeyword !== undefined && typeof alignToKeyword === 'boolean') {
            config.tables.alignToKeyword = alignToKeyword;
        }

        const tagsFormat = workspaceConfig.get<'wrap' | 'singleLine'>('tags.format');
        if (tagsFormat !== undefined && (tagsFormat === 'wrap' || tagsFormat === 'singleLine')) {
            config.tags.format = tagsFormat;
        }

        const tagsSort = workspaceConfig.get<'preserve' | 'alphabetical'>('tags.sort');
        if (tagsSort !== undefined && (tagsSort === 'preserve' || tagsSort === 'alphabetical')) {
            config.tags.sort = tagsSort;
        }

        const emptyLinesBetween = workspaceConfig.get<number>('emptyLines.betweenScenarios');
        if (emptyLinesBetween !== undefined && typeof emptyLinesBetween === 'number') {
            config.emptyLines.betweenScenarios = emptyLinesBetween;
        }

        const stepGlobs = workspaceConfig.get<string[]>('behave.stepGlobs');
        if (stepGlobs !== undefined && Array.isArray(stepGlobs) && stepGlobs.every(i => typeof i === 'string')) {
            config.behave.stepGlobs = stepGlobs;
        }

        const ignoreGlobs = workspaceConfig.get<string[]>('behave.ignoreGlobs');
        if (ignoreGlobs !== undefined && Array.isArray(ignoreGlobs) && ignoreGlobs.every(i => typeof i === 'string')) {
            config.behave.ignoreGlobs = ignoreGlobs;
        }

        const additionalArguments = workspaceConfig.get<string[]>('behave.additionalArguments');
        if (additionalArguments !== undefined && Array.isArray(additionalArguments) && additionalArguments.every(i => typeof i === 'string')) {
            config.behave.additionalArguments = additionalArguments;
        }

        const command = workspaceConfig.get<string>('behave.command');
        if (command !== undefined && typeof command === 'string') {
            config.behave.command = command;
        }

        return config;
    }
}

