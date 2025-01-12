import { Action } from "./action.abstract";

type TInput = {
  displayStep: number;
  displayTotalSteps: number;
  selectedPrefix?: string | null;
};

export class InputFilesPrefixAction extends Action {
  public async execute({
    displayStep,
    displayTotalSteps,
    selectedPrefix,
  }: TInput): Promise<string | undefined> {
    const prefix = await this.showInputBox(
      {
        ignoreFocusOut: true,
        placeHolder: "Enter the prefix...",
        prompt:
          "The files will be created as `{prefix}{suffix}`. The suffixes are the ones defined in your settings.json for the template you have selected or the ones you have specified for a custom template.",
        title: "Files start name or prefix",
        value: selectedPrefix ?? undefined,
      },
      {
        displayStep,
        displayTotalSteps,
      }
    );

    return prefix;
  }
}
