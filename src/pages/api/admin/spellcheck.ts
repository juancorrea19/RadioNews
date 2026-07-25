import type { APIRoute } from "astro";
import { getAuthenticatedAdmin } from "../../../lib/server/admin-auth";

const DEFAULT_LT_URL = "https://api.languagetool.org/v2/check";
const MAX_CHARS = 20_000;

type LanguageToolMatch = {
  message?: string;
  shortMessage?: string;
  offset?: number;
  length?: number;
  replacements?: Array<{ value?: string }>;
  rule?: { id?: string; description?: string; issueType?: string };
  context?: { text?: string; offset?: number; length?: number };
};

function json(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

export const POST: APIRoute = async ({ request, cookies }) => {
  try {
    const admin = await getAuthenticatedAdmin(cookies);
    if (!admin.user) {
      return json({ message: "No autorizado." }, 401);
    }

    const body = (await request.json()) as { text?: string; language?: string };
    const text = String(body.text ?? "");
    const language = String(body.language || "es").trim() || "es";

    if (!text.trim()) {
      return json({ ok: true, matches: [] });
    }

    if (text.length > MAX_CHARS) {
      return json(
        {
          message: `El texto supera el limite de revision (${MAX_CHARS} caracteres). Revisa por secciones.`,
        },
        400,
      );
    }

    const endpoint = (import.meta.env.LANGUAGETOOL_API_URL as string | undefined)?.trim() || DEFAULT_LT_URL;
    const form = new URLSearchParams();
    form.set("text", text);
    form.set("language", language);
    form.set("enabledOnly", "false");

    const upstream = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: form.toString(),
    });

    if (!upstream.ok) {
      const detail = await upstream.text().catch(() => "");
      console.error("LanguageTool error", upstream.status, detail);
      return json(
        {
          message:
            upstream.status === 429
              ? "El corrector esta ocupado. Espera unos segundos e intenta de nuevo."
              : "No se pudo revisar la ortografia en este momento.",
        },
        502,
      );
    }

    const payload = (await upstream.json()) as { matches?: LanguageToolMatch[] };
    const matches = (payload.matches ?? [])
      .map((match) => {
        const offset = Number(match.offset ?? 0);
        const length = Number(match.length ?? 0);
        const replacements = (match.replacements ?? [])
          .map((item) => String(item.value ?? "").trim())
          .filter(Boolean)
          .slice(0, 5);

        return {
          message: String(match.message || match.shortMessage || "Posible error").trim(),
          shortMessage: String(match.shortMessage || "").trim(),
          offset,
          length,
          replacements,
          issueType: String(match.rule?.issueType || "misspelling"),
          ruleId: String(match.rule?.id || ""),
          context: String(match.context?.text || text.slice(Math.max(0, offset - 20), offset + length + 20)),
          original: text.slice(offset, offset + length),
        };
      })
      .filter((match) => match.length > 0 && Number.isFinite(match.offset))
      .slice(0, 40);

    return json({ ok: true, matches });
  } catch (error) {
    console.error("Error en spellcheck admin", error);
    return json({ message: "No se pudo revisar la ortografia." }, 500);
  }
};
