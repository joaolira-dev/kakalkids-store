-- =====================================================================
-- KakalKids Store — limpeza dos dados de TESTE antes do lançamento
--
-- Apaga: produtos da coleção "exemplos" (e suas variações, fotos e
-- histórico de estoque), todos os pedidos, e os cupons de teste.
-- Mantém: categorias, cores, tamanhos, tabelas de medidas, admins e
-- configurações.
--
-- Rode no SQL Editor do Supabase.
--
-- ANTES de rodar: as fotos dos produtos de teste ficam no Storage e o
-- Supabase não deixa apagá-las por SQL. Rode só a consulta abaixo, anote
-- as pastas e apague-as em Storage → product-images (cada pasta = 1 produto):
--
--   select pc.product_id as pasta, p.name
--   from product_collections pc
--   join collections c on c.id = pc.collection_id
--   join products p on p.id = pc.product_id
--   where c.slug = 'exemplos'
--     and exists (select 1 from product_images i where i.product_id = p.id);
-- =====================================================================

begin;

-- 1. Pedidos de teste (todos: a loja ainda não está no ar)
delete from orders;

-- 2. Produtos de exemplo
create temporary table _produtos_teste on commit drop as
  select pc.product_id as id
  from product_collections pc
  join collections c on c.id = pc.collection_id
  where c.slug = 'exemplos';

delete from products where id in (select id from _produtos_teste);
delete from collections where slug = 'exemplos';

-- 3. Cupons de teste
delete from coupons where code in ('TESTE10');

-- 4. Recomeça a numeração dos pedidos em #1001
alter table orders alter column number restart with 1001;

commit;
