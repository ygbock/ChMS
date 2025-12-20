-- supabase/schema.sql
-- Minimal schema snapshot for project (generated)
create extension if not exists pgcrypto;

create table if not exists church_branches (
	id uuid primary key default gen_random_uuid(),
	name text not null,
	district_id uuid,
	address text,
	created_at timestamptz default now()
);

create table if not exists member_transfers (
	id uuid primary key default gen_random_uuid(),
	member_id uuid not null,
	from_branch_id uuid,
	to_branch_id uuid,
	requested_by uuid,
	status text not null default 'pending',
	notes text,
	rejection_notes text,
	processed_by uuid,
	created_at timestamptz default now()
);

create index if not exists idx_member_transfers_to_branch on member_transfers(to_branch_id);

create table if not exists audit_logs (
	id uuid primary key default gen_random_uuid(),
	user_id uuid,
	action text not null,
	details jsonb,
	created_at timestamptz default now()
);

create table if not exists notifications (
	id uuid primary key default gen_random_uuid(),
	user_id uuid not null,
	title text not null,
	message text not null,
	link text,
	read boolean default false,
	created_at timestamptz default now()
);

create or replace function approve_member_transfer(_transfer_id uuid, _processed_by uuid default null)
returns void language plpgsql as $$
begin
	update member_transfers
	set status = 'approved', processed_by = _processed_by, rejection_notes = null
	where id = _transfer_id;
end; $$;

create or replace function reject_member_transfer(_transfer_id uuid, _rejection_notes text default null, _processed_by uuid default null)
returns void language plpgsql as $$
begin
	update member_transfers
	set status = 'rejected', rejection_notes = _rejection_notes, processed_by = _processed_by
	where id = _transfer_id;
end; $$;

