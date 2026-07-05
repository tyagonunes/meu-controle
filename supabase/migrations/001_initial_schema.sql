-- Meu Controle - Schema inicial

create extension if not exists "pgcrypto";

-- Profiles
create table public.profiles (
  id uuid primary key references auth.users on delete cascade,
  full_name text not null default '',
  created_at timestamptz not null default now()
);

-- Contas fixas (cadastro — valor lançado mensalmente)
create table public.fixed_expenses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  name text not null,
  category text not null check (category in ('moradia', 'utilidades', 'financiamento', 'outros')),
  due_day integer not null check (due_day between 1 and 31),
  is_active boolean not null default true,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Lançamentos mensais (valor variável por mês)
create table public.fixed_expense_entries (
  id uuid primary key default gen_random_uuid(),
  fixed_expense_id uuid not null references public.fixed_expenses(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  amount numeric(12, 2) not null check (amount >= 0),
  billing_month date not null,
  due_day integer not null check (due_day between 1 and 31),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (fixed_expense_id, billing_month)
);

-- Cartões de crédito
create table public.credit_cards (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  name text not null,
  last_digits text,
  closing_day integer not null check (closing_day between 1 and 31),
  due_day integer not null check (due_day between 1 and 31),
  credit_limit numeric(12, 2),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Membros do cartão (labels)
create table public.card_members (
  id uuid primary key default gen_random_uuid(),
  credit_card_id uuid not null references public.credit_cards(id) on delete cascade,
  name text not null,
  is_owner boolean not null default false,
  created_at timestamptz not null default now()
);

-- Compras
create table public.purchases (
  id uuid primary key default gen_random_uuid(),
  credit_card_id uuid not null references public.credit_cards(id) on delete cascade,
  card_member_id uuid not null references public.card_members(id) on delete restrict,
  description text not null,
  total_amount numeric(12, 2) not null check (total_amount > 0),
  purchase_date date not null,
  installments integer not null default 1 check (installments >= 1),
  created_at timestamptz not null default now()
);

-- Parcelas
create table public.purchase_installments (
  id uuid primary key default gen_random_uuid(),
  purchase_id uuid not null references public.purchases(id) on delete cascade,
  credit_card_id uuid not null references public.credit_cards(id) on delete cascade,
  installment_number integer not null check (installment_number >= 1),
  amount numeric(12, 2) not null check (amount > 0),
  billing_month date not null,
  created_at timestamptz not null default now(),
  unique (purchase_id, installment_number)
);

-- Índices
create index idx_fixed_expenses_user_id on public.fixed_expenses(user_id);
create index idx_fixed_expense_entries_user_month on public.fixed_expense_entries(user_id, billing_month);
create index idx_fixed_expense_entries_expense_id on public.fixed_expense_entries(fixed_expense_id);
create index idx_credit_cards_user_id on public.credit_cards(user_id);
create index idx_card_members_credit_card_id on public.card_members(credit_card_id);
create index idx_purchases_credit_card_id on public.purchases(credit_card_id);
create index idx_purchases_card_member_id on public.purchases(card_member_id);
create index idx_purchase_installments_billing on public.purchase_installments(credit_card_id, billing_month);

-- Trigger: criar profile ao registrar usuário
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', split_part(new.email, '@', 1))
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- RLS
alter table public.profiles enable row level security;
alter table public.fixed_expenses enable row level security;
alter table public.fixed_expense_entries enable row level security;
alter table public.credit_cards enable row level security;
alter table public.card_members enable row level security;
alter table public.purchases enable row level security;
alter table public.purchase_installments enable row level security;

-- Profiles
create policy "profiles_select_own" on public.profiles
  for select using (auth.uid() = id);

create policy "profiles_update_own" on public.profiles
  for update using (auth.uid() = id);

create policy "profiles_insert_own" on public.profiles
  for insert with check (auth.uid() = id);

-- Fixed expenses
create policy "fixed_expenses_all_own" on public.fixed_expenses
  for all using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Lançamentos mensais de contas fixas
create policy "fixed_expense_entries_all_own" on public.fixed_expense_entries
  for all using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Credit cards
create policy "credit_cards_all_own" on public.credit_cards
  for all using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Card members
create policy "card_members_all_own" on public.card_members
  for all using (
    exists (
      select 1 from public.credit_cards cc
      where cc.id = card_members.credit_card_id
        and cc.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.credit_cards cc
      where cc.id = card_members.credit_card_id
        and cc.user_id = auth.uid()
    )
  );

-- Purchases
create policy "purchases_all_own" on public.purchases
  for all using (
    exists (
      select 1 from public.credit_cards cc
      where cc.id = purchases.credit_card_id
        and cc.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.credit_cards cc
      where cc.id = purchases.credit_card_id
        and cc.user_id = auth.uid()
    )
  );

-- Purchase installments
create policy "installments_all_own" on public.purchase_installments
  for all using (
    exists (
      select 1 from public.credit_cards cc
      where cc.id = purchase_installments.credit_card_id
        and cc.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.credit_cards cc
      where cc.id = purchase_installments.credit_card_id
        and cc.user_id = auth.uid()
    )
  );
