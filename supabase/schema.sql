-- Tbilisi CRM Schema
-- Supabase Migration SQL
--
-- NOTE: The first user to register is automatically assigned the 'admin' role.
-- All subsequent users default to 'agent'. To change this behavior, modify the
-- handle_new_user() trigger function below.

-- ============================================================================
-- 1. TABLES
-- ============================================================================

-- Profiles (extends auth.users)
create table public.profiles (
  id         uuid primary key references auth.users on delete cascade,
  email      text not null,
  full_name  text not null default '',
  role       text not null default 'agent' check (role in ('admin', 'agent')),
  avatar_url text,
  created_at timestamptz not null default now()
);

-- Leads
create table public.leads (
  id             serial primary key,
  name           text not null,
  category       text,
  district       text,
  address        text,
  phone          text,
  source         text,
  status         text not null default 'new'
                   check (status in ('new','contacted','follow-up','proposal','won','lost')),
  priority       text not null default 'medium'
                   check (priority in ('low','medium','high')),
  assigned_to    uuid references public.profiles(id) on delete set null,
  contact_person text,
  contact_email  text,
  last_contact   date,
  website_url    text,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

-- Comments (per-lead)
create table public.comments (
  id         serial primary key,
  lead_id    int not null references public.leads(id) on delete cascade,
  user_id    uuid not null references public.profiles(id),
  text       text not null,
  created_at timestamptz not null default now()
);

-- Activity log
create table public.activity_log (
  id         serial primary key,
  lead_id    int not null references public.leads(id) on delete cascade,
  user_id    uuid not null references public.profiles(id),
  action     text not null,  -- 'status_change', 'assigned', 'comment', 'created', 'updated', 'deleted'
  old_value  text,
  new_value  text,
  created_at timestamptz not null default now()
);

-- ============================================================================
-- 2. INDEXES
-- ============================================================================

create index idx_leads_status      on public.leads(status);
create index idx_leads_category    on public.leads(category);
create index idx_leads_assigned_to on public.leads(assigned_to);
create index idx_comments_lead_id  on public.comments(lead_id);
create index idx_activity_lead_id  on public.activity_log(lead_id);

-- ============================================================================
-- 3. TRIGGER FUNCTIONS
-- ============================================================================

-- Auto-create profile when a new user signs up
-- First user ever gets 'admin' role; all others get 'agent'
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  user_role text;
begin
  if (select count(*) from public.profiles) = 0 then
    user_role := 'admin';
  else
    user_role := 'agent';
  end if;

  insert into public.profiles (id, email, full_name, role)
  values (
    new.id,
    coalesce(new.email, ''),
    coalesce(new.raw_user_meta_data ->> 'full_name', ''),
    user_role
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Auto-update updated_at on leads
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger on_leads_updated
  before update on public.leads
  for each row execute function public.set_updated_at();

-- ============================================================================
-- 4. ROW LEVEL SECURITY
-- ============================================================================

-- Enable RLS on all tables
alter table public.profiles    enable row level security;
alter table public.leads       enable row level security;
alter table public.comments    enable row level security;
alter table public.activity_log enable row level security;

-- Profiles ------------------------------------------------------------------
create policy "Authenticated users can view all profiles"
  on public.profiles for select
  to authenticated
  using (true);

create policy "Users can update their own profile"
  on public.profiles for update
  to authenticated
  using (auth.uid() = id);

-- Leads ---------------------------------------------------------------------
create policy "Authenticated users can view all leads"
  on public.leads for select
  to authenticated
  using (true);

create policy "Authenticated users can insert leads"
  on public.leads for insert
  to authenticated
  with check (true);

create policy "Authenticated users can update leads"
  on public.leads for update
  to authenticated
  using (true);

create policy "Only admins can delete leads"
  on public.leads for delete
  to authenticated
  using (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid()
        and profiles.role = 'admin'
    )
  );

-- Comments ------------------------------------------------------------------
create policy "Authenticated users can view all comments"
  on public.comments for select
  to authenticated
  using (true);

create policy "Authenticated users can insert comments"
  on public.comments for insert
  to authenticated
  with check (true);

create policy "Users can update their own comments"
  on public.comments for update
  to authenticated
  using (auth.uid() = user_id);

create policy "Users can delete their own comments"
  on public.comments for delete
  to authenticated
  using (auth.uid() = user_id);

-- Activity Log --------------------------------------------------------------
create policy "Authenticated users can view all activity"
  on public.activity_log for select
  to authenticated
  using (true);

create policy "Authenticated users can insert activity"
  on public.activity_log for insert
  to authenticated
  with check (true);
