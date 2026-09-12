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
// QUIZ QUESTION DATA FOR DKT ENGINE
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
    title: 'Python Loop & List Comprehension Diagnostic',
    questionHtml: `What is the evaluated result of the following Python expression?<br><pre style="background:var(--bg-canvas); padding:10px; border-radius:7px; margin-top:8px; font-family:var(--font-mono); font-size:12px; border:1px solid var(--border-subtle);">[x * 2 for x in range(4) if x % 2 == 1]</pre>`,
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
    title: 'Quadratic Equation Mastery Check',
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
    title: 'Organic Chemistry Reaction Drill',
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
      completed: false,
      alarmActive: true,
      status: 'Upcoming',
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

  // Dynamic Empty Blocks
  const [emptyBlocks, setEmptyBlocks] = useState({
    'empty-1': { filled: false, title: '', time: '10:30–11:00 AM', label: '10:30–11:00 AM (30 min recovery buffer)' },
    'empty-3': { filled: false, title: '', time: '2:15–3:00 PM', label: '2:15–3:00 PM (45 min open buffer)' },
  })

  // Remediation State
  const [isRemediationScheduled, setIsRemediationScheduled] = useState<boolean>(false)
  const [quizScoreText, setQuizScoreText] = useState<string>('Score: 35% · Critical Gap Detected')
  const [quizCardBorderColor, setQuizCardBorderColor] = useState<string>('')
  const [pythonCritScheduled, setPythonCritScheduled] = useState<boolean>(false)
  const [mathMidtermScheduled, setMathMidtermScheduled] = useState<boolean>(false)

  // Knowledge Tracing (DKT) Scores
  const [dktScores, setDktScores] = useState({
    math: { pct: 84, retention: 'Safe (12d decay)', safe: true },
    chem: { pct: 65, retention: 'Moderate (4d decay)', safe: true },
    python: { pct: 35, retention: 'Critical Decay (<24h)', safe: false },
  })

  // Chat & Stream
  const [chatList, setChatList] = useState<ChatEntry[]>([
    {
      id: 'init-1',
      type: 'msg',
      sender: 'bot',
      text: `Hi Laksh! I continuously introspect your quiz scores and study pace. <br><br>I identified a critical knowledge drop in <strong>Python Nested Loops & Comprehensions (35%)</strong>. I've found an optimal 90-minute gap in your calendar between 12:00 PM and 1:30 PM. Would you like me to schedule your remediation session?`,
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
            showToast('Pomodoro session completed! Great job!', '🎉')
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
    showToast(`Alarm dismissed for ${activeAlarmTitle}`, '🔕')
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
            showToast(`Alarm enabled for ${title}`, '🔔')
            soundSynth.playHarmonicChime()
          } else {
            showToast(`Alarm muted for ${title}`, '🔕')
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
            showToast('Session completed! Points added to knowledge graph.', '🎉')
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

  // Auto Schedule Critical Remediation into empty block 2
  const triggerAutoSchedule = (taskTitle = 'Python Loop Remediation') => {
    if (isRemediationScheduled) {
      showToast('Remediation session already scheduled!', 'ℹ️')
      return
    }

    addToolExecutionTrace('get_free_calendar_slots', { min_duration_minutes: 45 })

    setTimeout(() => {
      addToolExecutionTrace('solve_optimal_slot', {
        selected_gap: '12:00–1:30 PM',
        allocated_study: '12:00–1:00 PM (60m)',
        buffer_remaining: '1:00–1:30 PM (30m Lunch)',
      })

      setTimeout(() => {
        setIsRemediationScheduled(true)
        setPythonCritScheduled(true)
        setQuizScoreText('Score: 35% · Remediation Active')
        setQuizCardBorderColor('var(--color-math)')

        // Update DKT score
        setDktScores((prev) => ({
          ...prev,
          python: {
            pct: 48,
            retention: '+13% projected with remediation',
            safe: false,
          },
        }))

        soundSynth.playHarmonicChime()
        showToast('Slotted 60-min remediation into empty block with 30-min lunch!', '⚡')

        addChatMessage(
          `I completed calendar resolution:<br>• Slotted <strong>${taskTitle}</strong> into your 12:00–1:00 PM empty window.<br>• Preserved a 30-minute lunch buffer before your 1:30 PM lab.<br>• Enabled study alarm chime for 12:00 PM sharp.`,
          'bot'
        )
      }, 600)
    }, 500)
  }

  // Manual slot fill
  const fillSlotManual = (title: string, time: string, blockId: 'empty-1' | 'empty-3') => {
    setEmptyBlocks((prev) => ({
      ...prev,
      [blockId]: {
        ...prev[blockId],
        filled: true,
        title,
      },
    }))
    if (title.includes('Math Midterm')) {
      setMathMidtermScheduled(true)
    }
    showToast(`Slotted '${title}' into calendar gap`, '📅')
    soundSynth.playHarmonicChime()
    addChatMessage(`Added **${title}** into your open calendar block at **${time}** with study alarm active.`, 'bot')
  }

  // Quiz Drill Launcher
  const launchQuiz = (subjectKey: 'python' | 'math' | 'chem') => {
    setCurrentQuizKey(subjectKey)
    setSelectedQuizOpt(null)
    setQuizFeedback(null)
    setQuizModalOpen(true)
  }

  const selectQuizOption = (optIndex: number) => {
    if (selectedQuizOpt !== null) return // already answered
    setSelectedQuizOpt(optIndex)

    const q = QUIZ_DATA[currentQuizKey]
    const isCorrect = q.options[optIndex].correct

    if (isCorrect) {
      soundSynth.playSuccessBeep()
      setQuizFeedback({
        isCorrect: true,
        text: `✓ Correct! ${q.explanation}`,
      })
      if (currentQuizKey === 'python') {
        setDktScores((prev) => ({
          ...prev,
          python: { pct: 62, retention: 'Stabilized (Quiz Passed)', safe: true },
        }))
        setQuizScoreText('Score: 62% · Passed')
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
      showToast('Knowledge score updated in knowledge graph!', '📈')
    } else {
      setQuizFeedback({
        isCorrect: false,
        text: `✕ Incorrect. ${q.explanation}`,
      })
    }
  }

  // Quick action buttons
  const triggerQuickAction = (actionText: string) => {
    addChatMessage(actionText, 'user')

    setTimeout(() => {
      if (actionText.includes('remediation plan') || actionText.includes('Auto-Schedule')) {
        triggerAutoSchedule('Python Loop Remediation')
      } else if (actionText.includes('Remediation Quiz')) {
        launchQuiz('python')
      } else if (actionText.includes('forgetting curve')) {
        addToolExecutionTrace('ebbinghaus_decay_audit', {
          student_id: 'laksh_01',
          critical_hazards: ['python.loops.nested', 'python.comprehensions'],
        })
        addChatMessage(
          `📉 <strong>Ebbinghaus Forgetting Curve Analysis:</strong><br>• <strong>Python Loops</strong> has dropped to <strong>35% retention</strong> after 48 hours without retrieval practice.<br>• Without targeted revision in the next 12 hours, recall probability drops to &lt;20%.<br>• Taking the 3-minute quiz will reset your half-life to 4 days.`,
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
        addChatMessage("I've triggered a live test of your Study Alarm system with Web Audio chimes!", 'bot')
      } else if (lower.includes('pdf') || lower.includes('export') || lower.includes('share')) {
        exportSharePdf()
        addChatMessage('Opening full-color PDF export dialog now!', 'bot')
      } else if (lower.includes('quiz') || lower.includes('test')) {
        launchQuiz('python')
        addChatMessage('Launched your adaptive Python Diagnostic Quiz.', 'bot')
      } else if (lower.includes('schedule') || lower.includes('remediation') || lower.includes('gap')) {
        triggerAutoSchedule('Python Loop Remediation')
      } else if (lower.includes('theme') || lower.includes('dark') || lower.includes('light')) {
        toggleTheme()
        addChatMessage('Toggled theme mode as requested.', 'bot')
      } else {
        addChatMessage(
          `Got it, Laksh. I've logged your request: "<em>${text}</em>". I am continuously optimizing your knowledge retention graph and schedule buffers.`,
          'bot'
        )
      }
    }, 450)
  }

  const pendingCriticalCount = (pythonCritScheduled ? 0 : 1) + (mathMidtermScheduled ? 0 : 1)

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

          {/* Export / Share PDF with Full Colors */}
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
            <span>🔔</span>
            <span>Test Alarm</span>
          </button>

          {/* Dark/Light Mode Switcher */}
          <button
            type="button"
            className="btn-icon"
            onClick={toggleTheme}
            title="Switch Dark / Light Theme"
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
                    <span className="dropdown-badge">Pro Student • Active</span>
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
          {/* Panel 1: Today's Adaptive Schedule */}
          <div className="panel">
            <div className="panel-header-row">
              <h2 className="panel-title">
                <span>📅</span>
                <span>Today's Adaptive Schedule</span>
              </h2>

              {/* Diagnostic Quiz Result Card */}
              <div
                className="sync-card"
                onClick={() => triggerAutoSchedule('Python Loop Remediation')}
                title="Auto-find empty block and insert targeted remediation"
                style={{ borderColor: quizCardBorderColor || undefined }}
              >
                <div className="sync-badge">
                  <span>⚠️</span>
                  <span>QUIZ</span>
                </div>
                <div className="sync-meta">
                  <div className="sync-score">{quizScoreText}</div>
                  <div className="sync-name">Python Loop Diagnostics</div>
                </div>
                <div className="sync-btn-auto">
                  <span>⚡</span>
                  <span>
                    {isRemediationScheduled ? 'Remediation Slotted (12:00 PM)' : 'Auto-Schedule Remediation'}
                  </span>
                </div>
              </div>
            </div>

            {/* Schedule List with Dynamic Empty Blocks */}
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
                  >
                    🔔
                  </button>
                  <span className="badge badge-upcoming">{tasks[0].status}</span>
                </div>
              </div>

              {/* Empty Block 1 */}
              <div className="empty-block">
                <div className="empty-block-left">
                  <span
                    className="empty-tag"
                    style={
                      emptyBlocks['empty-1'].filled
                        ? { background: 'var(--color-math-subtle)', color: 'var(--color-math)', borderColor: 'var(--color-math)' }
                        : undefined
                    }
                  >
                    {emptyBlocks['empty-1'].filled ? 'Scheduled' : 'Empty Block'}
                  </span>
                  <span>
                    {emptyBlocks['empty-1'].filled
                      ? `${emptyBlocks['empty-1'].title} (${emptyBlocks['empty-1'].time})`
                      : emptyBlocks['empty-1'].label}
                  </span>
                </div>
                {!emptyBlocks['empty-1'].filled ? (
                  <button
                    type="button"
                    className="btn-quick-fill"
                    onClick={() => fillSlotManual('Quick Flashcard Drill', '10:30–11:00 AM', 'empty-1')}
                  >
                    <span>+</span>
                    <span>Fill Slot</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    className="btn-alarm-bell active"
                    onClick={() => showToast('Alarm active for Quick Flashcard Drill', '🔔')}
                  >
                    🔔
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
                  >
                    🔔
                  </button>
                  <span className="badge badge-upcoming">{tasks[1].status}</span>
                </div>
              </div>

              {/* Slotted Remediation Card if scheduled */}
              {isRemediationScheduled && (
                <div className="task-card critical-remediation">
                  <div className="task-card-left">
                    <div
                      className="task-check-circle"
                      onClick={() => showToast('Remediation task toggled', '✓')}
                    >
                      ✓
                    </div>
                    <div className="task-info">
                      <div className="task-title">⚡ Critical Remediation: Python Loop Debugging</div>
                      <div className="task-meta-row">
                        <span className="task-tag task-tag-python">🐍 Python</span>
                        <span>·</span>
                        <span>12:00–1:00 PM (Auto-Slotted in Empty Block)</span>
                      </div>
                    </div>
                  </div>
                  <div className="task-card-right">
                    <button
                      type="button"
                      className="btn-timer"
                      onClick={() => openPomodoroModal('Python Loop Remediation')}
                    >
                      ⏱️ Focus
                    </button>
                    <button
                      type="button"
                      className="btn-alarm-bell active"
                      onClick={() => showToast('Alarm enabled for Python Loop Debugging', '🔔')}
                    >
                      🔔
                    </button>
                    <span className="badge badge-critical">Critical Remediation</span>
                  </div>
                </div>
              )}

              {/* Optimal Empty Block 2 */}
              <div className="empty-block">
                <div className="empty-block-left">
                  <span
                    className="empty-tag"
                    style={{ borderColor: 'var(--accent-primary)', color: 'var(--accent-primary)' }}
                  >
                    {isRemediationScheduled ? 'Remaining Buffer' : 'Optimal Free Window'}
                  </span>
                  <span>
                    {isRemediationScheduled
                      ? '1:00–1:30 PM (30 min Lunch & Relaxation)'
                      : '12:00–1:30 PM (90 min open study window)'}
                  </span>
                </div>
                {!isRemediationScheduled ? (
                  <button
                    type="button"
                    className="btn-quick-fill"
                    onClick={() => triggerAutoSchedule('Python Loop Remediation')}
                  >
                    <span>⚡</span>
                    <span>Fit Critical Remediation</span>
                  </button>
                ) : (
                  <span style={{ fontSize: '11.5px', color: 'var(--text-tertiary)', fontWeight: 600 }}>
                    Buffer Open
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
                    🔔
                  </button>
                  <span className="badge badge-upcoming">{tasks[2].status}</span>
                </div>
              </div>

              {/* Empty Block 3 */}
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
                    {emptyBlocks['empty-3'].filled ? 'Scheduled' : 'Empty Block'}
                  </span>
                  <span>
                    {emptyBlocks['empty-3'].filled
                      ? `${emptyBlocks['empty-3'].title} (${emptyBlocks['empty-3'].time})`
                      : emptyBlocks['empty-3'].label}
                  </span>
                </div>
                {!emptyBlocks['empty-3'].filled ? (
                  <button
                    type="button"
                    className="btn-quick-fill"
                    onClick={() => fillSlotManual('Practice Questions', '2:15–3:00 PM', 'empty-3')}
                  >
                    <span>+</span>
                    <span>Fill Slot</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    className="btn-alarm-bell active"
                    onClick={() => showToast('Alarm active for Practice Questions', '🔔')}
                  >
                    🔔
                  </button>
                )}
              </div>

              {/* Task 4: Completed Maths */}
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
                    🔔
                  </button>
                  <span className="badge badge-done">{tasks[3].status}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Panel 2: Deep Knowledge Tracing & Memory Retention */}
          <div className="panel">
            <div className="panel-header-row">
              <div>
                <h2 className="panel-title">
                  <span>🧠</span>
                  <span>Deep Knowledge Tracing & Memory Retention</span>
                </h2>
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                  Predicting forgetting curves and concept mastery per subject
                </div>
              </div>
              <span
                className={`badge ${isRemediationScheduled ? 'badge-upcoming' : 'badge-critical'}`}
              >
                {isRemediationScheduled ? 'Remediation Active' : '1 High Decay Risk'}
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
                  <span>Retention stability:</span>
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
                  <span>Retention stability:</span>
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
                  border: '2px solid var(--color-python)',
                  background:
                    'linear-gradient(180deg, rgba(244, 63, 94, 0.1) 0%, var(--bg-surface-elevated) 100%)',
                }}
              >
                <div className="concept-header">
                  <span className="concept-name">Python (Loops & Logic)</span>
                  <span className="concept-pct" style={{ color: 'var(--color-python)' }}>
                    {dktScores.python.pct}%
                  </span>
                </div>
                <div className="progress-track">
                  <div className="progress-fill fill-py" style={{ width: `${dktScores.python.pct}%` }} />
                </div>
                <div className="decay-risk-bar">
                  <span>Retention stability:</span>
                  <span className="decay-danger">{dktScores.python.retention}</span>
                </div>
                <button
                  type="button"
                  className="btn-concept-quiz"
                  style={{ borderColor: 'var(--color-python)', color: 'var(--color-python)', fontWeight: 800 }}
                  onClick={() => launchQuiz('python')}
                >
                  <span>⚡</span>
                  <span>Take Remediation Quiz</span>
                </button>
              </div>
            </div>
          </div>

          {/* Panel 3: Alarming Criticals */}
          <div className="criticals-panel">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div
                style={{
                  fontSize: '13.5px',
                  fontWeight: 800,
                  color: 'var(--color-python)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '7px',
                }}
              >
                <span>⚠️</span>
                <span>Alarming Criticals</span>
              </div>
              <span style={{ fontSize: '11.5px', color: 'var(--color-python)', fontWeight: 700 }}>
                {pendingCriticalCount} Actions Pending
              </span>
            </div>

            {/* Critical 1 */}
            <div className="critical-item">
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '9px' }}>
                <span style={{ color: 'var(--color-python)', fontSize: '16px' }}>⚠️</span>
                <div>
                  <strong>URGENT:</strong> Python Loop score (35%) critical. Skill gap will impact upcoming lab!
                </div>
              </div>
              <button
                type="button"
                className={`btn-schedule-critical ${pythonCritScheduled ? 'scheduled' : ''}`}
                onClick={() => triggerAutoSchedule('Python Loop Remediation')}
              >
                <span>{pythonCritScheduled ? '✓' : '⚡'}</span>
                <span>{pythonCritScheduled ? 'Scheduled in 12:00 PM Gap' : 'Auto-Schedule in Gap'}</span>
              </button>
            </div>

            {/* Critical 2 */}
            <div className="critical-item">
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '9px' }}>
                <span style={{ color: 'var(--accent-primary)', fontSize: '16px' }}>📅</span>
                <div>
                  <strong>UPCOMING EXAM:</strong> Math Midterm in 5 days. Quadratic roots review recommended.
                </div>
              </div>
              <button
                type="button"
                className={`btn-schedule-critical ${mathMidtermScheduled ? 'scheduled' : ''}`}
                onClick={() => fillSlotManual('Math Midterm Mock Exam', '2:15–3:00 PM', 'empty-3')}
              >
                <span>{mathMidtermScheduled ? '✓' : '📅'}</span>
                <span>{mathMidtermScheduled ? 'Slotted in 2:15 PM' : 'Slot in 2:15 PM'}</span>
              </button>
            </div>
          </div>
        </section>

        {/* RIGHT: AI AGENT OBSERVABILITY, TOOL STREAM & INTERACTIVE CHAT */}
        <aside className="right-column">
          <div className="agent-header">
            <div className="agent-identity">
              <div className="agent-avatar">AI</div>
              <div>
                <div className="agent-name">StudySync AI Orchestrator</div>
                <div className="agent-status-label">
                  <span>●</span> Introspective Agent Active
                </div>
              </div>
            </div>
            <div style={{ fontSize: '11.5px', color: 'var(--text-tertiary)', fontWeight: 600 }}>
              {userName}'s Model
            </div>
          </div>

          {/* Chat & Agent Trace Stream */}
          <div className="chat-messages">
            {chatList.map((entry) => {
              if (entry.type === 'trace') {
                return (
                  <div key={entry.id} className="tool-call-trace">
                    <div className="tool-header">
                      <span>⚡ agent_tool_call:</span> <strong>{entry.toolName}()</strong>
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

          {/* Agent Quick Action Chips */}
          <div className="quick-actions-bar">
            <button
              type="button"
              className="quick-btn"
              onClick={() => triggerQuickAction('⚡ Auto-Schedule Remediation in Gap')}
            >
              <span>⚡ Auto-Schedule Remediation in Gap</span>
              <span className="arrow">→</span>
            </button>
            <button
              type="button"
              className="quick-btn"
              onClick={() => triggerQuickAction('📝 Take 3-Question Remediation Quiz')}
            >
              <span>📝 Take 3-Question Remediation Quiz</span>
              <span className="arrow">→</span>
            </button>
            <button
              type="button"
              className="quick-btn"
              onClick={() => triggerQuickAction('📉 Explain my forgetting curve decay')}
            >
              <span>📉 Explain my forgetting curve decay</span>
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

          {/* Input Field */}
          <div className="chat-input-row">
            <input
              type="text"
              className="chat-input-field"
              placeholder="Ask AI assistant, e.g., 'test alarm', 'export pdf', 'quiz'..."
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
           MODAL 1: INTERACTIVE DIAGNOSTIC QUIZ
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
                  background: quizFeedback.isCorrect ? 'var(--color-math-subtle)' : 'var(--color-python-subtle)',
                  color: quizFeedback.isCorrect ? 'var(--color-math)' : 'var(--color-python)',
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
                Deep Focus Block · Distractions Silenced
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
              Harmonic completion chime rings when finished
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
            <div
              style={{
                width: '66px',
                height: '66px',
                background: 'var(--grad-primary)',
                color: '#ffffff',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '32px',
                marginBottom: '12px',
                boxShadow: '0 4px 20px rgba(245, 158, 11, 0.4)',
                animation: 'bellBounce 1.2s infinite ease-in-out',
              }}
            >
              🔔
            </div>
            <h3 style={{ fontSize: '20px', fontWeight: 800, marginBottom: '6px' }}>
              🔔 Study Alarm: {activeAlarmTitle}
            </h3>
            <p style={{ fontSize: '13.5px', color: 'var(--text-secondary)', marginBottom: '22px', lineHeight: 1.45 }}>
              Your scheduled session <strong>{activeAlarmTitle}</strong> ({activeAlarmTime}) is starting now. Put away
              distractions and get ready!
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
        <span>{toast.icon}</span>
        <span>{toast.message}</span>
      </div>
    </div>
  )
}
