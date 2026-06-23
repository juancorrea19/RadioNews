import React, { useEffect, useRef, useState } from 'react'
import Logo from '../assets/background.svg'
import type { NewsItem } from '../data/news'
import {
  COVER_BANNER_FRAME,
  COVER_BANNER_SPOTLIGHT_FRAME,
  COVER_SPOTLIGHT_GRID_FRAME,
  COVER_CARD_FRAME,
  COVER_HERO_FRAME,
  COVER_IMG_CLASS,
  COVER_MAGAZINE_FRAME,
  COVER_THUMB_FRAME,
} from '../lib/cover-frames'

interface CategorySectionProps {
  title: string
  news: NewsItem[]
  accentColor?: string
  layoutIndex?: number
  slug?: string
}

function imgSrc(image: NewsItem['image']): string {
  return typeof image === 'string' ? image : image.src
}

function VideoBadge() {
  return (
    <span className="absolute inset-0 flex items-center justify-center bg-[#041d3d]/40">
      <span className="rounded-full bg-white/95 px-3 py-1 text-[9px] font-bold uppercase tracking-[0.2em] text-[#041d3d]">
        Video
      </span>
    </span>
  )
}

function ArticleLink({
  item,
  className = '',
  children,
}: React.PropsWithChildren<{ item: NewsItem; className?: string }>) {
  return (
    <a href={item.href} className={className}>
      {children}
    </a>
  )
}

function CardHorizontal({ item }: { item: NewsItem }) {
  return (
    <ArticleLink item={item} className="block">
      <article className="group flex gap-3 items-start py-3 border-b border-gray-100 last:border-0 cursor-pointer">
        <div className={COVER_THUMB_FRAME}>
          <img
            src={imgSrc(item.image)}
            alt={item.headline}
            loading="lazy"
            decoding="async"
            className={`${COVER_IMG_CLASS} transition-transform duration-500 group-hover:scale-110`}
          />
          {item.coverMediaType === 'video' && <VideoBadge />}
          <img src={Logo.src} alt="Radio News" className="absolute top-1 right-1 w-7 h-7 object-contain" />
        </div>
        <div className="flex flex-col gap-1 min-w-0">
          <span className="rounded-full bg-[#a62b2b]/90 px-3 py-1 text-[8px] uppercase tracking-[0.18em] text-white w-fit">{item.category}</span>
          <h3 className="text-[13px] font-newsreader font-semibold text-slate-900 leading-snug line-clamp-2 group-hover:text-[#a62b2b] transition-colors">
            {item.headline}
          </h3>
          <span className="text-[15px] text-gray-600">{item.timeAgo}</span>
        </div>
      </article>
    </ArticleLink>
  )
}

function CardVertical({
  item,
  large = false,
  compact = false,
}: {
  item: NewsItem
  large?: boolean
  compact?: boolean
}) {
  const imageFrame = large
    ? COVER_HERO_FRAME
    : compact
      ? COVER_SPOTLIGHT_GRID_FRAME
      : COVER_CARD_FRAME

  return (
    <ArticleLink item={item} className="block h-full">
      <article className="group flex flex-col cursor-pointer h-full rounded-xl overflow-hidden bg-[#f2f2f2] shadow-lg hover:shadow-xl transition-shadow duration-300">
        <div className={imageFrame}>
          <img
            src={imgSrc(item.image)}
            alt={item.headline}
            loading="lazy"
            decoding="async"
            className={`${COVER_IMG_CLASS} transition-transform duration-700 group-hover:scale-105`}
          />
          {item.coverMediaType === 'video' && <VideoBadge />}
          <img
            src={Logo.src}
            alt="Radio News"
            className={`absolute top-2 right-2 object-contain ${compact ? 'w-6 h-6' : 'w-10 h-10'}`}
          />
        </div>
        <div className={`flex flex-col gap-1 shrink-0 ${compact ? 'p-2' : 'p-4'}`}>
          <div className="flex items-center gap-2 min-w-0">
            <span className="rounded-full bg-[#a62b2b]/90 px-2 py-0.5 text-[7px] uppercase tracking-[0.18em] text-white w-fit truncate">
              {item.category}
            </span>
            {!compact && (
              <>
                <span className="text-[10px] text-gray-300">·</span>
                <span className="text-[15px] text-gray-600">{item.timeAgo}</span>
              </>
            )}
          </div>
          <h3
            className={`font-newsreader font-bold text-slate-900 leading-tight group-hover:text-[#a62b2b] transition-colors ${
              large ? 'text-[18px] md:text-[22px]' : compact ? 'text-[12px] line-clamp-2' : 'text-[14px]'
            }`}
          >
            {item.headline}
          </h3>
          {large && item.excerpt && (
            <p className="text-[16px] md:text-[20px] font-newsreader leading-relaxed mt-2 line-clamp-3 text-slate-800">
              {item.excerpt}
            </p>
          )}
          {compact && <span className="text-[11px] text-gray-600">{item.timeAgo}</span>}
        </div>
      </article>
    </ArticleLink>
  )
}

function CardOverlay({
  item,
  accent,
  className = COVER_BANNER_FRAME,
}: {
  item: NewsItem
  accent: string
  className?: string
}) {
  return (
    <ArticleLink item={item} className="block h-full">
      <article className={`group cursor-pointer rounded-xl bg-slate-900 h-full ${className}`}>
        <img
          src={imgSrc(item.image)}
          alt={item.headline}
          loading="lazy"
          decoding="async"
          className={`${COVER_IMG_CLASS} transition-transform duration-700 group-hover:scale-105`}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-4 flex flex-col gap-1">
          <span className="rounded-full bg-[#a62b2b]/90 px-3 py-1 text-[10px] uppercase tracking-[0.18em] text-white w-fit">{item.category}</span>
          <h3 className="font-newsreader font-bold text-white leading-snug text-[18px] md:text-[17px]">
            {item.headline}
          </h3>
          <span className="text-[15px] text-white">{item.timeAgo}</span>
        </div>
      </article>
    </ArticleLink>
  )
}

function LayoutEditorial({ news }: { news: NewsItem[]; accent: string }) {
  const [hero, ...rest] = news
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div className="md:col-span-2">{hero && <CardVertical item={hero} large />}</div>
      <div className="flex flex-col border-l border-white/10 pl-6 bg-[#f2f2f2] rounded-xl p-4">
        {rest.slice(0, 4).map((item) => (
          <CardHorizontal key={item.slug} item={item} />
        ))}
      </div>
    </div>
  )
}

const MAGAZINE_FRAME_CLASS = COVER_MAGAZINE_FRAME

function LayoutMagazine({ news, accent }: { news: NewsItem[]; accent: string }) {
  if (!news.length) return null

  const editionSize = 4
  const total = Math.ceil(news.length / editionSize)
  const [current, setCurrent] = useState(0)
  const autoRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const pausedRef = useRef(false)

  const editions: NewsItem[][] = Array.from({ length: total }, (_, index) =>
    news.slice(index * editionSize, index * editionSize + editionSize),
  )

  const goTo = (nextIndex: number) => setCurrent((nextIndex + total) % total)

  useEffect(() => {
    if (total <= 1) return

    const tick = () => {
      if (!pausedRef.current) setCurrent((value) => (value + 1) % total)
    }

    autoRef.current = setInterval(tick, 5500)
    return () => {
      if (autoRef.current) clearInterval(autoRef.current)
    }
  }, [total])

  const edition = editions[current] ?? []
  const cover = edition[0]
  const lead = edition[1]
  const side1 = edition[2]
  const side2 = edition[3]
  const tickerItems = [...news, ...news]

  return (
    <div
      className="w-full"
      onMouseEnter={() => {
        pausedRef.current = true
      }}
      onMouseLeave={() => {
        pausedRef.current = false
      }}
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1 rounded-sm" style={{ background: accent, color: '#fff' }}>
            <span className="text-[9px] uppercase tracking-[0.2em] font-bold">Edición</span>
            <span className="text-[13px] font-newsreader font-bold">{String(current + 1).padStart(2, '0')}</span>
          </div>
          <div className="flex items-center gap-1">
            {editions.map((_, index) => (
              <button
                key={index}
                onClick={() => goTo(index)}
                aria-label={`Edición ${index + 1}`}
                style={{
                  width: index === current ? 18 : 5,
                  height: 5,
                  borderRadius: 99,
                  background: index === current ? accent : `${accent}35`,
                  border: 'none',
                  padding: 0,
                  cursor: 'pointer',
                  transition: 'width 0.35s ease, background 0.35s ease',
                  flexShrink: 0,
                }}
              />
            ))}
          </div>
        </div>

        <div className="flex gap-1">
          {([
            ['‹', -1],
            ['›', 1],
          ] as const).map(([label, direction]) => (
            <button
              key={direction}
              onClick={() => goTo(current + direction)}
              style={{
                width: 32,
                height: 32,
                borderRadius: 4,
                background:accent,  
                border: `2px solid ${accent}50`,
                color: 'white',
                cursor: 'pointer',
                fontSize: 22,
                lineHeight: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontFamily: 'Georgia, serif',
              }}             
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div
        className={`grid grid-cols-1 md:grid-cols-12 rounded-xl overflow-hidden ${MAGAZINE_FRAME_CLASS}`}
        style={{
          border: `1px solid ${accent}25`,
        }}
      >
        <div className="md:col-span-5 relative aspect-video md:aspect-auto md:h-full min-h-[200px] overflow-hidden">
          {cover ? (
            <ArticleLink item={cover} className="group absolute inset-0 block">
              <img src={imgSrc(cover.image)} alt={cover.headline} loading="lazy" decoding="async" className={COVER_IMG_CLASS} />
              <div
                className="absolute inset-0"
                style={{
                  background:
                    'linear-gradient(to top, rgba(0,0,0,0.95) 0%, rgba(0,0,0,0.38) 52%, rgba(0,0,0,0.04) 100%)',
                }}
              />
              <div className="absolute top-0 left-0 right-0 flex items-center justify-between px-4 pt-4">
                <span
                  className="text-[8px] uppercase tracking-[0.25em] font-bold px-2 py-1 rounded-sm"
                  style={{ background: accent, color: '#fff' }}
                >
                  {cover.category}
                </span>
                <span className="text-[10px] text-white font-newsreader italic">{cover.timeAgo}</span>
              </div>
              <div className="absolute bottom-0 left-0 right-0 p-5">
                <div className="w-8 h-[2px] mb-3 rounded-full" style={{ background: accent }} />
                <h2
                  className="font-newsreader font-bold text-white leading-tight mb-2"
                  style={{ fontSize: 'clamp(17px, 2.2vw, 24px)' }}
                >
                  {cover.headline}
                </h2>
                {cover.excerpt && (
                  <p className="text-white font-newsreader text-[13px] leading-relaxed line-clamp-2">{cover.excerpt}</p>
                )}
                <div className="mt-3 flex items-center gap-2">
                  <span className="text-[10px] uppercase tracking-widest font-bold" style={{ color: accent }}>
                    Leer nota completa
                  </span>
                  <span style={{ color: accent }}>→</span>
                </div>
              </div>
            </ArticleLink>
          ) : (
            <div className="w-full h-full" style={{ background: 'rgba(255,255,255,0.03)' }} />
          )}
        </div>

        <div
          className="md:col-span-4 flex flex-col overflow-hidden md:h-full min-h-0"
          style={{
            borderLeft: `1px solid ${accent}20`,
            borderRight: `1px solid ${accent}20`,
          }}
        >
          <div className="relative shrink-0 overflow-hidden aspect-video md:flex-[1.15] md:min-h-0 md:aspect-auto">
            {lead ? (
              <ArticleLink item={lead} className="group block w-full h-full cursor-pointer">
                <img
                  src={imgSrc(lead.image)}
                  alt={lead.headline}
                  loading="lazy"
                  decoding="async"
                  className={`${COVER_IMG_CLASS} transition-transform duration-700 group-hover:scale-105`}
                />
                <div
                  className="absolute inset-0"
                  style={{
                    background:
                      'linear-gradient(to top, rgba(0,0,0,0.88) 0%, rgba(0,0,0,0.18) 60%, transparent 100%)',
                  }}
                />
                <div className="absolute bottom-0 left-0 right-0 p-4">
                <span
                  className="text-[8px] uppercase tracking-[0.25em] font-bold px-2 py-1 rounded-sm"
                  style={{ background: accent, color: '#fff' }}>
                    {lead.category}
                  </span>
                  <h3
                    className="font-newsreader font-bold text-white leading-snug mt-1 line-clamp-3"
                    style={{ fontSize: 'clamp(25px, 1.6vw, 17px)' }}
                  >
                    {lead.headline}
                  </h3>
                </div>
              </ArticleLink>
            ) : (
              <div className="w-full h-full" style={{ background: 'rgba(255,255,255,0.04)' }} />
            )}
          </div>

          <div
            className="px-4 py-2 flex items-center gap-2 shrink-0"
            style={{ background: `${accent}20`, borderTop: `1px solid ${accent}20`, borderBottom: `1px solid ${accent}40` }}
          >
            <div className="w-1 h-3 rounded-full shrink-0" style={{ background: accent }} />
            <span className="text-[15px] uppercase tracking-[0.18em] font-bold text-white">También en esta edición</span>
          </div>

          <div className="flex flex-col overflow-hidden" style={{ flex: 1 }}>
            {[side1, side2].map((item, index) => (
              <div
                key={item?.slug ?? index}
                className="flex-1 overflow-hidden"
                style={{ borderBottom: index === 0 ? `1px solid ${accent}12` : 'none' }}
              >
                {item ? (
                  <ArticleLink item={item} className="group flex gap-3 px-4 py-3 cursor-pointer transition-colors duration-150 hover:bg-white/10 h-full">
                    <div className={`${COVER_THUMB_FRAME} rounded-md self-center`}>
                      <img
                        src={imgSrc(item.image)}
                        alt={item.headline}
                        loading="lazy"
                        decoding="async"
                        className={`${COVER_IMG_CLASS} transition-transform duration-500 group-hover:scale-110`}
                      />
                    </div>
                    <div className="flex flex-col gap-0.5 min-w-0 justify-center">
                      <span  className="text-[8px] uppercase tracking-[0.25em] font-bold px-2 py-1 rounded-sm w-fit"
                  style={{ background: accent, color: '#fff' }}>
                        {item.category}
                      </span>
                      <h4 className="text-[16px] font-newsreader font-semibold text-white leading-snug line-clamp-2 group-hover:text-white transition-colors">
                        {item.headline}
                      </h4>
                      <span className="text-[12px] text-white">{item.timeAgo}</span>
                    </div>
                  </ArticleLink>
                ) : (
                  <div className="h-full" style={{ background: 'rgba(255,255,255,0.02)' }} />
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="md:col-span-3 flex flex-col overflow-hidden md:h-full min-h-0" style={{ background: 'rgba(255,255,255,0.025)' }}>
          <div className="px-4 py-3 shrink-0 flex items-center justify-between" style={{ borderBottom: `1px solid ${accent}20` }}>
            <span className="text-[9px] uppercase tracking-[0.25em] font-bold" style={{ color: accent }}>
              Índice
            </span>
            <span className="text-[9px] text-white uppercase tracking-widest">
              {current + 1}/{total}
            </span>
          </div>

          <div className="flex flex-col flex-1 overflow-hidden">
            {Array.from({ length: 4 }).map((_, index) => {
              const item = edition[index]

              return item ? (
                <ArticleLink
                  key={item.slug}
                  item={item}
                  className="flex-1 overflow-hidden group cursor-pointer transition-colors duration-150 hover:bg-white/5"
                >
                  <div
                    style={{
                      borderBottom: index < 3 ? `1px solid ${accent}10` : 'none',
                      display: 'flex',
                      alignItems: 'flex-start',
                      padding: '10px 16px',
                      gap: 10,
                      height: '100%',
                    }}
                  >
                    <span
                      style={{
                        fontFamily: 'Georgia, serif',
                        fontWeight: 700,
                        fontSize: 18,
                        lineHeight: 1,
                        color: `${accent}45`,
                        flexShrink: 0,
                        marginTop: 2,
                        minWidth: 26,
                      }}
                    >
                      {String(index + 1).padStart(2, '0')}
                    </span>
                    <div className="flex flex-col gap-0.5 overflow-hidden">
                      <span className="text-[8px] uppercase tracking-[0.25em] font-bold px-2 py-1 rounded-sm w-fit"
                  style={{ background: accent, color: '#fff' }}>
                        {item.category}
                      </span>
                      <h4 className="text-[18px] font-newsreader text-white leading-snug line-clamp-3 group-hover:text-white transition-colors">
                        {item.headline}
                      </h4>
                    </div>
                  </div>
                </ArticleLink>
              ) : (
                <div
                  key={`empty-${index}`}
                  className="flex-1 overflow-hidden"
                  style={{ borderBottom: index < 3 ? `1px solid ${accent}10` : 'none', padding: '10px 16px' }}
                >
                  <div className="w-full h-3 rounded" style={{ background: 'rgba(255,255,255,0.05)', marginTop: 4 }} />
                </div>
              )
            })}
          </div>

          <div className="px-4 py-2 shrink-0 flex items-center justify-between" style={{ borderTop: `1px solid ${accent}15` }}>
            <span className="text-[15px] text-white uppercase tracking-widest font-newsreader italic">{news.length} notas</span>
            <span className="text-[15px] font-bold" style={{ color: `${accent}50` }}>
              ◆
            </span>
          </div>
        </div>
      </div>

      <div className="mt-4 pt-3 flex items-center gap-3 overflow-hidden" style={{ borderTop: `1px solid ${accent}18` }}>
        <span
          className="shrink-0 text-[15px] uppercase tracking-[0.2em] font-bold px-2 py-1 rounded-sm"
          style={{ background: accent, color: '#fff' }}
        >
          Hoy
        </span>
        <div className="overflow-hidden flex-1">
          <div
            className="flex gap-8 whitespace-nowrap"
            style={{ animation: 'mag-ticker 32s linear infinite' }}
            onMouseEnter={(event) => {
              event.currentTarget.style.animationPlayState = 'paused'
            }}
            onMouseLeave={(event) => {
              event.currentTarget.style.animationPlayState = 'running'
            }}
          >
            {tickerItems.map((item, index) => (
              <a
                key={`${item.slug}-${index}`}
                href={item.href}
                className="inline-flex items-center gap-2 text-[16px] shrink-0 text-white cursor-pointer hover:text-white transition-colors duration-200 font-newsreader italic"
              >
                <span
                  className="not-italic"
                  style={{
                    width: 4,
                    height: 4,
                    borderRadius: '50%',
                    background: accent,
                    flexShrink: 0,
                    display: 'inline-block',
                  }}
                />
                {item.headline}
              </a>
            ))}
          </div>
        </div>
      </div>

      <style>{`
        @keyframes mag-ticker {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(-50%);
          }
        }
      `}</style>
    </div>
  )
}

function LayoutSpotlight({ news, accent }: { news: NewsItem[]; accent: string }) {
  const [hero, ...rest] = news
  const sideCards = rest.slice(0, 4)

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-5 items-stretch">
      {hero && (
        <div className="h-full min-h-[220px]">
          <CardOverlay item={hero} accent={accent} className={COVER_BANNER_SPOTLIGHT_FRAME} />
        </div>
      )}
      {sideCards.length > 0 && (
        <div className="grid grid-cols-2 grid-rows-2 gap-3 h-full min-h-[320px] md:min-h-0">
          {sideCards.map((item) => (
            <div key={item.slug} className="min-h-0 h-full">
              <CardVertical item={item} compact />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function LayoutStream({ news }: { news: NewsItem[]; accent: string }) {
  const trackRef = useRef<HTMLDivElement>(null)

  return (
    <div>
      <div ref={trackRef} className="flex gap-4 overflow-x-auto pb-4 snap-x snap-mandatory scrollbar-hide md:hidden">
        {news.map((item) => (
          <div key={item.slug} className="snap-center shrink-0 w-64">
            <CardVertical item={item} />
          </div>
        ))}
      </div>
      <div className="hidden md:grid md:grid-cols-2 lg:grid-cols-4 gap-5">
        {news.map((item) => (
          <CardVertical key={item.slug} item={item} />
        ))}
      </div>
    </div>
  )
}

function SectionDivider({ title, accent }: { title: string; accent: string }) {
  return (
    <div className="flex items-center justify-between mb-6 pb-3 border-b border-white/10">
      <div className="flex items-center gap-3">
        <div className="w-[3px] h-10 rounded-full" style={{ backgroundColor: accent }} />
        <div className="flex flex-col">
          <h2 className="text-2xl md:text-3xl font-newsreader font-semibold text-[#f0f0f0] leading-tight">{title}</h2>
          <span className="text-[11px] md:text-[13px] uppercase tracking-[0.15em] font-medium text-white -mt-1">
            La noticia a un click
          </span>
        </div>
      </div>
      <a
        href="#"
        className="text-[11px] uppercase tracking-widest font-semibold px-3 py-1.5 rounded-full border border-[#a62b2b] bg-[#a62b2b] text-white transition-colors duration-200 hover:bg-[#8a2424] hover:border-[#8a2424]"
      >
        Ver todo →
      </a>
    </div>
  )
}

const SLUG_LAYOUT_OVERRIDE: Record<string, number> = {
  'magazine-cultural': 1,
}

// ... (mantenemos todo el código anterior de las Cards y Layouts igual)

function resolveLayout(slug: string, index: number): number {
  if (slug in SLUG_LAYOUT_OVERRIDE) return SLUG_LAYOUT_OVERRIDE[slug];
  const cycle = [0, 2, 3];
  return cycle[index % cycle.length];
}

export const CategorySection: React.FC<CategorySectionProps> = ({
  title,
  news,
  accentColor = '#a62b2b',
  layoutIndex = 0,
  slug = '',
}) => {
  // 1. Generar ID compatible con el Nav (quita acentos, espacios por guiones)
  const sectionId = title
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // Elimina tildes
    .replace(/\s+/g, '-');           // Espacios por guiones

  const layout = resolveLayout(slug, layoutIndex);

  return (
    // 2. Aplicamos el ID y scroll-mt para que el header no tape el contenido
    <section id={sectionId} className="w-full py-10 scroll-mt-20">
      <div className="max-w-7xl mx-auto px-4 md:px-6">
        <SectionDivider title={title} accent={accentColor} />
        
        {/* Renderizado de Layouts */}
        {layout === 0 && <LayoutEditorial news={news} accent={accentColor} />}
        {layout === 1 && <LayoutMagazine news={news} accent={accentColor} />}
        {layout === 2 && <LayoutSpotlight news={news} accent={accentColor} />}
        {layout === 3 && <LayoutStream news={news} accent={accentColor} />}
      </div>
    </section>
  )
}

export default CategorySection;
