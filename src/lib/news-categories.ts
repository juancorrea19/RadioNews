export const NEWS_CATEGORY_META = {
  "ultima-hora": {
    title: "Ultima hora",
    accentColor: "#a62b2b",
  },
  "lo-ultimo": {
    title: "Lo ultimo",
    accentColor: "#a62b2b",
  },
  judicial: {
    title: "Judicial",
    accentColor: "#a62b2b",
  },
  actualidad: {
    title: "Actualidad",
    accentColor: "#a62b2b",
  },
  internacional: {
    title: "Internacional",
    accentColor: "#a62b2b",
  },
  nacion: {
    title: "Nacion",
    accentColor: "#a62b2b",
  },
  entretenimiento: {
    title: "Entretenimiento",
    accentColor: "#a62b2b",
  },
  "magazine-cultural": {
    title: "Magazine Cultural",
    accentColor: "#a62b2b",
  },
  deportes: {
    title: "Deportes",
    accentColor: "#a62b2b",
  },
  economia: {
    title: "Economia",
    accentColor: "#a62b2b",
  },
  ciencia: {
    title: "Ciencia",
    accentColor: "#a62b2b",
  },
} as const;

export type NewsCategorySlug = keyof typeof NEWS_CATEGORY_META;

export const NEWS_CATEGORY_ORDER = Object.keys(NEWS_CATEGORY_META) as NewsCategorySlug[];

export const NEWS_CATEGORY_OPTIONS = NEWS_CATEGORY_ORDER.map((slug) => ({
  slug,
  title: NEWS_CATEGORY_META[slug].title,
}));
