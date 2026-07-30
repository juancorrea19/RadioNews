-- Migración: video como portada de una diapositiva del flash informativo
-- Ejecutar en Supabase SQL Editor si ya tienes flash_slides creada (ver site_cms_setup.sql).

alter table public.flash_slides
  add column if not exists cover_media_type text not null default 'image'
    check (cover_media_type in ('image', 'video'));

alter table public.flash_slides
  add column if not exists video_url text;

alter table public.flash_slides
  add column if not exists video_path text;
