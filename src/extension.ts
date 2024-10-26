import { commands } from "vscode";
import type { ExtensionContext } from "vscode";
import { createMultipleFilesCommand } from "./create-multiple-files.command";

export function activate(context: ExtensionContext) {
  const disposable = commands.registerCommand(
    "create-files-batch.create-multiple-files",
    createMultipleFilesCommand
  );
  
  context.subscriptions.push(disposable);
}

// This method is called when your extension is deactivated
export function deactivate() {}
