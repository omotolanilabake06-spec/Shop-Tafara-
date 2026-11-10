-- Shop Tafara database schema for Supabase (Postgres).
-- Mirrors the types in src/lib/types.ts, src/lib/orders/types.ts and src/lib/payments/types.ts.
-- Safe to run more than once (`pnpm db:schema`, or paste into the SQL editor). Money is whole naira.
--
-- Access model: the server reads and writes everything with the secret (service-role) key, which
-- bypasses RLS and never reaches the browser. RLS is on for every table, and the publishable (anon)
-- key can only read what is on sale, so a leaked publishable key exposes nothing private.

create extension if not exists "pgcrypto";

-- Catalogue -------------------------------------------------------------------------------

create table if not exists categories (
  slug        text primary key,
  name        text not null,
  parent      text references categories(slug) on delete restrict,
  department  text not null check (department in ('clothing', 'home')),
  visible     boolean not null default true,
  blurb       text,
  sort_order  integer not null default 0
);

create table if not exists collections (
  slug     text primary key,
  name     text not null,
  tagline  text not null default '',
  intro    text not null default '',
  image    text not null
);

create table if not exists products (
  id           text primary key default ('prd_' || substr(replace(gen_random_uuid()::text, '-', ''), 1, 12)),
  slug         text not null unique,
  kind         text not null check (kind in ('clothing', 'home')),
  status       text not null default 'draft' check (status in ('active', 'draft')),
  name         text not null,
  description  text not null default '',
  collection   text references collections(slug) on delete set null,
  categories   text[] not null default '{}',
  images       jsonb not null default '[]',   -- [{ src, alt }]
  specs        jsonb not null default '[]',   -- [{ label, value }]
  sort_order   integer not null default 0,
  -- clothing only
  price        integer check (price is null or price > 0),
  colours      text[] not null default '{}',
  sizes        text[] not null default '{}',
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
create index if not exists products_status_idx on products (status, sort_order);

-- TAFARA HOME: priced and stocked per scent + size.
create table if not exists product_variants (
  id          text primary key,
  product_id  text not null references products(id) on delete cascade,
  scent       text not null,
  size        text not null,
  price       integer not null check (price > 0),
  stock       integer not null default 0 check (stock >= 0),
  sort_order  integer not null default 0,
  unique (product_id, scent, size)
);
create index if not exists product_variants_product_idx on product_variants (product_id);

-- Swaps a product's variants for a new list in one transaction, so a failed save never leaves
-- a candle with half its sizes.
create or replace function replace_product_variants(p_product text, p_variants jsonb) returns void
language plpgsql as $$
begin
  delete from product_variants where product_id = p_product;
  insert into product_variants (id, product_id, scent, size, price, stock, sort_order)
  select v->>'id', p_product, v->>'scent', v->>'size', (v->>'price')::integer, (v->>'stock')::integer, (ord - 1)::integer
  from jsonb_array_elements(p_variants) with ordinality as t(v, ord);
end $$;

-- Lowers stock atomically when an order is paid; never below zero. Returns false if short.
create or replace function take_stock(p_variant text, p_qty integer) returns boolean
language plpgsql as $$
begin
  update product_variants set stock = stock - p_qty where id = p_variant and stock >= p_qty;
  return found;
end $$;

-- Orders ----------------------------------------------------------------------------------

create sequence if not exists order_number_seq start 10500;

create table if not exists orders (
  number          text primary key default ('TAF-' || nextval('order_number_seq')),
  -- URL-safe secret for the tracking link.
  access_key      text not null default substr(md5(gen_random_uuid()::text), 1, 12),
  placed_at       timestamptz not null default now(),
  status          text not null check (status in ('confirmed', 'in_production', 'ready', 'dispatched', 'delivered', 'cancelled')),
  customer_name   text not null,
  customer_email  text not null,
  customer_phone  text not null,
  delivery        jsonb not null,           -- { method, label, address[], fee }
  subtotal        integer not null,
  total           integer not null,
  note            text,
  payment         jsonb not null,           -- { provider, reference, channel, paidAt }
  ready_from      date not null,            -- promise fixed at payment time
  ready_to        date not null,
  dispatch        jsonb,                    -- { courier, trackingNumber }
  cancel_reason   text
);
create index if not exists orders_status_idx on orders (status, placed_at desc);
create index if not exists orders_email_idx on orders (lower(customer_email));

create table if not exists order_items (
  id           bigint generated always as identity primary key,
  order_number text not null references orders(number) on delete cascade,
  slug         text not null,                -- snapshot: survives the product being edited or deleted
  name         text not null,
  image        text not null,
  kind         text not null check (kind in ('clothing', 'home')),
  options      jsonb not null default '[]',  -- [{ label, value }]
  qty          integer not null check (qty > 0),
  unit_price   integer not null
);
create index if not exists order_items_order_idx on order_items (order_number);

create table if not exists order_events (
  id           bigint generated always as identity primary key,
  order_number text not null references orders(number) on delete cascade,
  status       text not null,
  at           timestamptz not null default now(),
  note         text
);
create index if not exists order_events_order_idx on order_events (order_number);

create table if not exists order_messages (
  id           bigint generated always as identity primary key,
  order_number text not null references orders(number) on delete cascade,
  channel      text not null check (channel in ('email', 'sms')),
  "to"         text not null,
  about        text not null,
  at           timestamptz not null default now(),
  result       text check (result in ('sent', 'logged', 'failed')),
  error        text
);
create index if not exists order_messages_order_idx on order_messages (order_number);

create table if not exists order_notes (
  id           bigint generated always as identity primary key,
  order_number text not null references orders(number) on delete cascade,
  text         text not null,
  at           timestamptz not null default now(),
  author       text
);
create index if not exists order_notes_order_idx on order_notes (order_number);

-- Payments --------------------------------------------------------------------------------

create table if not exists payments (
  reference        text primary key,         -- Paystack reference
  order_number     text references orders(number) on delete set null,
  customer_name    text not null,
  customer_email   text not null,
  amount           integer not null,
  fees             integer not null default 0,
  refunded         integer not null default 0,
  channel          text not null check (channel in ('card', 'bank_transfer', 'ussd')),
  method           text not null,
  status           text not null check (status in ('success', 'failed', 'abandoned', 'refunded', 'partially_refunded')),
  gateway_response text,
  created_at       timestamptz not null default now(),
  paid_at          timestamptz
);
create index if not exists payments_created_idx on payments (created_at desc);
create index if not exists payments_order_idx on payments (order_number);

create table if not exists payment_events (
  id         bigint generated always as identity primary key,
  reference  text not null references payments(reference) on delete cascade,
  type       text not null check (type in ('initialized', 'success', 'failed', 'abandoned', 'refund', 'note')),
  message    text not null,
  by         text,
  at         timestamptz not null default now()
);
create index if not exists payment_events_reference_idx on payment_events (reference);

-- Settings: one row, the whole object as JSON (shape: Settings in src/lib/types.ts).
create table if not exists settings (
  id    boolean primary key default true check (id),
  data  jsonb not null
);

-- Newsletter sign-ups from the website.
create table if not exists newsletter_subscribers (
  email       text primary key,
  first_name  text,
  source      text not null default 'popup',
  created_at  timestamptz not null default now()
);

-- Row level security ---------------------------------------------------------------------

alter table categories       enable row level security;
alter table collections      enable row level security;
alter table products         enable row level security;
alter table product_variants enable row level security;
alter table orders           enable row level security;
alter table order_items      enable row level security;
alter table order_events     enable row level security;
alter table order_messages   enable row level security;
alter table order_notes      enable row level security;
alter table payments         enable row level security;
alter table payment_events   enable row level security;
alter table settings         enable row level security;
alter table newsletter_subscribers enable row level security;

-- Public can read only what is on sale. No public policies on orders, payments or settings:
-- those are read and written by the server with the secret key.
drop policy if exists "public reads visible categories" on categories;
create policy "public reads visible categories" on categories for select using (visible);
drop policy if exists "public reads collections" on collections;
create policy "public reads collections" on collections for select using (true);
drop policy if exists "public reads published products" on products;
create policy "public reads published products" on products for select using (status = 'active');
drop policy if exists "public reads variants of published products" on product_variants;
create policy "public reads variants of published products" on product_variants for select
  using (exists (select 1 from products p where p.id = product_id and p.status = 'active'));

-- Functions change data, so only the server may call them (Postgres lets everyone by default).
revoke execute on function take_stock(text, integer) from public, anon, authenticated;
revoke execute on function replace_product_variants(text, jsonb) from public, anon, authenticated;
grant execute on function take_stock(text, integer) to service_role;
grant execute on function replace_product_variants(text, jsonb) to service_role;

-- Storage: a public bucket for product and collection photos. Uploads go through the server.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('media', 'media', true, 8388608, array['image/jpeg', 'image/png', 'image/webp', 'image/avif'])
on conflict (id) do update set public = excluded.public, file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- Journal ------------------------------------------------------------------------------
create table if not exists journal_posts (
  id            text primary key,
  slug          text not null unique,
  status        text not null default 'draft' check (status in ('draft', 'published')),
  title         text not null,
  topic         text not null default '',
  excerpt       text not null default '',
  cover         text,
  cover_alt     text not null default '',
  body          text not null default '',
  products      text[] not null default '{}',
  published_at  timestamptz,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
create index if not exists journal_posts_published_idx on journal_posts (status, published_at desc);
alter table journal_posts enable row level security;
drop policy if exists "public reads published journal posts" on journal_posts;
create policy "public reads published journal posts" on journal_posts for select using (status = 'published');

-- Bank-transfer checkout ---------------------------------------------------------------------
-- Orders wait in 'pending_payment' until the studio confirms the transfer reached the account.
alter table orders drop constraint if exists orders_status_check;
alter table orders add constraint orders_status_check check (status in ('pending_payment', 'confirmed', 'in_production', 'ready', 'dispatched', 'delivered', 'cancelled'));
-- Receipts customers upload at checkout. Private: the admin sees them through short-lived signed links.
insert into storage.buckets (id, name, public, file_size_limit) values ('receipts', 'receipts', false, 6291456) on conflict (id) do nothing;
