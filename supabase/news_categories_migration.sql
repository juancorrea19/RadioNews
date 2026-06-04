-- Nuevas categorias: lo-ultimo, judicial, actualidad
-- Ejecutar en Supabase SQL Editor si ya tienes news_articles creada.

alter table public.news_articles drop constraint if exists news_articles_category_check;

alter table public.news_articles
  add constraint news_articles_category_check check (
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
  );
