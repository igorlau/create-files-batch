import { Uri, window, WorkspaceFolder } from "vscode";

export async function getDestinationFolderPrompt(
  targetWorkspace: WorkspaceFolder
): Promise<Uri | undefined> {
  const inputPath = await window.showInputBox({
    title: "Destination folder",
    prompt:
      "Enter the relative path for the folder that will hold the new files (e.g., 'src/components'). If the folder path does not fully exists the needed folders will be created.\n",
    placeHolder: "Enter relative folder path...",
    ignoreFocusOut: true,
  });

  return inputPath ? Uri.joinPath(targetWorkspace.uri, inputPath) : undefined;
}
