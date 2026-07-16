import * as vscode from 'vscode';

export interface BehaveConfiguration {
    stepGlobs: string[];
    ignoreGlobs: string[];
    stepGlobPattern: string;
    ignoreGlobPattern: string;
}

/**
 * Retrieves and normalizes the Behave configuration from VS Code settings.
 */
export function getBehaveConfiguration(): BehaveConfiguration {
    const config = vscode.workspace.getConfiguration('gherkinPowerTools.behave');
    const stepGlobs = config.get<string[]>('stepGlobs', ['**/steps/**/*.py', '**/features/steps/**/*.py']);
    const ignoreGlobs = config.get<string[]>('ignoreGlobs', ['**/node_modules/**', '**/.venv/**', '**/venv/**', '**/env/**']);

    const stepGlobPattern = stepGlobs.length > 1 ? `{${stepGlobs.join(',')}}` : (stepGlobs[0] || '');
    const ignoreGlobPattern = ignoreGlobs.length > 1 ? `{${ignoreGlobs.join(',')}}` : (ignoreGlobs[0] || '');

    return { stepGlobs, ignoreGlobs, stepGlobPattern, ignoreGlobPattern };
}

/**
 * Synchronously checks if a file URI matches any of the ignore globs.
 * Converts basic globs to regular expressions.
 */
export function isFileIgnored(uri: vscode.Uri, ignoreGlobs: string[]): boolean {
    const path = uri.fsPath.replace(/\\/g, '/'); // normalize for cross-platform
    
    for (const glob of ignoreGlobs) {
        if (!glob) continue;
        
        // Basic glob to regex conversion.
        let regexStr = glob
            .replace(/\./g, '\\.')
            .replace(/\*\*/g, '.*')
            .replace(/\*/g, '[^/]*')
            .replace(/\?/g, '.');
            
        // If it doesn't start with **, match from start but allow leading characters
        if (!glob.startsWith('**')) {
            regexStr = '^.*' + regexStr; 
        }
        
        // Add end anchor
        regexStr = regexStr + '$';
        
        try {
            const regex = new RegExp(regexStr);
            if (regex.test(path)) {
                return true;
            }
        } catch (e) {
            // Ignore invalid regex derived from glob
        }
    }
    
    return false;
}
