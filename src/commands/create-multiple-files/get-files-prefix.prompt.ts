import { window } from "vscode";

export async function getFilesPrefixPrompt() {
  const prefix = await window.showInputBox({
    title: "Files start name or prefix",
    placeHolder: "Enter the prefix...",
    prompt:
      "The files will be created as `{prefix}{suffix}`. Where the suffixes are defined in your settings.json file.",
    ignoreFocusOut: true,
  });

  return prefix;
}
