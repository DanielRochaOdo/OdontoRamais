create extension if not exists "pgcrypto";

create table if not exists public.ramais (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  numero text not null,
  cargo text not null,
  setor text not null,
  email text,
  observacoes text,
  ativo boolean not null default true,
  created_at timestamptz not null default now()
);

create index if not exists ramais_setor_idx on public.ramais (setor);
create index if not exists ramais_numero_idx on public.ramais (numero);

create table if not exists public.avisos (
  id uuid primary key default gen_random_uuid(),
  titulo text not null,
  mensagem text not null,
  inicio_exibicao timestamptz not null,
  fim_exibicao timestamptz not null,
  destaque boolean not null default false,
  ativo boolean not null default true,
  created_at timestamptz not null default now(),
  constraint avisos_periodo_check check (fim_exibicao > inicio_exibicao)
);

create index if not exists avisos_periodo_idx on public.avisos (inicio_exibicao, fim_exibicao);

alter table public.ramais enable row level security;
alter table public.avisos enable row level security;

create policy "Leitura pública de ramais"
on public.ramais
for select
using (true);

create policy "Leitura pública de avisos"
on public.avisos
for select
using (true);

create policy "Operação autenticada de ramais"
on public.ramais
for all
using (auth.role() = 'authenticated')
with check (auth.role() = 'authenticated');

create policy "Operação autenticada de avisos"
on public.avisos
for all
using (auth.role() = 'authenticated')
with check (auth.role() = 'authenticated');
