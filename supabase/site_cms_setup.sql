-- Flash informativo + banners (alineado con src/lib/server/site-cms.ts)
-- Ejecutar en Supabase SQL Editor despues de news_admin_setup.sql (reutiliza set_news_articles_updated_at).

create table if not exists public.flash_slides (
  id uuid primary key default gen_random_uuid(),
  category text not null,
  title text not null,
  body text not null,
  date_line text not null,
  image_url text,
  image_path text,
  sort_order int not null default 0,
  status text not null default 'draft' check (status in ('draft', 'published')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists flash_slides_status_sort_idx
  on public.flash_slides (status, sort_order, created_at desc);

drop trigger if exists flash_slides_set_updated_at on public.flash_slides;
create trigger flash_slides_set_updated_at
before update on public.flash_slides
for each row
execute function public.set_news_articles_updated_at();

alter table public.flash_slides enable row level security;

drop policy if exists "Public can read published flash slides" on public.flash_slides;
create policy "Public can read published flash slides"
on public.flash_slides
for select
to anon, authenticated
using (status = 'published');

create table if not exists public.ad_slots (
  slot_key text primary key check (
    slot_key in ('indexTop', 'indexMid', 'articleInline', 'articleSidebar')
  ),
  label text not null,
  title text not null,
  description text not null default '',
  image_url text,
  image_path text,
  href text not null default '',
  alt text not null default '',
  cta text not null default '',
  updated_at timestamptz not null default now()
);

drop trigger if exists ad_slots_set_updated_at on public.ad_slots;
create trigger ad_slots_set_updated_at
before update on public.ad_slots
for each row
execute function public.set_news_articles_updated_at();

alter table public.ad_slots enable row level security;

drop policy if exists "Public can read ad slots" on public.ad_slots;
create policy "Public can read ad slots"
on public.ad_slots
for select
to anon, authenticated
using (true);

insert into storage.buckets (id, name, public)
values ('site-media', 'site-media', true)
on conflict (id) do update set public = excluded.public;

drop policy if exists "Public can read site media" on storage.objects;
create policy "Public can read site media"
on storage.objects
for select
to anon, authenticated
using (bucket_id = 'site-media');
