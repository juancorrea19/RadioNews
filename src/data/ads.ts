export interface AdSlotConfig {
  label: string
  title: string
  description: string
  imageSrc?: string
  href?: string
  alt?: string
  cta?: string
}

export const adSlots = {
  indexTop: {
    label: 'Publicidad',
    title: 'Leaderboard principal',
    description: 'Espacio disponible para un banner horizontal destacado en la portada.',
    imageSrc: '',
    href: '',
    alt: 'Publicidad principal en portada',
    cta: 'Tu marca aquí',
  },
  indexMid: {
    label: 'Publicidad',
    title: 'Bloque promocional',
    description: 'Zona intermedia ideal para campañas de temporada, eventos o patrocinadores.',
    imageSrc: '',
    href: '',
    alt: 'Publicidad intermedia en portada',
    cta: 'Reservar espacio',
  },
  articleInline: {
    label: 'Publicidad',
    title: 'Banner dentro del artículo',
    description: 'Espacio reservado para anuncios que acompañan la lectura sin romper la estética.',
    imageSrc: '',
    href: '',
    alt: 'Publicidad dentro del artículo',
    cta: 'Anúnciate aquí',
  },
  articleSidebar: {
    label: 'Patrocinado',
    title: 'Espacio lateral',
    description: 'Perfecto para un anuncio vertical o una pieza de patrocinio permanente.',
    imageSrc: '',
    href: '',
    alt: 'Publicidad lateral del artículo',
    cta: 'Disponible',
  },
} satisfies Record<string, AdSlotConfig>
