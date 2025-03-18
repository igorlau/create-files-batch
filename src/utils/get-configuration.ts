import { type Uri, workspace } from "vscode";
import { TExtensionConfig } from "../extension.types";

type RawTemplate = {
  description: string;
  files: { suffix: string; content?: string[]; "additional-path"?: string }[];
  label: string;
};

export function getTemplatesConfig(scope?: Uri): TExtensionConfig[] {
  const rawTemplates = workspace
    .getConfiguration("create-files-batch", scope)
    .get<RawTemplate[]>("templates", []);

  return rawTemplates.map<TExtensionConfig>((item) => ({
    description: item.description,
    files: item.files.map((file) => ({
      content: file.content,
      suffix: file.suffix,
      additionalPath: file["additional-path"],
    })),
    label: item.label,
  }));
}
