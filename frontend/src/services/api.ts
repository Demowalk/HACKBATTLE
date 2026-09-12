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
    const timeoutId = setTimeout(() => controller.abort(), 2500)

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

export async function askAiCopilot(
  message: string,
  userId?: number,
  history?: Array<{ sender: string; text: string }>
): Promise<string> {
  const uid = userId ?? getStoredUserId()
  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 18000)

    const response = await fetch(`${BACKEND_URL}/chat/ask`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message,
        user_id: uid,
        history,
      }),
      signal: controller.signal,
    })
    clearTimeout(timeoutId)

    if (response.ok) {
      const data = await response.json()
      if (data && data.reply) {
        return data.reply
      }
    }
  } catch {
    // Network or server timeout: fallback to client-side academic responder
  }

  // Client-side fallback if backend is unreachable
  const lower = message.toLowerCase().trim()
  const isPlanRequest = [
    'plan', 'study plan', 'help me plan', 'prepare for', 'how to study',
    'how should i study', 'how do i study', 'how to prepare', 'study guide for',
    'strategy for', 'roadmap for', 'schedule to study'
  ].some((k) => lower.includes(k))

  if (isPlanRequest) {
    if (lower.includes('chem') || lower.includes('chemistry') || lower.includes('organic') || lower.includes('electrochemistry')) {
      return `### Comprehensive Chemistry Study Plan & Resources\n\n#### 1. Phase-by-Phase Roadmap\n- **Phase 1: Conceptual Foundations (Days 1–3):** Atomic models, periodic trends, chemical bonding, and thermodynamics.\n- **Phase 2: Numericals & Reaction Mechanisms (Days 4–7):** Nernst equation calculations, equilibrium ($K_{eq}$), kinetics, and arrow-pushing mechanisms.\n- **Phase 3: Active Recall & Weak-Spot Drills (Days 8–10):** Targeted diagnostic quizzes on weak topics using Reviso DKT tracking.\n- **Phase 4: Timed Past Papers (Days 11–14):** Full mock exams with error logbook review.\n\n#### 2. Exact Resources to Use\n- **Textbooks:** *Chemistry: The Central Science* (Brown/LeMay), *Organic Chemistry* (Morrison & Boyd / Wade), *OpenStax Chemistry* (Free online).\n- **Video Lectures:** *The Organic Chemistry Tutor*, *Tyler DeWitt*, *Khan Academy Chemistry*, *MIT OpenCourseWare 5.111*.\n- **Interactive Tools:** *PhET Interactive Simulations* (Balancing Equations, Acid-Base Solutions), *MolView*.\n- **Question Banks:** *ACS Chemistry Olympiad & Exam Past Papers*, *LibreTexts Chemistry*.\n\n#### 3. How to Study (Cognitive Science)\n- **Active Recall:** Write reaction mechanisms and formulas from memory on a blank sheet.\n- **Spaced Repetition:** Re-test challenging reactions on Days 1, 3, 7, and 14.\n- **Feynman Technique:** Explain complex laws (Le Chatelier, Gibbs energy) in simple conversational terms.\n- **Mistake Notebook:** Categorize every error by Conceptual, Formula, or Calculation slip.\n- **Pomodoro Timeboxing:** 25-minute high-focus intervals followed by 5-minute recall breaks.`
    }
    if (lower.includes('python') || lower.includes('code') || lower.includes('coding') || lower.includes('dsa') || lower.includes('algorithm')) {
      return `### Complete Python & Programming Mastery Plan\n\n#### 1. Phase-by-Phase Roadmap\n- **Phase 1: Syntax & Core Constructs (Days 1–3):** Loops, comprehensions, dicts, recursion, functions, and file I/O.\n- **Phase 2: OOP & Complexity (Days 4–7):** Classes, inheritance, recursion trees, and Big-O analysis.\n- **Phase 3: Data Structures & Algorithms (Days 8–12):** Two-pointer, binary search, stacks, queues, hash maps, and tree traversals.\n- **Phase 4: Modular Projects & Timed Drills (Days 13–16):** End-to-end coding problems and unit tests.\n\n#### 2. Exact Resources to Use\n- **Documentation & Books:** *Official Python Docs (docs.python.org)*, *Automate the Boring Stuff with Python*, *Grokking Algorithms*.\n- **Video Channels:** *Corey Schafer (Python & OOP)*, *NeetCode (DSA Patterns)*, *FreeCodeCamp*.\n- **Interactive Platforms:** *LeetCode (Blind 75 & NeetCode 150)*, *PythonTutor.com (Call Stack Visualizer)*, *Exercism.org*.\n- **Cheat Sheets:** *QuickRef Python 3*, *Big-O Cheat Sheet*.\n\n#### 3. How to Study\n- **The 'Blank Editor' Rule:** Write every algorithm from scratch without copy-pasting or autocomplete.\n- **Dry-Run on Paper:** Trace variables and recursion stack frames with pencil and paper.\n- **Spaced Retrieval:** Re-solve hard problems 3 days later to solidify pattern recognition.\n- **Error Logbook:** Note down edge cases (empty lists, off-by-one indices) that caused bugs.`
    }
    if (lower.includes('math') || lower.includes('calculus') || lower.includes('algebra') || lower.includes('linear algebra')) {
      return `### High-Performance Mathematics Study Plan\n\n#### 1. Phase-by-Phase Roadmap\n- **Phase 1: Intuitive Visual Foundations (Days 1–3):** Geometric interpretations of limits, derivatives, integrals, and matrices.\n- **Phase 2: First-Principle Derivations (Days 4–7):** Prove core formulas before memorization.\n- **Phase 3: Tiered Problem Solving (Days 8–11):** Practice foundation $\\to$ medium $\\to$ high-difficulty edge cases.\n- **Phase 4: Timed Past Papers (Days 12–15):** Formula-sheet-free timed exam conditions.\n\n#### 2. Exact Resources to Use\n- **Textbooks & Notes:** *Thomas' Calculus* / *Stewart Calculus*, *Gilbert Strang (Linear Algebra)*, *Paul's Online Math Notes*.\n- **Video Channels:** *3Blue1Brown (Essence of Calculus / Linear Algebra)*, *Professor Leonard*, *BlackPenRedPen*, *Khan Academy*.\n- **Interactive Tools:** *Desmos Graphing Calculator*, *GeoGebra 3D*, *Wolfram Alpha*.\n- **Question Banks:** *MIT OCW 18.01/18.02 Problem Sets*, *AoPS*, *Reviso Adaptive Math Drills*.\n\n#### 3. How to Study\n- **70/30 Rule:** Spend 70% of time solving problems and 30% reviewing theory.\n- **Derive Every Identity:** Re-deriving formulas locks the algebraic steps into long-term memory.\n- **Error Tagging:** Tag slips into Conceptual, Arithmetic, or Misread categories.`
    }

    return `### Comprehensive Study Plan & Resource Guide\n\n#### 1. Phase-by-Phase Roadmap\n- **Phase 1: Conceptual Foundations (Days 1–3):** Build core mental models and master key definitions.\n- **Phase 2: Active Problem Solving (Days 4–7):** Solve graduated exercises and create one-page formula synthesis sheets.\n- **Phase 3: Diagnostic Retrieval (Days 8–10):** Pinpoint knowledge gaps using Reviso adaptive drills.\n- **Phase 4: Timed Mock Exams (Days 11–14):** Simulate realistic test timing and review your mistake log.\n\n#### 2. Exact Resources to Use\n- **Textbooks:** Standard curriculum coursebooks / OpenStax free textbooks.\n- **Video Playlists:** *Khan Academy*, *MIT OpenCourseWare*, *CrashCourse*.\n- **Interactive Platforms:** *Brilliant.org*, *PhET Simulations*, subject Anki decks.\n\n#### 3. How to Study\n- **Active Recall:** Test your recall before checking notes.\n- **Spaced Repetition:** Revisit topics on Days 1, 3, 7, and 14.\n- **Pomodoro 25/5:** 25-minute deep focus sprints + 5-minute cognitive rests.`
  }

  if (lower.includes('recursion') || lower.includes('recursive')) {
    return `### Understanding Recursion\n\nRecursion is a method where the solution to a problem depends on solutions to smaller instances of the same problem.\n\n\`\`\`python\ndef factorial(n: int) -> int:\n    if n <= 1:\n        return 1\n    return n * factorial(n - 1)\n\`\`\`\n\nAlways ensure you define a **base case** to avoid infinite stack recursion.`
  }
  if (lower.includes('loop') || lower.includes('for') || lower.includes('while')) {
    return `### Python Loops Breakdown\n\nLoops iterate over items or repeat until a condition is satisfied.\n\n\`\`\`python\n# For loop over range\nfor i in range(1, 6):\n    print(f"Step {i}")\n\`\`\`\n\nNested loops run in $O(N^2)$ time complexity. Consider dictionary lookups for performance optimization.`
  }
  if (lower.includes('nernst') || lower.includes('electrochemistry')) {
    return `### Electrochemistry & The Nernst Equation\n\n$$E = E^\\circ - \\frac{0.0592}{n} \\log_{10} Q$$\n\nUsed to calculate cell potential under non-standard concentrations and temperatures.`
  }
  if (lower.includes('retention') || lower.includes('memory')) {
    return `### Memory Retention Analysis\n\nBased on DKT cognitive tracking:\n• **Algebra:** Safe & reinforced\n• **Chemistry:** Stable retention\n• **Python Loops:** Refresher scheduled to prevent decay.`
  }

  return `### Response regarding: "${message}"\n\n**Key Concept Summary:**\nWhen mastering *${message}*, start by breaking down core definitions and working through structured practice examples.\n\n**Next Action:**\nWould you like a diagnostic quiz or a 20-minute focus sprint on this?`
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


