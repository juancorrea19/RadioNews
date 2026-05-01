import type { APIRoute } from "astro";

interface TickerItem {
  id: string;
  label: string;
  value: string;
  change?: string;
  changePositive?: boolean;
  icon: string;
}

const defaultTickerData = (): TickerItem[] => [
  {
    id: "dolar",
    label: "USD/COP",
    value: "No disponible",
    icon: "\u{1F4B5}",
  },
  {
    id: "clima",
    label: "Bogota",
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
];

export const GET: APIRoute = async () => {
  const WEATHER_KEY = import.meta.env.OPENWEATHER_API_KEY;
  const EXCHANGE_KEY = import.meta.env.EXCHANGE_RATE_API_KEY;

  if (!WEATHER_KEY || !EXCHANGE_KEY) {
    return new Response(JSON.stringify(defaultTickerData()), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-store",
      },
    });
  }

  try {
    const [weatherRes, exchangeRes, btcRes] = await Promise.all([
      fetch(`https://api.openweathermap.org/data/2.5/weather?q=Bogota,co&units=metric&appid=${WEATHER_KEY}`),
      fetch(`https://v6.exchangerate-api.com/v6/${EXCHANGE_KEY}/latest/USD`),
      fetch("https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd&include_24hr_change=true"),
    ]);

    if (!weatherRes.ok || !exchangeRes.ok || !btcRes.ok) {
      throw new Error(
        `Ticker upstream failed: weather=${weatherRes.status}, exchange=${exchangeRes.status}, btc=${btcRes.status}`,
      );
    }

    const weather = await weatherRes.json();
    const exchange = await exchangeRes.json();
    const btc = await btcRes.json();

    const usdCopValue = exchange?.conversion_rates?.COP;
    const weatherTemp = weather?.main?.temp;
    const weatherDescription = weather?.weather?.[0]?.description;
    const btcUsd = btc?.bitcoin?.usd;
    const btcChange = btc?.bitcoin?.usd_24h_change;

    const data: TickerItem[] = [
      {
        id: "dolar",
        label: "USD/COP",
        value: typeof usdCopValue === "number" ? `$${usdCopValue.toLocaleString("es-CO")}` : "No disponible",
        icon: "\u{1F4B5}",
      },
      {
        id: "clima",
        label: "Bogota",
        value: typeof weatherTemp === "number" ? `${Math.round(weatherTemp)}\u00B0C` : "No disponible",
        change: weatherDescription ?? "Sin datos",
        icon: "\u2600\uFE0F",
      },
      {
        id: "bitcoin",
        label: "Bitcoin",
        value: typeof btcUsd === "number" ? `$${btcUsd.toLocaleString("en-US")} USD` : "No disponible",
        change: typeof btcChange === "number" ? `${btcChange.toFixed(2)}%` : "Sin datos",
        changePositive: typeof btcChange === "number" ? btcChange > 0 : undefined,
        icon: "\u20BF",
      },
    ];

    return new Response(JSON.stringify(data), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error("Error al obtener datos del ticker:", error);

    return new Response(JSON.stringify(defaultTickerData()), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-store",
      },
    });
  }
};
