import { commands, window } from "vscode";
import { CUSTOM_SETTINGS_TEMPLATE } from "./create-multiple-files.constants";
import { getDestinationFolderPrompt } from "./prompts/get-destination-folder.prompt";
import { getFilesPrefixPrompt } from "./prompts/get-files-prefix.prompt";
import { getSuffixesPrompt } from "./prompts/get-suffixes.prompt";
import { getTemplatePrompt } from "./prompts/get-template.prompt";
import { getWorkspaceFolderPrompt } from "./prompts/get-workspace-folder.prompt";
import { createFoldersAndFilesTask } from "./tasks/create-files.task";
import { loadTemplatesTask } from "./tasks/load-templates.task";

export async function createMultipleFilesCommand() {
  const workspace = await getWorkspaceFolderPrompt();

  if (!workspace) {
    return;
  }

  const templates = loadTemplatesTask(workspace);
  const selectedTemplate = await getTemplatePrompt(templates);

  if (!selectedTemplate) {
    return;
  }

  const suffixes: string[] = selectedTemplate.suffixes;

  if (
    selectedTemplate.label.toLowerCase() ===
    CUSTOM_SETTINGS_TEMPLATE.label.toLowerCase()
  ) {
    const customSuffixes = await getSuffixesPrompt();
    suffixes.push(...customSuffixes);
  }

  if (suffixes.length === 0) {
    window.showInformationMessage("No suffixes provided.");
    return;
  }

  const folder = await getDestinationFolderPrompt(workspace);

  if (!folder) {
    return;
  }

  const prefix = await getFilesPrefixPrompt();

  if (!prefix) {
    return;
  }

  await createFoldersAndFilesTask(folder, selectedTemplate.suffixes, prefix);
}
