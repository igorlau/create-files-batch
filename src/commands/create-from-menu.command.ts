import type {
  QuickPickItem,
  WorkspaceFolder as VSWorkspaceFolder,
} from "vscode";
import { Uri, workspace } from "vscode";
import {
  CreateFilesAction,
  CreateFolderStructureAction,
  InputFilesPrefixAction,
  InputSuffixAction,
  SelectTemplateAction,
} from "../actions";
import { CreateFilesStepper } from "../create-files-stepper.abstract";
import { Step, TExtensionConfig, TTemplateItem } from "../extension.types";
import { CUSTOM_EXTENSION_CONFIG } from "../utils/extension.constants";

type TWorkspaceFolder = QuickPickItem & VSWorkspaceFolder;

type FormState = {
  workspace: TWorkspaceFolder | null;
  template: TTemplateItem | null;
  folder: { uri: Uri; relativePath: string } | null;
  prefix: string | null;
};

export class CreateFromMenuCommand extends CreateFilesStepper<FormState> {
  constructor(private readonly targetFolder: Uri) {
    const initialState = {
      workspace: null,
      template: null,
      folder: null,
      prefix: null,
    };

    super(initialState);

    this.setWorkspaceAndFolder();
  }

  public async execute() {
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
        shouldSkip: () => false,
        execute: async () => await this.selectTemplate(),
      },
      2: {
        shouldSkip: (currentState) =>
          currentState.template?.label.toLowerCase() !==
          CUSTOM_EXTENSION_CONFIG.label.toLowerCase(),
        execute: async () => await this.inputSuffixForCustomTemplate(),
      },
      3: {
        shouldSkip: () => false,
        execute: async () => await this.inputFilesPrefix(),
      },
    } satisfies Record<number, Step<FormState>>;
  }

  private setWorkspaceAndFolder() {
    this.updateState("folder", {
      uri: this.targetFolder,
      relativePath: this.targetFolder.fsPath,
    });

    const targetWorkspace = workspace.getWorkspaceFolder(
      Uri.file(this.targetFolder.fsPath)
    );

    if (!targetWorkspace) {
      throw new Error("Unable to find workspace from folder.");
    }

    this.updateState("workspace", {
      ...targetWorkspace,
      label: targetWorkspace.name,
      detail: workspace.asRelativePath(targetWorkspace.uri.path),
    });
  }

  private async selectTemplate() {
    const configs = workspace
      .getConfiguration("create-files-batch", this.state.workspace?.uri)
      .get<TExtensionConfig[]>("templates", []);

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
