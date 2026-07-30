import type { APIRoute } from "astro";

interface TickerItem {
  id: string;
  label: string;
  value: string;
  change?: string;
  changePositive?: boolean;
  icon: string;
}

interface FmpQuoteItem {
  symbol?: string;
  price?: number;
  changesPercentage?: number | string;
  change?: number | string;
}

interface TwelveDataQuoteResponse {
  symbol?: string;
  close?: string;
  change?: string;
  percent_change?: string;
  code?: number;
  message?: string;
  status?: string;
}

const defaultTickerData = (): TickerItem[] => [
  {
    id: "dolar",
    label: "USD/COP",
    value: "No disponible",
    icon: "\u{1F4B5}",
  },
  {
    id: "sp500",
    label: "S&P 500",
    value: "No disponible",
    change: "Sin datos",
    icon: "\u{1F4CA}",
  },
  {
    id: "clima",
    label: "Bogotá",
    value: "No disponible",
    change: "Sin datos",
    icon: "\u2600\uFE0F",
  },
  {
    id: "bitcoin",
    label: "Bitcoin",
    value: "No disponible",
    change: "Sin datos",
    icon: "\u20BF",
  },
  {
    id: "oro",
    label: "Oro (XAU)",
    value: "No disponible",
    icon: "\u{1FA99}",
  },
  {
    id: "cafe",
    label: "Café (arábica)",
    value: "No disponible",
    icon: "\u2615",
  },
];

function formatSignedPercent(value?: string | number | null) {
  const parsed = typeof value === "number" ? value : Number(value);

  if (!Number.isFinite(parsed)) {
    return "Sin datos";
  }

  return `${Math.abs(parsed).toFixed(2)}%`;
}

function formatIndexValue(value?: string | number | null) {
  const parsed = typeof value === "number" ? value : Number(value);

  if (!Number.isFinite(parsed)) {
    return "No disponible";
  }

  return parsed.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function toFiniteNumber(value: unknown): number {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === "string") {
    const n = Number(value);
    return Number.isFinite(n) ? n : Number.NaN;
  }
  return Number.NaN;
}

function getTickerItemById(items: TickerItem[], id: string) {
  return items.find((item) => item.id === id);
}

interface CommodityRatesResponse {
  success?: boolean;
  rates?: Record<string, number>;
}

async function fetchCommodityRates(apiKey: string, symbols: string[]): Promise<Record<string, number>> {
  const response = await fetch(
    `https://api.commoditypriceapi.com/v2/rates/latest?symbols=${symbols.map(encodeURIComponent).join(",")}`,
    { headers: { "x-api-key": apiKey } },
  );

  if (!response.ok) {
    throw new Error(`CommodityPriceAPI HTTP ${response.status}`);
  }

  const payload = (await response.json()) as CommodityRatesResponse;

  if (!payload.success || !payload.rates) {
    throw new Error("CommodityPriceAPI: respuesta sin datos de rates");
  }

  return payload.rates;
}

function applyCommodityRates(data: TickerItem[], rates: Record<string, number>) {
  const gold = getTickerItemById(data, "oro");
  if (gold && typeof rates.XAU === "number") {
    gold.value = `$${rates.XAU.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} /oz`;
  }

  const coffee = getTickerItemById(data, "cafe");
  if (coffee && typeof rates.CA === "number") {
    coffee.value = `$${rates.CA.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} /lb`;
  }
}

function applySp500FromFmpQuote(data: TickerItem[], quote: FmpQuoteItem) {
  const item = getTickerItemById(data, "sp500");
  if (!item) {
    return;
  }

  let percentChange = toFiniteNumber(quote.changesPercentage);
  if (!Number.isFinite(percentChange)) {
    percentChange = toFiniteNumber(quote.change);
  }
  const price = toFiniteNumber(quote.price);

  item.value = formatIndexValue(price);
  item.change = formatSignedPercent(percentChange);
  item.changePositive = Number.isFinite(percentChange) ? percentChange >= 0 : undefined;
}

function parseFmpQuotePayload(data: unknown): FmpQuoteItem | undefined {
  const row = Array.isArray(data) ? data[0] : data;
  if (!row || typeof row !== "object") {
    return undefined;
  }
  const r = row as Record<string, unknown>;
  const priceRaw = r.price ?? r.previousClose ?? r.open ?? r.regularMarketPrice ?? r.close;
  const price = toFiniteNumber(priceRaw);
  if (!Number.isFinite(price)) {
    return undefined;
  }
  const pctRaw =
    r.changesPercentage ??
    r.changePercentage ??
    r.percentChange ??
    r.changesPercent ??
    r.changePercent;
  const changeRaw = r.change;

  return {
    symbol: typeof r.symbol === "string" ? r.symbol : undefined,
    price,
    changesPercentage: pctRaw as number | string | undefined,
    change: changeRaw as number | string | undefined,
  };
}

async function fetchFmpQuoteFlexible(symbol: string, apiKey: string): Promise<FmpQuoteItem> {
  const endpoints = ["quote", "quote-short"] as const;

  for (const ep of endpoints) {
    const url = `https://financialmodelingprep.com/stable/${ep}?symbol=${encodeURIComponent(symbol)}&apikey=${apiKey}`;
    const response = await fetch(url);

    if (!response.ok) {
      continue;
    }

    const payload = await response.json();
    const quote = parseFmpQuotePayload(payload);

    if (quote && Number.isFinite(Number(quote.price))) {
      return quote;
    }
  }

  throw new Error(`FMP: sin cotizacion util para ${symbol}`);
}

async function fetchTwelveDataQuote(symbol: string, apiKey: string): Promise<TwelveDataQuoteResponse> {
  const response = await fetch(
    `https://api.twelvedata.com/quote?symbol=${encodeURIComponent(symbol)}&apikey=${apiKey}`,
  );

  if (!response.ok) {
    throw new Error(`Twelve Data HTTP ${response.status} for symbol ${symbol}`);
  }

  const payload = (await response.json()) as TwelveDataQuoteResponse;

  if (payload.code || payload.status === "error") {
    throw new Error(payload.message || `Twelve Data error for symbol ${symbol}`);
  }

  return payload;
}

function applySp500FromTwelveData(data: TickerItem[], quote: TwelveDataQuoteResponse) {
  const item = getTickerItemById(data, "sp500");
  if (!item) {
    return;
  }

  const price = toFiniteNumber(quote.close);
  let pct = toFiniteNumber(quote.percent_change);
  if (!Number.isFinite(pct)) {
    pct = toFiniteNumber(quote.change);
  }

  item.value = formatIndexValue(price);
  item.change = formatSignedPercent(pct);
  item.changePositive = Number.isFinite(pct) ? pct >= 0 : undefined;
}

async function hydrateSp500(data: TickerItem[], opts: { fmpApiKey?: string; fmpSp500Symbol: string; twelveDataKey?: string; twelveSp500Symbol: string }) {
  const fmpSymbols = [...new Set([opts.fmpSp500Symbol, "^GSPC", "SPY"].filter(Boolean))];

  if (opts.fmpApiKey) {
    for (const sym of fmpSymbols) {
      try {
        const q = await fetchFmpQuoteFlexible(sym, opts.fmpApiKey);
        applySp500FromFmpQuote(data, q);
        return;
      } catch {
        /* siguiente simbolo */
      }
    }
    console.warn("S&P 500 FMP: ningun simbolo ni endpoint respondio.");
  }

  if (opts.twelveDataKey && opts.twelveSp500Symbol) {
    try {
      const q = await fetchTwelveDataQuote(opts.twelveSp500Symbol, opts.twelveDataKey);
      applySp500FromTwelveData(data, q);
    } catch (e) {
      console.warn("S&P 500 Twelve Data:", e);
    }
  }
}

const TICKER_CACHE_SECONDS = 120;

export const GET: APIRoute = async () => {
  const WEATHER_KEY = import.meta.env.OPENWEATHER_API_KEY;
  const EXCHANGE_KEY = import.meta.env.EXCHANGE_RATE_API_KEY;
  const FMP_API_KEY = import.meta.env.FMP_API_KEY;
  const FMP_SP500_SYMBOL = import.meta.env.FMP_SP500_SYMBOL || "^GSPC";
  const TWELVE_DATA_KEY = import.meta.env.TWELVE_DATA_KEY;
  const TWELVE_DATA_SP500_SYMBOL = import.meta.env.TWELVE_DATA_SP500_SYMBOL || "SPY";
  const COMMODITY_API_KEY = import.meta.env.COMMODITY_PRICE_API_KEY;

  try {
    const requests = await Promise.allSettled([
      WEATHER_KEY
        ? fetch(`https://api.openweathermap.org/data/2.5/weather?q=Bogota,co&units=metric&appid=${WEATHER_KEY}`)
        : Promise.reject(new Error("Falta OPENWEATHER_API_KEY")),
      EXCHANGE_KEY
        ? fetch(`https://v6.exchangerate-api.com/v6/${EXCHANGE_KEY}/latest/USD`)
        : Promise.reject(new Error("Falta EXCHANGE_RATE_API_KEY")),
      fetch("https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd&include_24hr_change=true"),
      COMMODITY_API_KEY
        ? fetchCommodityRates(COMMODITY_API_KEY, ["XAU", "CA"])
        : Promise.reject(new Error("Falta COMMODITY_PRICE_API_KEY")),
    ]);

    const [weatherResult, exchangeResult, btcResult, commodityResult] = requests;

    const data = defaultTickerData();

    await hydrateSp500(data, {
      fmpApiKey: FMP_API_KEY,
      fmpSp500Symbol: FMP_SP500_SYMBOL,
      twelveDataKey: TWELVE_DATA_KEY,
      twelveSp500Symbol: TWELVE_DATA_SP500_SYMBOL,
    });

    if (exchangeResult?.status === "fulfilled" && exchangeResult.value.ok) {
      const exchange = await exchangeResult.value.json();
      const usdCopValue = exchange?.conversion_rates?.COP;
      const item = getTickerItemById(data, "dolar");

      if (item) {
        item.value =
          typeof usdCopValue === "number" ? `$${usdCopValue.toLocaleString("es-CO")}` : "No disponible";
      }
    }

    if (weatherResult?.status === "fulfilled" && weatherResult.value.ok) {
      const weather = await weatherResult.value.json();
      const weatherTemp = weather?.main?.temp;
      const weatherDescription = weather?.weather?.[0]?.description;
      const item = getTickerItemById(data, "clima");

      if (item) {
        item.value = typeof weatherTemp === "number" ? `${Math.round(weatherTemp)}\u00B0C` : "No disponible";
        item.change = weatherDescription ?? "Sin datos";
        item.changePositive = undefined;
      }
    }

    if (btcResult?.status === "fulfilled" && btcResult.value.ok) {
      const btc = await btcResult.value.json();
      const btcUsd = btc?.bitcoin?.usd;
      const btcChange = btc?.bitcoin?.usd_24h_change;
      const item = getTickerItemById(data, "bitcoin");

      if (item) {
        item.value = typeof btcUsd === "number" ? `$${btcUsd.toLocaleString("en-US")} USD` : "No disponible";
        item.change = typeof btcChange === "number" ? `${Math.abs(btcChange).toFixed(2)}%` : "Sin datos";
        item.changePositive = typeof btcChange === "number" ? btcChange >= 0 : undefined;
      }
    }

    if (weatherResult?.status === "rejected") {
      console.error("Error consultando clima:", weatherResult.reason);
    }

    if (exchangeResult?.status === "rejected") {
      console.error("Error consultando USD/COP:", exchangeResult.reason);
    }

    if (btcResult?.status === "rejected") {
      console.error("Error consultando Bitcoin:", btcResult.reason);
    }

    if (commodityResult?.status === "fulfilled") {
      applyCommodityRates(data, commodityResult.value);
    } else if (commodityResult?.status === "rejected") {
      console.error("Error consultando CommodityPriceAPI (oro/café):", commodityResult.reason);
    }

    return new Response(JSON.stringify(data), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": `public, max-age=${TICKER_CACHE_SECONDS}, s-maxage=${TICKER_CACHE_SECONDS}`,
      },
    });
  } catch (error) {
    console.error("Error al obtener datos del ticker:", error);

    return new Response(JSON.stringify(defaultTickerData()), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": `public, max-age=60, s-maxage=60`,
      },
    });
  }
};
