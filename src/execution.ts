import * as vscode from 'vscode';
import { ConfigurationService } from './configuration';

let memoryAdditionalArgs: string | undefined = undefined;

export function clearMemoryArgs() {
    memoryAdditionalArgs = undefined;
}

export const activeExecutions = new Map<string, vscode.TaskExecution | vscode.DebugSession>();

export function registerExecutionListeners(context: vscode.ExtensionContext) {
    context.subscriptions.push(
        vscode.tasks.onDidEndTask(e => {
            for (const [key, execution] of activeExecutions.entries()) {
                if (execution === e.execution) {
                    activeExecutions.delete(key);
                    break;
                }
            }
        })
    );
    context.subscriptions.push(
        vscode.debug.onDidTerminateDebugSession(session => {
            for (const [key, execution] of activeExecutions.entries()) {
                if (execution === session) {
                    activeExecutions.delete(key);
                    break;
                }
            }
        })
    );
}

export function getExecutionSignature(uri: vscode.Uri, line: number | undefined): string {
    return `${uri.toString()}#${line ?? 'all'}`;
}

export interface ExecutionDetails {
    executable: string;
    args: string[];
}

export async function resolveBehaveExecutionDetails(
    uri: vscode.Uri,
    line: number | undefined,
    configService: ConfigurationService
): Promise<ExecutionDetails | undefined> {
    const config = configService.getConfiguration(uri);
    
    let executable: string;
    let baseArgs: string[] = [];
    
    const configuredCommand = config.behave.command || 'behave';
    
    if (configuredCommand.trim() !== 'behave') {
        const parts = parseArgsStringToVector(configuredCommand);
        if (parts.length === 0) {
            vscode.window.showErrorMessage('Configured Behave command is empty.');
            return undefined;
        }
        executable = parts[0];
        baseArgs = parts.slice(1);
    } else {
        const pythonExt = vscode.extensions.getExtension('ms-python.python');
        let pythonExecParts: string[] | undefined;
        
        if (pythonExt) {
            if (!pythonExt.isActive) {
                await pythonExt.activate();
            }
            try {
                const api = pythonExt.exports;
                const workspaceFolder = vscode.workspace.getWorkspaceFolder(uri);
                if (api.settings && api.settings.getExecutionDetails) {
                    const details = api.settings.getExecutionDetails(workspaceFolder?.uri);
                    if (details && details.execCommand && details.execCommand.length > 0) {
                        pythonExecParts = details.execCommand;
                    }
                }
            } catch (e) {
                // Ignore python ext API errors
            }
        }
        
        if (pythonExecParts && pythonExecParts.length > 0) {
            executable = pythonExecParts[0];
            baseArgs = [...pythonExecParts.slice(1), '-m', 'behave'];
        } else {
            executable = 'behave';
            baseArgs = [];
        }
    }

    let additionalArgs: string[];
    if (memoryAdditionalArgs !== undefined) {
        additionalArgs = parseArgsStringToVector(memoryAdditionalArgs);
    } else {
        additionalArgs = [...config.behave.additionalArguments];
    }
    
    additionalArgs = additionalArgs.filter(a => a.trim().length > 0);
    
    let pathArg = uri.fsPath;
    const workspaceFolder = vscode.workspace.getWorkspaceFolder(uri);
    if (workspaceFolder) {
        pathArg = './' + vscode.workspace.asRelativePath(uri, false);
    }
    
    if (line !== undefined) {
        pathArg = `${pathArg}:${line}`;
    }
    
    const args = [...baseArgs, ...additionalArgs, pathArg];
    
    return { executable, args };
}

export async function runBehave(uri: vscode.Uri, line: number | undefined, configService: ConfigurationService) {
    const signature = getExecutionSignature(uri, line);
    if (activeExecutions.has(signature)) {
        vscode.window.showWarningMessage('This Behave test is already running. Please wait for it to finish or cancel it.');
        return;
    }

    const details = await resolveBehaveExecutionDetails(uri, line, configService);
    if (!details) { return; }

    const workspaceFolder = vscode.workspace.getWorkspaceFolder(uri);
    if (!workspaceFolder) {
        vscode.window.showErrorMessage('A workspace folder must be open to execute Behave tests safely.');
        return;
    }

    const taskName = line !== undefined ? `Behave Scenario (Line ${line})` : `Behave Feature`;
    
    const execution = new vscode.ProcessExecution(details.executable, details.args);
    
    const task = new vscode.Task(
        { type: 'gherkinPowerTools', command: 'run' },
        workspaceFolder,
        taskName,
        'Gherkin PowerTools',
        execution
    );
    
    task.presentationOptions = {
        echo: true,
        focus: true,
        panel: vscode.TaskPanelKind.Dedicated,
        showReuseMessage: false,
        clear: true
    };

    const taskExecution = await vscode.tasks.executeTask(task);
    activeExecutions.set(signature, taskExecution);
}

export async function runBehaveWithPrompt(uri: vscode.Uri, _line: number | undefined, configService: ConfigurationService) {
    const config = configService.getConfiguration(uri);
    
    let defaultArgsStr = config.behave.additionalArguments.join(' ');
    if (memoryAdditionalArgs !== undefined) {
        defaultArgsStr = memoryAdditionalArgs;
    }
    
    const newArgsStr = await vscode.window.showInputBox({
        prompt: "Edit Behave additional arguments (e.g., --tags=@wip --no-capture)",
        value: defaultArgsStr,
        placeHolder: "Enter additional arguments..."
    });
    
    if (newArgsStr !== undefined) {
        const action = await vscode.window.showInformationMessage(
            'Execution arguments updated. Do you want to save them permanently to your Workspace Settings?',
            'Save to Workspace',
            'Just for this session'
        );

        if (action === 'Save to Workspace') {
            const argsArray = parseArgsStringToVector(newArgsStr);
            const workspaceFolder = vscode.workspace.getWorkspaceFolder(uri);
            const target = workspaceFolder ? vscode.ConfigurationTarget.WorkspaceFolder : vscode.ConfigurationTarget.Workspace;
            await vscode.workspace.getConfiguration('gherkinPowerTools.behave', uri).update('additionalArguments', argsArray, target);
            memoryAdditionalArgs = undefined;
            vscode.window.showInformationMessage('Execution arguments saved. Click "Run" to execute.');
        } else if (action === 'Just for this session') {
            memoryAdditionalArgs = newArgsStr;
            vscode.window.showInformationMessage('Execution arguments updated for this session. Click "Run" to execute.');
        }
    }
}

export function parseArgsStringToVector(argsString: string): string[] {
    const args: string[] = [];
    let currentArg = '';
    let inQuotes = false;
    let quoteChar = '';

    for (let i = 0; i < argsString.length; i++) {
        const char = argsString[i];
        if (char === ' ' && !inQuotes) {
            if (currentArg.length > 0) {
                args.push(currentArg);
                currentArg = '';
            }
        } else if ((char === '"' || char === "'") && !inQuotes) {
            inQuotes = true;
            quoteChar = char;
        } else if (char === quoteChar && inQuotes) {
            inQuotes = false;
            quoteChar = '';
        } else {
            currentArg += char;
        }
    }
    if (currentArg.length > 0) {
        args.push(currentArg);
    }
    return args;
}

export async function debugBehave(uri: vscode.Uri, line: number | undefined, configService: ConfigurationService) {
    const signature = getExecutionSignature(uri, line);
    if (activeExecutions.has(signature)) {
        vscode.window.showWarningMessage('This Behave test is already running. Please wait for it to finish or cancel it.');
        return;
    }

    const pythonExtension = vscode.extensions.getExtension('ms-python.python');
    const debugpyExtension = vscode.extensions.getExtension('ms-python.debugpy');
    
    if (!pythonExtension && !debugpyExtension) {
        const action = await vscode.window.showErrorMessage(
            'The Python extension is required to debug Behave scenarios. Please install it to use this feature.',
            'Install Python Extension'
        );
        if (action === 'Install Python Extension') {
            vscode.commands.executeCommand('extension.open', 'ms-python.python');
        }
        return;
    }

    const config = configService.getConfiguration(uri);
    
    let additionalArgs: string[];
    if (memoryAdditionalArgs !== undefined) {
        additionalArgs = parseArgsStringToVector(memoryAdditionalArgs);
    } else {
        additionalArgs = [...config.behave.additionalArguments];
    }
    additionalArgs = additionalArgs.filter(a => a.trim().length > 0);
    
    let pathArg = uri.fsPath;
    const workspaceFolder = vscode.workspace.getWorkspaceFolder(uri);
    if (workspaceFolder) {
        pathArg = './' + vscode.workspace.asRelativePath(uri, false);
    }

    if (line !== undefined) {
        pathArg = `${pathArg}:${line}`;
    }
    
    const debugConfig: vscode.DebugConfiguration = {
        name: "Debug Behave (PowerTools)",
        type: "python",
        request: "launch",
        module: "behave",
        args: [...additionalArgs, pathArg],
        console: "integratedTerminal",
        justMyCode: false
    };
    
    if (!workspaceFolder) {
        vscode.window.showErrorMessage('A workspace folder must be open to start debugging.');
        return;
    }

    const started = await vscode.debug.startDebugging(workspaceFolder, debugConfig);
    if (started) {
        const disposable = vscode.debug.onDidStartDebugSession(session => {
            if (session.name === debugConfig.name) {
                activeExecutions.set(signature, session);
                disposable.dispose();
            }
        });
        setTimeout(() => disposable.dispose(), 5000);
    }
}
