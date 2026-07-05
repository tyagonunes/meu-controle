-- Fontes de receita e lançamentos mensais
-- Seguro para rodar mais de uma vez

create table if not exists public.income_sources (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  name text not null,
  type text not null check (type in ('fixed', 'variable')),
  category text not null check (category in ('salario', 'freelance', 'investimentos', 'outros')),
  expected_day integer not null check (expected_day between 1 and 31),
  is_active boolean not null default true,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.income_entries (
  id uuid primary key default gen_random_uuid(),
  income_source_id uuid not null references public.income_sources(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  amount numeric(12, 2) not null check (amount >= 0),
  billing_month date not null,
  received_day integer not null check (received_day between 1 and 31),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (income_source_id, billing_month)
);

create index if not exists idx_income_sources_user_id
  on public.income_sources(user_id);

create index if not exists idx_income_entries_user_month
  on public.income_entries(user_id, billing_month);

create index if not exists idx_income_entries_source_id
  on public.income_entries(income_source_id);

alter table public.income_sources enable row level security;
alter table public.income_entries enable row level security;

drop policy if exists "income_sources_all_own" on public.income_sources;
drop policy if exists "income_entries_all_own" on public.income_entries;

create policy "income_sources_all_own" on public.income_sources
  for all using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "income_entries_all_own" on public.income_entries
  for all using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
