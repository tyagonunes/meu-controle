# Meu Controle

Aplicação de controle de gastos com Next.js e Supabase.

## Funcionalidades

- Contas fixas (luz, água, financiamento, etc.)
- Cartões de crédito com compras parceladas
- Membros do cartão (labels familiares)
- Relatório de fatura mensal por cartão
- Relatório mensal consolidado

## Setup

### 1. Supabase

1. Crie um projeto em [supabase.com](https://supabase.com)
2. Execute o SQL em `supabase/migrations/001_initial_schema.sql` no SQL Editor
3. Habilite Email auth em Authentication > Providers

### 2. Variáveis de ambiente

Copie `.env.example` para `.env.local` e preencha:

```
NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sua-publishable-key
```

### 3. Rodar localmente

```bash
npm install
npm run dev
```

Acesse [http://localhost:3000](http://localhost:3000)
