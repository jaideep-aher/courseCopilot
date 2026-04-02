/**
 * Stakeholder roles (static demo — will map to Supabase roles later).
 */
export const ROLE_IDS = ['student', 'coordinator', 'professor']

export const ROLE_META = {
  student: {
    id: 'student',
    label: 'Student',
    shortLabel: 'Student',
    description: 'Explore transfer options, upload a transcript, and preview matches.',
    loginSubtitle: 'Sign in to your student workspace.',
    homePath: '/student',
  },
  coordinator: {
    id: 'coordinator',
    label: 'University coordinator',
    shortLabel: 'Coordinator',
    description: 'Run batch reviews, monitor catalog data, and support articulation workflows.',
    loginSubtitle: 'Sign in to the coordinator console.',
    homePath: '/coordinator',
  },
  professor: {
    id: 'professor',
    label: 'Professor',
    shortLabel: 'Professor',
    description: 'Submit syllabus details and align courses with the target catalog.',
    loginSubtitle: 'Sign in to the faculty workspace.',
    homePath: '/professor',
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
