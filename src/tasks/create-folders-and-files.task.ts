import { FileType, Uri, workspace } from "vscode";

async function createFolderStructure(folderUri: Uri): Promise<void> {
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

export async function createFoldersAndFilesTask(
  targetFolder: Uri,
  suffixes: string[],
  prefix: string
): Promise<void> {
  const destinationFolderUri = Uri.joinPath(targetFolder);

  await createFolderStructure(destinationFolderUri);

  for (const suffix of suffixes) {
    const fileName = `${prefix}${suffix}`;
    const fileUri = Uri.joinPath(destinationFolderUri, fileName);

    await workspace.fs.writeFile(fileUri, new Uint8Array());
  }
}
