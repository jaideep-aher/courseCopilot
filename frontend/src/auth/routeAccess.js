import { defaultPathForRole, isValidRole } from './roles'

/**
 * Allow-list: each role may only open these URL patterns (plus React Router 404 handling).
 * Students use /student/* tools; faculty use /professor/*; university/admin use /courses, /catalog-match, etc.
 */
export function isPathAllowedForRole(role, pathname) {
  const p = pathname || '/'
  if (!isValidRole(role)) return true

  if (role === 'student') {
    if (/^\/student(\/|$)/.test(p)) return true
    if (p === '/transcript') return true
    return false
  }

  if (role === 'coordinator' || role === 'university' || role === 'admin') {
    return (
      /^\/coordinator(\/|$)/.test(p) ||
      p === '/dashboard' ||
      p === '/batch' ||
      /^\/courses(\/|$)/.test(p) ||
      p === '/catalog-match' ||
      /^\/match(\/|$)/.test(p) ||
      p === '/transcript' ||
      p === '/workbench' ||
      p === '/resources'
    )
  }

  if (role === 'professor') {
    return /^\/professor(\/|$)/.test(p) || /^\/match(\/|$)/.test(p) || p === '/workbench'
  }

  return false
}

export function redirectPathForRole(role) {
  return defaultPathForRole(isValidRole(role) ? role : 'coordinator')
}

/**
 * True when this URL clearly belongs to another portal (redirect home).
 * Unknown paths return false so we can show 404 instead of bouncing.
 */
export function isCrossPortalViolation(role, pathname) {
  const p = pathname || '/'

  if (role === 'student') {
    return (
      /^\/coordinator(\/|$)/.test(p) ||
      /^\/professor(\/|$)/.test(p) ||
      p === '/dashboard' ||
      p === '/batch' ||
      /^\/courses(\/|$)/.test(p) ||
      p === '/catalog-match' ||
      /^\/match(\/|$)/.test(p) ||
      p === '/workbench' ||
      p === '/resources'
    )
  }

  if (role === 'coordinator' || role === 'university' || role === 'admin') {
    return /^\/student(\/|$)/.test(p) || /^\/professor(\/|$)/.test(p)
  }

  if (role === 'professor') {
    return (
      /^\/student(\/|$)/.test(p) ||
      /^\/coordinator(\/|$)/.test(p) ||
      p === '/dashboard' ||
      p === '/batch' ||
      /^\/courses(\/|$)/.test(p) ||
      p === '/catalog-match' ||
      p === '/resources' ||
      p === '/transcript'
    )
  }

  return false
}

/** @deprecated use !isPathAllowedForRole */
export function isPathForbiddenForRole(role, pathname) {
  return !isPathAllowedForRole(role, pathname)
}
