-- =====================================================================
-- KakalKids Store — schema inicial (Supabase / Postgres)
-- Catálogo, variações, estoque, cupons, pedidos via WhatsApp e admin.
--
-- Princípio: o front fala direto com o Supabase, então TODA regra de
-- negócio sensível (preço, estoque, cupom) roda aqui no banco, em funções
-- SECURITY DEFINER. O navegador nunca define preço nem mexe em estoque.
-- =====================================================================

create extension if not exists citext with schema extensions;

-- ---------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------
create type gender as enum ('menina', 'menino', 'unissex');
create type age_group as enum ('bebe', 'infantil', 'teen');           -- RN–2a / 2–10a / 10–18a
create type coupon_type as enum ('percent', 'fixed');
create type order_status as enum ('pending', 'confirmed', 'shipped', 'delivered', 'canceled');
create type stock_reason as enum ('entrada', 'venda', 'ajuste', 'cancelamento');

-- ---------------------------------------------------------------------
-- Admin
-- ---------------------------------------------------------------------
create table admins (
  user_id    uuid primary key references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);

create or replace function is_admin()
returns boolean
language sql stable security definer set search_path = public, extensions
as $$
  select exists (select 1 from admins where user_id = auth.uid());
$$;

-- updated_at automático
create or replace function set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------
-- Catálogo
-- ---------------------------------------------------------------------
create table categories (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  slug       extensions.citext not null unique,
  parent_id  uuid references categories (id) on delete set null,
  sort_order int not null default 0,
  active     boolean not null default true
);

create table collections (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  slug        extensions.citext not null unique,
  description text,
  banner_url  text,
  sort_order  int not null default 0,
  active      boolean not null default true
);

-- Tamanhos normalizados: garantem a ordem certa no filtro (RN, P, M, G, 1, 2 … 16)
create table sizes (
  id         uuid primary key default gen_random_uuid(),
  label      text not null unique,
  age_group  age_group not null,
  sort_order int not null
);

create table colors (
  id   uuid primary key default gen_random_uuid(),
  name text not null unique,
  hex  text not null check (hex ~ '^#[0-9A-Fa-f]{6}$')
);

-- Tabela de medidas reutilizável. Ex.:
-- {"columns":["Tamanho","Altura (cm)","Busto (cm)"],"rows":[["2","86-92","52"],["4","98-104","56"]]}
create table size_charts (
  id    uuid primary key default gen_random_uuid(),
  name  text not null,
  chart jsonb not null,
  notes text
);

create table products (
  id               uuid primary key default gen_random_uuid(),
  name             text not null,
  slug             extensions.citext not null unique,
  description      text,
  category_id      uuid references categories (id) on delete set null,
  gender           gender not null default 'unissex',
  age_group        age_group not null,
  base_price       numeric(10,2) not null check (base_price >= 0),
  compare_at_price numeric(10,2) check (compare_at_price is null or compare_at_price >= 0), -- preço "de" (riscado)
  size_chart_id    uuid references size_charts (id) on delete set null,
  active           boolean not null default true,
  featured         boolean not null default false,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);
create index on products (category_id);
create index on products (active, gender, age_group);
create trigger products_updated_at before update on products
  for each row execute function set_updated_at();

create table product_collections (
  product_id    uuid references products (id) on delete cascade,
  collection_id uuid references collections (id) on delete cascade,
  primary key (product_id, collection_id)
);

create table product_variants (
  id             uuid primary key default gen_random_uuid(),
  product_id     uuid not null references products (id) on delete cascade,
  color_id       uuid references colors (id) on delete restrict,
  size_id        uuid not null references sizes (id) on delete restrict,
  sku            text unique,
  stock          int not null default 0 check (stock >= 0),
  price_override numeric(10,2) check (price_override is null or price_override >= 0),
  active         boolean not null default true,
  updated_at     timestamptz not null default now(),
  unique nulls not distinct (product_id, color_id, size_id)
);
create index on product_variants (product_id);
create trigger product_variants_updated_at before update on product_variants
  for each row execute function set_updated_at();

create table product_images (
  id           uuid primary key default gen_random_uuid(),
  product_id   uuid not null references products (id) on delete cascade,
  color_id     uuid references colors (id) on delete set null,   -- foto específica de uma cor
  storage_path text not null,
  alt          text,
  sort_order   int not null default 0
);
create index on product_images (product_id, sort_order);

-- ---------------------------------------------------------------------
-- Cupons
-- ---------------------------------------------------------------------
create table coupons (
  id              uuid primary key default gen_random_uuid(),
  code            extensions.citext not null unique,
  type            coupon_type not null,
  value           numeric(10,2) not null check (value > 0),
  min_order_value numeric(10,2) not null default 0,
  max_uses        int,
  used_count      int not null default 0,
  starts_at       timestamptz,
  expires_at      timestamptz,
  active          boolean not null default true,
  check (type <> 'percent' or value <= 100)
);

-- ---------------------------------------------------------------------
-- Pedidos
-- ---------------------------------------------------------------------
create table orders (
  id             uuid primary key default gen_random_uuid(),
  number         bigint generated always as identity (start with 1001) unique,
  customer_name  text not null,
  customer_phone text not null,
  notes          text,
  status         order_status not null default 'pending',
  subtotal       numeric(10,2) not null,
  discount       numeric(10,2) not null default 0,
  total          numeric(10,2) not null,
  coupon_id      uuid references coupons (id) on delete set null,
  coupon_code    text,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);
create index on orders (status, created_at desc);
create trigger orders_updated_at before update on orders
  for each row execute function set_updated_at();

-- Itens guardam um "retrato" do produto no momento da compra
create table order_items (
  id           uuid primary key default gen_random_uuid(),
  order_id     uuid not null references orders (id) on delete cascade,
  variant_id   uuid references product_variants (id) on delete set null,
  product_name text not null,
  color_name   text,
  size_label   text not null,
  unit_price   numeric(10,2) not null,
  quantity     int not null check (quantity > 0)
);
create index on order_items (order_id);

create table order_status_history (
  id         uuid primary key default gen_random_uuid(),
  order_id   uuid not null references orders (id) on delete cascade,
  status     order_status not null,
  changed_by uuid references auth.users (id),
  created_at timestamptz not null default now()
);

create table stock_movements (
  id         uuid primary key default gen_random_uuid(),
  variant_id uuid not null references product_variants (id) on delete cascade,
  delta      int not null check (delta <> 0),
  reason     stock_reason not null,
  order_id   uuid references orders (id) on delete set null,
  note       text,
  created_by uuid references auth.users (id),
  created_at timestamptz not null default now()
);
create index on stock_movements (variant_id, created_at desc);

-- ---------------------------------------------------------------------
-- Configurações da loja (linha única)
-- ---------------------------------------------------------------------
create table store_settings (
  id              int primary key default 1 check (id = 1),
  store_name      text not null default 'KakalKids Store',
  whatsapp_number text not null default '',   -- só dígitos, com DDI: 5583999999999
  instagram_url   text,
  hero_title      text,
  hero_subtitle   text,
  hero_image_url  text,
  updated_at      timestamptz not null default now()
);
insert into store_settings (id) values (1);

-- =====================================================================
-- View do catálogo (alimenta listagem e filtros dinâmicos)
-- =====================================================================
create view catalog_products with (security_invoker = true) as
select
  p.id, p.name, p.slug, p.gender, p.age_group, p.featured, p.created_at,
  p.category_id,
  c.slug as category_slug,
  coalesce(min(coalesce(v.price_override, p.base_price)), p.base_price) as min_price,
  p.compare_at_price,
  coalesce(sum(v.stock), 0) > 0 as in_stock,
  coalesce(array_agg(distinct s.label) filter (where v.stock > 0), '{}') as sizes_available,
  coalesce(array_agg(distinct co.name) filter (where v.stock > 0), '{}') as colors_available,
  (select i.storage_path from product_images i
    where i.product_id = p.id order by i.sort_order limit 1) as cover_image,
  coalesce((select array_agg(pc.collection_id) from product_collections pc
    where pc.product_id = p.id), '{}') as collection_ids
from products p
left join categories c on c.id = p.category_id
left join product_variants v on v.product_id = p.id and v.active
left join sizes s on s.id = v.size_id
left join colors co on co.id = v.color_id
where p.active
group by p.id, c.slug;

-- =====================================================================
-- Funções de negócio
-- =====================================================================

-- Pré-visualização do cupom no carrinho (o cliente não lê a tabela de cupons)
create or replace function preview_coupon(p_code text, p_subtotal numeric)
returns table (valid boolean, discount numeric, message text)
language plpgsql stable security definer set search_path = public, extensions
as $$
declare c coupons;
begin
  select * into c from coupons where code = p_code::extensions.citext;
  if not found or not c.active then
    return query select false, 0::numeric, 'Cupom inválido'; return;
  end if;
  if c.starts_at is not null and now() < c.starts_at then
    return query select false, 0::numeric, 'Cupom ainda não está ativo'; return;
  end if;
  if c.expires_at is not null and now() > c.expires_at then
    return query select false, 0::numeric, 'Cupom expirado'; return;
  end if;
  if c.max_uses is not null and c.used_count >= c.max_uses then
    return query select false, 0::numeric, 'Cupom esgotado'; return;
  end if;
  if p_subtotal < c.min_order_value then
    return query select false, 0::numeric,
      format('Pedido mínimo de R$ %s para este cupom', to_char(c.min_order_value, 'FM999990D00')); return;
  end if;
  return query select true,
    round(least(p_subtotal,
      case c.type when 'percent' then p_subtotal * c.value / 100 else c.value end), 2),
    'Cupom aplicado';
end;
$$;

-- Cria o pedido a partir do carrinho. Preços vêm do banco, nunca do navegador.
-- p_items: [{"variant_id":"…","quantity":2}, …]
create or replace function create_order(
  p_customer_name  text,
  p_customer_phone text,
  p_items          jsonb,
  p_coupon_code    text default null,
  p_notes          text default null
)
returns table (order_id uuid, order_number bigint, subtotal numeric, discount numeric, total numeric)
language plpgsql security definer set search_path = public, extensions
as $$
declare
  v_order_id uuid;
  v_number   bigint;
  v_subtotal numeric := 0;
  v_discount numeric := 0;
  v_coupon   coupons;
  v_cp       record;
  r          record;
begin
  if coalesce(trim(p_customer_name), '') = '' or coalesce(trim(p_customer_phone), '') = '' then
    raise exception 'Nome e telefone são obrigatórios';
  end if;
  if p_items is null or jsonb_array_length(p_items) = 0 then
    raise exception 'Carrinho vazio';
  end if;
  if jsonb_array_length(p_items) > 50 then
    raise exception 'Carrinho com itens demais';
  end if;

  insert into orders (customer_name, customer_phone, notes, subtotal, total)
  values (trim(p_customer_name), regexp_replace(p_customer_phone, '\D', '', 'g'),
          nullif(trim(p_notes), ''), 0, 0)
  returning id, number into v_order_id, v_number;

  for r in
    select v.id as variant_id, i.quantity, v.stock,
           coalesce(v.price_override, p.base_price) as price,
           p.name as product_name, co.name as color_name, s.label as size_label
    from jsonb_to_recordset(p_items) as i(variant_id uuid, quantity int)
    join product_variants v on v.id = i.variant_id and v.active
    join products p on p.id = v.product_id and p.active
    join sizes s on s.id = v.size_id
    left join colors co on co.id = v.color_id
  loop
    if r.quantity is null or r.quantity < 1 or r.quantity > 20 then
      raise exception 'Quantidade inválida para %', r.product_name;
    end if;
    if r.quantity > r.stock then
      raise exception 'Estoque insuficiente: % %tam. % (disponível: %)',
        r.product_name, coalesce(r.color_name || ' / ', ''), r.size_label, r.stock;
    end if;
    insert into order_items (order_id, variant_id, product_name, color_name, size_label, unit_price, quantity)
    values (v_order_id, r.variant_id, r.product_name, r.color_name, r.size_label, r.price, r.quantity);
    v_subtotal := v_subtotal + r.price * r.quantity;
  end loop;

  if (select count(*) from order_items where order_items.order_id = v_order_id)
     <> jsonb_array_length(p_items) then
    raise exception 'Algum item do carrinho não está mais disponível';
  end if;

  if nullif(trim(p_coupon_code), '') is not null then
    select * into v_cp from preview_coupon(p_coupon_code, v_subtotal);
    if not v_cp.valid then
      raise exception '%', v_cp.message;
    end if;
    v_discount := v_cp.discount;
    select * into v_coupon from coupons where code = p_coupon_code::extensions.citext;
  end if;

  update orders set
    subtotal    = v_subtotal,
    discount    = v_discount,
    total       = v_subtotal - v_discount,
    coupon_id   = v_coupon.id,
    coupon_code = v_coupon.code
  where id = v_order_id;

  insert into order_status_history (order_id, status) values (v_order_id, 'pending');

  return query select v_order_id, v_number, v_subtotal, v_discount, v_subtotal - v_discount;
end;
$$;

-- Muda o status do pedido (admin). Confirmar baixa estoque; cancelar um
-- pedido já confirmado devolve o estoque.
create or replace function set_order_status(p_order_id uuid, p_status order_status)
returns void
language plpgsql security definer set search_path = public, extensions
as $$
declare
  o orders;
  it record;
  was_reserved boolean;
  now_reserved boolean;
begin
  if not is_admin() then raise exception 'Acesso negado'; end if;

  select * into o from orders where id = p_order_id for update;
  if not found then raise exception 'Pedido não encontrado'; end if;
  if o.status = p_status then return; end if;
  if o.status = 'canceled' then raise exception 'Pedido cancelado não pode ser reaberto'; end if;

  was_reserved := o.status in ('confirmed', 'shipped', 'delivered');
  now_reserved := p_status in ('confirmed', 'shipped', 'delivered');

  if not was_reserved and now_reserved then
    -- baixa de estoque (trava as variações para evitar venda dupla)
    for it in
      select oi.variant_id, oi.quantity, oi.product_name, oi.size_label, v.stock
      from order_items oi join product_variants v on v.id = oi.variant_id
      where oi.order_id = p_order_id
      for update of v
    loop
      if it.stock < it.quantity then
        raise exception 'Estoque insuficiente para % (%): disponível %',
          it.product_name, it.size_label, it.stock;
      end if;
      update product_variants set stock = stock - it.quantity where id = it.variant_id;
      insert into stock_movements (variant_id, delta, reason, order_id, created_by)
      values (it.variant_id, -it.quantity, 'venda', p_order_id, auth.uid());
    end loop;
    if o.coupon_id is not null then
      update coupons set used_count = used_count + 1 where id = o.coupon_id;
    end if;

  elsif was_reserved and p_status = 'canceled' then
    -- devolve o estoque
    for it in select variant_id, quantity from order_items
              where order_id = p_order_id and variant_id is not null
    loop
      update product_variants set stock = stock + it.quantity where id = it.variant_id;
      insert into stock_movements (variant_id, delta, reason, order_id, created_by)
      values (it.variant_id, it.quantity, 'cancelamento', p_order_id, auth.uid());
    end loop;
    if o.coupon_id is not null then
      update coupons set used_count = greatest(used_count - 1, 0) where id = o.coupon_id;
    end if;
  end if;

  update orders set status = p_status where id = p_order_id;
  insert into order_status_history (order_id, status, changed_by)
  values (p_order_id, p_status, auth.uid());
end;
$$;

-- Entrada / ajuste manual de estoque pelo painel (admin)
create or replace function adjust_stock(
  p_variant_id uuid, p_delta int, p_reason stock_reason default 'entrada', p_note text default null
)
returns int
language plpgsql security definer set search_path = public, extensions
as $$
declare new_stock int;
begin
  if not is_admin() then raise exception 'Acesso negado'; end if;
  if p_reason in ('venda', 'cancelamento') then
    raise exception 'Use o fluxo de pedidos para vendas e cancelamentos';
  end if;
  update product_variants set stock = stock + p_delta
  where id = p_variant_id returning stock into new_stock;
  if not found then raise exception 'Variação não encontrada'; end if;
  insert into stock_movements (variant_id, delta, reason, note, created_by)
  values (p_variant_id, p_delta, p_reason, p_note, auth.uid());
  return new_stock;
end;
$$;

-- =====================================================================
-- Row Level Security
-- =====================================================================
alter table admins               enable row level security;
alter table categories           enable row level security;
alter table collections          enable row level security;
alter table sizes                enable row level security;
alter table colors               enable row level security;
alter table size_charts          enable row level security;
alter table products             enable row level security;
alter table product_collections  enable row level security;
alter table product_variants     enable row level security;
alter table product_images       enable row level security;
alter table coupons              enable row level security;
alter table orders               enable row level security;
alter table order_items          enable row level security;
alter table order_status_history enable row level security;
alter table stock_movements      enable row level security;
alter table store_settings       enable row level security;

-- Leitura pública da vitrine
create policy "public read" on categories          for select using (active or is_admin());
create policy "public read" on collections         for select using (active or is_admin());
create policy "public read" on sizes               for select using (true);
create policy "public read" on colors              for select using (true);
create policy "public read" on size_charts         for select using (true);
create policy "public read" on products            for select using (active or is_admin());
create policy "public read" on product_collections for select using (true);
create policy "public read" on product_variants    for select using (active or is_admin());
create policy "public read" on product_images      for select using (true);
create policy "public read" on store_settings      for select using (true);

-- Admin pode tudo nas tabelas de gestão
create policy "admin write" on categories          for all using (is_admin()) with check (is_admin());
create policy "admin write" on collections         for all using (is_admin()) with check (is_admin());
create policy "admin write" on sizes               for all using (is_admin()) with check (is_admin());
create policy "admin write" on colors              for all using (is_admin()) with check (is_admin());
create policy "admin write" on size_charts         for all using (is_admin()) with check (is_admin());
create policy "admin write" on products            for all using (is_admin()) with check (is_admin());
create policy "admin write" on product_collections for all using (is_admin()) with check (is_admin());
create policy "admin write" on product_images      for all using (is_admin()) with check (is_admin());
create policy "admin write" on coupons             for all using (is_admin()) with check (is_admin());
create policy "admin write" on store_settings      for update using (is_admin()) with check (is_admin());

-- Variações: admin cria/edita dados, mas o estoque só muda pelas funções
create policy "admin write" on product_variants for all using (is_admin()) with check (is_admin());

-- Pedidos e histórico: só admin lê (criação é via create_order)
create policy "admin read" on orders               for select using (is_admin());
create policy "admin edit" on orders               for update using (is_admin()) with check (is_admin());
create policy "admin read" on order_items          for select using (is_admin());
create policy "admin read" on order_status_history for select using (is_admin());
create policy "admin read" on stock_movements      for select using (is_admin());
create policy "admin read" on admins               for select using (user_id = auth.uid());

-- Permissões base (o RLS acima decide as linhas; aqui decidimos as tabelas)
grant usage on schema public to anon, authenticated;
grant select on categories, collections, sizes, colors, size_charts, products,
  product_collections, product_variants, product_images, store_settings, catalog_products
  to anon, authenticated;
grant insert, update, delete on categories, collections, sizes, colors, size_charts, products,
  product_collections, product_variants, product_images, coupons
  to authenticated;
grant select on coupons, orders, order_items, order_status_history, stock_movements, admins
  to authenticated;
grant update on store_settings to authenticated;
revoke all on coupons, orders, order_items, order_status_history, stock_movements, admins from anon;

-- Protege colunas: nem o admin altera estoque/totais "na mão" pelo client.
-- (revoke na tabela inteira + grant só nas colunas editáveis)
revoke update on product_variants from anon, authenticated;
grant update (product_id, color_id, size_id, sku, price_override, active)
  on product_variants to authenticated;
revoke update on orders from anon, authenticated;
grant update (customer_name, customer_phone, notes) on orders to authenticated;
revoke update on coupons from anon, authenticated;
grant update (code, type, value, min_order_value, max_uses, starts_at, expires_at, active)
  on coupons to authenticated;
revoke insert, delete on orders, order_items, order_status_history, stock_movements
  from anon, authenticated;

-- Estoque inicial de uma variação nova também entra no histórico
create or replace function log_initial_stock()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.stock > 0 then
    insert into stock_movements (variant_id, delta, reason, note, created_by)
    values (new.id, new.stock, 'entrada', 'Estoque inicial', auth.uid());
  end if;
  return new;
end;
$$;
create trigger product_variants_initial_stock after insert on product_variants
  for each row execute function log_initial_stock();

-- Funções expostas
revoke execute on function create_order, preview_coupon, set_order_status, adjust_stock from public;
grant execute on function create_order(text, text, jsonb, text, text) to anon, authenticated;
grant execute on function preview_coupon(text, numeric)               to anon, authenticated;
grant execute on function set_order_status(uuid, order_status)        to authenticated;
grant execute on function adjust_stock(uuid, int, stock_reason, text) to authenticated;

-- =====================================================================
-- Storage: bucket público de imagens, escrita só para admin
-- =====================================================================
insert into storage.buckets (id, name, public)
values ('product-images', 'product-images', true)
on conflict (id) do nothing;

create policy "admin upload images" on storage.objects for insert
  with check (bucket_id = 'product-images' and is_admin());
create policy "admin update images" on storage.objects for update
  using (bucket_id = 'product-images' and is_admin());
create policy "admin delete images" on storage.objects for delete
  using (bucket_id = 'product-images' and is_admin());

-- =====================================================================
-- Seed: tamanhos (RN a 18 anos, conforme o perfil da loja)
-- =====================================================================
insert into sizes (label, age_group, sort_order) values
  ('RN', 'bebe', 1), ('P', 'bebe', 2), ('M', 'bebe', 3), ('G', 'bebe', 4), ('GG', 'bebe', 5),
  ('1', 'infantil', 10), ('2', 'infantil', 11), ('3', 'infantil', 12), ('4', 'infantil', 13),
  ('6', 'infantil', 14), ('8', 'infantil', 15), ('10', 'infantil', 16),
  ('12', 'teen', 20), ('14', 'teen', 21), ('16', 'teen', 22), ('18', 'teen', 23);
