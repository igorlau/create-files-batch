import { TTemplateItem } from "../extension.types";
import { Action } from "./action.abstract";

type TInput = {
  displayStep: number;
  displayTotalSteps: number;
  selectedTemplate?: TTemplateItem | null;
};

export class InputSuffixAction extends Action {
  public async execute({
    displayStep,
    displayTotalSteps,
    selectedTemplate,
  }: TInput): Promise<TTemplateItem | undefined> {
    const currentTemplateFiles = selectedTemplate?.files ?? [];
    const selectedSuffixes =
      currentTemplateFiles.map((item) => item.suffix) ?? [];

    const suffixesInput = await this.showInputBox(
      {
        ignoreFocusOut: true,
        placeHolder: "Enter comma separated values...",
        prompt:
          "Each item must start with a dot. The files will be created as `{prefix}{suffix}`.",
        title: "Files custom suffixes",
        value: selectedSuffixes?.join(","),
      },
      {
        displayStep,
        displayTotalSteps,
      }
    );

    if (!suffixesInput) {
      return undefined;
    }

    const suffixes = suffixesInput
      .split(",")
      .filter((item) => item !== ",")
      .map((item) => item.trim());

    const newFileConfig =
      suffixes?.map((item, index) => ({
        ...currentTemplateFiles?.[index],
        suffix: item,
      })) ?? [];

    const newTemplate = {
      ...selectedTemplate,
      label: selectedTemplate?.label ?? "",
      files: newFileConfig,
    } satisfies TTemplateItem;

    return newTemplate;
  }
}
