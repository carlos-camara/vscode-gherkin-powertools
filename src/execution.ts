import * as vscode from 'vscode';
import { ConfigurationService } from './configuration';

let behaveTerminal: vscode.Terminal | undefined;
let memoryAdditionalArgs: string | undefined = undefined;

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
        if (line !== undefined) {
            pathArg = `${pathArg}:${line}`;
        }
        const quotedPathArg = `"${pathArg}"`;
        
        const prefix = baseCommand + " ";
        if (command.startsWith(prefix) && command.endsWith(quotedPathArg)) {
            const newArgsStr = command.substring(prefix.length, command.length - quotedPathArg.length).trim();
            memoryAdditionalArgs = newArgsStr;
        }

        const t = getTerminal();
        t.show(true); 
        t.sendText(command);
    }
}
