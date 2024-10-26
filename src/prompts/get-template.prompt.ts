import { window } from "vscode";
import { TCreationTemplate } from "../create-multiple-files.types";

export async function getTemplatePrompt(
  templates: TCreationTemplate[]
): Promise<TCreationTemplate | undefined> {
  const selectedTemplate = await window.showQuickPick(templates, {
    title: "Template selection",
    placeHolder: "Select a predefined template or use a custom creation",
    ignoreFocusOut: true,
  });

  return selectedTemplate;
}
