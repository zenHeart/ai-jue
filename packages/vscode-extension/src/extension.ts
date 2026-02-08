import * as vscode from 'vscode';
import * as cp from 'child_process';
import * as path from 'path';

export function activate(context: vscode.ExtensionContext) {
	console.log('Congratulations, your extension "ai-jue-vscode" is now active!');

	let initDisposable = vscode.commands.registerCommand('ai-jue.init', () => {
		const terminal = vscode.window.createTerminal('ai-jue');
        terminal.show();
        terminal.sendText('npx jue init');
	});

    let applyDisposable = vscode.commands.registerCommand('ai-jue.apply', () => {
		const terminal = vscode.window.createTerminal('ai-jue');
        terminal.show();
        terminal.sendText('npx jue apply');
	});

    let checkDisposable = vscode.commands.registerCommand('ai-jue.check', () => {
		const terminal = vscode.window.createTerminal('ai-jue');
        terminal.show();
        terminal.sendText('npx jue check');
	});

	context.subscriptions.push(initDisposable);
    context.subscriptions.push(applyDisposable);
    context.subscriptions.push(checkDisposable);

    // Status Bar Item
    const statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
    statusBarItem.command = 'ai-jue.check';
    statusBarItem.text = '$(sync) AI-Jue';
    statusBarItem.tooltip = 'Check for ai-jue preset updates';
    statusBarItem.show();
    context.subscriptions.push(statusBarItem);
}

export function deactivate() {}
