import { commands } from "vscode";
import { createFiles } from "./create-files";
import { getDestinationFolderPrompt } from "./get-destination-folder.prompt";
import { getFilesPrefixPrompt } from "./get-files-prefix.prompt";
import { getTemplatePrompt } from "./get-template.prompt";
import { getTemplates } from "./get-templates";
import { getWorkspacePrompt } from "./get-workspace.prompt";

export default function registerCommand() {
  return commands.registerCommand(
    "create-files-batch.create-multiple-files",
    async () => {
      const templates = getTemplates();
      const selectedTemplate = await getTemplatePrompt(templates);

      if (!selectedTemplate) {
        return;
      }

      const workspace = await getWorkspacePrompt();

      if (!workspace) {
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

      await createFiles(folder, selectedTemplate.suffixes, prefix);
    }
  );
}
