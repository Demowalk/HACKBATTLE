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
  targetExam?: string
  dailyGoalMinutes?: number
  lastActiveDate?: string
}

export interface ChatMessageItem {
  id: number
  sender: string
  text: string
  timestamp: string
}

export interface ConceptMasteryItem {
  id: number
  subject: string
  topic: string
  masteryScore: number
  decayRisk: number
  lowProficiency: boolean
  projectedNote?: string
}

export interface CriticalActionItem {
  id: number
  badgeLabel: string
  descHtml: string
  btnText: string
  isScheduled: boolean
  targetSlot: string
  actionKey: string
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

// ---------------------------------------------------------------------------
// User Profile API
// ---------------------------------------------------------------------------
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
  updates: {
    fullName?: string
    grade?: string
    streak?: number
    totalStudyMinutes?: number
    targetExam?: string
    dailyGoalMinutes?: number
  }
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
    if (updates.fullName) {
      localStorage.setItem(STORAGE_KEYS.USER_NAME, updates.fullName)
    }
  }
  return null
}

// ---------------------------------------------------------------------------
// Task Management API
// ---------------------------------------------------------------------------
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

export async function createTaskInDb(task: {
  title: string
  subject: string
  topic: string
  duration_minutes?: number
  priority?: string
  time_slot?: string
  scheduled_date?: string
  alarm_active?: boolean
  is_critical?: boolean
  status_tag?: string
  user_id?: number
}): Promise<Task | null> {
  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 2000)

    const response = await fetch(`${BACKEND_URL}/tasks`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ...task,
        user_id: task.user_id ?? getStoredUserId(),
      }),
      signal: controller.signal,
    })
    clearTimeout(timeoutId)

    if (response.ok) {
      return await response.json()
    }
  } catch {
    // offline fallback
  }
  return null
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

export async function deleteTaskFromDb(id: number): Promise<boolean> {
  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 2000)

    const response = await fetch(`${BACKEND_URL}/tasks/${id}`, {
      method: 'DELETE',
      signal: controller.signal,
    })
    clearTimeout(timeoutId)
    return response.ok
  } catch {
    return false
  }
}

export interface CriticalRemediationResponse {
  status: string
  is_critical: boolean
  score: number
  total: number
  free_date: string
  free_day_name: string
  time_slot: string
  message: string
  task: {
    id: number
    title: string
    subject: string
    topic: string
    duration: string
    duration_minutes: number
    priority: string
    timeSlot: string
    scheduled_date: string
    completed: boolean
    alarmEnabled: boolean
    isCritical: boolean
    statusTag: string
    dayNumber: number
  }
  video?: {
    title: string
    channel: string
    url: string
  }
}

export async function scheduleCriticalRemediation(payload: {
  subject: string
  topic: string
  score: number
  total: number
  scheduled_date?: string
  time_slot?: string
  duration_minutes?: number
  user_id?: number
}): Promise<CriticalRemediationResponse | null> {
  const uid = payload.user_id ?? getStoredUserId()
  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 2500)

    const response = await fetch(`${BACKEND_URL}/tasks/schedule-critical-remediation`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ...payload,
        user_id: uid,
      }),
      signal: controller.signal,
    })
    clearTimeout(timeoutId)

    if (response.ok) {
      return await response.json()
    }
  } catch {
    // offline fallback
  }
  return null
}


// ---------------------------------------------------------------------------
// Chat History & Persistence API
// ---------------------------------------------------------------------------
export async function fetchChatHistory(userId?: number): Promise<ChatMessageItem[]> {
  const uid = userId ?? getStoredUserId()
  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 2000)

    const response = await fetch(`${BACKEND_URL}/chat/history?user_id=${uid}`, {
      signal: controller.signal,
    })
    clearTimeout(timeoutId)

    if (response.ok) {
      return await response.json()
    }
  } catch {
    // offline
  }
  return []
}

export async function sendChatMessage(sender: string, text: string, userId?: number): Promise<ChatMessageItem | null> {
  const uid = userId ?? getStoredUserId()
  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 2000)

    const response = await fetch(`${BACKEND_URL}/chat/message`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ sender, text, user_id: uid }),
      signal: controller.signal,
    })
    clearTimeout(timeoutId)

    if (response.ok) {
      return await response.json()
    }
  } catch {
    // offline
  }
  return null
}

// ---------------------------------------------------------------------------
// Study Session (Pomodoro) Persistence API
// ---------------------------------------------------------------------------
export async function recordStudySession(
  subject: string,
  durationMinutes: number = 25,
  topic?: string,
  userId?: number
): Promise<{ userStreak?: number; totalStudyMinutes?: number } | null> {
  const uid = userId ?? getStoredUserId()
  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 2000)

    const response = await fetch(`${BACKEND_URL}/study-sessions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        subject,
        duration_minutes: durationMinutes,
        topic,
        session_type: 'pomodoro',
        user_id: uid,
      }),
      signal: controller.signal,
    })
    clearTimeout(timeoutId)

    if (response.ok) {
      return await response.json()
    }
  } catch {
    // offline
  }
  return null
}

// ---------------------------------------------------------------------------
// Concept Mastery & Critical Actions API
// ---------------------------------------------------------------------------
export async function fetchConceptMastery(userId?: number): Promise<ConceptMasteryItem[]> {
  const uid = userId ?? getStoredUserId()
  try {
    const response = await fetch(`${BACKEND_URL}/concept-mastery?user_id=${uid}`)
    if (response.ok) return await response.json()
  } catch {
    // offline
  }
  return []
}

export async function fetchCriticalActions(userId?: number): Promise<CriticalActionItem[]> {
  const uid = userId ?? getStoredUserId()
  try {
    const response = await fetch(`${BACKEND_URL}/critical-actions?user_id=${uid}`)
    if (response.ok) return await response.json()
  } catch {
    // offline
  }
  return []
}

export async function toggleCriticalAction(id: number): Promise<boolean> {
  try {
    const response = await fetch(`${BACKEND_URL}/critical-actions/${id}/toggle`, {
      method: 'POST',
    })
    return response.ok
  } catch {
    return false
  }
}

// ---------------------------------------------------------------------------
// Quiz Generation & Answers API
// ---------------------------------------------------------------------------
export interface QuizQuestionItem {
  id: number
  subject?: string
  topic?: string
  question: string
  options: string[]
  correct_answer?: string
  explanation?: string
  difficulty?: 'easy' | 'medium' | 'hard'
}

export interface GeneratedQuizResponse {
  quiz_id?: number
  subject: string
  topic: string
  difficulty?: string
  questions: QuizQuestionItem[]
}

export async function fetchGeneratedQuiz(
  subject: string,
  topic: string = 'Quick Concept Drill',
  difficulty: string = 'medium',
  count: number = 3,
  userId?: number
): Promise<GeneratedQuizResponse | null> {
  const uid = userId ?? getStoredUserId()
  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 4000)

    const response = await fetch(`${BACKEND_URL}/generate-quiz`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        subject,
        topic,
        difficulty,
        count,
        user_id: uid,
      }),
      signal: controller.signal,
    })
    clearTimeout(timeoutId)

    if (response.ok) {
      const data = await response.json()
      if (data && Array.isArray(data.questions) && data.questions.length > 0) {
        return data
      }
    }
  } catch {
    // Offline fallback
  }
  return null
}

export async function submitQuizAnswers(
  quizId: number | undefined,
  answers: { question_id: number; selected_answer: string }[],
  userId?: number
): Promise<{ correct_count: number; total: number; score_percentage: number; next_difficulty?: string } | null> {
  const uid = userId ?? getStoredUserId()
  try {
    const response = await fetch(`${BACKEND_URL}/quiz/answer`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        quiz_id: quizId,
        user_id: uid,
        answers,
      }),
    })
    if (response.ok) {
      return await response.json()
    }
  } catch {
    // offline
  }
  return null
}

export interface CreateTaskPayload {
  title: string
  subject: string
  topic?: string
  duration_minutes: number
  priority?: string
  time_slot: string
  scheduled_date: string
  alarm_active?: boolean
  is_critical?: boolean
  status_tag?: string
  user_id?: number
}

export async function createBackendTask(payload: CreateTaskPayload): Promise<any | null> {
  const uid = payload.user_id ?? getStoredUserId()
  try {
    const res = await fetch(`${BACKEND_URL}/tasks`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...payload, user_id: uid }),
    })
    if (res.ok) {
      return await res.json()
    }
  } catch (err) {
    console.error('Failed to create task in backend:', err)
  }
  return null
}

export async function deleteBackendTask(id: number): Promise<boolean> {
  try {
    const res = await fetch(`${BACKEND_URL}/tasks/${id}`, {
      method: 'DELETE',
    })
    return res.ok
  } catch (err) {
    console.error('Failed to delete task in backend:', err)
    return false
  }
}

export function downloadCalendarIcs(userId?: number): void {
  const uid = userId ?? getStoredUserId()
  const url = `${BACKEND_URL}/tasks/export-calendar?user_id=${uid}`
  const link = document.createElement('a')
  link.href = url
  link.setAttribute('download', 'reviso_study_schedule.ics')
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}


