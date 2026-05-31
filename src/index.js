import process from "node:process";

import { loadConfig } from "./config.js";
import { buildOutputPath } from "./output.js";
import { renderScreenshot } from "./render.js";
import { resolveTitle } from "./translate.js";
import { ensureDir } from "./utils.js";

function getConfigArg(argv) {
  const configFlagIndex = argv.indexOf("--config");
  if (configFlagIndex === -1 || !argv[configFlagIndex + 1]) {
    throw new Error("Usage: node src/index.js --config ./example.config.json");
  }

  return argv[configFlagIndex + 1];
}

async function main() {
  const configPath = getConfigArg(process.argv.slice(2));
  const config = await loadConfig(configPath);
  await ensureDir(config.outputDir);

  const generatedFiles = [];

  for (const locale of config.locales) {
    for (const [index, screenshot] of config.screenshots.entries()) {
      const title = await resolveTitle({
        screenshot,
        locale,
        translation: config.translation,
      });

      const outputPath = buildOutputPath({
        outputDir: config.outputDir,
        locale,
        screenshot,
        index,
      });

      const image = await renderScreenshot({
        config,
        screenshot,
        title,
      });

      await image.toFile(outputPath);

      generatedFiles.push(outputPath);
      console.log(`Generated ${outputPath}`);
    }
  }

  console.log(`Completed ${generatedFiles.length} screenshot(s).`);
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
