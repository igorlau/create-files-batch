import type { ExtensionContext } from "vscode";
import { commands } from "vscode";
import { CreateMultipleFilesCommand } from "./create-multiple-files.command";

export function activate(context: ExtensionContext) {
  const disposable = commands.registerCommand(
    "create-files-batch.create-multiple-files",
    async () => {
      const createMultipleFilesCommand = new CreateMultipleFilesCommand();
      await createMultipleFilesCommand.execute();
    }
  );

  context.subscriptions.push(disposable);
}

// This method is called when your extension is deactivated
export function deactivate() {}
