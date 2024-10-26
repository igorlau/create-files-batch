export class CancelFormError extends Error {
  readonly action = "cancel";
}

export class GoBackFormError extends Error {
  readonly action = "go-back";
}
