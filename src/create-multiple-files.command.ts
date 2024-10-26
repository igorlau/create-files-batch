import type {
  QuickPickItem,
  WorkspaceFolder as VSWorkspaceFolder,
} from "vscode";
import { FileType, Uri, workspace } from "vscode";
import { MultiStepForm } from "./utils/multi-step-input-form";

export type TSettingsTemplate = {
  label: string;
  description: string;
  suffixes: string[];
};

export type TCreationTemplate = QuickPickItem & {
  suffixes: string[];
};

export type TWorkspaceFolder = QuickPickItem & VSWorkspaceFolder;

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

    super(initialState);
  }

  async execute() {
    const workspaces = workspace.workspaceFolders;

    if (!workspaces || workspaces.length === 0) {
      return undefined;
    }

    await this.stepThrough({
      1: {
        shouldSkip: () => workspaces.length === 1,
        whenSkip: () => {
          this.updateState("workspace", {
            ...workspaces[0],
            label: workspaces[0].name,
            detail: workspace.asRelativePath(workspaces[0].uri.path),
          });
        },
        execute: async () => {
          const selectedWorkspace = await this.getWorkspaceFolderPrompt(
            workspaces
          );
          this.updateState("workspace", selectedWorkspace ?? null);
        },
      },
      2: {
        shouldSkip: () => false,
        execute: async () => {
          const selectedTemplate = await this.getTemplatePrompt();
          this.updateState("template", selectedTemplate ?? null);
        },
      },
      3: {
        shouldSkip: (currentState) =>
          currentState.template?.label.toLowerCase() !==
          this.CUSTOM_SETTINGS_TEMPLATE.label.toLowerCase(),
        execute: async () => {
          const selectedSuffixes = await this.getSuffixesPrompt();

          const currentTemplate = {
            ...this.state.template,
            suffixes: selectedSuffixes,
          } as TCreationTemplate;

          this.updateState("template", currentTemplate);
        },
      },
      4: {
        shouldSkip: () => false,
        execute: async () => {
          const selectedFolder = await this.getDestinationFolderPrompt();
          this.updateState(
            "folder",
            selectedFolder
              ? { uri: selectedFolder.uri, relativePath: selectedFolder.path }
              : null
          );
        },
      },
      5: {
        shouldSkip: () => false,
        execute: async () => {
          const selectedPrefix = await this.getFilesPrefixPrompt();
          this.updateState("prefix", selectedPrefix ?? null);
        },
      },
    });

    if (!this.state.folder || !this.state.prefix || !this.state.template) {
      return;
    }

    const destinationFolderUri = Uri.joinPath(this.state.folder.uri);

    await this.createFolderStructure(destinationFolderUri);

    for (const suffix of this.state.template.suffixes) {
      const fileName = `${this.state.prefix}${suffix}`;
      const fileUri = Uri.joinPath(destinationFolderUri, fileName);

      await workspace.fs.writeFile(fileUri, new Uint8Array());
    }
  }

  private async getWorkspaceFolderPrompt(
    workspaces: readonly VSWorkspaceFolder[]
  ): Promise<TWorkspaceFolder | undefined> {
    const items = workspaces.map<TWorkspaceFolder>((item) => ({
      ...item,
      label: item.name,
      detail: workspace.asRelativePath(item.uri.path),
    }));

    const selectedWorkspace = await this.showSingleSelectionQuickPick({
      activeItem: this.state.workspace ?? undefined,
      canPickMany: false,
      ignoreFocusOut: true,
      items,
      placeholder: "Select the workspace in which the files will be created",
      title: "Workspace selection",
    });

    return selectedWorkspace as TWorkspaceFolder | undefined;
  }

  private async getTemplatePrompt(): Promise<TCreationTemplate | undefined> {
    const templates = workspace
      .getConfiguration("create-files-batch", this.state.workspace?.uri)
      .get<TSettingsTemplate[]>("templates", []);

    templates.push(this.CUSTOM_SETTINGS_TEMPLATE);

    const creationTemplates = templates.map<TCreationTemplate>((template) => ({
      /** Replace description with detail prop to break lines at command palette */
      detail: template.description,
      label: template.label,
      suffixes: template.suffixes,
    }));

    const selectedTemplate = await this.showSingleSelectionQuickPick({
      activeItem: this.state.template ?? undefined,
      ignoreFocusOut: true,
      items: creationTemplates,
      placeholder: "Select a predefined template or use a custom creation",
      title: "Template selection",
    });

    return selectedTemplate as TCreationTemplate | undefined;
  }

  private async getSuffixesPrompt(): Promise<string[]> {
    const suffixesInput = await this.showInputBox({
      ignoreFocusOut: true,
      placeHolder: "Enter comma separated values...",
      prompt:
        "Each item must start with a dot. The files will be created as `{prefix}{suffix}`.",
      title: "Files custom suffixes",
      value: this.state.template?.suffixes.join(","),
    });

    if (!suffixesInput) {
      return [];
    }

    const suffixes = suffixesInput
      .split(",")
      .filter((item) => item !== ",")
      .map((item) => item.trim());

    return suffixes;
  }

  private async getDestinationFolderPrompt(): Promise<
    { uri: Uri; path: string } | undefined
  > {
    const inputPath = await this.showInputBox({
      ignoreFocusOut: true,
      placeHolder: "Enter relative folder path...",
      prompt:
        "Enter the relative path for the folder that will hold the new files (e.g., 'src/components'). If the folder path does not fully exists the needed folders will be created.\n",
      title: "Destination folder",
      value: this.state.folder?.relativePath,
    });

    return inputPath && this.state.workspace?.uri
      ? {
          uri: Uri.joinPath(this.state.workspace.uri, inputPath),
          path: inputPath,
        }
      : undefined;
  }

  private async getFilesPrefixPrompt(): Promise<string | undefined> {
    const prefix = await this.showInputBox({
      ignoreFocusOut: true,
      placeHolder: "Enter the prefix...",
      prompt:
        "The files will be created as `{prefix}{suffix}`. The suffixes are the ones defined in your settings.json for the template you have selected or the ones you have specified for a custom template.",
      title: "Files start name or prefix",
      value: this.state.prefix ?? undefined,
    });

    return prefix;
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
