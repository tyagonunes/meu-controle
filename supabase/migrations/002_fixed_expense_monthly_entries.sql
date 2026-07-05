-- Lançamentos mensais de contas fixas (valores variáveis por mês)
-- Seguro para rodar mais de uma vez

create table if not exists public.fixed_expense_entries (
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

create index if not exists idx_fixed_expense_entries_user_month
  on public.fixed_expense_entries(user_id, billing_month);

create index if not exists idx_fixed_expense_entries_expense_id
  on public.fixed_expense_entries(fixed_expense_id);

-- Migrar valores existentes (se a coluna amount ainda existir)
do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'fixed_expenses'
      and column_name = 'amount'
  ) then
    insert into public.fixed_expense_entries (
      fixed_expense_id,
      user_id,
      amount,
      billing_month,
      due_day,
      notes
    )
    select
      fe.id,
      fe.user_id,
      fe.amount,
      date_trunc('month', current_date)::date,
      fe.due_day,
      fe.notes
    from public.fixed_expenses fe
    where fe.amount is not null
      and not exists (
        select 1
        from public.fixed_expense_entries e
        where e.fixed_expense_id = fe.id
          and e.billing_month = date_trunc('month', current_date)::date
      );

    alter table public.fixed_expenses drop column amount;
  end if;
end $$;

alter table public.fixed_expense_entries enable row level security;

drop policy if exists "fixed_expense_entries_all_own" on public.fixed_expense_entries;

create policy "fixed_expense_entries_all_own" on public.fixed_expense_entries
  for all using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
