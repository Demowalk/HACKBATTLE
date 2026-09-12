import { useState, useEffect, useRef } from 'react'
import './App.css'
import {
  fetchUserProfile,
  updateUserProfile,
  getStoredUserName,
  setStoredUserName,
  updateTaskCompletion,
  fetchChatHistory,
  sendChatMessage,
  recordStudySession,
  fetchGeneratedQuiz,
  submitQuizAnswers,
  createBackendTask,
  deleteBackendTask,
  downloadCalendarIcs,
  type QuizQuestionItem,
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
const FALLBACK_QUIZ_BANK: Record<string, QuizQuestionItem[]> = {
  python: [
    // Easy
    {
      id: 101,
      subject: 'Python',
      topic: 'Booleans',
      difficulty: 'easy',
      question: `In Python, what is the boolean evaluation of <code>bool([])</code> and <code>bool([0])</code>?`,
      options: ['False and False', 'False and True', 'True and False', 'True and True'],
      correct_answer: 'False and True',
      explanation: 'Empty collections evaluate to False, while any non-empty list—even containing 0—evaluates to True.',
    },
    {
      id: 102,
      subject: 'Python',
      topic: 'Slicing',
      difficulty: 'easy',
      question: `What is the output of slicing string <code>s = 'REVISO'[::-1]</code>?`,
      options: ["'OSIVER'", "'REVISO'", "'OSIVER' in lowercase", "'R'"],
      correct_answer: "'OSIVER'",
      explanation: 'Using a step of -1 traverses and reverses the sequence from the last element to the first.',
    },
    {
      id: 103,
      subject: 'Python',
      topic: 'Dictionaries',
      difficulty: 'easy',
      question: `What does <code>dict.get('missing_key', 'fallback')</code> return if <code>'missing_key'</code> is absent?`,
      options: ['KeyError', 'None', "'fallback'", 'False'],
      correct_answer: "'fallback'",
      explanation: 'The .get() method returns the specified fallback argument instead of raising an unhandled KeyError.',
    },
    // Medium
    {
      id: 104,
      subject: 'Python',
      topic: 'List Comprehensions',
      difficulty: 'medium',
      question: `What is the evaluated result of the following Python expression?<br><pre style="background:var(--bg-canvas); padding:10px; border-radius:8px; margin-top:8px; font-family:var(--font-mono); font-size:12px; border:1px solid var(--border-subtle);">[x * 2 for x in range(4) if x % 2 == 1]</pre>`,
      options: ['[0, 2, 4, 6]', '[2, 6]', '[1, 3]', '[4, 8]'],
      correct_answer: '[2, 6]',
      explanation: 'range(4) produces [0, 1, 2, 3]. The condition `if x % 2 == 1` filters odd numbers: 1 and 3. Then `x * 2` yields [2, 6].',
    },
    {
      id: 105,
      subject: 'Python',
      topic: 'Object Identity',
      difficulty: 'medium',
      question: `What is the key difference between <code>==</code> and <code>is</code> in Python?`,
      options: [
        '`==` compares values for equality, while `is` compares object identity in memory',
        '`==` checks memory addresses, while `is` checks value equivalence',
        '`is` is only for numerical primitives, `==` is for strings and lists',
        'There is no difference; they are exact aliases'
      ],
      correct_answer: '`==` compares values for equality, while `is` compares object identity in memory',
      explanation: '`==` checks value equality, while `is` checks whether two variables refer to the exact same memory address (`id(a) == id(b)`).',
    },
    // Hard
    {
      id: 106,
      subject: 'Python',
      topic: 'Functions & Arguments',
      difficulty: 'hard',
      question: `What happens when using a mutable default argument like <code>def append_val(val, target=[])</code>?`,
      options: [
        'A new empty list is created on every call',
        'The same list instance is shared across all function calls',
        'Python throws a SyntaxError on function definition',
        'The list automatically resets after each function return'
      ],
      correct_answer: 'The same list instance is shared across all function calls',
      explanation: 'Default arguments are evaluated once at module/function definition time, persisting mutable state across calls.',
    },
    {
      id: 107,
      subject: 'Python',
      topic: 'Generators',
      difficulty: 'hard',
      question: `Which syntax creates a lazy generator expression in memory rather than a full list?`,
      options: [
        '[x**2 for x in range(100)]',
        '(x**2 for x in range(100))',
        '{x**2 for x in range(100)}',
        '{x: x**2 for x in range(100)}'
      ],
      correct_answer: '(x**2 for x in range(100))',
      explanation: 'Parentheses around a comprehension create a generator expression that yields items on demand with minimal memory overhead.',
    },
  ],
  math: [
    // Easy
    {
      id: 201,
      subject: 'Maths',
      topic: 'Quadratic Equations',
      difficulty: 'easy',
      question: `What are the roots of the quadratic equation: <br><strong style="font-size:16px; display:block; margin-top:6px;">2x² - 7x + 3 = 0</strong>`,
      options: ['x = 3 and x = 1/2', 'x = -3 and x = -1/2', 'x = 2 and x = 3', 'x = 7 and x = 3'],
      correct_answer: 'x = 3 and x = 1/2',
      explanation: 'Factoring: (2x - 1)(x - 3) = 0, which yields roots x = 1/2 and x = 3.',
    },
    {
      id: 202,
      subject: 'Maths',
      topic: 'Linear Equations',
      difficulty: 'easy',
      question: `What is the slope of the linear equation <code>y = 4x - 9</code>?`,
      options: ['4', '-9', '9/4', '-4'],
      correct_answer: '4',
      explanation: 'In slope-intercept form y = mx + b, slope m is the coefficient of x, which is 4.',
    },
    {
      id: 203,
      subject: 'Maths',
      topic: 'Probability',
      difficulty: 'easy',
      question: `When rolling two fair six-sided dice, what is the probability of the sum being 7?`,
      options: ['1/6', '1/12', '7/36', '5/36'],
      correct_answer: '1/6',
      explanation: 'There are 6 combinations summing to 7 out of 36 possible outcomes: 6/36 = 1/6.',
    },
    // Medium
    {
      id: 204,
      subject: 'Maths',
      topic: 'Calculus & Derivatives',
      difficulty: 'medium',
      question: `What is the derivative of <code>f(x) = x³ · e^x</code>?`,
      options: [
        '3x² · e^x',
        'x³ · e^x',
        'e^x · (x³ + 3x²)',
        '3x² · e^(x-1)'
      ],
      correct_answer: 'e^x · (x³ + 3x²)',
      explanation: 'Product rule: (u·v)\' = u\'v + uv\' = (3x²)(e^x) + (x³)(e^x) = e^x(x³ + 3x²).',
    },
    {
      id: 205,
      subject: 'Maths',
      topic: 'Definite Integrals',
      difficulty: 'medium',
      question: `Evaluate the definite integral: <br><strong style="font-size:16px; display:block; margin-top:6px;">∫₀² (3x² - 2x + 1) dx</strong>`,
      options: ['6', '8', '4', '10'],
      correct_answer: '6',
      explanation: 'Antiderivative F(x) = x³ - x² + x. F(2) = 8 - 4 + 2 = 6. F(0) = 0. Difference is 6.',
    },
    // Hard
    {
      id: 206,
      subject: 'Maths',
      topic: 'Logarithms & Algebra',
      difficulty: 'hard',
      question: `Solve for x in: <br><strong style="font-size:16px; display:block; margin-top:6px;">log₂(x) + log₂(x - 2) = 3</strong>`,
      options: ['x = 4', 'x = -2', 'x = 4 and x = -2', 'x = 8'],
      correct_answer: 'x = 4',
      explanation: 'log₂(x(x - 2)) = 3 → x² - 2x = 8 → (x - 4)(x + 2) = 0. Since log requires positive argument, x = 4.',
    },
    {
      id: 207,
      subject: 'Maths',
      topic: 'Linear Algebra',
      difficulty: 'hard',
      question: `What are the eigenvalues of matrix <br><pre style="background:var(--bg-canvas); padding:6px; border-radius:6px; font-family:var(--font-mono); border:1px solid var(--border-subtle);">[ 2  1 ]\n[ 1  2 ]</pre>`,
      options: ['λ = 3 and λ = 1', 'λ = 2 and λ = 2', 'λ = 4 and λ = 0', 'λ = 1 and λ = -1'],
      correct_answer: 'λ = 3 and λ = 1',
      explanation: 'det(A - λI) = (2 - λ)² - 1 = λ² - 4λ + 3 = 0 → (λ - 3)(λ - 1) = 0. Roots are λ = 3 and λ = 1.',
    },
  ],
  chem: [
    // Easy
    {
      id: 301,
      subject: 'Chemistry',
      topic: 'Oxidation States',
      difficulty: 'easy',
      question: `What is the oxidation state of Chromium (Cr) in the dichromate ion (Cr₂O₇²⁻)?`,
      options: ['+6', '+3', '+7', '+4'],
      correct_answer: '+6',
      explanation: '7 oxygens contribute -14. With overall charge -2: 2(Cr) - 14 = -2 → 2(Cr) = +12 → Cr = +6.',
    },
    {
      id: 302,
      subject: 'Chemistry',
      topic: 'Acid-Base Equilibria',
      difficulty: 'easy',
      question: `What is the pH of a 0.001 M HCl aqueous solution at 25°C?`,
      options: ['3.0', '1.0', '4.0', '11.0'],
      correct_answer: '3.0',
      explanation: 'HCl completely dissociates: [H+] = 10⁻³ M. pH = -log₁₀(10⁻³) = 3.0.',
    },
    {
      id: 303,
      subject: 'Chemistry',
      topic: 'Intermolecular Forces',
      difficulty: 'easy',
      question: `Which dominant intermolecular force accounts for water's unusually high boiling point compared to H₂S?`,
      options: ['Hydrogen bonding', 'London dispersion forces', 'Ion-dipole forces', 'Covalent network bonding'],
      correct_answer: 'Hydrogen bonding',
      explanation: 'Strong hydrogen bonding between electronegative oxygen and hydrogen requires significant energy to break.',
    },
    // Medium
    {
      id: 304,
      subject: 'Chemistry',
      topic: 'Organic Reaction Mechanisms',
      difficulty: 'medium',
      question: `Which mechanism describes the addition of HBr to an asymmetrical alkene following Markovnikov's rule?`,
      options: [
        'Electrophilic Addition via carbocation intermediate',
        'Nucleophilic Substitution (SN2)',
        'Free Radical Halogenation',
        'Elimination (E1)'
      ],
      correct_answer: 'Electrophilic Addition via carbocation intermediate',
      explanation: 'Electrophiles (H+) attack the alkene π-bond to form the more stable carbocation, followed by halide attack.',
    },
    {
      id: 305,
      subject: 'Chemistry',
      topic: 'Chemical Equilibrium',
      difficulty: 'medium',
      question: `According to Le Chatelier's principle, what happens to <code>N₂(g) + 3H₂(g) ⇌ 2NH₃(g)</code> when pressure is increased?`,
      options: [
        'Shifts toward products (fewer moles of gas)',
        'Shifts toward reactants (more moles of gas)',
        'No shift in equilibrium position',
        'Equilibrium constant K increases'
      ],
      correct_answer: 'Shifts toward products (fewer moles of gas)',
      explanation: 'Reactants comprise 4 moles of gas while products comprise 2. Higher pressure shifts toward fewer gas molecules.',
    },
    // Hard
    {
      id: 306,
      subject: 'Chemistry',
      topic: 'Stereochemistry',
      difficulty: 'hard',
      question: `What stereochemical outcome occurs at an sp³ chiral center undergoing an bimolecular nucleophilic substitution (SN2) reaction?`,
      options: [
        'Complete Walden inversion of configuration',
        'Complete retention of configuration',
        'Racemization yielding a 50:50 mixture',
        'Formation of a meso compound'
      ],
      correct_answer: 'Complete Walden inversion of configuration',
      explanation: 'Backside attack by the incoming nucleophile inverts the chiral geometry (Walden inversion).',
    },
  ],
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
  const [userTargetExam, setUserTargetExam] = useState<string>('JEE / Advanced STEM')
  const [userDailyGoal, setUserDailyGoal] = useState<number>(120)
  const [isProfileOpen, setIsProfileOpen] = useState<boolean>(false)
  const [isEditingName, setIsEditingName] = useState<boolean>(false)
  const [editNameValue, setEditNameValue] = useState<string>(() => getStoredUserName())
  const [editGrade, setEditGrade] = useState<string>('Grade 12 • Engineering Prep')
  const [editTargetExam, setEditTargetExam] = useState<string>('JEE / Advanced STEM')
  const [editDailyGoal, setEditDailyGoal] = useState<number>(120)
  const profileRef = useRef<HTMLDivElement>(null)

  type TimelineTask = {
    id: string
    title: string
    subject: string
    tagClass: string
    tagIcon: string
    timeSlot: string
    completed: boolean
    alarmActive: boolean
    status: string
  }

  type CalTaskItem = {
    id: string
    title: string
    subject: string
    tagClass: string
    timeSlot: string
    completed: boolean
    priority?: string
    duration_minutes?: number
  }

  // Full-Page Study Calendar State
  const [calendarModalOpen, setCalendarModalOpen] = useState<boolean>(false)
  const [calViewMode, setCalViewMode] = useState<'month' | 'week' | 'day'>('month')
  const [calYear, setCalYear] = useState<number>(2026)
  const [calMonth, setCalMonth] = useState<number>(8) // September = 8 (0-indexed)
  const [selectedCalDay, setSelectedCalDay] = useState<number>(12)
  const [calSubjectFilter, setCalSubjectFilter] = useState<'all' | 'Maths' | 'Chemistry' | 'Python' | 'AI Systems' | 'exams'>('all')
  const [calendarSyncActive, setCalendarSyncActive] = useState<boolean>(false)

  // New Calendar Task Form State
  const [newCalTaskTitle, setNewCalTaskTitle] = useState<string>('')
  const [newCalTaskTime, setNewCalTaskTime] = useState<string>('5:00–6:00 PM')
  const [newCalTaskSubject, setNewCalTaskSubject] = useState<'Maths' | 'Chemistry' | 'Python' | 'AI Systems'>('Maths')
  const [newCalTaskDuration, setNewCalTaskDuration] = useState<number>(45)
  const [newCalTaskPriority, setNewCalTaskPriority] = useState<'high' | 'medium' | 'low'>('medium')

  const [calTasksByDate, setCalTasksByDate] = useState<Record<string, CalTaskItem[]>>({
    '2026-09-11': [
      { id: 'd11-1', title: 'Calculus derivatives recap', subject: 'Maths', tagClass: 'task-tag-math', timeSlot: '10:00–11:00 AM', completed: true, duration_minutes: 60, priority: 'medium' },
      { id: 'd11-2', title: 'Python recursion functions lab', subject: 'Python', tagClass: 'task-tag-python', timeSlot: '2:00–3:00 PM', completed: true, duration_minutes: 60, priority: 'low' },
    ],
    '2026-09-13': [
      { id: 'd13-1', title: 'Linear algebra vector spaces', subject: 'Maths', tagClass: 'task-tag-math', timeSlot: '10:00–11:30 AM', completed: false, duration_minutes: 90, priority: 'high' },
      { id: 'd13-2', title: 'AI Transformer Attention Mechanisms', subject: 'AI Systems', tagClass: 'task-tag-ai', timeSlot: '3:00–4:15 PM', completed: false, duration_minutes: 75, priority: 'high' },
    ],
    '2026-09-14': [
      { id: 'd14-1', title: 'Organic Chemistry reaction mechanisms review', subject: 'Chemistry', tagClass: 'task-tag-chem', timeSlot: '9:30–11:00 AM', completed: false, duration_minutes: 90, priority: 'high' },
      { id: 'd14-2', title: 'Python hash maps & time complexity drill', subject: 'Python', tagClass: 'task-tag-python', timeSlot: '1:30–2:45 PM', completed: false, duration_minutes: 75, priority: 'medium' },
    ],
    '2026-09-15': [
      { id: 'd15-1', title: 'Linear Algebra Semester Exam (Hall A)', subject: 'Maths', tagClass: 'task-tag-math', timeSlot: '9:00 AM–12:00 PM', completed: false, duration_minutes: 180, priority: 'high' },
      { id: 'd15-2', title: 'Post-exam recovery & light Python recap', subject: 'Python', tagClass: 'task-tag-python', timeSlot: '3:30–4:15 PM', completed: false, duration_minutes: 45, priority: 'low' },
    ],
    '2026-09-18': [
      { id: 'd18-1', title: 'Electrochemical Cells & Nernst Equation', subject: 'Chemistry', tagClass: 'task-tag-chem', timeSlot: '11:00 AM–12:30 PM', completed: false, duration_minutes: 90, priority: 'medium' },
      { id: 'd18-2', title: 'Graph Algorithms & BFS/DFS in Python', subject: 'Python', tagClass: 'task-tag-python', timeSlot: '4:00–5:30 PM', completed: false, duration_minutes: 90, priority: 'medium' },
    ],
    '2026-09-22': [
      { id: 'd22-1', title: 'Deep Knowledge Tracing & LSTM Architectures', subject: 'AI Systems', tagClass: 'task-tag-ai', timeSlot: '2:00–3:30 PM', completed: false, duration_minutes: 90, priority: 'high' },
    ],
    '2026-09-28': [
      { id: 'd28-1', title: 'Organic Chemistry Midterm (Hall B)', subject: 'Chemistry', tagClass: 'task-tag-chem', timeSlot: '10:00 AM–12:00 PM', completed: false, duration_minutes: 120, priority: 'high' },
    ],
  })

  const MONTH_NAMES = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ]
  const WEEKDAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

  const formatCalDateKey = (year: number, month: number, day: number) => {
    return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
  }

  const getTasksForDate = (year: number, month: number, day: number): CalTaskItem[] => {
    const dateKey = formatCalDateKey(year, month, day)
    const stored = calTasksByDate[dateKey] || []
    if (year === 2026 && month === 8 && day === 12) {
      const primary: CalTaskItem[] = tasks.map((t) => ({
        id: t.id,
        title: t.title,
        subject: (t.subject as any) || 'Maths',
        tagClass: t.tagClass,
        timeSlot: t.timeSlot,
        completed: t.completed,
        priority: (t as any).priority || 'medium',
        duration_minutes: (t as any).duration_minutes || 45,
      }))
      const ids = new Set(primary.map((p) => p.id))
      return [...primary, ...stored.filter((s) => !ids.has(s.id))]
    }
    return stored
  }

  const daysInCalMonth = new Date(calYear, calMonth + 1, 0).getDate()
  const startDayOfWeek = new Date(calYear, calMonth, 1).getDay()

  const handlePrevMonth = () => {
    if (calMonth === 0) {
      setCalMonth(11)
      setCalYear((y) => y - 1)
    } else {
      setCalMonth((m) => m - 1)
    }
  }

  const handleNextMonth = () => {
    if (calMonth === 11) {
      setCalMonth(0)
      setCalYear((y) => y + 1)
    } else {
      setCalMonth((m) => m + 1)
    }
  }

  const handleJumpToTodayMonth = () => {
    setCalYear(2026)
    setCalMonth(8)
    setSelectedCalDay(12)
  }

  const getWeekDays = (year: number, month: number, day: number) => {
    const selectedDate = new Date(year, month, day)
    const dayOfWeek = selectedDate.getDay()
    const weekStart = new Date(selectedDate)
    weekStart.setDate(selectedDate.getDate() - dayOfWeek)

    const days = []
    for (let i = 0; i < 7; i++) {
      const d = new Date(weekStart)
      d.setDate(weekStart.getDate() + i)
      days.push({
        dateObj: d,
        year: d.getFullYear(),
        month: d.getMonth(),
        day: d.getDate(),
        weekday: WEEKDAY_NAMES[d.getDay()],
        isToday: d.getFullYear() === 2026 && d.getMonth() === 8 && d.getDate() === 12,
        isSelected: d.getDate() === selectedCalDay && d.getMonth() === calMonth,
        dateKey: formatCalDateKey(d.getFullYear(), d.getMonth(), d.getDate()),
      })
    }
    return days
  }

  const filterTask = (task: CalTaskItem) => {
    if (calSubjectFilter === 'all') return true
    if (calSubjectFilter === 'exams') {
      return (
        task.title.toLowerCase().includes('exam') ||
        task.title.toLowerCase().includes('midterm') ||
        task.priority === 'high'
      )
    }
    return task.subject.toLowerCase().includes(calSubjectFilter.toLowerCase())
  }

  const DAY_HOURLY_SLOTS = [
    { hour: 8, label: '8:00 AM', period: 'Morning Focus & Prep' },
    { hour: 9, label: '9:00 AM', period: 'Active Problem Set' },
    { hour: 10, label: '10:00 AM', period: 'Spaced Recall Drill' },
    { hour: 11, label: '11:00 AM', period: 'Deep Work Lab' },
    { hour: 12, label: '12:00 PM', period: 'Lunch & Cognitive Reset 🥪' },
    { hour: 13, label: '1:00 PM', period: 'Light Review Buffer' },
    { hour: 14, label: '2:00 PM', period: 'Core Concept Mastery' },
    { hour: 15, label: '3:00 PM', period: 'Applied Exercises' },
    { hour: 16, label: '4:00 PM', period: 'Practice Questions' },
    { hour: 17, label: '5:00 PM', period: 'Evening Booster Session' },
    { hour: 18, label: '6:00 PM', period: 'Formula Synthesis' },
    { hour: 19, label: '7:00 PM', period: 'Quiz & Mastery Evaluation' },
    { hour: 20, label: '8:00 PM', period: 'Daily Wind-Down & Notes' },
  ]

  // Schedule & Tasks
  const [tasks, setTasks] = useState<TimelineTask[]>([
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

  useEffect(() => {
    fetch('http://127.0.0.1:8000/tasks')
      .then((res) => res.json())
      .then((data: any[]) => {
        if (Array.isArray(data) && data.length > 0) {
          const formattedTasks: TimelineTask[] = data.map((t) => {
            const sub = t.subject || 'Study'
            let tagClass = 'task-tag-chem'
            let tagIcon = `🧪 ${sub}`
            if (sub.toLowerCase().includes('math')) {
              tagClass = 'task-tag-math'
              tagIcon = `📐 ${sub}`
            } else if (sub.toLowerCase().includes('python') || sub.toLowerCase().includes('code')) {
              tagClass = 'task-tag-python'
              tagIcon = `🐍 ${sub}`
            } else if (sub.toLowerCase().includes('ai')) {
              tagClass = 'task-tag-ai'
              tagIcon = `🧠 ${sub}`
            }
            return {
              id: `task-${t.id}`,
              title: t.title || t.topic || `${sub} Practice`,
              subject: sub,
              tagClass,
              tagIcon,
              timeSlot: t.timeSlot || `${t.duration_minutes || 45} min`,
              completed: !!t.completed,
              alarmActive: t.alarmEnabled ?? true,
              status: t.completed ? 'Done' : 'Upcoming',
            }
          })
          setTasks(formattedTasks)

          // Also merge into calTasksByDate across all scheduled dates
          setCalTasksByDate((prev) => {
            const next = { ...prev }
            data.forEach((t) => {
              const d = t.scheduled_date || '2026-09-12'
              const sub = t.subject || 'Study'
              const tagClass = sub.toLowerCase().includes('math')
                ? 'task-tag-math'
                : sub.toLowerCase().includes('python')
                ? 'task-tag-python'
                : sub.toLowerCase().includes('ai')
                ? 'task-tag-ai'
                : 'task-tag-chem'
              const item: CalTaskItem = {
                id: `task-${t.id}`,
                title: t.title || t.topic || `${sub} Practice`,
                subject: sub,
                tagClass,
                timeSlot: t.timeSlot || `${t.duration_minutes || 60} min`,
                completed: !!t.completed,
                duration_minutes: t.duration_minutes || 60,
                priority: t.priority || 'medium',
              }
              const existingList = next[d] || []
              if (!existingList.some((x) => x.id === item.id)) {
                next[d] = [...existingList, item]
              }
            })
            return next
          })
        }
      })
      .catch((err) => console.error('Failed to fetch tasks from backend:', err))
  }, [])

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

  // Quiz Modal & Multi-Question Adaptive Stepper State
  const [quizModalOpen, setQuizModalOpen] = useState<boolean>(false)
  const [currentQuizSubject, setCurrentQuizSubject] = useState<string>('python')
  const [currentQuizTitle, setCurrentQuizTitle] = useState<string>('Concept Drill')
  const [quizQuestions, setQuizQuestions] = useState<QuizQuestionItem[]>([])
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState<number>(0)
  const [selectedQuizOpt, setSelectedQuizOpt] = useState<number | null>(null)
  const [quizFeedback, setQuizFeedback] = useState<{ isCorrect: boolean; text: string } | null>(null)
  const [activeQuizId, setActiveQuizId] = useState<number | undefined>(undefined)
  const [quizUserAnswers, setQuizUserAnswers] = useState<{ question_id: number; selected_answer: string; isCorrect: boolean }[]>([])
  const [isQuizFinished, setIsQuizFinished] = useState<boolean>(false)
  const [quizLoading, setQuizLoading] = useState<boolean>(false)
  const [quizStage, setQuizStage] = useState<1 | 2>(1)
  const [stage1Score, setStage1Score] = useState<number>(0)
  const [adaptiveDifficulty, setAdaptiveDifficulty] = useState<'easy' | 'medium' | 'hard' | null>(null)
  const [adaptiveNotice, setAdaptiveNotice] = useState<string | null>(null)
  const [isTransitioningStage, setIsTransitioningStage] = useState<boolean>(false)
  const [quizFinalResult, setQuizFinalResult] = useState<{
    stage1Correct: number
    stage1Total: number
    stage2Correct: number
    stage2Total: number
    totalCorrect: number
    total: number
    scorePct: number
    adaptiveDifficulty: string
  } | null>(null)



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
        if (profile.grade) {
          setUserGrade(profile.grade)
          setEditGrade(profile.grade)
        }
        if (profile.targetExam) {
          setUserTargetExam(profile.targetExam)
          setEditTargetExam(profile.targetExam)
        }
        if (profile.dailyGoalMinutes) {
          setUserDailyGoal(profile.dailyGoalMinutes)
          setEditDailyGoal(profile.dailyGoalMinutes)
        }
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

  // Toggle task in Calendar
  const handleToggleCalTask = (day: number, taskId: string, year = calYear, month = calMonth) => {
    const dateKey = formatCalDateKey(year, month, day)
    let isNowCompleted = false

    setCalTasksByDate((prev) => {
      const list = prev[dateKey] || []
      const updated = list.map((t) => {
        if (t.id === taskId) {
          const next = !t.completed
          isNowCompleted = next
          return { ...t, completed: next }
        }
        return t
      })
      return { ...prev, [dateKey]: updated }
    })

    if (dateKey === '2026-09-12') {
      toggleTask(taskId)
    } else {
      if (isNowCompleted) {
        soundSynth.playSuccessBeep()
        showToast('Task marked complete!', '🎉')
      }
      const numId = parseInt(taskId.replace('task-', ''), 10)
      if (!isNaN(numId)) {
        updateTaskCompletion(numId)
      }
    }
  }

  // Add task in Calendar
  const handleAddCalendarTask = (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    if (!newCalTaskTitle.trim()) return

    const dateKey = formatCalDateKey(calYear, calMonth, selectedCalDay)
    const tagClass =
      newCalTaskSubject === 'Chemistry'
        ? 'task-tag-chem'
        : newCalTaskSubject === 'Python'
        ? 'task-tag-python'
        : newCalTaskSubject === 'AI Systems'
        ? 'task-tag-ai'
        : 'task-tag-math'

    const tagIcon =
      newCalTaskSubject === 'Chemistry'
        ? '🧪 Chemistry'
        : newCalTaskSubject === 'Python'
        ? '🐍 Python'
        : newCalTaskSubject === 'AI Systems'
        ? '🤖 AI Systems'
        : '📐 Maths'

    const timeSlotStr = newCalTaskTime.trim() || '5:00–6:00 PM'
    const newTaskId = `task-${Date.now()}`

    const newTaskItem: CalTaskItem = {
      id: newTaskId,
      title: newCalTaskTitle.trim(),
      subject: newCalTaskSubject,
      tagClass,
      timeSlot: timeSlotStr,
      completed: false,
      priority: newCalTaskPriority,
      duration_minutes: newCalTaskDuration,
    }

    setCalTasksByDate((prev) => ({
      ...prev,
      [dateKey]: [...(prev[dateKey] || []), newTaskItem],
    }))

    if (dateKey === '2026-09-12') {
      setTasks((prev) => [
        ...prev,
        {
          id: newTaskId,
          title: newCalTaskTitle.trim(),
          subject: newCalTaskSubject,
          tagClass,
          tagIcon,
          timeSlot: timeSlotStr,
          completed: false,
          alarmActive: true,
          status: 'Upcoming',
        },
      ])
    }

    createBackendTask({
      title: newCalTaskTitle.trim(),
      subject: newCalTaskSubject,
      topic: newCalTaskTitle.trim(),
      duration_minutes: newCalTaskDuration,
      priority: newCalTaskPriority,
      time_slot: timeSlotStr,
      scheduled_date: dateKey,
      alarm_active: true,
      is_critical: newCalTaskPriority === 'high',
      status_tag: 'Upcoming',
    }).then((created) => {
      if (created && created.id) {
        setCalTasksByDate((prev) => {
          const list = prev[dateKey] || []
          return {
            ...prev,
            [dateKey]: list.map((item) => (item.id === newTaskId ? { ...item, id: `task-${created.id}` } : item)),
          }
        })
      }
    })

    soundSynth.playHarmonicChime()
    showToast(`Added "${newCalTaskTitle.trim()}" to ${MONTH_NAMES[calMonth]} ${selectedCalDay}!`, '📅')
    setNewCalTaskTitle('')
  }

  // Delete task from Calendar
  const handleDeleteCalTask = (day: number, taskId: string, year = calYear, month = calMonth) => {
    const dateKey = formatCalDateKey(year, month, day)
    setCalTasksByDate((prev) => ({
      ...prev,
      [dateKey]: (prev[dateKey] || []).filter((t) => t.id !== taskId),
    }))

    if (dateKey === '2026-09-12') {
      setTasks((prev) => prev.filter((t) => t.id !== taskId))
    }

    const numId = parseInt(taskId.replace('task-', ''), 10)
    if (!isNaN(numId)) {
      deleteBackendTask(numId)
    }
    showToast('Task removed from schedule', '🗑')
  }

  // Real Calendar Sync & iCal Export
  const handleSyncCalendar = () => {
    setCalendarSyncActive(true)
    soundSynth.playSuccessBeep()
    downloadCalendarIcs()
    showToast('📅 Exported reviso_study_schedule.ics! Ready to import into Google or Apple Calendar.', '✨')
    setTimeout(() => setCalendarSyncActive(false), 1200)
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

  // Quiz Drill Launcher & Adaptive Stepper Logic
  const launchQuiz = async (subjectKey: 'python' | 'math' | 'chem' | string) => {
    const key = subjectKey.toLowerCase()
    setCurrentQuizSubject(key)
    const titleMap: Record<string, string> = {
      python: 'Python Adaptive Concept Drill',
      math: 'Maths Adaptive Problem Drill',
      chem: 'Chemistry Adaptive Reaction Drill',
    }
    setCurrentQuizTitle(titleMap[key] || `${subjectKey.toUpperCase()} Adaptive Drill`)
    setQuizModalOpen(true)
    setQuizLoading(true)
    setQuizStage(1)
    setStage1Score(0)
    setAdaptiveDifficulty(null)
    setAdaptiveNotice(null)
    setCurrentQuestionIdx(0)
    setSelectedQuizOpt(null)
    setQuizFeedback(null)
    setQuizUserAnswers([])
    setIsQuizFinished(false)
    setQuizFinalResult(null)

    const subjectName = key === 'math' ? 'Maths' : key === 'chem' ? 'Chemistry' : 'Python'

    try {
      const data = await fetchGeneratedQuiz(subjectName, undefined, 'medium', 3)
      if (data && data.questions && data.questions.length > 0) {
        setQuizQuestions(data.questions)
        setActiveQuizId(data.quiz_id)
        setQuizLoading(false)
        return
      }
    } catch {
      // Backend error fallback
    }

    // Client-side fallback: sample 3 questions from FALLBACK_QUIZ_BANK
    const pool = FALLBACK_QUIZ_BANK[key] || FALLBACK_QUIZ_BANK.python
    const shuffled = [...pool].sort(() => Math.random() - 0.5).slice(0, 3)
    setQuizQuestions(shuffled)
    setActiveQuizId(undefined)
    setQuizLoading(false)
  }

  const selectQuizOption = (optIndex: number) => {
    if (selectedQuizOpt !== null || quizQuestions.length === 0) return
    const currentQ = quizQuestions[currentQuestionIdx]
    if (!currentQ) return

    setSelectedQuizOpt(optIndex)
    const chosenOptionText = currentQ.options[optIndex]
    const isCorrect = currentQ.correct_answer
      ? chosenOptionText.trim().toLowerCase() === currentQ.correct_answer.trim().toLowerCase()
      : optIndex === 1

    if (isCorrect) {
      soundSynth.playSuccessBeep()
      setQuizFeedback({
        isCorrect: true,
        text: `✓ Spot on! ${currentQ.explanation || 'Great job identifying the right answer!'}`,
      })
    } else {
      setQuizFeedback({
        isCorrect: false,
        text: `✕ Not quite. Correct answer: ${currentQ.correct_answer || 'the indicated option'}. ${currentQ.explanation || ''}`,
      })
    }

    const newAnswer = {
      question_id: currentQ.id,
      selected_answer: chosenOptionText,
      isCorrect,
    }
    const updatedAnswers = [...quizUserAnswers, newAnswer]
    setQuizUserAnswers(updatedAnswers)

    // Check if Stage 1 (first 3 questions) has just finished
    if (quizStage === 1 && currentQuestionIdx === 2) {
      const s1Correct = updatedAnswers.slice(0, 3).filter((a) => a.isCorrect).length
      setStage1Score(s1Correct)

      let nextDiff: 'easy' | 'medium' | 'hard' = 'medium'
      let notice = ''
      if (s1Correct <= 1) {
        nextDiff = 'easy'
        notice = `Adaptive Booster: Scored ${s1Correct}/3 — Generating 2 Easy practice questions to rebuild fundamentals.`
      } else if (s1Correct === 2) {
        nextDiff = 'medium'
        notice = `Reinforcement Round: Scored 2/3 — Generating 2 Medium practice questions to lock in proficiency.`
      } else {
        nextDiff = 'hard'
        notice = `Mastery Challenge: Perfect 3/3! 🚀 — Generating 2 Hard challenge questions to test advanced skills.`
      }
      setAdaptiveDifficulty(nextDiff)
      setAdaptiveNotice(notice)
    }
  }

  const handleProceedToStage2 = async () => {
    if (!adaptiveDifficulty) return
    setIsTransitioningStage(true)
    const subjectName = currentQuizSubject === 'math' ? 'Maths' : currentQuizSubject === 'chem' ? 'Chemistry' : 'Python'

    let nextQuestions: QuizQuestionItem[] = []
    try {
      const data = await fetchGeneratedQuiz(subjectName, undefined, adaptiveDifficulty, 2)
      if (data && data.questions && data.questions.length > 0) {
        nextQuestions = data.questions
      }
    } catch {
      // offline fallback
    }

    if (nextQuestions.length === 0) {
      const pool = FALLBACK_QUIZ_BANK[currentQuizSubject] || FALLBACK_QUIZ_BANK.python
      const diffPool = pool.filter((q) => q.difficulty === adaptiveDifficulty)
      const fallbackPool = diffPool.length >= 2 ? diffPool : pool
      nextQuestions = [...fallbackPool].sort(() => Math.random() - 0.5).slice(0, 2)
    }

    // Append 2 adaptive questions (total is now 5)
    setQuizQuestions((prev) => [...prev, ...nextQuestions])
    setQuizStage(2)
    setCurrentQuestionIdx(3) // Advance to Question 4
    setSelectedQuizOpt(null)
    setQuizFeedback(null)
    setIsTransitioningStage(false)
  }

  const handleNextQuestion = () => {
    if (currentQuestionIdx < quizQuestions.length - 1) {
      setCurrentQuestionIdx((prev) => prev + 1)
      setSelectedQuizOpt(null)
      setQuizFeedback(null)
    }
  }

  const handleFinishQuiz = async () => {
    const s1 = quizUserAnswers.slice(0, 3).filter((a) => a.isCorrect).length
    const s2 = quizUserAnswers.slice(3).filter((a) => a.isCorrect).length
    const totalCorrect = s1 + s2
    const total = quizUserAnswers.length
    const scorePct = Math.round((totalCorrect / Math.max(1, total)) * 100)

    setQuizFinalResult({
      stage1Correct: s1,
      stage1Total: 3,
      stage2Correct: s2,
      stage2Total: Math.max(1, total - 3),
      totalCorrect,
      total,
      scorePct,
      adaptiveDifficulty: adaptiveDifficulty || 'adaptive',
    })
    setIsQuizFinished(true)
    soundSynth.playHarmonicChime()

    if (currentQuizSubject === 'python') {
      const newScore = Math.max(68, scorePct)
      setDktScores((prev) => ({
        ...prev,
        python: { pct: newScore, retention: 'Stable (Refresher Complete)', safe: true },
      }))
      setQuizScoreText(`Score: ${newScore}% · Mastered!`)
      setQuizCardBorderColor('var(--color-math)')
    } else if (currentQuizSubject === 'math') {
      const newScore = Math.max(85, scorePct)
      setDktScores((prev) => ({
        ...prev,
        math: { pct: newScore, retention: 'Mastery (14d decay)', safe: true },
      }))
    } else if (currentQuizSubject === 'chem') {
      const newScore = Math.max(78, scorePct)
      setDktScores((prev) => ({
        ...prev,
        chem: { pct: newScore, retention: 'Proficient (8d decay)', safe: true },
      }))
    }

    showToast('Knowledge graph updated with your adaptive quiz results!', '📈')

    try {
      const answersPayload = quizUserAnswers.map((a) => ({
        question_id: a.question_id,
        selected_answer: a.selected_answer,
      }))
      await submitQuizAnswers(activeQuizId, answersPayload)
    } catch (e) {
      console.warn('Could not submit answers to backend:', e)
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
                    <span style={{ fontSize: '11px', color: 'var(--brand-mint)', marginTop: '3px', fontWeight: 600 }}>
                      🎯 {userTargetExam} • ⏱️ {userDailyGoal}m/day
                    </span>
                  </div>
                </div>
                <div className="dropdown-divider" />
                {isEditingName ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', padding: '4px 0' }}>
                    <div>
                      <label style={{ fontSize: '10px', color: 'var(--text-tertiary)', fontWeight: 600, textTransform: 'uppercase' }}>
                        Your Name
                      </label>
                      <input
                        type="text"
                        value={editNameValue}
                        onChange={(e) => setEditNameValue(e.target.value)}
                        placeholder="Enter full name"
                        style={{
                          width: '100%',
                          background: 'var(--bg-canvas)',
                          border: '1px solid var(--border-strong)',
                          color: 'var(--text-primary)',
                          padding: '5px 8px',
                          borderRadius: '6px',
                          fontSize: '12px',
                          marginTop: '2px',
                        }}
                        autoFocus
                      />
                    </div>

                    <div>
                      <label style={{ fontSize: '10px', color: 'var(--text-tertiary)', fontWeight: 600, textTransform: 'uppercase' }}>
                        Target Exam / Focus
                      </label>
                      <input
                        type="text"
                        value={editTargetExam}
                        onChange={(e) => setEditTargetExam(e.target.value)}
                        placeholder="e.g. JEE Advanced, NEET, SAT"
                        style={{
                          width: '100%',
                          background: 'var(--bg-canvas)',
                          border: '1px solid var(--border-strong)',
                          color: 'var(--text-primary)',
                          padding: '5px 8px',
                          borderRadius: '6px',
                          fontSize: '12px',
                          marginTop: '2px',
                        }}
                      />
                    </div>

                    <div style={{ display: 'flex', gap: '6px' }}>
                      <div style={{ flex: 1 }}>
                        <label style={{ fontSize: '10px', color: 'var(--text-tertiary)', fontWeight: 600, textTransform: 'uppercase' }}>
                          Grade
                        </label>
                        <input
                          type="text"
                          value={editGrade}
                          onChange={(e) => setEditGrade(e.target.value)}
                          placeholder="e.g. Grade 12"
                          style={{
                            width: '100%',
                            background: 'var(--bg-canvas)',
                            border: '1px solid var(--border-strong)',
                            color: 'var(--text-primary)',
                            padding: '5px 8px',
                            borderRadius: '6px',
                            fontSize: '12px',
                            marginTop: '2px',
                          }}
                        />
                      </div>
                      <div style={{ width: '80px' }}>
                        <label style={{ fontSize: '10px', color: 'var(--text-tertiary)', fontWeight: 600, textTransform: 'uppercase' }}>
                          Goal (min)
                        </label>
                        <input
                          type="number"
                          value={editDailyGoal}
                          onChange={(e) => setEditDailyGoal(Math.max(15, parseInt(e.target.value, 10) || 60))}
                          style={{
                            width: '100%',
                            background: 'var(--bg-canvas)',
                            border: '1px solid var(--border-strong)',
                            color: 'var(--text-primary)',
                            padding: '5px 8px',
                            borderRadius: '6px',
                            fontSize: '12px',
                            marginTop: '2px',
                          }}
                        />
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '6px', marginTop: '4px' }}>
                      <button
                        type="button"
                        onClick={() => {
                          if (editNameValue.trim()) {
                            const trimmed = editNameValue.trim()
                            const trimmedGrade = editGrade.trim() || 'Grade 12 • Engineering Prep'
                            const trimmedExam = editTargetExam.trim() || 'JEE / Advanced STEM'
                            setUserName(trimmed)
                            setUserGrade(trimmedGrade)
                            setUserTargetExam(trimmedExam)
                            setUserDailyGoal(editDailyGoal)
                            setStoredUserName(trimmed)
                            updateUserProfile(1, {
                              fullName: trimmed,
                              grade: trimmedGrade,
                              targetExam: trimmedExam,
                              dailyGoalMinutes: editDailyGoal,
                            })
                            setIsEditingName(false)
                            showToast(`Saved to database: ${trimmed} (${trimmedExam})`)
                          }
                        }}
                        style={{
                          flex: 1,
                          background: 'var(--grad-primary)',
                          color: '#fff',
                          border: 'none',
                          borderRadius: '5px',
                          padding: '6px',
                          fontSize: '11px',
                          fontWeight: 700,
                          cursor: 'pointer',
                        }}
                      >
                        Save Profile
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setEditNameValue(userName)
                          setEditGrade(userGrade)
                          setEditTargetExam(userTargetExam)
                          setEditDailyGoal(userDailyGoal)
                          setIsEditingName(false)
                        }}
                        style={{
                          background: 'var(--bg-surface-elevated)',
                          color: 'var(--text-secondary)',
                          border: '1px solid var(--border-subtle)',
                          borderRadius: '5px',
                          padding: '6px 10px',
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
                    <span>Edit Profile & Goals</span>
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
              {tasks.map((task) => (
                <div key={task.id} className={`task-card ${task.completed ? 'completed' : ''}`}>
                  <div className="task-card-left">
                    <div className="task-check-circle" onClick={() => toggleTask(task.id)}>
                      ✓
                    </div>
                    <div className="task-info">
                      <div className="task-title">{task.title}</div>
                      <div className="task-meta-row">
                        <span className={`task-tag ${task.tagClass}`}>{task.tagIcon}</span>
                        <span>·</span>
                        <span>{task.timeSlot}</span>
                      </div>
                    </div>
                  </div>
                  <div className="task-card-right">
                    <button
                      type="button"
                      className="btn-timer"
                      onClick={() => openPomodoroModal(task.title)}
                    >
                      ⏱️ Focus
                    </button>
                    <button
                      type="button"
                      className={`btn-alarm-bell ${task.alarmActive ? 'active' : ''}`}
                      onClick={() => toggleAlarmBell(task.id, task.title)}
                      title={task.alarmActive ? 'Alarm Active' : 'Muted'}
                    >
                      <BellIcon size={14} />
                    </button>
                    <span className={`badge ${task.completed ? 'badge-done' : 'badge-upcoming'}`}>{task.status}</span>
                  </div>
                </div>
              ))}

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
           MODAL 1: INTERACTIVE MULTI-QUESTION CONCEPT QUIZ DRILL
           ========================================================================== */}
      <div
        className={`modal-backdrop ${quizModalOpen ? 'active' : ''}`}
        onClick={(e) => {
          if (e.target === e.currentTarget) setQuizModalOpen(false)
        }}
      >
        <div className="modal-window" style={{ maxWidth: '580px', width: '92%' }}>
          {/* Header */}
          <div className="modal-header">
            <div style={{ fontWeight: 800, fontSize: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span>📝</span>
              <span>{currentQuizTitle}</span>
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
            {quizLoading ? (
              <div style={{ padding: '36px 20px', textAlign: 'center' }}>
                <div style={{ fontSize: '32px', marginBottom: '12px', animation: 'spin 1.5s linear infinite' }}>⚡</div>
                <div style={{ fontWeight: 700, fontSize: '15px' }}>Generating Adaptive Baseline Drill...</div>
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '6px' }}>
                  Loading 3 diagnostic questions to evaluate concept retention
                </div>
              </div>
            ) : isQuizFinished ? (
              /* RESULTS & MASTERY SUMMARY SCREEN */
              <div className="quiz-results-card">
                <div className="quiz-trophy-circle">
                  {quizFinalResult && quizFinalResult.scorePct >= 70 ? '🏆' : '🎯'}
                </div>
                <div>
                  <h3 className="quiz-results-score">
                    {quizFinalResult?.totalCorrect} / {quizFinalResult?.total}
                  </h3>
                  <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--accent-primary)', marginTop: '4px' }}>
                    {quizFinalResult?.scorePct}% Overall Score · {quizFinalResult && quizFinalResult.scorePct >= 70 ? 'Adaptive Drill Mastered!' : 'Keep Practicing!'}
                  </div>
                </div>

                {/* Stage 1 & Stage 2 Score Breakdown */}
                <div className="quiz-stage-score-grid">
                  <div className="quiz-stage-score-card">
                    <div className="stage-title">Stage 1 (Baseline)</div>
                    <div className="stage-value">{quizFinalResult?.stage1Correct} / 3</div>
                    <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                      {quizFinalResult?.stage1Correct === 3 ? 'Perfect 3/3 ⭐' : quizFinalResult?.stage1Correct === 2 ? 'Proficient 2/3' : 'Foundational'}
                    </div>
                  </div>
                  <div className="quiz-stage-score-card">
                    <div className="stage-title">Stage 2 ({quizFinalResult?.adaptiveDifficulty?.toUpperCase()})</div>
                    <div className="stage-value">{quizFinalResult?.stage2Correct} / {quizFinalResult?.stage2Total}</div>
                    <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                      Adaptive Branch
                    </div>
                  </div>
                </div>

                <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                  DKT retention score updated &amp; synced to Supabase database.
                </div>

                {/* Question-by-Question Review Breakdown */}
                <div className="quiz-review-list">
                  {quizUserAnswers.map((ans, idx) => (
                    <div key={idx} className="quiz-review-item">
                      <span style={{ fontSize: '15px' }}>{ans.isCorrect ? '✅' : '❌'}</span>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div style={{ fontWeight: 700 }}>
                            Question {idx + 1} {idx >= 3 ? `(Stage 2: ${adaptiveDifficulty?.toUpperCase()})` : '(Stage 1: Baseline)'}
                          </div>
                          <span style={{ fontSize: '11px', color: ans.isCorrect ? 'var(--color-math)' : 'var(--color-python)' }}>
                            {ans.isCorrect ? 'Correct' : 'Needs Review'}
                          </span>
                        </div>
                        <div style={{ color: 'var(--text-secondary)', fontSize: '11px', marginTop: '2px' }}>
                          Selected: {ans.selected_answer}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : quizQuestions.length > 0 ? (
              /* ACTIVE QUESTION STEPPER */
              <div>
                {/* Adaptive Stage 2 Notification Banner */}
                {quizStage === 2 && adaptiveNotice && (
                  <div className={`quiz-adaptive-banner ${adaptiveDifficulty || 'medium'}`}>
                    <span>{adaptiveDifficulty === 'hard' ? '🚀' : adaptiveDifficulty === 'easy' ? '🌱' : '⚡'}</span>
                    <span><strong>Stage 1: {stage1Score}/3 correct</strong> — {adaptiveNotice}</span>
                  </div>
                )}

                {/* Stepper Header with Badge & Progress */}
                <div className="quiz-stepper-header">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span className="quiz-counter-pill">
                      Question {currentQuestionIdx + 1} of {quizQuestions.length}
                    </span>
                    {quizQuestions[currentQuestionIdx]?.difficulty && (
                      <span className={`quiz-difficulty-tag ${quizQuestions[currentQuestionIdx]?.difficulty}`}>
                        {quizQuestions[currentQuestionIdx]?.difficulty}
                      </span>
                    )}
                    <span style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 600 }}>
                      {currentQuestionIdx < 3 ? 'Stage 1' : `Stage 2 (${adaptiveDifficulty?.toUpperCase()})`}
                    </span>
                  </div>
                  <span style={{ fontSize: '11.5px', color: 'var(--text-secondary)', fontWeight: 600 }}>
                    {Math.round(((currentQuestionIdx + (selectedQuizOpt !== null ? 1 : 0)) / quizQuestions.length) * 100)}% Complete
                  </span>
                </div>

                {/* Animated Progress Bar */}
                <div className="quiz-progress-track">
                  <div
                    className="quiz-progress-fill"
                    style={{
                      width: `${((currentQuestionIdx + (selectedQuizOpt !== null ? 1 : 0)) / quizQuestions.length) * 100}%`,
                    }}
                  />
                </div>

                {/* Question Box */}
                <div
                  className="quiz-question-box"
                  dangerouslySetInnerHTML={{ __html: quizQuestions[currentQuestionIdx]?.question || '' }}
                />

                {/* Options List */}
                <div className="quiz-options" style={{ marginTop: '16px' }}>
                  {quizQuestions[currentQuestionIdx]?.options.map((opt, idx) => {
                    const currentQ = quizQuestions[currentQuestionIdx]
                    let btnClass = 'quiz-opt-btn'
                    if (selectedQuizOpt !== null) {
                      const isThisOptCorrect = currentQ.correct_answer
                        ? opt.trim().toLowerCase() === currentQ.correct_answer.trim().toLowerCase()
                        : false

                      if (isThisOptCorrect) {
                        btnClass += ' correct'
                      } else if (selectedQuizOpt === idx) {
                        btnClass += ' incorrect'
                      }
                    }
                    return (
                      <button
                        key={idx}
                        type="button"
                        className={btnClass}
                        disabled={selectedQuizOpt !== null}
                        onClick={() => selectQuizOption(idx)}
                      >
                        <strong>{String.fromCharCode(65 + idx)}.</strong> <span>{opt}</span>
                      </button>
                    )
                  })}
                </div>

                {/* Instant Explanation Feedback */}
                {quizFeedback && (
                  <div
                    className="quiz-feedback-box"
                    style={{
                      marginTop: '16px',
                      background: quizFeedback.isCorrect ? 'var(--color-math-subtle)' : 'rgba(0, 77, 64, 0.25)',
                      color: quizFeedback.isCorrect ? 'var(--color-math)' : '#004D40',
                      border: `1px solid ${quizFeedback.isCorrect ? 'var(--color-math)' : '#004D40'}`,
                    }}
                  >
                    {quizFeedback.text}
                  </div>
                )}
              </div>
            ) : (
              <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                No questions available for this topic. Please try again.
              </div>
            )}
          </div>

          {/* Modal Footer with Adaptive Stepper Controls */}
          <div className="modal-footer" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <button type="button" className="btn-pill" onClick={() => setQuizModalOpen(false)}>
              {isQuizFinished ? 'Close' : 'Exit Drill'}
            </button>

            {isQuizFinished ? (
              <button
                type="button"
                className="quiz-next-btn"
                onClick={() => launchQuiz(currentQuizSubject)}
              >
                <span>Take Another Adaptive Drill</span>
                <span>🔄</span>
              </button>
            ) : selectedQuizOpt !== null ? (
              quizStage === 1 && currentQuestionIdx === 2 ? (
                /* Question 3 answered: Branch to Stage 2 */
                <button
                  type="button"
                  className="quiz-next-btn"
                  disabled={isTransitioningStage}
                  onClick={handleProceedToStage2}
                >
                  {isTransitioningStage ? (
                    <span>Unlocking 2 {adaptiveDifficulty?.toUpperCase()} questions...</span>
                  ) : (
                    <>
                      <span>Unlock Stage 2 (2 {adaptiveDifficulty?.toUpperCase()} Questions)</span>
                      <span>⚡</span>
                    </>
                  )}
                </button>
              ) : currentQuestionIdx < quizQuestions.length - 1 ? (
                <button
                  type="button"
                  className="quiz-next-btn"
                  onClick={handleNextQuestion}
                >
                  <span>Next Question</span>
                  <span>➡️</span>
                </button>
              ) : (
                <button
                  type="button"
                  className="quiz-next-btn"
                  onClick={handleFinishQuiz}
                >
                  <span>Finish Adaptive Quiz &amp; View Results</span>
                  <span>🏆</span>
                </button>
              )
            ) : null}
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
            {/* View switcher: Month View, Week View, Day View */}
            <div className="cal-segmented-control">
              <button
                type="button"
                className={`cal-seg-btn ${calViewMode === 'month' ? 'active' : ''}`}
                onClick={() => setCalViewMode('month')}
              >
                <span>📅</span>
                <span>Month</span>
              </button>
              <button
                type="button"
                className={`cal-seg-btn ${calViewMode === 'week' ? 'active' : ''}`}
                onClick={() => setCalViewMode('week')}
              >
                <span>📆</span>
                <span>Week</span>
              </button>
              <button
                type="button"
                className={`cal-seg-btn ${calViewMode === 'day' ? 'active' : ''}`}
                onClick={() => setCalViewMode('day')}
              >
                <span>📋</span>
                <span>Day ({MONTH_NAMES[calMonth].slice(0, 3)} {selectedCalDay})</span>
              </button>
            </div>

            {/* iCal / Google Calendar Export Button */}
            <button
              type="button"
              className="btn-pill btn-primary"
              style={{ fontSize: '12px', padding: '6px 14px' }}
              onClick={handleSyncCalendar}
              title="Download standard RFC-5545 .ics calendar file"
            >
              <span>📥</span>
              <span>{calendarSyncActive ? 'Exporting...' : 'Sync / Export .ics'}</span>
            </button>

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
          {/* Quick Subject Filter Bar */}
          <div className="calendar-filter-bar">
            <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-secondary)', marginRight: '4px' }}>
              Filter:
            </span>
            {(
              [
                { key: 'all', label: 'All Subjects' },
                { key: 'Maths', label: '📐 Maths' },
                { key: 'Chemistry', label: '🧪 Chemistry' },
                { key: 'Python', label: '🐍 Python' },
                { key: 'AI Systems', label: '🤖 AI Systems' },
                { key: 'exams', label: '🎯 Exams Only' },
              ] as const
            ).map((f) => (
              <button
                key={f.key}
                type="button"
                className={`cal-filter-chip ${calSubjectFilter === f.key ? 'active' : ''}`}
                onClick={() => {
                  setCalSubjectFilter(f.key)
                  soundSynth.playHarmonicChime()
                }}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* Top Banner with Quick Highlights */}
          <div className="cal-top-banner">
            <div>
              <div className="cal-top-banner-title">
                <span>🗓️ {MONTH_NAMES[calMonth]} {calYear} Academic Schedule</span>
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
                <span className="cal-stat-val">{daysInCalMonth} Days</span>
                <span className="cal-stat-label">Term Span</span>
              </div>
              <div className="cal-stat-card">
                <span className="cal-stat-val" style={{ color: '#34d399' }}>
                  {Object.values(calTasksByDate).flat().filter((t) => t.completed).length +
                    tasks.filter((t) => t.completed).length}{' '}
                  Done
                </span>
                <span className="cal-stat-label">Completed Tasks</span>
              </div>
              <div className="cal-stat-card">
                <span className="cal-stat-val" style={{ color: '#f59e0b' }}>
                  {
                    Object.values(calTasksByDate)
                      .flat()
                      .filter(
                        (t) =>
                          t.title.toLowerCase().includes('exam') ||
                          t.title.toLowerCase().includes('midterm')
                      ).length
                  }{' '}
                  Exams
                </span>
                <span className="cal-stat-label">Milestones</span>
              </div>
              <button
                type="button"
                className="btn-pill"
                style={{ fontSize: '12px', padding: '6px 14px' }}
                onClick={handleSyncCalendar}
              >
                <span>🔄</span>
                <span>{calendarSyncActive ? 'Exporting...' : 'Sync Calendar'}</span>
              </button>
            </div>
          </div>

          {/* VIEW 1: MONTH VIEW */}
          {calViewMode === 'month' && (
            <div className="cal-month-layout">
              <div className="cal-grid-panel">
                <div className="calendar-month-nav">
                  <div className="cal-nav-buttons">
                    <button
                      type="button"
                      className="cal-nav-btn"
                      onClick={handlePrevMonth}
                      title="Previous Month"
                    >
                      ◀
                    </button>
                    <span className="calendar-month-title">
                      {MONTH_NAMES[calMonth]} {calYear}
                    </span>
                    <button
                      type="button"
                      className="cal-nav-btn"
                      onClick={handleNextMonth}
                      title="Next Month"
                    >
                      ▶
                    </button>
                    <button
                      type="button"
                      className="btn-pill"
                      style={{ fontSize: '11px', padding: '3px 10px', marginLeft: '6px' }}
                      onClick={handleJumpToTodayMonth}
                    >
                      Today
                    </button>
                  </div>

                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                      Click any date to inspect and manage its tasks
                    </span>
                  </div>
                </div>

                <div className="cal-large-grid">
                  {WEEKDAY_NAMES.map((d) => (
                    <div key={d} className="calendar-weekday">
                      {d}
                    </div>
                  ))}

                  {/* Empty padding cells for start of month */}
                  {Array.from({ length: startDayOfWeek }).map((_, i) => (
                    <div key={`empty-${i}`} className="cal-large-cell empty" />
                  ))}

                  {Array.from({ length: daysInCalMonth }, (_, i) => i + 1).map((day) => {
                    const isToday = calYear === 2026 && calMonth === 8 && day === 12
                    const isSelected = day === selectedCalDay
                    const rawTasks = getTasksForDate(calYear, calMonth, day)
                    const dayTasksList = rawTasks.filter(filterTask)
                    const hasExam = rawTasks.some(
                      (t) =>
                        t.title.toLowerCase().includes('exam') ||
                        t.title.toLowerCase().includes('midterm')
                    )

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
                          {dayTasksList.slice(0, 2).map((t) => {
                            const subjectLower = (t.subject || '').toLowerCase()
                            const chipClass = subjectLower.includes('chem')
                              ? 'chem'
                              : subjectLower.includes('python')
                              ? 'python'
                              : subjectLower.includes('ai')
                              ? 'ai'
                              : 'math'

                            return (
                              <div
                                key={t.id}
                                className={`cal-event-chip ${chipClass}`}
                                title={`${t.subject}: ${t.title}`}
                              >
                                {t.completed ? '✓ ' : ''}{t.subject}: {t.title}
                              </div>
                            )
                          })}
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
                    <span>
                      Selected:{' '}
                      <strong>
                        {MONTH_NAMES[calMonth].slice(0, 3)} {selectedCalDay}, {calYear}
                      </strong>
                    </span>
                    {calYear === 2026 && calMonth === 8 && selectedCalDay === 12 && (
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
                    Scheduled Tasks ({getTasksForDate(calYear, calMonth, selectedCalDay).filter(filterTask).length})
                  </span>

                  {getTasksForDate(calYear, calMonth, selectedCalDay)
                    .filter(filterTask)
                    .map((t) => (
                      <div
                        key={t.id}
                        className="cal-task-row"
                        style={{ padding: '10px 12px', cursor: 'pointer' }}
                        onClick={() => handleToggleCalTask(selectedCalDay, t.id, calYear, calMonth)}
                      >
                        <button
                          type="button"
                          className={`cal-checkbox ${t.completed ? 'checked' : ''}`}
                          onClick={(e) => {
                            e.stopPropagation()
                            handleToggleCalTask(selectedCalDay, t.id, calYear, calMonth)
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

                  {getTasksForDate(calYear, calMonth, selectedCalDay).filter(filterTask).length === 0 && (
                    <div className="cal-empty-state" style={{ padding: '24px 12px' }}>
                      No tasks scheduled for {MONTH_NAMES[calMonth].slice(0, 3)} {selectedCalDay}.
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
          )}

          {/* VIEW 2: WEEK VIEW */}
          {calViewMode === 'week' && (
            <div className="cal-week-layout">
              {(() => {
                const weekDays = getWeekDays(calYear, calMonth, selectedCalDay)
                const startLabel = `${MONTH_NAMES[weekDays[0].month].slice(0, 3)} ${weekDays[0].day}`
                const endLabel = `${MONTH_NAMES[weekDays[6].month].slice(0, 3)} ${weekDays[6].day}`

                return (
                  <>
                    <div className="cal-day-nav" style={{ marginBottom: '8px' }}>
                      <button
                        type="button"
                        className="btn-pill"
                        style={{ padding: '6px 14px', fontSize: '12px' }}
                        onClick={() => setSelectedCalDay((prev) => Math.max(1, prev - 7))}
                      >
                        ◀ Previous Week
                      </button>

                      <div className="cal-day-heading">
                        <span className="cal-day-title">Week of {startLabel} – {endLabel}, {calYear}</span>
                        <button
                          type="button"
                          className="btn-pill"
                          style={{ fontSize: '11px', padding: '3px 9px' }}
                          onClick={handleJumpToTodayMonth}
                        >
                          This Week
                        </button>
                      </div>

                      <button
                        type="button"
                        className="btn-pill"
                        style={{ padding: '6px 14px', fontSize: '12px' }}
                        onClick={() => setSelectedCalDay((prev) => Math.min(daysInCalMonth, prev + 7))}
                      >
                        Next Week ▶
                      </button>
                    </div>

                    <div className="cal-week-grid">
                      {weekDays.map((wDay) => {
                        const dayTasks = getTasksForDate(wDay.year, wDay.month, wDay.day).filter(filterTask)
                        let colClass = 'cal-week-day-col'
                        if (wDay.isToday) colClass += ' today'
                        if (wDay.isSelected) colClass += ' selected'

                        return (
                          <div
                            key={wDay.dateKey}
                            className={colClass}
                            onClick={() => {
                              setSelectedCalDay(wDay.day)
                              setCalMonth(wDay.month)
                              setCalYear(wDay.year)
                            }}
                          >
                            <div className="cal-week-col-header">
                              <div>
                                <div className="cal-week-col-name">{wDay.weekday}</div>
                                <div className="cal-week-col-num">{wDay.day}</div>
                              </div>
                              {wDay.isToday && <span className="cal-badge-today">Today</span>}
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: 1 }}>
                              {dayTasks.map((t) => (
                                <div
                                  key={t.id}
                                  className={`cal-week-task-card ${t.completed ? 'completed' : ''}`}
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    handleToggleCalTask(wDay.day, t.id, wDay.year, wDay.month)
                                  }}
                                  title={`${t.subject}: ${t.title} (${t.timeSlot})`}
                                >
                                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                    <span
                                      className={`task-tag ${t.tagClass}`}
                                      style={{ fontSize: '9.5px', padding: '1px 6px' }}
                                    >
                                      {t.subject}
                                    </span>
                                    <span style={{ fontSize: '10.5px', color: 'var(--text-tertiary)' }}>
                                      {t.completed ? '✓' : ''}
                                    </span>
                                  </div>
                                  <div style={{ fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.3 }}>
                                    {t.title}
                                  </div>
                                  <div style={{ fontSize: '10.5px', color: 'var(--text-secondary)' }}>
                                    ⏰ {t.timeSlot}
                                  </div>
                                </div>
                              ))}

                              {dayTasks.length === 0 && (
                                <div className="cal-week-empty">No tasks</div>
                              )}
                            </div>

                            <button
                              type="button"
                              className="btn-pill"
                              style={{ width: '100%', justifyContent: 'center', fontSize: '10.5px', padding: '5px 8px', marginTop: 'auto' }}
                              onClick={(e) => {
                                e.stopPropagation()
                                setSelectedCalDay(wDay.day)
                                setCalMonth(wDay.month)
                                setCalYear(wDay.year)
                                setCalViewMode('day')
                              }}
                            >
                              + View Day
                            </button>
                          </div>
                        )
                      })}
                    </div>
                  </>
                )
              })()}
            </div>
          )}

          {/* VIEW 3: DAY VIEW WITH HOURLY TIMELINE & TASK COMPOSER */}
          {calViewMode === 'day' && (
            <div className="cal-day-layout">
              {/* Left Column: Hourly Timeline & Task List */}
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
                    <span className="cal-day-title">
                      {MONTH_NAMES[calMonth]} {selectedCalDay}, {calYear}
                    </span>
                    {calYear === 2026 && calMonth === 8 && selectedCalDay === 12 && (
                      <span className="cal-badge-today">Today</span>
                    )}
                    {!(calYear === 2026 && calMonth === 8 && selectedCalDay === 12) && (
                      <button
                        type="button"
                        className="btn-pill"
                        style={{ fontSize: '11px', padding: '3px 9px' }}
                        onClick={handleJumpToTodayMonth}
                      >
                        Jump to Today
                      </button>
                    )}
                  </div>

                  <button
                    type="button"
                    className="btn-pill"
                    style={{ padding: '6px 14px', fontSize: '12px' }}
                    onClick={() => setSelectedCalDay((prev) => Math.min(daysInCalMonth, prev + 1))}
                  >
                    Next Day ▶
                  </button>
                </div>

                {/* Sub-header with completion stats */}
                {(() => {
                  const dayTasks = getTasksForDate(calYear, calMonth, selectedCalDay).filter(filterTask)
                  const completed = dayTasks.filter((t) => t.completed).length

                  return (
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
                        Tasks for {MONTH_NAMES[calMonth]} {selectedCalDay} ({completed} / {dayTasks.length} completed)
                      </span>
                      <span style={{ fontSize: '12px', color: '#80cbc4' }}>
                        Click checkbox or card to mark complete ✓
                      </span>
                    </div>
                  )
                })()}

                {/* Section A: Hourly Schedule Timeline (8 AM – 8 PM) */}
                <div style={{ marginTop: '8px' }}>
                  <div
                    style={{
                      fontSize: '13px',
                      fontWeight: 800,
                      color: 'var(--text-primary)',
                      marginBottom: '10px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                    }}
                  >
                    <span>⏱️</span>
                    <span>Hourly Schedule Timeline &amp; Time Blocks</span>
                  </div>

                  <div className="cal-timeline-container">
                    {DAY_HOURLY_SLOTS.map((slot) => {
                      const allDayTasks = getTasksForDate(calYear, calMonth, selectedCalDay).filter(filterTask)
                      // Match tasks scheduled for this hour
                      const slotHour12 = slot.hour > 12 ? slot.hour - 12 : slot.hour
                      const slotHourPrefix = `${slotHour12}:`
                      const matchedTasks = allDayTasks.filter((t) => {
                        const time = t.timeSlot.toLowerCase()
                        return (
                          time.includes(slotHourPrefix) ||
                          time.includes(`${slot.hour}:`) ||
                          (slot.hour === 9 && time.includes('9:00')) ||
                          (slot.hour === 11 && time.includes('11:00')) ||
                          (slot.hour === 14 && (time.includes('2:00') || time.includes('1:30'))) ||
                          (slot.hour === 15 && time.includes('3:00')) ||
                          (slot.hour === 17 && time.includes('5:00'))
                        )
                      })

                      return (
                        <div key={slot.hour} className="cal-timeline-hour-row">
                          <div className="cal-hour-label">{slot.label}</div>
                          <div className="cal-hour-content">
                            {matchedTasks.length > 0 ? (
                              matchedTasks.map((t) => {
                                const subLower = (t.subject || '').toLowerCase()
                                const isExam =
                                  t.title.toLowerCase().includes('exam') ||
                                  t.title.toLowerCase().includes('midterm')
                                let cardType = 'math'
                                if (isExam) cardType = 'exam'
                                else if (subLower.includes('chem')) cardType = 'chem'
                                else if (subLower.includes('python')) cardType = 'python'
                                else if (subLower.includes('ai')) cardType = 'ai'

                                return (
                                  <div
                                    key={t.id}
                                    className={`cal-timeline-task-card ${cardType} ${t.completed ? 'completed' : ''}`}
                                    onClick={() => handleToggleCalTask(selectedCalDay, t.id, calYear, calMonth)}
                                  >
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                      <button
                                        type="button"
                                        className={`cal-checkbox ${t.completed ? 'checked' : ''}`}
                                        onClick={(e) => {
                                          e.stopPropagation()
                                          handleToggleCalTask(selectedCalDay, t.id, calYear, calMonth)
                                        }}
                                      >
                                        {t.completed ? '✓' : ''}
                                      </button>
                                      <div>
                                        <div style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '13px' }}>
                                          {t.title}
                                        </div>
                                        <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                                          {t.subject} • {t.timeSlot}
                                        </div>
                                      </div>
                                    </div>
                                    <span
                                      className={`badge ${t.completed ? 'badge-done' : 'badge-upcoming'}`}
                                      style={{ fontSize: '10.5px' }}
                                    >
                                      {t.completed ? 'Done ✓' : 'Scheduled'}
                                    </span>
                                  </div>
                                )
                              })
                            ) : (
                              <div
                                className="cal-timeline-empty-slot"
                                onClick={() => {
                                  setNewCalTaskTime(`${slot.label}–${slot.hour >= 12 ? (slot.hour === 12 ? '1:00 PM' : `${slot.hour - 11}:00 PM`) : `${slot.hour + 1}:00 AM`}`)
                                  showToast(`Selected time slot ${slot.label}. Enter task details on the right!`, '⏰')
                                }}
                                title="Click to schedule a study session here"
                              >
                                <span>+ Open buffer ({slot.period})</span>
                              </div>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>

                {/* Section B: All Tasks Checklist for Selected Day */}
                <div style={{ marginTop: '16px' }}>
                  <div
                    style={{
                      fontSize: '13px',
                      fontWeight: 800,
                      color: 'var(--text-primary)',
                      marginBottom: '10px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                    }}
                  >
                    <span>📋</span>
                    <span>All Scheduled Tasks Checklist</span>
                  </div>

                  <div className="cal-task-list">
                    {getTasksForDate(calYear, calMonth, selectedCalDay).filter(filterTask).length === 0 ? (
                      <div className="cal-empty-state">
                        🏖️ No study tasks scheduled for {MONTH_NAMES[calMonth]} {selectedCalDay}. Add a new task using the form on the right!
                      </div>
                    ) : (
                      getTasksForDate(calYear, calMonth, selectedCalDay)
                        .filter(filterTask)
                        .map((t) => (
                          <div
                            key={t.id}
                            className={`cal-task-row ${t.completed ? 'completed' : ''}`}
                            onClick={() => handleToggleCalTask(selectedCalDay, t.id, calYear, calMonth)}
                          >
                            <button
                              type="button"
                              className={`cal-checkbox ${t.completed ? 'checked' : ''}`}
                              onClick={(e) => {
                                e.stopPropagation()
                                handleToggleCalTask(selectedCalDay, t.id, calYear, calMonth)
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
                                {t.duration_minutes && <span>⏱️ {t.duration_minutes}m</span>}
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
                                  handleDeleteCalTask(selectedCalDay, t.id, calYear, calMonth)
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
              </div>

              {/* Right Column: Add Task Form & Day Insights */}
              <div className="cal-day-side-panel">
                <form className="cal-add-form" onSubmit={handleAddCalendarTask}>
                  <div className="cal-add-title">
                    <span>➕</span>
                    <span>Add Task to {MONTH_NAMES[calMonth].slice(0, 3)} {selectedCalDay}</span>
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

                  {/* Duration Presets */}
                  <div>
                    <span style={{ fontSize: '11.5px', color: 'var(--text-secondary)', fontWeight: 600, display: 'block', marginBottom: '6px' }}>
                      Target Duration:
                    </span>
                    <div className="cal-duration-pills">
                      {[25, 45, 60, 90].map((dur) => (
                        <button
                          key={dur}
                          type="button"
                          className={`cal-duration-pill ${newCalTaskDuration === dur ? 'active' : ''}`}
                          onClick={() => setNewCalTaskDuration(dur)}
                        >
                          {dur} min
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Priority Select */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '11.5px', color: 'var(--text-secondary)', fontWeight: 600 }}>
                      Priority:
                    </span>
                    <select
                      className="cal-select"
                      style={{ padding: '6px 10px', fontSize: '11.5px' }}
                      value={newCalTaskPriority}
                      onChange={(e) => setNewCalTaskPriority(e.target.value as any)}
                    >
                      <option value="medium">Medium Priority</option>
                      <option value="high">High Priority 🚨</option>
                      <option value="low">Low Priority</option>
                    </select>
                  </div>

                  <button
                    type="submit"
                    className="btn-pill btn-primary"
                    style={{ width: '100%', justifyContent: 'center', padding: '10px 18px', marginTop: '6px' }}
                  >
                    + Add to Day Schedule
                  </button>
                </form>

                <div className="cal-tip-box">
                  <div style={{ fontSize: '13px', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '6px' }}>
                    💡 Study Tips for {MONTH_NAMES[calMonth].slice(0, 3)} {selectedCalDay}
                  </div>
                  <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                    {calYear === 2026 && calMonth === 8 && selectedCalDay === 12
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
                    onClick={() => setCalViewMode('week')}
                  >
                    📆 View Week
                  </button>
                </div>

                <button
                  type="button"
                  className="btn-pill"
                  style={{ width: '100%', justifyContent: 'center', background: 'var(--bg-surface-elevated)' }}
                  onClick={() => setCalendarModalOpen(false)}
                >
                  Exit Calendar
                </button>
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
