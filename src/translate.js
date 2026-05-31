import translate from "translate-google";

export async function resolveTitle({ screenshot, locale, translation }) {
  if (screenshot.localizedTitles[locale]) {
    return screenshot.localizedTitles[locale];
  }

  if (locale === translation.sourceLocale) {
    return screenshot.title;
  }

  if (translation.mode === "manual") {
    throw new Error(`Missing localized title for locale ${locale}.`);
  }

  return translate(screenshot.title, {
    from: translation.sourceLocale,
    to: locale,
  });
}
