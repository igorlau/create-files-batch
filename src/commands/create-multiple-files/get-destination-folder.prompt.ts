import {
  commands,
  CompletionItemKind,
  languages,
  window,
  workspace,
} from "vscode";
import {
  CompletionItem,
  Position,
  TextDocument,
  WorkspaceFolder,
} from "vscode";
import * as path from "path";
import * as fs from "fs";

// export async function getDestinationFolderPrompt() {
//   const folder = await window.showInputBox({
//     title: "Select destination folder to place the files",
//     placeHolder: "Use a relative path from the workspace root...",
//     prompt: "The folder paths that do not exist will be created alongside.",
//     ignoreFocusOut: true,
//   });

//   return folder;
// }

async function findAllSubfolders(
  workspace: WorkspaceFolder,
  folderPath: string,
  searchString: string
): Promise<string[]> {
  try {
    const entries = await fs.promises.readdir(folderPath, {
      withFileTypes: true,
    });
    const matchingFolders: string[] = [];

    for (const entry of entries) {
      if (!entry.isDirectory()) {
        continue;
      }

      const fullPath = path.join(folderPath, entry.name);
      const relativePath = path.relative(workspace.uri.fsPath, fullPath);

      if (relativePath.toLowerCase().includes(searchString.toLowerCase())) {
        matchingFolders.push(fullPath);
      }

      matchingFolders.push(
        ...(await findAllSubfolders(workspace, fullPath, searchString))
      );
    }

    return matchingFolders;
  } catch (error) {
    return [];
  }
}

export async function getDestinationFolderPrompt(
  targetWorkspace: WorkspaceFolder
) {
  const inputBox = window.createInputBox();
  inputBox.title = "Destination path";
  inputBox.placeholder = "Use a relative path from the workspace root...";
  inputBox.prompt =
    "The folder paths that do not exist will be created alongside.";

  async function provideCompletionItems(
    _: TextDocument,
    position: Position
  ): Promise<CompletionItem[]> {
    const currentInput = inputBox.value.substring(0, position.character);

    const subFolders = await findAllSubfolders(
      targetWorkspace,
      targetWorkspace.uri.fsPath,
      currentInput
    );

    return subFolders.map((subFolder) => {
      const relativePath = path.relative(targetWorkspace.uri.fsPath, subFolder);
      const item = new CompletionItem(relativePath, CompletionItemKind.Folder);
      item.documentation = subFolder;
      return item;
    });
  }

  const provider = { provideCompletionItems };

  // inputBox.onDidChangeValue(() => {
  //   inputBox.items = [];
  // });

  const disposable = languages.registerCompletionItemProvider(
    "*",
    provider,
    "/"
  );

  return new Promise<string | undefined>((resolve) => {
    inputBox.onDidAccept(() => {
      resolve(inputBox.value);
      inputBox.hide();
      disposable.dispose();
    });

    inputBox.onDidHide(() => {
      resolve(undefined);
      disposable.dispose();
    });

    inputBox.show();
  });
}
