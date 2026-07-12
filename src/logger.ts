import * as vscode from 'vscode';

class Logger {
    private channel: vscode.OutputChannel;

    constructor() {
        this.channel = vscode.window.createOutputChannel('Gherkin PowerTools');
    }

    public info(message: string): void {
        this.channel.appendLine(`[INFO  - ${new Date().toLocaleTimeString()}] ${message}`);
    }

    public error(message: string, error?: any): void {
        this.channel.appendLine(`[ERROR - ${new Date().toLocaleTimeString()}] ${message}`);
        if (error) {
            if (error instanceof Error) {
                this.channel.appendLine(`        ${error.message}`);
                if (error.stack) {
                    this.channel.appendLine(`        ${error.stack}`);
                }
            } else {
                this.channel.appendLine(`        ${JSON.stringify(error)}`);
            }
        }
    }

    public show(): void {
        this.channel.show();
    }
}

export const logger = new Logger();
