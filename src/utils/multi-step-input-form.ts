const INITIAL_STEP = 1;

export class MultiStepForm<FormState extends Record<string, unknown>> {
  /**
   * Steps are 1-indexed based;
   */
  private currentStep: number;
  private totalSteps: number;
  private readonly maxSteps: number;

  private _state: FormState;

  constructor(maxSteps: number, initialState: FormState) {
    this._state = initialState;

    this.currentStep = INITIAL_STEP;
    this.totalSteps = maxSteps;
    this.maxSteps = maxSteps;
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

  public previousStep() {
    this.currentStep -= 1;
  }

  public nextStep() {
    this.currentStep += 1;
  }

  public skipOneStep() {
    this.currentStep += 1;
    this.totalSteps -= 1;
  }

  public resetOneSkippedStep() {
    this.totalSteps += 1;
  }

  public resetTotalSteps() {
    this.totalSteps = this.maxSteps;
  }
}
