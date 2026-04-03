-- =============================================================================
-- Course Co-Pilot — run ONCE in Supabase → SQL Editor → New query → Run
-- Project ref: noektljrmmnufujpgqhc
-- https://supabase.com/dashboard/project/noektljrmmnufujpgqhc/sql/new
-- =============================================================================

-- ----- 001 tables -----
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  role text not null check (role in ('student', 'university', 'professor', 'admin')),
  display_name text,
  email text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.evaluations (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.profiles (id) on delete cascade,
  target_university text not null,
  status text not null default 'model_complete'
    check (status in (
      'draft',
      'processing',
      'model_complete',
      'coordinator_review',
      'faculty_review',
      'approved',
      'rejected',
      'closed'
    )),
  result_json jsonb,
  summary text,
  courses_evaluated int default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists evaluations_student_id_idx on public.evaluations (student_id);
create index if not exists evaluations_status_idx on public.evaluations (status);

create table if not exists public.student_deadlines (
  student_id uuid primary key references public.profiles (id) on delete cascade,
  due_at timestamptz not null,
  set_by uuid references public.profiles (id),
  notes text,
  updated_at timestamptz not null default now()
);

create table if not exists public.faculty_reviews (
  id uuid primary key default gen_random_uuid(),
  evaluation_id uuid not null references public.evaluations (id) on delete cascade,
  professor_id uuid not null references public.profiles (id) on delete cascade,
  decision text not null default 'pending' check (decision in ('pending', 'approved', 'rejected')),
  notes text,
  decided_at timestamptz,
  created_at timestamptz not null default now(),
  unique (evaluation_id, professor_id)
);

alter table public.profiles enable row level security;
alter table public.evaluations enable row level security;
alter table public.student_deadlines enable row level security;
alter table public.faculty_reviews enable row level security;

comment on table public.evaluations is 'Stores each agent run; result_json is the API payload for audit and UI replay.';

-- ----- 002 role + trigger + RLS -----
alter table public.profiles drop constraint if exists profiles_role_check;
alter table public.profiles add constraint profiles_role_check
  check (role in ('student', 'university', 'coordinator', 'professor', 'admin'));

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  r text;
begin
  r := coalesce(
    nullif(trim(new.raw_user_meta_data->>'role'), ''),
    'student'
  );
  if r not in ('student', 'university', 'coordinator', 'professor', 'admin') then
    r := 'student';
  end if;

  insert into public.profiles (id, role, email, display_name)
  values (
    new.id,
    r,
    new.email,
    coalesce(
      nullif(trim(new.raw_user_meta_data->>'full_name'), ''),
      nullif(trim(new.raw_user_meta_data->>'name'), ''),
      split_part(new.email, '@', 1)
    )
  );

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

insert into public.profiles (id, role, email, display_name)
select
  u.id,
  'student',
  u.email,
  coalesce(u.raw_user_meta_data->>'full_name', split_part(u.email, '@', 1))
from auth.users u
where not exists (select 1 from public.profiles p where p.id = u.id)
on conflict (id) do nothing;

drop policy if exists "profiles_select" on public.profiles;
drop policy if exists "profiles_update_own" on public.profiles;
drop policy if exists "evaluations_select" on public.evaluations;
drop policy if exists "evaluations_insert_student" on public.evaluations;
drop policy if exists "evaluations_insert_staff" on public.evaluations;
drop policy if exists "evaluations_update_staff" on public.evaluations;
drop policy if exists "deadlines_select" on public.student_deadlines;
drop policy if exists "deadlines_write_staff" on public.student_deadlines;
drop policy if exists "deadlines_update_staff" on public.student_deadlines;
drop policy if exists "deadlines_delete_staff" on public.student_deadlines;
drop policy if exists "faculty_reviews_select" on public.faculty_reviews;
drop policy if exists "faculty_reviews_write" on public.faculty_reviews;
drop policy if exists "faculty_reviews_update" on public.faculty_reviews;

create policy "profiles_select"
  on public.profiles for select
  to authenticated
  using (
    id = auth.uid()
    or exists (
      select 1 from public.profiles me
      where me.id = auth.uid()
        and me.role in ('university', 'coordinator', 'admin')
    )
    or exists (
      select 1 from public.profiles me
      where me.id = auth.uid() and me.role = 'professor'
    )
  );

create policy "profiles_update_own"
  on public.profiles for update
  to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

create policy "evaluations_select"
  on public.evaluations for select
  to authenticated
  using (
    student_id = auth.uid()
    or exists (
      select 1 from public.profiles me
      where me.id = auth.uid()
        and me.role in ('university', 'coordinator', 'admin')
    )
    or (
      exists (
        select 1 from public.profiles me
        where me.id = auth.uid() and me.role = 'professor'
      )
      and status in ('faculty_review', 'model_complete', 'coordinator_review')
    )
  );

create policy "evaluations_insert_student"
  on public.evaluations for insert
  to authenticated
  with check (
    student_id = auth.uid()
    and exists (
      select 1 from public.profiles s
      where s.id = auth.uid() and s.role = 'student'
    )
  );

create policy "evaluations_insert_staff"
  on public.evaluations for insert
  to authenticated
  with check (
    exists (
      select 1 from public.profiles me
      where me.id = auth.uid()
        and me.role in ('university', 'coordinator', 'admin')
    )
  );

create policy "evaluations_update_staff"
  on public.evaluations for update
  to authenticated
  using (
    exists (
      select 1 from public.profiles me
      where me.id = auth.uid()
        and me.role in ('university', 'coordinator', 'admin')
    )
    or (
      exists (
        select 1 from public.profiles me
        where me.id = auth.uid() and me.role = 'professor'
      )
      and evaluations.status in ('faculty_review', 'model_complete', 'coordinator_review')
    )
  );

create policy "deadlines_select"
  on public.student_deadlines for select
  to authenticated
  using (
    student_id = auth.uid()
    or exists (
      select 1 from public.profiles me
      where me.id = auth.uid()
        and me.role in ('university', 'coordinator', 'admin')
    )
  );

create policy "deadlines_write_staff"
  on public.student_deadlines for insert
  to authenticated
  with check (
    exists (
      select 1 from public.profiles me
      where me.id = auth.uid()
        and me.role in ('university', 'coordinator', 'admin')
    )
  );

create policy "deadlines_update_staff"
  on public.student_deadlines for update
  to authenticated
  using (
    exists (
      select 1 from public.profiles me
      where me.id = auth.uid()
        and me.role in ('university', 'coordinator', 'admin')
    )
  );

create policy "deadlines_delete_staff"
  on public.student_deadlines for delete
  to authenticated
  using (
    exists (
      select 1 from public.profiles me
      where me.id = auth.uid()
        and me.role in ('university', 'coordinator', 'admin')
    )
  );

create policy "faculty_reviews_select"
  on public.faculty_reviews for select
  to authenticated
  using (
    professor_id = auth.uid()
    or exists (
      select 1 from public.profiles me
      where me.id = auth.uid()
        and me.role in ('university', 'coordinator', 'admin')
    )
    or exists (
      select 1 from public.evaluations e
      where e.id = evaluation_id and e.student_id = auth.uid()
    )
  );

create policy "faculty_reviews_write"
  on public.faculty_reviews for insert
  to authenticated
  with check (
    professor_id = auth.uid()
    and exists (
      select 1 from public.profiles me
      where me.id = auth.uid() and me.role = 'professor'
    )
  );

create policy "faculty_reviews_update"
  on public.faculty_reviews for update
  to authenticated
  using (
    professor_id = auth.uid()
    or exists (
      select 1 from public.profiles me
      where me.id = auth.uid()
        and me.role in ('university', 'coordinator', 'admin')
    )
  );

comment on function public.handle_new_user() is 'Creates profiles row; optional auth metadata role: student|university|coordinator|professor|admin';
