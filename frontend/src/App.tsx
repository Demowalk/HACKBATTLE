import { useState, useEffect, useRef } from 'react'
import './App.css'

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
    return (localStorage.getItem('studysync-theme') as 'dark' | 'light') || 'dark'
  })

  // User Profile
  const [userName, setUserName] = useState<string>('Laksh HS')
  const [isProfileOpen, setIsProfileOpen] = useState<boolean>(false)
  const [isEditingName, setIsEditingName] = useState<boolean>(false)
  const [editNameValue, setEditNameValue] = useState<string>('Laksh HS')
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

  // Apply Theme
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    localStorage.setItem('studysync-theme', theme)
  }, [theme])

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
            return 25 * 60
          }
          return prev - 1
        })
      }, 1000)
    }
    return () => {
      if (interval) clearInterval(interval)
    }
  }, [pomoRunning])

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
          <div className="brand-logo">⚡</div>
          <div>
            <div className="brand-title">StudySync Pro</div>
            <div className="brand-sub">Autonomous Adaptive Study & Self-Learning Engine</div>
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

          {/* Export / Share PDF */}
          <button
            type="button"
            className="btn-pill btn-primary"
            onClick={exportSharePdf}
            title="Download & Share full-color PDF snapshot"
          >
            <span>📤</span>
            <span>Share / Export PDF</span>
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
                <span className="profile-user-role">Student</span>
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
                    <span className="dropdown-badge">Student • Grade 12</span>
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
                            setUserName(editNameValue.trim())
                            setIsEditingName(false)
                            showToast(`Display name updated to ${editNameValue.trim()}`)
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
                <span className="streak-pill">🔥 5-Day Streak!</span>
                <span className="daily-progress-text">
                  {completedCount} of {totalCount} study blocks completed ({progressPct}%)
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
          <div className="panel">
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
                  borderTop: '3px solid #ffffff',
                }}
              >
                <div className="concept-header">
                  <span className="concept-name">Python (Loops &amp; Logic)</span>
                  <span className="concept-pct" style={{ color: '#ffffff' }}>
                    {dktScores.python.pct}%
                  </span>
                </div>
                <div className="progress-track">
                  <div className="progress-fill fill-py" style={{ width: `${dktScores.python.pct}%` }} />
                </div>
                <div className="decay-risk-bar">
                  <span>Retention:</span>
                  <span className="decay-danger" style={{ color: '#ffffff' }}>
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
              <span style={{ fontSize: '11.5px', color: '#ffffff', fontWeight: 700 }}>
                {pendingBoostersCount} Recommendations Available
              </span>
            </div>

            {/* Booster 1 */}
            <div className="critical-item">
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '9px' }}>
                <span style={{ color: '#ffffff', fontSize: '16px' }}>💡</span>
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
              <div className="agent-avatar">✨</div>
              <div>
                <div className="agent-name">StudySync Copilot</div>
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
      <div className={`modal-backdrop ${quizModalOpen ? 'active' : ''}`}>
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
                  background: quizFeedback.isCorrect ? 'var(--color-math-subtle)' : 'rgba(255, 255, 255, 0.1)',
                  color: quizFeedback.isCorrect ? 'var(--color-math)' : '#ffffff',
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
      <div className={`modal-backdrop ${pomoModalOpen ? 'active' : ''}`}>
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
      <div className={`modal-backdrop ${alarmModalOpen ? 'active' : ''}`}>
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
                background: 'rgba(255, 255, 255, 0.12)',
                border: '1.5px solid rgba(255, 255, 255, 0.25)',
                color: '#ffffff',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '12px',
                boxShadow: '0 4px 20px rgba(255, 255, 255, 0.15)',
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
