# Style Manager (Figma Plugin)

A powerful Figma plugin that enables "Class-based" design by treating node trees as reusable, serialized definitions. Save a complex frame once, and re-insert it anywhere in your document.

![Style Manager UI Preview](https://github.com/user-attachments/assets/placeholder-ui.png)

## Features

- **Deep Serialization**: Captures frame, and nested frame, auto-layout, fills, typography, opacity, corner radius, strokes, effects, and bound variables.
- **Smart Restoration**: Recreates complex node trees with pixel perfection, automatically loading required fonts.
- **Text Style & Variable Support**: Preserves text style references and complex text property variable bindings (font size, letter spacing, etc.).
- **Variable Support**: Preserves variable bindings for colors, spacing, and numbers.
- **Local Save**: Stores your personal classes in your own device for use across different Figma files.
- **Sync, Export & Import**: Sync your class presets with a GitHub repository, or export them to a `.json` file, and import them anywhere.
- **Group & Search**: Organize your classes with labels and find them instantly with the built-in search.

## Technology Stack

- **Typescript**: Core plugin logic and node manipulation.
- **Vanilla HTML/CSS/JS**: UI implementation with a custom **shadcn/ui** inspired design system.
- **esbuild**: Ultra-fast bundling for plugin distribution.

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v18+)
- [npm](https://www.npmjs.com/)

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/Hakimei/figma-plugin-style-manager.git
   cd figma-plugin-style-manager
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Build the plugin:
   ```bash
   npm run build
   ```

4. In Figma, go to **Plugins** -> **Development** -> **Import plugin from manifest...** and select the `manifest.json` in this folder.

### Development

Run the build in watch mode for a faster development cycle:

```bash
npm run dev
```

## Project Structure

```text
├── src/
│   ├── code.ts        # Main plugin sandbox logic (Node API)
│   └── ui.html        # Plugin UI (HTML/CSS/JS)
├── dist/              
├── manifest.json      # Figma plugin manifest
└── build.js           # esbuild build script
```

## Core Workflows

### Saving a Class
1. Select a **Frame**, **Component** or **Instance Component** on the Figma canvas.
2. Give it a **Name** (e.g., `Section or Container`) and an optional **Label** for grouping (e.g., `Layout or Basic`).
3. Click **Save Class**. The node tree is now serialized and stored locally.

### Inserting a Class
1. Find the class in the list or use the search bar.
2. Click the class to select it.
3. Click **Insert Selected Class**. The node tree will be recreated at the center of your current viewport.

### Exporting & Importing Presets
1. To backup your classes, click the **Export** (download) icon in the header. This saves a `class-manager-presets.json` file.
2. To restore or add presets, click the **Import** (upload) icon and select a valid presets JSON file. Imported classes will be merged with your locally stored ones.

### Advanced: GitHub Sync
Synchronize your global presets across different Figma accounts and machines using a GitHub repository as the source of truth.

1. **Setup Repository**: Create a GitHub repository (e.g., `username/figma-presets`).
2. **Generate Token**: Go to GitHub -> Settings -> Developer settings -> Personal access tokens.
   - **Fine-grained Token (Recommended)**: Grant **Read and write** access to **"Contents"** for your repository.
   - **Classic Token**: Check the `repo` scope.
3. **Configure Plugin**: In the **Sync** tab, enter your GitHub details:
   - **Repo**: `username/repository-name`
   - **Branch**: `main` (or your preferred branch)
   - **File Path**: `global.json` (where shared global classes will be stored)
4. **Push/Pull**:
   - **Push**: Overwrites the file on GitHub with your local global classes.
   - **Pull**: Overwrites your local global classes with the version from GitHub.

> [!TIP]
> If you get a **403 Error** when pushing, double-check that your Personal Access Token has **Write** permissions for "Contents" and that the branch is not protected by rules that block direct pushes.

## License

MIT
