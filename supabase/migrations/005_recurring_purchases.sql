-- Compras recorrentes mensais no cartão
-- Seguro para rodar mais de uma vez

alter table public.purchases
  add column if not exists is_recurring boolean not null default false;
