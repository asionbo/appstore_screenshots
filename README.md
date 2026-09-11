# App Store Screenshot Generator

This project generates PNG App Store screenshots from a JSON config.

Each screenshot entry pairs one image with one title by index order. The generator renders the title above the image, places the image directly inside a black phone-style frame, and exports a PNG at the configured size.

## Usage

Run the example configuration:

```bash
npm run generate
```

The example writes files to `./output`.

## Config shape

```json
{
  "width": 1320,
  "height": 2868,
  "outputDir": "./output",
  "locales": ["en", "zh-cn"],
  "translation": {
    "sourceLocale": "en",
    "mode": "manual"
  },
  "layout": {
    "backgroundSource": "./assets/example/background.png"
  },
  "screenshots": [
    {
      "imagePath": "./assets/example/input.png",
      "title": "Base title",
      "localizedTitles": {
        "zh-cn": "本地化标题"
      },
      "outputName": "home"
    }
  ]
}
```

## Background image

Set `layout.backgroundSource` to an image path (relative to the config file) to use it as the full-canvas background instead of the flat `backgroundColor`. The image is resized to cover the whole canvas, and the title and phone-framed screenshot are composited on top.

## Translation modes

- `manual`: use `localizedTitles` for each non-source locale.
- `auto`: if a locale title is missing, the generator uses `translate-google` to translate from the source locale.

## Output naming

Each generated file uses this pattern:

```text
locale-index-output-name.png
```

Example:

```text
en-01-organize-moments.png
zh-cn-01-organize-moments.png
```
