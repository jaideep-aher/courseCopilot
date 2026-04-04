-- Course Co-Pilot — dummy evaluations, deadlines, and faculty reviews for 3 students
-- Run in Supabase SQL Editor AFTER 003_seed_demo_users.sql (needs staff UUIDs from that seed).
--
-- Re-runnable: removes prior rows tagged with summary/notes prefix 'SEED_DEMO |' and removes
-- extra student auth accounts cc.student2 / cc.student3 before re-inserting.
--
-- Password for new student logins (same as 003): CourseCopilotDemo2026!

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------------
-- Teardown previous 004 run
-- ---------------------------------------------------------------------------
delete from public.faculty_reviews
where evaluation_id in (select id from public.evaluations where summary like 'SEED_DEMO |%');

delete from public.student_deadlines
where notes like 'SEED_DEMO |%';

delete from public.evaluations
where summary like 'SEED_DEMO |%';

delete from auth.identities
where user_id in (
  select id
  from auth.users
  where email in (
    'cc.student2@coursecopilot.demo',
    'cc.student3@coursecopilot.demo'
  )
);

delete from auth.users
where email in (
  'cc.student2@coursecopilot.demo',
  'cc.student3@coursecopilot.demo'
);

-- UUIDs (stable)
-- Student 1 already exists from 003: a1000001-0001-4000-8000-000000000001
-- Coordinator (set_by deadlines): ...000003
-- Professor (faculty_reviews): ...000004

-- ---------------------------------------------------------------------------
-- Two additional students (auth + identities + trigger-created profiles)
-- ---------------------------------------------------------------------------
do $$
declare
  v_pw text := crypt('CourseCopilotDemo2026!', gen_salt('bf'));
  v_instance uuid := '00000000-0000-0000-0000-000000000000'::uuid;
begin
  if exists (select 1 from auth.users limit 1) then
    select instance_id into strict v_instance from auth.users limit 1;
  end if;

  insert into auth.users (
    id, instance_id, aud, role, email, encrypted_password,
    email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
    confirmation_token, email_change, email_change_token_new, recovery_token
  ) values (
    'a1000001-0001-4000-8000-000000000006'::uuid,
    v_instance,
    'authenticated',
    'authenticated',
    'cc.student2@coursecopilot.demo',
    v_pw,
    now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{"role":"student","full_name":"Sam Okonkwo"}'::jsonb,
    now(),
    now(),
    '', '', '', ''
  );

  insert into auth.identities (id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at)
  values (
    gen_random_uuid(),
    'a1000001-0001-4000-8000-000000000006'::uuid,
    jsonb_build_object(
      'sub', 'a1000001-0001-4000-8000-000000000006'::text,
      'email', 'cc.student2@coursecopilot.demo'
    ),
    'email',
    'a1000001-0001-4000-8000-000000000006'::uuid,
    now(), now(), now()
  );

  insert into auth.users (
    id, instance_id, aud, role, email, encrypted_password,
    email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
    confirmation_token, email_change, email_change_token_new, recovery_token
  ) values (
    'a1000001-0001-4000-8000-000000000007'::uuid,
    v_instance,
    'authenticated',
    'authenticated',
    'cc.student3@coursecopilot.demo',
    v_pw,
    now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{"role":"student","full_name":"Taylor Nguyen"}'::jsonb,
    now(),
    now(),
    '', '', '', ''
  );

  insert into auth.identities (id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at)
  values (
    gen_random_uuid(),
    'a1000001-0001-4000-8000-000000000007'::uuid,
    jsonb_build_object(
      'sub', 'a1000001-0001-4000-8000-000000000007'::text,
      'email', 'cc.student3@coursecopilot.demo'
    ),
    'email',
    'a1000001-0001-4000-8000-000000000007'::uuid,
    now(), now(), now()
  );
end $$;

-- Ensure profiles reflect names (trigger usually handles; safe upsert for edge cases)
insert into public.profiles (id, role, email, display_name)
values
  ('a1000001-0001-4000-8000-000000000006'::uuid, 'student', 'cc.student2@coursecopilot.demo', 'Sam Okonkwo'),
  ('a1000001-0001-4000-8000-000000000007'::uuid, 'student', 'cc.student3@coursecopilot.demo', 'Taylor Nguyen')
on conflict (id) do update
set
  email = excluded.email,
  display_name = excluded.display_name,
  role = excluded.role,
  updated_at = now();

-- ---------------------------------------------------------------------------
-- Sample result_json (shape compatible with transcript pipeline UI)
-- ---------------------------------------------------------------------------
-- Evaluations: fixed IDs for stable references in faculty_reviews
insert into public.evaluations (
  id,
  student_id,
  target_university,
  status,
  result_json,
  summary,
  courses_evaluated,
  created_at,
  updated_at
) values
(
  'f2000001-0001-4000-8000-000000000001'::uuid,
  'a1000001-0001-4000-8000-000000000001'::uuid,
  'Duke',
  'faculty_review',
  $json$
  {
    "request_id": "demo-req-riley-001",
    "source_university": "Metro State College",
    "target_university": "Duke",
    "courses_parsed": 4,
    "source_courses_researched": 4,
    "target_courses_researched": 14,
    "recommendations": [
      {
        "source_course": {
          "course_code": "MATH 241",
          "course_title": "Calculus I",
          "category": "Mathematics",
          "file_name": "demo-math-241"
        },
        "matches": [],
        "recommendation": "review",
        "confidence": "medium",
        "rationale": "Overlapping single-variable calculus topics; lab component differs."
      }
    ],
    "transcript_parse": {
      "source_university": "Metro State College",
      "courses": [],
      "student_name": "Riley Morgan",
      "student_id": "MS-88421",
      "confidence": "high",
      "warnings": []
    },
    "summary": { "total_evaluated": 4, "by_recommendation": { "review": 2, "approve": 1, "deny": 1 } },
    "processing_time_seconds": 412.3
  }
  $json$::jsonb,
  'SEED_DEMO | Riley Morgan · Duke — awaiting faculty review',
  4,
  now() - interval '5 days',
  now() - interval '1 day'
),
(
  'f2000001-0001-4000-8000-000000000002'::uuid,
  'a1000001-0001-4000-8000-000000000006'::uuid,
  'MIT',
  'approved',
  $json$
  {
    "request_id": "demo-req-sam-001",
    "source_university": "Pacific Northwest CC",
    "target_university": "MIT",
    "courses_parsed": 3,
    "source_courses_researched": 3,
    "target_courses_researched": 9,
    "recommendations": [],
    "transcript_parse": {
      "source_university": "Pacific Northwest CC",
      "courses": [],
      "student_name": "Sam Okonkwo",
      "degree_program": "A.S. Computer Science",
      "confidence": "medium",
      "warnings": ["One line item had low OCR confidence"]
    },
    "summary": { "total_evaluated": 3 },
    "processing_time_seconds": 305.0
  }
  $json$::jsonb,
  'SEED_DEMO | Sam Okonkwo · MIT — approved',
  3,
  now() - interval '12 days',
  now() - interval '3 days'
),
(
  'f2000001-0001-4000-8000-000000000003'::uuid,
  'a1000001-0001-4000-8000-000000000007'::uuid,
  'Stanford',
  'coordinator_review',
  $json$
  {
    "request_id": "demo-req-taylor-001",
    "source_university": "Houston Community College",
    "target_university": "Stanford",
    "courses_parsed": 5,
    "source_courses_researched": 5,
    "target_courses_researched": 18,
    "recommendations": [],
    "transcript_parse": {
      "source_university": "Houston Community College",
      "courses": [],
      "student_name": "Taylor Nguyen",
      "gpa_info": { "cumulative": "3.65" },
      "confidence": "high",
      "warnings": []
    },
    "summary": { "total_evaluated": 5 },
    "processing_time_seconds": 540.8
  }
  $json$::jsonb,
  'SEED_DEMO | Taylor Nguyen · Stanford — coordinator review',
  5,
  now() - interval '2 days',
  now()
);

-- ---------------------------------------------------------------------------
-- student_deadlines (all columns)
-- ---------------------------------------------------------------------------
insert into public.student_deadlines (student_id, due_at, set_by, notes, updated_at)
values
(
  'a1000001-0001-4000-8000-000000000001'::uuid,
  now() + interval '21 days',
  'a1000001-0001-4000-8000-000000000003'::uuid,
  'SEED_DEMO | Complete any outstanding syllabus uploads before faculty review.',
  now()
),
(
  'a1000001-0001-4000-8000-000000000006'::uuid,
  now() + interval '30 days',
  'a1000001-0001-4000-8000-000000000003'::uuid,
  'SEED_DEMO | Submit official syllabi and catalog links by this date.',
  now()
),
(
  'a1000001-0001-4000-8000-000000000007'::uuid,
  now() + interval '14 days',
  'a1000001-0001-4000-8000-000000000003'::uuid,
  'SEED_DEMO | Priority window for spring transfer articulation.',
  now()
);

-- ---------------------------------------------------------------------------
-- faculty_reviews (all columns) — professor seed from 003
-- ---------------------------------------------------------------------------
insert into public.faculty_reviews (
  id,
  evaluation_id,
  professor_id,
  decision,
  notes,
  decided_at,
  created_at
) values
(
  'b3000001-0001-4000-8000-000000000001'::uuid,
  'f2000001-0001-4000-8000-000000000001'::uuid,
  'a1000001-0001-4000-8000-000000000004'::uuid,
  'pending',
  null,
  null,
  now() - interval '4 days'
),
(
  'b3000001-0001-4000-8000-000000000002'::uuid,
  'f2000001-0001-4000-8000-000000000002'::uuid,
  'a1000001-0001-4000-8000-000000000004'::uuid,
  'approved',
  'Demo seed: aligns with department transfer policy for lower-division CS.',
  now() - interval '4 days',
  now() - interval '10 days'
);
