import { Uri, workspace } from "vscode";
import { TWorkspaceFolder } from "../extension.types";
import { Action } from "./action.abstract";

type TInput = {
  targetFolder: string;
};

export class IdentifyWorkspaceAction extends Action {
  public async execute({
    targetFolder,
  }: TInput): Promise<TWorkspaceFolder | undefined> {
    const targetWorkspace = workspace.getWorkspaceFolder(
      Uri.file(targetFolder)
    );

    if (!targetWorkspace) {
      return undefined;
    }

    return {
      ...targetWorkspace,
      label: targetWorkspace.name,
      detail: workspace.asRelativePath(targetWorkspace.uri.path),
    };
  }
}
