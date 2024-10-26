import type { QuickPickItem, WorkspaceFolder } from "vscode";
import { FileType, Uri, window, workspace } from "vscode";
import { MultiStepForm } from "./utils/multi-step-input-form";

export type TSettingsTemplate = {
  label: string;
  description: string;
  suffixes: string[];
};

export type TCreationTemplate = QuickPickItem & {
  suffixes: string[];
};

export type TWorkspaceFolder = QuickPickItem & WorkspaceFolder;

type CreateMultipleFilesState = {
  workspace: TWorkspaceFolder | null;
  template: TCreationTemplate | null;
  folder: { uri: Uri; relativePath: string } | null;
  prefix: string | null;
};

export class CreateMultipleFilesCommand extends MultiStepForm<CreateMultipleFilesState> {
  private readonly CUSTOM_SETTINGS_TEMPLATE: TSettingsTemplate = {
    label: "Custom",
    description: "Create multiple files based on input",
    suffixes: [],
  };

  constructor() {
    const initialState: CreateMultipleFilesState = {
      workspace: null,
      template: null,
      folder: null,
      prefix: null,
    };

    super(5, initialState);
  }

  async execute() {
    const workspace = await this.getWorkspaceFolderPrompt();

    if (!workspace) {
      return;
    }

    const selectedTemplate = await this.getTemplatePrompt(workspace);

    if (!selectedTemplate) {
      return;
    }

    const hasCustomTemplateSelected =
      selectedTemplate.label.toLowerCase() ===
      this.CUSTOM_SETTINGS_TEMPLATE.label.toLowerCase();

    if (hasCustomTemplateSelected) {
      const customSuffixes = await this.getSuffixesPrompt();
      selectedTemplate.suffixes = customSuffixes;
    }

    if (selectedTemplate.suffixes.length === 0) {
      window.showInformationMessage("No suffixes provided.");
      return;
    }

    const folder = await this.getDestinationFolderPrompt(workspace);

    if (!folder) {
      return;
    }

    const prefix = await this.getFilesPrefixPrompt();

    if (!prefix) {
      return;
    }

    await this.createFoldersAndFilesTask(
      folder,
      selectedTemplate.suffixes,
      prefix
    );
  }

  private async getWorkspaceFolderPrompt(): Promise<
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

  private async getTemplatePrompt(
    workspaceFolder: TWorkspaceFolder
  ): Promise<TCreationTemplate | undefined> {
    const templates = this.loadTemplates(workspaceFolder);

    const selectedTemplate = await window.showQuickPick(templates, {
      title: "Template selection",
      placeHolder: "Select a predefined template or use a custom creation",
      ignoreFocusOut: true,
    });

    return selectedTemplate;
  }

  private async loadTemplates(
    workspaceFolder: TWorkspaceFolder
  ): Promise<TCreationTemplate[]> {
    const templates = workspace
      .getConfiguration("create-files-batch", workspaceFolder.uri)
      .get<TSettingsTemplate[]>("templates", []);

    templates.push(this.CUSTOM_SETTINGS_TEMPLATE);

    const creationTemplates = templates.map<TCreationTemplate>((template) => ({
      /** Replace description with detail prop to break lines at command palette */
      detail: template.description,
      label: template.label,
      suffixes: template.suffixes,
    }));

    return creationTemplates;
  }

  private async getSuffixesPrompt(): Promise<string[]> {
    const suffixesInput = await window.showInputBox({
      title: "Files custom suffixes",
      placeHolder: "Enter comma separated values...",
      prompt:
        "Each item must start with a dot. The files will be created as `{prefix}{suffix}`.",
      ignoreFocusOut: true,
    });

    if (!suffixesInput) {
      return [];
    }

    const suffixes = suffixesInput
      .split(",")
      .filter((item) => item === ",")
      .map((item) => item.trim());

    return suffixes;
  }

  private async getDestinationFolderPrompt(
    targetWorkspace: TWorkspaceFolder
  ): Promise<Uri | undefined> {
    const inputPath = await window.showInputBox({
      title: "Destination folder",
      prompt:
        "Enter the relative path for the folder that will hold the new files (e.g., 'src/components'). If the folder path does not fully exists the needed folders will be created.\n",
      placeHolder: "Enter relative folder path...",
      ignoreFocusOut: true,
    });

    return inputPath ? Uri.joinPath(targetWorkspace.uri, inputPath) : undefined;
  }

  private async getFilesPrefixPrompt(): Promise<string | undefined> {
    const prefix = await window.showInputBox({
      title: "Files start name or prefix",
      placeHolder: "Enter the prefix...",
      prompt:
        "The files will be created as `{prefix}{suffix}`. The suffixes are the ones defined in your settings.json for the template you have selected or the ones you have specified for a custom template.",
      ignoreFocusOut: true,
    });

    return prefix;
  }

  private async createFoldersAndFilesTask(
    targetFolder: Uri,
    suffixes: string[],
    prefix: string
  ): Promise<void> {
    const destinationFolderUri = Uri.joinPath(targetFolder);

    await this.createFolderStructure(destinationFolderUri);

    for (const suffix of suffixes) {
      const fileName = `${prefix}${suffix}`;
      const fileUri = Uri.joinPath(destinationFolderUri, fileName);

      await workspace.fs.writeFile(fileUri, new Uint8Array());
    }
  }

  private async createFolderStructure(folderUri: Uri): Promise<void> {
    const pathParts = folderUri.path.split("/").filter(Boolean);
    let currentPath = "/";

    for (const part of pathParts) {
      currentPath = `${currentPath}${part}/`;

      const currentUri = Uri.file(currentPath);

      try {
        const stat = await workspace.fs.stat(currentUri);
        if (stat.type !== FileType.Directory) {
          throw new Error("Specified folder is not a directory");
        }
      } catch {
        await workspace.fs.createDirectory(currentUri);
      }
    }
  }
}
