# flomo2blinko

中文版请见 [README_CN.md](https://github.com/StrayDogA8/flomo2blinko/blob/main/README_CN.md)

## Introduction

**flomo2blinko** is a Chrome extension that helps you convert notes exported from Flomo into a format that can be imported into Blinko.

## Features

- 🔄 Supports converting Flomo-exported ZIP files to `.bko` format.
- ⏰ Retains the original creation and update timestamps of notes.
- 🏷️ Automatically adds the `#flomo` tag to all notes.
- 📷 Supports the conversion of image attachments.
- ✍️ Preserves Markdown formatting.

## Installation

1. Download the latest version of this project.
2. Open Chrome and go to the Extensions page.
3. Enable Developer Mode.
4. Click "Load unpacked extension."
5. Select this project's folder.

## Usage

1. Export notes from Flomo to obtain a ZIP file.
2. Click the extension icon to open the conversion interface.
3. Enter your Blinko username (found on the settings page, not the Access Token).
4. Select the ZIP file exported from Flomo.
5. Click the "Convert" button.
6. Wait for the conversion to complete, and the `flomo_notes.bko` file will be downloaded automatically.
7. Import the `.bko` file into Blinko.

## Notes

- Ensure that the ZIP file exported from Flomo contains complete note content.
- During the conversion, all images will be converted to PNG format.
- It is recommended to back up your Blinko data before importing.
- After importing, the imported notes require forced re-embedding of vector data to function properly with AI.

## Original Projects

- [Blinko](https://github.com/blinko-space/blinko): An open-source, self-hosted personal AI note tool prioritizing privacy, built using TypeScript.  
- [Flomo](https://flomoapp.com): A cross-platform card-based note-taking app focused on helping you capture more ideas and inspirations while revisiting past records effectively.