/**
 * Mirrors supabase/migrations/003_seed_demo_users.sql (+ 004 extra students).
 * Password must match those SQL files.
 */
export const SUPABASE_SEED_DEMO_PASSWORD = 'CourseCopilotDemo2026!'

export const SUPABASE_SEED_ACCOUNTS = [
  { email: 'cc.student@coursecopilot.demo', role: 'student', label: 'Seed: Student (Riley)' },
  { email: 'cc.student2@coursecopilot.demo', role: 'student', label: 'Seed: Student (Sam)' },
  { email: 'cc.student3@coursecopilot.demo', role: 'student', label: 'Seed: Student (Taylor)' },
  { email: 'cc.university@coursecopilot.demo', role: 'university', label: 'Seed: University' },
  { email: 'cc.coordinator@coursecopilot.demo', role: 'coordinator', label: 'Seed: Coordinator' },
  { email: 'cc.professor@coursecopilot.demo', role: 'professor', label: 'Seed: Professor' },
  { email: 'cc.admin@coursecopilot.demo', role: 'admin', label: 'Seed: Admin' },
]
