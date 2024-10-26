import type { QuickPickItem, WorkspaceFolder } from "vscode";

export type TSettingsTemplate = {
  label: string;
  description: string;
  suffixes: string[];
};

export type TCreationTemplate = QuickPickItem & {
  suffixes: string[];
};

export type TWorkspaceFolder = QuickPickItem & WorkspaceFolder;
