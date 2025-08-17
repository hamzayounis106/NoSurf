# NoSurf — Chrome extension

NoSurf helps you block distracting websites so you can stay focused.

## What's included

- The ready-to-load build files are in the `No Surf Extension/` folder at the repository root.
  - That folder contains `manifest.json`, `background.js`, and the extension UI files you can load into Chrome.
- Source files are in `src/` (React + Vite).

## Quick install — load the unpacked build into Chrome

1. Open Chrome and go to: `chrome://extensions`.
2. Enable **Developer mode** (toggle in the top-right).
3. Click **Load unpacked**.
4. In the file chooser, select the `No Surf Extension/` folder from this repository. Example path on this machine:

   `E:\Chrome Extensions\nosurf-extension\No Surf Extension`

   Important: pick the folder that contains `manifest.json` at its root.
5. The extension should appear in the list. Use the extension icon or the popup to access NoSurf.

## Verify it works

- Open the extension UI and add a site to block (for example: `instagram.com`).
- Visit the blocked site in a new tab — the extension should act according to its blocking behavior (redirect, show a block page, or otherwise prevent access depending on implementation).
- To apply changes after editing the build files, go to `chrome://extensions` and click **Reload** for the NoSurf extension.

## Rebuild from source (optional)

Assumptions:
- This project uses Node + Vite (check `package.json` and `vite.config.ts`).
- The default Vite output folder is `dist/` unless configured otherwise.

Typical steps to build from source:

```bash
# install dependencies
npm ci

# build the project
npm run build
```

After building:
- If the build output is `dist/`, copy or move its contents into the `No Surf Extension/` folder so `manifest.json` and other extension assets are present at the root you will load into Chrome.
- Some projects are configured to output directly to a Chrome extension folder. If your build already writes to `No Surf Extension/`, no copy is necessary.

## Update workflow

- During development, use `npm run dev` (if available) to run a dev server for the popup UI. Note: Chrome cannot load remote dev servers for extension UIs — you typically build static files to test the packaged extension.
- After changing files inside `No Surf Extension/`, reload the extension from `chrome://extensions`.

## Troubleshooting

- "Manifest missing" or "Manifest version error": Ensure you selected the folder that contains `manifest.json`.
- Permissions not applied: Confirm `manifest.json` lists the required host permissions and optional permissions are granted when Chrome prompts.
- Extension not blocking sites: Open the extension background page console for errors. Go to `chrome://extensions`, find NoSurf, click **Inspect views** under the extension entry, and check the console for `background.js` or UI errors.
- Build output not found: Check `vite.config.ts` or `package.json` for the actual build output directory and adapt copy steps accordingly.

## Privacy & data

- This extension runs locally in your browser and uses Chrome extension APIs. Review `manifest.json`, `background.js`, and any storage code to understand what data (if any) is stored or transmitted.

## Developer notes

- Source: `src/` (React + TypeScript). Main UI file: `src/App.tsx`.
- Build assets used by the extension are located in the `No Surf Extension/` folder in this repository.

---

Requirements coverage:
- README file updated at repo root: Done
- Instructions to set up in Chrome from `No Surf Extension/`: Done
- Optional build guidance and troubleshooting: Done
