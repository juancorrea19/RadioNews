import {
  type UploadPurpose,
  maxBytesForPurpose,
  validateUploadMeta,
} from "../lib/upload-limits";

export type DirectUploadResult = {
  path: string;
  publicUrl: string;
  contentType: string;
  sizeBytes: number;
  filename: string;
};

type SignResponse = {
  ok?: boolean;
  message?: string;
  path?: string;
  publicUrl?: string;
  signedUrl?: string;
  contentType?: string;
};

function signEndpointForPurpose(purpose: UploadPurpose): string {
  if (purpose === "denuncia-evidence") {
    return "/api/denuncias/sign-upload";
  }
  return "/api/admin/media/sign-upload";
}

async function requestSignedUpload(
  purpose: UploadPurpose,
  file: File,
): Promise<{ path: string; publicUrl: string; signedUrl: string; contentType: string }> {
  const validation = validateUploadMeta({
    purpose,
    filename: file.name,
    contentType: file.type || "application/octet-stream",
    sizeBytes: file.size,
  });

  if (!validation.ok) {
    throw new Error(validation.message);
  }

  const response = await fetch(signEndpointForPurpose(purpose), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      purpose,
      filename: file.name,
      contentType: file.type || "application/octet-stream",
      sizeBytes: file.size,
    }),
  });

  const payload = (await response.json().catch(() => ({}))) as SignResponse;

  if (!response.ok || !payload.signedUrl || !payload.path) {
    throw new Error(payload.message || "No se pudo preparar la subida.");
  }

  return {
    path: payload.path,
    publicUrl: payload.publicUrl || "",
    signedUrl: payload.signedUrl,
    contentType: payload.contentType || file.type || "application/octet-stream",
  };
}

function putFileToSignedUrl(
  signedUrl: string,
  file: File,
  contentType: string,
  onProgress?: (percent: number) => void,
): Promise<void> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("PUT", signedUrl);
    xhr.setRequestHeader("Content-Type", contentType);

    xhr.upload.onprogress = (event) => {
      if (!onProgress || !event.lengthComputable || event.total <= 0) return;
      onProgress(Math.min(99, Math.round((event.loaded / event.total) * 100)));
    };

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        onProgress?.(100);
        resolve();
        return;
      }
      reject(new Error(`Error al subir el archivo (${xhr.status}).`));
    };

    xhr.onerror = () => reject(new Error("Error de red al subir el archivo."));
    xhr.send(file);
  });
}

/** Sube un archivo directo a Storage (firma en servidor + PUT al signed URL). */
export async function directUpload(
  purpose: UploadPurpose,
  file: File,
  options?: { onProgress?: (percent: number) => void },
): Promise<DirectUploadResult> {
  const signed = await requestSignedUpload(purpose, file);
  await putFileToSignedUrl(signed.signedUrl, file, signed.contentType, options?.onProgress);

  return {
    path: signed.path,
    publicUrl: signed.publicUrl,
    contentType: signed.contentType,
    sizeBytes: file.size,
    filename: file.name,
  };
}

export function formatUploadLabel(purpose: UploadPurpose, percent: number): string {
  const kind =
    purpose === "news-video" || purpose === "flash-video"
      ? "video"
      : purpose === "denuncia-evidence"
        ? "evidencia"
        : "imagen";
  return `Subiendo ${kind}… ${percent}%`;
}

export { maxBytesForPurpose, validateUploadMeta };
export type { UploadPurpose };

type BindOptions = {
  purpose: UploadPurpose;
  fileInput: HTMLInputElement;
  urlInput: HTMLInputElement;
  pathInput: HTMLInputElement;
  obsoleteInput?: HTMLInputElement | null;
  statusEl?: HTMLElement | null;
  requiredWhenEmpty?: boolean;
};

/** Enlaza un input file a subida directa y rellena hidden url/path antes del submit. */
export function bindDirectFileInput(options: BindOptions) {
  const { purpose, fileInput, urlInput, pathInput, obsoleteInput, statusEl, requiredWhenEmpty } =
    options;

  const setStatus = (message: string, isError = false) => {
    if (!statusEl) return;
    statusEl.classList.toggle("hidden", !message);
    statusEl.classList.toggle("text-red-300", isError);
    statusEl.classList.toggle("text-red-700", isError);
    statusEl.textContent = message;
  };

  const syncRequired = () => {
    if (!requiredWhenEmpty) {
      fileInput.required = false;
      return;
    }
    fileInput.required = !pathInput.value.trim();
  };

  syncRequired();

  fileInput.addEventListener("change", () => {
    const file = fileInput.files?.[0];
    if (!file) return;

    const form = fileInput.closest("form");
    const submit = form?.querySelector('button[type="submit"]');
    const previousPath = pathInput.value.trim();

    void (async () => {
      try {
        if (submit instanceof HTMLButtonElement) submit.disabled = true;
        setStatus(formatUploadLabel(purpose, 0));

        const uploaded = await directUpload(purpose, file, {
          onProgress: (percent) => setStatus(formatUploadLabel(purpose, percent)),
        });

        if (obsoleteInput && previousPath && previousPath !== uploaded.path) {
          obsoleteInput.value = previousPath;
        }

        urlInput.value = uploaded.publicUrl;
        pathInput.value = uploaded.path;
        fileInput.value = "";
        syncRequired();
        setStatus("Archivo listo para guardar.");
      } catch (error) {
        fileInput.value = "";
        setStatus(error instanceof Error ? error.message : "No se pudo subir el archivo.", true);
      } finally {
        if (submit instanceof HTMLButtonElement) submit.disabled = false;
      }
    })();
  });

  const form = fileInput.closest("form");
  form?.addEventListener("submit", (event) => {
    if (requiredWhenEmpty && !pathInput.value.trim()) {
      event.preventDefault();
      setStatus("Sube un archivo antes de guardar.", true);
    }
  });
}
