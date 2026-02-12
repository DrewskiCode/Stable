-- =============================================
-- STABLE APP DATABASE SCHEMA
-- Run this in Supabase SQL Editor
-- =============================================

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- =============================================
-- TABLES
-- =============================================

-- Barns (Stables)
create table public.barns (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  description text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Barn Members (join table with roles)
create type public.barn_role as enum ('owner', 'manager', 'member', 'viewer');

create table public.barn_members (
  id uuid default uuid_generate_v4() primary key,
  barn_id uuid references public.barns(id) on delete cascade not null,
  user_id uuid references auth.users(id) on delete cascade not null,
  role barn_role default 'member' not null,
  joined_at timestamp with time zone default now(),
  unique(barn_id, user_id)
);

-- Barn Invites
create table public.barn_invites (
  id uuid default uuid_generate_v4() primary key,
  barn_id uuid references public.barns(id) on delete cascade not null,
  email text not null,
  role barn_role default 'member' not null,
  invited_by uuid references auth.users(id) on delete set null,
  token text unique not null default encode(gen_random_bytes(32), 'hex'),
  expires_at timestamp with time zone default (now() + interval '72 hours'),
  accepted_at timestamp with time zone,
  created_at timestamp with time zone default now()
);

-- Tasks (Chores)
create type public.task_status as enum ('todo', 'in_progress', 'done');

create table public.tasks (
  id uuid default uuid_generate_v4() primary key,
  barn_id uuid references public.barns(id) on delete cascade not null,
  title text not null,
  description text,
  section text, -- category/group
  due_date date,
  due_time time,
  status task_status default 'todo' not null,
  assigned_to uuid references auth.users(id) on delete set null,
  completed_at timestamp with time zone,
  completed_by uuid references auth.users(id) on delete set null,
  sort_order integer default 0,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Events (Calendar)
create table public.events (
  id uuid default uuid_generate_v4() primary key,
  barn_id uuid references public.barns(id) on delete cascade not null,
  title text not null,
  description text,
  starts_at timestamp with time zone not null,
  ends_at timestamp with time zone,
  all_day boolean default false,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Animals
create table public.animals (
  id uuid default uuid_generate_v4() primary key,
  barn_id uuid references public.barns(id) on delete cascade not null,
  name text not null,
  type text not null, -- horse, cat, dog, etc.
  breed text,
  birthdate date,
  gender text,
  color text,
  weight numeric,
  height numeric,
  photo_url text,
  notes text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Animal Medical Records
create table public.animal_medical_records (
  id uuid default uuid_generate_v4() primary key,
  animal_id uuid references public.animals(id) on delete cascade not null,
  date date not null,
  title text not null,
  details text,
  veterinarian text,
  cost numeric,
  attachments text[], -- URLs to uploaded files
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Audit Log
create table public.audit_log (
  id uuid default uuid_generate_v4() primary key,
  barn_id uuid references public.barns(id) on delete cascade not null,
  user_id uuid references auth.users(id) on delete set null,
  action text not null, -- 'created', 'updated', 'deleted', 'completed'
  entity_type text not null, -- 'task', 'event', 'animal', 'medical_record'
  entity_id uuid not null,
  details jsonb,
  created_at timestamp with time zone default now()
);

-- User Profiles (for display names, etc.)
create table public.profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  email text,
  display_name text,
  avatar_url text,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- =============================================
-- ROW LEVEL SECURITY POLICIES
-- =============================================

alter table public.barns enable row level security;
alter table public.barn_members enable row level security;
alter table public.barn_invites enable row level security;
alter table public.tasks enable row level security;
alter table public.events enable row level security;
alter table public.animals enable row level security;
alter table public.animal_medical_records enable row level security;
alter table public.audit_log enable row level security;
alter table public.profiles enable row level security;

-- Helper function to check barn membership
create or replace function public.is_barn_member(barn_uuid uuid)
returns boolean as $$
  select exists (
    select 1 from public.barn_members
    where barn_id = barn_uuid and user_id = auth.uid()
  );
$$ language sql security definer;

-- Helper function to check barn role
create or replace function public.get_barn_role(barn_uuid uuid)
returns barn_role as $$
  select role from public.barn_members
  where barn_id = barn_uuid and user_id = auth.uid();
$$ language sql security definer;

-- Barns: users can see barns they're members of
create policy "Users can view their barns"
  on public.barns for select
  using (is_barn_member(id));

create policy "Users can create barns"
  on public.barns for insert
  with check (auth.uid() is not null);

create policy "Owners can update their barns"
  on public.barns for update
  using (get_barn_role(id) = 'owner');

create policy "Owners can delete their barns"
  on public.barns for delete
  using (get_barn_role(id) = 'owner');

-- Barn Members: members can see other members
create policy "Members can view barn members"
  on public.barn_members for select
  using (is_barn_member(barn_id));

create policy "Owners and managers can add members"
  on public.barn_members for insert
  with check (get_barn_role(barn_id) in ('owner', 'manager'));

create policy "Owners can update member roles"
  on public.barn_members for update
  using (get_barn_role(barn_id) = 'owner');

create policy "Owners can remove members"
  on public.barn_members for delete
  using (get_barn_role(barn_id) = 'owner');

-- Tasks: barn members can manage tasks
create policy "Members can view tasks"
  on public.tasks for select
  using (is_barn_member(barn_id));

create policy "Members can create tasks"
  on public.tasks for insert
  with check (is_barn_member(barn_id) and get_barn_role(barn_id) != 'viewer');

create policy "Members can update tasks"
  on public.tasks for update
  using (is_barn_member(barn_id) and get_barn_role(barn_id) != 'viewer');

create policy "Managers and owners can delete tasks"
  on public.tasks for delete
  using (get_barn_role(barn_id) in ('owner', 'manager'));

-- Events: barn members can manage events
create policy "Members can view events"
  on public.events for select
  using (is_barn_member(barn_id));

create policy "Members can create events"
  on public.events for insert
  with check (is_barn_member(barn_id) and get_barn_role(barn_id) != 'viewer');

create policy "Members can update events"
  on public.events for update
  using (is_barn_member(barn_id) and get_barn_role(barn_id) != 'viewer');

create policy "Managers and owners can delete events"
  on public.events for delete
  using (get_barn_role(barn_id) in ('owner', 'manager'));

-- Animals: barn members can manage animals
create policy "Members can view animals"
  on public.animals for select
  using (is_barn_member(barn_id));

create policy "Members can create animals"
  on public.animals for insert
  with check (is_barn_member(barn_id) and get_barn_role(barn_id) != 'viewer');

create policy "Members can update animals"
  on public.animals for update
  using (is_barn_member(barn_id) and get_barn_role(barn_id) != 'viewer');

create policy "Managers and owners can delete animals"
  on public.animals for delete
  using (get_barn_role(barn_id) in ('owner', 'manager'));

-- Medical Records
create policy "Members can view medical records"
  on public.animal_medical_records for select
  using (exists (
    select 1 from public.animals a
    where a.id = animal_id and is_barn_member(a.barn_id)
  ));

create policy "Members can create medical records"
  on public.animal_medical_records for insert
  with check (exists (
    select 1 from public.animals a
    where a.id = animal_id and is_barn_member(a.barn_id) and get_barn_role(a.barn_id) != 'viewer'
  ));

create policy "Members can update medical records"
  on public.animal_medical_records for update
  using (exists (
    select 1 from public.animals a
    where a.id = animal_id and is_barn_member(a.barn_id) and get_barn_role(a.barn_id) != 'viewer'
  ));

-- Audit Log: read-only for members
create policy "Members can view audit log"
  on public.audit_log for select
  using (is_barn_member(barn_id));

-- Profiles: users can see and edit their own
create policy "Users can view all profiles"
  on public.profiles for select
  using (true);

create policy "Users can update own profile"
  on public.profiles for update
  using (id = auth.uid());

create policy "Users can insert own profile"
  on public.profiles for insert
  with check (id = auth.uid());

-- =============================================
-- TRIGGERS
-- =============================================

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email);
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Auto-add creator as barn owner
create or replace function public.handle_new_barn()
returns trigger as $$
begin
  insert into public.barn_members (barn_id, user_id, role)
  values (new.id, new.created_by, 'owner');
  return new;
end;
$$ language plpgsql security definer;

create trigger on_barn_created
  after insert on public.barns
  for each row execute function public.handle_new_barn();

-- Updated_at trigger
create or replace function public.update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger update_barns_updated_at before update on public.barns
  for each row execute function public.update_updated_at();

create trigger update_tasks_updated_at before update on public.tasks
  for each row execute function public.update_updated_at();

create trigger update_events_updated_at before update on public.events
  for each row execute function public.update_updated_at();

create trigger update_animals_updated_at before update on public.animals
  for each row execute function public.update_updated_at();

create trigger update_medical_records_updated_at before update on public.animal_medical_records
  for each row execute function public.update_updated_at();

create trigger update_profiles_updated_at before update on public.profiles
  for each row execute function public.update_updated_at();

-- =============================================
-- STORAGE BUCKETS
-- =============================================

-- Run this separately in Supabase Dashboard > Storage
-- Or use the Supabase CLI

-- Create bucket for animal photos
-- insert into storage.buckets (id, name, public) values ('animal-photos', 'animal-photos', true);

-- Create bucket for medical attachments
-- insert into storage.buckets (id, name, public) values ('medical-attachments', 'medical-attachments', false);
