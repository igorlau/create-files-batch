import type { ExtensionContext } from "vscode";
import { commands, window, workspace } from "vscode";

type CreationTemplate = {
  label: string;
  description: string;
  suffixes: string[];
};

const CUSTOM_CREATION_TEMPLATE: CreationTemplate = {
  label: "Custom",
  description: "Create multiple files based on input",
  suffixes: [],
};

function getTemplates() {
  const templates = workspace
    .getConfiguration("create-files-batch")
    .get<CreationTemplate[]>("templates", []);

  templates.push(CUSTOM_CREATION_TEMPLATE);

  return templates;
}

async function selectTemplate(templates: CreationTemplate[]) {
  const quickPickItems = templates.map((template) => ({
    /** Replace description with detail prop to break lines at command palette */
    detail: template.description,
    label: template.label,
    suffixes: template.suffixes,
  }));

  const selectedTemplate = await window.showQuickPick(quickPickItems, {
    title: "Select template",
    placeHolder: "Select a predefined template or use a custom creation",
  });

  return selectedTemplate;
}

export function activate(context: ExtensionContext) {
  const disposable = commands.registerCommand(
    "create-files-batch.create-files",
    async () => {
      const templates = getTemplates();
      const selectedTemplate = await selectTemplate(templates);
      window.showInformationMessage(`Got ${selectedTemplate}`);
    }
  );

  context.subscriptions.push(disposable);
}

// This method is called when your extension is deactivated
export function deactivate() {}
