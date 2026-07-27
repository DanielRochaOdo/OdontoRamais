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

create table if not exists public.admin_users (
  user_id uuid primary key references auth.users (id) on delete cascade,
  email text,
  ativo boolean not null default true,
  created_at timestamptz not null default now()
);

insert into public.admin_users (user_id, email, ativo)
select id, email, true
from auth.users
on conflict (user_id) do nothing;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.admin_users
    where user_id = auth.uid()
      and ativo = true
  );
$$;

grant execute on function public.is_admin() to anon, authenticated;

alter table public.ramais enable row level security;
alter table public.avisos enable row level security;
alter table public.admin_users enable row level security;

create policy "Leitura pública de ramais"
on public.ramais
for select
using (true);

create policy "Leitura pública de avisos"
on public.avisos
for select
using (true);

create policy "Leitura própria de admin_users"
on public.admin_users
for select
using (user_id = auth.uid());

create policy "Operação admin de ramais"
on public.ramais
for all
using (public.is_admin())
with check (public.is_admin());

create policy "Operação admin de avisos"
on public.avisos
for all
using (public.is_admin())
with check (public.is_admin());
