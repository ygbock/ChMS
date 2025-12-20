-- Complete Database Setup Migration
-- Created by Antigravity
-- Includes: Profiles, Branches, Members, Transfers, Audit Logs, Notifications

-- 1. Enable necessary extensions
create extension if not exists pgcrypto;

-- 2. Profiles Table (extends Supabase Auth)
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  email text,
  full_name text,
  branch_id uuid, -- will reference church_branches(id) after it's defined
  primary_role text default 'member',
  avatar_url text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 3. Church Branches Table
create table if not exists public.church_branches (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  district_id uuid,
  address text,
  created_at timestamptz default now()
);

-- Add foreign key back to profiles (circular dependency if distinct, but here we just alter)
-- alter table public.profiles add constraint fk_profiles_branch foreign key (branch_id) references public.church_branches(id);

-- 4. Members Table
create table if not exists public.members (
  id uuid primary key default gen_random_uuid(),
  first_name text not null,
  last_name text not null,
  email text,
  phone text,
  status text default 'active' check (status in ('active', 'inactive', 'suspended', 'transferred')),
  branch_id uuid references public.church_branches(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 5. Member Transfers Table
create table if not exists public.member_transfers (
  id uuid primary key default gen_random_uuid(),
  member_id uuid not null, -- references public.members(id), but kept loose in original schema, let's make it strict if possible, but original script had it loose. Best to link it.
  from_branch_id uuid references public.church_branches(id),
  to_branch_id uuid references public.church_branches(id),
  requested_by uuid references auth.users(id),
  status text not null default 'pending',
  notes text,
  rejection_notes text,
  processed_by uuid references auth.users(id),
  created_at timestamptz default now()
);

-- Index for transfers
create index if not exists idx_member_transfers_to_branch on public.member_transfers(to_branch_id);

-- 6. Audit Logs Table
create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id),
  action text not null,
  details jsonb,
  created_at timestamptz default now()
);

-- 7. Notifications Table
create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) not null,
  title text not null,
  message text not null,
  link text,
  read boolean default false,
  created_at timestamptz default now()
);

-- 8. Functions (RPCs)

-- Approve Member Transfer
create or replace function approve_member_transfer(_transfer_id uuid, _processed_by uuid default null)
returns void language plpgsql as $$
begin
  update public.member_transfers
  set status = 'approved', processed_by = _processed_by, rejection_notes = null
  where id = _transfer_id;
  
  -- Optional: Update member's branch automatically?
  -- update public.members set branch_id = (select to_branch_id from public.member_transfers where id = _transfer_id) where id = (select member_id from public.member_transfers where id = _transfer_id);
end; $$;

-- Reject Member Transfer
create or replace function reject_member_transfer(_transfer_id uuid, _rejection_notes text default null, _processed_by uuid default null)
returns void language plpgsql as $$
begin
  update public.member_transfers
  set status = 'rejected', rejection_notes = _rejection_notes, processed_by = _processed_by
  where id = _transfer_id;
end; $$;

-- 9. Triggers for Profile Creation (Standard Supabase Pattern)
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name, primary_role)
  values (new.id, new.email, new.raw_user_meta_data->>'full_name', 'member');
  return new;
end;
$$;

-- Drop trigger if exists to avoid conflict
drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- 10. Enable Row Level Security (RLS)
-- It is best practice to enable RLS. Here we enable it but add permissive policies for development.
-- IN PRODUCTION: You must restrict these policies!

alter table public.profiles enable row level security;
alter table public.church_branches enable row level security;
alter table public.members enable row level security;
alter table public.member_transfers enable row level security;
alter table public.audit_logs enable row level security;
alter table public.notifications enable row level security;

-- Dev Policy: Allow all operations for authenticated users
create policy "Enable all for users" on public.profiles for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "Enable all for users" on public.church_branches for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "Enable all for users" on public.members for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "Enable all for users" on public.member_transfers for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "Enable all for users" on public.audit_logs for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "Enable all for users" on public.notifications for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

-- Allow public read for key tables if needed (e.g. branches list for login?)
-- create policy "Enable read access for all users" on public.church_branches for select using (true);
