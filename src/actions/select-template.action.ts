import { TExtensionConfig, TTemplateItem } from "../extension.types";
import { CUSTOM_EXTENSION_CONFIG } from "../utils/extension.constants";
import { Action } from "./action.abstract";

type TInput = {
  configs: TExtensionConfig[];
  displayStep: number;
  displayTotalSteps: number;
  selectedTemplate?: TTemplateItem | null;
};

export class SelectTemplateAction extends Action {
  public async execute({
    configs,
    displayStep,
    displayTotalSteps,
    selectedTemplate,
  }: TInput): Promise<TTemplateItem | undefined> {
    const creationTemplates = [
      ...configs,
      CUSTOM_EXTENSION_CONFIG,
    ].map<TTemplateItem>((template) => ({
      /** Replace description with detail prop to break lines at command palette */
      detail: template.description,
      label: template.label,
      files: template.files,
    }));

    const value = await this.showSingleSelectionQuickPick(
      {
        activeItem: selectedTemplate ?? undefined,
        ignoreFocusOut: true,
        items: creationTemplates,
        placeholder: "Select a predefined template or use a custom creation",
        title: "Template selection",
      },
      {
        displayStep,
        displayTotalSteps,
      }
    );

    return value as TTemplateItem | undefined;
  }
}
