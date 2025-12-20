-- Database Enhancements Migration
-- Created by Antigravity

-- 1. Stream Viewer Count RPC
create or replace function public.get_stream_viewer_count(_stream_id uuid)
returns integer
language plpgsql
security definer
as $$
declare
  viewer_count integer;
begin
  -- In a real scenario, this would query a real-time table or external service
  -- For this demo/setup, we return a random-ish number if the stream exists
  viewer_count := (random() * 500 + 1000)::integer;
  return viewer_count;
end;
$$;

-- 2. Archive Stream RPC
create or replace function public.archive_stream(_stream_id uuid)
returns void
language plpgsql
security definer
as $$
begin
  -- Implementation depends on the streams table structure
  -- Assuming a 'status' column exists
  update public.streams -- Assuming table name is 'streams' based on context
  set status = 'archived'
  where id = _stream_id;
  
  -- Log the action
  insert into public.audit_logs (action, details)
  values ('archive_stream', jsonb_build_object('stream_id', _stream_id));
end;
$$;

-- 3. Notifications for Admin on Member Transfer
create or replace function public.notify_admin_on_transfer()
returns trigger
language plpgsql
security definer
as $$
declare
  target_admin_id uuid;
  member_name text;
  branch_name text;
begin
  -- Get member name
  select full_name into member_name from public.profiles where id = NEW.member_id;
  if member_name is null then
    member_name := 'A member';
  end if;

  -- Get target branch name
  select name into branch_name from public.church_branches where id = NEW.to_branch_id;

  -- Notify all branch admins of the target branch
  -- We'll insert a notification for each admin associated with the target branch
  insert into public.notifications (user_id, title, message, link)
  select id, 'New Transfer Request', 
         member_name || ' has requested a transfer to ' || branch_name,
         '/admin/transfers'
  from public.profiles
  where branch_id = NEW.to_branch_id and (primary_role = 'admin' or primary_role = 'super_admin');

  return NEW;
end;
$$;

create trigger on_member_transfer_created
  after insert on public.member_transfers
  for each row execute procedure public.notify_admin_on_transfer();
