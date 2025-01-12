import { Disposable, QuickInputButtons, QuickPickItem, window } from "vscode";
import { InputBoxParameters, QuickPickParameters } from "../extension.types";
import { CancelFormError, GoBackFormError } from "../utils/errors.utils";

type StepperParams = {
  displayStep: number;
  displayTotalSteps: number;
};

export abstract class Action {
  /**
   * Displays a quick pick UI for selecting a single item from a list of items.
   *
   * @template T - The type of the items to pick from, extending QuickPickItem.
   * @template P - The type of the parameters for the quick pick, extending QuickPickParameters<T>.
   *
   * @param {P} params - The parameters for configuring the quick pick.
   * @param {T} params.activeItem - The item to be pre-selected when the quick pick is shown.
   * @param {QuickInputButton[]} [params.buttons] - Additional buttons to display in the quick pick.
   * @param {boolean} [params.ignoreFocusOut] - If true, the quick pick will remain open when focus moves to another part of the editor.
   * @param {T[]} params.items - The items to display in the quick pick.
   * @param {string} [params.placeholder] - Placeholder text to display in the quick pick input box.
   * @param {string} [params.title] - Title of the quick pick.
   *
   * @param {StepperParams} stepperParams - Parameters for displaying step information.
   * @param {number} stepperParams.displayStep - The current step number in a multi-step process.
   * @param {number} stepperParams.displayTotalSteps - The total number of steps in a multi-step process.
   *
   * @returns {Promise<T | undefined>} A promise that resolves to the selected item, or undefined if the quick pick was canceled.
   *
   * @throws {GoBackFormError} If the back button is triggered.
   * @throws {CancelFormError} If the quick pick is hidden without a selection.
   */
  protected async showSingleSelectionQuickPick<
    T extends QuickPickItem,
    P extends QuickPickParameters<T>
  >(
    { activeItem, buttons, ignoreFocusOut, items, placeholder, title }: P,
    { displayStep, displayTotalSteps }: StepperParams
  ): Promise<T | undefined> {
    /** A Disposable array tracks resources (listeners and objects) created in this function so they can be disposed of properly, preventing memory leaks. */
    const disposables: Disposable[] = [];

    const quickPick = window.createQuickPick<T>();
    quickPick.title = title;
    quickPick.placeholder = placeholder;
    quickPick.items = items;
    quickPick.ignoreFocusOut = ignoreFocusOut;

    if (activeItem) {
      quickPick.activeItems = [activeItem];
    }

    quickPick.step = displayStep;
    quickPick.totalSteps = displayTotalSteps;

    quickPick.buttons = [
      ...(displayStep > 1 ? [QuickInputButtons.Back] : []),
      ...(buttons ?? []),
    ];

    return new Promise<T | undefined>((resolve, reject) => {
      disposables.push(
        quickPick.onDidTriggerButton((button) => {
          if (button === QuickInputButtons.Back) {
            reject(GoBackFormError);
          }
        }),

        quickPick.onDidChangeSelection((items) => resolve(items[0])),

        quickPick.onDidHide(() => reject(CancelFormError))
      );

      quickPick.show();
    }).finally(() => {
      disposables.forEach((d) => d.dispose());
      quickPick.hide();
    });
  }

  /**
   * Displays an input box to the user with the specified parameters.
   *
   * @template P - The type of the input box parameters.
   * @param {P} params - The parameters for the input box.
   * @param {string} params.title - The title of the input box.
   * @param {string} [params.value] - The initial value of the input box.
   * @param {string} params.prompt - The prompt message for the input box.
   * @param {QuickInputButton[]} [params.buttons] - Additional buttons to display in the input box.
   * @param {boolean} [params.ignoreFocusOut] - If true, the input box will not close when it loses focus.
   * @param {string} [params.placeholder] - Placeholder text to display in the input box.
   * @param {StepperParams} stepperParams - The stepper parameters.
   * @param {number} stepperParams.displayStep - The current step number.
   * @param {number} stepperParams.displayTotalSteps - The total number of steps.
   * @returns {Promise<string | undefined>} A promise that resolves to the input value or undefined if the input box was cancelled.
   * @throws {GoBackFormError} If the back button is pressed.
   * @throws {CancelFormError} If the input box is hidden without accepting.
   */
  protected async showInputBox<P extends InputBoxParameters>(
    { title, value, prompt, buttons, ignoreFocusOut, placeholder }: P,
    { displayStep, displayTotalSteps }: StepperParams
  ): Promise<string | undefined> {
    /** A Disposable array tracks resources (listeners and objects) created in this function so they can be disposed of properly, preventing memory leaks. */
    const disposables: Disposable[] = [];

    const input = window.createInputBox();
    input.title = title;
    input.prompt = prompt;
    input.ignoreFocusOut = ignoreFocusOut;
    input.placeholder = placeholder;

    if (value) {
      input.value = value;
    }

    input.step = displayStep;
    input.totalSteps = displayTotalSteps;

    input.buttons = [
      ...(displayStep > 1 ? [QuickInputButtons.Back] : []),
      ...(buttons ?? []),
    ];

    return new Promise<string | undefined>((resolve, reject) => {
      disposables.push(
        input.onDidTriggerButton((button) => {
          if (button === QuickInputButtons.Back) {
            reject(GoBackFormError);
          }
        }),

        input.onDidAccept(() => resolve(input.value)),

        input.onDidHide(() => reject(CancelFormError))
      );

      input.show();
    }).finally(() => {
      disposables.forEach((d) => d.dispose());
      input.hide();
    });
  }
}
