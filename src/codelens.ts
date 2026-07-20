import * as vscode from 'vscode';
import { parseGherkin } from './parser';

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
        
        if (document.languageId !== 'feature') {
            return lenses;
        }
        
        const { document: gherkinDocument } = await parseGherkin(document.getText());
        if (!gherkinDocument || !gherkinDocument.feature) {
            return lenses;
        }
        
        const feature = gherkinDocument.feature;
        
        if (feature.location && feature.location.line) {
            const line = feature.location.line - 1;
            const range = new vscode.Range(line, 0, line, 100);
            const command: vscode.Command = {
                title: "▶ Run Feature",
                command: "gherkinPowerTools.runFeature",
                arguments: [document.uri]
            };
            lenses.push(new vscode.CodeLens(range, command));

            const argsCommand: vscode.Command = {
                title: "$(edit)\u00A0Edit",
                command: "gherkinPowerTools.runFeatureWithArgs",
                arguments: [document.uri]
            };
            lenses.push(new vscode.CodeLens(range, argsCommand));

            const debugCommand: vscode.Command = {
                title: "🐞 Debug",
                command: "gherkinPowerTools.debugFeature",
                arguments: [document.uri]
            };
            lenses.push(new vscode.CodeLens(range, debugCommand));
        }

        for (const child of feature.children) {
            if (token.isCancellationRequested) {
                break;
            }
            if (child.scenario && child.scenario.location && child.scenario.location.line) {
                const line = child.scenario.location.line - 1;
                const range = new vscode.Range(line, 0, line, 100);
                const command: vscode.Command = {
                    title: "▶ Run Scenario",
                    command: "gherkinPowerTools.runScenario",
                    arguments: [document.uri, child.scenario.location.line]
                };
                lenses.push(new vscode.CodeLens(range, command));

                const argsCommand: vscode.Command = {
                    title: "$(edit)\u00A0Edit",
                    command: "gherkinPowerTools.runScenarioWithArgs",
                    arguments: [document.uri, child.scenario.location.line]
                };
                lenses.push(new vscode.CodeLens(range, argsCommand));

                const debugCommand: vscode.Command = {
                    title: "🐞 Debug",
                    command: "gherkinPowerTools.debugScenario",
                    arguments: [document.uri, child.scenario.location.line]
                };
                lenses.push(new vscode.CodeLens(range, debugCommand));
            } else if (child.rule) {
                for (const ruleChild of child.rule.children) {
                    if (token.isCancellationRequested) {
                        break;
                    }
                    if (ruleChild.scenario && ruleChild.scenario.location && ruleChild.scenario.location.line) {
                        const line = ruleChild.scenario.location.line - 1;
                        const range = new vscode.Range(line, 0, line, 100);
                        const command: vscode.Command = {
                            title: "▶ Run Scenario",
                            command: "gherkinPowerTools.runScenario",
                            arguments: [document.uri, ruleChild.scenario.location.line]
                        };
                        lenses.push(new vscode.CodeLens(range, command));

                        const argsCommand: vscode.Command = {
                            title: "$(edit)\u00A0Edit",
                            command: "gherkinPowerTools.runScenarioWithArgs",
                            arguments: [document.uri, ruleChild.scenario.location.line]
                        };
                        lenses.push(new vscode.CodeLens(range, argsCommand));

                        const debugCommand: vscode.Command = {
                            title: "🐞 Debug",
                            command: "gherkinPowerTools.debugScenario",
                            arguments: [document.uri, ruleChild.scenario.location.line]
                        };
                        lenses.push(new vscode.CodeLens(range, debugCommand));
                    }
                }
            }
        }
        
        return lenses;
    }
}
