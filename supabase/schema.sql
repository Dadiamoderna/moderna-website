-- ─────────────────────────────────────────────────────────────
-- Run this once in Supabase → SQL Editor → New query → Run
-- ─────────────────────────────────────────────────────────────

create table if not exists products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text default '',
  price numeric(10,2) not null default 0,
  category text not null default 'Heels',
  sizes text[] default '{}',       -- e.g. {"36","37","38","39","40"}
  colors text[] default '{}',      -- e.g. {"Black","Nude"}
  images text[] default '{}',      -- public storage URLs, first = cover image
  in_stock boolean not null default true,
  featured boolean not null default false,
  created_at timestamptz not null default now()
);

-- Keep newest-first browsing fast
create index if not exists products_created_at_idx on products (created_at desc);
create index if not exists products_category_idx on products (category);

-- Row Level Security: anyone can read, only a logged-in admin can write
alter table products enable row level security;

create policy "Public can read products"
  on products for select
  using (true);

create policy "Authenticated can insert products"
  on products for insert
  to authenticated
  with check (true);

create policy "Authenticated can update products"
  on products for update
  to authenticated
  using (true);

create policy "Authenticated can delete products"
  on products for delete
  to authenticated
  using (true);

-- ─────────────────────────────────────────────────────────────
-- Storage bucket for product photos
-- Go to Storage tab → New bucket → name it "product-images" → set Public ✔
-- Then run the policies below (Storage → product-images → Policies → New policy → paste SQL)
-- ─────────────────────────────────────────────────────────────

create policy "Public can view product images"
  on storage.objects for select
  using (bucket_id = 'product-images');

create policy "Authenticated can upload product images"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'product-images');

create policy "Authenticated can delete product images"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'product-images');
