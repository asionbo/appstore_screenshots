import fs from "node:fs/promises";
import path from "node:path";

import { fileExists } from "./utils.js";

const DEFAULT_LAYOUT = {
  backgroundColor: "#ffffff",
  titleAreaRatio: 0.2,
  outerPaddingRatio: 0.05,
  phoneBorderRatio: 0.024,
  phoneCornerRadiusRatio: 0.16,
  titleColor: "#111111",
  titleAlign: "center",
  titleFontFamily: "Arial, Helvetica, sans-serif",
  titleFontWeight: 700,
};

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function isPositiveInteger(value) {
  return Number.isInteger(value) && value > 0;
}

export async function loadConfig(configPath) {
  const absoluteConfigPath = path.resolve(configPath);
  const configDir = path.dirname(absoluteConfigPath);
  const raw = await fs.readFile(absoluteConfigPath, "utf8");
  const parsed = JSON.parse(raw);

  assert(
    isPositiveInteger(parsed.width),
    "Config width must be a positive integer.",
  );
  assert(
    isPositiveInteger(parsed.height),
    "Config height must be a positive integer.",
  );
  assert(
    typeof parsed.outputDir === "string" && parsed.outputDir.trim(),
    "Config outputDir is required.",
  );
  assert(
    Array.isArray(parsed.locales) && parsed.locales.length > 0,
    "Config locales must be a non-empty array.",
  );
  assert(
    Array.isArray(parsed.screenshots) && parsed.screenshots.length > 0,
    "Config screenshots must be a non-empty array.",
  );

  const locales = parsed.locales.map((locale) => {
    assert(
      typeof locale === "string" && locale.trim(),
      "Each locale must be a non-empty string.",
    );
    return locale.trim();
  });

  const translation = {
    sourceLocale:
      typeof parsed.translation?.sourceLocale === "string" &&
      parsed.translation.sourceLocale.trim()
        ? parsed.translation.sourceLocale.trim()
        : locales[0],
    mode: parsed.translation?.mode === "manual" ? "manual" : "auto",
  };

  const screenshots = [];
  for (const [index, item] of parsed.screenshots.entries()) {
    assert(
      item && typeof item === "object",
      `Screenshot ${index + 1} must be an object.`,
    );
    assert(
      typeof item.imagePath === "string" && item.imagePath.trim(),
      `Screenshot ${index + 1} imagePath is required.`,
    );
    assert(
      typeof item.title === "string" && item.title.trim(),
      `Screenshot ${index + 1} title is required.`,
    );

    const resolvedImagePath = path.resolve(configDir, item.imagePath);
    const imageExists = await fileExists(resolvedImagePath);
    assert(
      imageExists,
      `Screenshot ${index + 1} imagePath does not exist: ${resolvedImagePath}`,
    );

    const localizedTitles =
      item.localizedTitles && typeof item.localizedTitles === "object"
        ? Object.fromEntries(
            Object.entries(item.localizedTitles)
              .filter(([, value]) => typeof value === "string" && value.trim())
              .map(([locale, value]) => [locale, value.trim()]),
          )
        : {};

    screenshots.push({
      imagePath: resolvedImagePath,
      title: item.title.trim(),
      localizedTitles,
      outputName:
        typeof item.outputName === "string" && item.outputName.trim()
          ? item.outputName.trim()
          : undefined,
    });
  }

  if (translation.mode === "manual") {
    for (const [index, screenshot] of screenshots.entries()) {
      for (const locale of locales) {
        if (
          locale !== translation.sourceLocale &&
          !screenshot.localizedTitles[locale]
        ) {
          throw new Error(
            `Screenshot ${index + 1} is missing localizedTitles.${locale} in manual translation mode.`,
          );
        }
      }
    }
  }

  return {
    width: parsed.width,
    height: parsed.height,
    outputDir: path.resolve(configDir, parsed.outputDir),
    locales,
    translation,
    layout: {
      ...DEFAULT_LAYOUT,
      ...(parsed.layout ?? {}),
    },
    screenshots,
    configPath: absoluteConfigPath,
  };
}
