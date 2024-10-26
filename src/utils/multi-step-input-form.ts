import type { QuickInputButton, QuickPickItem } from "vscode";
import { Disposable, QuickInputButtons, window } from "vscode";
import { CancelFormError, GoBackFormError } from "./errors";

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

export class MultiStepForm<FormState extends Record<string, unknown>> {
  /**
   * Steps are 1-indexed based;
   */
  private currentStep: number;
  private skippedStepsNumber: number;
  private totalSteps: number;
  private skippedSteps: Record<number, boolean>;

  private _state: FormState;

  constructor(initialState: FormState) {
    this._state = initialState;

    this.skippedStepsNumber = 0;
    this.currentStep = INITIAL_STEP;
    this.totalSteps = INITIAL_STEP;
    this.skippedSteps = {};
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

  get skippedStepsUntilCurrent() {
    return Object.entries(this.skippedSteps).filter(
      ([step, isSkipped]) => isSkipped && parseInt(step) < this.currentStep
    ).length;
  }

  get displayStep() {
    return this.currentStep - this.skippedStepsUntilCurrent;
  }

  get displayTotalSteps() {
    return this.totalSteps - this.skippedStepsUntilCurrent;
  }

  public previousStep() {
    if (this.currentStep < INITIAL_STEP) {
      return;
    }
    const isPreviousStepSkipped = this.skippedSteps[this.currentStep - 1];

    if (!isPreviousStepSkipped) {
      this.currentStep -= 1;
      return;
    }

    this.currentStep -= 1;
    this.previousStep();
  }

  public nextStep() {
    this.currentStep += 1;
  }

  public skipStep() {
    const hasAlreadySkipped = this.skippedSteps[this.currentStep];

    if (hasAlreadySkipped) {
      this.currentStep += 1;
      return;
    }

    this.skippedSteps[this.currentStep] = true;
    this.currentStep += 1;
    this.skippedStepsNumber += 1;
  }

  public async stepThrough(stepHandlers: Record<number, Step<FormState>>) {
    // Determine the initial total steps based on the step handlers provided
    this.currentStep = INITIAL_STEP;
    this.skippedStepsNumber = 0;
    this.totalSteps = Object.keys(stepHandlers).length;
    this.skippedSteps = Object.keys(stepHandlers).reduce((acc, step) => {
      acc[parseInt(step)] = false;
      return acc;
    }, {} as Record<number, boolean>);

    while (this.currentStep <= this.totalSteps) {
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
      } catch (error: any) {
        const canGoBack =
          error.name === "GoBackFormError" && this.currentStep > INITIAL_STEP;

        if (!canGoBack) {
          break;
        }

        this.previousStep();
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
