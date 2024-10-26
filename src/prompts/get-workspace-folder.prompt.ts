import { window, workspace } from "vscode";
import { TWorkspaceFolder } from "../create-multiple-files.types";

export async function getWorkspaceFolderPrompt(): Promise<
  TWorkspaceFolder | undefined
> {
  const workspaces = workspace.workspaceFolders;

  if (!workspaces || workspaces.length === 0) {
    return undefined;
  }

  if (workspaces.length === 1) {
    return {
      ...workspaces[0],
      label: workspaces[0].name,
      detail: workspace.asRelativePath(workspaces[0].uri.path),
    };
  }

  const items = workspaces.map<TWorkspaceFolder>((item) => ({
    ...item,
    label: item.name,
    detail: workspace.asRelativePath(item.uri.path),
  }));

  const selectedWorkspace = await window.showQuickPick(items, {
    title: "Workspace selection",
    placeHolder: "Select the workspace in which the files will be created",
    ignoreFocusOut: true,
  });

  return selectedWorkspace;
}
