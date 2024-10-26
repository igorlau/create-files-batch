import type { ExtensionContext } from "vscode";
import registerCreateMultipleFilesCmd from "./commands/create-multiple-files";

export function activate(context: ExtensionContext) {
  const createMultipleFilesDisposable = registerCreateMultipleFilesCmd();

  context.subscriptions.push(createMultipleFilesDisposable);
}

// This method is called when your extension is deactivated
export function deactivate() {}
