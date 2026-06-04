-- Solicitudes de registro de colaboradores (API /api/registros + Resend)
-- Ejecutar en Supabase SQL Editor.

create table if not exists public.registro_colaboradores (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  correo text not null,
  telefono text not null,
  ubicacion text not null,
  interes text not null,
  mensaje text,
  autoriza_correo boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists registro_colaboradores_created_at_idx on public.registro_colaboradores (created_at desc);

alter table public.registro_colaboradores enable row level security;
