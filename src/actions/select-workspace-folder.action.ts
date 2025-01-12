import type { WorkspaceFolder as VSWorkspaceFolder } from "vscode";
import { workspace } from "vscode";
import { TWorkspaceFolder } from "../extension.types";
import { Action } from "./action.abstract";

type TInput = {
  displayStep: number;
  displayTotalSteps: number;
  selectedWorkspace?: TWorkspaceFolder | null;
  workspaces: VSWorkspaceFolder[];
};

export class SelectWorkspaceFolderAction extends Action {
  public async execute({
    displayStep,
    displayTotalSteps,
    selectedWorkspace,
    workspaces,
  }: TInput): Promise<TWorkspaceFolder | undefined> {
    const items = workspaces.map<TWorkspaceFolder>((item) => ({
      ...item,
      label: item.name,
      detail: workspace.asRelativePath(item.uri.path),
    }));

    const value = await this.showSingleSelectionQuickPick(
      {
        activeItem: selectedWorkspace ?? undefined,
        canPickMany: false,
        ignoreFocusOut: true,
        items,
        placeholder: "Select the workspace in which the files will be created",
        title: "Workspace selection",
      },
      {
        displayStep,
        displayTotalSteps,
      }
    );

    return value as TWorkspaceFolder | undefined;
  }
}
