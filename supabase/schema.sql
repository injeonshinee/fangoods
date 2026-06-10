-- 유저 테이블 (Supabase auth.users와 1:1 연결)
create table public.users (
  id uuid references auth.users(id) on delete cascade primary key,
  email text not null,
  coin_balance integer not null default 0,
  created_at timestamptz not null default now()
);

alter table public.users enable row level security;

create policy "Users can read own data" on public.users
  for select using (auth.uid() = id);

create policy "Users can update own data" on public.users
  for update using (auth.uid() = id);

-- 신규 유저 생성 시 자동으로 users 행 삽입
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.users (id, email)
  values (new.id, new.email);
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- 코인 로그
create table public.coin_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users(id) on delete cascade not null,
  amount integer not null,
  type text not null check (type in ('charge', 'deduct')),
  description text not null,
  created_at timestamptz not null default now()
);

alter table public.coin_logs enable row level security;

create policy "Users can read own coin logs" on public.coin_logs
  for select using (auth.uid() = user_id);

-- 코인 차감 RPC (원자성 보장)
create or replace function public.deduct_coins(
  p_user_id uuid,
  p_amount integer,
  p_description text
) returns void language plpgsql security definer set search_path = public as $$
begin
  update public.users
  set coin_balance = coin_balance - p_amount
  where id = p_user_id and coin_balance >= p_amount;

  if not found then
    raise exception 'Insufficient coins';
  end if;

  insert into public.coin_logs (user_id, amount, type, description)
  values (p_user_id, p_amount, 'deduct', p_description);
end;
$$;

-- 코인 충전 RPC (관리자용)
create or replace function public.charge_coins(
  p_user_id uuid,
  p_amount integer,
  p_description text
) returns void language plpgsql security definer set search_path = public as $$
begin
  update public.users
  set coin_balance = coin_balance + p_amount
  where id = p_user_id;

  insert into public.coin_logs (user_id, amount, type, description)
  values (p_user_id, p_amount, 'charge', p_description);
end;
$$;

-- 도안 테이블
create table public.designs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users(id) on delete cascade not null,
  type text not null check (type in ('slogan', 'photocard', 'uniform')),
  file_path text,
  preview_path text,
  coin_cost integer not null,
  expires_at timestamptz not null,
  downloaded_at timestamptz,
  created_at timestamptz not null default now()
);

alter table public.designs enable row level security;

create policy "Users can read own designs" on public.designs
  for select using (auth.uid() = user_id);

create policy "Users can insert own designs" on public.designs
  for insert with check (auth.uid() = user_id);

create policy "Users can update own designs" on public.designs
  for update using (auth.uid() = user_id);

-- 7일 지난 도안 자동 삭제 (Supabase scheduled function으로 실행)
-- create extension if not exists pg_cron;
-- select cron.schedule('delete-expired-designs', '0 3 * * *',
--   $$delete from public.designs where expires_at < now()$$
-- );

-- 입금 신청 테이블
create table public.orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users(id) on delete cascade not null,
  package_name text not null,
  coin_amount integer not null,
  price integer not null,
  depositor_name text not null,
  status text not null default 'pending' check (status in ('pending', 'confirmed', 'rejected')),
  created_at timestamptz not null default now(),
  confirmed_at timestamptz
);

alter table public.orders enable row level security;

create policy "Users can read own orders" on public.orders
  for select using (auth.uid() = user_id);

create policy "Users can insert own orders" on public.orders
  for insert with check (auth.uid() = user_id);
