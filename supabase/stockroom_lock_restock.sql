-- ─────────────────────────────────────────────────────────────
-- Run once in the STOCKROOM (inventory) database. Changes no existing data.
--
-- Makes "put a cancelled order's shoes back" private:
--   * the old restock_order(reference) is closed to the public key
--   * a new restock_order(reference, secret) only works when given the secret,
--     which lives only on the Moderna website's server (never in the browser)
--   * only a fingerprint (hash) of the secret is stored here, never the secret
-- ─────────────────────────────────────────────────────────────

create table if not exists web_secrets (
  name text primary key,
  hash text not null
);
alter table web_secrets enable row level security;
revoke all on web_secrets from anon, authenticated;

insert into web_secrets (name, hash)
values ('restock', 'f9e455d0cf407083d93761e8e1901e336853350a4024a7a884d23643c3e7a1a1')
on conflict (name) do nothing;

-- Close the old public version.
revoke execute on function restock_order(text) from public, anon, authenticated;

create or replace function restock_order(p_reference text, p_secret text)
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
  if p_secret is null
     or not exists (
       select 1 from web_secrets
       where name = 'restock'
         and hash = encode(sha256(convert_to(p_secret, 'utf8')), 'hex')
     ) then
    raise exception 'not allowed';
  end if;

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

grant execute on function restock_order(text, text) to anon;
