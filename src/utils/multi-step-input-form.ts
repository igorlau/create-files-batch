import type { QuickInputButton, QuickPickItem } from "vscode";
import { Disposable, QuickInputButtons, window } from "vscode";

const INITIAL_STEP = 1;

type QuickPickParameters<T> = {
  activeItem?: T;
  buttons?: QuickInputButton[];
  ignoreFocusOut: boolean;
  items: T[];
  placeholder?: string;
  title?: string;
};

type InputBoxParameters = {
  buttons?: QuickInputButton[];
  ignoreFocusOut: boolean;
  prompt?: string;
  title?: string;
  value?: string;
  placeholder?: string;
};

export type Step<FormState> = {
  execute: () => Promise<void>;
  shouldSkip?: (state: FormState) => boolean;
  whenSkip?: () => void;
};

class ButtonAction {
  static readonly Back = new ButtonAction();
  static readonly Cancel = new ButtonAction();
}

export class MultiStepForm<FormState extends Record<string, unknown>> {
  /**
   * Steps are 1-indexed based;
   */
  private currentStep: number;
  private skippedSteps: number;
  private totalSteps: number;

  private _state: FormState;

  constructor(initialState: FormState) {
    this._state = initialState;

    this.skippedSteps = 0;
    this.currentStep = INITIAL_STEP;
    this.totalSteps = INITIAL_STEP;
  }

  get state() {
    return this._state;
  }

  set state(newState: FormState) {
    this._state = newState;
  }

  public updateState<FieldKey extends keyof FormState>(
    fieldKey: FieldKey,
    fieldValue: FormState[FieldKey]
  ) {
    const newState = { ...this._state, [fieldKey]: fieldValue };
    this.state = newState;
  }

  get displayStep() {
    return this.currentStep - this.skippedSteps;
  }

  get displayTotalSteps() {
    return this.totalSteps - this.skippedSteps;
  }

  public previousStep() {
    if (this.currentStep > INITIAL_STEP) {
      this.currentStep -= 1;
    }
  }

  public nextStep() {
    this.currentStep += 1;
  }

  public skipStep() {
    this.skippedSteps += 1;
    this.currentStep += 1;
  }

  public async stepThrough(stepHandlers: Record<number, Step<FormState>>) {
    // Determine the initial total steps based on the step handlers provided
    this.currentStep = INITIAL_STEP;
    this.skippedSteps = 0;
    this.totalSteps = Object.keys(stepHandlers).length;

    let stop = false;

    while (this.currentStep <= this.totalSteps || !stop) {
      try {
        const currentStepHandler = stepHandlers[this.currentStep];

        // Check if this step should be skipped based on the current state
        if (currentStepHandler.shouldSkip?.(this._state)) {
          currentStepHandler.whenSkip?.();
          this.skipStep();
          continue;
        }

        await currentStepHandler.execute();

        this.nextStep();
      } catch (error) {
        if (error === ButtonAction.Back && this.currentStep > INITIAL_STEP) {
          this.previousStep();
        } else {
          break;
        }
      }
    }
  }

  async showSingleSelectionQuickPick<
    T extends QuickPickItem,
    P extends QuickPickParameters<T>
  >({
    activeItem,
    buttons,
    ignoreFocusOut,
    items,
    placeholder,
    title,
  }: P): Promise<T | undefined> {
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

    quickPick.step = this.displayStep;
    quickPick.totalSteps = this.displayTotalSteps;

    quickPick.buttons = [
      ...(this.displayStep > 1 ? [QuickInputButtons.Back] : []),
      ...(buttons ?? []),
    ];

    return new Promise<T | undefined>((resolve, reject) => {
      disposables.push(
        quickPick.onDidTriggerButton((button) => {
          if (button === QuickInputButtons.Back) {
            reject(ButtonAction.Back);
          }
        }),

        quickPick.onDidChangeSelection((items) => resolve(items[0])),

        quickPick.onDidHide(() => reject(ButtonAction.Cancel))
      );

      quickPick.show();
    }).finally(() => {
      disposables.forEach((d) => d.dispose());
      quickPick.hide();
    });
  }

  async showInputBox<P extends InputBoxParameters>({
    title,
    value,
    prompt,
    buttons,
    ignoreFocusOut,
    placeholder,
  }: P): Promise<string | undefined> {
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

    input.step = this.displayStep;
    input.totalSteps = this.displayTotalSteps;

    input.buttons = [
      ...(this.displayStep > 1 ? [QuickInputButtons.Back] : []),
      ...(buttons ?? []),
    ];

    return new Promise<string | undefined>((resolve, reject) => {
      disposables.push(
        input.onDidTriggerButton((button) => {
          if (button === QuickInputButtons.Back) {
            reject(ButtonAction.Back);
          }
        }),

        input.onDidAccept(() => resolve(input.value)),

        input.onDidHide(() => reject(ButtonAction.Cancel))
      );

      input.show();
    }).finally(() => {
      disposables.forEach((d) => d.dispose());
      input.hide();
    });
  }
}
