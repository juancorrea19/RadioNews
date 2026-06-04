-- Radio News Online — alineado con src/lib/server/news-admin.ts
-- Ejecutar en Supabase SQL Editor (Dashboard → SQL → New query).
--
-- El panel Astro usa SUPABASE_SERVICE_ROLE_KEY: bypass de RLS en tabla y storage.
-- Las politicas siguientes sirven para:
--   - lectura publica de noticias publicadas (por si algun dia consultas con la anon key)
--   - lectura publica de portadas en <img src="..."> (bucket publico + SELECT en storage.objects)
-- No hay politicas de escritura para anon/authenticated: evita que cualquier usuario logueado
-- en Supabase Auth pueda borrar o editar noticias/imagenes con la publishable key.

create extension if not exists pgcrypto;

create table if not exists public.news_articles (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text not null unique,
  category text not null check (
    category in (
      'ultima-hora',
      'lo-ultimo',
      'judicial',
      'actualidad',
      'internacional',
      'nacion',
      'entretenimiento',
      'magazine-cultural',
      'deportes',
      'economia',
      'ciencia'
    )
  ),
  excerpt text,
  author text default 'Redaccion Radio News Online',
  body text not null,
  cover_image_url text,
  cover_image_path text,
  cover_media_type text not null default 'image' check (cover_media_type in ('image', 'video')),
  cover_video_url text,
  cover_video_path text,
  published_at timestamptz not null default now(),
  status text not null default 'draft' check (status in ('draft', 'published')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists news_articles_status_published_at_idx
  on public.news_articles (status, published_at desc);

create or replace function public.set_news_articles_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists news_articles_set_updated_at on public.news_articles;
create trigger news_articles_set_updated_at
before update on public.news_articles
for each row
execute function public.set_news_articles_updated_at();

alter table public.news_articles enable row level security;

drop policy if exists "Public can read published news" on public.news_articles;
create policy "Public can read published news"
on public.news_articles
for select
to anon, authenticated
using (status = 'published');

-- Quitar politicas permisivas antiguas si existian (no las vuelvas a crear):
drop policy if exists "Authenticated can manage news" on public.news_articles;

-- Bucket publico: URLs de getPublicUrl sirven en el sitio sin firma.
insert into storage.buckets (id, name, public)
values ('news-images', 'news-images', true)
on conflict (id) do update set public = excluded.public;

drop policy if exists "Public can read news images" on storage.objects;
create policy "Public can read news images"
on storage.objects
for select
to anon, authenticated
using (bucket_id = 'news-images');

drop policy if exists "Authenticated can upload news images" on storage.objects;
