-- Reliable profile read after sign-in: direct SELECT on profiles can return 0 rows when
-- the JWT is not yet applied to PostgREST requests (RLS sees auth.uid() as null).
-- This function runs as definer but still filters by auth.uid() — caller only ever sees their row.
--
-- Run in Supabase SQL Editor after 002. Frontend calls supabase.rpc('get_my_profile').

create or replace function public.get_my_profile()
returns jsonb
language sql
security definer
set search_path = public
stable
as $$
  select jsonb_build_object(
    'role', p.role,
    'display_name', p.display_name,
    'email', p.email
  )
  from public.profiles p
  where p.id = auth.uid()
  limit 1;
$$;

revoke all on function public.get_my_profile() from public;
revoke all on function public.get_my_profile() from anon;
grant execute on function public.get_my_profile() to authenticated;

comment on function public.get_my_profile() is 'Returns current user profile row as JSON; bypasses RLS timing issues on direct table select.';
