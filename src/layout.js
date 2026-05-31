import { clamp } from "./utils.js";

export function createLayout({ width, height, layout, imageMeta }) {
  const outerPadding = Math.round(width * layout.outerPaddingRatio);
  const titleAreaHeight = Math.round(height * layout.titleAreaRatio);
  const contentTop = outerPadding + titleAreaHeight;
  const contentBottomPadding = outerPadding;
  const availableWidth = width - outerPadding * 2;
  const availableHeight = height - contentTop - contentBottomPadding;

  const imageWidth = imageMeta.width ?? availableWidth;
  const imageHeight = imageMeta.height ?? availableHeight;
  const frameGuessWidth = Math.min(
    availableWidth,
    Math.round(availableHeight * (imageWidth / imageHeight)),
  );
  const frameBorder = clamp(
    Math.round(frameGuessWidth * layout.phoneBorderRatio),
    18,
    72,
  );
  const screenMaxWidth = availableWidth - frameBorder * 2;
  const screenMaxHeight = availableHeight - frameBorder * 2;

  const fitScale = Math.min(
    screenMaxWidth / imageWidth,
    screenMaxHeight / imageHeight,
  );
  const screenWidth = Math.max(1, Math.round(imageWidth * fitScale));
  const screenHeight = Math.max(1, Math.round(imageHeight * fitScale));
  const phoneWidth = screenWidth + frameBorder * 2;
  const phoneHeight = screenHeight + frameBorder * 2;
  const phoneX = Math.round((width - phoneWidth) / 2);
  const phoneY = contentTop + Math.round((availableHeight - phoneHeight) / 2);
  const screenX = phoneX + frameBorder;
  const screenY = phoneY + frameBorder;
  const screenCornerRadiusRatio =
    layout.screenCornerRadiusRatio ??
    Math.max(layout.phoneCornerRadiusRatio, 0.16);
  const screenCornerRadius = clamp(
    Math.round(Math.min(screenWidth, screenHeight) * screenCornerRadiusRatio),
    72,
    172,
  );
  const phoneCornerRadius = clamp(
    screenCornerRadius + Math.round(frameBorder * 1.65),
    screenCornerRadius + 24,
    232,
  );

  return {
    canvas: { width, height },
    title: {
      x: outerPadding,
      y: outerPadding,
      width: availableWidth,
      height: titleAreaHeight,
    },
    phone: {
      x: phoneX,
      y: phoneY,
      width: phoneWidth,
      height: phoneHeight,
      cornerRadius: phoneCornerRadius,
      border: frameBorder,
    },
    screen: {
      x: screenX,
      y: screenY,
      width: screenWidth,
      height: screenHeight,
      cornerRadius: screenCornerRadius,
    },
  };
}
