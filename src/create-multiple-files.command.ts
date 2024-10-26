import { ExtensionContext, Uri, window, workspace } from "vscode";
import { CUSTOM_SETTINGS_TEMPLATE } from "./create-multiple-files.constants";
import {
  TCreationTemplate,
  TSettingsTemplate,
  TWorkspaceFolder,
} from "./create-multiple-files.types";
import { getDestinationFolderPrompt } from "./prompts/get-destination-folder.prompt";
import { getFilesPrefixPrompt } from "./prompts/get-files-prefix.prompt";
import { getSuffixesPrompt } from "./prompts/get-suffixes.prompt";
import { getTemplatePrompt } from "./prompts/get-template.prompt";
import { createFoldersAndFilesTask } from "./tasks/create-folders-and-files.task";
import { MultiStepInput } from "./utils/multi-step-input";

interface CommandState {
  step: number;
  totalSteps: number;
  workspace: TWorkspaceFolder;
  template: TCreationTemplate;
  folder: string;
  folderUri: Uri;
  filesPrefix: string;
}

export async function createMultipleFilesCommand(context: ExtensionContext) {
  const collectInputs = async () => {
    const state = {} as Partial<CommandState>;
    await MultiStepInput.run((input) => getWorkspaceFolderPrompt(input, state));
    return state as CommandState;
  };

  const shouldResume = async () => {
    return new Promise<boolean>((resolve, reject) => {});
  };

  const getWorkspaceFolderPrompt = async (
    input: MultiStepInput,
    state: Partial<CommandState>
  ) => {
    const workspaces = workspace.workspaceFolders;

    if (!workspaces || workspaces.length === 0) {
      throw new Error("No workspace found.");
    }

    if (workspaces.length === 1) {
      state.workspace = {
        ...workspaces[0],
        label: workspaces[0].name,
        detail: workspace.asRelativePath(workspaces[0].uri.path),
      };

      return (input: MultiStepInput) => getTemplatePrompt(input, state);
    }

    const items = workspaces.map<TWorkspaceFolder>((item) => ({
      ...item,
      label: item.name,
      detail: workspace.asRelativePath(item.uri.path),
    }));

    state.workspace = (await input.showQuickPick({
      title: "Workspace selection",
      placeholder: "Select the workspace in which the files will be created",
      ignoreFocusOut: true,
      items: items,
      step: 1,
      totalSteps: 5,
      activeItem: state.workspace,
      shouldResume,
    })) as TWorkspaceFolder;

    return (input: MultiStepInput) => getTemplatePrompt(input, state);
  };

  const loadTemplatesTask = (
    workspaceFolder: TWorkspaceFolder
  ): TCreationTemplate[] => {
    const templates = workspace
      .getConfiguration("create-files-batch", workspaceFolder.uri)
      .get<TSettingsTemplate[]>("templates", []);

    templates.push(CUSTOM_SETTINGS_TEMPLATE);

    const creationTemplates = templates.map<TCreationTemplate>((template) => ({
      /** Replace description with detail prop to break lines at command palette */
      detail: template.description,
      label: template.label,
      suffixes: template.suffixes,
    }));

    return creationTemplates;
  };

  const getTemplatePrompt = async (
    input: MultiStepInput,
    state: Partial<CommandState>
  ) => {
    const templates = loadTemplatesTask(state.workspace!);

    state.template = (await input.showQuickPick({
      title: "Template selection",
      placeholder: "Select a predefined template or use a custom creation",
      ignoreFocusOut: true,
      items: templates,
      step: 2,
      totalSteps: 5,
      activeItem: state.template,
      shouldResume,
    })) as TCreationTemplate;

    return (input: MultiStepInput) => getSuffixesPrompt(input, state);
  };

  const getSuffixesPrompt = async (
    input: MultiStepInput,
    state: Partial<CommandState>
  ) => {
    // if (
    //   state.template?.label.toLowerCase() !==
    //   CUSTOM_SETTINGS_TEMPLATE.label.toLowerCase()
    // ) {
    //   return (input: MultiStepInput) =>
    //     getDestinationFolderPrompt(input, state);
    // }

    const suffixesInput = await input.showInputBox({
      title: "Files custom suffixes",
      placeholder: "Enter comma separated values...",
      prompt:
        "Each item must start with a dot. The files will be created as `{prefix}{suffix}`.",
      ignoreFocusOut: true,
      step: 3,
      totalSteps: 5,
      value: state.template?.suffixes
        ? state.template.suffixes.join(",")
        : undefined,
      shouldResume,
    });

    if (!suffixesInput) {
      return [];
    }

    const suffixes = suffixesInput
      .split(",")
      .filter((item) => item !== ",")
      .map((item) => item.trim());

    if (state.template) {
      state.template.suffixes = suffixes;
    }

    return (input: MultiStepInput) => getDestinationFolderPrompt(input, state);
  };

  const getDestinationFolderPrompt = async (
    input: MultiStepInput,
    state: Partial<CommandState>
  ) => {
    state.folder = await input.showInputBox({
      title: "Destination folder",
      prompt:
        "Enter the relative path for the folder that will hold the new files (e.g., 'src/components'). If the folder path does not fully exists the needed folders will be created.\n",
      placeholder: "Enter relative folder path...",
      ignoreFocusOut: true,
      step: 4,
      totalSteps: 5,
      value: state.folder ?? "",
      shouldResume,
    });

    state.folderUri = state.workspace?.uri
      ? Uri.joinPath(state.workspace?.uri, state.folder)
      : undefined;

    return (input: MultiStepInput) => getFilesPrefixPrompt(input, state);
  };

  const getFilesPrefixPrompt = async (
    input: MultiStepInput,
    state: Partial<CommandState>
  ) => {
    const prefix = await input.showInputBox({
      title: "Files start name or prefix",
      placeHolder: "Enter the prefix...",
      prompt:
        "The files will be created as `{prefix}{suffix}`. The suffixes are the ones defined in your settings.json for the template you have selected or the ones you have specified for a custom template.",
      ignoreFocusOut: true,
      step: 5,
      totalSteps: 5,
      value: state.filesPrefix,
      shouldResume,
    });

    state.filesPrefix = prefix;
  };

  const state = await collectInputs();
  await createFoldersAndFilesTask(
    state.folderUri,
    state.template.suffixes,
    state.filesPrefix
  );
}
