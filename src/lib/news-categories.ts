export const NEWS_CATEGORY_META = {
  "ultima-hora": {
    title: "Última hora",
    accentColor: "#e30713",
  },
  "lo-ultimo": {
    title: "Lo último",
    accentColor: "#e30713",
  },
  judicial: {
    title: "Judicial",
    accentColor: "#e30713",
  },
  actualidad: {
    title: "Actualidad",
    accentColor: "#e30713",
  },
  internacional: {
    title: "Internacional",
    accentColor: "#e30713",
  },
  nacion: {
    title: "Nación",
    accentColor: "#e30713",
  },
  entretenimiento: {
    title: "Entretenimiento",
    accentColor: "#e30713",
  },
  "magazine-cultural": {
    title: "Magazine Cultural",
    accentColor: "#e30713",
  },
  deportes: {
    title: "Deportes",
    accentColor: "#e30713",
  },
  economia: {
    title: "Economia",
    accentColor: "#e30713",
  },
  ciencia: {
    title: "Ciencia",
    accentColor: "#e30713",
  },
} as const;

export type NewsCategorySlug = keyof typeof NEWS_CATEGORY_META;

export const NEWS_CATEGORY_ORDER = Object.keys(NEWS_CATEGORY_META) as NewsCategorySlug[];

export const NEWS_CATEGORY_OPTIONS = NEWS_CATEGORY_ORDER.map((slug) => ({
  slug,
  title: NEWS_CATEGORY_META[slug].title,
}));
