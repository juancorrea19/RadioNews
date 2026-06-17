import sharp from "sharp";

export const COVER_IMAGE_WIDTH = 1920;
export const COVER_IMAGE_HEIGHT = 1080;
export const COVER_IMAGE_QUALITY = 82;
export const COVER_ASPECT_RATIO = "16 / 9";

const SUPPORTED_IMAGE_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/avif",
  "image/gif",
]);

function isSupportedImageType(type: string) {
  return SUPPORTED_IMAGE_TYPES.has(type);
}

export async function normalizeCoverImage(file: File) {
  const input = Buffer.from(await file.arrayBuffer());

  if (!isSupportedImageType(file.type)) {
    return {
      buffer: input,
      contentType: file.type || "application/octet-stream",
      extension: file.name.includes(".") ? file.name.split(".").pop()?.toLowerCase() || "jpg" : "jpg",
      processed: false,
    };
  }

  const buffer = await sharp(input)
    .rotate()
    .resize(COVER_IMAGE_WIDTH, COVER_IMAGE_HEIGHT, {
      fit: "cover",
      position: "centre",
    })
    .jpeg({
      quality: COVER_IMAGE_QUALITY,
      mozjpeg: true,
    })
    .toBuffer();

  return {
    buffer,
    contentType: "image/jpeg",
    extension: "jpg",
    processed: true,
  };
}
