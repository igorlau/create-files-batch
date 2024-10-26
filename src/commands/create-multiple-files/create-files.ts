import { Uri, workspace, WorkspaceEdit } from "vscode";

export async function createFiles(
  folderPath: string,
  templateSuffixes: string[],
  prefix: string
) {
  const edit = new WorkspaceEdit();

  for (const suffix of templateSuffixes) {
    const fileName = `${prefix}${suffix}`;
    const fileUri = Uri.file(`${folderPath}/${fileName}`);

    edit.createFile(fileUri);
  }

  await workspace.applyEdit(edit);
}
