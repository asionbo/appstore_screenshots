---
name: appstore-screenshot-generator
description: "Generate App Store-style screenshots from image paths or config.json. Use when the user provides an image path, config.json, translated title workflow, or asks to translate titles first, update config, and run npm run generate."
argument-hint: "Image path(s) or config.json"
---

# App Store Screenshot Generator

## When to Use

- The user provides one or more image paths.
- The user provides a config.json file to update.
- The user wants titles translated before generating screenshots.
- The user wants to run npm run generate to produce output images.

## Workflow

1. Inspect the input and determine whether you received image path(s), an existing config.json, or both.
2. If image path(s) are provided, map them into the existing screenshot config structure in input order.
3. Translate each title first, before writing the final config values.
4. Write the translated titles into config.json.
5. Run npm run generate from the repository root.
6. Verify that the expected PNG files were created in output/ and that the titles appear in the generated result.

## Decision Rules

- If the user supplies image path(s), treat them as the source inputs and build or update config entries for each image.
- If the user supplies config.json, preserve the existing layout and only update the fields needed for translation and generation.
- If both are supplied, prefer the provided config.json as the source of structure and use the image paths to refresh or replace the referenced assets.
- Keep generated titles aligned with the input order so each screenshot is labeled consistently.

## Completion Check

- Config.json contains the translated titles.
- npm run generate completes without errors.
- Output PNGs exist in output/ and match the requested input set.
