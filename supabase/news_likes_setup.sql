-- Radio News Online — contador de "Me gusta" por noticia
-- Ejecutar en Supabase SQL Editor (Dashboard → SQL → New query).
--
-- La clave (key) es "<categoria-slug>/<noticia-slug>", la misma que arma la ruta
-- /noticia/[category]/[article]/, asi que funciona sin importar si la noticia
-- viene de Supabase, del CMS de contenido o de los datos de respaldo.
--
-- El panel/API usa SUPABASE_SERVICE_ROLE_KEY (bypass de RLS) para leer y sumar/restar.
-- No se otorgan permisos de escritura a anon/authenticated: solo el backend puede modificar el contador.

create table if not exists public.news_likes (
  key text primary key,
  count integer not null default 0 check (count >= 0),
  updated_at timestamptz not null default now()
);

alter table public.news_likes enable row level security;

drop policy if exists "Public can read like counts" on public.news_likes;
create policy "Public can read like counts"
on public.news_likes
for select
to anon, authenticated
using (true);

-- Suma o resta de forma atomica (evita condiciones de carrera con varios clics simultaneos).
-- security definer: se ejecuta con permisos del dueno de la funcion, sin depender de RLS.
create or replace function public.adjust_news_like(p_key text, p_delta integer)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  new_count integer;
begin
  insert into public.news_likes (key, count, updated_at)
  values (p_key, greatest(p_delta, 0), now())
  on conflict (key) do update
    set count = greatest(public.news_likes.count + p_delta, 0),
        updated_at = now()
  returning count into new_count;

  return new_count;
end;
$$;

revoke all on function public.adjust_news_like(text, integer) from public;
grant execute on function public.adjust_news_like(text, integer) to service_role;
