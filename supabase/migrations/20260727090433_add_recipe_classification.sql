-- Add recipe classification metadata without changing or deleting existing rows.
alter table public.recipes
  add column if not exists primary_category text,
  add column if not exists primary_ingredient text,
  add column if not exists classification_confidence numeric(4, 3),
  add column if not exists classification_reason text,
  add column if not exists classification_source text;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'recipes_primary_category_check'
      and conrelid = 'public.recipes'::regclass
  ) then
    alter table public.recipes
      add constraint recipes_primary_category_check
      check (
        primary_category is null
        or primary_category in (
          'chicken',
          'duck',
          'pork',
          'beef',
          'lamb',
          'fish',
          'shrimp',
          'crab',
          'other'
        )
      );
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'recipes_classification_confidence_check'
      and conrelid = 'public.recipes'::regclass
  ) then
    alter table public.recipes
      add constraint recipes_classification_confidence_check
      check (
        classification_confidence is null
        or classification_confidence between 0 and 1
      );
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'recipes_classification_source_check'
      and conrelid = 'public.recipes'::regclass
  ) then
    alter table public.recipes
      add constraint recipes_classification_source_check
      check (
        classification_source is null
        or classification_source in ('ai', 'user', 'rule')
      );
  end if;
end
$$;

create index if not exists recipes_user_category_created_at_idx
  on public.recipes (user_id, primary_category, created_at desc);

comment on column public.recipes.primary_category is
  'Stable category ID. Null legacy rows are treated as other by the application.';
comment on column public.recipes.classification_source is
  'Classification origin: ai, user, or rule.';
