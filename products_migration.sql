-- 1. Categorías de productos
create table if not exists product_categories (
  id uuid primary key default gen_random_uuid(),
  gym_id uuid not null references gyms(id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now()
);

alter table product_categories enable row level security;
create policy "gym access product_categories" on product_categories for all
  using (gym_id = (select gym_id from profiles where id = auth.uid()));
create index if not exists product_categories_gym_id_idx on product_categories(gym_id);

-- 2. Productos
create table if not exists products (
  id uuid primary key default gen_random_uuid(),
  gym_id uuid not null references gyms(id) on delete cascade,
  category_id uuid references product_categories(id) on delete set null,
  name text not null,
  description text,
  price numeric(10,2) not null default 0,
  stock int not null default 0,
  low_stock_alert int not null default 5,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table products enable row level security;
create policy "gym access products" on products for all
  using (gym_id = (select gym_id from profiles where id = auth.uid()));
create index if not exists products_gym_id_idx on products(gym_id);

-- 3. Movimientos de stock (entradas y salidas manuales)
create table if not exists stock_movements (
  id uuid primary key default gen_random_uuid(),
  gym_id uuid not null references gyms(id) on delete cascade,
  product_id uuid not null references products(id) on delete cascade,
  type text not null check (type in ('ENTRADA', 'SALIDA')),
  quantity int not null,
  notes text,
  created_at timestamptz not null default now()
);

alter table stock_movements enable row level security;
create policy "gym access stock_movements" on stock_movements for all
  using (gym_id = (select gym_id from profiles where id = auth.uid()));
create index if not exists stock_movements_product_id_idx on stock_movements(product_id);

-- 4. Ventas
create table if not exists sales (
  id uuid primary key default gen_random_uuid(),
  gym_id uuid not null references gyms(id) on delete cascade,
  member_id uuid references members(id) on delete set null,
  total numeric(10,2) not null default 0,
  payment_method text not null default 'EFECTIVO',
  notes text,
  created_at timestamptz not null default now()
);

alter table sales enable row level security;
create policy "gym access sales" on sales for all
  using (gym_id = (select gym_id from profiles where id = auth.uid()));
create index if not exists sales_gym_id_idx on sales(gym_id);

-- 5. Items de cada venta
create table if not exists sale_items (
  id uuid primary key default gen_random_uuid(),
  sale_id uuid not null references sales(id) on delete cascade,
  product_id uuid not null references products(id) on delete restrict,
  quantity int not null,
  unit_price numeric(10,2) not null,
  subtotal numeric(10,2) not null
);

alter table sale_items enable row level security;
create policy "gym access sale_items" on sale_items for all
  using (
    sale_id in (
      select id from sales where gym_id = (select gym_id from profiles where id = auth.uid())
    )
  );
create index if not exists sale_items_sale_id_idx on sale_items(sale_id);
