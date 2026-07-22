import * as vscode from 'vscode';
import { ConfigurationService } from './configuration';

let behaveTerminal: vscode.Terminal | undefined;
let memoryAdditionalArgs: string | undefined = undefined;

export function clearMemoryArgs() {
    memoryAdditionalArgs = undefined;
}

function getTerminal(): vscode.Terminal {
    if (behaveTerminal) {
        if (vscode.window.terminals.includes(behaveTerminal)) {
            return behaveTerminal;
        }
    }
    behaveTerminal = vscode.window.createTerminal('Behave');
    return behaveTerminal;
}

export async function buildBehaveCommand(uri: vscode.Uri, line: number | undefined, configService: ConfigurationService): Promise<string> {
    const config = configService.getConfiguration(uri);
    
    let additionalArgs = config.behave.additionalArguments.join(' ');
    if (memoryAdditionalArgs !== undefined) {
        additionalArgs = memoryAdditionalArgs;
    }
    
    const baseCommand = config.behave.command || 'behave';
    
    let pathArg = uri.fsPath;
    const workspaceFolder = vscode.workspace.getWorkspaceFolder(uri);
    if (workspaceFolder) {
        pathArg = './' + vscode.workspace.asRelativePath(uri, false);
    }

    if (line !== undefined) {
        pathArg = `${pathArg}:${line}`;
    }
    
    const quotedPathArg = `"${pathArg}"`;
    
    return `${baseCommand} ${additionalArgs} ${quotedPathArg}`.replace(/\s+/g, ' ').trim();
}

export async function runBehave(uri: vscode.Uri, line: number | undefined, configService: ConfigurationService) {
    const command = await buildBehaveCommand(uri, line, configService);
    
    const t = getTerminal();
    t.show(true); 
    t.sendText(command);
}

export async function runBehaveWithPrompt(uri: vscode.Uri, line: number | undefined, configService: ConfigurationService) {
    const defaultCommand = await buildBehaveCommand(uri, line, configService);
    
    const command = await vscode.window.showInputBox({
        prompt: "Edit the Behave execution command",
        value: defaultCommand,
        placeHolder: "Enter the command to run Behave"
    });
    
    if (command) {
        const config = configService.getConfiguration(uri);
        const baseCommand = config.behave.command || 'behave';
        
        let pathArg = uri.fsPath;
        const workspaceFolder = vscode.workspace.getWorkspaceFolder(uri);
        if (workspaceFolder) {
            pathArg = './' + vscode.workspace.asRelativePath(uri, false);
        }

        if (line !== undefined) {
            pathArg = `${pathArg}:${line}`;
        }
        const quotedPathArg = `"${pathArg}"`;
        
        const prefix = baseCommand + " ";
        if (command.startsWith(prefix)) {
            let newArgsStr = command.substring(prefix.length).trim();
            
            if (newArgsStr.includes(quotedPathArg)) {
                newArgsStr = newArgsStr.replace(quotedPathArg, '').replace(/\s+/g, ' ').trim();
            } else if (newArgsStr.includes(pathArg)) {
                newArgsStr = newArgsStr.replace(pathArg, '').replace(/\s+/g, ' ').trim();
            }
            
            const action = await vscode.window.showInformationMessage(
                'Execution arguments updated. Do you want to save them permanently to your Workspace Settings?',
                'Save to Workspace',
                'Just for this session'
            );

            if (action === 'Save to Workspace') {
                const argsArray = parseArgsStringToVector(newArgsStr);
                await vscode.workspace.getConfiguration('gherkinPowerTools.behave').update('additionalArguments', argsArray, vscode.ConfigurationTarget.Workspace);
                memoryAdditionalArgs = undefined;
                vscode.window.showInformationMessage('Execution arguments saved to Workspace Settings. Click "Run" to execute.');
            } else {
                memoryAdditionalArgs = newArgsStr;
                vscode.window.showInformationMessage('Execution arguments updated for this session. Click "Run" to execute.');
            }
        } else {
            vscode.window.showErrorMessage('Command must start with the configured Behave base command.');
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
        console: "integratedTerminal"
    };
    
    if (!workspaceFolder) {
        vscode.window.showErrorMessage('A workspace folder must be open to start debugging.');
        return;
    }

    vscode.debug.startDebugging(workspaceFolder, debugConfig);
}

