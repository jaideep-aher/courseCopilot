/**
 * Demo auth — all accounts use password: "password"
 * Primary demo pair: username "username" / password "password"
 */
export const DEMO_PASSWORD = 'password'

export const HARDCODED_USERS = [
  { id: '1', username: 'username', displayName: 'Default Evaluator', password: DEMO_PASSWORD },
  { id: '2', username: 'evaluator_a', displayName: 'Dr. Alice Chen', password: DEMO_PASSWORD },
  { id: '3', username: 'evaluator_b', displayName: 'Jordan Reed', password: DEMO_PASSWORD },
  { id: '4', username: 'admin_demo', displayName: 'Admin Demo', password: DEMO_PASSWORD },
]

export function findHardcodedUser(username, password) {
  const u = HARDCODED_USERS.find(
    (x) => x.username === username && x.password === password
  )
  return u || null
}
