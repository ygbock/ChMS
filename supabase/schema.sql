-- ChMS Complete Database Schema
-- Last Updated: 2025-12-20

-- EXTENSIONS
create extension if not exists "uuid-ossp";

-- 1. CHURCH BRANCHES
create table public.church_branches (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  district_id text not null default 'default',
  address text,
  created_at timestamp with time zone default now()
);

-- 2. PROFILES
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  full_name text,
  branch_id uuid references public.church_branches(id),
  primary_role text not null default 'member',
  avatar_url text,
  phone text,
  created_at timestamp with time zone default now()
);

-- 3. STREAMS
create table public.streams (
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

-- 4. EVENTS
create table public.events (
  id uuid primary key default gen_random_uuid(),
  branch_id uuid references public.church_branches(id),
  title text not null,
  description text,
  event_date timestamp with time zone not null,
  location text,
  max_attendees integer,
  created_at timestamp with time zone default now()
);

-- 5. EVENT REGISTRATIONS
create table public.event_registrations (
  id uuid primary key default gen_random_uuid(),
  event_id uuid references public.events(id) on delete cascade,
  user_id uuid references auth.users(id) on delete cascade,
  status text default 'registered',
  created_at timestamp with time zone default now(),
  unique(event_id, user_id)
);

-- 6. ATTENDANCE
create table public.attendance (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  event_id uuid references public.events(id) on delete cascade,
  check_in_time timestamp with time zone default now(),
  branch_id uuid references public.church_branches(id),
  notes text,
  unique(user_id, event_id)
);

-- 7. AUDIT LOGS
create table public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id),
  action text not null,
  details jsonb default '{}'::jsonb,
  created_at timestamp with time zone default now()
);

-- 8. NOTIFICATIONS
create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  title text not null,
  message text not null,
  link text,
  read boolean default false,
  created_at timestamp with time zone default now()
);

-- 9. MEMBER TRANSFERS
create table public.member_transfers (
  id uuid primary key default gen_random_uuid(),
  member_id uuid references auth.users(id) on delete cascade,
  from_branch_id uuid references public.church_branches(id),
  to_branch_id uuid references public.church_branches(id),
  requested_by uuid references auth.users(id),
  status text not null default 'pending',
  notes text,
  rejection_notes text,
  processed_by uuid references auth.users(id),
  created_at timestamp with time zone default now()
);

-- TRIGGERS & FUNCTIONS
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

create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- RLS
alter table public.church_branches enable row level security;
alter table public.profiles enable row level security;
alter table public.streams enable row level security;
alter table public.events enable row level security;
alter table public.event_registrations enable row level security;
alter table public.attendance enable row level security;
alter table public.audit_logs enable row level security;
alter table public.notifications enable row level security;
alter table public.member_transfers enable row level security;

-- POLICIES

-- Church Branches: Everyone can view
create or replace policy "Branches are viewable by everyone" on public.church_branches for select using (true);

-- Profiles: Users can view/edit their own, Admins can view all
create or replace policy "Users can view own profile" on public.profiles for select using (auth.uid() = id);
create or replace policy "Users can update own profile" on public.profiles for update using (auth.uid() = id);
create or replace policy "Admins can view all profiles" on public.profiles for select using (
  exists (select 1 from public.profiles where id = auth.uid() and primary_role in ('admin', 'super_admin'))
);

-- Streams: Publicly viewable
create or replace policy "Streams are viewable by everyone" on public.streams for select using (true);

-- Events: Viewable by everyone in branch
create or replace policy "Events viewable by branch members" on public.events for select using (
  branch_id = (select branch_id from public.profiles where id = auth.uid())
  or exists (select 1 from public.profiles where id = auth.uid() and primary_role = 'super_admin')
);

-- Event Registrations: Own only
create or replace policy "Users can manage own registrations" on public.event_registrations for all using (user_id = auth.uid());

-- Attendance: Own only
create or replace policy "Users can view own attendance" on public.attendance for select using (user_id = auth.uid());

-- Notifications: Own only
create or replace policy "Users can manage own notifications" on public.notifications for all using (user_id = auth.uid());

-- Audit Logs: Super Admin only
create or replace policy "Only super admins can view audit logs" on public.audit_logs for select using (
  exists (select 1 from public.profiles where id = auth.uid() and primary_role = 'super_admin')
);

-- Member Transfers: Own or Admin
create or replace policy "Users can view own transfers" on public.member_transfers for select using (
  member_id = auth.uid() 
  or requested_by = auth.uid()
  or exists (select 1 from public.profiles where id = auth.uid() and primary_role in ('admin', 'super_admin'))
);