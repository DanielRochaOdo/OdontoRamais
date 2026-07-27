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

alter table public.admin_users enable row level security;

drop policy if exists "Leitura própria de admin_users" on public.admin_users;
create policy "Leitura própria de admin_users"
on public.admin_users
for select
using (user_id = auth.uid());

drop policy if exists "Leitura pública de ramais" on public.ramais;
create policy "Leitura pública de ramais"
on public.ramais
for select
using (true);

drop policy if exists "Leitura pública de avisos" on public.avisos;
create policy "Leitura pública de avisos"
on public.avisos
for select
using (true);

drop policy if exists "Operação autenticada de ramais" on public.ramais;
drop policy if exists "Operação admin de ramais" on public.ramais;
create policy "Operação admin de ramais"
on public.ramais
for all
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "Operação autenticada de avisos" on public.avisos;
drop policy if exists "Operação admin de avisos" on public.avisos;
create policy "Operação admin de avisos"
on public.avisos
for all
using (public.is_admin())
with check (public.is_admin());
