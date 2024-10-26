import { workspace } from "vscode";
import { CUSTOM_SETTINGS_TEMPLATE } from "../create-multiple-files.constants";
import {
  TCreationTemplate,
  TSettingsTemplate,
  TWorkspaceFolder,
} from "../create-multiple-files.types";

export function loadTemplatesTask(
  workspaceFolder: TWorkspaceFolder
): TCreationTemplate[] {
  const templates = workspace
    .getConfiguration("create-files-batch", workspaceFolder.uri)
    .get<TSettingsTemplate[]>("templates", []);

  templates.push(CUSTOM_SETTINGS_TEMPLATE);

  const creationTemplates = templates.map<TCreationTemplate>((template) => ({
    /** Replace description with detail prop to break lines at command palette */
    detail: template.description,
    label: template.label,
    suffixes: template.suffixes,
  }));

  return creationTemplates;
}
