-- Course Co-Pilot — RLS policies + auto profile on signup
-- Run AFTER 001_evaluation_workflow.sql in Supabase → SQL Editor (as postgres / dashboard).
-- Do NOT paste service_role keys into git or chat; use SQL Editor only.

-- -----------------------------------------------------------------------------
-- 1) Align app role name: frontend uses "coordinator" for university staff
-- -----------------------------------------------------------------------------
alter table public.profiles drop constraint if exists profiles_role_check;
alter table public.profiles add constraint profiles_role_check
  check (role in ('student', 'university', 'coordinator', 'professor', 'admin'));

-- -----------------------------------------------------------------------------
-- 2) New auth user → row in public.profiles (default role: student)
-- Optional: set role at signup via Supabase Auth → user metadata: { "role": "professor" }
-- Allowed metadata roles: student, university, coordinator, professor, admin
-- -----------------------------------------------------------------------------
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

-- Backfill profiles for existing auth users (safe to re-run)
insert into public.profiles (id, role, email, display_name)
select
  u.id,
  'student',
  u.email,
  coalesce(u.raw_user_meta_data->>'full_name', split_part(u.email, '@', 1))
from auth.users u
where not exists (select 1 from public.profiles p where p.id = u.id)
on conflict (id) do nothing;

-- -----------------------------------------------------------------------------
-- 3) Drop old policies if re-running this migration
-- -----------------------------------------------------------------------------
drop policy if exists "profiles_select" on public.profiles;
drop policy if exists "profiles_update_own" on public.profiles;
drop policy if exists "evaluations_select" on public.evaluations;
drop policy if exists "evaluations_insert_student" on public.evaluations;
drop policy if exists "evaluations_insert_staff" on public.evaluations;
drop policy if exists "evaluations_update_staff" on public.evaluations;
drop policy if exists "deadlines_select" on public.student_deadlines;
drop policy if exists "deadlines_write_staff" on public.student_deadlines;
drop policy if exists "faculty_reviews_select" on public.faculty_reviews;
drop policy if exists "faculty_reviews_write" on public.faculty_reviews;
drop policy if exists "faculty_reviews_update" on public.faculty_reviews;
drop policy if exists "deadlines_update_staff" on public.student_deadlines;
drop policy if exists "deadlines_delete_staff" on public.student_deadlines;

-- -----------------------------------------------------------------------------
-- 4) profiles
-- -----------------------------------------------------------------------------
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

-- -----------------------------------------------------------------------------
-- 5) evaluations
-- -----------------------------------------------------------------------------
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

-- Staff can insert on behalf of a student (optional; comment out if you only want self-insert)
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

-- -----------------------------------------------------------------------------
-- 6) student_deadlines
-- -----------------------------------------------------------------------------
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

-- -----------------------------------------------------------------------------
-- 7) faculty_reviews
-- -----------------------------------------------------------------------------
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

-- -----------------------------------------------------------------------------
-- 8) Realtime (optional): expose evaluations to student clients
-- -----------------------------------------------------------------------------
-- In Dashboard: Database → Replication → enable for tables you want, or:
-- alter publication supabase_realtime add table public.evaluations;

comment on function public.handle_new_user() is 'Creates profiles row; optional auth metadata role: student|university|coordinator|professor|admin';
