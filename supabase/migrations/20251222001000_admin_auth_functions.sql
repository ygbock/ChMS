-- Administrative Auth Functions
-- Created by Antigravity

-- Ensure pgcrypto is available for password hashing
create extension if not exists pgcrypto;

-- 1. Function to create a user account from the dashboard
-- This allows admins to provision accounts without being logged out.
create or replace function public.create_managed_user(
  _email text,
  _password text,
  _full_name text,
  _role text,
  _branch_id uuid
)
returns uuid
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  _new_user_id uuid;
  _creator_role text;
begin
  -- Access Control: Check if caller is authorized
  select primary_role into _creator_role from public.profiles where id = auth.uid();
  
  if _creator_role not in ('admin', 'super_admin') then
    raise exception 'Unauthorized: Only administrators can create accounts.';
  end if;

  -- Logic Restriction: Branch Admins can only create members for their own branch
  if _creator_role = 'admin' then
    if _role != 'member' then
       raise exception 'Unauthorized: Branch Admins can only create Member accounts.';
    end if;
    if _branch_id != (select branch_id from public.profiles where id = auth.uid()) then
       raise exception 'Unauthorized: Branch Admins can only create accounts for their own branch.';
    end if;
  end if;

  -- Create the user in auth.users
  insert into auth.users (
    instance_id,
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at,
    confirmation_token,
    recovery_token,
    email_change_token_new,
    email_change
  )
  values (
    '00000000-0000-0000-0000-000000000000',
    gen_random_uuid(),
    'authenticated',
    'authenticated',
    _email,
    crypt(_password, gen_salt('bf')),
    now(),
    jsonb_build_object('provider', 'email', 'providers', array['email']),
    jsonb_build_object(
      'full_name', _full_name,
      'primary_role', _role,
      'branch_id', _branch_id
    ),
    now(),
    now(),
    '',
    '',
    '',
    ''
  )
  returning id into _new_user_id;

  -- Note: The trigger 'on_auth_user_created' defined in schema.sql 
  -- will automatically create the public.profiles record.

  -- Log the action
  insert into public.audit_logs (user_id, action, details)
  values (auth.uid(), 'created_user_account', jsonb_build_object(
    'email', _email,
    'role', _role,
    'branch_id', _branch_id
  ));

  return _new_user_id;

exception
  when unique_violation then
    raise exception 'Account with this email already exists.';
  when others then
    raise exception 'Failed to create user: %', SQLERRM;
end;
$$;

-- 2. Bootstrap Utility (To be run manually in Supabase SQL Editor if needed)
-- This promotes a user to super_admin so they can start managing the system.
/*
UPDATE public.profiles 
SET primary_role = 'super_admin' 
WHERE email = 'YOUR_EMAIL_HERE';
*/
