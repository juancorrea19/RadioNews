/** Clases compartidas para marcos de portada (16:9 con tope de altura). */

/**
 * Capa de fondo desenfocada: una copia agrandada y difuminada de la misma imagen
 * que llena todo el marco, para que nunca se vea un espacio vacio detras de la
 * imagen nitida (que usa object-contain y puede no cubrir el marco completo).
 */
export const COVER_IMG_BLUR_CLASS =
  "absolute inset-0 h-full w-full scale-110 object-cover object-center blur-2xl opacity-60 saturate-150";

/** Imagen nitida, completa y sin recortes (object-contain) sobre la capa difuminada. */
export const COVER_IMG_CLASS =
  "absolute inset-0 h-full w-full object-contain object-center";

export const COVER_THUMB_FRAME =
  "relative shrink-0 w-20 aspect-video overflow-hidden rounded-lg bg-[#041d3d]";

export const COVER_CARD_FRAME =
  "relative w-full overflow-hidden aspect-video max-h-44 md:max-h-48 bg-[#041d3d]";

export const COVER_HERO_FRAME =
  "relative w-full overflow-hidden aspect-video max-h-64 md:max-h-72 bg-[#041d3d]";

export const COVER_BANNER_FRAME =
  "relative overflow-hidden aspect-video w-full max-w-xl md:max-w-2xl bg-[#041d3d]";

export const COVER_BANNER_SPOTLIGHT_FRAME =
  "relative overflow-hidden w-full h-full min-h-[220px] bg-[#041d3d]";

export const COVER_SPOTLIGHT_GRID_FRAME =
  "relative w-full flex-1 min-h-[72px] overflow-hidden bg-[#041d3d]";

export const COVER_ARTICLE_FRAME =
  "relative aspect-video w-full max-h-[min(72vh,720px)] overflow-hidden bg-[#041d3d]";

export const COVER_MAGAZINE_FRAME =
  "md:aspect-video md:max-h-[min(48vw,440px)]";
