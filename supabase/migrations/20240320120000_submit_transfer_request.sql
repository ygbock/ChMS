-- Enable UUID generation (pgcrypto) for gen_random_uuid()
create extension if not exists pgcrypto;

-- Branches table (basic)
create table if not exists church_branches (
	id uuid primary key default gen_random_uuid(),
	name text not null,
	district_id uuid,
	address text,
	created_at timestamptz default now()
);

-- Member transfer requests
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
