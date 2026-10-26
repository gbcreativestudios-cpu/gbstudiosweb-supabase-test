create extension if not exists pgcrypto;

create table if not exists public.site_content (
  id uuid primary key default gen_random_uuid(),
  collection text not null check (
    collection in ('site', 'about', 'projects', 'categories', 'motion_categories', 'testimonials', 'team')
  ),
  slug text not null,
  data jsonb not null default '{}'::jsonb,
  is_published boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (collection, slug)
);

create index if not exists site_content_public_collection_idx
  on public.site_content (collection, is_published);

alter table public.site_content enable row level security;

grant select on public.site_content to anon, authenticated;
grant insert, update, delete on public.site_content to authenticated;

create policy "Published content is public; admins can read all content"
  on public.site_content
  for select
  to anon, authenticated
  using (
    is_published = true
    or (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
  );

create policy "Admins can create content"
  on public.site_content
  for insert
  to authenticated
  with check ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

create policy "Admins can update content"
  on public.site_content
  for update
  to authenticated
  using ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
  with check ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

create policy "Admins can delete content"
  on public.site_content
  for delete
  to authenticated
  using ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

create or replace function public.set_site_content_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists site_content_updated_at on public.site_content;
create trigger site_content_updated_at
before update on public.site_content
for each row execute function public.set_site_content_updated_at();
