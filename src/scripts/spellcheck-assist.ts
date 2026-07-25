export type SpellMatch = {
  message: string;
  shortMessage?: string;
  offset: number;
  length: number;
  replacements: string[];
  issueType?: string;
  ruleId?: string;
  context?: string;
  original: string;
};

type SpellResponse = {
  ok?: boolean;
  message?: string;
  matches?: SpellMatch[];
};

const DEBOUNCE_MS = 1400;

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

async function requestSpellcheck(text: string): Promise<SpellMatch[]> {
  const response = await fetch("/api/admin/spellcheck", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text, language: "es" }),
  });

  const payload = (await response.json().catch(() => ({}))) as SpellResponse;

  if (!response.ok) {
    throw new Error(payload.message || "No se pudo revisar la ortografia.");
  }

  return payload.matches ?? [];
}

function applyReplacement(field: HTMLTextAreaElement | HTMLInputElement, match: SpellMatch, replacement: string) {
  const value = field.value;
  const before = value.slice(0, match.offset);
  const after = value.slice(match.offset + match.length);
  const next = `${before}${replacement}${after}`;
  const cursor = before.length + replacement.length;

  field.value = next;
  field.focus();
  field.setSelectionRange(cursor, cursor);
  field.dispatchEvent(new Event("input", { bubbles: true }));
}

function renderMatches(
  panel: HTMLElement,
  field: HTMLTextAreaElement | HTMLInputElement,
  matches: SpellMatch[],
  statusEl: HTMLElement,
) {
  if (!matches.length) {
    statusEl.textContent = "Sin sugerencias. El texto se ve bien.";
    statusEl.className = "text-xs text-emerald-300";
    panel.innerHTML = "";
    panel.classList.add("hidden");
    return;
  }

  statusEl.textContent = `${matches.length} sugerencia${matches.length === 1 ? "" : "s"} de LanguageTool`;
  statusEl.className = "text-xs text-amber-200";
  panel.classList.remove("hidden");

  panel.innerHTML = matches
    .map((match, index) => {
      const chips = match.replacements
        .map(
          (item) =>
            `<button type="button" data-spell-apply="${index}" data-spell-value="${escapeHtml(item)}" class="rounded-full border border-emerald-400/30 bg-emerald-400/10 px-2.5 py-1 text-[11px] font-semibold text-emerald-100 transition hover:bg-emerald-400/20">${escapeHtml(item)}</button>`,
        )
        .join("");

      return `
        <div class="rounded-2xl border border-white/10 bg-[#071a34]/80 p-3" data-spell-card="${index}">
          <p class="text-sm text-white/90">
            <span class="font-semibold text-amber-200">“${escapeHtml(match.original || "…")}”</span>
            — ${escapeHtml(match.message)}
          </p>
          ${
            chips
              ? `<div class="mt-2 flex flex-wrap gap-2">${chips}</div>`
              : `<p class="mt-2 text-xs text-white/50">Sin reemplazo automatico; revisa manualmente.</p>`
          }
        </div>
      `;
    })
    .join("");

  panel.querySelectorAll("[data-spell-apply]").forEach((button) => {
    button.addEventListener("click", () => {
      if (!(button instanceof HTMLButtonElement)) return;
      const index = Number(button.dataset.spellApply);
      const value = button.dataset.spellValue ?? "";
      const match = matches[index];
      if (!match || !value) return;

      // Recalcular offset si el texto cambio: buscar la primera ocurrencia cercana
      const current = field.value;
      let offset = match.offset;
      if (current.slice(offset, offset + match.length) !== match.original) {
        const found = current.indexOf(match.original);
        if (found === -1) return;
        offset = found;
      }

      applyReplacement(field, { ...match, offset }, value);
      void runCheck(field, panel, statusEl);
    });
  });
}

async function runCheck(
  field: HTMLTextAreaElement | HTMLInputElement,
  panel: HTMLElement,
  statusEl: HTMLElement,
) {
  const text = field.value;
  if (!text.trim()) {
    statusEl.textContent = "Escribe para revisar ortografia y gramatica.";
    statusEl.className = "text-xs text-white/50";
    panel.innerHTML = "";
    panel.classList.add("hidden");
    return;
  }

  statusEl.textContent = "Revisando…";
  statusEl.className = "text-xs text-white/60";

  try {
    const matches = await requestSpellcheck(text);
    renderMatches(panel, field, matches, statusEl);
  } catch (error) {
    statusEl.textContent = error instanceof Error ? error.message : "Error al revisar.";
    statusEl.className = "text-xs text-red-300";
    panel.classList.add("hidden");
    panel.innerHTML = "";
  }
}

/** Enlaza revisores LanguageTool a campos [data-spellcheck-lt]. */
export function bindSpellcheckAssist(root: ParentNode = document) {
  const fields = root.querySelectorAll<HTMLTextAreaElement | HTMLInputElement>("[data-spellcheck-lt]");

  fields.forEach((field) => {
    if (field.dataset.spellcheckBound === "1") return;
    field.dataset.spellcheckBound = "1";

    const wrap = field.closest("[data-spellcheck-wrap]");
    if (!(wrap instanceof HTMLElement)) return;

    const panel = wrap.querySelector("[data-spellcheck-panel]");
    const statusEl = wrap.querySelector("[data-spellcheck-status]");
    const manualBtn = wrap.querySelector("[data-spellcheck-run]");

    if (!(panel instanceof HTMLElement) || !(statusEl instanceof HTMLElement)) return;

    let timer: ReturnType<typeof setTimeout> | null = null;
    const mode = field.dataset.spellcheckLt || "auto";

    const schedule = () => {
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => {
        void runCheck(field, panel, statusEl);
      }, DEBOUNCE_MS);
    };

    if (mode !== "manual") {
      field.addEventListener("input", schedule);
    }

    field.addEventListener("blur", () => {
      if (timer) clearTimeout(timer);
      void runCheck(field, panel, statusEl);
    });

    if (manualBtn instanceof HTMLButtonElement) {
      manualBtn.addEventListener("click", () => {
        if (timer) clearTimeout(timer);
        void runCheck(field, panel, statusEl);
      });
    }
  });
}
