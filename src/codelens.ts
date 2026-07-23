import * as vscode from 'vscode';
import { dialectService } from './dialect';

export class BehaveCodeLensProvider implements vscode.CodeLensProvider {
    private onDidChangeCodeLensesEmitter = new vscode.EventEmitter<void>();
    public readonly onDidChangeCodeLenses = this.onDidChangeCodeLensesEmitter.event;

    constructor() {
        vscode.workspace.onDidChangeConfiguration(() => {
            this.onDidChangeCodeLensesEmitter.fire();
        });
    }

    public async provideCodeLenses(document: vscode.TextDocument, token: vscode.CancellationToken): Promise<vscode.CodeLens[]> {
        const lenses: vscode.CodeLens[] = [];
        
        if (document.languageId !== 'feature' && document.languageId !== 'gherkin') {
            return lenses;
        }
        
        const dialect = dialectService.getDialect(document);
        if (!dialect) {
            return lenses;
        }
        
        const featureKeywords = dialect.feature.map(k => k.trim() + ':');
        // Rule also gets Scenario-level code lenses because it can contain scenarios, but normally we execute the scenario inside.
        // Actually, users might want to execute a specific Rule. We'll map Rule to scenario execution which takes line numbers.
        const scenarioKeywords = [...dialect.scenario, ...dialect.scenarioOutline, ...dialect.rule].map(k => k.trim() + ':');
        const examplesKeywords = dialect.examples.map(k => k.trim() + ':');
        
        let inExamples = false;
        let headerPassed = false;
        
        for (let i = 0; i < document.lineCount; i++) {
            if (token.isCancellationRequested) {
                break;
            }
            
            const lineText = document.lineAt(i).text.trim();
            if (!lineText || lineText.startsWith('#')) {
                continue;
            }
            
            if (inExamples) {
                if (lineText.startsWith('|')) {
                    if (!headerPassed) {
                        headerPassed = true;
                    } else {
                        const firstCharIndex = document.lineAt(i).firstNonWhitespaceCharacterIndex;
                        const range = new vscode.Range(i, firstCharIndex, i, 100);
                        const args = [document.uri, i + 1];
                        lenses.push(new vscode.CodeLens(range, { title: "▶", tooltip: "Run Example", command: "gherkinPowerTools.runScenario", arguments: args }));
                        lenses.push(new vscode.CodeLens(range, { title: "🐞", tooltip: "Debug Example", command: "gherkinPowerTools.debugScenario", arguments: args }));
                    }
                    continue;
                } else {
                    inExamples = false;
                    headerPassed = false;
                }
            }
            
            let isFeature = false;
            let isScenario = false;
            let isExamples = false;
            
            for (const fk of featureKeywords) {
                if (lineText.startsWith(fk)) {
                    isFeature = true;
                    break;
                }
            }
            
            if (!isFeature) {
                for (const sk of scenarioKeywords) {
                    if (lineText.startsWith(sk)) {
                        isScenario = true;
                        break;
                    }
                }
            }
            
            if (!isFeature && !isScenario) {
                for (const ek of examplesKeywords) {
                    if (lineText.startsWith(ek)) {
                        isExamples = true;
                        break;
                    }
                }
            }
            
            if (isExamples) {
                inExamples = true;
                headerPassed = false;
                continue;
            }
            
            if (isFeature || isScenario) {
                const range = new vscode.Range(i, 0, i, 100);
                const isF = isFeature; // capture for the closure/objects
                
                const runTitle = isF ? "▶ Run Feature" : "▶ Run Scenario";
                const runCmd = isF ? "gherkinPowerTools.runFeature" : "gherkinPowerTools.runScenario";
                
                const dbgTitle = "🐞 Debug";
                const dbgCmd = isF ? "gherkinPowerTools.debugFeature" : "gherkinPowerTools.debugScenario";
                
                const argsTitle = "$(edit) Edit";
                const argsCmd = isF ? "gherkinPowerTools.runFeatureWithArgs" : "gherkinPowerTools.runScenarioWithArgs";
                
                // arguments for scenarios are [uri, line_number] (1-indexed)
                const args = isF ? [document.uri] : [document.uri, i + 1];
                
                lenses.push(new vscode.CodeLens(range, { title: runTitle, command: runCmd, arguments: args }));
                lenses.push(new vscode.CodeLens(range, { title: dbgTitle, command: dbgCmd, arguments: args }));
                lenses.push(new vscode.CodeLens(range, { title: argsTitle, command: argsCmd, arguments: args }));
            }
        }
        
        return lenses;
    }
}
