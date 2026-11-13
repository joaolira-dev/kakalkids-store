-- =====================================================================
-- 0002 — Forma de entrega no pedido
-- O cliente escolhe Retirar / Entrega local / Correios no checkout.
-- create_order passa a devolver os itens com os preços calculados no banco,
-- para montar a mensagem do WhatsApp com valores confiáveis.
-- =====================================================================

create type delivery_method as enum ('pickup', 'local_delivery', 'shipping');

alter table orders
  add column delivery_method delivery_method not null default 'pickup';

drop function if exists create_order(text, text, jsonb, text, text);

create or replace function create_order(
  p_customer_name   text,
  p_customer_phone  text,
  p_items           jsonb,
  p_delivery_method delivery_method,
  p_coupon_code     text default null,
  p_notes           text default null
)
returns jsonb
language plpgsql security definer set search_path = public, extensions
as $$
declare
  v_order_id uuid;
  v_number   bigint;
  v_subtotal numeric := 0;
  v_discount numeric := 0;
  v_coupon   coupons;
  v_cp       record;
  v_phone    text := regexp_replace(coalesce(p_customer_phone, ''), '\D', '', 'g');
  r          record;
begin
  if coalesce(trim(p_customer_name), '') = '' then
    raise exception 'Informe seu nome';
  end if;
  if length(v_phone) not between 10 and 13 then
    raise exception 'Informe um telefone válido com DDD';
  end if;
  if p_items is null or jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 then
    raise exception 'Sua sacola está vazia';
  end if;
  if jsonb_array_length(p_items) > 50 then
    raise exception 'Sacola com itens demais';
  end if;

  insert into orders (customer_name, customer_phone, notes, delivery_method, subtotal, total)
  values (left(trim(p_customer_name), 120), v_phone, left(nullif(trim(p_notes), ''), 500),
          p_delivery_method, 0, 0)
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
    raise exception 'Algum item da sacola não está mais disponível';
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

  return jsonb_build_object(
    'order_id', v_order_id,
    'order_number', v_number,
    'subtotal', v_subtotal,
    'discount', v_discount,
    'total', v_subtotal - v_discount,
    'coupon_code', v_coupon.code,
    'items', (
      select jsonb_agg(jsonb_build_object(
        'name', product_name, 'color', color_name, 'size', size_label,
        'unit_price', unit_price, 'quantity', quantity) order by product_name, size_label)
      from order_items where order_items.order_id = v_order_id
    )
  );
end;
$$;

revoke execute on function create_order(text, text, jsonb, delivery_method, text, text) from public;
grant execute on function create_order(text, text, jsonb, delivery_method, text, text) to anon, authenticated;
