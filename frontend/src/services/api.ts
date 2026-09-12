import type { Task } from '../types'
import { INITIAL_TASKS } from '../mockData'

const BACKEND_URL = 'http://127.0.0.1:8000'

export async function fetchTasks(): Promise<{ tasks: Task[]; isLive: boolean }> {
  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 2000)

    const response = await fetch(`${BACKEND_URL}/tasks`, {
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
