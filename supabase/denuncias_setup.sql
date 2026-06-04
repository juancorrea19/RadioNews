-- Denuncias ciudadanas + evidencia en Storage (bucket privado)
-- Ejecutar en Supabase SQL Editor. Requiere extension pgcrypto (ya en news_admin_setup).

create table if not exists public.denuncias (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  numero text not null,
  correo text not null,
  descripcion text not null,
  ubicacion text not null,
  autoriza_contacto boolean not null default false,
  evidence_path text,
  evidence_filename text,
  evidence_mime text,
  evidence_size int,
  created_at timestamptz not null default now()
);

create index if not exists denuncias_created_at_idx on public.denuncias (created_at desc);

alter table public.denuncias enable row level security;

-- Sin politicas para anon/authenticated: solo service role (panel / API servidor).

insert into storage.buckets (id, name, public)
values ('denuncias-evidence', 'denuncias-evidence', false)
on conflict (id) do update set public = excluded.public;
