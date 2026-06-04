-- Migración: video como portada de noticia
-- Ejecutar en Supabase SQL Editor si ya tienes news_articles creada.

alter table public.news_articles
  add column if not exists cover_media_type text not null default 'image'
    check (cover_media_type in ('image', 'video'));

alter table public.news_articles
  add column if not exists cover_video_url text;

alter table public.news_articles
  add column if not exists cover_video_path text;
