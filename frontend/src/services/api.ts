import type { Task } from '../types'
import { INITIAL_TASKS } from '../mockData'

const BACKEND_URL = 'http://127.0.0.1:8000'

export interface UserProfile {
  id: number
  username: string
  fullName: string
  email: string
  role: string
  grade: string
  streak: number
  totalStudyMinutes: number
}

const STORAGE_KEYS = {
  USER_ID: 'reviso_user_id',
  USER_NAME: 'reviso_user_name',
  USER_PROFILE: 'reviso_user_profile',
}

export function getStoredUserId(): number {
  try {
    const val = localStorage.getItem(STORAGE_KEYS.USER_ID)
    return val ? parseInt(val, 10) : 1
  } catch {
    return 1
  }
}

export function getStoredUserName(): string {
  try {
    return localStorage.getItem(STORAGE_KEYS.USER_NAME) || 'Laksh HS'
  } catch {
    return 'Laksh HS'
  }
}

export function setStoredUserName(name: string): void {
  try {
    localStorage.setItem(STORAGE_KEYS.USER_NAME, name)
  } catch {
    // ignore
  }
}

export async function fetchUserProfile(userId?: number): Promise<UserProfile | null> {
  const uid = userId ?? getStoredUserId()
  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 2000)

    const response = await fetch(`${BACKEND_URL}/user/profile?user_id=${uid}`, {
      signal: controller.signal,
    })
    clearTimeout(timeoutId)

    if (response.ok) {
      const data: UserProfile = await response.json()
      localStorage.setItem(STORAGE_KEYS.USER_PROFILE, JSON.stringify(data))
      if (data.fullName) {
        localStorage.setItem(STORAGE_KEYS.USER_NAME, data.fullName)
      }
      return data
    }
  } catch {
    // Offline or CORS: fall back to localStorage cached profile
    try {
      const cached = localStorage.getItem(STORAGE_KEYS.USER_PROFILE)
      if (cached) return JSON.parse(cached)
    } catch {
      // ignore
    }
  }
  return null
}

export async function updateUserProfile(
  userId: number,
  updates: { fullName?: string; grade?: string; streak?: number; totalStudyMinutes?: number }
): Promise<UserProfile | null> {
  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 2000)

    const response = await fetch(`${BACKEND_URL}/user/profile?user_id=${userId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updates),
      signal: controller.signal,
    })
    clearTimeout(timeoutId)

    if (response.ok) {
      const data: UserProfile = await response.json()
      if (updates.fullName) {
        localStorage.setItem(STORAGE_KEYS.USER_NAME, updates.fullName)
      }
      return data
    }
  } catch {
    // If backend is offline, update localStorage
    if (updates.fullName) {
      localStorage.setItem(STORAGE_KEYS.USER_NAME, updates.fullName)
    }
  }
  return null
}

export async function fetchTasks(userId?: number): Promise<{ tasks: Task[]; isLive: boolean }> {
  const uid = userId ?? getStoredUserId()
  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 2000)

    const response = await fetch(`${BACKEND_URL}/tasks?user_id=${uid}`, {
      signal: controller.signal,
    })
    clearTimeout(timeoutId)

    if (response.ok) {
      const data: Task[] = await response.json()
      return { tasks: data, isLive: true }
    }
  } catch {
    // Backend is offline or CORS issue, fall back gracefully to mock tasks
  }
  return { tasks: INITIAL_TASKS, isLive: false }
}

export async function updateTaskCompletion(id: number): Promise<{ success: boolean; updatedTask?: Task }> {
  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 2000)

    const response = await fetch(`${BACKEND_URL}/tasks/${id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      signal: controller.signal,
    })
    clearTimeout(timeoutId)

    if (response.ok) {
      const updated: Task = await response.json()
      return { success: true, updatedTask: updated }
    }
  } catch {
    // Fallback handled locally in state
  }
  return { success: false }
}
