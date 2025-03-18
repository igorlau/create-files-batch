import type { WorkspaceFolder as VSWorkspaceFolder } from "vscode";
import { Uri, workspace } from "vscode";
import {
  CreateFilesAction,
  CreateFolderStructureAction,
  InputDestinationFolderAction,
  InputFilesPrefixAction,
  InputSuffixAction,
  SelectTemplateAction,
  SelectWorkspaceFolderAction,
} from "../actions";
import { CreateFilesStepper } from "../create-files-stepper.abstract";
import { Step, TTemplateItem, TWorkspaceFolder } from "../extension.types";
import { CUSTOM_EXTENSION_CONFIG } from "../utils/extension.constants";
import { getTemplatesConfig } from "../utils/get-configuration";

type FormState = {
  workspace: TWorkspaceFolder | null;
  template: TTemplateItem | null;
  folder: { uri: Uri; relativePath: string } | null;
  prefix: string | null;
};

export class CreateFromCommandPaletteCommand extends CreateFilesStepper<FormState> {
  private readonly workspaces: readonly VSWorkspaceFolder[] = [];

  constructor() {
    const initialState: FormState = {
      workspace: null,
      template: null,
      folder: null,
      prefix: null,
    };

    super(initialState);

    if (!workspace.workspaceFolders?.length) {
      throw new Error("Could not determine workspace folders.");
    }

    this.workspaces = workspace.workspaceFolders;
  }

  async execute() {
    const formState = await this.stepThrough();

    if (
      !formState.workspace ||
      !formState.folder ||
      !formState.prefix ||
      !formState.template
    ) {
      return;
    }

    const destinationFolderUri = Uri.joinPath(formState.folder.uri);

    const createFolderAction = new CreateFolderStructureAction();
    await createFolderAction.execute({ folderUri: destinationFolderUri });

    const createFilesAction = new CreateFilesAction();
    await createFilesAction.execute({
      configs: formState.template.files,
      destinationFolderUri,
      prefix: formState.prefix,
    });
  }

  protected override defineSteps() {
    return {
      1: {
        shouldSkip: () => this.workspaces.length === 1,
        whenSkip: () => {
          this.updateState("workspace", {
            ...this.workspaces[0],
            label: this.workspaces[0].name,
            detail: workspace.asRelativePath(this.workspaces[0].uri.path),
          });
        },
        execute: async () => await this.selectWorkspace(),
      },
      2: {
        shouldSkip: () => false,
        execute: async () => await this.selectTemplate(),
      },
      3: {
        shouldSkip: (currentState) =>
          currentState.template?.label.toLowerCase() !==
          CUSTOM_EXTENSION_CONFIG.label.toLowerCase(),
        execute: async () => this.inputSuffixForCustomTemplate(),
      },
      4: {
        shouldSkip: () => false,
        execute: async () => this.inputDestinationFolder(),
      },
      5: {
        shouldSkip: () => false,
        execute: async () => this.inputFilesPrefix(),
      },
    } satisfies Record<number, Step<FormState>>;
  }

  private async selectWorkspace() {
    const items = this.workspaces.map<TWorkspaceFolder>((item) => ({
      ...item,
      label: item.name,
      detail: workspace.asRelativePath(item.uri.path),
    }));

    const action = new SelectWorkspaceFolderAction();
    const selectedWorkspace = await action.execute({
      displayStep: this.displayStep,
      displayTotalSteps: this.displayTotalSteps,
      selectedWorkspace: this.state.workspace,
      workspaces: items,
    });

    this.updateState("workspace", selectedWorkspace ?? null);
  }

  private async selectTemplate() {
    const configs = getTemplatesConfig(this.state.workspace?.uri);

    const action = new SelectTemplateAction();
    const selectedTemplate = await action.execute({
      configs,
      displayStep: this.displayStep,
      displayTotalSteps: this.displayTotalSteps,
      selectedTemplate: this.state.template,
    });

    this.updateState("template", selectedTemplate ?? null);
  }

  private async inputSuffixForCustomTemplate() {
    const action = new InputSuffixAction();

    const customTemplate = await action.execute({
      displayStep: this.displayStep,
      displayTotalSteps: this.displayTotalSteps,
      selectedTemplate: this.state.template,
    });

    this.updateState("template", customTemplate ?? null);
  }

  private async inputDestinationFolder() {
    const action = new InputDestinationFolderAction();

    const selectedFolder = await action.execute({
      displayStep: this.displayStep,
      displayTotalSteps: this.displayTotalSteps,
      selectedFolderRelativePath: this.state.folder?.relativePath,
      workspaceUri: this.state.workspace?.uri,
    });

    this.updateState(
      "folder",
      selectedFolder
        ? { uri: selectedFolder.uri, relativePath: selectedFolder.path }
        : null
    );
  }

  private async inputFilesPrefix() {
    const action = new InputFilesPrefixAction();

    const inputPrefix = await action.execute({
      displayStep: this.displayStep,
      displayTotalSteps: this.displayTotalSteps,
      selectedPrefix: this.state.prefix,
    });

    this.updateState("prefix", inputPrefix ?? null);
  }
}
