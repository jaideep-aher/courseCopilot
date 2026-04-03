/**
 * Stakeholder roles (demo usernames and cloud profiles both use these ids).
 * coordinator = university / articulation staff (evaluators). admin = ops / IT-style access.
 */
export const ROLE_IDS = ['student', 'university', 'coordinator', 'professor', 'admin']

export const ROLE_META = {
  student: {
    id: 'student',
    label: 'Student',
    shortLabel: 'Student',
    description: 'Upload a transcript, quick-match courses, and browse the catalog — no staff tools.',
    loginSubtitle: 'Sign in to your student workspace.',
    homePath: '/student',
  },
  university: {
    id: 'university',
    label: 'University (registrar)',
    shortLabel: 'University',
    description: 'Same evaluator tools as coordinators — articulation, deadlines, and evaluation log (RLS role university).',
    loginSubtitle: 'Sign in as university / registrar staff.',
    homePath: '/coordinator',
  },
  coordinator: {
    id: 'coordinator',
    label: 'Coordinator',
    shortLabel: 'Coordinator',
    description: 'Dashboard, batch runs, syllabus matching, and coordinator queue — articulation / evaluator tools.',
    loginSubtitle: 'Sign in as articulation coordinator.',
    homePath: '/coordinator',
  },
  professor: {
    id: 'professor',
    label: 'Faculty',
    shortLabel: 'Faculty',
    description: 'Syllabus alignment and catalog tools — separate from student transcript flow.',
    loginSubtitle: 'Sign in to the faculty workspace.',
    homePath: '/professor',
  },
  admin: {
    id: 'admin',
    label: 'Administrator',
    shortLabel: 'Admin',
    description: 'Same operational tools as university staff, labeled for admin / oversight accounts.',
    loginSubtitle: 'Sign in to the admin console.',
    homePath: '/coordinator',
  },
}

export function isValidRole(value) {
  return typeof value === 'string' && ROLE_IDS.includes(value)
}

export function parseRoleParam(value) {
  if (isValidRole(value)) return value
  return 'coordinator'
}

export function defaultPathForRole(role) {
  return ROLE_META[role]?.homePath ?? '/coordinator'
}
