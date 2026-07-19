import * as vscode from 'vscode';

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

    public async detectBehaveLayouts(): Promise<string[]> {
        const pyFiles = await vscode.workspace.findFiles('**/*.py', this.excludePattern, 1000);
        const candidateGlobs = new Set<string>();

        for (const file of pyFiles) {
            const relativePath = vscode.workspace.asRelativePath(file, false);
            const parts = relativePath.split('/');
            
            const stepsIndex = parts.indexOf('steps');
            if (stepsIndex !== -1) {
                const dirPath = parts.slice(0, stepsIndex + 1).join('/');
                candidateGlobs.add(`${dirPath}/**/*.py`);
            } else {
                const featuresIndex = parts.indexOf('features');
                if (featuresIndex !== -1 && featuresIndex === parts.length - 2) {
                    const dirPath = parts.slice(0, featuresIndex + 1).join('/');
                    candidateGlobs.add(`${dirPath}/**/*.py`);
                }
            }
        }
        
        const iniFiles = await vscode.workspace.findFiles('**/{behave.ini,.behaverc,tox.ini,setup.cfg}', this.excludePattern, 10);
        for (const ini of iniFiles) {
            try {
                const content = (await vscode.workspace.fs.readFile(ini)).toString();
                const stepsDirMatch = content.match(/steps_dir\s*=\s*(.+)/);
                if (stepsDirMatch && stepsDirMatch[1]) {
                    const stepsDir = stepsDirMatch[1].trim();
                    const relativeIniPath = vscode.workspace.asRelativePath(ini, false);
                    const iniDirPath = relativeIniPath.substring(0, relativeIniPath.lastIndexOf('/'));
                    const prefix = iniDirPath ? `${iniDirPath}/` : '';
                    candidateGlobs.add(`${prefix}${stepsDir}/**/*.py`);
                    candidateGlobs.add(`${prefix}features/${stepsDir}/**/*.py`);
                }
            } catch (e) {}
        }

        return Array.from(candidateGlobs);
    }

    public async diagnoseWorkspace(context: vscode.ExtensionContext, isManualTrigger: boolean = false): Promise<void> {
        const config = vscode.workspace.getConfiguration('gherkinPowerTools.behave');
        const currentGlobs = config.inspect<string[]>('stepGlobs');
        
        if (!isManualTrigger && (currentGlobs?.workspaceValue || currentGlobs?.globalValue)) {
            return;
        }

        const layouts = await this.detectBehaveLayouts();
        const defaultGlobs = ['**/steps/**/*.py', '**/features/steps/**/*.py'];

        const isCoveredByDefault = layouts.length > 0 && layouts.every(layout => 
            defaultGlobs.some(dg => {
                const suffix = dg.replace('**/', '');
                return layout.endsWith(suffix) || layout === dg;
            })
        );

        if (layouts.length === 1) {
            if (isCoveredByDefault && !isManualTrigger) {
                // Use the current automatic behavior if safe without prompting
                await context.globalState.update('hasRunBehaveFirstRun', true);
                return;
            }

            const message = `Gherkin PowerTools: Detected Python Behave steps at '${layouts[0]}'. Would you like to configure this as your step discovery pattern?`;
            const action = await vscode.window.showInformationMessage(message, 'Configure Automatically', 'Ignore');
            
            if (action === 'Configure Automatically') {
                await config.update('stepGlobs', layouts, vscode.ConfigurationTarget.Workspace);
                if (isManualTrigger) {
                    vscode.window.showInformationMessage('Step discovery configured successfully.');
                }
            }
        } else if (layouts.length > 1) {
            const selected = await vscode.window.showQuickPick(layouts, {
                canPickMany: true,
                title: 'Gherkin PowerTools: Multiple Behave layouts detected',
                placeHolder: 'Select the directories that contain your step definitions'
            });

            if (selected && selected.length > 0) {
                await config.update('stepGlobs', selected, vscode.ConfigurationTarget.Workspace);
                if (isManualTrigger) {
                    vscode.window.showInformationMessage('Step discovery configured successfully.');
                }
            }
        } else {
            if (isManualTrigger) {
                const action = await vscode.window.showInformationMessage(
                    'Gherkin PowerTools: Could not automatically detect Behave step definitions. Please configure them manually.',
                    'Open Settings',
                    'Cancel'
                );
                if (action === 'Open Settings') {
                    vscode.commands.executeCommand('workbench.action.openSettings', 'gherkinPowerTools.behave.stepGlobs');
                }
            }
        }

        await context.globalState.update('hasRunBehaveFirstRun', true);
    }
}

export const discoveryService = new BehaveFileDiscoveryService();
