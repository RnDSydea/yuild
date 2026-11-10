![yuild-hero](https://github.com/user-attachments/assets/a07dbc80-8b8a-4290-aa8f-e116c5e90206)

# Yuild 🚀

Yuild is a web app that makes building websites easy and intuitive by allowing users to drag and drop custom components.

Users can configure and personalize each component and download the generated React code for seamless integration into their own projects.

## Features ✨

- **Drag-and-Drop Building**: Quickly drag and place components into your page layout.
- **Custom Components**: Each component is fully customizable to match your desired style and functionality.
- **React Code Export**: Download the generated React code for the website you've built.
- **SAP UI5 Style**: Components with SAP UI5 style.
- **Three Breakpoints**: Separate desktop (24 columns), tablet (12 columns) and mobile (6 columns) layouts for every page.
- **Containers**: Sections and Cards with their own inner grid, nested up to two levels.
- **Automatic Responsive Layouts**: Generate the tablet and mobile layouts from the desktop one with a single action.
- **Versions**: Save snapshots of the whole project and restore them at any time.
- **Multiple Pages**: Every project can contain several pages, each with its own path and layouts.
- **Live Code Editor**: Open the generated code next to the page and watch it change while you edit.

## Requirements 🛠️

To run Yuild locally, you’ll need:
- [Node.js](https://nodejs.org/) v14 or higher
- [npm](https://www.npmjs.com/) v6 or higher

## Installation 📥

1. Clone the repository:
    ```bash
    git clone https://github.com/RnDSydea/yuild.git
    cd yuild
    ```

2. Install dependencies:
    ```bash
    npm install
    ```

3. Start the app in development mode:
    ```bash
    npm run start
    ```

The app will be running at `http://localhost:3000`.

## Usage 🎨

1. **Drag Components**: Select and drag components into the layout area to start building.
2. **Customize Components**: Configure each component's properties to match your style and functionality needs.
3. **Export Code**: When finished, download the generated React code with the export feature.

## Pages 🗂️

The **Pages** panel at the top of the left sidebar lists the pages of the project. From there you can:

- add a page with **+** and switch between pages by clicking them;
- rename the active page and change its path (for example `/` or `/chi-siamo`); free text is turned into a valid path, and two pages cannot share the same path;
- duplicate the active page, or delete it after a confirmation. A project always keeps at least one page.

Each page has its own components and its own desktop, tablet and mobile layouts. **Clear** and **Generate from desktop** act only on the active page. Deleting or clearing a page, and confirming a generated layout, first save a version of the whole project. Restoring a version brings back every page.

Projects saved by the previous single page version of Yuild are opened as a project with one **Home** page on `/`.

With **Editor mode** turned off, clicking a Link, Menu or Breadcrumbs item that points to another page opens that page in the editor. Use **Link to page** in the properties panel to choose the destination of a Link.

## Automatic responsive layouts 📱

Every page has three layouts that share the same components and properties but keep their own positions and sizes:

| Breakpoint | Columns | Generated CSS | Editor preview |
|---|---|---|---|
| Desktop | 24 | from 1200 px | full width |
| Tablet | 12 | from 768 px to 1199 px | 768 px |
| Mobile | 6 | below 768 px | 375 px |

Rows are always 16 px high. Positions and sizes are stored as explicit grid coordinates (column, row, width, height).

### Generating tablet and mobile layouts

1. Build the desktop layout.
2. Select **Tablet** or **Mobile** in the navbar and click **Generate from desktop**.
3. If that layout was edited by hand, Yuild asks before replacing it.
4. Check the preview, then click **Confirm** to apply it or **Cancel** to discard it. Confirming saves the current layout as a version first, so it can be restored from the **Versions** panel.

The badge next to the button shows the layout status: `auto` after a generation, `manuale` as soon as the layout is edited by hand.

### How the layout is generated

The reflow engine lives in `src/utils/responsive/` and has no dependency on the user interface:

- components are grouped into horizontal bands (components that share rows belong to the same band) and read top to bottom, left to right;
- for every band the engine keeps the components side by side with proportional widths when they all stay above their minimum width, otherwise it tries two per row (tablet only) and then one per row;
- containers are handled as units: their content is reflowed inside them and never moved out, and they grow to hold it;
- the result is validated before it is returned: no overlaps, nothing outside the grid, no component below its minimum width and the reading order preserved.

Minimum widths per component type and breakpoint are configured in `src/utils/responsive/minimumWidths.js`.

### Generated code

**Show editor** opens a side panel with the generated code of the whole project. It updates while you edit and lets you browse and copy every file. The **Export** button downloads the project as a ZIP archive:

| File | Content |
|---|---|
| `src/App.js` | The routes between the pages, with `react-router-dom` |
| `src/yuild-grid.css` | The grid rules shared by every page |
| `src/pages/<Name>Page.js` | One React component for each page |
| `src/pages/<Name>Page.css` | The mobile first layout of the page, with media queries for tablet and desktop |

The pages import the Yuild components from `src/components`: copy that folder of Yuild into your project. Every component of the catalog has a real implementation, so the exported code contains no placeholders. Dialog, Drawer and Alert are exported as a button that opens the overlay. With **Include CSS** turned off in the Document panel, the stylesheets are embedded in the components instead of being separate files.

## Library UI 📚

**Go to Library UI** opens a page that shows every component of the library in the SAP and Material themes. **Back to editor** returns to the editor, where the project is restored from the browser storage.

## Contributing 🤝

Want to contribute to Yuild? Here’s how:

1. Fork the project.
2. Create a new branch:
    ```bash
    git checkout -b feature/your-feature-name
    ```
3. Add your changes.
4. Commit your changes:
    ```bash
    git commit -m "Add feature/your-feature-name"
    ```
5. Push to the branch:
    ```bash
    git push origin feature/your-feature-name
    ```
6. Open a pull request on GitHub.

## License 📄

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.
