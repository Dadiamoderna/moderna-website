-- ─────────────────────────────────────────────────────────────
-- Run this once in the STOCKROOM (inventory) Supabase → SQL Editor → Run
--
-- Lets the website take stock for the items in an order — all or nothing:
--   * if any size/color is short, NOTHING is taken and the order is refused
--   * stock can never go below zero, so the site can't oversell
--   * rows are locked while updating, so two customers ordering the last
--     pair at the same moment can't both get it
-- Installing it changes no data; it only adds this one function.
-- ─────────────────────────────────────────────────────────────

create or replace function take_stock(p_items jsonb)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  it jsonb;
  v_name text;
  v_size text;
  v_color text;
  v_qty integer;
  v_id text;
  v_variants jsonb;
  v_new jsonb;
  v_elem jsonb;
  v_out jsonb;
  v_shops jsonb;
  v_remaining integer;
  v_key text;
  v_have integer;
  v_take integer;
begin
  if jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) > 20 then
    raise exception 'bad request';
  end if;

  for it in select value from jsonb_array_elements(p_items) loop
    v_name  := it->>'name';
    v_size  := coalesce(it->>'size', '');
    v_color := coalesce(it->>'color', '');
    v_qty   := coalesce((it->>'quantity')::integer, 0);

    if v_name is null or v_qty < 1 or v_qty > 10 then
      raise exception 'bad request';
    end if;

    select id, variants into v_id, v_variants
    from inventory
    where name = v_name
    limit 1
    for update;

    if v_id is null then
      continue; -- not tracked in Stockroom, nothing to take
    end if;

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
    set variants = v_new,
        quantity = greatest(0, coalesce(quantity, 0) - v_qty)
    where id = v_id;
  end loop;

  return true;
end;
$$;

grant execute on function take_stock(jsonb) to anon;
