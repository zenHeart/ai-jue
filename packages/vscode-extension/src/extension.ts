import * as vscode from "vscode";
import * as cp from "child_process";
import * as path from "path";

export function activate(context: vscode.ExtensionContext) {
  console.log('Congratulations, your extension "ai-jue-vscode" is now active!');

  let initDisposable = vscode.commands.registerCommand("ai-jue.init", () => {
    const terminal = vscode.window.createTerminal("ai-jue");
    terminal.show();
    terminal.sendText("npx jue init");
  });

  let applyDisposable = vscode.commands.registerCommand("ai-jue.apply", () => {
    const terminal = vscode.window.createTerminal("ai-jue");
    terminal.show();
    terminal.sendText("npx jue apply");
  });

  let checkDisposable = vscode.commands.registerCommand("ai-jue.check", () => {
    const terminal = vscode.window.createTerminal("ai-jue");
    terminal.show();
    terminal.sendText("npx jue check");
  });

  context.subscriptions.push(initDisposable);
  context.subscriptions.push(applyDisposable);
  context.subscriptions.push(checkDisposable);

  // Status Bar Item
  const statusBarItem = vscode.window.createStatusBarItem(
    vscode.StatusBarAlignment.Right,
    100,
  );
  statusBarItem.command = "ai-jue.check";
  statusBarItem.text = "$(sync) AI-Jue";
  statusBarItem.tooltip = "Check for ai-jue preset updates";
  statusBarItem.show();
  context.subscriptions.push(statusBarItem);

  // Initial silent check
  performSilentCheck(statusBarItem);

  // Periodic check every hour
  const checkInterval = setInterval(
    () => {
      performSilentCheck(statusBarItem);
    },
    1000 * 60 * 60,
  );

  context.subscriptions.push({
    dispose: () => clearInterval(checkInterval),
  });
}

function performSilentCheck(statusBarItem: vscode.StatusBarItem) {
  const cwd = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
  if (!cwd) return;

  cp.exec("npx jue check --json", { cwd }, (error, stdout, stderr) => {
    if (error) {
      console.error(`ai-jue silent check error: ${error.message}`);
      return;
    }
    try {
      const result = JSON.parse(stdout);
      const hasUpdates = result.presets?.some((p: any) => p.hasUpdate);
      if (hasUpdates) {
        statusBarItem.text = "$(sync~spin) AI-Jue [UPDATE]";
        statusBarItem.backgroundColor = new vscode.ThemeColor(
          "statusBarItem.warningBackground",
        );
        statusBarItem.tooltip =
          "One or more ai-jue presets have updates available. Click to check.";
      } else {
        statusBarItem.text = "$(sync) AI-Jue";
        statusBarItem.backgroundColor = undefined;
        statusBarItem.tooltip = "Check for ai-jue preset updates";
      }
    } catch (e) {
      // Silently ignore parse errors
    }
  });
}

export function deactivate() {}
