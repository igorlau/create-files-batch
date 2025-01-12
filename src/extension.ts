import * as vscode from "vscode";
import { commands } from "vscode";
import { CreateFromCommandPaletteCommand } from "./commands/create-from-command-palette.command";
import { CreateFromMenuCommand } from "./commands/create-from-menu.command";

export function activate(context: vscode.ExtensionContext) {
  const commandPalleteDisposable = commands.registerCommand(
    "create-files-batch.create-from-command-palette",
    async () => {
      try {
        const createFilesCommand = new CreateFromCommandPaletteCommand();
        await createFilesCommand.execute();
      } catch (error) {
        if (error instanceof Error) {
          vscode.window.showErrorMessage(
            `Error creating files: ${error.message}`
          );
          return;
        }

        if (typeof error === "string") {
          vscode.window.showErrorMessage(`Error creating files: ${error}`);
          return;
        }

        vscode.window.showErrorMessage(
          `Error creating files: ${JSON.stringify(error)}`
        );
      }
    }
  );

  const contextMenuDisposable = vscode.commands.registerCommand(
    "create-files-batch.create-from-context-menu",
    async (uri: vscode.Uri) => {
      try {
        const createFilesCommand = new CreateFromMenuCommand(uri);
        await createFilesCommand.execute();
      } catch (error) {
        if (error instanceof Error) {
          vscode.window.showErrorMessage(
            `Error creating files: ${error.message}`
          );
          return;
        }

        if (typeof error === "string") {
          vscode.window.showErrorMessage(`Error creating files: ${error}`);
          return;
        }

        vscode.window.showErrorMessage(
          `Error creating files: ${JSON.stringify(error)}`
        );
      }
    }
  );

  context.subscriptions.push(contextMenuDisposable, commandPalleteDisposable);
}

// This method is called when your extension is deactivated
export function deactivate() {}
