-- Course Co-Pilot — production-oriented evaluation storage & workflow
-- Run in Supabase SQL editor or via supabase db push after linking project.
-- Adjust auth.users references if you use a different auth setup.

-- Profiles mirror auth users and carry app role (keep in sync on signup via trigger or app).
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  role text not null check (role in ('student', 'university', 'professor', 'admin')),
  display_name text,
  email text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- One row per transcript/agent evaluation run.
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

-- Optional per-student deadline set by university staff.
create table if not exists public.student_deadlines (
  student_id uuid primary key references public.profiles (id) on delete cascade,
  due_at timestamptz not null,
  set_by uuid references public.profiles (id),
  notes text,
  updated_at timestamptz not null default now()
);

-- Faculty decision on a whole evaluation (MVP: one professor; later per-course rows).
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

-- RLS (enable after testing; tighten for production)
alter table public.profiles enable row level security;
alter table public.evaluations enable row level security;
alter table public.student_deadlines enable row level security;
alter table public.faculty_reviews enable row level security;

-- Example policies (uncomment and refine in Supabase dashboard)
-- Students: read/update own profile; read/insert own evaluations
-- University: read all profiles with role student, all evaluations, manage deadlines
-- Professors: read evaluations in faculty_review; insert/update own faculty_reviews

comment on table public.evaluations is 'Stores each agent run; result_json is the API payload for audit and UI replay.';
