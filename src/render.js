import sharp from "sharp";

import { createLayout } from "./layout.js";
import { escapeXml } from "./utils.js";

function wrapText(value, maxCharsPerLine) {
  const text = String(value).trim();
  if (!text) {
    return [""];
  }

  if (!/\s/.test(text)) {
    const chunks = [];
    for (let index = 0; index < text.length; index += maxCharsPerLine) {
      chunks.push(text.slice(index, index + maxCharsPerLine));
    }
    return chunks;
  }

  const words = text.split(/\s+/);
  const lines = [];
  let currentLine = words.shift() ?? "";

  for (const word of words) {
    const nextLine = `${currentLine} ${word}`;
    if (nextLine.length <= maxCharsPerLine) {
      currentLine = nextLine;
      continue;
    }

    lines.push(currentLine);
    currentLine = word;
  }

  if (currentLine) {
    lines.push(currentLine);
  }

  return lines;
}

function createTitleSvg({ title, box, layout }) {
  let fontSize = Math.min(
    Math.round(box.height * 0.22),
    Math.round(box.width * 0.09),
  );
  let lines = [title];
  let lineHeight = Math.round(fontSize * 1.18);

  while (fontSize >= 32) {
    const maxCharsPerLine = Math.max(
      8,
      Math.floor(box.width / (fontSize * 0.58)),
    );
    lines = wrapText(title, maxCharsPerLine).slice(0, 4);
    lineHeight = Math.round(fontSize * 1.18);

    if (lines.length * lineHeight <= box.height * 0.82) {
      break;
    }

    fontSize -= 4;
  }

  const totalTextHeight = lineHeight * lines.length;
  const startY =
    Math.round((box.height - totalTextHeight) / 2) + Math.round(fontSize * 0.9);
  const anchor =
    layout.titleAlign === "left"
      ? "start"
      : layout.titleAlign === "right"
        ? "end"
        : "middle";
  const x =
    layout.titleAlign === "left"
      ? 0
      : layout.titleAlign === "right"
        ? box.width
        : Math.round(box.width / 2);

  const tspans = lines
    .map((line, index) => {
      const dy = index === 0 ? 0 : lineHeight;
      return `<tspan x="${x}" dy="${dy}">${escapeXml(line)}</tspan>`;
    })
    .join("");

  return Buffer.from(`
    <svg width="${box.width}" height="${box.height}" xmlns="http://www.w3.org/2000/svg">
      <style>
        text {
          font-family: ${layout.titleFontFamily};
          font-size: ${fontSize}px;
          font-weight: ${layout.titleFontWeight};
          fill: ${layout.titleColor};
        }
      </style>
      <text x="${x}" y="${startY}" text-anchor="${anchor}">${tspans}</text>
    </svg>
  `);
}

function roundedRectSvg({ width, height, radius, fill }) {
  return Buffer.from(`
    <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <rect width="${width}" height="${height}" rx="${radius}" ry="${radius}" fill="${fill}" />
    </svg>
  `);
}

function phoneFrameSvg({ phone, screen }) {
  const strokeWidth = phone.border;
  const outerInset = strokeWidth / 2;
  const outerWidth = phone.width - strokeWidth;
  const outerHeight = phone.height - strokeWidth;
  const outerRadius = Math.max(0, phone.cornerRadius - outerInset);
  const speakerWidth = Math.round(phone.width * 0.22);
  const speakerHeight = Math.max(8, Math.round(phone.border * 0.2));
  const speakerX = Math.round((phone.width - speakerWidth) / 2);
  const speakerY = Math.round(phone.border * 0.42);

  return Buffer.from(`
    <svg width="${phone.width}" height="${phone.height}" xmlns="http://www.w3.org/2000/svg">
      <rect
        x="${outerInset}"
        y="${outerInset}"
        width="${outerWidth}"
        height="${outerHeight}"
        rx="${outerRadius}"
        ry="${outerRadius}"
        fill="none"
        stroke="#0d0d0d"
        stroke-width="${strokeWidth}"
      />
      <rect x="${speakerX}" y="${speakerY}" width="${speakerWidth}" height="${speakerHeight}" rx="${Math.round(speakerHeight / 2)}" fill="#262626"/>
    </svg>
  `);
}

export async function renderScreenshot({ config, screenshot, title }) {
  const image = sharp(screenshot.imagePath);
  const metadata = await image.metadata();
  const geometry = createLayout({
    width: config.width,
    height: config.height,
    layout: config.layout,
    imageMeta: metadata,
  });

  const screenImage = await sharp(screenshot.imagePath)
    .resize({
      width: geometry.screen.width,
      height: geometry.screen.height,
      fit: "contain",
      position: "centre",
      background: config.layout.backgroundColor,
    })
    .composite([
      {
        input: roundedRectSvg({
          width: geometry.screen.width,
          height: geometry.screen.height,
          radius: geometry.screen.cornerRadius,
          fill: "#ffffff",
        }),
        blend: "dest-in",
      },
    ])
    .png()
    .toBuffer();

  return sharp({
    create: {
      width: config.width,
      height: config.height,
      channels: 4,
      background: config.layout.backgroundColor,
    },
  })
    .composite([
      {
        input: createTitleSvg({
          title,
          box: geometry.title,
          layout: config.layout,
        }),
        top: geometry.title.y,
        left: geometry.title.x,
      },
      {
        input: screenImage,
        top: geometry.screen.y,
        left: geometry.screen.x,
      },
      {
        input: phoneFrameSvg({
          phone: geometry.phone,
          screen: geometry.screen,
        }),
        top: geometry.phone.y,
        left: geometry.phone.x,
      },
    ])
    .png();
}
