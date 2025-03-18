import { Uri, workspace } from "vscode";
import { TFileConfig } from "../extension.types";
import { Action } from "./action.abstract";

type TInput = {
  configs: TFileConfig[];
  destinationFolderUri: Uri;
  prefix: string;
};

export class CreateFilesAction extends Action {
  public async execute({
    configs,
    destinationFolderUri,
    prefix,
  }: TInput): Promise<void> {
    for (const config of configs) {
      const fileName = `${prefix}${config.suffix}`;
      const fileUri = Uri.joinPath(
        destinationFolderUri,
        config.additionalPath ?? "",
        fileName
      );
      const contentBuffer = new TextEncoder().encode(
        config.content?.join("\n") ?? ""
      );

      await workspace.fs.writeFile(fileUri, contentBuffer);
    }
  }
}
