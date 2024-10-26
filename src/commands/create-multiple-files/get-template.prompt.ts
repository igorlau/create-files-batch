import type { QuickPickItem } from "vscode";
import { window } from "vscode";
import { CreationTemplate } from "./create-multiple-files.types";

export async function getTemplatePrompt(templates: CreationTemplate[]) {
  const quickPickItems = templates.map<QuickPickItem>((template) => ({
    /** Replace description with detail prop to break lines at command palette */
    detail: template.description,
    label: template.label,
    suffixes: template.suffixes,
  }));

  const selectedTemplate = await window.showQuickPick(quickPickItems, {
    title: "Template selection",
    placeHolder: "Select a predefined template or use a custom creation",
    ignoreFocusOut: true,
  });

  return selectedTemplate as CreationTemplate | undefined;
}
