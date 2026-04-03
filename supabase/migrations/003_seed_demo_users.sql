-- Course Co-Pilot — verified demo auth users (one per app role)
-- Run in Supabase → SQL Editor AFTER 001 + 002 (needs handle_new_user trigger on auth.users).
--
-- Shared password for all accounts below (change in Supabase Auth or via SQL after first login):
--   CourseCopilotDemo2026!
--
-- Token columns must be '' not NULL — otherwise sign-in returns "Database error querying schema"
-- (GoTrue cannot scan NULL into string fields). See supabase/auth#1940.
--
-- Emails use @coursecopilot.demo so you can delete/re-run safely:
--   delete from auth.identities where user_id in (select id from auth.users where email like '%@coursecopilot.demo');
--   delete from auth.users where email like '%@coursecopilot.demo';

create extension if not exists pgcrypto;

-- Remove previous seed
delete from auth.identities
where user_id in (select id from auth.users where email like '%@coursecopilot.demo');

delete from auth.users
where email like '%@coursecopilot.demo';

-- Fixed UUIDs keep URLs/docs stable; profiles are created by on_auth_user_created (002).
do $$
declare
  v_pw text := crypt('CourseCopilotDemo2026!', gen_salt('bf'));
  v_instance uuid := '00000000-0000-0000-0000-000000000000'::uuid;
begin
  -- If your project already has users, prefer its instance_id (run: select instance_id from auth.users limit 1;)
  if exists (select 1 from auth.users limit 1) then
    select instance_id into strict v_instance from auth.users limit 1;
  end if;

  -- student
  insert into auth.users (
    id, instance_id, aud, role, email, encrypted_password,
    email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
    confirmation_token, email_change, email_change_token_new, recovery_token
  ) values (
    'a1000001-0001-4000-8000-000000000001'::uuid,
    v_instance,
    'authenticated',
    'authenticated',
    'cc.student@coursecopilot.demo',
    v_pw,
    now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{"role":"student","full_name":"Riley Morgan"}'::jsonb,
    now(),
    now(),
    '', '', '', ''
  );

  insert into auth.identities (id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at)
  values (
    gen_random_uuid(),
    'a1000001-0001-4000-8000-000000000001'::uuid,
    jsonb_build_object(
      'sub', 'a1000001-0001-4000-8000-000000000001'::text,
      'email', 'cc.student@coursecopilot.demo'
    ),
    'email',
    'a1000001-0001-4000-8000-000000000001'::uuid,
    now(), now(), now()
  );

  -- university (articulation / registrar-style staff in RLS)
  insert into auth.users (
    id, instance_id, aud, role, email, encrypted_password,
    email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
    confirmation_token, email_change, email_change_token_new, recovery_token
  ) values (
    'a1000001-0001-4000-8000-000000000002'::uuid,
    v_instance,
    'authenticated',
    'authenticated',
    'cc.university@coursecopilot.demo',
    v_pw,
    now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{"role":"university","full_name":"Jordan Lee"}'::jsonb,
    now(),
    now(),
    '', '', '', ''
  );

  insert into auth.identities (id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at)
  values (
    gen_random_uuid(),
    'a1000001-0001-4000-8000-000000000002'::uuid,
    jsonb_build_object(
      'sub', 'a1000001-0001-4000-8000-000000000002'::text,
      'email', 'cc.university@coursecopilot.demo'
    ),
    'email',
    'a1000001-0001-4000-8000-000000000002'::uuid,
    now(), now(), now()
  );

  -- coordinator
  insert into auth.users (
    id, instance_id, aud, role, email, encrypted_password,
    email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
    confirmation_token, email_change, email_change_token_new, recovery_token
  ) values (
    'a1000001-0001-4000-8000-000000000003'::uuid,
    v_instance,
    'authenticated',
    'authenticated',
    'cc.coordinator@coursecopilot.demo',
    v_pw,
    now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{"role":"coordinator","full_name":"Sam Rivera"}'::jsonb,
    now(),
    now(),
    '', '', '', ''
  );

  insert into auth.identities (id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at)
  values (
    gen_random_uuid(),
    'a1000001-0001-4000-8000-000000000003'::uuid,
    jsonb_build_object(
      'sub', 'a1000001-0001-4000-8000-000000000003'::text,
      'email', 'cc.coordinator@coursecopilot.demo'
    ),
    'email',
    'a1000001-0001-4000-8000-000000000003'::uuid,
    now(), now(), now()
  );

  -- professor
  insert into auth.users (
    id, instance_id, aud, role, email, encrypted_password,
    email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
    confirmation_token, email_change, email_change_token_new, recovery_token
  ) values (
    'a1000001-0001-4000-8000-000000000004'::uuid,
    v_instance,
    'authenticated',
    'authenticated',
    'cc.professor@coursecopilot.demo',
    v_pw,
    now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{"role":"professor","full_name":"Dr. Avery Kim"}'::jsonb,
    now(),
    now(),
    '', '', '', ''
  );

  insert into auth.identities (id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at)
  values (
    gen_random_uuid(),
    'a1000001-0001-4000-8000-000000000004'::uuid,
    jsonb_build_object(
      'sub', 'a1000001-0001-4000-8000-000000000004'::text,
      'email', 'cc.professor@coursecopilot.demo'
    ),
    'email',
    'a1000001-0001-4000-8000-000000000004'::uuid,
    now(), now(), now()
  );

  -- admin
  insert into auth.users (
    id, instance_id, aud, role, email, encrypted_password,
    email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
    confirmation_token, email_change, email_change_token_new, recovery_token
  ) values (
    'a1000001-0001-4000-8000-000000000005'::uuid,
    v_instance,
    'authenticated',
    'authenticated',
    'cc.admin@coursecopilot.demo',
    v_pw,
    now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{"role":"admin","full_name":"Morgan Patel"}'::jsonb,
    now(),
    now(),
    '', '', '', ''
  );

  insert into auth.identities (id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at)
  values (
    gen_random_uuid(),
    'a1000001-0001-4000-8000-000000000005'::uuid,
    jsonb_build_object(
      'sub', 'a1000001-0001-4000-8000-000000000005'::text,
      'email', 'cc.admin@coursecopilot.demo'
    ),
    'email',
    'a1000001-0001-4000-8000-000000000005'::uuid,
    now(), now(), now()
  );
end $$;
