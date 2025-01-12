import { FileType, Uri, workspace } from "vscode";
import { Action } from "./action.abstract";

type TInput = {
  folderUri: Uri;
};

export class CreateFolderStructureAction extends Action {
  public async execute({ folderUri }: TInput): Promise<void> {
    const pathParts = folderUri.path.split("/").filter(Boolean);
    let currentPath = "/";

    for (const part of pathParts) {
      currentPath = `${currentPath}${part}/`;

      const currentUri = Uri.file(currentPath);

      try {
        const stat = await workspace.fs.stat(currentUri);
        if (stat.type !== FileType.Directory) {
          throw new Error("Specified folder is not a directory");
        }
      } catch {
        await workspace.fs.createDirectory(currentUri);
      }
    }
  }
}
