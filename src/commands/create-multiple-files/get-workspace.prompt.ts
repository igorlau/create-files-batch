import type { QuickPickItem, WorkspaceFolder } from "vscode";
import { window, workspace } from "vscode";

export async function getWorkspacePrompt() {
  const workspaces = workspace.workspaceFolders;

  if (!workspaces || workspaces.length === 0) {
    return undefined;
  }

  if (workspaces.length === 1) {
    return workspaces[0];
  }

  const items = workspaces.map<QuickPickItem>((workspace) => ({
    ...workspace,
    label: workspace.name,
  }));

  const selectedWorkspace = await window.showQuickPick(items, {
    title: "Workspace selection",
    placeHolder: "Select the workspace in which the files will be created",
    ignoreFocusOut: true,
  });

  return selectedWorkspace as WorkspaceFolder | undefined;
}
