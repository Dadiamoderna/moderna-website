-- ─────────────────────────────────────────────────────────────
-- Run once in the STOCKROOM (inventory) database. Changes no existing data.
--
-- Lets a cancelled website order put its shoes back:
--   * take_stock now also writes a small receipt (web_holds) saying exactly
--     which pair(s) an order took, tagged with the order's reference code
--   * restock_order(reference) puts back exactly what that order took, once
--     (a second call does nothing), so it can never add stock out of thin air
-- ─────────────────────────────────────────────────────────────

-- Receipts. RLS on with no policies and no grants: the public key can't see them.
create table if not exists web_holds (
  id uuid primary key default gen_random_uuid(),
  reference text not null,
  name text not null,
  size text not null default '',
  color text not null default '',
  shop_id text not null,
  qty integer not null check (qty > 0),
  restored boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists web_holds_reference_idx on web_holds (reference);
alter table web_holds enable row level security;
revoke all on web_holds from anon, authenticated;

-- Same as before, plus: when an item carries an order reference, record a receipt.
create or replace function take_stock(p_items jsonb)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  it jsonb; v_name text; v_size text; v_color text; v_qty integer; v_ref text;
  v_id text; v_variants jsonb; v_new jsonb; v_elem jsonb; v_out jsonb;
  v_shops jsonb; v_remaining integer; v_key text; v_have integer; v_take integer;
begin
  if jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) > 20 then
    raise exception 'bad request';
  end if;

  for it in select value from jsonb_array_elements(p_items) loop
    v_name  := it->>'name';
    v_size  := coalesce(it->>'size', '');
    v_color := coalesce(it->>'color', '');
    v_qty   := coalesce((it->>'quantity')::integer, 0);
    v_ref   := nullif(it->>'reference', '');
    if v_ref is not null and v_ref !~ '^MOD-[A-Z0-9]{4,12}$' then
      v_ref := null;
    end if;
    if v_name is null or v_qty < 1 or v_qty > 10 then
      raise exception 'bad request';
    end if;

    select id, variants into v_id, v_variants
    from inventory where name = v_name limit 1 for update;
    if v_id is null then continue; end if;

    v_new := '[]'::jsonb;
    v_remaining := v_qty;

    for v_elem in select value from jsonb_array_elements(coalesce(v_variants, '[]'::jsonb)) loop
      v_out := v_elem;
      if v_remaining > 0
         and coalesce(v_elem->>'size', '') = v_size
         and (v_color = '' or lower(coalesce(v_elem->>'color', '')) = lower(v_color)) then
        v_shops := coalesce(v_elem->'shopQtys', '{}'::jsonb);
        for v_key in select jsonb_object_keys(v_shops) loop
          v_have := coalesce((v_shops->>v_key)::integer, 0);
          v_take := least(v_have, v_remaining);
          if v_take > 0 then
            v_shops := jsonb_set(v_shops, array[v_key], to_jsonb(v_have - v_take));
            v_remaining := v_remaining - v_take;
            if v_ref is not null then
              insert into web_holds (reference, name, size, color, shop_id, qty)
              values (v_ref, v_name, coalesce(v_elem->>'size', ''), coalesce(v_elem->>'color', ''), v_key, v_take);
            end if;
          end if;
        end loop;
        v_out := jsonb_set(v_elem, '{shopQtys}', v_shops);
      end if;
      v_new := v_new || jsonb_build_array(v_out);
    end loop;

    if v_remaining > 0 then
      raise exception 'insufficient stock: % (size %)', v_name, v_size;
    end if;

    update inventory
    set variants = v_new, quantity = greatest(0, coalesce(quantity, 0) - v_qty)
    where id = v_id;
  end loop;
  return true;
end;
$$;

-- Puts back exactly what one order took, once. Returns how many pairs went back.
create or replace function restock_order(p_reference text)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  h record;
  v_id text; v_variants jsonb; v_new jsonb; v_elem jsonb; v_out jsonb; v_shops jsonb;
  v_done boolean;
  v_restored integer := 0;
begin
  if p_reference is null or p_reference !~ '^MOD-[A-Z0-9]{4,12}$' then
    raise exception 'bad request';
  end if;

  for h in
    select * from web_holds
    where reference = p_reference and not restored
    order by created_at, id
    for update
  loop
    select id, variants into v_id, v_variants
    from inventory where name = h.name limit 1 for update;

    if v_id is not null then
      v_new := '[]'::jsonb;
      v_done := false;
      for v_elem in select value from jsonb_array_elements(coalesce(v_variants, '[]'::jsonb)) loop
        v_out := v_elem;
        if not v_done
           and coalesce(v_elem->>'size', '') = h.size
           and coalesce(v_elem->>'color', '') = h.color then
          v_shops := coalesce(v_elem->'shopQtys', '{}'::jsonb);
          v_shops := jsonb_set(v_shops, array[h.shop_id],
                       to_jsonb(coalesce((v_shops->>h.shop_id)::integer, 0) + h.qty));
          v_out := jsonb_set(v_elem, '{shopQtys}', v_shops);
          v_done := true;
        end if;
        v_new := v_new || jsonb_build_array(v_out);
      end loop;

      if v_done then
        update inventory
        set variants = v_new, quantity = coalesce(quantity, 0) + h.qty
        where id = v_id;
        v_restored := v_restored + h.qty;
      end if;
    end if;

    update web_holds set restored = true where id = h.id;
  end loop;

  return v_restored;
end;
$$;

grant execute on function take_stock(jsonb) to anon;
grant execute on function restock_order(text) to anon;
