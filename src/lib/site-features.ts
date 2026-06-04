/**
 * Reproductor de radio en vivo (barra fija inferior, `RadioPlayer.tsx`).
 * Oculto por ahora; activar cuando la transmisión esté lista.
 *
 * Opción 1: cambiar a `true` aquí.
 * Opción 2: en `.env` → PUBLIC_SHOW_RADIO_PLAYER=true
 */
export const SHOW_RADIO_PLAYER =
  import.meta.env.PUBLIC_SHOW_RADIO_PLAYER === "true";
