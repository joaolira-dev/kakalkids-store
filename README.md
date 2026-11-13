# KakalKids Store

E-commerce de moda infantil e teen da **KakalKids** (João Pessoa - PB). O cliente escolhe as peças no site e finaliza o pedido pelo WhatsApp; a loja gerencia produtos, estoque, pedidos e cupons num painel próprio.

**Stack:** Next.js 16 (App Router, Cache Components) · TypeScript · Tailwind CSS 4 · Supabase (Postgres, Auth, Storage, RLS).

## Rodando localmente

```bash
cp .env.example .env.local   # preencha com as chaves do Supabase e o WhatsApp
npm install
npm run dev                  # http://localhost:3000  ·  painel em /admin
```

## Banco de dados

As migrations ficam em `supabase/migrations/` e são aplicadas **em ordem** no SQL Editor do Supabase:

| Arquivo | O que faz |
| --- | --- |
| `0001_init.sql` | Catálogo, variações, estoque, cupons, pedidos, RLS e funções de negócio |
| `0002_delivery_method.sql` | Forma de entrega no pedido |
| `0003_order_rate_limit.sql` | Anti-spam: limite de pedidos por telefone e por hora |

- `supabase/seed.sql` — produtos de exemplo para desenvolvimento.
- `supabase/cleanup-testes.sql` — apaga os dados de teste antes do lançamento.

Para dar acesso ao painel a um usuário criado em **Authentication → Users**:

```sql
insert into admins (user_id)
select id from auth.users where email = 'email@da-cliente.com';
```

## Regras importantes

- **Preço, estoque e cupom são calculados no banco** (`create_order`, `set_order_status`, `adjust_stock`). O navegador só envia IDs e quantidades.
- O estoque baixa quando o pedido é **confirmado** no painel e volta se um pedido confirmado for **cancelado**.
- Toda alteração de estoque fica em `stock_movements`.
- Fotos são comprimidas no navegador (WebP, máx. 1600px) e enviadas direto ao Storage (`product-images`).

## Deploy (Vercel)

1. Importar o repositório na Vercel (framework detectado: Next.js).
2. Variáveis de ambiente (Production):
   - `NEXT_PUBLIC_SITE_URL` — ex.: `https://kakalkids.com.br`
   - `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
   - `NEXT_PUBLIC_WHATSAPP_NUMBER` — só dígitos, com 55 + DDD
3. Em **Domains**, adicionar o domínio e configurar o DNS no Registro.br conforme a Vercel indicar.
4. Antes de divulgar: rodar `cleanup-testes.sql`, cadastrar os produtos reais e fazer um pedido completo de teste.

> O plano Hobby (gratuito) da Vercel não permite uso comercial; a loja deve rodar no plano Pro.

## Estrutura

```
src/app/(loja)/      páginas da loja (home, catálogo, produto, sacola, institucionais)
src/app/admin/       painel (login, pedidos, produtos, estoque, cupons)
src/lib/catalog/     consultas e filtros do catálogo (com cache)
src/lib/admin/       consultas e ações do painel (sempre checam se é admin)
src/lib/checkout/    criação do pedido e mensagem do WhatsApp
supabase/            migrations, seed e limpeza
docs/brand/          identidade visual de referência
```
