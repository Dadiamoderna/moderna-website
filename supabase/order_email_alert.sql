-- ─────────────────────────────────────────────────────────────
-- Run once in MODERNA's Supabase → SQL Editor. Add-only, deletes nothing.
-- Emails you every time an order is saved, straight from the database, so
-- an alert can't be lost if the customer closes their browser.
--
-- It stays silent until you store your Resend key and email in private_config
-- (see the two UPDATE lines at the bottom). It can never block an order: if
-- the email fails for any reason, the order is still saved.
-- ─────────────────────────────────────────────────────────────

create extension if not exists pg_net with schema extensions;

-- Private settings. RLS on with no policies + no grants = the website and the
-- public key can never read it; only the database itself can.
create table if not exists private_config (
  name text primary key,
  value text not null
);
alter table private_config enable row level security;
revoke all on private_config from anon, authenticated;

insert into private_config (name, value) values
  ('resend_api_key', 'PASTE_KEY_HERE'),
  ('notify_to', 'PASTE_EMAIL_HERE')
on conflict (name) do nothing;

create or replace function notify_new_order()
returns trigger
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_key text;
  v_to text;
  v_items text;
  v_how text;
  v_total text;
begin
  select value into v_key from private_config where name = 'resend_api_key';
  select value into v_to from private_config where name = 'notify_to';
  if v_key is null or v_key = '' or v_key like 'PASTE%' or v_to is null or v_to like 'PASTE%' then
    return new; -- not set up yet
  end if;

  select string_agg(
           '- ' || coalesce(i->>'name', '?')
           || case
                when coalesce(i->>'size', '') <> '' or coalesce(i->>'color', '') <> ''
                then ' (' || concat_ws(', ',
                       case when coalesce(i->>'size', '') <> '' then 'size ' || (i->>'size') end,
                       nullif(i->>'color', '')) || ')'
                else ''
              end
           || ' x ' || coalesce(i->>'quantity', '1'),
           E'\n')
    into v_items
  from jsonb_array_elements(new.items) i;

  v_how := case when new.fulfillment = 'delivery' then 'Delivery' else 'Pickup' end;
  v_total := to_char(new.subtotal, 'FM999990.00');

  perform net.http_post(
    url := 'https://api.resend.com/emails',
    headers := jsonb_build_object(
      'Authorization', 'Bearer ' || v_key,
      'Content-Type', 'application/json'
    ),
    body := jsonb_build_object(
      'from', 'Moderna Orders <onboarding@resend.dev>',
      'to', jsonb_build_array(v_to),
      'subject', 'New Moderna order - $' || v_total || ' (' || v_how || ')',
      'text',
        'New order from ' || coalesce(new.customer_name, '') || E'\n'
        || 'Phone: ' || coalesce(new.phone, '') || E'\n'
        || case when new.fulfillment = 'delivery'
                then 'Delivery to: ' || coalesce(new.address, '')
                else 'Pickup at KOURA' end
        || E'\n\nItems:\n' || coalesce(v_items, '(none)')
        || E'\n\nTotal: $' || v_total || ' (cash on ' || lower(v_how) || ')'
        || E'\n\nOpen your orders: https://moderna-blue.vercel.app/admin'
    )
  );

  return new;
exception when others then
  return new; -- never block an order because an alert failed
end;
$$;

create or replace trigger notify_new_order_trigger
  after insert on orders
  for each row execute function notify_new_order();

-- ─── After creating your free Resend account and API key, run these two ───
-- update private_config set value = 're_...your key...' where name = 'resend_api_key';
-- update private_config set value = 'you@example.com'  where name = 'notify_to';
