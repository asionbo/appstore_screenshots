# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

A Node.js CLI that renders App Store screenshots (PNG) from a JSON config: each config screenshot entry pairs one app image with a title, and the tool composes a canvas with the title on top and the image inside a drawn phone frame. Output is per-locale so one run generates the full localization set.

## Commands

```bash
npm run generate      # render from ./example.config.json (iPhone, 1320x2868)
npm run generatePad   # render from ./example_iPad.config.json (iPad, 2048x2732)
```

There are no tests, lint, or build steps. To use a different config: `node src/index.js --config <path>`.

Dependencies are `sharp` (image composition) and `translate-google` (auto-translation mode only). The project is ESM (`"type": "module"`) — use `import` syntax.

## Architecture

Pipeline in `src/index.js` loops locales × screenshots, then per item:

1. **`config.js`** — loads, validates, and normalizes the config. Paths (`imagePath`, `outputDir`) resolve relative to the config file's directory, not the CWD. Applies `DEFAULT_LAYOUT` and merges user `layout` over it. In `manual` translation mode it eagerly fails if any non-source locale is missing a `localizedTitles` entry.
2. **`translate.js`** — title resolution order: `localizedTitles[locale]` → `title` if locale is `sourceLocale` → error in `manual` mode → `translate-google` in `auto` mode.
3. **`layout.js`** — pure geometry: computes title area, phone frame, and screen rect as ratios of canvas size, with clamped border/corner radii. Returns the coordinate box consumed by the renderer.
4. **`render.js`** — does all drawing via `sharp` + generated SVG buffers: the screen image is resized (`fit: contain`) and corner-rounded via a `dest-in` mask, then composited onto the canvas under the title SVG and the phone-frame SVG (stroke rect + speaker slot). Title wrapping/auto-sizing also happens here (SVG `<tspan>`s, shrink-until-fits loop).
5. **`output.js`** — filename is `{locale}-{NN}-{outputName|slide-NN}.png`; locale and name are slugified (so config key `zh_Hant` becomes file prefix `zh-hant`).

Key ratios live in the config's `layout` block (e.g. `titleAreaRatio`, `phoneBorderRatio`, `screenCornerRadiusRatio`) — tune output appearance there rather than in code. Background color, fonts, and title alignment are also config-driven; `layout.backgroundSource` (optional image path, resolved relative to the config file) replaces the flat background with a full-canvas cover-fit image drawn under the title and phone frame.

## Conventions

- Configs live at repo root as `example.config.json` (iPhone) and `example_iPad.config.json` (iPad); source app screenshots go in `assets/source/`; `output/` is gitignored.
- The project's real workflow (see `.github/skills/appstore-screenshot-generator/SKILL.md`): when given new image paths, map them into the config in input order, translate all titles first (manual `localizedTitles` per non-source locale, sourceLocale is `zh` in the shipped configs), write the config, then run the generate script and verify PNGs in `output/`.
- Config files use locale keys like `zh_Hant` (underscore) — these are arbitrary strings matched against `locales` and slugified in filenames.
