-- Fix GoTrue login: "Database error querying schema" for users inserted via raw SQL.
-- Those rows often have NULL in token columns; Auth expects empty strings, not NULL.
-- Safe to run multiple times. Targets courseCopilot demo emails only.
--
-- Ref: https://github.com/supabase/auth/issues/1940

update auth.users
set
  confirmation_token = coalesce(confirmation_token, ''),
  email_change = coalesce(email_change, ''),
  email_change_token_new = coalesce(email_change_token_new, ''),
  recovery_token = coalesce(recovery_token, '')
where email like '%@coursecopilot.demo';
