import { window } from "vscode";

export async function getFilesPrefixPrompt(): Promise<string | undefined> {
  const prefix = await window.showInputBox({
    title: "Files start name or prefix",
    placeHolder: "Enter the prefix...",
    prompt:
      "The files will be created as `{prefix}{suffix}`. The suffixes are the ones defined in your settings.json for the template you have selected or the ones you have specified for a custom template.",
    ignoreFocusOut: true,
  });

  return prefix;
}
