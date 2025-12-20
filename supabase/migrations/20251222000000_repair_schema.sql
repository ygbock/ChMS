-- Database Schema Reconstruction & Repair
-- Created by Antigravity

-- 1. Create Church Branches Table
create table if not exists public.church_branches (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  district_id text not null default 'default',
  address text,
  created_at timestamp with time zone default now()
);

-- 2. Create Profiles Table (Linked to Auth.Users)
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  full_name text,
  branch_id uuid references public.church_branches(id),
  primary_role text not null default 'member', -- member, admin, super_admin, etc
  avatar_url text,
  phone text,
  created_at timestamp with time zone default now()
);

-- 3. Create Streams Table
create table if not exists public.streams (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  platform text not null default 'supabase',
  privacy text not null default 'public',
  status text not null default 'scheduled',
  viewer_count integer default 0,
  embed_url text,
  thumbnail_url text,
  scheduled_start timestamp with time zone,
  created_at timestamp with time zone default now()
);

-- 4. Create Audit Logs Table
create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id),
  action text not null,
  details jsonb default '{}'::jsonb,
  created_at timestamp with time zone default now()
);

-- 5. Create Notifications Table
create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  title text not null,
  message text not null,
  link text,
  read boolean default false,
  created_at timestamp with time zone default now()
);

-- 6. Create Member Transfers Table
create table if not exists public.member_transfers (
  id uuid primary key default gen_random_uuid(),
  member_id uuid references auth.users(id) on delete cascade,
  from_branch_id uuid references public.church_branches(id),
  to_branch_id uuid references public.church_branches(id),
  requested_by uuid references auth.users(id),
  status text not null default 'pending', -- pending, approved, rejected
  notes text,
  rejection_notes text,
  processed_by uuid references auth.users(id),
  created_at timestamp with time zone default now()
);

-- RLS Enablement
alter table public.church_branches enable row level security;
alter table public.profiles enable row level security;
alter table public.streams enable row level security;
alter table public.audit_logs enable row level security;
alter table public.notifications enable row level security;
alter table public.member_transfers enable row level security;

-- Basic RLS Policies (Base permissions)
create policy "Public branches are viewable by everyone" on public.church_branches for select using (true);
create policy "Users can view their own profile" on public.profiles for select using (auth.uid() = id);
create policy "Users can update their own profile" on public.profiles for update using (auth.uid() = id);
create policy "Admins can view all profiles" on public.profiles for select using (
  (select primary_role from public.profiles where id = auth.uid()) in ('admin', 'super_admin')
);

-- 7. Trigger: Create profile on auth signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name, primary_role, branch_id)
  values (
    new.id,
    new.email,
    new.raw_user_meta_data->>'full_name',
    coalesce(new.raw_user_meta_data->>'primary_role', 'member'),
    (new.raw_user_meta_data->>'branch_id')::uuid
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- 8. Seed Data: At least one branch
insert into public.church_branches (name, address)
values ('FaithConnect Headquarters', '123 Spirit Avenue, Downtown')
on conflict do nothing;
