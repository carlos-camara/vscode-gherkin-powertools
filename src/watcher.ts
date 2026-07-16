import * as vscode from 'vscode';
import { SymbolCache } from './cache';
import { BehaveConfiguration, isFileIgnored, getBehaveConfiguration } from './configuration';
import { logger } from './logger';

export class StepWatcherManager implements vscode.Disposable {
    private watchers: vscode.FileSystemWatcher[] = [];
    private symbolCache: SymbolCache;
    private reLintCallback: () => void;
    private config!: BehaveConfiguration;

    // A simple debounce map to prevent double-parsing if multiple globs match the same file
    private updateTimeouts: Map<string, NodeJS.Timeout> = new Map();
    private deleteTimeouts: Map<string, NodeJS.Timeout> = new Map();

    constructor(symbolCache: SymbolCache, reLintCallback: () => void) {
        this.symbolCache = symbolCache;
        this.reLintCallback = reLintCallback;
    }

    /**
     * Initializes the manager, creates the watchers, and seeds the cache.
     */
    public async initialize(): Promise<void> {
        this.config = getBehaveConfiguration();
        
        // Ensure cache uses the same config
        await this.symbolCache.initialize(this.config);

        // Create watchers for each step glob
        for (const glob of this.config.stepGlobs) {
            if (!glob.trim()) continue;
            
            try {
                const watcher = vscode.workspace.createFileSystemWatcher(glob);
                watcher.onDidCreate(uri => this.handleUpdate(uri));
                watcher.onDidChange(uri => this.handleUpdate(uri));
                watcher.onDidDelete(uri => this.handleDelete(uri));
                this.watchers.push(watcher);
            } catch (err) {
                logger.error(`Error creating watcher for glob ${glob}:`, err);
            }
        }
        
        logger.info(`StepWatcherManager created ${this.watchers.length} watcher(s).`);
    }

    /**
     * Rebuilds the watchers and cache entirely (e.g. when configuration changes).
     */
    public async rebuild(): Promise<void> {
        logger.info('Rebuilding StepWatcherManager due to configuration change...');
        this.dispose();
        this.symbolCache.clear();
        await this.initialize();
        this.reLintCallback();
    }

    private handleUpdate(uri: vscode.Uri) {
        if (isFileIgnored(uri, this.config.ignoreGlobs)) {
            return;
        }

        const path = uri.fsPath;
        if (this.updateTimeouts.has(path)) {
            clearTimeout(this.updateTimeouts.get(path)!);
        }

        this.updateTimeouts.set(path, setTimeout(async () => {
            this.updateTimeouts.delete(path);
            try {
                await this.symbolCache.updateFile(uri);
                this.reLintCallback();
            } catch (err) {
                logger.error(`Error updating cache for file ${path}:`, err);
            }
        }, 50));
    }

    private handleDelete(uri: vscode.Uri) {
        const path = uri.fsPath;
        if (this.deleteTimeouts.has(path)) {
            clearTimeout(this.deleteTimeouts.get(path)!);
        }

        this.deleteTimeouts.set(path, setTimeout(() => {
            this.deleteTimeouts.delete(path);
            this.symbolCache.removeFile(uri);
            this.reLintCallback();
        }, 50));
    }

    public dispose() {
        for (const watcher of this.watchers) {
            watcher.dispose();
        }
        this.watchers = [];
        
        for (const timeout of this.updateTimeouts.values()) {
            clearTimeout(timeout);
        }
        this.updateTimeouts.clear();

        for (const timeout of this.deleteTimeouts.values()) {
            clearTimeout(timeout);
        }
        this.deleteTimeouts.clear();
    }
}
