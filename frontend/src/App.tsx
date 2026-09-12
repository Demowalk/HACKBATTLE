import { useState, useEffect, useRef } from 'react'
import './App.css'
import {
  fetchUserProfile,
  updateUserProfile,
  getStoredUserName,
  setStoredUserName,
  updateTaskCompletion,
  deleteTaskFromDb,
  createTaskInDb,
  fetchChatHistory,
  sendChatMessage,
  recordStudySession,
} from './services/api'

// ============================================================================
// PROCEDURAL SOUND SYNTHESIZER (Web Audio API)
// ============================================================================
class AudioSynthesizer {
  private ctx: AudioContext | null = null

  private init() {
    if (!this.ctx) {
      const AudioContextClass =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
      if (AudioContextClass) {
        this.ctx = new AudioContextClass()
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume()
    }
  }

  playHarmonicChime() {
    try {
      this.init()
      if (!this.ctx) return
      const notes = [523.25, 659.25, 783.99, 1046.5] // C5, E5, G5, C6
      const startTime = this.ctx.currentTime

      notes.forEach((freq, i) => {
        if (!this.ctx) return
        const osc = this.ctx.createOscillator()
        const gain = this.ctx.createGain()
        osc.type = 'sine'
        osc.frequency.setValueAtTime(freq, startTime + i * 0.15)

        gain.gain.setValueAtTime(0, startTime + i * 0.15)
        gain.gain.linearRampToValueAtTime(0.2, startTime + i * 0.15 + 0.04)
        gain.gain.exponentialRampToValueAtTime(0.001, startTime + i * 0.15 + 0.85)

        osc.connect(gain)
        gain.connect(this.ctx.destination)

        osc.start(startTime + i * 0.15)
        osc.stop(startTime + i * 0.15 + 0.9)
      })
    } catch (e) {
      console.warn('Audio synthesis prevented by browser policy', e)
    }
  }

  playSuccessBeep() {
    try {
      this.init()
      if (!this.ctx) return
      const osc = this.ctx.createOscillator()
      const gain = this.ctx.createGain()
      osc.type = 'triangle'
      osc.frequency.setValueAtTime(880, this.ctx.currentTime) // A5
      gain.gain.setValueAtTime(0.15, this.ctx.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.25)
      osc.connect(gain)
      gain.connect(this.ctx.destination)
      osc.start()
      osc.stop(this.ctx.currentTime + 0.25)
    } catch {
      // ignore
    }
  }
}

const soundSynth = new AudioSynthesizer()

// ============================================================================
// BASIC WHITE BELL VECTOR ICONS (Clean, Modern, Non-Emoji)
// ============================================================================
function BellIcon({
  size = 14,
  color = '#ffffff',
  className = '',
}: {
  size?: number
  color?: string
  className?: string
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={color}
      className={className}
      style={{ display: 'inline-block', verticalAlign: 'middle', flexShrink: 0 }}
      aria-hidden="true"
    >
      <path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.9 2 2 2zm6-6v-5c0-3.07-1.63-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.64 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z" />
    </svg>
  )
}

function BellOffIcon({
  size = 14,
  color = '#ffffff',
  className = '',
}: {
  size?: number
  color?: string
  className?: string
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      style={{ display: 'inline-block', verticalAlign: 'middle', flexShrink: 0 }}
      aria-hidden="true"
    >
      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
      <path d="M18.63 13A17.89 17.89 0 0 1 18 8" />
      <path d="M6.26 6.26A5.86 5.86 0 0 0 6 8c0 7-3 9-3 9h14" />
      <path d="M18 8a6 6 0 0 0-9.33-5" />
      <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
  )
}

// ============================================================================
// REVISO BRAND LOGO (Custom Geometric Monogram & Neural Revision Loop)
// ============================================================================
function RevisoLogo({ size = 38 }: { size?: number }) {
  return (
    <div
      className="brand-logo-container"
      style={{
        width: size,
        height: size,
        borderRadius: Math.round(size * 0.28),
        background: 'linear-gradient(135deg, rgba(0, 77, 64, 0.45) 0%, rgba(10, 15, 14, 0.95) 100%)',
        border: '1.5px solid rgba(38, 166, 154, 0.45)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        boxShadow: '0 4px 16px rgba(0, 77, 64, 0.35), inset 0 1px 1px rgba(255, 255, 255, 0.15)',
        overflow: 'hidden',
        flexShrink: 0,
      }}
    >
      <svg
        width={Math.round(size * 0.72)}
        height={Math.round(size * 0.72)}
        viewBox="0 0 32 32"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="revisoGradMain" x1="4" y1="4" x2="28" y2="28" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#80CBC4" />
            <stop offset="50%" stopColor="#26A69A" />
            <stop offset="100%" stopColor="#004D40" />
          </linearGradient>
          <linearGradient id="revisoGradCore" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="100%" stopColor="#80CBC4" />
          </linearGradient>
          <linearGradient id="revisoGradBeam" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#26A69A" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#80CBC4" stopOpacity="0.2" />
          </linearGradient>
        </defs>

        {/* Ambient Neural Arc */}
        <path
          d="M 6 16 C 6 8 10 4 18 4 C 24 4 28 8 28 14 C 28 19 24 22 20 22"
          stroke="url(#revisoGradBeam)"
          strokeWidth="1.5"
          strokeDasharray="2 2"
          opacity="0.5"
        />

        {/* Main Geometric "R" Monogram & Revision Path */}
        <path
          d="M 7 28 V 6.5 C 7 5.1 8.1 4 9.5 4 H 17.5 C 22.5 4 26.5 7.8 26.5 12.8 C 26.5 16.3 24.3 19.3 21.2 20.7 L 26.2 27.2 C 26.7 27.9 26.2 28.8 25.3 28.8 H 21.5 C 20.8 28.8 20.2 28.5 19.8 27.9 L 15.6 21.8 H 11.5 V 27.8 C 11.5 28.4 11 28.8 10.4 28.8 H 8.1 C 7.5 28.8 7 28.4 7 27.8 Z"
          fill="url(#revisoGradMain)"
        />

        {/* Inner Negative Space */}
        <path
          d="M 11.5 8.5 V 17.2 H 17.2 C 19.8 17.2 21.8 15.2 21.8 12.85 C 21.8 10.5 19.8 8.5 17.2 8.5 Z"
          fill="#0a1210"
        />

        {/* Luminous Inner Focus Core */}
        <path
          d="M 12 10.5 H 16.8 C 18.2 10.5 19.5 11.5 19.5 12.85 C 19.5 14.2 18.2 15.2 16.8 15.2 H 12"
          stroke="url(#revisoGradCore)"
          strokeWidth="1.8"
          strokeLinecap="round"
        />

        {/* Synaptic Flash Node (Insight Spark at apex) */}
        <circle cx="24" cy="6.5" r="1.8" fill="#ffffff" />
        <circle cx="24" cy="6.5" r="3.2" stroke="#80CBC4" strokeWidth="0.8" opacity="0.6" />
      </svg>
    </div>
  )
}

// ============================================================================
// QUIZ QUESTION DATA FOR CONCEPT MASTERY
// ============================================================================
interface QuizOption {
  text: string
  correct: boolean
}

interface QuizItem {
  title: string
  questionHtml: string
  options: QuizOption[]
  explanation: string
}

const QUIZ_DATA: Record<string, QuizItem> = {
  python: {
    title: 'Python Loop & List Comprehension Quick Drill',
    questionHtml: `What is the evaluated result of the following Python expression?<br><pre style="background:var(--bg-canvas); padding:10px; border-radius:8px; margin-top:8px; font-family:var(--font-mono); font-size:12px; border:1px solid var(--border-subtle);">[x * 2 for x in range(4) if x % 2 == 1]</pre>`,
    options: [
      { text: '[0, 2, 4, 6]', correct: false },
      { text: '[2, 6]', correct: true },
      { text: '[1, 3]', correct: false },
      { text: '[4, 8]', correct: false },
    ],
    explanation:
      'range(4) produces [0, 1, 2, 3]. The condition `if x % 2 == 1` filters odd numbers: 1 and 3. Then `x * 2` yields [2, 6].',
  },
  math: {
    title: 'Quadratic Equation Warm-Up',
    questionHtml: `What are the roots of the quadratic equation: <br><strong style="font-size:16px; display:block; margin-top:6px;">2x² - 7x + 3 = 0</strong>`,
    options: [
      { text: 'x = 3 and x = 1/2', correct: true },
      { text: 'x = -3 and x = -1/2', correct: false },
      { text: 'x = 2 and x = 3', correct: false },
      { text: 'x = 7 and x = 3', correct: false },
    ],
    explanation: 'Factoring: (2x - 1)(x - 3) = 0, which yields roots x = 1/2 and x = 3.',
  },
  chem: {
    title: 'Organic Chemistry Practice Drill',
    questionHtml: `Which mechanism describes the addition of HBr to an asymmetrical alkene following Markovnikov's rule?`,
    options: [
      { text: 'Electrophilic Addition via carbocation intermediate', correct: true },
      { text: 'Nucleophilic Substitution (SN2)', correct: false },
      { text: 'Free Radical Halogenation', correct: false },
      { text: 'Elimination (E1)', correct: false },
    ],
    explanation:
      'Electrophiles (H+) attack the alkene to form the more stable tertiary or secondary carbocation, followed by halide attack.',
  },
}

interface ChatEntry {
  id: string
  type: 'msg' | 'trace'
  sender?: 'bot' | 'user'
  text?: string
  toolName?: string
  toolArgs?: Record<string, unknown>
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================
export default function App() {
  // Theme State
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    return (localStorage.getItem('reviso-theme') as 'dark' | 'light') || (localStorage.getItem('studysync-theme') as 'dark' | 'light') || 'dark'
  })

  // User Profile (Persisted across visits via localStorage & Database)
  const [userName, setUserName] = useState<string>(() => getStoredUserName())
  const [userStreak, setUserStreak] = useState<number>(() => {
    try {
      const s = localStorage.getItem('reviso_user_streak')
      return s ? parseInt(s, 10) : 7
    } catch {
      return 7
    }
  })
  const [userRole, setUserRole] = useState<string>('Student')
  const [userGrade, setUserGrade] = useState<string>('Grade 12 • Engineering Prep')
  const [isProfileOpen, setIsProfileOpen] = useState<boolean>(false)
  const [isEditingName, setIsEditingName] = useState<boolean>(false)
  const [editNameValue, setEditNameValue] = useState<string>(() => getStoredUserName())
  const profileRef = useRef<HTMLDivElement>(null)

  // Schedule & Tasks
  const [tasks, setTasks] = useState([
    {
      id: 'task-1',
      title: 'Algebra basics & quadratic formulas',
      subject: 'Maths',
      tagClass: 'task-tag-math',
      tagIcon: '📐 Maths',
      timeSlot: '9:00–10:30 AM',
      completed: true,
      alarmActive: true,
      status: 'Done',
    },
    {
      id: 'task-2',
      title: 'Organic chemistry reaction mechanisms',
      subject: 'Chemistry',
      tagClass: 'task-tag-chem',
      tagIcon: '🧪 Chemistry',
      timeSlot: '11:00 AM–12:00 PM',
      completed: false,
      alarmActive: true,
      status: 'Upcoming',
    },
    {
      id: 'task-3',
      title: 'Loop structures & list comprehension lab',
      subject: 'Python',
      tagClass: 'task-tag-python',
      tagIcon: '🐍 Python',
      timeSlot: '1:30–2:15 PM',
      completed: false,
      alarmActive: true,
      status: 'Upcoming',
    },
    {
      id: 'task-4',
      title: 'Quadratic equations problem set',
      subject: 'Maths',
      tagClass: 'task-tag-math',
      tagIcon: '📐 Maths',
      timeSlot: '3:00–4:00 PM',
      completed: true,
      alarmActive: false,
      status: 'Done',
    },
  ])

  // Dynamic Free Time / Brain Break Blocks
  const [emptyBlocks, setEmptyBlocks] = useState({
    'empty-1': {
      filled: false,
      title: '',
      time: '10:30–11:00 AM',
      label: 'Brain Break ☕ (30 min recovery buffer)',
    },
    'empty-3': {
      filled: false,
      title: '',
      time: '2:15–3:00 PM',
      label: 'Brain Break ☕ (45 min open buffer)',
    },
  })

  // Remediation State
  const [isRemediationScheduled, setIsRemediationScheduled] = useState<boolean>(false)
  const [quizScoreText, setQuizScoreText] = useState<string>('Score: 35% · Quick Review Recommended')
  const [quizCardBorderColor, setQuizCardBorderColor] = useState<string>('')
  const [pythonCritScheduled, setPythonCritScheduled] = useState<boolean>(false)
  const [mathMidtermScheduled, setMathMidtermScheduled] = useState<boolean>(false)

  // Concept Retention Scores
  const [dktScores, setDktScores] = useState({
    math: { pct: 84, retention: 'Safe (12d decay)', safe: true },
    chem: { pct: 65, retention: 'Moderate (4d decay)', safe: true },
    python: { pct: 35, retention: 'Refresher Recommended 🔄', safe: false },
  })

  // Chat & Stream (Soft, Encouraging Persona)
  const [chatList, setChatList] = useState<ChatEntry[]>([
    {
      id: 'init-1',
      type: 'msg',
      sender: 'bot',
      text: `Hey Laksh! 👋 Noticed nested loops were a bit tricky on today's quiz. No stress at all — loops take practice! Want to squeeze in a quick 20-minute recap before lunch? I found a nice open slot right after chemistry!`,
    },
  ])
  const [chatInput, setChatInput] = useState<string>('')
  const chatBottomRef = useRef<HTMLDivElement>(null)

  // Toast
  const [toast, setToast] = useState<{ message: string; icon: string; visible: boolean }>({
    message: '',
    icon: '✨',
    visible: false,
  })
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Alarms
  const [alarmModalOpen, setAlarmModalOpen] = useState<boolean>(false)
  const [activeAlarmTitle, setActiveAlarmTitle] = useState<string>('Organic chemistry reaction mechanisms')
  const [activeAlarmTime, setActiveAlarmTime] = useState<string>('11:00 AM')
  const [nextAlarmLabel, setNextAlarmLabel] = useState<string>('Organic Chemistry (11:00 AM)')

  // Pomodoro
  const [pomoModalOpen, setPomoModalOpen] = useState<boolean>(false)
  const [pomoSessionName, setPomoSessionName] = useState<string>('Focus Session')
  const [pomoSeconds, setPomoSeconds] = useState<number>(25 * 60)
  const [pomoRunning, setPomoRunning] = useState<boolean>(false)

  // Quiz Modal
  const [quizModalOpen, setQuizModalOpen] = useState<boolean>(false)
  const [currentQuizKey, setCurrentQuizKey] = useState<string>('python')
  const [selectedQuizOpt, setSelectedQuizOpt] = useState<number | null>(null)
  const [quizFeedback, setQuizFeedback] = useState<{ isCorrect: boolean; text: string } | null>(null)

  // Calendar Modal & Day Tasks View
  const [calendarModalOpen, setCalendarModalOpen] = useState<boolean>(false)
  const [calViewMode, setCalViewMode] = useState<'month' | 'day'>('month')
  const [selectedCalDay, setSelectedCalDay] = useState<number>(12)
  const [calendarSyncActive, setCalendarSyncActive] = useState<boolean>(false)
  const [newCalTaskTitle, setNewCalTaskTitle] = useState<string>('')
  const [newCalTaskTime, setNewCalTaskTime] = useState<string>('5:00–6:00 PM')
  const [newCalTaskSubject, setNewCalTaskSubject] = useState<'Maths' | 'Chemistry' | 'Python' | 'AI Systems'>('Maths')

  // Other Day Tasks (for days other than 12)
  const [otherDayTasks, setOtherDayTasks] = useState<Record<number, {
    id: string
    title: string
    subject: string
    tagClass: string
    timeSlot: string
    completed: boolean
  }[]>>({
    11: [
      { id: 'd11-1', title: 'Calculus derivatives recap', subject: 'Maths', tagClass: 'task-tag-math', timeSlot: '10:00–11:00 AM', completed: true },
      { id: 'd11-2', title: 'Python recursion functions lab', subject: 'Python', tagClass: 'task-tag-python', timeSlot: '2:00–3:00 PM', completed: true },
    ],
    13: [
      { id: 'd13-1', title: 'Linear algebra vector spaces', subject: 'Maths', tagClass: 'task-tag-math', timeSlot: '10:00–11:30 AM', completed: false },
      { id: 'd13-2', title: 'AI Transformer Attention Mechanisms', subject: 'AI Systems', tagClass: 'task-tag-math', timeSlot: '3:00–4:15 PM', completed: false },
    ],
    14: [
      { id: 'd14-1', title: 'Organic Chemistry reaction mechanisms review', subject: 'Chemistry', tagClass: 'task-tag-chem', timeSlot: '09:30–11:00 AM', completed: false },
      { id: 'd14-2', title: 'Python hash maps & time complexity drill', subject: 'Python', tagClass: 'task-tag-python', timeSlot: '1:30–2:45 PM', completed: false },
    ],
    15: [
      { id: 'd15-1', title: 'Chemistry Midterm Exam (Hall B)', subject: 'Chemistry', tagClass: 'task-tag-chem', timeSlot: '11:00 AM–12:30 PM', completed: false },
      { id: 'd15-2', title: 'Post-exam recovery & light Python recap', subject: 'Python', tagClass: 'task-tag-python', timeSlot: '3:30–4:15 PM', completed: false },
    ],
  })

  // Apply Theme
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    localStorage.setItem('reviso-theme', theme)
  }, [theme])

  // Persistent User Profile Loader (Sync with database on every visit)
  useEffect(() => {
    fetchUserProfile().then((profile) => {
      if (profile) {
        if (profile.fullName) {
          setUserName(profile.fullName)
          setEditNameValue(profile.fullName)
        }
        if (profile.role) setUserRole(profile.role)
        if (profile.grade) setUserGrade(profile.grade)
        if (profile.streak != null) {
          setUserStreak(profile.streak)
          localStorage.setItem('reviso_user_streak', profile.streak.toString())
        }
      }
    })

    fetchChatHistory().then((history) => {
      if (history && history.length > 0) {
        setChatList(
          history.map((m) => ({
            id: `msg-${m.id}`,
            type: 'msg' as const,
            sender: (m.sender === 'user' ? 'user' : 'bot') as 'user' | 'bot',
            text: m.text,
          }))
        )
      }
    })
  }, [])

  // Click outside to close profile
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setIsProfileOpen(false)
        setIsEditingName(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Close modals on Escape key
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        setCalendarModalOpen(false)
        setQuizModalOpen(false)
        setPomoModalOpen(false)
        setAlarmModalOpen(false)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  // Lock background body scroll when full-page calendar is open
  useEffect(() => {
    if (calendarModalOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [calendarModalOpen])

  // Auto scroll chat
  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [chatList])

  // Pomodoro timer tick
  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | null = null
    if (pomoRunning) {
      interval = setInterval(() => {
        setPomoSeconds((prev) => {
          if (prev <= 1) {
            setPomoRunning(false)
            soundSynth.playHarmonicChime()
            showToast('Pomodoro session completed! Great job, Laksh!', '🎉')
            recordStudySession('General Focus', 25, pomoSessionName).then((res) => {
              if (res?.userStreak != null) setUserStreak(res.userStreak)
            })
            return 25 * 60
          }
          return prev - 1
        })
      }, 1000)
    }
    return () => {
      if (interval) clearInterval(interval)
    }
  }, [pomoRunning, pomoSessionName])

  // Toast helper
  const showToast = (message: string, icon = '✨') => {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current)
    setToast({ message, icon, visible: true })
    toastTimerRef.current = setTimeout(() => {
      setToast((prev) => ({ ...prev, visible: false }))
    }, 3200)
  }

  // Toggle Theme
  const toggleTheme = () => {
    const next = theme === 'dark' ? 'light' : 'dark'
    setTheme(next)
    showToast(`Theme switched to ${next === 'dark' ? 'Dark' : 'Light'} Mode`, '🎨')
  }

  // Export / Share PDF
  const exportSharePdf = () => {
    showToast('Opening Print / Save to PDF with full colors enabled!', '📄')
    setTimeout(() => {
      window.print()
    }, 400)
  }

  // Trigger Audio Alarm
  const triggerAlarm = (title = 'Loop structures & list comprehension', time = '1:30 PM') => {
    setActiveAlarmTitle(title)
    setActiveAlarmTime(time)
    setAlarmModalOpen(true)
    soundSynth.playHarmonicChime()
  }

  const dismissAlarm = () => {
    setAlarmModalOpen(false)
    showToast(`Alarm dismissed for ${activeAlarmTitle}`, 'bell-off')
  }

  const snoozeAlarm = () => {
    setAlarmModalOpen(false)
    showToast(`Alarm snoozed for 5 minutes`, '⏰')
    setNextAlarmLabel(`${activeAlarmTitle} (in 5 min)`)
  }

  const toggleAlarmBell = (taskId: string, title: string) => {
    setTasks((prev) =>
      prev.map((t) => {
        if (t.id === taskId) {
          const next = !t.alarmActive
          if (next) {
            showToast(`Alarm enabled for ${title}`, 'bell')
            soundSynth.playHarmonicChime()
          } else {
            showToast(`Alarm muted for ${title}`, 'bell-off')
          }
          return { ...t, alarmActive: next }
        }
        return t
      })
    )
  }

  // Toggle Task Completion
  const toggleTask = (taskId: string) => {
    setTasks((prev) =>
      prev.map((t) => {
        if (t.id === taskId) {
          const next = !t.completed
          if (next) {
            showToast('Awesome! Session marked complete.', '🎉')
            soundSynth.playSuccessBeep()
          }
          return {
            ...t,
            completed: next,
            status: next ? 'Done' : 'Upcoming',
          }
        }
        return t
      })
    )
    const numId = parseInt(taskId.replace('task-', ''), 10)
    if (!isNaN(numId)) {
      updateTaskCompletion(numId)
    }
  }

  // Toggle task in Calendar Day view
  const handleToggleCalTask = (day: number, taskId: string) => {
    if (day === 12) {
      toggleTask(taskId)
    } else {
      setOtherDayTasks((prev) => {
        const list = prev[day] || []
        const updated = list.map((t) => {
          if (t.id === taskId) {
            const next = !t.completed
            if (next) {
              soundSynth.playSuccessBeep()
              showToast('Task marked complete!', '🎉')
            }
            return { ...t, completed: next }
          }
          return t
        })
        return { ...prev, [day]: updated }
      })
    }
  }

  // Add task in Calendar Day view
  const handleAddCalendarTask = (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    if (!newCalTaskTitle.trim()) return

    const tagClass =
      newCalTaskSubject === 'Chemistry'
        ? 'task-tag-chem'
        : newCalTaskSubject === 'Python'
        ? 'task-tag-python'
        : 'task-tag-math'

    const tagIcon =
      newCalTaskSubject === 'Chemistry'
        ? '🧪 Chemistry'
        : newCalTaskSubject === 'Python'
        ? '🐍 Python'
        : '📐 Maths'

    if (selectedCalDay === 12) {
      const newTask = {
        id: `task-${Date.now()}`,
        title: newCalTaskTitle.trim(),
        subject: newCalTaskSubject,
        tagClass,
        tagIcon,
        timeSlot: newCalTaskTime.trim() || '5:00–6:00 PM',
        completed: false,
        alarmActive: true,
        status: 'Upcoming',
      }
      setTasks((prev) => [...prev, newTask])
      createTaskInDb({
        title: newCalTaskTitle.trim(),
        subject: newCalTaskSubject,
        topic: 'Self-Directed Review',
        time_slot: newCalTaskTime.trim() || '5:00–6:00 PM',
        scheduled_date: '2026-09-12',
      })
    } else {
      const newTask = {
        id: `cal-${Date.now()}`,
        title: newCalTaskTitle.trim(),
        subject: newCalTaskSubject,
        tagClass,
        timeSlot: newCalTaskTime.trim() || '5:00–6:00 PM',
        completed: false,
      }
      setOtherDayTasks((prev) => ({
        ...prev,
        [selectedCalDay]: [...(prev[selectedCalDay] || []), newTask],
      }))
    }

    soundSynth.playHarmonicChime()
    showToast(`Added "${newCalTaskTitle.trim()}" to Sep ${selectedCalDay}!`, '📅')
    setNewCalTaskTitle('')
  }

  // Delete task from Calendar Day view
  const handleDeleteCalTask = (day: number, taskId: string) => {
    if (day === 12) {
      setTasks((prev) => prev.filter((t) => t.id !== taskId))
      const numId = parseInt(taskId.replace('task-', ''), 10)
      if (!isNaN(numId)) {
        deleteTaskFromDb(numId)
      }
    } else {
      setOtherDayTasks((prev) => ({
        ...prev,
        [day]: (prev[day] || []).filter((t) => t.id !== taskId),
      }))
    }
    showToast('Task removed from schedule', '🗑')
  }

  // Pomodoro handlers
  const openPomodoroModal = (sessionName: string) => {
    setPomoSessionName(sessionName)
    setPomoModalOpen(true)
  }

  const togglePomodoro = () => {
    if (!pomoRunning) {
      soundSynth.playSuccessBeep()
    }
    setPomoRunning((prev) => !prev)
  }

  const resetPomodoro = () => {
    setPomoRunning(false)
    setPomoSeconds(25 * 60)
  }

  // Add tool trace to chat
  const addToolExecutionTrace = (toolName: string, argsObj: Record<string, unknown>) => {
    setChatList((prev) => [
      ...prev,
      {
        id: `trace-${Date.now()}`,
        type: 'trace',
        toolName,
        toolArgs: argsObj,
      },
    ])
  }

  // Add chat message
  const addChatMessage = (text: string, sender: 'bot' | 'user' = 'bot') => {
    setChatList((prev) => [
      ...prev,
      {
        id: `msg-${Date.now()}`,
        type: 'msg',
        sender,
        text,
      },
    ])
    sendChatMessage(sender, text)
  }

  // Auto Schedule Practice Session into Free Time
  const triggerAutoSchedule = (taskTitle = 'Python Loop Quick Recap') => {
    if (isRemediationScheduled) {
      showToast('Practice session already slotted into your schedule!', 'ℹ️')
      return
    }

    addToolExecutionTrace('get_free_calendar_slots', { min_duration_minutes: 20 })

    setTimeout(() => {
      addToolExecutionTrace('solve_optimal_slot', {
        selected_gap: '12:00–1:30 PM (Free Time)',
        allocated_practice: '12:00–12:30 PM (30m Quick Recap)',
        lunch_break: '12:30–1:30 PM (60m Lunch & Chill)',
      })

      setTimeout(() => {
        setIsRemediationScheduled(true)
        setPythonCritScheduled(true)
        setQuizScoreText('Score: 35% · Practice Slotted ✨')
        setQuizCardBorderColor('var(--color-math)')

        // Update retention score
        setDktScores((prev) => ({
          ...prev,
          python: {
            pct: 54,
            retention: '+19% projected with recap',
            safe: true,
          },
        }))

        soundSynth.playHarmonicChime()
        showToast('Added 30-min recap to your schedule — lunch break preserved!', '⚡')

        addChatMessage(
          `All set, Laksh! I added <strong>${taskTitle}</strong> for 12:00–12:30 PM. You still have a full hour of relaxing lunch time before lab at 1:30 PM. You've got this! 💪`,
          'bot'
        )
      }, 600)
    }, 500)
  }

  // Smart free time actions (e.g. "Take a walk", "Quick quiz", "Power nap")
  const handleFreeTimeActivity = (
    activityName: string,
    timeSlot: string,
    blockId: 'empty-1' | 'empty-3',
    icon = '🌿'
  ) => {
    setEmptyBlocks((prev) => ({
      ...prev,
      [blockId]: {
        ...prev[blockId],
        filled: true,
        title: `${icon} ${activityName}`,
      },
    }))
    showToast(`Slotted '${activityName}' into your break (${timeSlot})`, icon)
    soundSynth.playHarmonicChime()
    addChatMessage(
      `Great idea! Enjoy your **${activityName}** at **${timeSlot}**. Taking brain breaks is proven to boost memory retention.`,
      'bot'
    )
  }

  // Quiz Drill Launcher
  const launchQuiz = (subjectKey: 'python' | 'math' | 'chem') => {
    setCurrentQuizKey(subjectKey)
    setSelectedQuizOpt(null)
    setQuizFeedback(null)
    setQuizModalOpen(true)
  }

  const selectQuizOption = (optIndex: number) => {
    if (selectedQuizOpt !== null) return
    setSelectedQuizOpt(optIndex)

    const q = QUIZ_DATA[currentQuizKey]
    const isCorrect = q.options[optIndex].correct

    if (isCorrect) {
      soundSynth.playSuccessBeep()
      setQuizFeedback({
        isCorrect: true,
        text: `✓ Spot on! ${q.explanation}`,
      })
      if (currentQuizKey === 'python') {
        setDktScores((prev) => ({
          ...prev,
          python: { pct: 68, retention: 'Stable (Refresher Complete)', safe: true },
        }))
        setQuizScoreText('Score: 68% · Mastered!')
        setQuizCardBorderColor('var(--color-math)')
      } else if (currentQuizKey === 'math') {
        setDktScores((prev) => ({
          ...prev,
          math: { pct: 92, retention: 'Mastery (14d decay)', safe: true },
        }))
      } else if (currentQuizKey === 'chem') {
        setDktScores((prev) => ({
          ...prev,
          chem: { pct: 78, retention: 'Proficient (8d decay)', safe: true },
        }))
      }
      showToast('Knowledge graph updated with your practice win!', '📈')
    } else {
      setQuizFeedback({
        isCorrect: false,
        text: `✕ Nice try! ${q.explanation}`,
      })
    }
  }

  // Quick action buttons
  const triggerQuickAction = (actionText: string) => {
    addChatMessage(actionText, 'user')

    setTimeout(() => {
      if (actionText.includes('recap') || actionText.includes('Practice') || actionText.includes('Auto-Schedule')) {
        triggerAutoSchedule('Python Loop Quick Recap')
      } else if (actionText.includes('drill') || actionText.includes('Quiz')) {
        launchQuiz('python')
      } else if (actionText.includes('retention')) {
        addToolExecutionTrace('memory_retention_check', {
          student_id: 'laksh_01',
          focus_topic: 'python.nested_loops',
        })
        addChatMessage(
          `📉 <strong>Memory Retention Snapshot:</strong><br>• <strong>Algebra:</strong> 84% (Strong &amp; steady)<br>• <strong>Chemistry:</strong> 65% (Healthy retention)<br>• <strong>Python Loops:</strong> 35% (Ready for a booster recap before it fades)<br><br>Doing a 15-minute review today will extend your recall strength by over a week!`,
          'bot'
        )
      } else if (actionText.includes('Pomodoro')) {
        openPomodoroModal('Autonomous Study Session')
      }
    }, 400)
  }

  // Send chat input
  const sendChat = () => {
    const text = chatInput.trim()
    if (!text) return

    addChatMessage(text, 'user')
    setChatInput('')

    setTimeout(() => {
      const lower = text.toLowerCase()
      if (lower.includes('alarm') || lower.includes('bell')) {
        triggerAlarm('Interactive Study Alarm Test', 'Right Now')
        addChatMessage("I've triggered a test of your Study Alarm chime with snooze and dismiss options!", 'bot')
      } else if (lower.includes('pdf') || lower.includes('export') || lower.includes('share')) {
        exportSharePdf()
        addChatMessage('Opening your print-ready PDF export now!', 'bot')
      } else if (lower.includes('quiz') || lower.includes('test') || lower.includes('drill')) {
        launchQuiz('python')
        addChatMessage('Opened your quick Python concept drill.', 'bot')
      } else if (lower.includes('recap') || lower.includes('schedule') || lower.includes('practice') || lower.includes('gap')) {
        triggerAutoSchedule('Python Loop Quick Recap')
      } else if (lower.includes('theme') || lower.includes('dark') || lower.includes('light')) {
        toggleTheme()
        addChatMessage('Switched theme mode as requested.', 'bot')
      } else {
        addChatMessage(
          `Got it, Laksh! Noted: "<em>${text}</em>". I'm keeping your schedule smooth, balanced, and stress-free.`,
          'bot'
        )
      }
    }, 450)
  }

  // Progress calculations for Daily Motivation Banner
  const completedCount = tasks.filter((t) => t.completed).length + (isRemediationScheduled ? 1 : 0)
  const totalCount = tasks.length + (isRemediationScheduled ? 1 : 0)
  const progressPct = Math.round((completedCount / totalCount) * 100)

  const pendingBoostersCount = (pythonCritScheduled ? 0 : 1) + (mathMidtermScheduled ? 0 : 1)

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: 'var(--bg-canvas)' }}>
      {/* ==========================================================================
           TOP NAVBAR: Alarm Status, Export PDF, Focus Timer, Theme Toggle, User Profile
           ========================================================================== */}
      <header className="navbar">
        <div className="brand-group">
          <div className="brand-logo-wrap" title="reviso - Self-Learning Engine">
            <RevisoLogo size={38} />
          </div>
          <div>
            <div className="brand-title">
              <span className="brand-title-name">reviso</span>
              <span className="brand-badge">PRO</span>
            </div>
            <div className="brand-sub">Autonomous Adaptive Study &amp; Self-Learning Engine</div>
          </div>
        </div>

        <div className="header-actions">
          {/* Live Study Alarm Pill */}
          <div className="alarm-pill" title="Active Study Session Alarm">
            <span className="pulse-dot" />
            <span>
              Next: <strong>{nextAlarmLabel}</strong>
            </span>
          </div>

          {/* Calendar Button (Replaces Share / Export) */}
          <button
            type="button"
            className="btn-pill btn-primary"
            onClick={() => setCalendarModalOpen(true)}
            title="Open Interactive Study Calendar & Sync"
          >
            <span>📅</span>
            <span>Calendar</span>
          </button>

          {/* Launch Pomodoro Focus Session */}
          <button
            type="button"
            className="btn-pill"
            onClick={() => openPomodoroModal('Organic Chemistry (11:00 AM)')}
            title="Launch 25-minute Pomodoro Study Timer"
          >
            <span>⏱️</span>
            <span>Focus Timer</span>
          </button>

          {/* Test Audio Alarm */}
          <button
            type="button"
            className="btn-pill"
            onClick={() => triggerAlarm('Loop structures & list comprehension', '1:30 PM')}
            title="Test Web Audio synthesizer alarm chime"
          >
            <BellIcon size={14} color="#ffffff" />
            <span>Test Alarm</span>
          </button>

          {/* Dark/Light Mode Switcher */}
          <button
            type="button"
            className="btn-icon"
            onClick={toggleTheme}
            title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          >
            <span>{theme === 'dark' ? '☀️' : '🌙'}</span>
          </button>

          {/* User Profile */}
          <div className="profile-wrapper" ref={profileRef}>
            <button
              type="button"
              className={`profile-button ${isProfileOpen ? 'active' : ''}`}
              onClick={() => setIsProfileOpen(!isProfileOpen)}
              aria-label="User Profile"
            >
              <div className="avatar-circle">
                <span>{userName.slice(0, 2).toUpperCase()}</span>
                <span className="avatar-online-dot" />
              </div>
              <div className="profile-text-group">
                <span className="profile-user-name">{userName}</span>
                <span className="profile-user-role">{userRole}</span>
              </div>
              <span style={{ fontSize: '10px', color: 'var(--text-tertiary)' }}>▾</span>
            </button>

            {isProfileOpen && (
              <div className="profile-dropdown-menu">
                <div className="dropdown-user-info">
                  <div className="dropdown-avatar-large">
                    {userName.slice(0, 2).toUpperCase()}
                  </div>
                  <div className="dropdown-meta">
                    <span className="dropdown-full-name">{userName}</span>
                    <span className="dropdown-email">laksh.hs@adaptive.ai</span>
                    <span className="dropdown-badge">{userRole} • {userGrade}</span>
                  </div>
                </div>
                <div className="dropdown-divider" />
                {isEditingName ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <input
                      type="text"
                      value={editNameValue}
                      onChange={(e) => setEditNameValue(e.target.value)}
                      style={{
                        background: 'var(--bg-canvas)',
                        border: '1.5px solid var(--border-strong)',
                        color: 'var(--text-primary)',
                        padding: '6px',
                        borderRadius: '6px',
                        fontSize: '12px',
                      }}
                      autoFocus
                    />
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <button
                        type="button"
                        onClick={() => {
                          if (editNameValue.trim()) {
                            const trimmed = editNameValue.trim()
                            setUserName(trimmed)
                            setStoredUserName(trimmed)
                            updateUserProfile(1, { fullName: trimmed })
                            setIsEditingName(false)
                            showToast(`Saved to database as ${trimmed}`)
                          }
                        }}
                        style={{
                          flex: 1,
                          background: 'var(--grad-primary)',
                          color: '#fff',
                          border: 'none',
                          borderRadius: '4px',
                          padding: '4px',
                          fontSize: '11px',
                          fontWeight: 700,
                          cursor: 'pointer',
                        }}
                      >
                        Save
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setEditNameValue(userName)
                          setIsEditingName(false)
                        }}
                        style={{
                          background: 'var(--bg-surface-elevated)',
                          color: 'var(--text-secondary)',
                          border: '1px solid var(--border-subtle)',
                          borderRadius: '4px',
                          padding: '4px 8px',
                          fontSize: '11px',
                          cursor: 'pointer',
                        }}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    type="button"
                    className="dropdown-action-btn"
                    onClick={() => setIsEditingName(true)}
                  >
                    <span>⚙️</span>
                    <span>Change Display Name</span>
                  </button>
                )}
                <button
                  type="button"
                  className="dropdown-action-btn logout-btn"
                  onClick={() => setIsProfileOpen(false)}
                >
                  <span>🚪</span>
                  <span>Sign Out</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* ==========================================================================
           DUAL-COLUMN WORKSPACE
           ========================================================================== */}
      <main className="app-workspace">
        {/* LEFT: CALENDAR, DEEP KNOWLEDGE TRACING & EMPTY BLOCK DETECTOR */}
        <section className="left-column">
          {/* DAILY MOTIVATION & PROGRESS BANNER */}
          <div className="daily-progress-banner">
            <div className="daily-progress-header">
              <div className="daily-progress-title-wrap">
                <span className="streak-pill">🔥 {userStreak}-Day Streak!</span>
                <span className="daily-progress-text">
                  {completedCount} of {totalCount} study blocks completed <span className="daily-pct-highlight">({progressPct}%)</span>
                </span>
              </div>
              <span className="daily-progress-sub">
                Awesome momentum, {userName.split(' ')[0]}! Keep going strong.
              </span>
            </div>
            <div className="daily-progress-track">
              <div className="daily-progress-fill" style={{ width: `${progressPct}%` }} />
            </div>
          </div>

          {/* Panel 1: Today's Adaptive Schedule */}
          <div className="panel" id="schedule-panel">
            <div className="panel-header-row">
              <h2 className="panel-title">
                <span>📅</span>
                <span>Today's Adaptive Schedule</span>
              </h2>

              {/* Diagnostic Review Card (Encouraging Tone) */}
              <div
                className="sync-card"
                onClick={() => triggerAutoSchedule('Python Loop Quick Recap')}
                title="Squeeze in a quick friendly recap into your free time"
                style={{ borderColor: quizCardBorderColor || undefined }}
              >
                <div className="sync-badge">
                  <span>💡</span>
                  <span>QUIZ</span>
                </div>
                <div className="sync-meta">
                  <div className="sync-score">{quizScoreText}</div>
                  <div className="sync-name">Python Nested Loops &amp; Comprehensions</div>
                </div>
                <div className="sync-btn-auto">
                  <span>⚡</span>
                  <span>
                    {isRemediationScheduled ? 'Recap Slotted (12:00 PM)' : 'Add 20m Practice'}
                  </span>
                </div>
              </div>
            </div>

            {/* Schedule List with De-cluttered Task Cards & Smart Free Time Chips */}
            <div className="timeline-list">
              {/* Task 1: Maths */}
              <div className={`task-card ${tasks[0].completed ? 'completed' : ''}`}>
                <div className="task-card-left">
                  <div className="task-check-circle" onClick={() => toggleTask(tasks[0].id)}>
                    ✓
                  </div>
                  <div className="task-info">
                    <div className="task-title">{tasks[0].title}</div>
                    <div className="task-meta-row">
                      <span className="task-tag task-tag-math">{tasks[0].tagIcon}</span>
                      <span>·</span>
                      <span>{tasks[0].timeSlot}</span>
                    </div>
                  </div>
                </div>
                <div className="task-card-right">
                  <button
                    type="button"
                    className="btn-timer"
                    onClick={() => openPomodoroModal('Algebra Basics')}
                  >
                    ⏱️ Focus
                  </button>
                  <button
                    type="button"
                    className={`btn-alarm-bell ${tasks[0].alarmActive ? 'active' : ''}`}
                    onClick={() => toggleAlarmBell(tasks[0].id, tasks[0].title)}
                    title={tasks[0].alarmActive ? 'Alarm Active' : 'Muted'}
                  >
                    <BellIcon size={14} />
                  </button>
                  <span className="badge badge-done">{tasks[0].status}</span>
                </div>
              </div>

              {/* Free Time Block 1 (Smart Suggestions) */}
              <div className="empty-block">
                <div className="empty-block-left">
                  <span className="empty-tag">
                    {emptyBlocks['empty-1'].filled ? 'Scheduled' : 'Brain Break ☕'}
                  </span>
                  <span>
                    {emptyBlocks['empty-1'].filled
                      ? `${emptyBlocks['empty-1'].title} (${emptyBlocks['empty-1'].time})`
                      : emptyBlocks['empty-1'].label}
                  </span>
                </div>
                {!emptyBlocks['empty-1'].filled ? (
                  <div className="empty-actions-row">
                    <button
                      type="button"
                      className="chip-suggestion"
                      onClick={() => handleFreeTimeActivity('Take a walk', '10:30–11:00 AM', 'empty-1', '🚶')}
                    >
                      <span>🚶</span>
                      <span>Take a walk</span>
                    </button>
                    <button
                      type="button"
                      className="chip-suggestion"
                      onClick={() => handleFreeTimeActivity('Power nap', '10:30–11:00 AM', 'empty-1', '😴')}
                    >
                      <span>😴</span>
                      <span>Power nap</span>
                    </button>
                    <button
                      type="button"
                      className="btn-quick-fill"
                      onClick={() => handleFreeTimeActivity('Quick Revision', '10:30–11:00 AM', 'empty-1', '⚡')}
                    >
                      <span>+</span>
                      <span>Add drill</span>
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    className="btn-alarm-bell active"
                    onClick={() => showToast('Alarm active for scheduled break', 'bell')}
                  >
                    <BellIcon size={14} />
                  </button>
                )}
              </div>

              {/* Task 2: Chemistry */}
              <div className={`task-card ${tasks[1].completed ? 'completed' : ''}`}>
                <div className="task-card-left">
                  <div className="task-check-circle" onClick={() => toggleTask(tasks[1].id)}>
                    ✓
                  </div>
                  <div className="task-info">
                    <div className="task-title">{tasks[1].title}</div>
                    <div className="task-meta-row">
                      <span className="task-tag task-tag-chem">{tasks[1].tagIcon}</span>
                      <span>·</span>
                      <span>{tasks[1].timeSlot}</span>
                    </div>
                  </div>
                </div>
                <div className="task-card-right">
                  <button
                    type="button"
                    className="btn-timer"
                    onClick={() => openPomodoroModal('Organic Chemistry')}
                  >
                    ⏱️ Focus
                  </button>
                  <button
                    type="button"
                    className={`btn-alarm-bell ${tasks[1].alarmActive ? 'active' : ''}`}
                    onClick={() => toggleAlarmBell(tasks[1].id, tasks[1].title)}
                    title="Alarm notification"
                  >
                    <BellIcon size={14} />
                  </button>
                  <span className="badge badge-upcoming">{tasks[1].status}</span>
                </div>
              </div>

              {/* Slotted Practice Card if scheduled */}
              {isRemediationScheduled && (
                <div className="task-card critical-remediation">
                  <div className="task-card-left">
                    <div
                      className="task-check-circle"
                      onClick={() => showToast('Loop Practice session marked done!', '✓')}
                    >
                      ✓
                    </div>
                    <div className="task-info">
                      <div className="task-title">⚡ Quick Practice: Python Nested Loops</div>
                      <div className="task-meta-row">
                        <span className="task-tag task-tag-python">🐍 Python</span>
                        <span>·</span>
                        <span>12:00–12:30 PM (Quick Booster in Free Time)</span>
                      </div>
                    </div>
                  </div>
                  <div className="task-card-right">
                    <button
                      type="button"
                      className="btn-timer"
                      onClick={() => openPomodoroModal('Python Loop Recap')}
                    >
                      ⏱️ Focus
                    </button>
                    <button
                      type="button"
                      className="btn-alarm-bell active"
                      onClick={() => showToast('Alarm set for Python practice', 'bell')}
                    >
                      <BellIcon size={14} />
                    </button>
                    <span className="badge badge-upcoming">Review Slotted</span>
                  </div>
                </div>
              )}

              {/* Free Time Block 2 (Prime Window) */}
              <div className="empty-block">
                <div className="empty-block-left">
                  <span className="empty-tag">
                    {isRemediationScheduled ? 'Lunch Break 🥪' : 'Free Time 🌿'}
                  </span>
                  <span>
                    {isRemediationScheduled
                      ? '12:30–1:30 PM (60 min Lunch & Relaxation)'
                      : '12:00–1:30 PM (90 min open study window)'}
                  </span>
                </div>
                {!isRemediationScheduled ? (
                  <div className="empty-actions-row">
                    <button
                      type="button"
                      className="chip-suggestion"
                      onClick={() => triggerAutoSchedule('Python Loop Quick Recap')}
                    >
                      <span>⚡</span>
                      <span>Fit 20m practice</span>
                    </button>
                    <button
                      type="button"
                      className="chip-suggestion"
                      onClick={() => showToast('Enjoy your relaxing lunch window!', '🥪')}
                    >
                      <span>🥪</span>
                      <span>Chill & Lunch</span>
                    </button>
                  </div>
                ) : (
                  <span style={{ fontSize: '11.5px', color: 'var(--text-tertiary)', fontWeight: 600 }}>
                    Relaxation Time
                  </span>
                )}
              </div>

              {/* Task 3: Python */}
              <div className={`task-card ${tasks[2].completed ? 'completed' : ''}`}>
                <div className="task-card-left">
                  <div className="task-check-circle" onClick={() => toggleTask(tasks[2].id)}>
                    ✓
                  </div>
                  <div className="task-info">
                    <div className="task-title">{tasks[2].title}</div>
                    <div className="task-meta-row">
                      <span className="task-tag task-tag-python">{tasks[2].tagIcon}</span>
                      <span>·</span>
                      <span>{tasks[2].timeSlot}</span>
                    </div>
                  </div>
                </div>
                <div className="task-card-right">
                  <button
                    type="button"
                    className="btn-timer"
                    onClick={() => openPomodoroModal('Loop Structures Lab')}
                  >
                    ⏱️ Focus
                  </button>
                  <button
                    type="button"
                    className={`btn-alarm-bell ${tasks[2].alarmActive ? 'active' : ''}`}
                    onClick={() => toggleAlarmBell(tasks[2].id, tasks[2].title)}
                  >
                    <BellIcon size={14} />
                  </button>
                  <span className="badge badge-upcoming">{tasks[2].status}</span>
                </div>
              </div>

              {/* Free Time Block 3 */}
              <div className="empty-block">
                <div className="empty-block-left">
                  <span
                    className="empty-tag"
                    style={
                      emptyBlocks['empty-3'].filled
                        ? { background: 'var(--color-math-subtle)', color: 'var(--color-math)', borderColor: 'var(--color-math)' }
                        : undefined
                    }
                  >
                    {emptyBlocks['empty-3'].filled ? 'Scheduled' : 'Brain Break ☕'}
                  </span>
                  <span>
                    {emptyBlocks['empty-3'].filled
                      ? `${emptyBlocks['empty-3'].title} (${emptyBlocks['empty-3'].time})`
                      : emptyBlocks['empty-3'].label}
                  </span>
                </div>
                {!emptyBlocks['empty-3'].filled ? (
                  <div className="empty-actions-row">
                    <button
                      type="button"
                      className="chip-suggestion"
                      onClick={() => handleFreeTimeActivity('Take a walk', '2:15–3:00 PM', 'empty-3', '🚶')}
                    >
                      <span>🚶</span>
                      <span>Walk</span>
                    </button>
                    <button
                      type="button"
                      className="chip-suggestion"
                      onClick={() => handleFreeTimeActivity('Power nap', '2:15–3:00 PM', 'empty-3', '😴')}
                    >
                      <span>😴</span>
                      <span>Power nap</span>
                    </button>
                    <button
                      type="button"
                      className="btn-quick-fill"
                      onClick={() => handleFreeTimeActivity('Quick Math Review', '2:15–3:00 PM', 'empty-3', '📐')}
                    >
                      <span>+</span>
                      <span>Add drill</span>
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    className="btn-alarm-bell active"
                    onClick={() => showToast('Alarm active for scheduled break', 'bell')}
                  >
                    <BellIcon size={14} />
                  </button>
                )}
              </div>

              {/* Task 4: Completed Maths (Crisp Strikethrough & High Contrast) */}
              <div className={`task-card ${tasks[3].completed ? 'completed' : ''}`}>
                <div className="task-card-left">
                  <div className="task-check-circle" onClick={() => toggleTask(tasks[3].id)}>
                    ✓
                  </div>
                  <div className="task-info">
                    <div className="task-title">{tasks[3].title}</div>
                    <div className="task-meta-row">
                      <span className="task-tag task-tag-math">{tasks[3].tagIcon}</span>
                      <span>·</span>
                      <span>{tasks[3].timeSlot}</span>
                    </div>
                  </div>
                </div>
                <div className="task-card-right">
                  <button
                    type="button"
                    className="btn-alarm-bell"
                    onClick={() => toggleAlarmBell(tasks[3].id, tasks[3].title)}
                  >
                    <BellIcon size={14} />
                  </button>
                  <span className="badge badge-done">{tasks[3].status}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Panel 2: Concept Mastery & Retention */}
          <div className="panel">
            <div className="panel-header-row">
              <div>
                <h2 className="panel-title">
                  <span>🧠</span>
                  <span>Concept Mastery &amp; Retention</span>
                </h2>
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                  Smart spaced repetition to keep your memory sharp and stress-free
                </div>
              </div>
              <span
                className={`badge ${isRemediationScheduled ? 'badge-done' : 'badge-upcoming'}`}
              >
                {isRemediationScheduled ? 'All Refreshed ✨' : '1 Refresher Recommended'}
              </span>
            </div>

            <div className="dkt-grid">
              {/* Maths Concept Card */}
              <div className="concept-card" style={{ borderTop: '3px solid var(--color-math)' }}>
                <div className="concept-header">
                  <span className="concept-name">Maths (Algebra)</span>
                  <span className="concept-pct" style={{ color: 'var(--color-math)' }}>
                    {dktScores.math.pct}%
                  </span>
                </div>
                <div className="progress-track">
                  <div className="progress-fill fill-math" style={{ width: `${dktScores.math.pct}%` }} />
                </div>
                <div className="decay-risk-bar">
                  <span>Retention:</span>
                  <span style={{ color: 'var(--color-math)', fontWeight: 700 }}>
                    {dktScores.math.retention}
                  </span>
                </div>
                <button
                  type="button"
                  className="btn-concept-quiz"
                  onClick={() => launchQuiz('math')}
                >
                  <span>📝</span>
                  <span>Take Math Drill</span>
                </button>
              </div>

              {/* Chemistry Concept Card */}
              <div className="concept-card" style={{ borderTop: '3px solid var(--color-chem)' }}>
                <div className="concept-header">
                  <span className="concept-name">Chemistry (Reactions)</span>
                  <span className="concept-pct" style={{ color: 'var(--color-chem)' }}>
                    {dktScores.chem.pct}%
                  </span>
                </div>
                <div className="progress-track">
                  <div className="progress-fill fill-chem" style={{ width: `${dktScores.chem.pct}%` }} />
                </div>
                <div className="decay-risk-bar">
                  <span>Retention:</span>
                  <span style={{ color: 'var(--color-chem)', fontWeight: 700 }}>
                    {dktScores.chem.retention}
                  </span>
                </div>
                <button
                  type="button"
                  className="btn-concept-quiz"
                  onClick={() => launchQuiz('chem')}
                >
                  <span>📝</span>
                  <span>Take Chem Drill</span>
                </button>
              </div>

              {/* Python Concept Card */}
              <div
                className="concept-card"
                style={{
                  borderTop: '3px solid #004D40',
                }}
              >
                <div className="concept-header">
                  <span className="concept-name">Python (Loops &amp; Logic)</span>
                  <span className="concept-pct" style={{ color: '#004D40' }}>
                    {dktScores.python.pct}%
                  </span>
                </div>
                <div className="progress-track">
                  <div className="progress-fill fill-py" style={{ width: `${dktScores.python.pct}%` }} />
                </div>
                <div className="decay-risk-bar">
                  <span>Retention:</span>
                  <span className="decay-danger" style={{ color: '#004D40' }}>
                    {dktScores.python.retention}
                  </span>
                </div>
                <button
                  type="button"
                  className="btn-concept-quiz"
                  onClick={() => launchQuiz('python')}
                >
                  <span>⚡</span>
                  <span>Take Booster Drill</span>
                </button>
              </div>
            </div>
          </div>

          {/* Panel 3: Focus Areas & Boosters (Softer, Encouraging Tone) */}
          <div className="criticals-panel">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div
                style={{
                  fontSize: '13.5px',
                  fontWeight: 800,
                  color: 'var(--text-primary)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '7px',
                }}
              >
                <span>🎯</span>
                <span>Focus Areas &amp; Boosters</span>
              </div>
              <span style={{ fontSize: '11.5px', color: '#004D40', fontWeight: 700 }}>
                {pendingBoostersCount} Recommendations Available
              </span>
            </div>

            {/* Booster 1 */}
            <div className="critical-item">
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '9px' }}>
                <span style={{ color: '#004D40', fontSize: '16px' }}>💡</span>
                <div>
                  <strong>Quick recap suggested:</strong> A 20-min loop refresher will make your upcoming lab a breeze!
                </div>
              </div>
              <button
                type="button"
                className={`btn-schedule-critical ${pythonCritScheduled ? 'scheduled' : ''}`}
                onClick={() => triggerAutoSchedule('Python Loop Quick Recap')}
              >
                <span>{pythonCritScheduled ? '✓' : '⚡'}</span>
                <span>{pythonCritScheduled ? 'Slotted for 12:00 PM' : 'Squeeze in 20m Practice'}</span>
              </button>
            </div>

            {/* Booster 2 */}
            <div className="critical-item">
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '9px' }}>
                <span style={{ color: 'var(--color-chem)', fontSize: '16px' }}>📅</span>
                <div>
                  <strong>Math Midterm in 5 days:</strong> Let's do a relaxed 25m brush-up on quadratic roots.
                </div>
              </div>
              <button
                type="button"
                className={`btn-schedule-critical ${mathMidtermScheduled ? 'scheduled' : ''}`}
                onClick={() => {
                  setMathMidtermScheduled(true)
                  handleFreeTimeActivity('Math Midterm Review', '2:15–3:00 PM', 'empty-3', '📐')
                }}
              >
                <span>{mathMidtermScheduled ? '✓' : '📅'}</span>
                <span>{mathMidtermScheduled ? 'Slotted in 2:15 PM' : 'Slot 25m Review'}</span>
              </button>
            </div>
          </div>
        </section>

        {/* RIGHT: AI STUDY COPILOT & INTERACTIVE CHAT */}
        <aside className="right-column">
          <div className="agent-header">
            <div className="agent-identity">
              <div className="agent-avatar" style={{ background: 'transparent', padding: 0, border: 'none' }}>
                <RevisoLogo size={32} />
              </div>
              <div>
                <div className="agent-name">Reviso Copilot</div>
                <div className="agent-status-label">
                  <span>●</span> Ready to help you thrive ✨
                </div>
              </div>
            </div>
            <div style={{ fontSize: '11.5px', color: 'var(--text-tertiary)', fontWeight: 600 }}>
              {userName}'s Study Buddy
            </div>
          </div>

          {/* Chat & Friendly Stream */}
          <div className="chat-messages">
            {chatList.map((entry) => {
              if (entry.type === 'trace') {
                return (
                  <div key={entry.id} className="tool-call-trace">
                    <div className="tool-header">
                      <span>⚡ study_copilot_action:</span> <strong>{entry.toolName}()</strong>
                    </div>
                    <div>{JSON.stringify(entry.toolArgs, null, 2)}</div>
                  </div>
                )
              }
              return (
                <div
                  key={entry.id}
                  className={`chat-bubble ${entry.sender}`}
                  dangerouslySetInnerHTML={{ __html: entry.text || '' }}
                />
              )
            })}
            <div ref={chatBottomRef} />
          </div>

          {/* Encouraging Quick Action Chips */}
          <div className="quick-actions-bar">
            <button
              type="button"
              className="quick-btn"
              onClick={() => triggerQuickAction('⚡ Add 20m loop recap before lunch')}
            >
              <span>⚡ Add 20m loop recap before lunch</span>
              <span className="arrow">→</span>
            </button>
            <button
              type="button"
              className="quick-btn"
              onClick={() => triggerQuickAction('📝 Try a friendly 3-question drill')}
            >
              <span>📝 Try a friendly 3-question drill</span>
              <span className="arrow">→</span>
            </button>
            <button
              type="button"
              className="quick-btn"
              onClick={() => triggerQuickAction('📉 How does my memory retention look?')}
            >
              <span>📉 How does my memory retention look?</span>
              <span className="arrow">→</span>
            </button>
            <button
              type="button"
              className="quick-btn"
              onClick={() => triggerQuickAction('⏱️ Start a 25-minute Pomodoro timer')}
            >
              <span>⏱️ Start a 25-minute Pomodoro timer</span>
              <span className="arrow">→</span>
            </button>
          </div>

          {/* Chat Input Field */}
          <div className="chat-input-row">
            <input
              type="text"
              className="chat-input-field"
              placeholder="Ask your study copilot, e.g., 'help with loops', 'test alarm'..."
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') sendChat()
              }}
            />
            <button type="button" className="chat-send-btn" onClick={sendChat} title="Send">
              ➤
            </button>
          </div>
        </aside>
      </main>

      {/* ==========================================================================
           MODAL 1: INTERACTIVE CONCEPT QUIZ
           ========================================================================== */}
      <div
        className={`modal-backdrop ${quizModalOpen ? 'active' : ''}`}
        onClick={(e) => {
          if (e.target === e.currentTarget) setQuizModalOpen(false)
        }}
      >
        <div className="modal-window">
          <div className="modal-header">
            <div style={{ fontWeight: 800, fontSize: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span>📝</span>
              <span>{QUIZ_DATA[currentQuizKey]?.title}</span>
            </div>
            <button
              type="button"
              className="btn-icon"
              style={{ width: '30px', height: '30px' }}
              onClick={() => setQuizModalOpen(false)}
            >
              ✕
            </button>
          </div>
          <div className="modal-body">
            <div
              className="quiz-question-box"
              dangerouslySetInnerHTML={{ __html: QUIZ_DATA[currentQuizKey]?.questionHtml || '' }}
            />
            <div className="quiz-options">
              {QUIZ_DATA[currentQuizKey]?.options.map((opt, idx) => {
                let btnClass = 'quiz-opt-btn'
                if (selectedQuizOpt !== null) {
                  if (opt.correct) btnClass += ' correct'
                  else if (selectedQuizOpt === idx) btnClass += ' incorrect'
                }
                return (
                  <button
                    key={idx}
                    type="button"
                    className={btnClass}
                    disabled={selectedQuizOpt !== null}
                    onClick={() => selectQuizOption(idx)}
                  >
                    <strong>{String.fromCharCode(65 + idx)}.</strong> <span>{opt.text}</span>
                  </button>
                )
              })}
            </div>
            {quizFeedback && (
              <div
                className="quiz-feedback-box"
                style={{
                  display: 'block',
                  background: quizFeedback.isCorrect ? 'var(--color-math-subtle)' : 'rgba(0, 77, 64, 0.25)',
                  color: quizFeedback.isCorrect ? 'var(--color-math)' : '#004D40',
                }}
              >
                {quizFeedback.text}
              </div>
            )}
          </div>
          <div className="modal-footer">
            <button type="button" className="btn-pill" onClick={() => setQuizModalOpen(false)}>
              Close
            </button>
          </div>
        </div>
      </div>

      {/* ==========================================================================
           MODAL 2: POMODORO FOCUS TIMER
           ========================================================================== */}
      <div
        className={`modal-backdrop ${pomoModalOpen ? 'active' : ''}`}
        onClick={(e) => {
          if (e.target === e.currentTarget) setPomoModalOpen(false)
        }}
      >
        <div className="modal-window" style={{ maxWidth: '420px', textAlign: 'center' }}>
          <div className="modal-header">
            <div style={{ fontWeight: 800, fontSize: '15px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span>⏱️</span>
              <span>Focus: {pomoSessionName}</span>
            </div>
            <button
              type="button"
              className="btn-icon"
              style={{ width: '30px', height: '30px' }}
              onClick={() => setPomoModalOpen(false)}
            >
              ✕
            </button>
          </div>
          <div className="modal-body">
            <div className="timer-display">
              <div className="timer-digits">
                {`${String(Math.floor(pomoSeconds / 60)).padStart(2, '0')}:${String(pomoSeconds % 60).padStart(2, '0')}`}
              </div>
              <div style={{ fontSize: '13px', color: 'var(--text-secondary)', fontWeight: 500 }}>
                Deep Focus Block · Take it one step at a time
              </div>
            </div>
            <div className="timer-controls" style={{ justifyContent: 'center' }}>
              <button
                type="button"
                className="btn-pill btn-primary"
                style={{ padding: '9px 22px' }}
                onClick={togglePomodoro}
              >
                <span>{pomoRunning ? '⏸' : '▶'}</span>
                <span>{pomoRunning ? 'Pause' : 'Start'}</span>
              </button>
              <button type="button" className="btn-pill" onClick={resetPomodoro}>
                <span>🔄</span>
                <span>Reset</span>
              </button>
            </div>
          </div>
          <div className="modal-footer" style={{ justifyContent: 'center' }}>
            <span style={{ fontSize: '11.5px', color: 'var(--text-tertiary)' }}>
              A soothing chime will celebrate when you finish!
            </span>
          </div>
        </div>
      </div>

      {/* ==========================================================================
           MODAL 3: STUDY ALARM RINGING DIALOG
           ========================================================================== */}
      <div
        className={`modal-backdrop ${alarmModalOpen ? 'active' : ''}`}
        onClick={(e) => {
          if (e.target === e.currentTarget) setAlarmModalOpen(false)
        }}
      >
        <div
          className="modal-window"
          style={{ maxWidth: '430px', textAlign: 'center', borderColor: 'var(--accent-primary)' }}
        >
          <div className="modal-body" style={{ alignItems: 'center', padding: '32px 22px' }}>
            {/* Alarm Ringing Icon */}
            <div
              style={{
                width: '66px',
                height: '66px',
                background: 'rgba(0, 77, 64, 0.35)',
                border: '1.5px solid #00695c',
                color: '#ffffff',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '12px',
                boxShadow: '0 4px 20px rgba(0, 77, 64, 0.35)',
              }}
            >
              <BellIcon size={32} color="#ffffff" />
            </div>
            <h3
              style={{
                fontSize: '20px',
                fontWeight: 800,
                marginBottom: '6px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
              }}
            >
              <BellIcon size={18} color="#ffffff" />
              <span>Time for {activeAlarmTitle}</span>
            </h3>
            <p style={{ fontSize: '13.5px', color: 'var(--text-secondary)', marginBottom: '22px', lineHeight: 1.45 }}>
              Your session ({activeAlarmTime}) is starting now. Grab some water, get comfortable, and let's make progress!
            </p>
            <div style={{ display: 'flex', gap: '12px', width: '100%' }}>
              <button
                type="button"
                className="btn-pill"
                style={{ flex: 1, justifyContent: 'center' }}
                onClick={dismissAlarm}
              >
                Dismiss
              </button>
              <button
                type="button"
                className="btn-pill btn-primary"
                style={{ flex: 1, justifyContent: 'center' }}
                onClick={snoozeAlarm}
              >
                Snooze 5 Min
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ==========================================================================
           FULL-PAGE STUDY CALENDAR & WORKSPACE (Month + Day View with Full Scroll)
           ========================================================================== */}
      <div
        className={`calendar-fullpage-overlay ${calendarModalOpen ? 'active' : ''}`}
        id="calendar-fullpage-view"
      >
        {/* Sticky Full-Page Header */}
        <header className="cal-fullpage-header">
          <div className="cal-fullpage-header-left">
            <button
              type="button"
              className="btn-pill"
              style={{ fontSize: '12px', padding: '6px 14px', background: 'var(--bg-surface-elevated)' }}
              onClick={() => setCalendarModalOpen(false)}
            >
              ← Back to Dashboard
            </button>
            <div className="cal-fullpage-title">
              <RevisoLogo size={24} />
              <span>Study Calendar &amp; Schedule</span>
            </div>
          </div>

          <div className="cal-fullpage-header-right">
            {/* View switcher: Month View vs Day Tasks */}
            <div className="cal-segmented-control">
              <button
                type="button"
                className={`cal-seg-btn ${calViewMode === 'month' ? 'active' : ''}`}
                onClick={() => setCalViewMode('month')}
              >
                <span>📅</span>
                <span>Month View</span>
              </button>
              <button
                type="button"
                className={`cal-seg-btn ${calViewMode === 'day' ? 'active' : ''}`}
                onClick={() => setCalViewMode('day')}
              >
                <span>📋</span>
                <span>Day View (Sep {selectedCalDay})</span>
              </button>
            </div>

            {/* Sync Badge */}
            <div className="calendar-sync-badge">
              <span style={{ color: '#34d399', fontSize: '10px' }}>●</span>
              <span>Google Calendar &amp; iCal Connected</span>
            </div>

            {/* Close X Button */}
            <button
              type="button"
              className="btn-icon"
              style={{ width: '36px', height: '36px', fontSize: '16px' }}
              onClick={() => setCalendarModalOpen(false)}
              title="Close Calendar (Esc)"
            >
              ✕
            </button>
          </div>
        </header>

        {/* Scrollable Body */}
        <main className="cal-fullpage-body">
          {/* Top Banner with Quick Highlights */}
          <div className="cal-top-banner">
            <div>
              <div className="cal-top-banner-title">
                <span>🗓️ September 2026 Academic Schedule</span>
                <span
                  style={{
                    fontSize: '11px',
                    padding: '3px 9px',
                    borderRadius: '999px',
                    background: 'rgba(0, 77, 64, 0.4)',
                    color: '#80cbc4',
                    border: '1px solid #00695c',
                  }}
                >
                  Active Semester
                </span>
              </div>
              <p style={{ margin: '4px 0 0 0', color: 'var(--text-secondary)', fontSize: '13px' }}>
                Automated spaced repetition schedules, dynamic exam prep milestones, and daily study blocks.
              </p>
            </div>

            <div className="cal-stats-grid">
              <div className="cal-stat-card">
                <span className="cal-stat-val">30 Days</span>
                <span className="cal-stat-label">Term Span</span>
              </div>
              <div className="cal-stat-card">
                <span className="cal-stat-val" style={{ color: '#34d399' }}>
                  {tasks.filter((t) => t.completed).length +
                    Object.values(otherDayTasks).flat().filter((t) => t.completed).length}{' '}
                  Done
                </span>
                <span className="cal-stat-label">Completed Tasks</span>
              </div>
              <div className="cal-stat-card">
                <span className="cal-stat-val" style={{ color: '#f59e0b' }}>2 Exams</span>
                <span className="cal-stat-label">Milestones (Sep 15, 28)</span>
              </div>
              <button
                type="button"
                className="btn-pill"
                style={{ fontSize: '12px', padding: '6px 14px' }}
                onClick={() => {
                  setCalendarSyncActive(true)
                  soundSynth.playSuccessBeep()
                  showToast('Re-synced with Google Calendar & iCal!', '✨')
                  setTimeout(() => setCalendarSyncActive(false), 800)
                }}
              >
                <span>🔄</span>
                <span>{calendarSyncActive ? 'Syncing...' : 'Sync Calendar'}</span>
              </button>
            </div>
          </div>

          {/* Condition: Month View vs Day View */}
          {calViewMode === 'month' ? (
            /* Month Layout: Expansive Grid + Side Drawer */
            <div className="cal-month-layout">
              <div className="cal-grid-panel">
                <div className="calendar-month-nav">
                  <div className="calendar-month-title">
                    <span>September 2026</span>
                  </div>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                      Click any date to inspect and manage its tasks
                    </span>
                  </div>
                </div>

                <div className="cal-large-grid">
                  {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
                    <div key={d} className="calendar-weekday">
                      {d}
                    </div>
                  ))}

                  {/* Empty padding for Sun, Mon */}
                  <div className="cal-large-cell empty" />
                  <div className="cal-large-cell empty" />

                  {Array.from({ length: 30 }, (_, i) => i + 1).map((day) => {
                    const isToday = day === 12
                    const isSelected = day === selectedCalDay
                    const dayTasksList = day === 12 ? tasks : otherDayTasks[day] || []
                    const hasExam = [15, 28].includes(day)

                    let cellClass = 'cal-large-cell'
                    if (isToday) cellClass += ' today'
                    if (isSelected) cellClass += ' selected'

                    return (
                      <div
                        key={day}
                        className={cellClass}
                        onClick={() => {
                          setSelectedCalDay(day)
                          soundSynth.playHarmonicChime()
                        }}
                      >
                        <div className="cal-cell-header">
                          <span className="cal-cell-day-num">{day}</span>
                          {isToday && <span className="cal-cell-today-pill">Today</span>}
                        </div>

                        <div className="cal-cell-events">
                          {hasExam && (
                            <div className="cal-event-chip exam">
                              🎯 Exam Milestone
                            </div>
                          )}
                          {dayTasksList.slice(0, 2).map((t) => (
                            <div
                              key={t.id}
                              className={`cal-event-chip ${
                                t.subject === 'Maths'
                                  ? 'math'
                                  : t.subject === 'Chemistry'
                                  ? 'chem'
                                  : 'python'
                              }`}
                              title={t.title}
                            >
                              {t.completed ? '✓ ' : ''}{t.subject}: {t.title}
                            </div>
                          ))}
                          {dayTasksList.length > 2 && (
                            <span style={{ fontSize: '10px', color: 'var(--text-tertiary)', fontWeight: 600 }}>
                              +{dayTasksList.length - 2} more
                            </span>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Side Drawer in Month View */}
              <div className="cal-side-drawer">
                <div className="cal-side-header">
                  <div className="cal-side-title">
                    <span>Selected: <strong>Sep {selectedCalDay}, 2026</strong></span>
                    {selectedCalDay === 12 && (
                      <span className="cal-badge-today" style={{ marginLeft: '8px' }}>
                        Today
                      </span>
                    )}
                  </div>
                  <button
                    type="button"
                    className="btn-pill btn-primary"
                    style={{ fontSize: '11px', padding: '4px 10px' }}
                    onClick={() => setCalViewMode('day')}
                  >
                    Manage Day ➔
                  </button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-secondary)' }}>
                    Scheduled Tasks ({ (selectedCalDay === 12 ? tasks : otherDayTasks[selectedCalDay] || []).length })
                  </span>

                  {(selectedCalDay === 12 ? tasks : otherDayTasks[selectedCalDay] || []).map((t) => (
                    <div
                      key={t.id}
                      className="cal-task-row"
                      style={{ padding: '10px 12px', cursor: 'pointer' }}
                      onClick={() => handleToggleCalTask(selectedCalDay, t.id)}
                    >
                      <button
                        type="button"
                        className={`cal-checkbox ${t.completed ? 'checked' : ''}`}
                        onClick={(e) => {
                          e.stopPropagation()
                          handleToggleCalTask(selectedCalDay, t.id)
                        }}
                      >
                        {t.completed ? '✓' : ''}
                      </button>
                      <div className="cal-task-info">
                        <div className="cal-task-name" style={{ fontSize: '13px' }}>{t.title}</div>
                        <div className="cal-task-sub" style={{ fontSize: '11px' }}>
                          <span>{t.subject}</span>
                          <span>•</span>
                          <span>{t.timeSlot}</span>
                        </div>
                      </div>
                    </div>
                  ))}

                  {(selectedCalDay === 12 ? tasks : otherDayTasks[selectedCalDay] || []).length === 0 && (
                    <div className="cal-empty-state" style={{ padding: '24px 12px' }}>
                      No tasks scheduled for Sep {selectedCalDay}.
                    </div>
                  )}
                </div>

                <div style={{ marginTop: 'auto', paddingTop: '16px', borderTop: '1px solid var(--border-subtle)' }}>
                  <button
                    type="button"
                    className="btn-pill btn-primary"
                    style={{ width: '100%', justifyContent: 'center', padding: '9px 16px' }}
                    onClick={() => setCalViewMode('day')}
                  >
                    <span>📋 Open Full Day Workspace &amp; Add Tasks</span>
                  </button>
                </div>
              </div>
            </div>
          ) : (
            /* Day Layout: 2 Columns - Task List + Add Task & Metrics Panel */
            <div className="cal-day-layout">
              <div className="cal-day-main-panel">
                {/* Day Navigation Header */}
                <div className="cal-day-nav">
                  <button
                    type="button"
                    className="btn-pill"
                    style={{ padding: '6px 14px', fontSize: '12px' }}
                    onClick={() => setSelectedCalDay((prev) => Math.max(1, prev - 1))}
                  >
                    ◀ Previous Day
                  </button>

                  <div className="cal-day-heading">
                    <span className="cal-day-title">September {selectedCalDay}, 2026</span>
                    {selectedCalDay === 12 && <span className="cal-badge-today">Today</span>}
                    {selectedCalDay !== 12 && (
                      <button
                        type="button"
                        className="btn-pill"
                        style={{ fontSize: '11px', padding: '3px 9px' }}
                        onClick={() => setSelectedCalDay(12)}
                      >
                        Jump to Today
                      </button>
                    )}
                  </div>

                  <button
                    type="button"
                    className="btn-pill"
                    style={{ padding: '6px 14px', fontSize: '12px' }}
                    onClick={() => setSelectedCalDay((prev) => Math.min(30, prev + 1))}
                  >
                    Next Day ▶
                  </button>
                </div>

                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    fontSize: '13px',
                    color: 'var(--text-secondary)',
                    fontWeight: 600,
                  }}
                >
                  <span>
                    Tasks for September {selectedCalDay} (
                    {(selectedCalDay === 12 ? tasks : otherDayTasks[selectedCalDay] || []).filter((t) => t.completed)
                      .length}
                    /
                    {(selectedCalDay === 12 ? tasks : otherDayTasks[selectedCalDay] || []).length} completed)
                  </span>
                  <span style={{ fontSize: '12px', color: '#80cbc4' }}>
                    Click checkbox or row to checkout ✓
                  </span>
                </div>

                {/* Interactive Task List */}
                <div className="cal-task-list">
                  {(selectedCalDay === 12 ? tasks : otherDayTasks[selectedCalDay] || []).length === 0 ? (
                    <div className="cal-empty-state">
                      🏖️ No study tasks scheduled for September {selectedCalDay}. Add a new task using the panel on the right!
                    </div>
                  ) : (
                    (selectedCalDay === 12 ? tasks : otherDayTasks[selectedCalDay] || []).map((t) => (
                      <div
                        key={t.id}
                        className={`cal-task-row ${t.completed ? 'completed' : ''}`}
                        onClick={() => handleToggleCalTask(selectedCalDay, t.id)}
                      >
                        <button
                          type="button"
                          className={`cal-checkbox ${t.completed ? 'checked' : ''}`}
                          onClick={(e) => {
                            e.stopPropagation()
                            handleToggleCalTask(selectedCalDay, t.id)
                          }}
                          title={t.completed ? 'Mark upcoming' : 'Checkout task (Mark Done)'}
                        >
                          {t.completed ? '✓' : ''}
                        </button>

                        <div className="cal-task-info">
                          <div className="cal-task-name">{t.title}</div>
                          <div className="cal-task-sub">
                            <span className={`task-tag ${t.tagClass}`} style={{ fontSize: '10.5px', padding: '2px 8px' }}>
                              {t.subject}
                            </span>
                            <span>⏰ {t.timeSlot}</span>
                          </div>
                        </div>

                        <div className="cal-task-actions">
                          <span
                            className={`badge ${t.completed ? 'badge-done' : 'badge-upcoming'}`}
                            style={{ fontSize: '11px', padding: '4px 10px' }}
                          >
                            {t.completed ? 'Completed ✓' : 'Upcoming'}
                          </span>
                          <button
                            type="button"
                            className="cal-btn-delete"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleDeleteCalTask(selectedCalDay, t.id)
                            }}
                            title="Delete task"
                          >
                            ✕
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Side Panel in Day View: Add Task Form & Day Stats */}
              <div className="cal-day-side-panel">
                <form className="cal-add-form" onSubmit={handleAddCalendarTask}>
                  <div className="cal-add-title">
                    <span>➕</span>
                    <span>Add Task to Sep {selectedCalDay}</span>
                  </div>
                  <div className="cal-add-row">
                    <input
                      type="text"
                      className="chat-input-field"
                      placeholder="Task title (e.g. Physics Quantum Mechanics recap)..."
                      value={newCalTaskTitle}
                      onChange={(e) => setNewCalTaskTitle(e.target.value)}
                    />
                  </div>
                  <div className="cal-add-row controls">
                    <select
                      className="cal-select"
                      value={newCalTaskSubject}
                      onChange={(e) => setNewCalTaskSubject(e.target.value as any)}
                    >
                      <option value="Maths">📐 Maths</option>
                      <option value="Chemistry">🧪 Chemistry</option>
                      <option value="Python">🐍 Python</option>
                      <option value="AI Systems">🤖 AI Systems</option>
                    </select>

                    <input
                      type="text"
                      className="cal-time-input"
                      placeholder="Time slot (e.g. 5:00–6:00 PM)"
                      value={newCalTaskTime}
                      onChange={(e) => setNewCalTaskTime(e.target.value)}
                    />
                  </div>

                  <button
                    type="submit"
                    className="btn-pill btn-primary"
                    style={{ width: '100%', justifyContent: 'center', padding: '10px 18px', marginTop: '6px' }}
                  >
                    + Add to Day Schedule
                  </button>
                </form>

                <div style={{ background: 'var(--bg-surface-elevated)', borderRadius: '14px', border: '1.5px solid var(--border-subtle)', padding: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <div style={{ fontSize: '13px', fontWeight: 800, color: 'var(--text-primary)' }}>
                    💡 Study Tips for Sep {selectedCalDay}
                  </div>
                  <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                    {selectedCalDay === 12
                      ? 'Today has peak cognitive retention slots between 2:00 PM and 6:30 PM. Complete high-difficulty problem sets before 7 PM.'
                      : selectedCalDay === 15 || selectedCalDay === 28
                      ? 'Exam Milestone Day! Prioritize formula sheets, flashcard recall, and light review rather than learning heavy new concepts.'
                      : 'Distribute study sessions with 25-minute Pomodoro bursts and active recall questions to retain maximum concepts.'}
                  </p>
                </div>

                <div style={{ display: 'flex', gap: '10px' }}>
                  <button
                    type="button"
                    className="btn-pill"
                    style={{ flex: 1, justifyContent: 'center' }}
                    onClick={() => setCalViewMode('month')}
                  >
                    📅 View Full Month
                  </button>
                  <button
                    type="button"
                    className="btn-pill"
                    style={{ flex: 1, justifyContent: 'center' }}
                    onClick={() => setCalendarModalOpen(false)}
                  >
                    Exit Calendar
                  </button>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Interactive Toast */}
      <div className={`toast ${toast.visible ? 'active' : ''}`}>
        <span>
          {toast.icon === 'bell' || toast.icon === '🔔' ? (
            <BellIcon size={15} color="#ffffff" />
          ) : toast.icon === 'bell-off' || toast.icon === '🔕' ? (
            <BellOffIcon size={15} color="#ffffff" />
          ) : (
            toast.icon
          )}
        </span>
        <span>{toast.message}</span>
      </div>
    </div>
  )
}
