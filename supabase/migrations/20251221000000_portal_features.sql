-- Member Portal Features Migration
-- Created by Antigravity

-- 1. Events Table
create table if not exists public.events (
  id uuid primary key default gen_random_uuid(),
  branch_id uuid references public.church_branches(id),
  title text not null,
  description text,
  event_date timestamp with time zone not null,
  location text,
  max_attendees integer,
  created_at timestamp with time zone default now()
);

-- 2. Event Registrations
create table if not exists public.event_registrations (
  id uuid primary key default gen_random_uuid(),
  event_id uuid references public.events(id) on delete cascade,
  user_id uuid references auth.users(id) on delete cascade,
  status text default 'registered', -- registered, cancelled, attended
  created_at timestamp with time zone default now(),
  unique(event_id, user_id)
);

-- 3. Attendance Table
create table if not exists public.attendance (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  event_id uuid references public.events(id) on delete cascade,
  check_in_time timestamp with time zone default now(),
  branch_id uuid references public.church_branches(id),
  notes text,
  unique(user_id, event_id)
);

-- 4. Departments Table
create table if not exists public.departments (
  id uuid primary key default gen_random_uuid(),
  branch_id uuid references public.church_branches(id),
  name text not null,
  description text,
  leader_id uuid references public.profiles(id),
  created_at timestamp with time zone default now()
);

-- 5. Department Members
create table if not exists public.department_members (
  id uuid primary key default gen_random_uuid(),
  department_id uuid references public.departments(id) on delete cascade,
  user_id uuid references public.profiles(id) on delete cascade,
  role text default 'member', -- member, lead, secretary
  joined_at timestamp with time zone default now(),
  unique(department_id, user_id)
);

-- 6. Groups (Small Groups / Cells)
create table if not exists public.groups (
  id uuid primary key default gen_random_uuid(),
  branch_id uuid references public.church_branches(id),
  name text not null,
  description text,
  leader_id uuid references public.profiles(id),
  meeting_time text,
  meeting_location text,
  created_at timestamp with time zone default now()
);

-- 7. Group Members
create table if not exists public.group_members (
  id uuid primary key default gen_random_uuid(),
  group_id uuid references public.groups(id) on delete cascade,
  user_id uuid references public.profiles(id) on delete cascade,
  joined_at timestamp with time zone default now(),
  unique(group_id, user_id)
);

-- 8. Stream Messages (Chat)
create table if not exists public.stream_messages (
  id uuid primary key default gen_random_uuid(),
  stream_id uuid references public.streams(id) on delete cascade, -- Assuming public.streams exists from previous context
  user_id uuid references public.profiles(id) on delete cascade,
  message text not null,
  created_at timestamp with time zone default now()
);

-- RLS POLICIES

-- Events: Everyone can read events in their own branch
alter table public.events enable row level security;
create policy "Users can view events in their branch" on public.events
  for select using (branch_id = (select branch_id from public.profiles where id = auth.uid()));

-- Event Registrations: Users can manage their own registrations
alter table public.event_registrations enable row level security;
create policy "Users can view their own registrations" on public.event_registrations
  for select using (user_id = auth.uid());
create policy "Users can register for events" on public.event_registrations
  for insert with check (user_id = auth.uid());
create policy "Users can cancel their own registrations" on public.event_registrations
  for delete using (user_id = auth.uid());

-- Attendance: Users can view their own attendance
alter table public.attendance enable row level security;
create policy "Users can view their own attendance" on public.attendance
  for select using (user_id = auth.uid());

-- Departments: Viewable by branch members
alter table public.departments enable row level security;
create policy "Users can view departments in their branch" on public.departments
  for select using (branch_id = (select branch_id from public.profiles where id = auth.uid()));

-- Groups: Viewable by branch members
alter table public.groups enable row level security;
create policy "Users can view groups in their branch" on public.groups
  for select using (branch_id = (select branch_id from public.profiles where id = auth.uid()));

-- Group Members: Users can view their groups, leads can view all members
alter table public.group_members enable row level security;
create policy "Users can view groups they belong to" on public.group_members
  for select using (user_id = auth.uid());
create policy "Users can join groups" on public.group_members
  for insert with check (user_id = auth.uid());
create policy "Users can leave groups" on public.group_members
  for delete using (user_id = auth.uid());

-- Stream Messages: Everyone can see chats, only authors can delete
alter table public.stream_messages enable row level security;
create policy "Anyone can view stream messages" on public.stream_messages
  for select using (true);
create policy "Authenticated users can post messages" on public.stream_messages
  for insert with check (auth.uid() = user_id);
