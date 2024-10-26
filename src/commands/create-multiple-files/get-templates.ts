import { workspace } from "vscode";
import { CreationTemplate } from "./create-multiple-files.types";

const CUSTOM_CREATION_TEMPLATE: CreationTemplate = {
  id: "custom-template",
  label: "Custom",
  description: "Create multiple files based on input",
  suffixes: [],
};

export function getTemplates() {
  const templates = workspace
    .getConfiguration("create-files-batch")
    .get<CreationTemplate[]>("templates", []);

  templates.push(CUSTOM_CREATION_TEMPLATE);

  return templates;
}
