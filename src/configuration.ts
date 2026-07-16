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
        
        // Convert glob to regex, using a placeholder for ** to avoid
        // the single-star replacement from corrupting already-converted `.*`.
        const DOUBLE_STAR = '\x00DOUBLESTAR\x00';
        let regexStr = glob
            .replace(/\*\*/g, DOUBLE_STAR)     // protect ** first
            .replace(/\./g, '\\.')             // escape literal dots
            .replace(/\*/g, '[^/]*')           // single * → no-slash wildcard
            .replace(/\?/g, '.')               // ? → any single char
            .replace(new RegExp(DOUBLE_STAR.replace(/\x00/g, '\\x00'), 'g'), '.*'); // restore **

        // If it doesn't start with **, allow any leading path
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
