create extension if not exists pgcrypto;

create table if not exists public.news_articles (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text not null unique,
  category text not null check (
    category in (
      'ultima-hora',
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
  published_at timestamptz not null default now(),
  status text not null default 'draft' check (status in ('draft', 'published')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function public.set_updated_at()
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
execute function public.set_updated_at();

alter table public.news_articles enable row level security;

drop policy if exists "Public can read published news" on public.news_articles;
create policy "Public can read published news"
on public.news_articles
for select
to anon, authenticated
using (status = 'published');

drop policy if exists "Authenticated can manage news" on public.news_articles;
create policy "Authenticated can manage news"
on public.news_articles
for all
to authenticated
using (true)
with check (true);

insert into storage.buckets (id, name, public)
values ('news-images', 'news-images', true)
on conflict (id) do nothing;

drop policy if exists "Public can read news images" on storage.objects;
create policy "Public can read news images"
on storage.objects
for select
to public
using (bucket_id = 'news-images');

drop policy if exists "Authenticated can upload news images" on storage.objects;
create policy "Authenticated can upload news images"
on storage.objects
for all
to authenticated
using (bucket_id = 'news-images')
with check (bucket_id = 'news-images');
