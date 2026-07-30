/** Límites y reglas compartidas para subidas directas a Storage (cliente + servidor). */

export const IMAGE_MAX_BYTES = 6 * 1024 * 1024;
export const NEWS_VIDEO_MAX_BYTES = 100 * 1024 * 1024;
export const DENUNCIA_EVIDENCE_MAX_BYTES = 8 * 1024 * 1024;

/** @deprecated Use IMAGE_MAX_BYTES */
export const NEWS_IMAGE_MAX_BYTES = IMAGE_MAX_BYTES;

export const ADMIN_UPLOAD_PURPOSES = ["news-image", "news-video", "flash", "flash-video", "ads"] as const;
export type AdminUploadPurpose = (typeof ADMIN_UPLOAD_PURPOSES)[number];

export const UPLOAD_PURPOSES = [...ADMIN_UPLOAD_PURPOSES, "denuncia-evidence"] as const;
export type UploadPurpose = (typeof UPLOAD_PURPOSES)[number];

export function isAdminUploadPurpose(value: string): value is AdminUploadPurpose {
  return (ADMIN_UPLOAD_PURPOSES as readonly string[]).includes(value);
}

export function isUploadPurpose(value: string): value is UploadPurpose {
  return (UPLOAD_PURPOSES as readonly string[]).includes(value);
}

const IMAGE_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/avif",
  "image/gif",
]);

const NEWS_VIDEO_MIME_TYPES = new Set(["video/mp4", "video/webm", "video/quicktime"]);

const NEWS_VIDEO_EXTENSIONS = new Set(["mp4", "webm", "mov"]);

const DENUNCIA_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "video/mp4",
  "audio/mpeg",
  "audio/mp3",
]);

const DENUNCIA_EXTENSIONS = new Set(["jpg", "jpeg", "png", "pdf", "doc", "docx", "mp4", "mp3"]);

export function fileExtension(filename: string): string {
  if (!filename.includes(".")) return "";
  return filename.split(".").pop()?.toLowerCase() || "";
}

export function isAllowedImage(contentType: string, filename: string): boolean {
  if (IMAGE_MIME_TYPES.has(contentType)) return true;
  const ext = fileExtension(filename);
  return ["jpg", "jpeg", "png", "webp", "avif", "gif"].includes(ext);
}

export function isAllowedNewsVideo(contentType: string, filename: string): boolean {
  if (NEWS_VIDEO_MIME_TYPES.has(contentType)) return true;
  return NEWS_VIDEO_EXTENSIONS.has(fileExtension(filename));
}

export function isAllowedDenunciaEvidence(contentType: string, filename: string): boolean {
  if (DENUNCIA_MIME_TYPES.has(contentType)) return true;
  return DENUNCIA_EXTENSIONS.has(fileExtension(filename));
}

export function maxBytesForPurpose(purpose: UploadPurpose): number {
  switch (purpose) {
    case "news-video":
    case "flash-video":
      return NEWS_VIDEO_MAX_BYTES;
    case "denuncia-evidence":
      return DENUNCIA_EVIDENCE_MAX_BYTES;
    default:
      return IMAGE_MAX_BYTES;
  }
}

export function validateUploadMeta(input: {
  purpose: UploadPurpose;
  filename: string;
  contentType: string;
  sizeBytes: number;
}): { ok: true } | { ok: false; message: string } {
  const { purpose, filename, contentType, sizeBytes } = input;
  const max = maxBytesForPurpose(purpose);

  if (!filename.trim()) {
    return { ok: false, message: "El nombre del archivo no es valido." };
  }

  if (!Number.isFinite(sizeBytes) || sizeBytes <= 0) {
    return { ok: false, message: "El archivo esta vacio o el tamaño no es valido." };
  }

  if (sizeBytes > max) {
    const mb = Math.round(max / (1024 * 1024));
    if (purpose === "news-video" || purpose === "flash-video") {
      return { ok: false, message: `El video supera el limite de ${mb} MB.` };
    }
    if (purpose === "denuncia-evidence") {
      return { ok: false, message: `La evidencia supera el limite de ${mb} MB.` };
    }
    return { ok: false, message: `La imagen supera el limite de ${mb} MB.` };
  }

  if (purpose === "news-video" || purpose === "flash-video") {
    if (!isAllowedNewsVideo(contentType, filename)) {
      return { ok: false, message: "El video debe ser MP4, WebM o MOV." };
    }
  } else if (purpose === "denuncia-evidence") {
    if (!isAllowedDenunciaEvidence(contentType, filename)) {
      return { ok: false, message: "Tipo de evidencia no permitido." };
    }
  } else if (!isAllowedImage(contentType, filename)) {
    return { ok: false, message: "La imagen debe ser JPG, PNG, WebP, AVIF o GIF." };
  }

  return { ok: true };
}

export function resolveContentType(purpose: UploadPurpose, filename: string, contentType: string): string {
  if (contentType && contentType !== "application/octet-stream") {
    return contentType;
  }

  const ext = fileExtension(filename);

  if (purpose === "news-video" || purpose === "flash-video") {
    if (ext === "webm") return "video/webm";
    if (ext === "mov") return "video/quicktime";
    return "video/mp4";
  }

  if (ext === "png") return "image/png";
  if (ext === "webp") return "image/webp";
  if (ext === "gif") return "image/gif";
  if (ext === "avif") return "image/avif";
  if (ext === "pdf") return "application/pdf";
  if (ext === "mp3") return "audio/mpeg";
  if (ext === "mp4") return "video/mp4";
  return "image/jpeg";
}
