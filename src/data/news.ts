import type { ImageMetadata } from 'astro'

import carta1 from '../../assets/carta1.webp'
import carta2 from '../../assets/carta2.webp'
import carta3 from '../../assets/carta3.webp'

export type CoverMediaType = 'image' | 'video'

export interface NewsItem {
  id: string
  slug: string
  href: string
  image: string | ImageMetadata
  coverMediaType?: CoverMediaType
  videoUrl?: string
  category: string
  categorySlug: string
  timeAgo: string
  headline: string
  excerpt?: string
  content: string[]
}

export interface CategoryData {
  title: string
  slug: string
  accentColor: string
  news: NewsItem[]
}

interface RawNewsItem {
  id: string
  image: string | ImageMetadata
  category: string
  timeAgo: string
  headline: string
  excerpt?: string
  content?: string[]
}

interface RawCategoryData {
  title: string
  slug: string
  accentColor: string
  news: RawNewsItem[]
}

export const CATEGORY_COLORS: Record<string, string> = {
  'ultima-hora': '#a62b2b',
  'lo-ultimo': '#a62b2b',
  judicial: '#a62b2b',
  actualidad: '#a62b2b',
  internacional: '#a62b2b',
  nacion: '#a62b2b',
  entretenimiento: '#a62b2b',
  'magazine-cultural': '#a62b2b',
  deportes: '#a62b2b',
  economia: '#a62b2b',
  ciencia: '#a62b2b',
}

function slugify(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

function buildContent(item: RawNewsItem, categoryTitle: string): string[] {
  const intro =
    item.excerpt ??
    `${item.headline} se mantiene entre los temas más consultados por la audiencia de ${categoryTitle}.`

  return [
    `${intro} Esta nota amplía el contexto de los hechos, reúne los puntos clave y ordena la información principal para que el lector pueda entender rápidamente qué está ocurriendo.`,
    `La cobertura de ${categoryTitle.toLowerCase()} sigue abierta y, por ahora, el foco está en cómo evoluciona la noticia, cuáles son sus antecedentes inmediatos y qué reacciones empieza a generar entre los actores involucrados.`,
    `Desde Radio News Online seguimos este desarrollo para sumar nuevas voces, datos confirmados y piezas relacionadas que permitan leer la noticia con mayor profundidad y conectarla con el resto de la agenda informativa.`,
  ]
}

function toNewsItem(item: RawNewsItem, category: RawCategoryData, index: number): NewsItem {
  const slugBase = slugify(item.headline) || `${item.id}-${index + 1}`
  const slug = `${slugBase}-${index + 1}`

  return {
    ...item,
    slug,
    href: `/noticia/${category.slug}/${slug}/`,
    categorySlug: category.slug,
    content: item.content ?? buildContent(item, category.title),
  }
}

function uniqueByHeadline(items: NewsItem[]): NewsItem[] {
  const seen = new Set<string>()

  return items.filter((item) => {
    const key = `${item.categorySlug}:${item.headline}`
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}

const rawCategoriesData: RawCategoryData[] = [
  {
    title: 'Última hora',
    slug: 'ultima-hora',
    accentColor: CATEGORY_COLORS['ultima-hora'],
    news: [
      {
        id: 'uh1',
        image: carta1,
        category: 'Última hora',
        timeAgo: '10m',
        headline: 'Noticia de última hora ejemplo 1',
        excerpt:
          'Este domingo 22 de marzo se conoció la encuesta del CNC: Cepeda 34,5 %, Paloma 22,2 %, De la Espriella 15,4 %',
      },
      { id: 'uh2', image: carta2, category: 'Última hora', timeAgo: '25m', headline: 'Noticia de última hora ejemplo 2' },
      { id: 'uh3', image: carta3, category: 'Última hora', timeAgo: '1h', headline: 'Noticia de última hora ejemplo 3' },
      { id: 'uh1', image: carta1, category: 'Última hora', timeAgo: '10m', headline: 'Noticia de última hora ejemplo 1' },
      { id: 'uh2', image: carta2, category: 'Última hora', timeAgo: '25m', headline: 'Noticia de última hora ejemplo 2' },
      { id: 'uh3', image: carta3, category: 'Última hora', timeAgo: '1h', headline: 'Noticia de última hora ejemplo 3' },
    ],
  },
  {
    title: 'Lo ultimo',
    slug: 'lo-ultimo',
    accentColor: CATEGORY_COLORS['lo-ultimo'],
    news: [
      {
        id: 'lu1',
        image: carta1,
        category: 'Lo ultimo',
        timeAgo: '15m',
        headline: 'Lo ultimo en la agenda informativa del dia',
      },
      {
        id: 'lu2',
        image: carta2,
        category: 'Lo ultimo',
        timeAgo: '40m',
        headline: 'Resumen de los hechos mas recientes',
      },
    ],
  },
  {
    title: 'Judicial',
    slug: 'judicial',
    accentColor: CATEGORY_COLORS.judicial,
    news: [
      {
        id: 'jud1',
        image: carta2,
        category: 'Judicial',
        timeAgo: '1h',
        headline: 'Avances en investigaciones y decisiones de tribunales',
      },
      {
        id: 'jud2',
        image: carta3,
        category: 'Judicial',
        timeAgo: '3h',
        headline: 'Cobertura judicial de casos de impacto nacional',
      },
    ],
  },
  {
    title: 'Actualidad',
    slug: 'actualidad',
    accentColor: CATEGORY_COLORS.actualidad,
    news: [
      {
        id: 'act1',
        image: carta1,
        category: 'Actualidad',
        timeAgo: '20m',
        headline: 'Temas que marcan la conversacion publica hoy',
      },
      {
        id: 'act2',
        image: carta3,
        category: 'Actualidad',
        timeAgo: '2h',
        headline: 'Panorama de actualidad en Colombia y la region',
      },
    ],
  },
  {
    title: 'Internacional',
    slug: 'internacional',
    accentColor: CATEGORY_COLORS.internacional,
    news: [
      { id: 'int1', image: carta1, category: 'Internacional', timeAgo: '2h', headline: 'Noticias del mundo ejemplo' },
      { id: 'int2', image: carta2, category: 'Internacional', timeAgo: '4h', headline: 'Actualidad internacional' },
      { id: 'int1', image: carta1, category: 'Internacional', timeAgo: '2h', headline: 'Noticias del mundo ejemplo' },
      { id: 'int2', image: carta2, category: 'Internacional', timeAgo: '4h', headline: 'Actualidad internacional' },
      { id: 'int1', image: carta1, category: 'Internacional', timeAgo: '2h', headline: 'Noticias del mundo ejemplo' },
      { id: 'int2', image: carta2, category: 'Internacional', timeAgo: '4h', headline: 'Actualidad internacional' },
      { id: 'int1', image: carta1, category: 'Internacional', timeAgo: '2h', headline: 'Noticias del mundo ejemplo' },
      { id: 'int2', image: carta2, category: 'Internacional', timeAgo: '4h', headline: 'Actualidad internacional' },
    ],
  },
  {
    title: 'Nación',
    slug: 'nacion',
    accentColor: CATEGORY_COLORS.nacion,
    news: [
      { id: 'nac1', image: carta1, category: 'Nación', timeAgo: '1h', headline: 'Noticias nacionales ejemplo' },
      { id: 'nac2', image: carta2, category: 'Nación', timeAgo: '3h', headline: 'Política nacional actual' },
      { id: 'nac3', image: carta3, category: 'Nación', timeAgo: '5h', headline: 'Economía del país' },
      { id: 'nac1', image: carta1, category: 'Nación', timeAgo: '1h', headline: 'Noticias nacionales ejemplo' },
      { id: 'nac2', image: carta2, category: 'Nación', timeAgo: '3h', headline: 'Política nacional actual' },
      { id: 'nac3', image: carta3, category: 'Nación', timeAgo: '5h', headline: 'Economía del país' },
    ],
  },
  {
    title: 'Entretenimiento',
    slug: 'entretenimiento',
    accentColor: CATEGORY_COLORS.entretenimiento,
    news: [
      {
        id: 'ent1',
        image: carta1,
        category: 'Entretenimiento',
        timeAgo: '30m',
        headline: 'Farándula y espectáculos',
        excerpt:
          'Artistas, producciones y estrenos vuelven a dominar la conversación del día en la agenda cultural.',
      },
      { id: 'ent2', image: carta2, category: 'Entretenimiento', timeAgo: '2h', headline: 'Música y cine actual' },
      { id: 'ent1', image: carta1, category: 'Entretenimiento', timeAgo: '30m', headline: 'Farándula y espectáculos' },
      { id: 'ent2', image: carta2, category: 'Entretenimiento', timeAgo: '2h', headline: 'Música y cine actual' },
      { id: 'ent1', image: carta1, category: 'Entretenimiento', timeAgo: '30m', headline: 'Farándula y espectáculos' },
      { id: 'ent2', image: carta2, category: 'Entretenimiento', timeAgo: '2h', headline: 'Música y cine actual' },
    ],
  },
  {
    title: 'Magazine Cultural',
    slug: 'magazine-cultural',
    accentColor: CATEGORY_COLORS['magazine-cultural'],
    news: [
      { id: 'mag1', image: carta1, category: 'Cultura', timeAgo: '1d', headline: 'Arte y cultura en la ciudad' },
      { id: 'mag2', image: carta2, category: 'Cultura', timeAgo: '2d', headline: 'Eventos culturales del mes' },
      { id: 'mag1', image: carta1, category: 'Cultura', timeAgo: '1d', headline: 'Arte y cultura en la ciudad' },
      { id: 'mag2', image: carta2, category: 'Cultura', timeAgo: '2d', headline: 'Eventos culturales del mes' },
      { id: 'mag1', image: carta1, category: 'Cultura', timeAgo: '1d', headline: 'Arte y cultura en la ciudad' },
      { id: 'mag2', image: carta2, category: 'Cultura', timeAgo: '2d', headline: 'Eventos culturales del mes' },
      { id: 'mag1', image: carta1, category: 'Cultura', timeAgo: '1d', headline: 'Arte y cultura en la ciudad' },
      { id: 'mag2', image: carta2, category: 'Cultura', timeAgo: '2d', headline: 'Eventos culturales del mes' },
      { id: 'mag2', image: carta2, category: 'Cultura', timeAgo: '2d', headline: 'Eventos culturales del mes' },
      { id: 'mag2', image: carta2, category: 'Cultura', timeAgo: '2d', headline: 'Eventos culturales del mes' },
      { id: 'mag2', image: carta2, category: 'Cultura', timeAgo: '2d', headline: 'Eventos culturales del mes' },
      { id: 'mag2', image: carta2, category: 'Cultura', timeAgo: '2d', headline: 'Eventos culturales del mes' },
      { id: 'mag2', image: carta2, category: 'Cultura', timeAgo: '2d', headline: 'Eventos culturales del mes' },
      { id: 'mag2', image: carta2, category: 'Cultura', timeAgo: '2d', headline: 'Eventos culturales del mes' },
      { id: 'mag2', image: carta2, category: 'Cultura', timeAgo: '2d', headline: 'Eventos culturales del mes' },
      { id: 'mag2', image: carta2, category: 'Cultura', timeAgo: '2d', headline: 'Eventos culturales del mes' },
      { id: 'mag2', image: carta2, category: 'Cultura', timeAgo: '2d', headline: 'Eventos culturales del mes' },
      { id: 'mag2', image: carta2, category: 'Cultura', timeAgo: '2d', headline: 'Eventos culturales del mes' },
      { id: 'mag2', image: carta2, category: 'Cultura', timeAgo: '2d', headline: 'Eventos culturales del mes' },
      { id: 'mag2', image: carta2, category: 'Cultura', timeAgo: '2d', headline: 'Eventos culturales del mes' },
    ],
  },
  {
    title: 'Deportes',
    slug: 'deportes',
    accentColor: CATEGORY_COLORS.deportes,
    news: [
      { id: 'dep1', image: carta1, category: 'Deportes', timeAgo: '45m', headline: 'Fútbol colombiano actualidad' },
      { id: 'dep2', image: carta2, category: 'Deportes', timeAgo: '1h', headline: 'Liga BetPlay últimos resultados' },
      { id: 'dep3', image: carta3, category: 'Deportes', timeAgo: '3h', headline: 'Ciclismo internacional' },
      { id: 'dep1', image: carta1, category: 'Deportes', timeAgo: '45m', headline: 'Fútbol colombiano actualidad' },
      { id: 'dep2', image: carta2, category: 'Deportes', timeAgo: '1h', headline: 'Liga BetPlay últimos resultados' },
      { id: 'dep3', image: carta3, category: 'Deportes', timeAgo: '3h', headline: 'Ciclismo internacional' },
      { id: 'dep1', image: carta1, category: 'Deportes', timeAgo: '45m', headline: 'Fútbol colombiano actualidad' },
      { id: 'dep2', image: carta2, category: 'Deportes', timeAgo: '1h', headline: 'Liga BetPlay últimos resultados' },
      { id: 'dep3', image: carta3, category: 'Deportes', timeAgo: '3h', headline: 'Ciclismo internacional' },
    ],
  },
]

export const categoriesData: CategoryData[] = rawCategoriesData.map((category) => ({
  ...category,
  news: category.news.map((item, index) => toNewsItem(item, category, index)),
}))

export const allNews: NewsItem[] = categoriesData.flatMap((category) => category.news)

export function getCategoryBySlug(categorySlug: string): CategoryData | undefined {
  return categoriesData.find((category) => category.slug === categorySlug)
}

export function findNewsItem(categorySlug: string, articleSlug: string): NewsItem | undefined {
  return allNews.find((item) => item.categorySlug === categorySlug && item.slug === articleSlug)
}

export function getRelatedNews(categorySlug: string, currentSlug: string, limit = 4): NewsItem[] {
  const category = getCategoryBySlug(categorySlug)
  if (!category) return []

  return uniqueByHeadline(category.news.filter((item) => item.slug !== currentSlug)).slice(0, limit)
}

export function getCrossCategoryNews(categorySlug: string, currentSlug: string, limit = 6): NewsItem[] {
  return uniqueByHeadline(
    allNews.filter((item) => item.categorySlug !== categorySlug && item.slug !== currentSlug),
  ).slice(0, limit)
}
