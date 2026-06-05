-- 1. Tabla de sucursales
create table if not exists branches (
  id uuid primary key default gen_random_uuid(),
  gym_id uuid not null references gyms(id) on delete cascade,
  name text not null,
  address text,
  phone text,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

-- RLS
alter table branches enable row level security;

create policy "gym members can read their branches"
  on branches for select
  using (gym_id = (select gym_id from profiles where id = auth.uid()));

create policy "gym owners can manage branches"
  on branches for all
  using (gym_id = (select gym_id from profiles where id = auth.uid()));

-- Índice
create index if not exists branches_gym_id_idx on branches(gym_id);

-- 2. Agregar branch_id a access_logs
alter table access_logs
  add column if not exists branch_id uuid references branches(id) on delete set null;

create index if not exists access_logs_branch_id_idx on access_logs(branch_id);
