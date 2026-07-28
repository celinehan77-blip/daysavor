-- Recipe Ticket Supabase schema
-- Run this file in Supabase SQL Editor before running seed.sql.
-- This file only prepares database structure; it does not connect the frontend.

create extension if not exists "pgcrypto";

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  display_name text,
  avatar_url text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.stations (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name_zh text not null,
  name_en text not null,
  description text,
  category_type text not null,
  icon text,
  accent_color text,
  recipe_count integer default 0,
  average_time integer,
  difficulty text,
  sort_order integer default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.recipes (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  user_id uuid references auth.users(id) on delete set null,
  station_id uuid references public.stations(id) on delete set null,
  title_zh text not null,
  title_en text,
  description text,
  source_url text,
  source_platform text,
  time_minutes integer,
  difficulty text,
  flavor text,
  main_ingredient text,
  primary_category text,
  primary_ingredient text,
  classification_confidence numeric(4, 3),
  classification_reason text,
  classification_source text,
  saved_count integer default 0,
  cover_type text,
  is_generated boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  constraint recipes_primary_category_check check (
    primary_category is null
    or primary_category in (
      'chicken', 'duck', 'pork', 'beef', 'lamb',
      'fish', 'shrimp', 'crab', 'other'
    )
  ),
  constraint recipes_classification_confidence_check check (
    classification_confidence is null
    or classification_confidence between 0 and 1
  ),
  constraint recipes_classification_source_check check (
    classification_source is null
    or classification_source in ('ai', 'user', 'rule')
  )
);

create table if not exists public.ingredients (
  id uuid primary key default gen_random_uuid(),
  recipe_id uuid references public.recipes(id) on delete cascade,
  name text not null,
  amount text,
  group_type text not null,
  note text,
  sort_order integer default 0,
  created_at timestamptz default now(),
  constraint ingredients_group_type_check check (
    group_type in ('main', 'side', 'seasoning')
  )
);

create table if not exists public.recipe_steps (
  id uuid primary key default gen_random_uuid(),
  recipe_id uuid references public.recipes(id) on delete cascade,
  title text not null,
  description text,
  duration text,
  tips text,
  sort_order integer default 0,
  created_at timestamptz default now()
);

create table if not exists public.favorites (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  recipe_id uuid references public.recipes(id) on delete cascade,
  created_at timestamptz default now(),
  constraint favorites_user_recipe_unique unique (user_id, recipe_id)
);

create table if not exists public.generation_tasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  source_url text not null,
  source_platform text,
  status text not null default 'pending',
  generated_recipe_id uuid references public.recipes(id) on delete set null,
  error_message text,
  diagnostics jsonb not null default '{}'::jsonb,
  created_at timestamptz default now(),
  completed_at timestamptz,
  constraint generation_tasks_status_check check (
    status in ('pending', 'processing', 'completed', 'failed')
  )
);

-- Indexes

create index if not exists stations_slug_idx on public.stations (slug);
create index if not exists stations_category_type_idx on public.stations (category_type);

create index if not exists recipes_slug_idx on public.recipes (slug);
create index if not exists recipes_station_id_idx on public.recipes (station_id);
create index if not exists recipes_user_id_idx on public.recipes (user_id);
create index if not exists recipes_main_ingredient_idx on public.recipes (main_ingredient);
create index if not exists recipes_difficulty_idx on public.recipes (difficulty);
create index if not exists recipes_flavor_idx on public.recipes (flavor);
create index if not exists recipes_created_at_idx on public.recipes (created_at);
create index if not exists recipes_user_category_created_at_idx
  on public.recipes (user_id, primary_category, created_at desc);

create index if not exists ingredients_recipe_id_idx on public.ingredients (recipe_id);
create index if not exists ingredients_group_type_idx on public.ingredients (group_type);

create index if not exists recipe_steps_recipe_id_idx on public.recipe_steps (recipe_id);
create index if not exists recipe_steps_sort_order_idx on public.recipe_steps (sort_order);

create index if not exists favorites_user_id_idx on public.favorites (user_id);
create index if not exists favorites_recipe_id_idx on public.favorites (recipe_id);

create index if not exists generation_tasks_user_id_idx on public.generation_tasks (user_id);
create index if not exists generation_tasks_status_idx on public.generation_tasks (status);
create index if not exists generation_tasks_created_at_idx on public.generation_tasks (created_at);

-- RLS policies
-- RLS = row level security. These policies are intentionally simple for MVP.
-- Public browsing tables allow read access. User-owned tables stay scoped to
-- auth.uid(). Later private recipes can tighten these policies further.

alter table public.profiles enable row level security;
alter table public.stations enable row level security;
alter table public.recipes enable row level security;
alter table public.ingredients enable row level security;
alter table public.recipe_steps enable row level security;
alter table public.favorites enable row level security;
alter table public.generation_tasks enable row level security;

drop policy if exists "Profiles are readable by owner" on public.profiles;
create policy "Profiles are readable by owner"
on public.profiles
for select
using (auth.uid() = id);

drop policy if exists "Profiles are updatable by owner" on public.profiles;
create policy "Profiles are updatable by owner"
on public.profiles
for update
using (auth.uid() = id)
with check (auth.uid() = id);

drop policy if exists "Profiles are insertable by owner" on public.profiles;
create policy "Profiles are insertable by owner"
on public.profiles
for insert
to authenticated
with check (auth.uid() = id);

drop policy if exists "Stations are publicly readable" on public.stations;
create policy "Stations are publicly readable"
on public.stations
for select
using (true);

drop policy if exists "Recipes are publicly readable" on public.recipes;
drop policy if exists "Public and owner recipes are readable" on public.recipes;
create policy "Public and owner recipes are readable"
on public.recipes
for select
using (user_id is null or (select auth.uid()) = user_id);

drop policy if exists "Authenticated users can create own recipes" on public.recipes;
create policy "Authenticated users can create own recipes"
on public.recipes
for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists "Users can update own recipes" on public.recipes;
create policy "Users can update own recipes"
on public.recipes
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "Users can delete own recipes" on public.recipes;
create policy "Users can delete own recipes"
on public.recipes
for delete
to authenticated
using (auth.uid() = user_id);

drop policy if exists "Ingredients are publicly readable" on public.ingredients;
drop policy if exists "Public and owner ingredients are readable" on public.ingredients;
create policy "Public and owner ingredients are readable"
on public.ingredients
for select
using (
  exists (
    select 1
    from public.recipes
    where recipes.id = ingredients.recipe_id
      and (recipes.user_id is null or recipes.user_id = (select auth.uid()))
  )
);

drop policy if exists "Users can create ingredients for own recipes" on public.ingredients;
create policy "Users can create ingredients for own recipes"
on public.ingredients
for insert
to authenticated
with check (
  exists (
    select 1
    from public.recipes
    where recipes.id = ingredients.recipe_id
      and recipes.user_id = auth.uid()
  )
);

drop policy if exists "Recipe steps are publicly readable" on public.recipe_steps;
drop policy if exists "Public and owner recipe steps are readable" on public.recipe_steps;
create policy "Public and owner recipe steps are readable"
on public.recipe_steps
for select
using (
  exists (
    select 1
    from public.recipes
    where recipes.id = recipe_steps.recipe_id
      and (recipes.user_id is null or recipes.user_id = (select auth.uid()))
  )
);

drop policy if exists "Users can create steps for own recipes" on public.recipe_steps;
create policy "Users can create steps for own recipes"
on public.recipe_steps
for insert
to authenticated
with check (
  exists (
    select 1
    from public.recipes
    where recipes.id = recipe_steps.recipe_id
      and recipes.user_id = auth.uid()
  )
);

drop policy if exists "Users can read own favorites" on public.favorites;
create policy "Users can read own favorites"
on public.favorites
for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "Users can create own favorites" on public.favorites;
create policy "Users can create own favorites"
on public.favorites
for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists "Users can delete own favorites" on public.favorites;
create policy "Users can delete own favorites"
on public.favorites
for delete
to authenticated
using (auth.uid() = user_id);

drop policy if exists "Users can read own generation tasks" on public.generation_tasks;
create policy "Users can read own generation tasks"
on public.generation_tasks
for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "Users can create own generation tasks" on public.generation_tasks;
create policy "Users can create own generation tasks"
on public.generation_tasks
for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists "Users can update own generation tasks" on public.generation_tasks;
create policy "Users can update own generation tasks"
on public.generation_tasks
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);
