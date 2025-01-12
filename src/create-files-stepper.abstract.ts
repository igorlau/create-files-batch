import type { Step } from "./extension.types";

/**
 * Steps are 1-indexed based;
 */
const INITIAL_STEP = 1;

export abstract class CreateFilesStepper<
  FormState extends Record<string, unknown>
> {
  public currentStep: number;
  public totalSteps: number;
  public skippedStepsNumber: number;
  public skippedSteps: Record<number, boolean>;

  private _state: FormState;

  public readonly steps: Record<number, Step<FormState>>;

  constructor(initialState: FormState) {
    this._state = initialState;

    this.skippedStepsNumber = 0;
    this.currentStep = INITIAL_STEP;
    this.totalSteps = INITIAL_STEP;
    this.skippedSteps = {};

    this.steps = this.defineSteps();
  }

  /**
   * Returns the current state of the form.
   */
  public get state() {
    return this._state;
  }

  /**
   * Returns the number of steps that were skipped in the wizard until the current step.
   */
  public get skippedStepsUntilCurrent() {
    return Object.entries(this.skippedSteps).filter(
      ([step, isSkipped]) => isSkipped && parseInt(step) < this.currentStep
    ).length;
  }

  /**
   * Returns the current step that is being displayed to the user.
   * This number is calculated based on the current step and the number of steps that were skipped.
   */
  public get displayStep() {
    return this.currentStep - this.skippedStepsUntilCurrent;
  }

  /**
   * Returns the total number of steps that are being displayed to the user.
   * This number is calculated based on the total number of steps and the number of steps that were skipped.
   */
  public get displayTotalSteps() {
    return this.totalSteps - this.skippedStepsUntilCurrent;
  }

  /**
   * Function to define the steps of the form. Set at the constructor of the class.
   */
  protected abstract defineSteps(): Record<number, Step<FormState>>;

  /**
   * Moves the form to the previous step.
   */
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

  /**
   * Moves the form to the next step.
   */
  public nextStep() {
    this.currentStep += 1;
  }

  /**
   * Skips the current step of the form.
   */
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

  /**
   * Function that steps through the form, executing the steps defined in the `steps` property.
   * The form will stop when all steps are executed or when an error is thrown.
   */
  public async stepThrough() {
    // Determine the initial total steps based on the step handlers provided
    this.currentStep = INITIAL_STEP;
    this.skippedStepsNumber = 0;
    this.totalSteps = Object.keys(this.steps).length;
    this.skippedSteps = Object.keys(this.steps).reduce((acc, step) => {
      acc[parseInt(step)] = false;
      return acc;
    }, {} as Record<number, boolean>);

    while (this.currentStep <= this.totalSteps) {
      try {
        const currentStepHandler = this.steps[this.currentStep];

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

    return this._state;
  }

  /**
   * Function that updates the state of the form with a new value for a specific field.
   * @param fieldKey The key of the field to be updated.
   * @param fieldValue The new value for the field.
   * @returns void
   */
  public updateState<FieldKey extends keyof FormState>(
    fieldKey: FieldKey,
    fieldValue: FormState[FieldKey]
  ) {
    const newState = { ...this._state, [fieldKey]: fieldValue };
    this._state = newState;
  }
}
