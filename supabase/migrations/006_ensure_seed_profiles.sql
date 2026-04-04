-- Ensure public.profiles rows exist for SQL-seeded demo auth users.
-- If auth.users was created while the trigger failed, was skipped, or profiles were deleted,
-- sign-in succeeds but the app sees "Account exists but has no profile".
--
-- Safe to re-run (upserts). Matches UUIDs from 003_seed_demo_users.sql + 004 (student2/3).

insert into public.profiles (id, role, email, display_name, updated_at)
values
  ('a1000001-0001-4000-8000-000000000001'::uuid, 'student', 'cc.student@coursecopilot.demo', 'Riley Morgan', now()),
  ('a1000001-0001-4000-8000-000000000002'::uuid, 'university', 'cc.university@coursecopilot.demo', 'Jordan Lee', now()),
  ('a1000001-0001-4000-8000-000000000003'::uuid, 'coordinator', 'cc.coordinator@coursecopilot.demo', 'Sam Rivera', now()),
  ('a1000001-0001-4000-8000-000000000004'::uuid, 'professor', 'cc.professor@coursecopilot.demo', 'Dr. Avery Kim', now()),
  ('a1000001-0001-4000-8000-000000000005'::uuid, 'admin', 'cc.admin@coursecopilot.demo', 'Morgan Patel', now()),
  ('a1000001-0001-4000-8000-000000000006'::uuid, 'student', 'cc.student2@coursecopilot.demo', 'Sam Okonkwo', now()),
  ('a1000001-0001-4000-8000-000000000007'::uuid, 'student', 'cc.student3@coursecopilot.demo', 'Taylor Nguyen', now())
on conflict (id) do update
set
  role = excluded.role,
  email = excluded.email,
  display_name = excluded.display_name,
  updated_at = now();
