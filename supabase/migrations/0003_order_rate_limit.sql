-- =====================================================================
-- 0003 — Anti-spam no checkout
-- Limita pedidos "aguardando confirmação" por telefone e no total por hora,
-- para ninguém lotar o painel com pedidos falsos.
-- =====================================================================

create index if not exists orders_phone_created_idx on orders (customer_phone, created_at desc);

create or replace function enforce_order_rate_limit()
returns trigger
language plpgsql security definer set search_path = public
as $$
begin
  if (select count(*) from orders
      where customer_phone = new.customer_phone
        and created_at > now() - interval '1 hour') >= 5 then
    raise exception 'Muitos pedidos seguidos com este telefone. Fale com a gente pelo WhatsApp';
  end if;

  if (select count(*) from orders
      where status = 'pending'
        and created_at > now() - interval '1 hour') >= 60 then
    raise exception 'Estamos recebendo muitos pedidos agora. Tente de novo em alguns minutos ou chame no WhatsApp';
  end if;

  return new;
end;
$$;

drop trigger if exists orders_rate_limit on orders;
create trigger orders_rate_limit before insert on orders
  for each row execute function enforce_order_rate_limit();
