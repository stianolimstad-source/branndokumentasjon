create table public.group_templates (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.contact_groups(id) on delete cascade,
  name text not null,
  base_template text not null check (base_template in ('klassisk','moderne','minimalistisk')),
  primary_color text not null,
  accent_color text not null,
  font_family text not null,
  settings jsonb not null default '{}'::jsonb,
  is_default boolean not null default false,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.group_templates enable row level security;

create policy "Members can view group templates"
  on public.group_templates for select
  using (group_id in (select public.get_user_group_ids(auth.uid())));

create policy "Admins can insert group templates"
  on public.group_templates for insert
  with check (public.is_group_admin(group_id, auth.uid()));

create policy "Admins can update group templates"
  on public.group_templates for update
  using (public.is_group_admin(group_id, auth.uid()))
  with check (public.is_group_admin(group_id, auth.uid()));

create policy "Admins can delete group templates"
  on public.group_templates for delete
  using (public.is_group_admin(group_id, auth.uid()));

create unique index group_templates_one_default
  on public.group_templates(group_id) where is_default;

create index group_templates_group_id_idx on public.group_templates(group_id);

create trigger trg_group_templates_updated
  before update on public.group_templates
  for each row execute function public.update_updated_at_column();