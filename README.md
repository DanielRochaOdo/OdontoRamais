# Odonto Ramais

Aplicação web para consulta pública de ramais e administração separada.

## Estrutura

```text
odontoRamais/
  src/
    admin.ts
    data.ts
    lib/supabase.ts
    main.ts
    style.css
    types.ts
    utils.ts
  scripts/export_legacy_ramais.py
  supabase/schema.sql
  .env.example
  admin.html
  index.html
  package.json
```

## Como usar

1. Instale as dependências:

```bash
npm install
```

2. Crie o arquivo `.env` a partir de `.env.example`.

3. No Supabase SQL Editor, execute [`supabase/schema.sql`](./supabase/schema.sql).

4. Para migrar dados legados para CSV:

```bash
python scripts/export_legacy_ramais.py
```

Depois importe `supabase/seed_ramais.csv` na tabela `ramais`.

5. Rode localmente:

```bash
npm run dev
```

## Vercel

Para deploy correto na Vercel:

1. Configure as variáveis de ambiente do projeto:

```text
VITE_SUPABASE_URL
VITE_SUPABASE_ANON_KEY
```

2. O projeto já está preparado para build estático com:

- `outputDirectory = dist`
- rota pública `/`
- rota administrativa `/admin`

3. O arquivo [`vercel.json`](./vercel.json) já define:

- build com `npm run build`
- saída em `dist`
- URL limpa para a área administrativa

Se a Vercel já estiver conectada ao repositório, basta fazer um novo deploy após salvar essas env vars.

## URLs

- `/`: catálogo público de ramais.
- `/admin`: área administrativa separada e protegida por login do Supabase Auth.

## Observações

- A navegação pública não expõe a URL administrativa.
- A área de admin exige sessão autenticada no Supabase Auth.
- As policies do schema mantêm leitura pública e escrita apenas para usuários autenticados.
