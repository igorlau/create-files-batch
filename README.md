# Create Files Batch

Create Files Batch is a VSCode extension designed to streamline file creation by enabling the batch creation of files with a common name but varying suffixes or extensions. This extension is ideal for repetitive setups, such as creating multiple related files in the same folder or setting up new modules with similar structures (e.g., for a new use case in a backend).

## Key Features

- Batch file creation with customizable file suffixes.
- Templates in settings.json allow pre-defining common file structures.
- On-the-fly configuration for custom file setups.

## Installation

Simply install the extension from the Visual Studio Code Marketplace and start using it!

## Getting Started

This guide shows how to set up and use Create Files Batch with both predefined templates and custom options.

### Example: NestJS Use Case

Suppose you frequently add new "use case" files in a NestJS backend. Here’s how to automate this structure with a template:

1. Add a Template to `settings.json` file in `.vscode` folder

    Open your settings.json and define a template with a label, description, and file suffixes:

    ```json
    {
      "create-files-batch": {
        "templates": [
            {
                "label": "NestJS use case",
                "description": "Creates all the needed files for a new use case in the application.",
                "suffixes": [".controller.ts", ".service.ts", ".repository.ts", ".module.ts"]
            }
        ]
      }
    }
    ```

2. Create Files Using the Template

    1. Open the Command Palette (`Ctrl+Shift+P` or `Cmd+Shift+P`) and search for `Create: Multiple Files...`.
    2. If more than one workspace is open, select the workspace to create files in.
    3. Select the "*NestJS use case*" template from the list.
    4. Specify the destination path.
    5. Enter a common file name prefix. For example, entering "*auth*" will create:
       - `auth.controller.ts`
       - `auth.service.ts`
       - `auth.repository.ts`
       - `auth.module.ts`

### Creating Files Without a Predefined Template

1. Open the Command Palette and select `Create: Multiple Files...`.
2. If prompted, choose the workspace.
3. Select the built-in "*Custom*" option.
4. Manually specify the suffixes you’d like to use.
5. Follow the remaining prompts to choose a destination and enter the prefix.

### Screenshots

1. `Create: Multiple Files...` command:

    <img alt="Create Files Batch command" src="./assets/create-files-batch-command.png" />

2. Workspace selection

    <img alt="Worspace selection" src="./assets/workspace-selection.png" />

3. Template selection

    <img alt="Template selection" src="./assets/template-selection.png" />

4. Destination folder specification

    <img alt="Destination folder specification" src="./assets/destination-folder-selection.png" />

5. File name specification

    <img alt="File name specification" src="./assets/file-name-selection.png" />


### Additional Configuration Options

You can define multiple templates in your settings.json for different use cases, each with a unique label, description, and suffix structure.

```json
{
  "create-files-batch": {
    "templates": [
        {
            "label": "New NestJS use case",
            "description": "Creates all the needed files for a new use case in the application.",
            "suffixes": [".controller.ts", ".service.ts", ".repository.ts", ".module.ts"]
        },
        {
            "label": "New NestJS use case with test files",
            "description": "Creates all the needed files for a new use case in the application including test files.",
            "suffixes": [".controller.ts", ".controller.spec.ts", ".service.ts", ".service.spec.ts", ".repository.ts", ".repository.spec.ts", ".module.ts"]
        }
    ]
  }
}
```

## Attributions

- [Multiple layer icons created by pancaza - Flaticon](https://www.flaticon.com/free-icons/multiple-layer)
