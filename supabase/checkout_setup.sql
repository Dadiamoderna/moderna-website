-- ─────────────────────────────────────────────────────────────
-- Run once in MODERNA's Supabase → SQL Editor. Safe: adds only, deletes nothing.
-- (Already applied on 2026-10-28.)
-- Adds the collection tags and prepares the existing orders table for
-- on-site checkout. The orders table already allows anyone to insert and
-- only the logged-in admin to read/update/delete.
-- ─────────────────────────────────────────────────────────────

alter table products add column if not exists new_collection boolean not null default false;
alter table products add column if not exists last_pairs boolean not null default false;
alter table products add column if not exists twenty_dollar boolean not null default false;

alter table orders add column if not exists fulfillment text not null default 'pickup';
-- legacy column from an earlier version; give it a default so inserts don't need it
alter table orders alter column payment_method set default 'cash';
