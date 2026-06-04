import type { APIRoute } from "astro";
import { videoMimeTypeFromUrl } from "../../lib/news-video";

function isAllowedNewsMediaUrl(src: string): boolean {
  try {
    const parsed = new URL(src);
    const supabaseUrl = import.meta.env.SUPABASE_URL;

    if (!supabaseUrl) {
      return false;
    }

    const allowedHost = new URL(supabaseUrl).host;
    return (
      parsed.host === allowedHost &&
      parsed.pathname.includes("/storage/v1/object/public/news-images/")
    );
  } catch {
    return false;
  }
}

export const GET: APIRoute = async ({ request, url }) => {
  const src = url.searchParams.get("src")?.trim();

  if (!src || !isAllowedNewsMediaUrl(src)) {
    return new Response("No encontrado", { status: 404 });
  }

  const range = request.headers.get("Range");
  const upstreamHeaders = new Headers();

  if (range) {
    upstreamHeaders.set("Range", range);
  }

  const upstream = await fetch(src, { headers: upstreamHeaders });

  if (!upstream.ok && upstream.status !== 206) {
    return new Response("No se pudo cargar el archivo", { status: upstream.status });
  }

  const responseHeaders = new Headers();
  const contentType = videoMimeTypeFromUrl(src);

  responseHeaders.set("Content-Type", contentType);
  responseHeaders.set("Accept-Ranges", "bytes");
  responseHeaders.set("Cache-Control", "public, max-age=3600");

  const contentLength = upstream.headers.get("Content-Length");
  const contentRange = upstream.headers.get("Content-Range");

  if (contentLength) {
    responseHeaders.set("Content-Length", contentLength);
  }

  if (contentRange) {
    responseHeaders.set("Content-Range", contentRange);
  }

  return new Response(upstream.body, {
    status: upstream.status,
    headers: responseHeaders,
  });
};
