import * as vscode from 'vscode';
import { logger } from './logger';

export class BehaveFileDiscoveryService {
    private stepWatchers: vscode.FileSystemWatcher[] = [];

    // Validates and normalizes an array of glob strings
    public normalizeGlobs(globs: any, defaultGlobs: string[]): string[] {
        if (!globs || !Array.isArray(globs) || globs.length === 0) {
            return defaultGlobs;
        }
        const validGlobs = globs.filter(g => typeof g === 'string' && g.trim().length > 0);
        return validGlobs.length > 0 ? validGlobs : defaultGlobs;
    }

    public get stepGlobs(): string[] {
        const config = vscode.workspace.getConfiguration('gherkinPowerTools.behave');
        return this.normalizeGlobs(
            config.get('stepGlobs'),
            ['**/steps/**/*.py', '**/features/steps/**/*.py']
        );
    }

    public get ignoreGlobs(): string[] {
        const config = vscode.workspace.getConfiguration('gherkinPowerTools.behave');
        return this.normalizeGlobs(
            config.get('ignoreGlobs'),
            ['**/node_modules/**', '**/.venv/**', '**/venv/**', '**/env/**']
        );
    }

    public get globPattern(): string {
        const globs = this.stepGlobs;
        return globs.length > 1 ? `{${globs.join(',')}}` : globs[0];
    }

    public get excludePattern(): string {
        const globs = this.ignoreGlobs;
        return globs.length > 1 ? `{${globs.join(',')}}` : globs[0];
    }

    public async getStepFiles(): Promise<vscode.Uri[]> {
        const stepGlobs = this.stepGlobs;
        const excludePattern = this.excludePattern;
        
        // Use a Map to deduplicate Uris by string path
        const fileMap = new Map<string, vscode.Uri>();
        
        for (const pattern of stepGlobs) {
            const files = await vscode.workspace.findFiles(pattern, excludePattern);
            for (const file of files) {
                fileMap.set(file.toString(), file);
            }
        }
        
        return Array.from(fileMap.values());
    }

    public setupWatchers(
        onCreated: (uri: vscode.Uri) => void,
        onChanged: (uri: vscode.Uri) => void,
        onDeleted: (uri: vscode.Uri) => void
    ): vscode.FileSystemWatcher[] {
        this.disposeWatchers();
        
        // Deduplicate step globs
        const uniqueGlobs = Array.from(new Set(this.stepGlobs));
        
        for (const pattern of uniqueGlobs) {
            const watcher = vscode.workspace.createFileSystemWatcher(pattern);
            
            watcher.onDidCreate(onCreated);
            watcher.onDidChange(onChanged);
            watcher.onDidDelete(onDeleted);
            
            this.stepWatchers.push(watcher);
        }
        
        return this.stepWatchers;
    }

    public disposeWatchers(): void {
        for (const watcher of this.stepWatchers) {
            watcher.dispose();
        }
        this.stepWatchers = [];
    }

    public getBestWorkspaceFolder(documentUri: vscode.Uri): vscode.WorkspaceFolder | undefined {
        if (!vscode.workspace.workspaceFolders || vscode.workspace.workspaceFolders.length === 0) {
            return undefined;
        }

        const folder = vscode.workspace.getWorkspaceFolder(documentUri);
        if (folder) {
            return folder;
        }

        // Fallback to the first workspace folder
        return vscode.workspace.workspaceFolders[0];
    }
}

export const discoveryService = new BehaveFileDiscoveryService();
