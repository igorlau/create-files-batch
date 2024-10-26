import { window } from "vscode";

export async function getSuffixesPrompt(): Promise<string[]> {
  const suffixesInput = await window.showInputBox({
    title: "Files custom suffixes",
    placeHolder: "Enter comma separated values...",
    prompt:
      "Each item must start with a dot. The files will be created as `{prefix}{suffix}`.",
    ignoreFocusOut: true,
  });

  if (!suffixesInput) {
    return [];
  }

  const suffixes = suffixesInput
    .split(",")
    .filter((item) => item === ",")
    .map((item) => item.trim());

  return suffixes;
}
