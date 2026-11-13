-- =====================================================================
-- KakalKids Store — dados de EXEMPLO para desenvolvimento
--
-- Rode no SQL Editor do Supabase depois da migration 0001.
-- Todos os produtos de exemplo ficam na coleção "exemplos".
-- Para APAGAR tudo antes de a loja ir ao ar, rode o bloco no fim do arquivo.
-- =====================================================================

-- Categorias, cores e coleções são reais e podem ficar
insert into categories (name, slug, sort_order) values
  ('Vestidos', 'vestidos', 1),
  ('Conjuntos', 'conjuntos', 2),
  ('Blusas e camisetas', 'blusas-e-camisetas', 3),
  ('Shorts e saias', 'shorts-e-saias', 4),
  ('Calças', 'calcas', 5),
  ('Bodies e macacões', 'bodies-e-macacoes', 6),
  ('Acessórios', 'acessorios', 7)
on conflict (slug) do nothing;

insert into colors (name, hex) values
  ('Branco', '#FFFFFF'),
  ('Off-white', '#F5EFE3'),
  ('Rosa', '#F7A1C4'),
  ('Azul', '#3764F4'),
  ('Azul-marinho', '#182B55'),
  ('Amarelo', '#FFD000'),
  ('Laranja', '#FF8A3D'),
  ('Vermelho', '#E53935'),
  ('Verde-água', '#00C8D4'),
  ('Lilás', '#B39DDB')
on conflict (name) do nothing;

insert into sizes (label, age_group, sort_order) values ('Único', 'infantil', 99)
on conflict (label) do nothing;

insert into collections (name, slug, description, sort_order) values
  ('Verão Kakal', 'verao-kakal', 'Peças leves e coloridas para os dias de sol.', 1),
  ('Exemplos (apagar antes do lançamento)', 'exemplos', 'Produtos fictícios usados no desenvolvimento.', 99)
on conflict (slug) do nothing;

insert into size_charts (name, chart, notes) values
  ('Infantil padrão',
   '{"columns":["Tamanho","Idade","Altura (cm)","Busto (cm)","Cintura (cm)"],
     "rows":[["1","1 ano","74-80","50","48"],["2","2 anos","86-92","52","50"],["3","3 anos","92-98","54","51"],
             ["4","4 anos","98-104","56","52"],["6","6 anos","110-116","60","54"],["8","8 anos","122-128","64","56"],
             ["10","10 anos","134-140","68","59"]]}',
   'Medidas do corpo da criança. Na dúvida entre dois tamanhos, escolha o maior.'),
  ('Bebê padrão',
   '{"columns":["Tamanho","Idade","Altura (cm)","Peso (kg)"],
     "rows":[["RN","0-1 mês","até 50","até 3,5"],["P","1-3 meses","50-60","3,5-6"],["M","3-6 meses","60-68","6-8"],
             ["G","6-9 meses","68-74","8-9,5"],["GG","9-12 meses","74-80","9,5-11"]]}',
   'Medidas aproximadas. Bebês crescem rápido: considere um tamanho acima.'),
  ('Teen padrão',
   '{"columns":["Tamanho","Altura (cm)","Busto (cm)","Cintura (cm)","Quadril (cm)"],
     "rows":[["12","146-152","72","62","76"],["14","158-164","78","64","82"],["16","164-170","82","66","88"],
             ["18","170-176","86","68","92"]]}',
   'Modelagem jovem, mais ajustada.');

-- ---------------------------------------------------------------------
-- Produtos de exemplo
-- ---------------------------------------------------------------------
do $$
declare
  p record;
  v_product_id uuid;
  v_collection uuid := (select id from collections where slug = 'exemplos');
  v_color text;
  v_size text;
begin
  for p in
    select * from (values
      -- nome, slug, categoria, gênero, idade, preço, preço "de", tabela, destaque, cores, tamanhos, descrição
      ('Vestido Babados Branco', 'vestido-babados-branco', 'vestidos', 'menina', 'infantil', 159.90, null::numeric,
       'Infantil padrão', true, array['Branco'], array['2','4','6','8','10'],
       'Vestido em tricoline com babados nas mangas e na barra. Abotoamento nas costas e laço removível.'),
      ('Conjunto Chuva de Alegria', 'conjunto-chuva-de-alegria', 'conjuntos', 'menina', 'infantil', 139.90, 169.90,
       'Infantil padrão', true, array['Azul','Laranja','Rosa'], array['2','4','6','8'],
       'Blusa estampada com mangas listradas e short com cordão. Tecido leve, ideal para o calor.'),
      ('Conjunto Listrado Sol', 'conjunto-listrado-sol', 'conjuntos', 'menina', 'infantil', 129.90, null,
       'Infantil padrão', false, array['Laranja','Rosa'], array['4','6','8','10'],
       'Blusa com aplique e short listrado de cintura elástica.'),
      ('Camiseta Mascotes Kakal', 'camiseta-mascotes-kakal', 'blusas-e-camisetas', 'unissex', 'infantil', 59.90, null,
       'Infantil padrão', true, array['Branco','Amarelo','Verde-água'], array['1','2','3','4','6','8','10'],
       'Camiseta 100% algodão com estampa dos mascotes da Kakal.'),
      ('Bermuda Sarja Aventura', 'bermuda-sarja-aventura', 'shorts-e-saias', 'menino', 'infantil', 89.90, null,
       'Infantil padrão', false, array['Azul-marinho','Off-white'], array['2','4','6','8','10'],
       'Bermuda em sarja com elástico interno regulável e bolsos funcionais.'),
      ('Conjunto Marinheiro', 'conjunto-marinheiro', 'conjuntos', 'menino', 'infantil', 149.90, 179.90,
       'Infantil padrão', false, array['Azul-marinho'], array['1','2','3','4'],
       'Camisa polo listrada e bermuda de linho. Perfeito para festas e passeios.'),
      ('Body Manga Curta Sorriso', 'body-manga-curta-sorriso', 'bodies-e-macacoes', 'unissex', 'bebe', 49.90, null,
       'Bebê padrão', false, array['Branco','Amarelo','Lilás'], array['RN','P','M','G','GG'],
       'Body em suedine macio com abertura de botões de pressão.'),
      ('Macacão Ursinho', 'macacao-ursinho', 'bodies-e-macacoes', 'unissex', 'bebe', 99.90, null,
       'Bebê padrão', true, array['Off-white','Rosa','Azul'], array['RN','P','M','G'],
       'Macacão em plush com capuz de orelhinhas e pezinho reversível.'),
      ('Vestido Florzinha Bebê', 'vestido-florzinha-bebe', 'vestidos', 'menina', 'bebe', 89.90, null,
       'Bebê padrão', false, array['Rosa','Lilás'], array['P','M','G','GG'],
       'Vestido com calcinha tapa-fralda combinando.'),
      ('Cropped Teen Arco-íris', 'cropped-teen-arco-iris', 'blusas-e-camisetas', 'menina', 'teen', 79.90, null,
       'Teen padrão', false, array['Branco','Lilás'], array['12','14','16'],
       'Cropped em malha canelada com estampa de arco-íris.'),
      ('Calça Jogger Teen', 'calca-jogger-teen', 'calcas', 'menino', 'teen', 119.90, 139.90,
       'Teen padrão', false, array['Azul-marinho','Off-white'], array['12','14','16','18'],
       'Calça jogger em moletinho com punho na barra e cordão.'),
      ('Laço Gigante Kakal', 'laco-gigante-kakal', 'acessorios', 'menina', 'infantil', 29.90, null,
       null, false, array['Rosa','Verde-água','Amarelo','Branco'], array['Único'],
       'Laço de cabelo grande em gorgurão, preso em bico de pato. Tamanho único.')
    ) as t(name, slug, category, gender, age_group, price, compare_at, chart, featured, colors, sizes, description)
  loop
    insert into products (name, slug, description, category_id, gender, age_group, base_price,
                          compare_at_price, size_chart_id, featured)
    values (p.name, p.slug, p.description,
            (select id from categories where slug = p.category),
            p.gender::gender, p.age_group::age_group, p.price, p.compare_at,
            (select id from size_charts where name = p.chart limit 1), p.featured)
    on conflict (slug) do nothing
    returning id into v_product_id;

    continue when v_product_id is null;

    insert into product_collections (product_id, collection_id) values (v_product_id, v_collection);

    foreach v_color in array p.colors loop
      foreach v_size in array p.sizes loop
        insert into product_variants (product_id, color_id, size_id, sku, stock)
        values (v_product_id,
                (select id from colors where name = v_color),
                (select id from sizes where label = v_size),
                'KK-' || upper(substr(md5(p.slug), 1, 5)) || '-' || upper(left(v_color, 3)) || '-' || v_size,
                -- estoque variado, com alguns tamanhos esgotados para testar a vitrine
                (abs(hashtext(p.slug || v_color || v_size)) % 7));
      end loop;
    end loop;
  end loop;
end $$;

-- =====================================================================
-- PARA APAGAR OS EXEMPLOS (rode só este bloco):
--
-- delete from products where id in (
--   select product_id from product_collections pc
--   join collections c on c.id = pc.collection_id where c.slug = 'exemplos'
-- );
-- delete from collections where slug = 'exemplos';
-- =====================================================================
