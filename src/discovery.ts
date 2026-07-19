import * as vscode from 'vscode';
import { ConfigurationService } from './configuration';

export class BehaveFileDiscoveryService {
    private stepWatchers: vscode.FileSystemWatcher[] = [];
    public configService?: ConfigurationService;

    // Validates and normalizes an array of glob strings
    public normalizeGlobs(globs: any, defaultGlobs: string[]): string[] {
        if (!globs || !Array.isArray(globs) || globs.length === 0) {
            return defaultGlobs;
        }
        const validGlobs = globs.filter(g => typeof g === 'string' && g.trim().length > 0);
        return validGlobs.length > 0 ? validGlobs : defaultGlobs;
    }

    public getStepGlobs(uri?: vscode.Uri): string[] {
        if (this.configService) {
            return this.configService.getConfiguration(uri).behave.stepGlobs;
        }
        return ['**/steps/**/*.py', '**/features/steps/**/*.py'];
    }

    public getIgnoreGlobs(uri?: vscode.Uri): string[] {
        if (this.configService) {
            return this.configService.getConfiguration(uri).behave.ignoreGlobs;
        }
        return ['**/node_modules/**', '**/.venv/**', '**/venv/**', '**/env/**'];
    }

    public getGlobPattern(uri?: vscode.Uri): string {
        const globs = this.getStepGlobs(uri);
        return globs.length > 1 ? `{${globs.join(',')}}` : globs[0];
    }

    public getExcludePattern(uri?: vscode.Uri): string {
        const globs = this.getIgnoreGlobs(uri);
        return globs.length > 1 ? `{${globs.join(',')}}` : globs[0];
    }

    public async getStepFiles(): Promise<vscode.Uri[]> {
        const fileMap = new Map<string, vscode.Uri>();
        
        if (!vscode.workspace.workspaceFolders || vscode.workspace.workspaceFolders.length === 0) {
            // No workspace folders, fallback to global
            const stepGlobs = this.getStepGlobs(undefined);
            const excludePattern = this.getExcludePattern(undefined);
            for (const pattern of stepGlobs) {
                const files = await vscode.workspace.findFiles(pattern, excludePattern);
                for (const file of files) {
                    fileMap.set(file.toString(), file);
                }
            }
            return Array.from(fileMap.values());
        }

        for (const folder of vscode.workspace.workspaceFolders) {
            const stepGlobs = this.getStepGlobs(folder.uri);
            const excludePattern = this.getExcludePattern(folder.uri);
            for (const pattern of stepGlobs) {
                const relativePattern = new vscode.RelativePattern(folder, pattern);
                const files = await vscode.workspace.findFiles(relativePattern, excludePattern);
                for (const file of files) {
                    fileMap.set(file.toString(), file);
                }
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
        
        if (!vscode.workspace.workspaceFolders || vscode.workspace.workspaceFolders.length === 0) {
            const uniqueGlobs = Array.from(new Set(this.getStepGlobs(undefined)));
            for (const pattern of uniqueGlobs) {
                const watcher = vscode.workspace.createFileSystemWatcher(pattern);
                watcher.onDidCreate(onCreated);
                watcher.onDidChange(onChanged);
                watcher.onDidDelete(onDeleted);
                this.stepWatchers.push(watcher);
            }
            return this.stepWatchers;
        }

        for (const folder of vscode.workspace.workspaceFolders) {
            const uniqueGlobs = Array.from(new Set(this.getStepGlobs(folder.uri)));
            for (const pattern of uniqueGlobs) {
                const relativePattern = new vscode.RelativePattern(folder, pattern);
                const watcher = vscode.workspace.createFileSystemWatcher(relativePattern);
                watcher.onDidCreate(onCreated);
                watcher.onDidChange(onChanged);
                watcher.onDidDelete(onDeleted);
                this.stepWatchers.push(watcher);
            }
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
