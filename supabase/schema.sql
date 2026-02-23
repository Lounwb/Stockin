-- Supabase 数据库 Schema：profiles / items / item_price_history / item_transactions

-- 扩展（Supabase 默认通常已启用 pgcrypto）
create extension if not exists "pgcrypto";

-- 用户扩展信息表：profiles
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  phone text unique,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "Profiles are viewable by owners"
  on public.profiles
  for select
  using (auth.uid() = id);

create policy "Profiles are updatable by owners"
  on public.profiles
  for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

create policy "Profiles are insertable by owners"
  on public.profiles
  for insert
  with check (auth.uid() = id);


-- 物品主表：items
create table if not exists public.items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  name text not null,
  spec text,
  barcode text,
  image_url text,
  jd_sku text,
  tmall_sku text,
  pdd_sku text,
  quantity integer not null default 0,
  unit text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_items_user_id on public.items (user_id);
create index if not exists idx_items_barcode on public.items (barcode);

alter table public.items enable row level security;

create policy "Users can view their own items"
  on public.items
  for select
  using (auth.uid() = user_id);

create policy "Users can insert their own items"
  on public.items
  for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own items"
  on public.items
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can delete their own items"
  on public.items
  for delete
  using (auth.uid() = user_id);


-- 价格历史表：item_price_history
create table if not exists public.item_price_history (
  id bigserial primary key,
  item_id uuid not null references public.items (id) on delete cascade,
  platform text not null check (platform in ('jd', 'tmall', 'pdd')),
  price numeric(10,2) not null,
  currency text not null default 'CNY',
  recorded_at date not null default current_date
);

create unique index if not exists idx_price_unique_per_day
  on public.item_price_history (item_id, platform, recorded_at);

create index if not exists idx_price_item_id on public.item_price_history (item_id);

alter table public.item_price_history enable row level security;

-- 通过所属 item 的 user_id 做行级权限控制
create policy "Users can view price history of their items"
  on public.item_price_history
  for select
  using (
    exists (
      select 1
      from public.items i
      where i.id = item_id
        and i.user_id = auth.uid()
    )
  );

create policy "Users can insert price history of their items"
  on public.item_price_history
  for insert
  with check (
    exists (
      select 1
      from public.items i
      where i.id = item_id
        and i.user_id = auth.uid()
    )
  );

create policy "Users can update price history of their items"
  on public.item_price_history
  for update
  using (
    exists (
      select 1
      from public.items i
      where i.id = item_id
        and i.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1
      from public.items i
      where i.id = item_id
        and i.user_id = auth.uid()
    )
  );


-- （可选）数量变动流水表：item_transactions
create table if not exists public.item_transactions (
  id bigserial primary key,
  item_id uuid not null references public.items (id) on delete cascade,
  delta integer not null,
  reason text,
  created_at timestamptz not null default now()
);

create index if not exists idx_item_transactions_item_id
  on public.item_transactions (item_id);

alter table public.item_transactions enable row level security;

create policy "Users can view transactions of their items"
  on public.item_transactions
  for select
  using (
    exists (
      select 1
      from public.items i
      where i.id = item_id
        and i.user_id = auth.uid()
    )
  );

create policy "Users can insert transactions of their items"
  on public.item_transactions
  for insert
  with check (
    exists (
      select 1
      from public.items i
      where i.id = item_id
        and i.user_id = auth.uid()
    )
  );


-- 数量变更 RPC：change_item_quantity
create or replace function public.change_item_quantity(p_item_id uuid, p_delta integer)
returns public.items
language sql
security definer
as $$
  update public.items
    set quantity = quantity + p_delta,
        updated_at = now()
  where id = p_item_id
  returning *;
$$;


