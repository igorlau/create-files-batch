import type {
  QuickInputButton,
  QuickPickItem,
  Uri,
  WorkspaceFolder as VSWorkspaceFolder,
} from "vscode";

export type TFileConfig = { suffix: string; content?: string[], additionalPath?: string };

export type TWorkspaceFolder = QuickPickItem & VSWorkspaceFolder;

export type TTemplateItem = QuickPickItem & {
  files: TFileConfig[];
};

export type TExtensionConfig = {
  label: string;
  description: string;
  files: TFileConfig[];
};

export type Step<FormState extends Record<string, unknown>> = {
  execute: () => Promise<void>;
  shouldSkip?: (state: FormState) => boolean;
  whenSkip?: () => void;
};

export type QuickPickParameters<T> = {
  activeItem?: T;
  buttons?: QuickInputButton[];
  ignoreFocusOut: boolean;
  items: T[];
  placeholder?: string;
  title?: string;
};

export type InputBoxParameters = {
  buttons?: QuickInputButton[];
  ignoreFocusOut: boolean;
  prompt?: string;
  title?: string;
  value?: string;
  placeholder?: string;
};
