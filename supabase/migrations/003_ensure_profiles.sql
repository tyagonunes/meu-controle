-- Corrigir perfis ausentes (usuários criados antes do trigger)

insert into public.profiles (id, full_name)
select
  u.id,
  coalesce(u.raw_user_meta_data ->> 'full_name', split_part(u.email, '@', 1), 'Usuário')
from auth.users u
left join public.profiles p on p.id = u.id
where p.id is null
on conflict (id) do nothing;

-- Permite que o usuário crie o próprio perfil (fallback)
drop policy if exists "profiles_insert_own" on public.profiles;

create policy "profiles_insert_own" on public.profiles
  for insert with check (auth.uid() = id);

-- Função para garantir perfil via RPC
create or replace function public.ensure_profile()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
begin
  if uid is null then
    return;
  end if;

  insert into public.profiles (id, full_name)
  select
    u.id,
    coalesce(u.raw_user_meta_data ->> 'full_name', split_part(u.email, '@', 1), 'Usuário')
  from auth.users u
  where u.id = uid
  on conflict (id) do nothing;
end;
$$;

grant execute on function public.ensure_profile() to authenticated;
