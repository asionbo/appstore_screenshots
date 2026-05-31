import path from "node:path";

import { formatIndex, slugify } from "./utils.js";

export function buildOutputPath({ outputDir, locale, screenshot, index }) {
  const baseName = screenshot.outputName
    ? slugify(screenshot.outputName)
    : `slide-${formatIndex(index)}`;
  const fileName = `${slugify(locale, "locale")}-${formatIndex(index)}-${baseName}.png`;
  return path.join(outputDir, fileName);
}
