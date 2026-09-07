-- Run this once in Moderna's Supabase → SQL Editor → New query → Run
-- Adds a per-product discount percentage (0 = no discount).

alter table products add column if not exists discount_percent integer not null default 0;
