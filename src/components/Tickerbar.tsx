import { useEffect, useState } from "react";

interface TickerItem {
  id: string;
  label: string;
  value: string;
  change?: string;
  changePositive?: boolean;
  icon: string;
}

/** IDs ocultos en la UI (p. ej. datos rotos); la API puede seguir enviándolos. */
const TICKER_HIDDEN_IDS = new Set<string>(["colcap"]);

const FALLBACK_ITEMS: TickerItem[] = [
  {
    id: "dolar",
    label: "USD/COP",
    value: "Cargando...",
    icon: "\u{1F4B5}",
  },
  {
    id: "sp500",
    label: "S&P 500",
    value: "Cargando...",
    icon: "\u{1F4CA}",
  },
  {
    id: "clima",
    label: "Bogota",
    value: "Cargando...",
    icon: "\u2600\uFE0F",
  },
  {
    id: "bitcoin",
    label: "Bitcoin",
    value: "Cargando...",
    icon: "\u20BF",
  },
];

function LiveClock() {
  const [time, setTime] = useState<string>("");

  useEffect(() => {
    const updateTime = () => {
      setTime(
        new Date().toLocaleTimeString("es-CO", {
          hour: "2-digit",
          minute: "2-digit",
          hour12: true,
          timeZone: "America/Bogota",
        }),
      );
    };

    updateTime();
    const interval = window.setInterval(updateTime, 1000);

    return () => window.clearInterval(interval);
  }, []);

  return (
    <div className="shrink-0 min-w-[110px] border-l border-white/10 px-5 py-4 text-center font-mono text-[14px] text-white">
      {time || "--:--"}
    </div>
  );
}

export default function TickerBar() {
  const [items, setItems] = useState<TickerItem[]>(FALLBACK_ITEMS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const fetchTicker = async () => {
      try {
        const response = await fetch(`/api/ticker.json?t=${Date.now()}`, {
          cache: "no-store",
          headers: {
            Accept: "application/json",
          },
        });

        if (!response.ok) {
          throw new Error(`Ticker request failed with status ${response.status}`);
        }

        const data = (await response.json()) as TickerItem[];

        if (!Array.isArray(data) || data.length === 0) {
          throw new Error("Ticker response is empty");
        }

        if (!cancelled) {
          setItems(data.filter((item) => !TICKER_HIDDEN_IDS.has(item.id)));
        }
      } catch (error) {
        console.error("Error cargando el ticker en vivo:", error);

        if (!cancelled) {
          setItems((currentItems) => (currentItems.length > 0 ? currentItems : FALLBACK_ITEMS));
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    fetchTicker();
    const interval = window.setInterval(fetchTicker, 60_000);

    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, []);

  if (loading) {
    return <div className="h-14 w-full animate-pulse bg-[#021529]" />;
  }

  const visible =
    items.length > 0 ? items : FALLBACK_ITEMS.filter((item) => !TICKER_HIDDEN_IDS.has(item.id));
  const displayItems = visible.length > 0 ? [...visible, ...visible] : [];

  return (
    <div className="w-full overflow-hidden border-b border-white/10" style={{ backgroundColor: "#021529" }}>
      <div className="flex items-center">
        <div
          className="shrink-0 whitespace-nowrap border-r border-white/10 px-6 py-4 text-[13px] font-bold uppercase tracking-widest text-white"
          style={{ backgroundColor: "#a62b2b" }}
        >
          En vivo
        </div>

        <div className="relative flex-1 overflow-hidden">
          <div className="ticker-scroll flex" style={{ animation: "ticker-move 40s linear infinite", width: "max-content" }}>
            {displayItems.map((item, i) => (
              <div key={`${item.id}-${i}`} className="flex shrink-0 items-center gap-4 border-r border-white/10 px-8 py-4">
                <span className="text-[20px]">{item.icon}</span>
                <div className="flex flex-col justify-center">
                  <span className="mb-1 text-[11px] font-bold uppercase leading-none tracking-tighter text-white">
                    {item.label}
                  </span>
                  <div className="flex items-baseline gap-2">
                    <span className="text-[15px] font-bold leading-none text-white">{item.value}</span>
                    {item.change && (
                      <span
                        className="text-[12px] font-medium"
                        style={{
                          color:
                            item.changePositive === undefined
                              ? "rgba(255,255,255,0.72)"
                              : item.changePositive
                                ? "#4ade80"
                                : "#f87171",
                        }}
                      >
                        {item.changePositive === undefined ? "" : item.changePositive ? "\u25B2 " : "\u25BC "}
                        {item.change}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <LiveClock />
      </div>

      <style>{`
        @keyframes ticker-move {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .ticker-scroll:hover {
          animation-play-state: paused;
        }
      `}</style>
    </div>
  );
}
