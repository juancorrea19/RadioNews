const VIDEO_MIME_BY_EXTENSION: Record<string, string> = {
  mp4: "video/mp4",
  webm: "video/webm",
  mov: "video/quicktime",
};

export function resolveVideoContentType(file: File): string {
  if (file.type.startsWith("video/")) {
    return file.type;
  }

  const extension = file.name.includes(".") ? file.name.split(".").pop()?.toLowerCase() : "";
  return (extension && VIDEO_MIME_BY_EXTENSION[extension]) || "video/mp4";
}

export function videoMimeTypeFromUrl(url: string): string {
  const pathname = url.split("?")[0] ?? url;
  const extension = pathname.includes(".") ? pathname.split(".").pop()?.toLowerCase() : "";
  return (extension && VIDEO_MIME_BY_EXTENSION[extension]) || "video/mp4";
}

export function isPosterImage(imageUrl: string): boolean {
  return Boolean(imageUrl) && imageUrl !== "/favicon.png";
}
