/**
 * Reproductor fijo inferior. No se muestra mientras `SHOW_RADIO_PLAYER` sea false
 * en `src/lib/site-features.ts` (o `PUBLIC_SHOW_RADIO_PLAYER=true` en .env).
 */
import React, { useState, useEffect, useRef } from 'react';

export default function RadioPlayer() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLive, setIsLive] = useState(true); // Cambia a false para modo "Música/Publicidad"
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Simulación de cambio de contenido (esto vendría de tu servidor de streaming)
  const currentStation = isLive ? "Emisión en Vivo: Noticiero Central" : "Radio News - Música & Publicidad";
  const accentColor = "#a62b2b";

  const togglePlay = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[100] bg-[#1a2332]/98 backdrop-blur-md border-t border-white/10 h-20 flex items-center shadow-[0_1px_3px_rgb(0,0,0,0.5)]">
      {/* Elemento de audio oculto */}
      <audio ref={audioRef} src="URL_DE_TU_STREAMING" preload="none" />

      <div className="max-w-7xl mx-auto w-full px-4 md:px-6 flex items-center justify-between gap-4">
        
        {/* SECCIÓN IZQUIERDA: BOTÓN Y TÍTULO */}
        <div className="flex items-center gap-4 min-w-0 flex-1">
          <button 
            onClick={togglePlay}
            className="relative shrink-0 w-12 h-12 flex items-center justify-center rounded-full transition-all active:scale-90 hover:brightness-110 shadow-lg"
            style={{ backgroundColor: accentColor }}
          >
            {isPlaying ? (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="white"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>
            ) : (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="white" className="ml-1"><path d="M8 5v14l11-7z"/></svg>
            )}
            {/* Animación de pulso solo si está reproduciendo */}
            {isPlaying && (
              <span className="absolute inset-0 rounded-full animate-ping opacity-20" style={{ backgroundColor: accentColor }}></span>
            )}
          </button>

          <div className="flex flex-col min-w-0">
            <div className="flex items-center gap-2 mb-0.5">
              <span className={`h-2 w-2 rounded-full ${isLive ? 'bg-red-500 animate-pulse' : 'bg-green-500'}`}></span>
              <span className="text-[10px] uppercase tracking-[0.2em] font-bold text-white/50">
                {isLive ? 'Al Aire' : 'Playlist 24/7'}
              </span>
            </div>
            <h4 className="text-white text-sm md:text-base font-newsreader font-semibold truncate leading-tight">
              {currentStation}
            </h4>
          </div>
        </div>

        {/* SECCIÓN CENTRAL: EMISIONES PASADAS (Solo Desktop) */}
        <div className="hidden lg:flex items-center gap-6 px-6 border-l border-white/5">
          <div className="flex flex-col">
            <span className="text-[9px] uppercase tracking-widest text-white/30 font-bold mb-1">Podcast Recientes</span>
            <div className="flex gap-3">
              <a href="#" className="text-[11px] text-white/60 hover:text-white transition-colors">Mañana (07:00)</a>
              <a href="#" className="text-[11px] text-white/60 hover:text-white transition-colors">Mediodía (12:30)</a>
            </div>
          </div>
        </div>

        {/* SECCIÓN DERECHA: VOLUMEN Y STATUS */}
        <div className="flex items-center gap-5 shrink-0">
          <div className="hidden sm:flex items-center gap-3">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 5L6 9H2v6h4l5 4V5z"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"/></svg>
            <div className="w-16 md:w-24 h-1 bg-white/10 rounded-full relative overflow-hidden group cursor-pointer">
               <div className="absolute top-0 left-0 h-full w-3/4" style={{ backgroundColor: accentColor }}></div>
            </div>
          </div>
          
          <div className="px-3 py-1.5 rounded border border-white/10 bg-white/5 hidden md:block">
            <span className="text-[10px] font-mono text-white/40 uppercase tracking-tighter">HD Audio</span>
          </div>
        </div>

      </div>
    </div>
  );
}