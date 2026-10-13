import { ExecutionMethod } from 'appwrite'
import { account, functions, teams } from './appwrite'

export const ADMIN_TEAM_ID = '68866cde003207e2fbab'
export const ADMIN_ACCOUNT_NAME = 'Administrator'

const EMPLOYEE_CACHE_KEY = 'employee-list'

/**
 * Lists all users via the backend function. The result is mirrored into
 * localStorage because function executions are POST requests and therefore
 * not covered by the service worker cache — without it the list is empty offline.
 * @returns {Promise<Array<{ $id: string, name: string }>>}
 */
export async function fetchUsers() {
  try {
    const res = await functions.createExecution(
      '69b18cbb0036de675223',
      '{}',
      false,
      '/listusers',
      ExecutionMethod.GET,
    )
    const users = JSON.parse(res.responseBody).users.map((u) => ({ $id: u.$id, name: u.name }))
    try {
      localStorage.setItem(EMPLOYEE_CACHE_KEY, JSON.stringify(users))
    } catch {
      // ignore
    }
    return users
  } catch (err) {
    try {
      const cached = JSON.parse(localStorage.getItem(EMPLOYEE_CACHE_KEY))
      if (Array.isArray(cached)) return cached
    } catch {
      // ignore
    }
    console.error('Failed to fetch user list', err)
    return []
  }
}

/**
 * Employees an admin may create documents on behalf of — everyone except the
 * shared "Administrator" account, sorted by name.
 */
export function selectableEmployees(users) {
  return users
    .filter((u) => u.name && u.name !== ADMIN_ACCOUNT_NAME)
    .sort((a, b) => a.name.localeCompare(b.name))
}

/**
 * @returns {Promise<{ user: object | null, isAdmin: boolean }>}
 */
export async function getCurrentUserContext() {
  let user = null
  try {
    user = await account.get()
  } catch (err) {
    console.error('Failed to load current user', err)
    return { user: null, isAdmin: false }
  }

  let isAdmin = user.name === ADMIN_ACCOUNT_NAME
  try {
    const memberships = await teams.listMemberships(ADMIN_TEAM_ID)
    isAdmin = isAdmin || memberships.memberships.some((m) => m.userId === user.$id)
  } catch {
    // not a team member (or offline) — keep the name-based result
  }
  return { user, isAdmin }
}
