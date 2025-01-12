import { Uri } from "vscode";
import { Action } from "./action.abstract";

type TInput = {
  displayStep: number;
  displayTotalSteps: number;
  selectedFolderRelativePath?: string;
  workspaceUri?: Uri;
};

export class InputDestinationFolderAction extends Action {
  public async execute({
    displayStep,
    displayTotalSteps,
    selectedFolderRelativePath,
    workspaceUri,
  }: TInput): Promise<{ uri: Uri; path: string } | undefined> {
    const inputPath = await this.showInputBox(
      {
        ignoreFocusOut: true,
        placeHolder: "Enter relative folder path...",
        prompt:
          "Enter the relative path for the folder that will hold the new files (e.g., 'src/components'). If the folder path does not fully exists the needed folders will be created.\n",
        title: "Destination folder",
        value: selectedFolderRelativePath,
      },
      {
        displayStep,
        displayTotalSteps,
      }
    );

    return inputPath && workspaceUri
      ? {
          uri: Uri.joinPath(workspaceUri, inputPath),
          path: inputPath,
        }
      : undefined;
  }
}
