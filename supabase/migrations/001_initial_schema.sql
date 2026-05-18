-- Garden Planner Database Schema
-- Run this in Supabase SQL Editor (Database > SQL Editor)

-- Enable UUID generation
create extension if not exists "uuid-ossp";

-- Seed Catalog (reference data - shared by all users)
create table seed_catalog (
  id text primary key,
  common_name text not null,
  genus_species text,
  cultivar text not null,
  plant_type text not null check (plant_type in ('flower', 'herb', 'vegetable')),
  lifecycle text not null check (lifecycle in ('annual', 'biennial', 'perennial')),
  days_to_emerge text,
  sun text,
  spacing text,
  seed_quantity_per_space integer,
  depth text,
  sow_time_outside text,
  inside_start_time text,
  grow_height text,
  grow_width text,
  germination_instructions text,
  animal_resistance text,
  bloom text,
  created_at timestamptz default now()
);

-- User Inventory (each user's seed collection)
create table inventory (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade not null,
  seed_id text references seed_catalog(id) not null,
  quantity_mg integer default 0,
  packet_count integer default 0,
  date_added timestamptz default now(),
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Garden Location (user's garden settings)
create table garden_locations (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade not null unique,
  zip_code text,
  hardiness_zone text,
  last_frost_date date,
  first_frost_date date,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Bed Squares (track what's planted where)
create table bed_squares (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade not null,
  bed integer not null check (bed in (1, 2, 3)),
  position text not null check (position in ('A1','A2','A3','A4','B1','B2','B3','B4','C1','C2','C3','C4','D1','D2','D3','D4')),
  planted_seed_id text references seed_catalog(id),
  planted_date date,
  status text default 'empty' check (status in ('empty', 'planted', 'growing', 'harvesting', 'done')),
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(user_id, bed, position)
);

-- Planting Tasks (schedule items)
create table planting_tasks (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade not null,
  seed_id text references seed_catalog(id) not null,
  action text not null check (action in ('start indoors', 'direct sow', 'transplant', 'succession sow')),
  start_date date not null,
  end_date date,
  location text,
  square_feet integer,
  notes text,
  completed boolean default false,
  completed_date date,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Row Level Security (RLS) - users can only see their own data
alter table inventory enable row level security;
alter table garden_locations enable row level security;
alter table bed_squares enable row level security;
alter table planting_tasks enable row level security;

-- Policies for inventory
create policy "Users can view own inventory" on inventory for select using (auth.uid() = user_id);
create policy "Users can insert own inventory" on inventory for insert with check (auth.uid() = user_id);
create policy "Users can update own inventory" on inventory for update using (auth.uid() = user_id);
create policy "Users can delete own inventory" on inventory for delete using (auth.uid() = user_id);

-- Policies for garden_locations
create policy "Users can view own location" on garden_locations for select using (auth.uid() = user_id);
create policy "Users can insert own location" on garden_locations for insert with check (auth.uid() = user_id);
create policy "Users can update own location" on garden_locations for update using (auth.uid() = user_id);
create policy "Users can delete own location" on garden_locations for delete using (auth.uid() = user_id);

-- Policies for bed_squares
create policy "Users can view own beds" on bed_squares for select using (auth.uid() = user_id);
create policy "Users can insert own beds" on bed_squares for insert with check (auth.uid() = user_id);
create policy "Users can update own beds" on bed_squares for update using (auth.uid() = user_id);
create policy "Users can delete own beds" on bed_squares for delete using (auth.uid() = user_id);

-- Policies for planting_tasks
create policy "Users can view own tasks" on planting_tasks for select using (auth.uid() = user_id);
create policy "Users can insert own tasks" on planting_tasks for insert with check (auth.uid() = user_id);
create policy "Users can update own tasks" on planting_tasks for update using (auth.uid() = user_id);
create policy "Users can delete own tasks" on planting_tasks for delete using (auth.uid() = user_id);

-- Seed catalog is readable by everyone (public reference data)
alter table seed_catalog enable row level security;
create policy "Seed catalog is viewable by everyone" on seed_catalog for select using (true);
