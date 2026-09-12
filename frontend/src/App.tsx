import { useState, useEffect, useRef } from 'react'
import './App.css'
import {
  Calendar,
  Clock,
  Sun,
  Moon,
  User,
  History,
  Target,
  Settings,
  LogOut,
  Search,
  X,
  MessageSquare,
  Lightbulb,
  Zap,
  Check,
  Brain,
  FileText,
  AlertCircle,
  Video,
  ExternalLink,
  Trash2,
  Plus,
  Play,
  Pause,
  RotateCcw,
  Sparkles,
  Download,
  Menu,
  CheckCircle,
  XCircle,
  Bookmark,
  TrendingDown,
  Send
} from 'lucide-react'
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
  scheduleCriticalRemediation,
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

  playResetClick() {
    try {
      this.init()
      if (!this.ctx) return
      const osc = this.ctx.createOscillator()
      const gain = this.ctx.createGain()
      osc.type = 'sine'
      osc.frequency.setValueAtTime(640, this.ctx.currentTime)
      osc.frequency.exponentialRampToValueAtTime(320, this.ctx.currentTime + 0.18)
      gain.gain.setValueAtTime(0.12, this.ctx.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.18)
      osc.connect(gain)
      gain.connect(this.ctx.destination)
      osc.start()
      osc.stop(this.ctx.currentTime + 0.18)
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
  color = 'currentColor',
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

function ArrowRightIcon({
  size = 16,
  color = 'currentColor',
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
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      style={{ display: 'inline-block', verticalAlign: 'middle', flexShrink: 0 }}
      aria-hidden="true"
    >
      <line x1="5" y1="12" x2="19" y2="12" />
      <polyline points="12 5 19 12 12 19" />
    </svg>
  )
}

function CheckIcon({
  size = 16,
  color = 'currentColor',
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
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      style={{ display: 'inline-block', verticalAlign: 'middle', flexShrink: 0 }}
      aria-hidden="true"
    >
      <polyline points="20 6 9 17 4 12" />
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
    {
      id: 108,
      subject: 'Python',
      topic: 'Type Casting',
      difficulty: 'easy',
      question: `What is the result of <code>type(3 / 1)</code> in Python 3?`,
      options: ['<class \'float\'>', '<class \'int\'>', '<class \'number\'>', '<class \'double\'>'],
      correct_answer: '<class \'float\'>',
      explanation: 'The single slash operator / performs true floating-point division in Python 3.',
    },
    {
      id: 109,
      subject: 'Python',
      topic: 'List Operations',
      difficulty: 'easy',
      question: `Which method adds an element to the very end of an existing list in-place?`,
      options: ['list.append()', 'list.add()', 'list.push()', 'list.insert_end()'],
      correct_answer: 'list.append()',
      explanation: 'list.append(item) inserts the element at the end of the list in O(1) amortized time.',
    },
    {
      id: 110,
      subject: 'Python',
      topic: 'String Formatting',
      difficulty: 'easy',
      question: `Which Python 3.6+ feature enables inline expression evaluation inside strings?`,
      options: ['f-strings', 'format() templates', '% specifiers', 'template literals'],
      correct_answer: 'f-strings',
      explanation: 'f-strings (f"Value is {x}") evaluate expressions directly inside string literals at runtime.',
    },
    {
      id: 111,
      subject: 'Python',
      topic: 'Tuples',
      difficulty: 'easy',
      question: `What denotes a single-element tuple literal in Python?`,
      options: ['(42,)', '(42)', '[42]', '{42}'],
      correct_answer: '(42,)',
      explanation: 'The trailing comma (42,) distinguishes a single-element tuple from parenthesized arithmetic.',
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
    {
      id: 112,
      subject: 'Python',
      topic: 'Set Operations',
      difficulty: 'medium',
      question: `What is the result of <code>{1, 2, 3} ^ {2, 3, 4}</code> (symmetric difference)?`,
      options: ['{1, 4}', '{2, 3}', '{1, 2, 3, 4}', 'set()'],
      correct_answer: '{1, 4}',
      explanation: 'Symmetric difference ^ returns elements present in either set, but not in both.',
    },
    {
      id: 113,
      subject: 'Python',
      topic: 'Zip Function',
      difficulty: 'medium',
      question: `What is produced by <code>dict(zip(['a', 'b'], [1, 2]))</code>?`,
      options: ["{'a': 1, 'b': 2}", "[('a', 1), ('b', 2)]", "{'a': 'b', 1: 2}", "Error"],
      correct_answer: "{'a': 1, 'b': 2}",
      explanation: 'zip pairs parallel sequences into tuples which dict() constructs into key-value mappings.',
    },
    {
      id: 114,
      subject: 'Python',
      topic: 'Lambda Functions',
      difficulty: 'medium',
      question: `What is the output of <code>list(map(lambda x: x**2, filter(lambda x: x > 0, [-2, 0, 3, 4])))</code>?`,
      options: ['[9, 16]', '[4, 0, 9, 16]', '[3, 4]', '[9]'],
      correct_answer: '[9, 16]',
      explanation: 'filter keeps positive numbers [3, 4], and map squares them to produce [9, 16].',
    },
    {
      id: 115,
      subject: 'Python',
      topic: 'Exceptions',
      difficulty: 'medium',
      question: `In a <code>try-except-finally</code> block, when does the <code>finally</code> clause execute?`,
      options: [
        'Always, regardless of whether an exception occurred or was handled',
        'Only if an exception was caught by except',
        'Only if no exception was raised in try',
        'Only when explicitly called by sys.exit()'
      ],
      correct_answer: 'Always, regardless of whether an exception occurred or was handled',
      explanation: 'The finally block is guaranteed to run on all control-flow paths, ensuring cleanup.',
    },
    {
      id: 116,
      subject: 'Python',
      topic: 'Scope (LEGB)',
      difficulty: 'medium',
      question: `Which keyword allows modifying a variable bound in an outer non-global enclosing function scope?`,
      options: ['nonlocal', 'global', 'outer', 'scope'],
      correct_answer: 'nonlocal',
      explanation: 'nonlocal declares that a variable refers to a previously bound variable in the nearest enclosing scope.',
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
    {
      id: 117,
      subject: 'Python',
      topic: 'Decorators',
      difficulty: 'hard',
      question: `Why is <code>functools.wraps</code> used when creating custom decorator functions?`,
      options: [
        'To preserve the original function\'s __name__, __doc__, and metadata',
        'To speed up bytecode execution via JIT compilation',
        'To make the decorated function asynchronous by default',
        'To enforce type checking on decorator parameters'
      ],
      correct_answer: 'To preserve the original function\'s __name__, __doc__, and metadata',
      explanation: 'functools.wraps copies the docstrings and name attributes of the wrapped callable to avoid loss of introspection.',
    },
    {
      id: 118,
      subject: 'Python',
      topic: 'Dunder Methods',
      difficulty: 'hard',
      question: `Which special method must be defined on an object to enable the <code>with</code> context manager protocol?`,
      options: ['__enter__ and __exit__', '__open__ and __close__', '__start__ and __stop__', '__init__ and __del__'],
      correct_answer: '__enter__ and __exit__',
      explanation: 'Context managers implement __enter__() for setup and __exit__() for deterministic teardown and exception handling.',
    },
    {
      id: 119,
      subject: 'Python',
      topic: 'Memory & GIL',
      difficulty: 'hard',
      question: `What mechanism does CPython use as its primary automatic memory management model?`,
      options: [
        'Reference counting supplemented by a cyclic generational garbage collector',
        'Pure mark-and-sweep garbage collection',
        'Manual heap allocation with no reference counters',
        'Stop-the-world compaction without reference tracking'
      ],
      correct_answer: 'Reference counting supplemented by a cyclic generational garbage collector',
      explanation: 'CPython deallocates objects as soon as their reference count drops to zero, using generational GC for reference cycles.',
    },
    {
      id: 120,
      subject: 'Python',
      topic: 'Metaclasses',
      difficulty: 'hard',
      question: `What is the default metaclass of all standard classes in Python 3?`,
      options: ['type', 'object', 'Class', 'Meta'],
      correct_answer: 'type',
      explanation: 'In Python, `type` is the metaclass responsible for constructing all class objects (`isinstance(Class, type) == True`).',
    },
    {
      id: 121,
      subject: 'Python',
      topic: 'Slots',
      difficulty: 'hard',
      question: `What primary benefit does defining <code>__slots__ = ('x', 'y')</code> provide on a class?`,
      options: [
        'Prevents dynamic __dict__ creation, reducing per-instance memory footprint',
        'Makes all instance attributes strictly immutable',
        'Enables automatic JSON serialization',
        'Allows multithreaded concurrent attribute writes without locking'
      ],
      correct_answer: 'Prevents dynamic __dict__ creation, reducing per-instance memory footprint',
      explanation: '__slots__ reserves fixed attribute space in memory rather than allocating a dynamic dictionary per instance.',
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
    {
      id: 208,
      subject: 'Maths',
      topic: 'Exponents',
      difficulty: 'easy',
      question: `Simplify the algebraic expression: <code>(2³ · 2⁵) / 2⁴</code>`,
      options: ['16', '32', '8', '64'],
      correct_answer: '16',
      explanation: 'Add exponents in numerator: 3 + 5 = 8. Subtract denominator: 8 - 4 = 4. 2⁴ = 16.',
    },
    {
      id: 209,
      subject: 'Maths',
      topic: 'Trigonometry',
      difficulty: 'easy',
      question: `What is the exact value of <code>sin(π/6)</code> (or sin(30°))?`,
      options: ['1/2', '√3/2', '√2/2', '1'],
      correct_answer: '1/2',
      explanation: 'The sine of 30 degrees (π/6 radians) in a standard 30-60-90 right triangle is 1/2.',
    },
    {
      id: 210,
      subject: 'Maths',
      topic: 'Pythagorean Theorem',
      difficulty: 'easy',
      question: `If a right triangle has legs of length 5 and 12, what is the length of the hypotenuse?`,
      options: ['13', '17', '15', '√119'],
      correct_answer: '13',
      explanation: 'c = √(5² + 12²) = √(25 + 144) = √169 = 13.',
    },
    {
      id: 211,
      subject: 'Maths',
      topic: 'Arithmetic Sequences',
      difficulty: 'easy',
      question: `What is the 10th term of the arithmetic sequence: <code>3, 7, 11, 15, ...</code>?`,
      options: ['39', '43', '35', '47'],
      correct_answer: '39',
      explanation: 'a_n = a₁ + (n - 1)d. a₁₀ = 3 + 9(4) = 3 + 36 = 39.',
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
    {
      id: 212,
      subject: 'Maths',
      topic: 'Matrices',
      difficulty: 'medium',
      question: `What is the determinant of matrix <br><pre style="background:var(--bg-canvas); padding:6px; border-radius:6px; font-family:var(--font-mono); border:1px solid var(--border-subtle);">[ 4  3 ]\n[ 2  5 ]</pre>`,
      options: ['14', '26', '20', '6'],
      correct_answer: '14',
      explanation: 'det(A) = (4)(5) - (3)(2) = 20 - 6 = 14.',
    },
    {
      id: 213,
      subject: 'Maths',
      topic: 'Complex Numbers',
      difficulty: 'medium',
      question: `What is the magnitude (modulus) of the complex number <code>z = 3 - 4i</code>?`,
      options: ['5', '7', '√7', '25'],
      correct_answer: '5',
      explanation: '|z| = √(3² + (-4)²) = √(9 + 16) = √25 = 5.',
    },
    {
      id: 214,
      subject: 'Maths',
      topic: 'Limits',
      difficulty: 'medium',
      question: `Evaluate the limit: <code>lim (x → 0) [sin(5x) / x]</code>`,
      options: ['5', '1', '0', 'Undefined'],
      correct_answer: '5',
      explanation: 'Using the standard limit lim (u → 0) sin(u)/u = 1: lim 5·(sin(5x)/(5x)) = 5(1) = 5.',
    },
    {
      id: 215,
      subject: 'Maths',
      topic: 'Vectors',
      difficulty: 'medium',
      question: `What is the dot product of vectors <code>u = (2, 3, -1)</code> and <code>v = (4, -2, 5)</code>?`,
      options: ['-3', '3', '7', '14'],
      correct_answer: '-3',
      explanation: 'u · v = (2)(4) + (3)(-2) + (-1)(5) = 8 - 6 - 5 = -3.',
    },
    {
      id: 216,
      subject: 'Maths',
      topic: 'Geometric Series',
      difficulty: 'medium',
      question: `What is the sum of the infinite geometric series: <code>16 + 8 + 4 + 2 + ...</code>?`,
      options: ['32', '64', '30', '48'],
      correct_answer: '32',
      explanation: 'S = a / (1 - r) = 16 / (1 - 0.5) = 16 / 0.5 = 32.',
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
    {
      id: 217,
      subject: 'Maths',
      topic: 'Differential Equations',
      difficulty: 'hard',
      question: `What is the general solution to the first-order differential equation: <code>dy/dx + 2y = 0</code>?`,
      options: ['y = C · e^(-2x)', 'y = C · e^(2x)', 'y = -2x + C', 'y = ln(2x) + C'],
      correct_answer: 'y = C · e^(-2x)',
      explanation: 'Separating variables: dy/y = -2 dx → ln|y| = -2x + c → y = C·e^(-2x).',
    },
    {
      id: 218,
      subject: 'Maths',
      topic: 'Multivariable Calculus',
      difficulty: 'hard',
      question: `What is the gradient vector <code>∇f</code> of <code>f(x, y) = x²y + 3xy²</code> at point (1, 1)?`,
      options: ['(5, 7)', '(2, 6)', '(4, 4)', '(1, 3)'],
      correct_answer: '(5, 7)',
      explanation: '∂f/∂x = 2xy + 3y² = 2 + 3 = 5. ∂f/∂y = x² + 6xy = 1 + 6 = 7. ∇f(1, 1) = (5, 7).',
    },
    {
      id: 219,
      subject: 'Maths',
      topic: 'Rank-Nullity Theorem',
      difficulty: 'hard',
      question: `If a linear transformation T: ℝ⁵ → ℝ³ has a 2-dimensional kernel (null space), what is the rank of T?`,
      options: ['3', '2', '5', '1'],
      correct_answer: '3',
      explanation: 'Rank-Nullity Theorem states dim(V) = rank(T) + nullity(T). 5 = rank(T) + 2 → rank(T) = 3.',
    },
    {
      id: 220,
      subject: 'Maths',
      topic: 'Combinatorics',
      difficulty: 'hard',
      question: `In how many distinct ways can 8 people be seated around a circular table where rotations are identical?`,
      options: ['5040 (7!)', '40320 (8!)', '576', '2520'],
      correct_answer: '5040 (7!)',
      explanation: 'Circular permutations of n distinct objects is given by (n - 1)!. (8 - 1)! = 7! = 5040.',
    },
    {
      id: 221,
      subject: 'Maths',
      topic: 'Fourier & Series',
      difficulty: 'hard',
      question: `For a periodic even function f(x) = f(-x), what are the values of all sine coefficients b_n in its Fourier series?`,
      options: ['b_n = 0 for all n', 'b_n = a_n', 'b_n = 1/n', 'b_n = (-1)^n'],
      correct_answer: 'b_n = 0 for all n',
      explanation: 'The integral of an even function multiplied by the odd sine function over a symmetric interval is identically 0.',
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
    {
      id: 307,
      subject: 'Chemistry',
      topic: 'Atomic Structure',
      difficulty: 'easy',
      question: `How many valence electrons are present in a neutral ground-state Chlorine atom (Z = 17)?`,
      options: ['7', '5', '8', '17'],
      correct_answer: '7',
      explanation: 'Chlorine has the electron configuration [Ne] 3s² 3p⁵, containing 2 + 5 = 7 valence electrons.',
    },
    {
      id: 308,
      subject: 'Chemistry',
      topic: 'Gas Laws',
      difficulty: 'easy',
      question: `According to Boyle's Law, what happens to the volume of an ideal gas when pressure is doubled at constant temperature?`,
      options: ['Halved', 'Doubled', 'Quadrupled', 'Remains unchanged'],
      correct_answer: 'Halved',
      explanation: 'Boyle\'s Law states P₁V₁ = P₂V₂. Pressure and volume are inversely proportional.',
    },
    {
      id: 309,
      subject: 'Chemistry',
      topic: 'Periodic Trends',
      difficulty: 'easy',
      question: `Which element has the highest electronegativity value on the Pauling scale?`,
      options: ['Fluorine (F)', 'Oxygen (O)', 'Chlorine (Cl)', 'Helium (He)'],
      correct_answer: 'Fluorine (F)',
      explanation: 'Fluorine is the most electronegative element with a Pauling value of approximately 3.98.',
    },
    {
      id: 310,
      subject: 'Chemistry',
      topic: 'Molar Mass',
      difficulty: 'easy',
      question: `What is the approximate molar mass of Calcium Carbonate (CaCO₃) (Ca=40, C=12, O=16)?`,
      options: ['100 g/mol', '68 g/mol', '120 g/mol', '84 g/mol'],
      correct_answer: '100 g/mol',
      explanation: '40 + 12 + 3(16) = 40 + 12 + 48 = 100 g/mol.',
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
    {
      id: 311,
      subject: 'Chemistry',
      topic: 'Kinetics & Rate Laws',
      difficulty: 'medium',
      question: `For a reaction with rate law <code>Rate = k[A]²[B]</code>, what is the overall reaction order?`,
      options: ['3 (Third order)', '2 (Second order)', '1 (First order)', '0 (Zero order)'],
      correct_answer: '3 (Third order)',
      explanation: 'The overall reaction order is the sum of exponents: 2 + 1 = 3.',
    },
    {
      id: 312,
      subject: 'Chemistry',
      topic: 'Thermodynamics',
      difficulty: 'medium',
      question: `Under what condition is a chemical reaction always spontaneous at all temperatures?`,
      options: ['ΔH < 0 (exothermic) and ΔS > 0 (entropy increases)', 'ΔH > 0 and ΔS < 0', 'ΔH > 0 and ΔS > 0', 'ΔH < 0 and ΔS < 0'],
      correct_answer: 'ΔH < 0 (exothermic) and ΔS > 0 (entropy increases)',
      explanation: 'In ΔG = ΔH - TΔS, negative ΔH and positive ΔS ensure ΔG is strictly negative at all absolute temperatures.',
    },
    {
      id: 313,
      subject: 'Chemistry',
      topic: 'Electrochemistry',
      difficulty: 'medium',
      question: `In a standard galvanic cell, at which electrode does oxidation occur?`,
      options: ['Anode', 'Cathode', 'Salt bridge', 'Both electrodes equally'],
      correct_answer: 'Anode',
      explanation: 'Oxidation occurs at the anode (An Ox), while reduction occurs at the cathode (Red Cat).',
    },
    {
      id: 314,
      subject: 'Chemistry',
      topic: 'Hybridization',
      difficulty: 'medium',
      question: `What is the hybridization and molecular geometry of the central carbon in ethene (C₂H₄)?`,
      options: ['sp² (Trigonal planar)', 'sp³ (Tetrahedral)', 'sp (Linear)', 'sp³d (Trigonal bipyramidal)'],
      correct_answer: 'sp² (Trigonal planar)',
      explanation: 'Each double-bonded carbon in ethene forms 3 sigma bonds and 1 pi bond, adopting sp² trigonal planar geometry.',
    },
    {
      id: 315,
      subject: 'Chemistry',
      topic: 'Buffer Solutions',
      difficulty: 'medium',
      question: `What equation is used to calculate the pH of an acid-base buffer solution from pKa and concentration ratios?`,
      options: ['Henderson-Hasselbalch equation', 'Nernst equation', 'Arrhenius equation', 'Van \'t Hoff equation'],
      correct_answer: 'Henderson-Hasselbalch equation',
      explanation: 'pH = pKa + log([A⁻]/[HA]) is the fundamental Henderson-Hasselbalch buffer relationship.',
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
    {
      id: 316,
      subject: 'Chemistry',
      topic: 'Crystal Field Theory',
      difficulty: 'hard',
      question: `Which ligand is classified as a strong-field ligand according to the spectrochemical series, causing low-spin octahedral complexes?`,
      options: ['CN⁻ (Cyanide)', 'I⁻ (Iodide)', 'Br⁻ (Bromide)', 'Cl⁻ (Chloride)'],
      correct_answer: 'CN⁻ (Cyanide)',
      explanation: 'Cyanide (CN⁻) and CO are strong-field pi-acceptor ligands with large crystal field splitting (Δo), favoring low-spin states.',
    },
    {
      id: 317,
      subject: 'Chemistry',
      topic: 'Pericyclic Reactions',
      difficulty: 'hard',
      question: `The Diels-Alder reaction between a conjugated diene and a dienophile is classified as what type of pericyclic process?`,
      options: ['[4+2] Cycloaddition', '[2+2] Photochemical addition', '[3,3] Sigmatropic shift', 'Electrocyclic ring opening'],
      correct_answer: '[4+2] Cycloaddition',
      explanation: 'The thermally allowed Diels-Alder reaction proceeds via a concerted [4π + 2π] suprafacial cycloaddition.',
    },
    {
      id: 318,
      subject: 'Chemistry',
      topic: 'NMR Spectroscopy',
      difficulty: 'hard',
      question: `In ¹H-NMR spectroscopy, what causes spin-spin splitting observed as the (n + 1) rule?`,
      options: [
        'Coupling through chemical bonds with non-equivalent neighboring protons',
        'Spin-lattice relaxation time differences (T1)',
        'Paramagnetic shielding from the external magnet',
        'Direct through-space nuclear Overhauser enhancement'
      ],
      correct_answer: 'Coupling through chemical bonds with non-equivalent neighboring protons',
      explanation: 'Scalar J-coupling mediated through electrons in chemical bonds splits resonances based on n adjacent non-equivalent protons.',
    },
    {
      id: 319,
      subject: 'Chemistry',
      topic: 'Quantum Chemistry',
      difficulty: 'hard',
      question: `According to Hund's rule of maximum multiplicity, how are degenerate orbitals filled with electrons in the ground state?`,
      options: [
        'Singly with parallel spins before any orbital is doubly occupied',
        'Doubly occupied in the lowest spatial coordinate first',
        'With alternating antiparallel spins in adjacent orbitals',
        'Randomly based on Heisenberg uncertainty principle'
      ],
      correct_answer: 'Singly with parallel spins before any orbital is doubly occupied',
      explanation: 'Electrons maximize total spin multiplicity by occupying degenerate subshells singly with parallel spins to minimize Coulomb repulsion.',
    },
    {
      id: 320,
      subject: 'Chemistry',
      topic: 'Electrochemistry (Nernst)',
      difficulty: 'hard',
      question: `For a 2-electron redox reaction at 298 K, by how much does the cell potential (E) change when the reaction quotient Q increases tenfold?`,
      options: ['Decreases by 0.0296 V', 'Increases by 0.0592 V', 'Decreases by 0.0592 V', 'Remains unchanged'],
      correct_answer: 'Decreases by 0.0296 V',
      explanation: 'E = E° - (0.0592 / n) log₁₀(Q). For n = 2 and log₁₀(10) = 1: change is -0.0592 / 2 = -0.0296 V.',
    },
    {
      id: 321,
      subject: 'Chemistry',
      topic: 'Aromaticity (Hückel)',
      difficulty: 'hard',
      question: `Which criterion is required for a planar cyclic conjugated system to exhibit Hückel aromaticity?`,
      options: ['(4n + 2) π-electrons where n is a non-negative integer', '4n π-electrons where n is an integer', 'Exactly 6 σ-bonds in the ring', 'An odd number of conjugated heteroatoms'],
      correct_answer: '(4n + 2) π-electrons where n is a non-negative integer',
      explanation: 'Hückel\'s rule requires a planar, uninterrupted cyclic pi-electron cloud containing (4n + 2) delocalized pi electrons.',
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
  timestamp?: string
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
  const [profileTab, setProfileTab] = useState<'profile' | 'history'>('profile')
  const [historySearchQuery, setHistorySearchQuery] = useState<string>('')
  const [isChatHistoryModalOpen, setIsChatHistoryModalOpen] = useState<boolean>(false)
  const [isRefreshingHistory, setIsRefreshingHistory] = useState<boolean>(false)
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
    videoUrl?: string
    videoTitle?: string
    videoChannel?: string
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
    videoUrl?: string
    videoTitle?: string
    videoChannel?: string
  }

  // Full-Page Study Calendar State
  const [calendarModalOpen, setCalendarModalOpen] = useState<boolean>(false)
  const [calYear, setCalYear] = useState<number>(2026)
  const [calMonth, setCalMonth] = useState<number>(8) // September = 8 (0-indexed)
  const [selectedCalDay, setSelectedCalDay] = useState<number>(12)
  const [calendarSyncActive, setCalendarSyncActive] = useState<boolean>(false)

  // Google Calendar Inspired State
  const [gcalView, setGcalView] = useState<'week' | 'month' | 'day' | 'agenda'>('week')
  const [gcalSidebarOpen, setGcalSidebarOpen] = useState<boolean>(true)
  const [miniCalYear, setMiniCalYear] = useState<number>(2026)
  const [miniCalMonth, setMiniCalMonth] = useState<number>(8)
  const [selectedSubjects, setSelectedSubjects] = useState<Record<string, boolean>>({
    Maths: true,
    Chemistry: true,
    Python: true,
    'AI Systems': true,
    Exams: true,
  })
  const [gcalSearchQuery, setGcalSearchQuery] = useState<string>('')
  const [gcalActiveEvent, setGcalActiveEvent] = useState<(CalTaskItem & { dateKey?: string }) | null>(null)
  const [gcalQuickCreateOpen, setGcalQuickCreateOpen] = useState<boolean>(false)

  // Calendar Drag and Drop State
  const [draggedCalEvent, setDraggedCalEvent] = useState<{
    task: CalTaskItem
    sourceDateKey: string
    durationMinutes: number
  } | null>(null)
  const [dragOverCol, setDragOverCol] = useState<{
    dateKey: string
    snappedMinutes: number
    timeSlotPreview: string
  } | null>(null)
  const [dragOverMonthDay, setDragOverMonthDay] = useState<number | null>(null)

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
    if (gcalSearchQuery.trim()) {
      const q = gcalSearchQuery.toLowerCase()
      const matches =
        task.title.toLowerCase().includes(q) ||
        task.subject.toLowerCase().includes(q) ||
        task.timeSlot.toLowerCase().includes(q)
      if (!matches) return false
    }

    const isExam =
      task.title.toLowerCase().includes('exam') ||
      task.title.toLowerCase().includes('midterm')
    if (isExam && !selectedSubjects['Exams']) return false

    const sub = task.subject || 'Maths'
    if (selectedSubjects[sub] === false) return false

    return true
  }

  const parseTimeSlot = (timeSlot: string) => {
    let startMinutes = 9 * 60
    let durationMinutes = 60

    try {
      const parts = timeSlot.split(/[–-]/)
      if (parts.length >= 2) {
        const startStr = parts[0].trim()
        const endStr = parts[1].trim()

        const isEndPM = endStr.toLowerCase().includes('pm')
        const isStartPM =
          startStr.toLowerCase().includes('pm') ||
          (isEndPM && !startStr.toLowerCase().includes('am') && parseInt(startStr, 10) < 12 && parseInt(startStr, 10) >= 1 && parseInt(endStr, 10) !== 12)

        const startMatch = startStr.match(/(\d+)(?::(\d+))?/)
        const endMatch = endStr.match(/(\d+)(?::(\d+))?/)

        if (startMatch) {
          let h = parseInt(startMatch[1], 10)
          const m = startMatch[2] ? parseInt(startMatch[2], 10) : 0
          if (isStartPM && h < 12) h += 12
          if (!isStartPM && h === 12 && startStr.toLowerCase().includes('am')) h = 0
          startMinutes = h * 60 + m
        }

        if (endMatch) {
          let h = parseInt(endMatch[1], 10)
          const m = endMatch[2] ? parseInt(endMatch[2], 10) : 0
          if (isEndPM && h < 12) h += 12
          const endMinutes = h * 60 + m
          if (endMinutes > startMinutes) {
            durationMinutes = endMinutes - startMinutes
          }
        }
      }
    } catch {
      // fallback
    }

    return { startMinutes, durationMinutes }
  }

  const formatMinutesToTimeSlot = (startMinutes: number, durationMinutes: number): string => {
    const safeDuration = Math.max(15, durationMinutes || 60)
    const startH = Math.floor(startMinutes / 60)
    const startM = startMinutes % 60
    const startH12 = startH % 12 === 0 ? 12 : startH % 12
    const startAmPm = startH >= 12 && startH < 24 ? 'PM' : 'AM'
    const startMStr = startM === 0 ? ':00' : `:${String(startM).padStart(2, '0')}`

    const endMinutes = startMinutes + safeDuration
    const endH = Math.floor(endMinutes / 60)
    const endM = endMinutes % 60
    const endH12 = endH % 12 === 0 ? 12 : endH % 12
    const endAmPm = endH >= 12 && endH < 24 ? 'PM' : 'AM'
    const endMStr = endM === 0 ? ':00' : `:${String(endM).padStart(2, '0')}`

    if (startAmPm === endAmPm) {
      return `${startH12}${startMStr}–${endH12}${endMStr} ${endAmPm}`
    } else {
      return `${startH12}${startMStr} ${startAmPm}–${endH12}${endMStr} ${endAmPm}`
    }
  }

  const getTopicYoutubeVideo = (subject: string, topic: string) => {
    const sLower = (subject || '').toLowerCase()
    const tLower = (topic || '').toLowerCase()

    if (sLower.includes('python') || tLower.includes('loop') || tLower.includes('comprehension') || tLower.includes('async')) {
      if (tLower.includes('async')) {
        return {
          title: 'Intro to async Python | Writing a Web Crawler',
          channel: 'mCoding',
          url: 'https://www.youtube.com/watch?v=ftmdDlwMwwQ',
        }
      }
      if (tLower.includes('comprehension')) {
        return {
          title: 'Python Tutorial: Comprehensions - How they work & why you should use them',
          channel: 'Corey Schafer',
          url: 'https://www.youtube.com/watch?v=3dt4OGnU5sM',
        }
      }
      return {
        title: 'Python Tutorial for Beginners: Loops and Iterations - For/While Loops',
        channel: 'Corey Schafer',
        url: 'https://www.youtube.com/watch?v=6iF8Xb7Z3wQ',
      }
    }

    if (sLower.includes('math') || tLower.includes('algebra') || tLower.includes('vector') || tLower.includes('matrix')) {
      return {
        title: 'Vectors & Linear Transformations | Essence of linear algebra',
        channel: '3Blue1Brown',
        url: 'https://www.youtube.com/watch?v=fNk_zzaMoSs',
      }
    }
    if (tLower.includes('calculus') || tLower.includes('derivative') || tLower.includes('integral')) {
      return {
        title: 'The Essence of Calculus | Visual Introduction',
        channel: '3Blue1Brown',
        url: 'https://www.youtube.com/watch?v=WUvTyaaNkzM',
      }
    }

    if (sLower.includes('chem') || tLower.includes('reaction') || tLower.includes('organic') || tLower.includes('nernst')) {
      if (tLower.includes('nernst') || tLower.includes('electro')) {
        return {
          title: 'Nernst Equation Explained, Electrochemistry, Example Problems',
          channel: 'The Organic Chemistry Tutor',
          url: 'https://www.youtube.com/watch?v=jousNNceCXs',
        }
      }
      return {
        title: 'Organic Chemistry Reaction Mechanisms - Addition, Elimination, Substitution',
        channel: 'The Organic Chemistry Tutor',
        url: 'https://www.youtube.com/watch?v=Efh5GkVbhEc',
      }
    }

    if (sLower.includes('ai') || tLower.includes('transformer') || tLower.includes('attention')) {
      return {
        title: 'Attention in transformers, step-by-step | Deep Learning Chapter 6',
        channel: '3Blue1Brown',
        url: 'https://www.youtube.com/watch?v=eMlx5fFNoYc',
      }
    }

    const query = encodeURIComponent(`${subject} ${topic} tutorial masterclass`)
    return {
      title: `Master ${topic} Full Educational Walkthrough`,
      channel: 'Curated YouTube Tutorial',
      url: `https://www.youtube.com/results?search_query=${query}`,
    }
  }

  const getQuizTierResources = (
    subject: string,
    _topic: string,
    totalCorrect: number,
    userAnswers: { question_id: number; selected_answer: string; isCorrect: boolean }[],
    questions: QuizQuestionItem[]
  ) => {
    const sLower = (subject || '').toLowerCase()

    let tier: 1 | 2 | 3 | 4 = 1
    if (totalCorrect <= 3) {
      tier = 1
    } else if (totalCorrect <= 6) {
      tier = 2
    } else if (totalCorrect <= 8) {
      tier = 3
    } else {
      tier = 4
    }

    // Find lagging aspect from missed questions
    const wrongQuestions = userAnswers
      .map((ans, idx) => ({ ans, q: questions[idx] }))
      .filter(({ ans }) => !ans.isCorrect)

    let laggingAspectArea = 'Core Foundations & Edge Cases'
    let laggingAdvice = 'Review core syntax, boundary conditions, and state mutations.'

    if (sLower.includes('python')) {
      if (wrongQuestions.some((w) => (w.q?.question || '').toLowerCase().includes('async') || (w.q?.question || '').toLowerCase().includes('await'))) {
        laggingAspectArea = 'Asynchronous Concurrency & Event Loop'
        laggingAdvice = 'Focus on async task scheduling, await syntax, and handling unhandled coroutine exceptions.'
      } else if (wrongQuestions.some((w) => (w.q?.question || '').toLowerCase().includes('comprehension') || (w.q?.question || '').toLowerCase().includes('generator'))) {
        laggingAspectArea = 'Comprehensions & Lazy Evaluation'
        laggingAdvice = 'Practice nested list comprehensions, conditional filtering, and generator memory profiles.'
      } else {
        laggingAspectArea = 'Data Structure Mutability & Scope Resolution'
        laggingAdvice = 'Work on distinguishing shallow vs deep copies, LEGB variable scoping rules, and default argument traps.'
      }
    } else if (sLower.includes('math')) {
      if (wrongQuestions.some((w) => (w.q?.question || '').toLowerCase().includes('eigen') || (w.q?.question || '').toLowerCase().includes('matrix'))) {
        laggingAspectArea = 'Matrix Decompositions & Eigenvalues'
        laggingAdvice = 'Work on calculating characteristic polynomials det(A - λI) = 0 and orthogonal diagonalization.'
      } else if (wrongQuestions.some((w) => (w.q?.question || '').toLowerCase().includes('vector') || (w.q?.question || '').toLowerCase().includes('span'))) {
        laggingAspectArea = 'Vector Projections & Orthonormal Bases'
        laggingAdvice = 'Review Gram-Schmidt orthogonalization and projection formulas onto subspaces.'
      } else {
        laggingAspectArea = 'Linear Transformations & Invertibility'
        laggingAdvice = 'Focus on rank-nullity theorem proofs and determinant geometric transformations.'
      }
    } else if (sLower.includes('chem')) {
      if (wrongQuestions.some((w) => (w.q?.question || '').toLowerCase().includes('nernst') || (w.q?.question || '').toLowerCase().includes('cell'))) {
        laggingAspectArea = 'Electrochemistry & Non-Standard Potentials'
        laggingAdvice = 'Work on calculating reaction quotients (Q) and applying the Nernst equation with correct electron moles (n).'
      } else {
        laggingAspectArea = 'Reaction Mechanisms & Transition States'
        laggingAdvice = 'Focus on nucleophilic attack stereochemistry, solvent effects in SN1 vs SN2, and carbocation stability.'
      }
    }

    // Pointers & Short Notes (Tier 2)
    let pointers: string[] = []
    let shortNotes: { title: string; body: string }[] = []

    if (sLower.includes('python')) {
      pointers = [
        'Mind mutable default arguments: def fn(x=[]) reuses the exact same list across calls.',
        'Use dict.get(k, default) instead of indexing dict[k] to gracefully handle missing keys without KeyError.',
        'Prefer generator expressions (x for x in seq) over list comprehensions when streaming large datasets.',
        'Remember LEGB rule (Local, Enclosing, Global, Built-in) when debugging variable scope issues.',
      ]
      shortNotes = [
        {
          title: 'List Comprehensions',
          body: '[expr for x in iterable if cond] filters before evaluation. For if-else transformation: [a if cond else b for x in iterable].',
        },
        {
          title: 'Dictionary Lookup & Mutability',
          body: 'Dict keys must be hashable/immutable (str, int, tuple). dict.setdefault(k, v) inserts only if absent.',
        },
        {
          title: 'Shallow vs Deep Copies',
          body: 'list.copy() / [:] creates shallow copy of container. copy.deepcopy() recursively clones nested mutable objects.',
        },
        {
          title: 'Context Managers',
          body: 'with open(...) guarantees resource release via __enter__() and __exit__() even if exceptions occur.',
        },
      ]
    } else if (sLower.includes('math')) {
      pointers = [
        'Check determinant first: det(A) ≠ 0 confirms matrix invertibility and full rank.',
        'Eigenvalues satisfy det(A - λI) = 0; eigenvectors satisfy (A - λI)v = 0.',
        'Dot product u · v = 0 proves geometric orthogonality in any dimensional Euclidean space.',
        'Rank-Nullity theorem: Rank(A) + Nullity(A) = total number of columns n.',
      ]
      shortNotes = [
        {
          title: 'Matrix Inverses & Determinants',
          body: 'For 2x2 matrix [[a,b],[c,d]], det = ad - bc. Inverse A⁻¹ = (1/det) * [[d, -b], [-c, a]].',
        },
        {
          title: 'Eigenvalues & Invariance',
          body: 'Av = λv. The sum of eigenvalues equals trace(A); the product of eigenvalues equals det(A).',
        },
        {
          title: 'Vector Orthogonality & Projections',
          body: 'proj_b(a) = ((a · b) / ||b||²) * b. Gram-Schmidt constructs orthonormal bases from linearly independent vectors.',
        },
        {
          title: 'SVD & Rank',
          body: 'Any m x n matrix factors into A = U Σ Vᵀ with orthogonal U, V and non-negative diagonal singular values.',
        },
      ]
    } else {
      // Chemistry
      pointers = [
        'Carefully identify reaction quotient Q vs equilibrium constant K before applying Nernst equation.',
        'Distinguish SN1 (stepwise via carbocation, polar protic solvent) from SN2 (concerted inversion, polar aprotic solvent).',
        'Use Le Chatelier’s principle: exothermic reactions shift left when temperature is raised.',
        'Zaitsev’s rule predicts the more substituted alkene as the major elimination product.',
      ]
      shortNotes = [
        {
          title: 'Nernst Equation (298 K)',
          body: 'E_cell = E°_cell - (0.0592 / n) * log10(Q). At equilibrium, E_cell = 0 and Q = K.',
        },
        {
          title: 'SN1 vs SN2 Mechanisms',
          body: 'SN2: 1-step, bimolecular, backside attack with Walden inversion. SN1: 2-step with carbocation intermediate and racemization.',
        },
        {
          title: 'Buffer Capacity & Henderson-Hasselbalch',
          body: 'pH = pKa + log([A⁻]/[HA]). Effective buffering range is pKa ± 1; maximum capacity occurs when [A⁻] = [HA].',
        },
        {
          title: 'Thermodynamics & Spontaneity',
          body: 'ΔG° = ΔH° - TΔS° = -RT ln(K) = -nFE°_cell. Negative ΔG° indicates a thermodynamically spontaneous forward process.',
        },
      ]
    }

    // Cheat Sheet (Tier 3)
    let cheatSheet: { category: string; rules: string[] }[] = []
    if (sLower.includes('python')) {
      cheatSheet = [
        {
          category: 'Syntax & Comprehensions',
          rules: [
            'List: `[x for x in seq if cond]`',
            'Dict: `{k: v for k, v in pairs}`',
            'Set: `{x for x in seq}`',
            'Ternary: `x if cond else y`',
          ],
        },
        {
          category: 'Iterators & Generators',
          rules: [
            '`yield` pauses function state & returns generator object',
            '`zip(*iterables)` stops at shortest iterator',
            '`itertools.chain(*iters)` flattens sequential iterables',
            '`functools.lru_cache(maxsize=128)` caches function outputs',
          ],
        },
        {
          category: 'Scope & Mutability',
          rules: [
            'Default args evaluate once at def time (`def fn(x=None)`)',
            '`is` checks pointer/identity; `==` checks value equality',
            'CPython GIL permits only 1 native thread per interpreter',
            '`__slots__ = ("a", "b")` eliminates `__dict__` overhead',
          ],
        },
        {
          category: 'Error & Context Handling',
          rules: [
            '`try-except-else-finally`: `else` runs only if no exception',
            '`with open(f) as h:` handles auto-close via `__exit__`',
            '`raise CustomError("msg") from original_err` preserves traceback',
            '`contextlib.contextmanager` decorator converts generators to managers',
          ],
        },
      ]
    } else if (sLower.includes('math')) {
      cheatSheet = [
        {
          category: 'Linear Algebra Transformations',
          rules: [
            'Determinant: `det(AB) = det(A)det(B)`',
            'Inverse: `(AB)⁻¹ = B⁻¹A⁻¹`',
            'Transpose: `(AB)ᵀ = BᵀAᵀ`',
            'Rank: `Rank(A) = Rank(Aᵀ) = dim(Col(A))`',
          ],
        },
        {
          category: 'Spectral Theory & Eigenvalues',
          rules: [
            'Characteristic eq: `det(A - λI) = 0`',
            'Trace invariant: `tr(A) = ∑ λᵢ = ∑ aᵢᵢ`',
            'Det invariant: `det(A) = ∏ λᵢ`',
            'Symmetric matrices have real eigenvalues & orthogonal eigenvectors',
          ],
        },
        {
          category: 'Vector Spaces & Orthogonality',
          rules: [
            'Dot Product: `u · v = ||u|| ||v|| cos θ`',
            'Projection: `proj_v(u) = ((u·v)/||v||²) v`',
            'Orthogonal Matrix: `QᵀQ = I ⟹ Q⁻¹ = Qᵀ`',
            'Cauchy-Schwarz: `|u · v| ≤ ||u|| ||v||`',
          ],
        },
        {
          category: 'Calculus & Optimization',
          rules: [
            'Gradient: `∇f(x)` points in direction of steepest ascent',
            'Hessian `H`: Positive definite `H > 0` ⟹ local minimum',
            'Chain Rule: `d/dx [f(g(x))] = f\'(g(x)) · g\'(x)`',
            'Integration by parts: `∫ u dv = uv - ∫ v du`',
          ],
        },
      ]
    } else {
      cheatSheet = [
        {
          category: 'Electrochemistry & Cells',
          rules: [
            'Nernst: `E = E° - (0.0592/n) log Q` at 298 K',
            'Free Energy: `ΔG° = -nFE°_cell` (`F = 96,485 C/mol`)',
            'Galvanic cell: Anode (oxidation, -), Cathode (reduction, +)',
            'Standard Hydrogen Electrode: `E° = 0.00 V`',
          ],
        },
        {
          category: 'Organic Reaction Pathways',
          rules: [
            '`SN2`: 1-step, inversion, 1° > 2° > 3°, polar aprotic solvent',
            '`SN1`: 2-step, carbocation, 3° > 2° > 1°, polar protic solvent',
            '`E2`: Anti-periplanar geometry, strong base, Zaitsev major',
            '`Markovnikov`: H adds to C with more H’s (stable carbocation)',
          ],
        },
        {
          category: 'Kinetics & Equilibrium',
          rules: [
            'Arrhenius: `k = A e^(-Ea / RT)`',
            '1st Order: `t₁/₂ = 0.693 / k`, `ln[A]_t = -kt + ln[A]_0`',
            '2nd Order: `1/[A]_t = kt + 1/[A]_0`',
            'Equilibrium: `ΔG° = -RT ln K`',
          ],
        },
        {
          category: 'Acids, Bases & Buffers',
          rules: [
            'Henderson-Hasselbalch: `pH = pKa + log([A⁻]/[HA])`',
            '`Kw = [H⁺][OH⁻] = 1.0 × 10⁻¹⁴` at 25 °C (`pH + pOH = 14`)',
            '`pKa = -log(Ka)`, Stronger acid ⟹ lower pKa, higher Ka',
            'Buffer capacity highest when `[A⁻] = [HA]` ⟹ `pH = pKa`',
          ],
        },
      ]
    }

    // Question Bank (25 questions for Tier 4)
    const questionBanks: Record<string, { id: number; question: string; answer: string; hint: string }[]> = {
      python: [
        { id: 1, question: 'What is the output of `[x**2 for x in range(5) if x % 2 != 0]`?', answer: '[1, 9]', hint: 'Only odd numbers 1 and 3 are squared.' },
        { id: 2, question: 'How does `dict.get(key, default)` differ from `dict[key]`?', answer: 'Returns default without raising KeyError.', hint: 'Safe dictionary lookup.' },
        { id: 3, question: 'What is the time complexity of appending an element to a Python list?', answer: 'Amortized O(1)', hint: 'Dynamic array doubling.' },
        { id: 4, question: 'How do you create an immutable set in Python?', answer: 'frozenset()', hint: 'Built-in frozen set constructor.' },
        { id: 5, question: 'What is the key difference between `is` and `==`?', answer: 'is checks memory identity; == checks equality of value.', hint: 'Object identity vs equality.' },
        { id: 6, question: 'What keyword turns a standard function into a generator?', answer: 'yield', hint: 'Suspends execution and yields values lazily.' },
        { id: 7, question: 'What does the `@property` decorator do on a class method?', answer: 'Exposes the method as a read-only getter attribute.', hint: 'Pythonic attribute access.' },
        { id: 8, question: 'How do `*args` and `**kwargs` unpack parameters in function calls?', answer: '*args unpacks tuples; **kwargs unpacks dictionaries.', hint: 'Variable positional and keyword arguments.' },
        { id: 9, question: 'What is the GIL in CPython and what does it restrict?', answer: 'Global Interpreter Lock; restricts execution to one native thread at a time.', hint: 'CPython thread synchronization.' },
        { id: 10, question: 'What is the difference between shallow copy and deepcopy?', answer: 'deepcopy clones nested structures recursively; shallow copy copies only top-level references.', hint: 'Nested object isolation.' },
        { id: 11, question: 'What boolean value do empty containers `[]`, `{}`, `set()` evaluate to in if conditions?', answer: 'False', hint: 'Python falsy evaluation.' },
        { id: 12, question: 'How do you catch multiple exception types in a single except block?', answer: 'except (TypeError, ValueError) as e:', hint: 'Pass exceptions as a tuple.' },
        { id: 13, question: 'What is the output of `type(lambda x: x)`?', answer: '<class \'function\'>', hint: 'Lambdas create first-class function objects.' },
        { id: 14, question: 'How do you reverse a list in-place in Python?', answer: 'list.reverse()', hint: 'Modifies the existing list without creating a new copy.' },
        { id: 15, question: 'What is produced by `list(zip([1, 2], [\'a\', \'b\', \'c\']))`?', answer: '[(1, \'a\'), (2, \'b\')]', hint: 'Stops at the length of the shortest iterable.' },
        { id: 16, question: 'What algorithm computes Method Resolution Order (MRO) for multiple inheritance?', answer: 'C3 Linearization', hint: 'Deterministic hierarchy ordering.' },
        { id: 17, question: 'What built-in statement manages context protocols safely?', answer: 'with statement', hint: 'Calls __enter__ and __exit__.' },
        { id: 18, question: 'What dunder methods implement the Context Manager protocol?', answer: '__enter__ and __exit__', hint: 'Used for setup and teardown cleanup.' },
        { id: 19, question: 'What does `any([False, 0, "", 42])` evaluate to?', answer: 'True', hint: '42 is non-zero and truthy.' },
        { id: 20, question: 'How do you deduplicate a list while preserving original insertion order in Python 3.7+?', answer: 'list(dict.fromkeys(seq))', hint: 'Leverages insertion-ordered dictionary keys.' },
        { id: 21, question: 'What decorator in `functools` provides memoization?', answer: '@functools.lru_cache()', hint: 'Least Recently Used cache.' },
        { id: 22, question: 'What does defining `__slots__` inside a class achieve?', answer: 'Prevents __dict__ creation, reducing memory footprint and speeding attribute lookup.', hint: 'Memory optimization.' },
        { id: 23, question: 'How do you verify whether a class inherits from another class?', answer: 'issubclass(Child, Parent)', hint: 'Built-in inheritance check.' },
        { id: 24, question: 'What is the difference between `asyncio.gather` and `asyncio.wait`?', answer: 'gather returns results in order; wait returns sets of completed and pending futures.', hint: 'Async concurrency helpers.' },
        { id: 25, question: 'What is the average time complexity of dict lookup in Python?', answer: 'O(1)', hint: 'Hash table indexing.' },
      ],
      math: [
        { id: 1, question: 'What is the determinant of a 2x2 matrix [[a, b], [c, d]]?', answer: 'ad - bc', hint: 'Product of main diagonal minus product of off-diagonal.' },
        { id: 2, question: 'If Av = λv, what are v and λ?', answer: 'v is the eigenvector; λ is the scalar eigenvalue.', hint: 'Invariant direction transformation.' },
        { id: 3, question: 'What is the dot product of two mutually orthogonal vectors?', answer: '0', hint: 'cos(90°) = 0.' },
        { id: 4, question: 'What is the derivative of ln(x) for x > 0?', answer: '1/x', hint: 'Fundamental rate of logarithmic change.' },
        { id: 5, question: 'What is the rank of a matrix?', answer: 'The maximum number of linearly independent column or row vectors.', hint: 'Dimension of column space.' },
        { id: 6, question: 'What is the indefinite integral of e^(3x) dx?', answer: '(1/3) e^(3x) + C', hint: 'Inverse chain rule factor.' },
        { id: 7, question: 'When is a square matrix guaranteed to be invertible?', answer: 'When det(A) ≠ 0 (full rank).', hint: 'Non-zero determinant condition.' },
        { id: 8, question: 'To which vectors is the cross product u × v orthogonal?', answer: 'Orthogonal to both vector u and vector v.', hint: 'Normal vector to the span plane.' },
        { id: 9, question: 'What is the trace of a square matrix?', answer: 'The sum of the diagonal elements (also equal to the sum of eigenvalues).', hint: 'Diagonal sum invariant.' },
        { id: 10, question: 'State the product rule for differentiation d/dx [u(x)v(x)].', answer: 'u\'(x)v(x) + u(x)v\'(x)', hint: 'Derivative of first times second plus first times derivative of second.' },
        { id: 11, question: 'What does |det(A)| represent geometrically for a 3x3 matrix?', answer: 'The volume scaling factor of the transformed parallelepiped.', hint: 'Volume transformation factor.' },
        { id: 12, question: 'What is the limit of sin(x)/x as x approaches 0?', answer: '1', hint: 'Standard trigonometric limit / L\'Hôpital\'s rule.' },
        { id: 13, question: 'What is the formula for vector projection of a onto b?', answer: '((a · b) / ||b||²) * b', hint: 'Scalar component multiplied by unit direction.' },
        { id: 14, question: 'What is guaranteed about the eigenvalues of any real symmetric matrix?', answer: 'All eigenvalues are strictly real numbers.', hint: 'Spectral theorem guarantee.' },
        { id: 15, question: 'What is a Taylor series centered at x = 0 called?', answer: 'Maclaurin Series', hint: 'Special case of Taylor expansion.' },
        { id: 16, question: 'What direction does the gradient vector ∇f point towards?', answer: 'The direction of steepest ascent (maximum increase).', hint: 'Maximum rate of change.' },
        { id: 17, question: 'What equation defines an orthogonal matrix Q?', answer: 'QᵀQ = QQᵀ = I (Q⁻¹ = Qᵀ)', hint: 'Orthonormal rows and columns.' },
        { id: 18, question: 'Evaluate ∫ x cos(x) dx using integration by parts.', answer: 'x sin(x) + cos(x) + C', hint: 'Set u = x, dv = cos(x)dx.' },
        { id: 19, question: 'State the Rank-Nullity Theorem for an m x n matrix A.', answer: 'Rank(A) + Nullity(A) = n (number of columns)', hint: 'Dimension of image plus kernel.' },
        { id: 20, question: 'What is Euler\'s formula relating complex exponentials to trigonometry?', answer: 'e^(iθ) = cos(θ) + i sin(θ)', hint: 'Complex unit circle representation.' },
        { id: 21, question: 'What is the derivative of arctan(x)?', answer: '1 / (1 + x²)', hint: 'Standard inverse tangent derivative.' },
        { id: 22, question: 'What defines a symmetric positive definite matrix A?', answer: 'xᵀAx > 0 for all non-zero vectors x (all eigenvalues > 0).', hint: 'Positive quadratic form.' },
        { id: 23, question: 'What does f\'(c) = 0 and f\'\'(c) > 0 indicate about point c?', answer: 'c is a local minimum.', hint: 'Second derivative concavity test.' },
        { id: 24, question: 'How is the L2 Euclidean norm ||x||₂ defined?', answer: '√(∑ xᵢ²) = √(x · x)', hint: 'Square root of sum of squares.' },
        { id: 25, question: 'What does Singular Value Decomposition (SVD) decompose A into?', answer: 'A = U Σ Vᵀ', hint: 'Orthogonal matrices and diagonal singular values.' },
      ],
      chem: [
        { id: 1, question: 'What is the Nernst Equation for cell potential at 298 K?', answer: 'E = E° - (0.0592 / n) log10(Q)', hint: 'Relates non-standard potential to reaction quotient.' },
        { id: 2, question: 'What is the hybridization of carbon in ethylene (C2H4)?', answer: 'sp²', hint: 'Trigonal planar geometry with one unhybridized p orbital.' },
        { id: 3, question: 'What is the integrated rate law for a 2nd order reaction?', answer: '1/[A]_t = kt + 1/[A]_0', hint: 'Reciprocal concentration vs time.' },
        { id: 4, question: 'How does an exothermic equilibrium shift when temperature is increased?', answer: 'Shifts left towards reactants.', hint: 'Le Chatelier\'s principle; heat is treated as a product.' },
        { id: 5, question: 'What mechanism features a 1-step backside attack with Walden inversion?', answer: 'SN2 mechanism', hint: 'Bimolecular nucleophilic substitution.' },
        { id: 6, question: 'What equation relates ΔG° to equilibrium constant K?', answer: 'ΔG° = -RT ln(K)', hint: 'Thermodynamic equilibrium relationship.' },
        { id: 7, question: 'Which rule states that the most substituted alkene is the major elimination product?', answer: 'Zaitsev\'s Rule', hint: 'Thermodynamic stability of alkene double bonds.' },
        { id: 8, question: 'What is the pH of a solution with [H⁺] = 1.0 × 10⁻⁴ M?', answer: 'pH = 4.0', hint: 'pH = -log10[H⁺].' },
        { id: 9, question: 'What is the oxidation state of Chromium in K2Cr2O7?', answer: '+6', hint: '2(+1) + 2(Cr) + 7(-2) = 0.' },
        { id: 10, question: 'Which catalyst is used in catalytic alkene hydrogenation?', answer: 'Finely divided Pt, Pd, or Ni', hint: 'Transition metal heterogeneous catalyst.' },
        { id: 11, question: 'State Raoult\'s Law for vapor pressure of an ideal solution component.', answer: 'P_A = X_A · P°_A', hint: 'Partial pressure equals mole fraction times pure vapor pressure.' },
        { id: 12, question: 'What rule dictates that electrophilic H adds to the less substituted carbon?', answer: 'Markovnikov\'s Rule', hint: 'Forms the more stable carbocation intermediate.' },
        { id: 13, question: 'What is the half-life equation for a first-order reaction?', answer: 't₁/₂ = ln(2) / k ≈ 0.693 / k', hint: 'Independent of initial concentration.' },
        { id: 14, question: 'What is the Henderson-Hasselbalch equation for acid buffers?', answer: 'pH = pKa + log([A⁻] / [HA])', hint: 'Ratio of conjugate base to weak acid.' },
        { id: 15, question: 'What stereochemical relationship exists between cis- and trans-2-butene?', answer: 'Diastereomers (geometric isomers)', hint: 'Non-mirror image stereoisomers due to restricted rotation.' },
        { id: 16, question: 'What is the value of Faraday\'s constant F?', answer: '96,485 Coulombs per mole of electrons', hint: 'Charge per mole of electrons.' },
        { id: 17, question: 'Which spectroscopy identifies functional group vibrational frequencies?', answer: 'Infrared (IR) Spectroscopy', hint: 'Absorption in 4000–400 cm⁻¹ range.' },
        { id: 18, question: 'What is the bond angle in a perfect tetrahedral geometry (e.g. CH4)?', answer: '109.5°', hint: 'sp³ hybridization.' },
        { id: 19, question: 'What is the final product of an aldol condensation after dehydration?', answer: 'α,β-unsaturated aldehyde or ketone', hint: 'Loss of H2O creates conjugated double bond.' },
        { id: 20, question: 'What does activation energy Ea represent in the Arrhenius equation?', answer: 'The minimum kinetic energy threshold required for reactants to undergo reaction.', hint: 'Energy barrier to the transition state.' },
        { id: 21, question: 'Which reagent selectively oxidizes primary alcohols to aldehydes without over-oxidation?', answer: 'PCC (Pyridinium chlorochromate) / DMP', hint: 'Mild anhydrous oxidizing agent.' },
        { id: 22, question: 'What principle states total enthalpy change is independent of the reaction pathway?', answer: 'Hess\'s Law', hint: 'State function property of enthalpy.' },
        { id: 23, question: 'How does gas solubility in liquid solvents change as temperature rises?', answer: 'Gas solubility decreases.', hint: 'Gas dissolution is an exothermic process.' },
        { id: 24, question: 'What term describes non-superimposable mirror image molecules?', answer: 'Enantiomers', hint: 'Chiral pairs rotating plane-polarized light in opposite directions.' },
        { id: 25, question: 'What is the coordination number and geometry of [Fe(CN)6]⁴⁻?', answer: 'Coordination number 6; Octahedral geometry', hint: '6 cyanide monodentate ligands.' },
      ],
    }

    const bank = questionBanks[sLower.includes('math') ? 'math' : sLower.includes('chem') ? 'chem' : 'python']

    return {
      tier,
      tierLabel:
        tier === 1
          ? 'Tier 1 · Critical Remediation'
          : tier === 2
          ? 'Tier 2 · Diagnostic Pointers & Short Notes'
          : tier === 3
          ? 'Tier 3 · Cheat Sheet & Lagging Aspect Refinement'
          : 'Tier 4 · Mastery Confirmed & Practice Bank',
      pointers,
      shortNotes,
      laggingAspect: {
        area: laggingAspectArea,
        advice: laggingAdvice,
      },
      cheatSheet,
      readyMsg: 'You are ready! You demonstrated strong conceptual mastery across baseline and adaptive drills. Use the 25-question high-yield practice bank below to solidify top-tier exam readiness.',
      questionBank: bank,
    }
  }

  const GCAL_HOURS = [
    { hour: 7, label: '7 AM' },
    { hour: 8, label: '8 AM' },
    { hour: 9, label: '9 AM' },
    { hour: 10, label: '10 AM' },
    { hour: 11, label: '11 AM' },
    { hour: 12, label: '12 PM' },
    { hour: 13, label: '1 PM' },
    { hour: 14, label: '2 PM' },
    { hour: 15, label: '3 PM' },
    { hour: 16, label: '4 PM' },
    { hour: 17, label: '5 PM' },
    { hour: 18, label: '6 PM' },
    { hour: 19, label: '7 PM' },
    { hour: 20, label: '8 PM' },
    { hour: 21, label: '9 PM' },
    { hour: 22, label: '10 PM' },
  ]

  const handleNavPrev = () => {
    if (gcalView === 'week') {
      setSelectedCalDay((prev) => Math.max(1, prev - 7))
    } else if (gcalView === 'month') {
      handlePrevMonth()
    } else if (gcalView === 'day') {
      setSelectedCalDay((prev) => Math.max(1, prev - 1))
    }
  }

  const handleNavNext = () => {
    if (gcalView === 'week') {
      setSelectedCalDay((prev) => Math.min(daysInCalMonth, prev + 7))
    } else if (gcalView === 'month') {
      handleNextMonth()
    } else if (gcalView === 'day') {
      setSelectedCalDay((prev) => Math.min(daysInCalMonth, prev + 1))
    }
  }

  const getGcalTitle = () => {
    const weekDays = getWeekDays(calYear, calMonth, selectedCalDay)
    if (gcalView === 'week') {
      return `${MONTH_NAMES[weekDays[0].month].slice(0, 3)} ${weekDays[0].day} – ${MONTH_NAMES[weekDays[6].month].slice(0, 3)} ${weekDays[6].day}, ${calYear}`
    } else if (gcalView === 'month') {
      return `${MONTH_NAMES[calMonth]} ${calYear}`
    } else if (gcalView === 'day') {
      return `${MONTH_NAMES[calMonth]} ${selectedCalDay}, ${calYear}`
    } else {
      return `Schedule Overview • ${MONTH_NAMES[calMonth]} ${calYear}`
    }
  }

  // Schedule & Tasks
  const [tasks, setTasks] = useState<TimelineTask[]>([
    {
      id: 'task-1',
      title: 'Algebra basics & quadratic formulas',
      subject: 'Maths',
      tagClass: 'task-tag-math',
      tagIcon: 'Maths',
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
      tagIcon: 'Chemistry',
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
      tagIcon: 'Python',
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
      tagIcon: 'Maths',
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
            let tagIcon = sub
            if (sub.toLowerCase().includes('math')) {
              tagClass = 'task-tag-math'
              tagIcon = sub
            } else if (sub.toLowerCase().includes('python') || sub.toLowerCase().includes('code')) {
              tagClass = 'task-tag-python'
              tagIcon = sub
            } else if (sub.toLowerCase().includes('ai')) {
              tagClass = 'task-tag-ai'
              tagIcon = sub
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

  // Move / Reschedule Calendar Task Block (Drag-and-Drop or Quick Move)
  const moveCalTask = (
    task: CalTaskItem,
    sourceDateKey: string,
    targetDateKey: string,
    newTimeSlot: string,
    newDurationMinutes?: number
  ) => {
    const duration = newDurationMinutes || task.duration_minutes || 60
    const updatedTask: CalTaskItem = {
      ...task,
      timeSlot: newTimeSlot,
      duration_minutes: duration,
    }

    setCalTasksByDate((prev) => {
      const nextState = { ...prev }
      // Remove from source date
      const sourceList = (nextState[sourceDateKey] || []).filter((t) => t.id !== task.id)
      nextState[sourceDateKey] = sourceList

      // Add to target date
      const targetList = (nextState[targetDateKey] || []).filter((t) => t.id !== task.id)
      nextState[targetDateKey] = [...targetList, updatedTask]

      return nextState
    })

    if (sourceDateKey === '2026-09-12' || targetDateKey === '2026-09-12') {
      setTasks((prev) => {
        if (targetDateKey === '2026-09-12') {
          const existing = prev.find((t) => String(t.id) === String(task.id))
          if (existing) {
            return prev.map((t) => (String(t.id) === String(task.id) ? { ...t, timeSlot: newTimeSlot } : t))
          } else {
            return [
              ...prev,
              {
                id: String(task.id),
                title: task.title,
                subject: task.subject,
                tagClass: task.tagClass,
                tagIcon: task.subject || 'Study',
                timeSlot: newTimeSlot,
                completed: task.completed,
                alarmActive: true,
                status: task.completed ? 'Done' : 'Upcoming',
              },
            ]
          }
        } else {
          return prev.filter((t) => String(t.id) !== String(task.id))
        }
      })
    }

    soundSynth.playSuccessBeep()
    const targetDateObj = new Date(targetDateKey + 'T00:00:00')
    const formattedTargetDay = targetDateObj.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    })
    showToast(`Moved "${task.title}" to ${formattedTargetDay} at ${newTimeSlot}`)
  }

  // Drag and Drop Handlers for Calendar Event Blocks
  const handleEventDragStart = (
    e: React.DragEvent,
    task: CalTaskItem,
    sourceDateKey: string
  ) => {
    e.stopPropagation()
    const { durationMinutes } = parseTimeSlot(task.timeSlot)
    setDraggedCalEvent({
      task,
      sourceDateKey,
      durationMinutes: durationMinutes || 60,
    })
    e.dataTransfer.setData('text/plain', task.id)
    e.dataTransfer.effectAllowed = 'move'
  }

  const handleGridDayColDragOver = (e: React.DragEvent, dateKey: string) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    if (!draggedCalEvent) return

    const colElem = e.currentTarget as HTMLElement
    const rect = colElem.getBoundingClientRect()
    const offsetY = e.clientY - rect.top

    // 7 AM = 420 min. 1px = 1 min. Snap to 15 min.
    const duration = draggedCalEvent.durationMinutes || 60
    const rawMin = 420 + offsetY
    const snapped = Math.max(420, Math.min(1320 - duration, Math.round(rawMin / 15) * 15))
    const timePreview = formatMinutesToTimeSlot(snapped, duration)

    setDragOverCol({
      dateKey,
      snappedMinutes: snapped,
      timeSlotPreview: timePreview,
    })
  }

  const handleGridDayColDragLeave = (e: React.DragEvent) => {
    if (e.currentTarget.contains(e.relatedTarget as Node)) return
    setDragOverCol(null)
  }

  const handleGridDayColDrop = (e: React.DragEvent, targetDateKey: string) => {
    e.preventDefault()
    if (!draggedCalEvent) return

    const colElem = e.currentTarget as HTMLElement
    const rect = colElem.getBoundingClientRect()
    const offsetY = e.clientY - rect.top
    const duration = draggedCalEvent.durationMinutes || 60
    const rawMin = 420 + offsetY
    const snapped = Math.max(420, Math.min(1320 - duration, Math.round(rawMin / 15) * 15))
    const newTimeSlot = formatMinutesToTimeSlot(snapped, duration)

    moveCalTask(
      draggedCalEvent.task,
      draggedCalEvent.sourceDateKey,
      targetDateKey,
      newTimeSlot,
      duration
    )

    setDraggedCalEvent(null)
    setDragOverCol(null)
  }

  const handleMonthCellDragOver = (e: React.DragEvent, dayNum: number) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    setDragOverMonthDay(dayNum)
  }

  const handleMonthCellDragLeave = (e: React.DragEvent) => {
    if (e.currentTarget.contains(e.relatedTarget as Node)) return
    setDragOverMonthDay(null)
  }

  const handleMonthCellDrop = (e: React.DragEvent, dayNum: number) => {
    e.preventDefault()
    setDragOverMonthDay(null)
    if (!draggedCalEvent) return

    const targetDateKey = formatCalDateKey(calYear, calMonth, dayNum)
    moveCalTask(
      draggedCalEvent.task,
      draggedCalEvent.sourceDateKey,
      targetDateKey,
      draggedCalEvent.task.timeSlot,
      draggedCalEvent.durationMinutes
    )
    setDraggedCalEvent(null)
  }

  const handleShiftEventTime = (deltaMinutes: number) => {
    if (!gcalActiveEvent) return
    const { startMinutes, durationMinutes } = parseTimeSlot(gcalActiveEvent.timeSlot)
    const duration = durationMinutes || gcalActiveEvent.duration_minutes || 45
    const newStart = Math.max(420, Math.min(1320 - duration, startMinutes + deltaMinutes))
    const newSlot = formatMinutesToTimeSlot(newStart, duration)
    const dateKey = gcalActiveEvent.dateKey || formatCalDateKey(calYear, calMonth, selectedCalDay)

    moveCalTask(gcalActiveEvent, dateKey, dateKey, newSlot, duration)
    setGcalActiveEvent((prev) => (prev ? { ...prev, timeSlot: newSlot } : null))
  }

  const handleShiftEventDay = (deltaDays: number) => {
    if (!gcalActiveEvent) return
    const dateKey = gcalActiveEvent.dateKey || formatCalDateKey(calYear, calMonth, selectedCalDay)
    const [y, m, d] = dateKey.split('-').map(Number)
    const dateObj = new Date(y, m - 1, d)
    dateObj.setDate(dateObj.getDate() + deltaDays)
    const targetDateKey = formatCalDateKey(dateObj.getFullYear(), dateObj.getMonth(), dateObj.getDate())
    const { durationMinutes } = parseTimeSlot(gcalActiveEvent.timeSlot)
    const duration = durationMinutes || gcalActiveEvent.duration_minutes || 45

    moveCalTask(gcalActiveEvent, dateKey, targetDateKey, gcalActiveEvent.timeSlot, duration)
    setGcalActiveEvent((prev) => (prev ? { ...prev, dateKey: targetDateKey } : null))
  }

  // Dynamic Free Time / Brain Break Blocks
  const [emptyBlocks, setEmptyBlocks] = useState({
    'empty-1': {
      filled: false,
      title: '',
      time: '10:30–11:00 AM',
      label: 'Break (30 min recovery buffer)',
    },
    'empty-3': {
      filled: false,
      title: '',
      time: '2:15–3:00 PM',
      label: 'Break (45 min open buffer)',
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
    python: { pct: 35, retention: 'Refresher Recommended', safe: false },
  })

  // Chat & Stream (Soft, Encouraging Persona)
  const [chatList, setChatList] = useState<ChatEntry[]>([
    {
      id: 'init-1',
      type: 'msg',
      sender: 'bot',
      text: `Hey Laksh! Noticed nested loops were a bit tricky on today's quiz. No stress at all — loops take practice! Want to squeeze in a quick 20-minute recap before lunch? I found a nice open slot right after chemistry!`,
    },
  ])
  const [chatInput, setChatInput] = useState<string>('')
  const chatBottomRef = useRef<HTMLDivElement>(null)

  // Toast
  const [toast, setToast] = useState<{ message: string; icon: string; visible: boolean }>({
    message: '',
    icon: '',
    visible: false,
  })
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Alarms & Upcoming Tests
  const [alarmModalOpen, setAlarmModalOpen] = useState<boolean>(false)

  // Pomodoro
  const [pomoModalOpen, setPomoModalOpen] = useState<boolean>(false)
  const [pomoSessionName, setPomoSessionName] = useState<string>('Focus Session')
  const [pomoDurationMinutes, setPomoDurationMinutes] = useState<number>(25)
  const [pomoSeconds, setPomoSeconds] = useState<number>(25 * 60)
  const [pomoRunning, setPomoRunning] = useState<boolean>(false)
  const [isResettingPomo, setIsResettingPomo] = useState<boolean>(false)

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
  const [mistakeNotice, setMistakeNotice] = useState<string | null>(null)
  const [mistakeBank, setMistakeBank] = useState<Record<string, QuizQuestionItem[]>>(() => {
    try {
      const saved = localStorage.getItem('reviso_mistake_bank')
      if (saved) {
        return JSON.parse(saved)
      }
    } catch {
      // fallback
    }
    return {
      python: [
        {
          id: 104,
          subject: 'Python',
          topic: 'Nested Loops',
          difficulty: 'medium',
          question: 'What is the output of <code>[[j for j in range(2)] for i in range(2)]</code>?',
          options: ['[[0, 1], [0, 1]]', '[[0, 0], [1, 1]]', '[0, 1, 0, 1]', '[[1, 2], [1, 2]]'],
          correct_answer: '[[0, 1], [0, 1]]',
          explanation: 'The inner comprehension creates [0, 1] twice within the outer loop.',
        },
      ],
      math: [],
      chem: [],
    }
  })
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
  const [quizReviewFilter, setQuizReviewFilter] = useState<'all' | 'wrong' | 'correct'>('all')
  const [criticalRemediationInfo, setCriticalRemediationInfo] = useState<{
    scheduledDate: string
    dayName: string
    timeSlot: string
    topic: string
    subject: string
    dayNumber: number
    video?: {
      title: string
      channel: string
      url: string
    }
  } | null>(null)
  const [quizTierOutcome, setQuizTierOutcome] = useState<{
    tier: 1 | 2 | 3 | 4
    tierLabel: string
    pointers?: string[]
    shortNotes?: { title: string; body: string }[]
    laggingAspect?: { area: string; advice: string }
    cheatSheet?: { category: string; rules: string[] }[]
    readyMsg?: string
    questionBank?: { id: number; question: string; answer: string; hint: string }[]
    video?: {
      title: string
      channel: string
      url: string
    }
  } | null>(null)
  const [revealedBankAnswers, setRevealedBankAnswers] = useState<Record<number, boolean>>({})



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
            timestamp: m.timestamp,
          }))
        )
      }
    })
  }, [])

  // Refresh chat history on demand
  const refreshChatHistory = async () => {
    setIsRefreshingHistory(true)
    try {
      const history = await fetchChatHistory()
      if (history && history.length > 0) {
        setChatList(
          history.map((m) => ({
            id: `msg-${m.id}`,
            type: 'msg' as const,
            sender: (m.sender === 'user' ? 'user' : 'bot') as 'user' | 'bot',
            text: m.text,
            timestamp: m.timestamp,
          }))
        )
        showToast('Chat history synced with database!')
      }
    } catch {
      showToast('Could not reload chat history')
    } finally {
      setIsRefreshingHistory(false)
    }
  }

  // Filtered chat messages for history viewer
  const filteredChatList = chatList.filter((entry) => {
    if (entry.type !== 'msg') return false
    if (!historySearchQuery.trim()) return true
    const q = historySearchQuery.toLowerCase()
    return (
      (entry.text && entry.text.toLowerCase().includes(q)) ||
      (entry.sender && entry.sender.toLowerCase().includes(q))
    )
  })

  // Click outside to close profile
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setIsProfileOpen(false)
        setIsEditingName(false)
        setProfileTab('profile')
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
        setIsChatHistoryModalOpen(false)
        setIsProfileOpen(false)
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
            showToast('Pomodoro session completed! Great job, Laksh!')
            recordStudySession('General Focus', pomoDurationMinutes, pomoSessionName).then((res) => {
              if (res?.userStreak != null) setUserStreak(res.userStreak)
            })
            return pomoDurationMinutes * 60
          }
          return prev - 1
        })
      }, 1000)
    }
    return () => {
      if (interval) clearInterval(interval)
    }
  }, [pomoRunning, pomoSessionName, pomoDurationMinutes])

  // Toast helper
  const showToast = (message: string, icon = '') => {
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
    showToast(`Theme switched to ${next === 'dark' ? 'Dark' : 'Light'} Mode`)
  }

  // Export / Share PDF
  const exportSharePdf = () => {
    showToast('Opening Print / Save to PDF with full colors enabled!')
    setTimeout(() => {
      window.print()
    }, 400)
  }

  // Trigger Audio Alarm & Open Upcoming Tests Modal
  const triggerAlarm = () => {
    setAlarmModalOpen(true)
    soundSynth.playHarmonicChime()
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
            showToast('Awesome! Session marked complete.')
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
        showToast('Task marked complete!')
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
        ? 'Chemistry'
        : newCalTaskSubject === 'Python'
        ? 'Python'
        : newCalTaskSubject === 'AI Systems'
        ? 'AI Systems'
        : 'Maths'

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
    showToast(`Added "${newCalTaskTitle.trim()}" to ${MONTH_NAMES[calMonth]} ${selectedCalDay}!`)
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
    showToast('Task removed from schedule')
  }

  // Real Calendar Sync & iCal Export
  const handleSyncCalendar = () => {
    setCalendarSyncActive(true)
    soundSynth.playSuccessBeep()
    downloadCalendarIcs()
    showToast('Exported reviso_study_schedule.ics! Ready to import into Google or Apple Calendar.')
    setTimeout(() => setCalendarSyncActive(false), 1200)
  }

  // Pomodoro handlers
  const openPomodoroModal = (sessionName: string, defaultMinutes?: number) => {
    setPomoSessionName(sessionName)
    const targetMins = defaultMinutes && defaultMinutes > 0 ? defaultMinutes : (pomoDurationMinutes || 25)
    setPomoDurationMinutes(targetMins)
    setPomoSeconds(targetMins * 60)
    setPomoRunning(false)
    setPomoModalOpen(true)
  }

  const changePomoDuration = (newMins: number) => {
    const clamped = Math.max(1, Math.min(180, newMins))
    setPomoDurationMinutes(clamped)
    setPomoSeconds(clamped * 60)
    setPomoRunning(false)
    soundSynth.playResetClick()
  }

  const adjustPomoDuration = (deltaMins: number) => {
    const next = Math.max(1, Math.min(180, pomoDurationMinutes + deltaMins))
    changePomoDuration(next)
    showToast(`Focus duration: ${next} min`)
  }

  const formatTimerDigits = (totalSecs: number) => {
    const h = Math.floor(totalSecs / 3600)
    const m = Math.floor((totalSecs % 3600) / 60)
    const s = totalSecs % 60
    if (h > 0) {
      return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
    }
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
  }

  const togglePomodoro = () => {
    if (!pomoRunning) {
      soundSynth.playSuccessBeep()
    }
    setPomoRunning((prev) => !prev)
  }

  const resetPomodoro = (targetMins?: number) => {
    setIsResettingPomo(true)
    setPomoRunning(false)
    const mins = targetMins ?? pomoDurationMinutes
    setPomoSeconds(mins * 60)
    soundSynth.playResetClick()
    showToast(`Timer reset to ${mins}:00`, 'clock')
    setTimeout(() => {
      setIsResettingPomo(false)
    }, 550)
  }

  const handleSelectPomoPreset = (mins: number, label: string) => {
    setPomoDurationMinutes(mins)
    setPomoRunning(false)
    setPomoSeconds(mins * 60)
    soundSynth.playSuccessBeep()
    showToast(`Preset: ${label} (${mins} min)`)
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
    const timeStr = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
    setChatList((prev) => [
      ...prev,
      {
        id: `msg-${Date.now()}`,
        type: 'msg',
        sender,
        text,
        timestamp: timeStr,
      },
    ])
    sendChatMessage(sender, text)
  }

  // Auto Schedule Practice Session into Free Time
  const triggerAutoSchedule = (taskTitle = 'Python Loop Quick Recap') => {
    if (isRemediationScheduled) {
      showToast('Practice session already slotted into your schedule!')
      addChatMessage(
        `You already have <strong>${taskTitle}</strong> slotted in for 12:00–12:30 PM right before lunch!`,
        'bot'
      )
      const el = document.getElementById('slotted-critical-practice')
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' })
        el.classList.add('task-card-highlight')
        setTimeout(() => el.classList.remove('task-card-highlight'), 2200)
      }
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
        setQuizScoreText('Score: 35% · Practice Slotted')
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
        showToast('Added 30-min recap to your schedule — lunch break preserved!')

        addChatMessage(
          `All set, Laksh! I added <strong>${taskTitle}</strong> for 12:00–12:30 PM. You still have a full hour of relaxing lunch time before lab at 1:30 PM. You've got this!`,
          'bot'
        )

        // Smooth scroll and highlight the new scheduled card in the timeline!
        setTimeout(() => {
          const el = document.getElementById('slotted-critical-practice')
          if (el) {
            el.scrollIntoView({ behavior: 'smooth', block: 'center' })
            el.classList.add('task-card-highlight')
            setTimeout(() => el.classList.remove('task-card-highlight'), 2200)
          }
        }, 300)
      }, 600)
    }, 500)
  }

  // Smart free time actions (e.g. "Take a walk", "Quick quiz", "Power nap")
  const handleFreeTimeActivity = (
    activityName: string,
    timeSlot: string,
    blockId: 'empty-1' | 'empty-3',
    icon = ''
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
    setCriticalRemediationInfo(null)
    setQuizTierOutcome(null)
    setRevealedBankAnswers({})
    setQuizReviewFilter('all')

    const subjectName = key === 'math' ? 'Maths' : key === 'chem' ? 'Chemistry' : 'Python'

    // 1. Spaced Repetition: Check if student has recorded past mistakes for this subject
    const subjectMistakes = mistakeBank[key] || []
    let initialQuestions: QuizQuestionItem[] = []

    if (subjectMistakes.length > 0) {
      // Prioritize up to 2 past mistakes in the diagnostic round!
      const mistakesToInclude = subjectMistakes.slice(0, 2)
      initialQuestions = [...mistakesToInclude]
      setMistakeNotice(
        `Spaced Repetition Active: Retrying ${mistakesToInclude.length} question${mistakesToInclude.length > 1 ? 's' : ''} you previously missed to reinforce recall.`
      )
      showToast(`Loaded ${mistakesToInclude.length} past missed question(s) for review!`, 'zap')
    } else {
      setMistakeNotice(null)
    }

    // 2. Fill remaining slots up to 3 questions with fresh items
    const needed = 3 - initialQuestions.length
    if (needed > 0) {
      const existingIds = new Set(initialQuestions.map((q) => q.id))
      try {
        const data = await fetchGeneratedQuiz(subjectName, undefined, 'medium', needed)
        if (data && data.questions && data.questions.length > 0) {
          const fresh = data.questions.filter((q) => !existingIds.has(q.id)).slice(0, needed)
          initialQuestions = [...initialQuestions, ...fresh]
        }
      } catch {
        // Backend error fallback
      }

      if (initialQuestions.length < 3) {
        const pool = FALLBACK_QUIZ_BANK[key] || FALLBACK_QUIZ_BANK.python
        const remaining = pool.filter((q) => !existingIds.has(q.id))
        const sourcePool = remaining.length >= (3 - initialQuestions.length) ? remaining : pool
        const shuffled = [...sourcePool].sort(() => Math.random() - 0.5).slice(0, 3 - initialQuestions.length)
        initialQuestions = [...initialQuestions, ...shuffled]
      }
    }

    setQuizQuestions(initialQuestions)
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
        text: `Spot on! ${currentQ.explanation || 'Great job identifying the right answer!'}`,
      })

      // If user got this question right, remove from mistake bank (mastered!)
      setMistakeBank((prev) => {
        const list = prev[currentQuizSubject] || []
        const wasInBank = list.some((q) => q.id === currentQ.id || q.question === currentQ.question)
        if (!wasInBank) return prev
        const updatedList = list.filter((q) => q.id !== currentQ.id && q.question !== currentQ.question)
        const updated = { ...prev, [currentQuizSubject]: updatedList }
        try {
          localStorage.setItem('reviso_mistake_bank', JSON.stringify(updated))
        } catch {}
        showToast('Past mistake mastered! Removed from review queue.', 'check')
        return updated
      })
    } else {
      setQuizFeedback({
        isCorrect: false,
        text: `Not quite. Correct answer: ${currentQ.correct_answer || 'the indicated option'}. ${currentQ.explanation || ''}`,
      })

      // If user got it wrong, add to the mistake bank for future spaced repetition!
      setMistakeBank((prev) => {
        const list = prev[currentQuizSubject] || []
        const alreadyExists = list.some((q) => q.id === currentQ.id || q.question === currentQ.question)
        if (alreadyExists) return prev
        const updated = { ...prev, [currentQuizSubject]: [...list, currentQ] }
        try {
          localStorage.setItem('reviso_mistake_bank', JSON.stringify(updated))
        } catch {}
        return updated
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
        notice = `Adaptive Booster: Scored ${s1Correct}/3 — Generating 7 Easy practice questions to rebuild fundamentals.`
      } else if (s1Correct === 2) {
        nextDiff = 'medium'
        notice = `Reinforcement Round: Scored 2/3 — Generating 7 Medium practice questions to lock in proficiency.`
      } else {
        nextDiff = 'hard'
        notice = `Mastery Challenge: Perfect 3/3 — Generating 7 Hard challenge questions to test advanced skills.`
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
      const data = await fetchGeneratedQuiz(subjectName, undefined, adaptiveDifficulty, 7)
      if (data && data.questions && data.questions.length > 0) {
        nextQuestions = data.questions
      }
    } catch {
      // offline fallback
    }

    if (nextQuestions.length < 7) {
      const pool = FALLBACK_QUIZ_BANK[currentQuizSubject] || FALLBACK_QUIZ_BANK.python
      const existingIds = new Set(quizQuestions.map((q) => q.id))
      const availablePool = pool.filter((q) => !existingIds.has(q.id))
      const diffPool = availablePool.filter((q) => q.difficulty === adaptiveDifficulty)
      const fallbackPool = diffPool.length >= (7 - nextQuestions.length) ? diffPool : availablePool.length > 0 ? availablePool : pool
      const needed = 7 - nextQuestions.length
      const additional = [...fallbackPool].sort(() => Math.random() - 0.5).slice(0, needed)
      nextQuestions = [...nextQuestions, ...additional]
    }

    // Append 7 adaptive questions (total is now 10: 3 Stage 1 + 7 Stage 2)
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

    const subjectDisplayName =
      currentQuizSubject === 'math' ? 'Maths' : currentQuizSubject === 'chem' ? 'Chemistry' : 'Python'
    const topicDisplayName =
      quizQuestions[0]?.topic ||
      (currentQuizSubject === 'math'
        ? 'Linear Algebra'
        : currentQuizSubject === 'chem'
        ? 'Reaction Mechanisms'
        : 'Loops & Recursion')
    const subjectTagClass =
      currentQuizSubject === 'math'
        ? 'task-tag-math'
        : currentQuizSubject === 'chem'
        ? 'task-tag-chem'
        : 'task-tag-python'

    const topicVideo = getTopicYoutubeVideo(subjectDisplayName, topicDisplayName)
    const tierResources = getQuizTierResources(
      subjectDisplayName,
      topicDisplayName,
      totalCorrect,
      quizUserAnswers,
      quizQuestions
    )
    setQuizTierOutcome({
      ...tierResources,
      video: topicVideo,
    })

    const subKey: 'math' | 'chem' | 'python' =
      (currentQuizSubject || '').toLowerCase().includes('math')
        ? 'math'
        : (currentQuizSubject || '').toLowerCase().includes('chem')
        ? 'chem'
        : 'python'

    if (totalCorrect <= 3) {
      // TIER 1: Score <= 3 (Critical Remediation & YouTube Tutorial)
      const candidateHours = [
        { slot: '4:30–5:30 PM', startMin: 990, durationMin: 60 },
        { slot: '5:30–6:30 PM', startMin: 1050, durationMin: 60 },
        { slot: '2:30–3:30 PM', startMin: 870, durationMin: 60 },
        { slot: '10:00–11:00 AM', startMin: 600, durationMin: 60 },
        { slot: '11:30 AM–12:30 PM', startMin: 690, durationMin: 60 },
        { slot: '6:30–7:30 PM', startMin: 1110, durationMin: 60 },
      ]

      let chosenDateKey = '2026-09-12'
      let chosenDayNumber = 12
      let chosenDayFormatted = 'Today (Saturday, Sep 12)'
      let chosenTimeSlot = '4:30–5:30 PM'
      let foundSlot = false

      for (let dayOffset = 0; dayOffset <= 7; dayOffset++) {
        const candidateDate = new Date(2026, 8, 12 + dayOffset)
        const cYear = candidateDate.getFullYear()
        const cMonth = candidateDate.getMonth()
        const cDay = candidateDate.getDate()
        const cDateKey = formatCalDateKey(cYear, cMonth, cDay)

        const dayTasks = getTasksForDate(cYear, cMonth, cDay)
        const hasExam = dayTasks.some((t) => {
          const title = (t.title || '').toLowerCase()
          return title.includes('exam') || title.includes('midterm') || title.includes('final')
        })

        if (hasExam) continue

        for (const candidate of candidateHours) {
          const slotStart = candidate.startMin
          const slotEnd = candidate.startMin + candidate.durationMin

          const hasCollision = dayTasks.some((t) => {
            const { startMinutes, durationMinutes } = parseTimeSlot(t.timeSlot)
            const tStart = startMinutes
            const tEnd = startMinutes + (durationMinutes || 60)
            return slotStart < tEnd && slotEnd > tStart
          })

          if (!hasCollision) {
            chosenDateKey = cDateKey
            chosenDayNumber = cDay
            chosenDayFormatted =
              dayOffset === 0
                ? 'Today (Saturday, Sep 12)'
                : candidateDate.toLocaleDateString('en-US', {
                    weekday: 'long',
                    month: 'short',
                    day: 'numeric',
                  })
            chosenTimeSlot = candidate.slot
            foundSlot = true
            break
          }
        }

        if (foundSlot) break
      }

      setCriticalRemediationInfo({
        scheduledDate: chosenDateKey,
        dayName: chosenDayFormatted,
        timeSlot: chosenTimeSlot,
        topic: topicDisplayName,
        subject: subjectDisplayName,
        dayNumber: chosenDayNumber,
        video: topicVideo,
      })

      const lowPct = Math.min(30, Math.max(10, scorePct || totalCorrect * 10))
      setDktScores((prev) => ({
        ...prev,
        [subKey]: {
          pct: lowPct,
          retention: 'Critical Decay Risk (1d)',
          safe: false,
        },
      }))
      setQuizScoreText(`Score: ${scorePct}% · Critical Intervention`)
      setQuizCardBorderColor('#EF4444')

      const remediationTaskId = `remediation-${Date.now()}`
      const remediationTask: CalTaskItem = {
        id: remediationTaskId,
        title: `1-Hour Dedicated Study: ${subjectDisplayName} - ${topicDisplayName}`,
        subject: subjectDisplayName,
        tagClass: subjectTagClass,
        timeSlot: chosenTimeSlot,
        completed: false,
        priority: 'high',
        duration_minutes: 60,
        videoUrl: topicVideo.url,
        videoTitle: topicVideo.title,
        videoChannel: topicVideo.channel,
      }

      setCalTasksByDate((prev) => {
        const existing = prev[chosenDateKey] || []
        return {
          ...prev,
          [chosenDateKey]: [...existing.filter((t) => !t.title.includes('Critical 1hr Study')), remediationTask],
        }
      })

      if (chosenDateKey === '2026-09-12') {
        setTasks((prev) => [
          ...prev.filter((t) => !t.title.includes('Critical 1hr Study')),
          {
            id: remediationTaskId,
            title: `1-Hour Dedicated Study: ${subjectDisplayName} - ${topicDisplayName}`,
            subject: subjectDisplayName,
            tagClass: subjectTagClass,
            tagIcon: currentQuizSubject === 'math' ? 'Maths' : currentQuizSubject === 'chem' ? 'Chemistry' : 'Python',
            timeSlot: chosenTimeSlot,
            completed: false,
            alarmActive: true,
            status: 'Critical Remediation',
            videoUrl: topicVideo.url,
            videoTitle: topicVideo.title,
            videoChannel: topicVideo.channel,
          },
        ])
      }

      scheduleCriticalRemediation({
        subject: subjectDisplayName,
        topic: topicDisplayName,
        score: totalCorrect,
        total: total,
        scheduled_date: chosenDateKey,
        time_slot: chosenTimeSlot,
        duration_minutes: 60,
      }).catch((e) => console.warn('scheduleCriticalRemediation backend error:', e))

      soundSynth.playSuccessBeep()
      showToast(`Scored ${totalCorrect}/${total} (<= 3 right)! Added 1-hr study slot & YouTube video tutorial.`)

      addChatMessage(
        `<strong>Tier 1 Diagnostic Alert (Score: ${totalCorrect}/${total}):</strong><br><br>` +
          `Because you scored 3 or less right on <em>${subjectDisplayName} - ${topicDisplayName}</em>, I have linked the verified YouTube video tutorial below and automatically scheduled a <strong>1-hour study slot</strong> on <strong>${chosenDayFormatted} from ${chosenTimeSlot}</strong> with an active study alarm.<br><br>` +
          `<strong>Recommended Masterclass:</strong><br>` +
          `<em>${topicVideo.title}</em> (${topicVideo.channel})<br>` +
          `<a href="${topicVideo.url}" target="_blank" rel="noopener noreferrer" style="display:inline-flex;align-items:center;gap:6px;background:#EF4444;color:#FFFFFF;padding:6px 14px;border-radius:6px;text-decoration:none;font-size:12px;font-weight:700;margin-top:8px;">Watch Video on YouTube</a><br><br>` +
          `Check your <strong>Study Calendar</strong> to view your reserved study time block!`,
        'bot'
      )
    } else if (totalCorrect >= 4 && totalCorrect <= 6) {
      // TIER 2: Score 4 to 6 (Diagnostic Pointers & Short Notes)
      const newPct = Math.max(50, Math.min(68, scorePct || totalCorrect * 10))
      setDktScores((prev) => ({
        ...prev,
        [subKey]: {
          pct: newPct,
          retention: 'Reinforcing (4d decay)',
          safe: true,
        },
      }))
      if (subKey === 'python') {
        setIsRemediationScheduled(true)
        setPythonCritScheduled(true)
      }
      setQuizScoreText(`Score: ${scorePct}% · Review Recommended`)
      setQuizCardBorderColor('#F59E0B')
      showToast(`Scored ${totalCorrect}/${total}! Memory retention updated to ${newPct}%. Diagnostic pointers & short notes ready.`)

      const pointersHtml = (tierResources.pointers || [])
        .map((p) => `<li style="margin-bottom:4px;">${p}</li>`)
        .join('')
      const notesHtml = (tierResources.shortNotes || [])
        .map((n) => `<div style="margin-top:6px;padding:8px;background:rgba(255,255,255,0.05);border-radius:6px;"><strong>${n.title}:</strong> ${n.body}</div>`)
        .join('')

      addChatMessage(
        `<strong>Tier 2 Assessment (Score: ${totalCorrect}/${total}):</strong><br><br>` +
          `Memory retention for <strong>${subjectDisplayName}</strong> has updated to <strong>${newPct}% (Reinforcing, 4d decay)</strong>.<br><br>` +
          `Here are key diagnostic pointers and short notes to reinforce your retention:<br><br>` +
          `<strong>Actionable Pointers:</strong><ul style="padding-left:18px;margin:6px 0;">${pointersHtml}</ul><br>` +
          `<strong>High-Yield Short Notes:</strong>${notesHtml}`,
        'bot'
      )
    } else if (totalCorrect >= 7 && totalCorrect <= 8) {
      // TIER 3: Score 7 to 8 (Cheat Sheet & Lagging Aspect Refinement)
      const newPct = Math.max(78, Math.min(88, scorePct || totalCorrect * 10))
      setDktScores((prev) => ({
        ...prev,
        [subKey]: {
          pct: newPct,
          retention: 'Proficient (10d decay)',
          safe: true,
        },
      }))
      if (subKey === 'python') {
        setIsRemediationScheduled(true)
        setPythonCritScheduled(true)
      }
      setQuizScoreText(`Score: ${scorePct}% · Proficient`)
      setQuizCardBorderColor('#6366F1')
      showToast(`Scored ${totalCorrect}/${total}! Memory retention updated to ${newPct}%. Cheat sheet unlocked.`)

      const cheatHtml = (tierResources.cheatSheet || [])
        .map(
          (c) =>
            `<div style="margin-top:6px;padding:8px;background:rgba(99,102,241,0.1);border-radius:6px;border:1px solid rgba(99,102,241,0.25);">` +
            `<strong>${c.category}</strong><br>` +
            `<ul style="padding-left:16px;margin:4px 0;">` +
            c.rules.map((r) => `<li>${r}</li>`).join('') +
            `</ul></div>`
        )
        .join('')

      addChatMessage(
        `<strong>Tier 3 Assessment (Score: ${totalCorrect}/${total}):</strong><br><br>` +
          `Great progress! Memory retention for <strong>${subjectDisplayName}</strong> increased to <strong>${newPct}% (Proficient, 10d decay)</strong>.<br><br>` +
          `<div style="background:rgba(99,102,241,0.15);border:1px solid #6366F1;padding:10px 14px;border-radius:8px;color:#c7d2fe;">` +
          `<strong>Lagging Aspect:</strong> ${tierResources.laggingAspect?.area}<br>` +
          `<span style="font-size:12px;">${tierResources.laggingAspect?.advice}</span>` +
          `</div><br>` +
          `<strong>Topic Quick Cheat Sheet:</strong>${cheatHtml}`,
        'bot'
      )
    } else {
      // TIER 4: Score 9 to 10 (Mastery "You are ready!" & 25 Question Practice Bank)
      const newPct = Math.max(95, Math.min(100, scorePct || totalCorrect * 10))
      setDktScores((prev) => ({
        ...prev,
        [subKey]: {
          pct: newPct,
          retention: 'Mastered (21d decay)',
          safe: true,
        },
      }))
      if (subKey === 'python') {
        setIsRemediationScheduled(true)
        setPythonCritScheduled(true)
      }
      setQuizScoreText(`Score: ${scorePct}% · Ready for Exam!`)
      setQuizCardBorderColor('#10B981')
      showToast(`Scored ${totalCorrect}/${total}! Memory retention elevated to ${newPct}%! You are ready!`)

      addChatMessage(
        `<strong>Tier 4 Assessment (Score: ${totalCorrect}/${total}):</strong><br><br>` +
          `<div style="background:rgba(16,185,129,0.15);border:1.5px solid #10B981;padding:14px;border-radius:10px;color:#a7f3d0;">` +
          `<div style="font-size:16px;font-weight:800;color:#34d399;margin-bottom:4px;">You are ready!</div>` +
          `Memory retention for <strong>${subjectDisplayName}</strong> is now at <strong>${newPct}% (Mastered, Safe for Exam)</strong>.<br><br>` +
          `To lock in full preparation for your upcoming exams, I have unlocked a <strong>25-question high-yield practice bank</strong> in your drill summary. View the quiz summary to test yourself against all 25 practice questions.` +
          `</div>`,
        'bot'
      )
    }

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
      const lower = actionText.toLowerCase()
      if (
        lower.includes('schedule') ||
        lower.includes('review') ||
        lower.includes('lunch') ||
        lower.includes('recap') ||
        lower.includes('practice') ||
        lower.includes('auto-schedule')
      ) {
        triggerAutoSchedule('Python Loop Quick Recap')
      } else if (lower.includes('drill') || lower.includes('quiz') || lower.includes('diagnostic')) {
        launchQuiz('python')
      } else if (lower.includes('retention') || lower.includes('memory') || lower.includes('analyze')) {
        const allSafe = dktScores.math.safe && dktScores.chem.safe && dktScores.python.safe
        addChatMessage(
          `<strong>Memory Retention Snapshot:</strong><br>` +
            `• <strong>Algebra:</strong> ${dktScores.math.pct}% (${dktScores.math.retention})<br>` +
            `• <strong>Chemistry:</strong> ${dktScores.chem.pct}% (${dktScores.chem.retention})<br>` +
            `• <strong>Python Loops:</strong> ${dktScores.python.pct}% (${dktScores.python.retention})<br><br>` +
            (allSafe
              ? `Outstanding work! All your concept retention levels are currently safe and protected from decay.`
              : `Doing a quick 15-minute review today will reinforce your recall strength across all topics!`),
          'bot'
        )
      } else if (lower.includes('pomodoro') || lower.includes('timer') || lower.includes('focus')) {
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
        triggerAlarm()
        addChatMessage("I've opened your Upcoming Tests & Alarms monitor with sound testing controls.", 'bot')
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
      } else if (lower.includes('retention') || lower.includes('memory')) {
        const allSafe = dktScores.math.safe && dktScores.chem.safe && dktScores.python.safe
        addChatMessage(
          `<strong>Memory Retention Snapshot:</strong><br>` +
            `• <strong>Algebra:</strong> ${dktScores.math.pct}% (${dktScores.math.retention})<br>` +
            `• <strong>Chemistry:</strong> ${dktScores.chem.pct}% (${dktScores.chem.retention})<br>` +
            `• <strong>Python Loops:</strong> ${dktScores.python.pct}% (${dktScores.python.retention})<br><br>` +
            (allSafe
              ? `Outstanding work! All your concept retention levels are currently safe and protected from decay.`
              : `Doing a quick 15-minute review today will reinforce your recall strength across all topics!`),
          'bot'
        )
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
          {/* Live Next Upcoming Task Button */}
          {(() => {
            const nextUpcomingTask = tasks.find((t) => !t.completed)
            const nextUpcomingTaskDisplay = nextUpcomingTask
              ? `${nextUpcomingTask.title.replace(/[\u{1F300}-\u{1F9FF}\u{2600}-\u{27BF}\u{2300}-\u{23FF}\u{2B50}\u{2B55}\u{1FA00}-\u{1FAFF}\u{FE0F}]/gu, '').trim()} (${nextUpcomingTask.timeSlot})`
              : 'All Tasks Completed'

            return (
              <button
                type="button"
                className="alarm-pill"
                onClick={() => {
                  if (nextUpcomingTask) {
                    openPomodoroModal(`${nextUpcomingTask.title.replace(/[\u{1F300}-\u{1F9FF}\u{2600}-\u{27BF}\u{2300}-\u{23FF}\u{2B50}\u{2B55}\u{1FA00}-\u{1FAFF}\u{FE0F}]/gu, '').trim()} (${nextUpcomingTask.timeSlot})`)
                  } else {
                    showToast('All study tasks for today are completed!')
                  }
                }}
                title={nextUpcomingTask ? `Next upcoming task: ${nextUpcomingTask.title}. Click to launch focus timer.` : 'All study blocks completed!'}
              >
                <span className="pulse-dot" />
                <span>
                  Next: <strong>{nextUpcomingTaskDisplay}</strong>
                </span>
              </button>
            )
          })()}

          {/* Calendar Button (Replaces Share / Export) */}
          <button
            type="button"
            className="btn-pill btn-primary"
            onClick={() => setCalendarModalOpen(true)}
            title="Open Interactive Study Calendar & Sync"
          >
            <Calendar size={14} />
            <span>Calendar</span>
          </button>

          {/* Launch Pomodoro Focus Session */}
          <button
            type="button"
            className="btn-pill"
            onClick={() => {
              const nextUpcomingTask = tasks.find((t) => !t.completed)
              const targetTitle = nextUpcomingTask
                ? `${nextUpcomingTask.title.replace(/[\u{1F300}-\u{1F9FF}\u{2600}-\u{27BF}\u{2300}-\u{23FF}\u{2B50}\u{2B55}\u{1FA00}-\u{1FAFF}\u{FE0F}]/gu, '').trim()} (${nextUpcomingTask.timeSlot})`
                : 'Focus Session'
              openPomodoroModal(targetTitle)
            }}
            title="Launch 25-minute Pomodoro Study Timer"
          >
            <Clock size={14} />
            <span>Focus Timer</span>
          </button>

          {/* Test Audio Alarm */}
          <button
            type="button"
            className="btn-pill"
            onClick={triggerAlarm}
            title="Open Upcoming Tests and test alarm sound"
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
            {theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
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
              <div className={`profile-dropdown-menu ${profileTab === 'history' ? 'history-mode' : ''}`}>
                {/* Profile Top Segmented Tabs with History Icon */}
                <div className="profile-tabs-header">
                  <button
                    type="button"
                    className={`profile-tab-btn ${profileTab === 'profile' ? 'active' : ''}`}
                    onClick={() => setProfileTab('profile')}
                  >
                    <User size={14} /> <span>Profile</span>
                  </button>
                  <button
                    type="button"
                    className={`profile-tab-btn ${profileTab === 'history' ? 'active' : ''}`}
                    onClick={() => setProfileTab('history')}
                  >
                    <History size={13} className="inline mr-1" />
                    <span>Chat History</span>
                    <span className="profile-tab-badge">
                      {chatList.filter((c) => c.type === 'msg').length}
                    </span>
                  </button>
                </div>

                {profileTab === 'profile' ? (
                  <div>
                    <div className="dropdown-user-info">
                      <div className="dropdown-avatar-large">
                        {userName.slice(0, 2).toUpperCase()}
                      </div>
                      <div className="dropdown-meta">
                        <span className="dropdown-full-name">{userName}</span>
                        <span className="dropdown-email">laksh.hs@adaptive.ai</span>
                        <span className="dropdown-badge">{userRole} • {userGrade}</span>
                        <span style={{ fontSize: '11px', color: 'var(--brand-mint)', marginTop: '3px', fontWeight: 600 }}>
                          {userTargetExam} • {userDailyGoal} min/day
                        </span>
                      </div>
                    </div>

                    <div className="dropdown-divider" />

                    {/* Dedicated Chat History Card Button with prominent clock icon */}
                    <button
                      type="button"
                      className="dropdown-action-btn history-action-card-btn"
                      onClick={() => setProfileTab('history')}
                      style={{
                        padding: '10px 12px',
                        background: 'var(--bg-surface-elevated)',
                        border: '1px solid var(--border-subtle)',
                        borderRadius: '8px',
                        marginBottom: '8px',
                        width: '100%',
                      }}
                    >
                      <History size={18} className="text-emerald-500" />
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', flex: 1 }}>
                        <span style={{ fontWeight: 700, fontSize: '12px', color: 'var(--text-primary)' }}>
                          Chat History
                        </span>
                        <span style={{ fontSize: '10px', color: 'var(--text-tertiary)' }}>
                          {chatList.filter((c) => c.type === 'msg').length} messages recorded
                        </span>
                      </div>
                      <span style={{ fontSize: '11px', color: 'var(--brand-mint)', fontWeight: 700 }}>
                        View ›
                      </span>
                    </button>

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
                        <Settings size={14} />
                        <span>Edit Profile & Goals</span>
                      </button>
                    )}
                    <button
                      type="button"
                      className="dropdown-action-btn logout-btn"
                      onClick={() => setIsProfileOpen(false)}
                    >
                      <LogOut size={14} />
                      <span>Sign Out</span>
                    </button>
                  </div>
                ) : (
                  /* ================= CHAT HISTORY VIEW ================= */
                  <div className="profile-history-panel">
                    <div className="profile-history-header">
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <button
                          type="button"
                          className="history-back-btn"
                          onClick={() => setProfileTab('profile')}
                          title="Back to Profile"
                        >
                          ‹
                        </button>
                        <History size={16} />
                        <div>
                          <div style={{ fontWeight: 700, fontSize: '13px', color: 'var(--text-primary)' }}>
                            Chat History
                          </div>
                          <div style={{ fontSize: '10px', color: 'var(--text-tertiary)' }}>
                            {chatList.filter((c) => c.type === 'msg').length} messages logged
                          </div>
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <button
                          type="button"
                          className="history-header-icon-btn"
                          onClick={refreshChatHistory}
                          title="Refresh from Database"
                          disabled={isRefreshingHistory}
                        >
                          <span style={{ display: 'inline-block', transform: isRefreshingHistory ? 'rotate(180deg)' : 'none', transition: 'transform 0.5s ease' }}>
                            <RotateCcw size={14} />
                          </span>
                        </button>
                        <button
                          type="button"
                          className="history-header-icon-btn"
                          onClick={() => {
                            setIsProfileOpen(false)
                            setIsChatHistoryModalOpen(true)
                          }}
                          title="Expand Full Transcript Modal"
                        >
                          ⤢
                        </button>
                      </div>
                    </div>

                    {/* Search Input */}
                    <div className="history-search-bar">
                      <Search size={14} className="opacity-60" />
                      <input
                        type="text"
                        placeholder="Search conversation history..."
                        value={historySearchQuery}
                        onChange={(e) => setHistorySearchQuery(e.target.value)}
                        className="history-search-input"
                      />
                      {historySearchQuery && (
                        <button
                          type="button"
                          className="history-clear-search-btn"
                          onClick={() => setHistorySearchQuery('')}
                        >
                          <X size={15} />
                        </button>
                      )}
                    </div>

                    {/* Scrollable Conversation History Stream */}
                    <div className="profile-history-list">
                      {filteredChatList.length === 0 ? (
                        <div className="history-empty-state">
                          <Clock size={24} />
                          <div style={{ fontWeight: 600, fontSize: '12px', marginTop: '6px' }}>
                            {historySearchQuery ? 'No matching messages found' : 'No chat history recorded yet'}
                          </div>
                          <div style={{ fontSize: '10px', color: 'var(--text-tertiary)', marginTop: '2px' }}>
                            {historySearchQuery ? 'Try another search term' : 'Ask Reviso a question in the tutor panel'}
                          </div>
                        </div>
                      ) : (
                        filteredChatList.map((entry, idx) => (
                          <div key={entry.id || idx} className={`history-item ${entry.sender || 'bot'}`}>
                            <div className="history-item-meta">
                              <span className="history-sender-badge">
                                {entry.sender === 'user' ? 'You' : 'Reviso AI Tutor'}
                              </span>
                              {entry.timestamp && (
                                <span className="history-timestamp">{entry.timestamp}</span>
                              )}
                            </div>
                            <div
                              className="history-item-bubble"
                              dangerouslySetInnerHTML={{ __html: entry.text || '' }}
                            />
                          </div>
                        ))
                      )}
                    </div>

                    {/* Bottom Action Footer */}
                    <div className="profile-history-footer">
                      <button
                        type="button"
                        className="history-jump-chat-btn"
                        onClick={() => {
                          setIsProfileOpen(false)
                          const chatInputElem = document.querySelector('.chat-input-field') as HTMLInputElement
                          if (chatInputElem) {
                            chatInputElem.focus()
                          }
                          showToast('Switched to tutor chat', 'chat')
                        }}
                      >
                        <MessageSquare size={13} className="inline mr-1" /> <span>Continue in Tutor Chat</span>
                      </button>
                    </div>
                  </div>
                )}
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
                <span className="streak-pill">{userStreak}-Day Streak</span>
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
                <Calendar size={16} className="inline mr-1.5 text-emerald-400" />
                <span>Today's Adaptive Schedule</span>
              </h2>
            </div>

            {/* Diagnostic Review Card (Encouraging Tone) */}
            <div
              className="sync-card"
              onClick={() => triggerAutoSchedule('Python Loop Quick Recap')}
              title="Squeeze in a quick friendly recap into your free time"
              style={{ borderColor: quizCardBorderColor || undefined }}
            >
              <div className="sync-badge">
                <Brain size={14} className="text-emerald-400" />
                <span>DIAGNOSTIC</span>
              </div>
              <div className="sync-meta">
                <div className="sync-score">{quizScoreText}</div>
                <div className="sync-name">Python Nested Loops &amp; Comprehensions</div>
              </div>
              <div className="sync-btn-auto">
                <Zap size={12} className="inline mr-1 text-amber-400" />
                <span>
                  {isRemediationScheduled ? 'Recap Slotted (12:00 PM)' : 'Add 20m Practice'}
                </span>
              </div>
            </div>

            {/* Schedule List with De-cluttered Task Cards & Smart Free Time Chips */}
            <div className="timeline-list">
              {tasks.map((task) => (
                <div key={task.id} id={task.id} className={`task-card ${task.completed ? 'completed' : ''}`}>
                  <div className="task-card-left">
                    <div className="task-check-circle" onClick={() => toggleTask(task.id)}>
                      <Check size={12} strokeWidth={2.5} />
                    </div>
                    <div className="task-info">
                      <div className="task-title">{task.title.replace(/[\u{1F300}-\u{1F9FF}\u{2600}-\u{27BF}\u{2300}-\u{23FF}\u{2B50}\u{2B55}\u{1FA00}-\u{1FAFF}\u{FE0F}]/gu, '').trim()}</div>
                      <div className="task-meta-row">
                        <span className={`task-tag ${task.tagClass}`}>{task.tagIcon}</span>
                        <span>·</span>
                        <span>{task.timeSlot}</span>
                      </div>
                    </div>
                  </div>
                  <div className="task-card-right">
                    {task.videoUrl && (
                      <a
                        href={task.videoUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn-timer"
                        style={{
                          background: 'rgba(239, 68, 68, 0.15)',
                          color: '#EF4444',
                          border: '1px solid rgba(239, 68, 68, 0.4)',
                          textDecoration: 'none',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          fontWeight: 700,
                        }}
                        title={`Watch ${task.videoTitle || 'Tutorial'} on YouTube`}
                      >
                        Video
                      </a>
                    )}
                    <button
                      type="button"
                      className="btn-timer"
                      onClick={() => openPomodoroModal(task.title)}
                    >
                      Focus
                    </button>
                    <button
                      type="button"
                      className={`btn-alarm-bell ${task.alarmActive ? 'active' : ''}`}
                      onClick={() => toggleAlarmBell(task.id, task.title)}
                      title={task.alarmActive ? 'Alarm Active (Click to mute)' : 'Alarm Muted (Click to activate)'}
                      aria-label={task.alarmActive ? 'Alarm Active' : 'Alarm Muted'}
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
                    {emptyBlocks['empty-1'].filled ? 'Scheduled' : 'Recovery Buffer'}
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
                      onClick={() => handleFreeTimeActivity('Walk', '10:30–11:00 AM', 'empty-1', 'walk')}
                    >
                      <span>Walk</span>
                    </button>
                    <button
                      type="button"
                      className="chip-suggestion"
                      onClick={() => handleFreeTimeActivity('Rest', '10:30–11:00 AM', 'empty-1', 'rest')}
                    >
                      <span>Rest</span>
                    </button>
                    <button
                      type="button"
                      className="btn-quick-fill"
                      onClick={() => handleFreeTimeActivity('Quick Revision', '10:30–11:00 AM', 'empty-1', 'revision')}
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
                <div id="slotted-critical-practice" className="task-card critical-remediation">
                  <div className="task-card-left">
                    <div
                      className="task-check-circle"
                      onClick={() => showToast('Loop Practice session marked done!')}
                    >
                      <Check size={12} strokeWidth={2.5} />
                    </div>
                    <div className="task-info">
                      <div className="task-title">Focused Review: Python Nested Loops</div>
                      <div className="task-meta-row">
                        <span className="task-tag task-tag-python">Python</span>
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
                      Focus
                    </button>
                    <span className="badge badge-upcoming">Review Slotted</span>
                  </div>
                </div>
              )}

              {/* Free Time Block 2 (Prime Window) */}
              <div className="empty-block">
                <div className="empty-block-left">
                  <span className="empty-tag">
                    {isRemediationScheduled ? 'Lunch Break' : 'Open Buffer'}
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
                      <Zap size={12} className="inline mr-1" />
                      <span>20m Practice</span>
                    </button>
                    <button
                      type="button"
                      className="chip-suggestion"
                      onClick={() => showToast('Scheduled lunch break', 'coffee')}
                    >
                      <span>Lunch Break</span>
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
                    {emptyBlocks['empty-3'].filled ? 'Scheduled' : 'Recovery Buffer'}
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
                      onClick={() => handleFreeTimeActivity('Walk', '2:15–3:00 PM', 'empty-3', 'walk')}
                    >
                      <span>Walk</span>
                    </button>
                    <button
                      type="button"
                      className="chip-suggestion"
                      onClick={() => handleFreeTimeActivity('Rest', '2:15–3:00 PM', 'empty-3', 'rest')}
                    >
                      <span>Rest</span>
                    </button>
                    <button
                      type="button"
                      className="btn-quick-fill"
                      onClick={() => handleFreeTimeActivity('Math Review', '2:15–3:00 PM', 'empty-3', 'math')}
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
                  <Brain size={16} className="inline mr-1.5 text-emerald-400" />
                  <span>Concept Mastery &amp; Retention</span>
                </h2>
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                  Smart spaced repetition to keep your memory sharp and stress-free
                </div>
              </div>
              <span
                className={`badge ${dktScores.python.safe && dktScores.math.safe && dktScores.chem.safe ? 'badge-done' : 'badge-upcoming'}`}
              >
                {dktScores.python.safe && dktScores.math.safe && dktScores.chem.safe ? 'All Concepts Stable' : '1 Review Recommended'}
              </span>
            </div>

            <div className="dkt-grid">
              {/* Maths Concept Card */}
              {(() => {
                const isSafe = dktScores.math.safe
                const pct = dktScores.math.pct
                const color = pct >= 80 ? '#10B981' : pct >= 60 ? '#38BDF8' : pct >= 40 ? '#F59E0B' : '#EF4444'
                return (
                  <div className="concept-card" style={{ borderTop: `3px solid ${color}` }}>
                    <div className="concept-header">
                      <span className="concept-name">Maths (Algebra)</span>
                      <span className="concept-pct" style={{ color }}>
                        {pct}%
                      </span>
                    </div>
                    <div className="progress-track">
                      <div
                        className="progress-fill"
                        style={{
                          width: `${pct}%`,
                          background: pct >= 80 ? 'var(--grad-math)' : pct >= 60 ? 'var(--grad-chem)' : pct >= 40 ? 'linear-gradient(90deg, #F59E0B, #FBBF24)' : 'linear-gradient(90deg, #EF4444, #F87171)',
                        }}
                      />
                    </div>
                    <div className="decay-risk-bar">
                      <span>Retention:</span>
                      <span style={{ color, fontWeight: 700 }}>
                        {dktScores.math.retention}
                      </span>
                    </div>
                    {(mistakeBank['math'] || []).length > 0 && (
                      <div className="concept-mistake-pill">
                        <RotateCcw size={10} className="inline mr-1 text-amber-400" />
                        {(mistakeBank['math'] || []).length} past missed question(s) queued
                      </div>
                    )}
                    <button
                      type="button"
                      className="btn-concept-quiz"
                      onClick={() => launchQuiz('math')}
                    >
                      <FileText size={12} className="inline mr-1 text-slate-400" />
                      <span>{isSafe ? 'Take Math Drill' : 'Take Booster Drill'}</span>
                    </button>
                  </div>
                )
              })()}

              {/* Chemistry Concept Card */}
              {(() => {
                const isSafe = dktScores.chem.safe
                const pct = dktScores.chem.pct
                const color = pct >= 80 ? '#10B981' : pct >= 60 ? '#38BDF8' : pct >= 40 ? '#F59E0B' : '#EF4444'
                return (
                  <div className="concept-card" style={{ borderTop: `3px solid ${color}` }}>
                    <div className="concept-header">
                      <span className="concept-name">Chemistry (Reactions)</span>
                      <span className="concept-pct" style={{ color }}>
                        {pct}%
                      </span>
                    </div>
                    <div className="progress-track">
                      <div
                        className="progress-fill"
                        style={{
                          width: `${pct}%`,
                          background: pct >= 80 ? 'var(--grad-math)' : pct >= 60 ? 'var(--grad-chem)' : pct >= 40 ? 'linear-gradient(90deg, #F59E0B, #FBBF24)' : 'linear-gradient(90deg, #EF4444, #F87171)',
                        }}
                      />
                    </div>
                    <div className="decay-risk-bar">
                      <span>Retention:</span>
                      <span style={{ color, fontWeight: 700 }}>
                        {dktScores.chem.retention}
                      </span>
                    </div>
                    {(mistakeBank['chem'] || []).length > 0 && (
                      <div className="concept-mistake-pill">
                        <RotateCcw size={10} className="inline mr-1 text-amber-400" />
                        {(mistakeBank['chem'] || []).length} past missed question(s) queued
                      </div>
                    )}
                    <button
                      type="button"
                      className="btn-concept-quiz"
                      onClick={() => launchQuiz('chem')}
                    >
                      <FileText size={12} className="inline mr-1 text-slate-400" />
                      <span>{isSafe ? 'Take Chem Drill' : 'Take Booster Drill'}</span>
                    </button>
                  </div>
                )
              })()}

              {/* Python Concept Card */}
              {(() => {
                const isSafe = dktScores.python.safe
                const pct = dktScores.python.pct
                const color = pct >= 80 ? '#10B981' : pct >= 60 ? '#38BDF8' : pct >= 40 ? '#F59E0B' : '#EF4444'
                return (
                  <div className="concept-card" style={{ borderTop: `3px solid ${color}` }}>
                    <div className="concept-header">
                      <span className="concept-name">Python (Loops &amp; Logic)</span>
                      <span className="concept-pct" style={{ color }}>
                        {pct}%
                      </span>
                    </div>
                    <div className="progress-track">
                      <div
                        className="progress-fill"
                        style={{
                          width: `${pct}%`,
                          background: pct >= 80 ? 'var(--grad-math)' : pct >= 60 ? 'var(--grad-chem)' : pct >= 40 ? 'linear-gradient(90deg, #F59E0B, #FBBF24)' : 'linear-gradient(90deg, #EF4444, #F87171)',
                        }}
                      />
                    </div>
                    <div className="decay-risk-bar">
                      <span>Retention:</span>
                      <span style={{ color, fontWeight: 700 }}>
                        {dktScores.python.retention}
                      </span>
                    </div>
                    {(mistakeBank['python'] || []).length > 0 && (
                      <div className="concept-mistake-pill">
                        <RotateCcw size={10} className="inline mr-1 text-amber-400" />
                        {(mistakeBank['python'] || []).length} past missed question(s) queued
                      </div>
                    )}
                    <button
                      type="button"
                      className="btn-concept-quiz"
                      onClick={() => launchQuiz('python')}
                    >
                      {isSafe ? <FileText size={12} className="inline mr-1 text-slate-400" /> : <Zap size={13} className="inline text-amber-400" />}
                      <span>{isSafe ? 'Take Python Drill' : 'Take Booster Drill'}</span>
                    </button>
                  </div>
                )
              })()}
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
                <Target size={14} className="inline text-emerald-400" />
                <span>Focus Areas &amp; Boosters</span>
              </div>
              <span style={{ fontSize: '11.5px', color: dktScores.python.safe ? '#10B981' : '#004D40', fontWeight: 700 }}>
                {dktScores.python.safe ? 'Retention Secure' : `${pendingBoostersCount} Recommendations Available`}
              </span>
            </div>

            {/* Booster 1 */}
            <div className="critical-item">
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '9px' }}>
                <Lightbulb size={16} className={dktScores.python.safe ? 'text-emerald-400' : 'text-amber-400'} />
                <div>
                  {dktScores.python.safe ? (
                    <span><strong>Python Loops &amp; Logic:</strong> Retention updated to {dktScores.python.pct}% ({dktScores.python.retention}). Memory trace protected!</span>
                  ) : (
                    <span><strong>Quick recap suggested:</strong> A 20-min loop refresher will make your upcoming lab a breeze!</span>
                  )}
                </div>
              </div>
              <button
                type="button"
                className={`btn-schedule-critical ${pythonCritScheduled || dktScores.python.safe ? 'scheduled' : ''}`}
                onClick={() => {
                  if (!dktScores.python.safe && !pythonCritScheduled) {
                    triggerAutoSchedule('Python Loop Quick Recap')
                  } else {
                    launchQuiz('python')
                  }
                }}
              >
                {pythonCritScheduled || dktScores.python.safe ? <Check size={12} className="inline mr-1" /> : <Zap size={12} className="inline mr-1" />}
                <span>{dktScores.python.safe ? 'Mastery Reinforced' : pythonCritScheduled ? 'Slotted for 12:00 PM' : 'Squeeze in 20m Practice'}</span>
              </button>
            </div>

            {/* Booster 2 */}
            <div className="critical-item">
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '9px' }}>
                <Calendar size={16} className="text-sky-400" />
                <div>
                  <strong>Math Midterm in 5 days:</strong> Let's do a relaxed 25m brush-up on quadratic roots.
                </div>
              </div>
              <button
                type="button"
                className={`btn-schedule-critical ${mathMidtermScheduled ? 'scheduled' : ''}`}
                onClick={() => {
                  setMathMidtermScheduled(true)
                  handleFreeTimeActivity('Math Midterm Review', '2:15–3:00 PM', 'empty-3')
                }}
              >
                {mathMidtermScheduled ? <Check size={12} className="inline mr-1" /> : <Calendar size={12} className="inline mr-1" />}
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
                  <span className="status-dot">●</span> Active &amp; Ready
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
                return null
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
              onClick={() => triggerQuickAction('Schedule 20m review before lunch')}
            >
              <Zap size={12} className="inline mr-1" /> <span>Schedule 20m review before lunch</span>
              <span className="arrow">→</span>
            </button>
            <button
              type="button"
              className="quick-btn"
              onClick={() => triggerQuickAction('Start 3-question diagnostic drill')}
            >
              <FileText size={12} className="inline mr-1" /> <span>Start 3-question diagnostic drill</span>
              <span className="arrow">→</span>
            </button>
            <button
              type="button"
              className="quick-btn"
              onClick={() => triggerQuickAction('Analyze memory retention')}
            >
              <TrendingDown size={12} className="inline mr-1" /> <span>Analyze memory retention</span>
              <span className="arrow">→</span>
            </button>
            <button
              type="button"
              className="quick-btn"
              onClick={() => triggerQuickAction('Start 25-minute focus timer')}
            >
              <Clock size={12} className="inline mr-1" /> <span>Start 25-minute focus timer</span>
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
            <button
              type="button"
              className="chat-send-btn"
              disabled={!chatInput.trim()}
              onClick={sendChat}
              title="Send message (Enter)"
              aria-label="Send message"
            >
              <Send size={15} className="chat-send-icon" />
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
        <div className="modal-window" style={{ maxWidth: '640px', width: '94%', maxHeight: '88vh', display: 'flex', flexDirection: 'column' }}>
          {/* Header */}
          <div className="modal-header">
            <div style={{ fontWeight: 800, fontSize: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <FileText size={12} className="inline mr-1 text-slate-400" />
              <span>{currentQuizTitle}</span>
            </div>
            <button
              type="button"
              className="btn-icon"
              style={{ width: '30px', height: '30px' }}
              onClick={() => setQuizModalOpen(false)}
            >
              <X size={15} />
            </button>
          </div>

          <div className="modal-body" style={{ overflowY: 'auto', flex: 1, padding: '20px 24px' }}>
            {quizLoading ? (
              <div style={{ padding: '36px 20px', textAlign: 'center' }}>
                <RotateCcw size={32} className="animate-spin text-emerald-400 inline-block mb-3" />
                <div style={{ fontWeight: 700, fontSize: '15px' }}>Generating Adaptive Baseline Drill...</div>
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '6px' }}>
                  Loading 3 diagnostic questions to evaluate concept retention
                </div>
              </div>
            ) : isQuizFinished ? (
              /* RESULTS & MASTERY SUMMARY SCREEN (PREMIUM REDESIGN) */
              <div className="quiz-results-card">
                {/* 1. Hero Score Banner with Animated Radial Gauge */}
                {(() => {
                  const totalCorrect = quizFinalResult?.totalCorrect ?? 0
                  const isCritical = totalCorrect <= 3
                  const isTier2 = totalCorrect >= 4 && totalCorrect <= 6
                  const isTier3 = totalCorrect >= 7 && totalCorrect <= 8
                  const isTier4 = totalCorrect >= 9
                  const scorePct = quizFinalResult?.scorePct ?? 0
                  const radius = 34
                  const circ = 2 * Math.PI * radius
                  const strokeDashoffset = circ - (scorePct / 100) * circ

                  return (
                    <div className={`quiz-hero-banner ${isCritical ? 'critical' : isTier4 ? 'mastered' : ''}`}>
                      <div className="quiz-hero-glow" />
                      <div className="quiz-hero-left">
                        <div className={`quiz-hero-badge ${isCritical ? 'critical' : isTier4 ? 'mastered' : isTier3 ? 'steady' : 'steady'}`}>
                          <span>
                            {isCritical
                              ? 'Critical Decay Alert'
                              : isTier2
                              ? 'Targeted Review Recommended'
                              : isTier3
                              ? 'Proficient · Refine Lagging Aspect'
                              : 'Mastery Confirmed · You Are Ready!'}
                          </span>
                        </div>
                        <h3 className="quiz-hero-title">
                          {quizFinalResult?.totalCorrect} <span className="score-total">/ {quizFinalResult?.total} Questions Correct</span>
                        </h3>
                        <p className="quiz-hero-sub">
                          {isCritical
                            ? `Score is 3 or less right (${totalCorrect}/10). Automated recovery 1-hour study slot reserved on calendar with recommended YouTube masterclass.`
                            : isTier2
                            ? `Score is between 3 and 6 right (${totalCorrect}/10). Diagnostic pointers and key concept short notes provided below to solidify foundations.`
                            : isTier3
                            ? `Score is between 6 and 8 right (${totalCorrect}/10). Cheat sheet unlocked with targeted focus on your lagging aspect to lock in mastery.`
                            : `Score is 9–10 right (${totalCorrect}/10)! You are ready for your exam. 25-question high-yield practice bank unlocked below.`}
                        </p>
                      </div>

                      {/* Circular Radial Gauge */}
                      <div className="quiz-radial-gauge" title={`${scorePct}% score`}>
                        <svg viewBox="0 0 86 86">
                          <circle
                            className="gauge-bg"
                            cx="43"
                            cy="43"
                            r={radius}
                            strokeWidth="7"
                            fill="none"
                          />
                          <circle
                            className="gauge-fill"
                            cx="43"
                            cy="43"
                            r={radius}
                            strokeWidth="7"
                            fill="none"
                            strokeDasharray={circ}
                            strokeDashoffset={strokeDashoffset}
                          />
                        </svg>
                        <div className="quiz-radial-center">
                          <div className="quiz-radial-pct">{scorePct}%</div>
                          <div className="quiz-radial-label">Score</div>
                        </div>
                      </div>
                    </div>
                  )
                })()}

                {/* 2. Stage Progression Dual Cards */}
                <div className="quiz-stages-row">
                  <div className="quiz-stage-box">
                    <div className="quiz-stage-head">
                      <span className="quiz-stage-pill">Stage 1 · Baseline</span>
                      <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                        {quizFinalResult?.stage1Correct === 3 ? 'Score: 3/3 (100%)' : quizFinalResult?.stage1Correct === 2 ? 'Score: 2/3 (67%)' : 'Foundational'}
                      </span>
                    </div>
                    <div className="quiz-stage-score-val">
                      {quizFinalResult?.stage1Correct} <span style={{ fontSize: '13px', color: 'var(--text-secondary)', fontWeight: 600 }}>/ 3 Correct</span>
                    </div>
                    <div className="quiz-segment-bars">
                      {[0, 1, 2].map((idx) => {
                        const ans = quizUserAnswers[idx]
                        return (
                          <div
                            key={idx}
                            className={`quiz-segment-bar ${ans ? (ans.isCorrect ? 'correct' : 'wrong') : ''}`}
                            title={`Q${idx + 1}: ${ans?.isCorrect ? 'Correct' : 'Incorrect'}`}
                          />
                        )
                      })}
                    </div>
                  </div>

                  <div className="quiz-stage-box">
                    <div className="quiz-stage-head">
                      <span className="quiz-stage-pill" style={{ color: quizFinalResult?.adaptiveDifficulty === 'hard' ? '#ffb703' : 'var(--accent-primary)' }}>
                        Stage 2 · {quizFinalResult?.adaptiveDifficulty?.toUpperCase() || 'ADAPTIVE'} (7 Questions)
                      </span>
                      <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                        Dynamic Branch
                      </span>
                    </div>
                    <div className="quiz-stage-score-val">
                      {quizFinalResult?.stage2Correct} <span style={{ fontSize: '13px', color: 'var(--text-secondary)', fontWeight: 600 }}>/ {quizFinalResult?.stage2Total} Correct</span>
                    </div>
                    <div className="quiz-segment-bars">
                      {[3, 4, 5, 6, 7, 8, 9].map((idx) => {
                        const ans = quizUserAnswers[idx]
                        return (
                          <div
                            key={idx}
                            className={`quiz-segment-bar ${ans ? (ans.isCorrect ? 'correct' : 'wrong') : ''}`}
                            title={`Q${idx + 1}: ${ans ? (ans.isCorrect ? 'Correct' : 'Incorrect') : 'Unanswered'}`}
                          />
                        )
                      })}
                    </div>
                  </div>
                </div>

                {/* 3. TIER 1 OUTCOME: <= 3 right (Critical Remediation & YouTube Tutorial) */}
                {quizFinalResult && quizFinalResult.totalCorrect <= 3 && (
                  <div className="quiz-critical-remediation-box">
                    <div className="quiz-critical-top">
                      <div className="quiz-critical-header-text">
                        <h4>Critical Intervention Scheduled ({quizFinalResult.totalCorrect}/10 Correct)</h4>
                        <p>
                          Retention fell into critical decay risk (3 or less right). The smart scheduler auto-reserved a <strong>1-Hour Focused Study Slot</strong> and recommended a top-rated YouTube tutorial masterclass to rebuild core mastery.
                        </p>
                      </div>
                    </div>

                    {/* Calendar Slot Strip */}
                    {criticalRemediationInfo && (
                      <div className="quiz-cal-slot-strip">
                        <div className="quiz-cal-slot-left">
                          <div className="quiz-cal-date-chip">
                            <span className="day-num">{criticalRemediationInfo.dayNumber}</span>
                            <span className="day-name">Sep</span>
                          </div>
                          <div className="quiz-cal-details">
                            <div className="quiz-cal-title-line">
                              Dedicated Study Session: {criticalRemediationInfo.subject} - {criticalRemediationInfo.topic}
                            </div>
                            <div className="quiz-cal-sub-line">
                              <span><Calendar size={12} className="inline mr-1" /> {criticalRemediationInfo.dayName}</span>
                              <span>•</span>
                              <span><Clock size={12} className="inline mr-1" /> {criticalRemediationInfo.timeSlot} (60 min)</span>
                            </div>
                          </div>
                        </div>

                        <button
                          type="button"
                          className="btn-pill"
                          style={{
                            background: 'rgba(239, 68, 68, 0.18)',
                            color: '#f87171',
                            border: '1px solid rgba(239, 68, 68, 0.45)',
                            fontWeight: 700,
                            fontSize: '12px',
                            padding: '8px 14px',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px',
                            cursor: 'pointer',
                          }}
                          onClick={() => {
                            setSelectedCalDay(criticalRemediationInfo.dayNumber)
                            setCalYear(2026)
                            setCalMonth(8)
                            setGcalView('day')
                            setQuizModalOpen(false)
                            setCalendarModalOpen(true)
                          }}
                        >
                          <Calendar size={14} className="inline mr-1" /> <span>View on Calendar</span>
                        </button>
                      </div>
                    )}

                    {/* YouTube Masterclass Video Card */}
                    {(quizTierOutcome?.video || criticalRemediationInfo?.video) && (
                      <div className="quiz-yt-masterclass-card">
                        <div className="quiz-yt-left">
                          <div className="quiz-yt-play-badge">
                            ▶
                          </div>
                          <div className="quiz-yt-info">
                            <span className="quiz-yt-tag">Recommended Masterclass Video</span>
                            <div className="quiz-yt-title" title={(quizTierOutcome?.video || criticalRemediationInfo?.video)?.title}>
                              {(quizTierOutcome?.video || criticalRemediationInfo?.video)?.title}
                            </div>
                            <span className="quiz-yt-channel">
                              Channel: <strong>{(quizTierOutcome?.video || criticalRemediationInfo?.video)?.channel}</strong> • Verified top-rated lesson
                            </span>
                          </div>
                        </div>

                        <a
                          href={(quizTierOutcome?.video || criticalRemediationInfo?.video)?.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="quiz-yt-btn"
                        >
                          <ExternalLink size={13} className="inline mr-1" /> <span>Watch Tutorial</span>
                        </a>
                      </div>
                    )}
                  </div>
                )}

                {/* 3. TIER 2 OUTCOME: 4 to 6 right (Diagnostic Pointers & Short Notes) */}
                {quizFinalResult && quizFinalResult.totalCorrect >= 4 && quizFinalResult.totalCorrect <= 6 && (
                  <div className="quiz-tier-notes-box">
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div className="quiz-tier-badge amber">
                        <span>Tier 2 · Diagnostic Pointers & Short Notes</span>
                      </div>
                      <span style={{ fontSize: '11.5px', color: '#fbbf24', fontWeight: 600 }}>
                        Score: {quizFinalResult.totalCorrect}/10 Correct
                      </span>
                    </div>

                    {/* Actionable Pointers */}
                    {quizTierOutcome?.pointers && (
                      <div className="quiz-pointers-list">
                        <div style={{ fontSize: '12px', fontWeight: 800, color: '#fbbf24', textTransform: 'uppercase', letterSpacing: '0.03em' }}>
                          Diagnostic Pointers
                        </div>
                        {quizTierOutcome.pointers.map((pointer, pIdx) => (
                          <div key={pIdx} className="quiz-pointer-item">
                            <span style={{ color: '#fbbf24', fontWeight: 800 }}>•</span>
                            <span>{pointer}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Short Notes Grid */}
                    {quizTierOutcome?.shortNotes && (
                      <div className="quiz-short-notes-grid">
                        {quizTierOutcome.shortNotes.map((note, nIdx) => (
                          <div key={nIdx} className="quiz-note-card">
                            <div className="quiz-note-title">{note.title}</div>
                            <div className="quiz-note-body">{note.body}</div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* 3. TIER 3 OUTCOME: 7 to 8 right (Cheat Sheet & Lagging Aspect Refinement) */}
                {quizFinalResult && quizFinalResult.totalCorrect >= 7 && quizFinalResult.totalCorrect <= 8 && (
                  <div className="quiz-tier-cheatsheet-box">
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div className="quiz-tier-badge indigo">
                        <span>Tier 3 · Cheat Sheet & Lagging Aspect</span>
                      </div>
                      <span style={{ fontSize: '11.5px', color: '#818cf8', fontWeight: 600 }}>
                        Score: {quizFinalResult.totalCorrect}/10 Correct
                      </span>
                    </div>

                    {/* Lagging Aspect Alert */}
                    {quizTierOutcome?.laggingAspect && (
                      <div className="quiz-lagging-alert">
                        <AlertCircle size={20} className="text-indigo-400 flex-shrink-0" />
                        <div>
                          <div style={{ fontWeight: 800, color: '#ffffff', fontSize: '13px' }}>
                            Focus Area: {quizTierOutcome.laggingAspect.area}
                          </div>
                          <div style={{ fontSize: '12px', color: '#c7d2fe', marginTop: '2px' }}>
                            {quizTierOutcome.laggingAspect.advice}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Topic Cheat Sheet Grid */}
                    {quizTierOutcome?.cheatSheet && (
                      <div className="quiz-cheatsheet-grid">
                        {quizTierOutcome.cheatSheet.map((sheet, sIdx) => (
                          <div key={sIdx} className="quiz-cheatsheet-card">
                            <div className="quiz-cheatsheet-category">{sheet.category}</div>
                            {sheet.rules.map((rule, rIdx) => (
                              <div
                                key={rIdx}
                                className="quiz-cheatsheet-rule"
                                dangerouslySetInnerHTML={{
                                  __html: rule.replace(/`([^`]+)`/g, '<code>$1</code>'),
                                }}
                              />
                            ))}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* 3. TIER 4 OUTCOME: 9 to 10 right (Mastery "You are ready!" & 25 Practice Question Bank) */}
                {quizFinalResult && quizFinalResult.totalCorrect >= 9 && (
                  <div className="quiz-tier-ready-box">
                    <div className="quiz-ready-hero">
                      <div>
                        <div className="quiz-tier-badge emerald mb-2">
                          <span>Tier 4 · Concept Mastered</span>
                        </div>
                        <div className="quiz-ready-title">You are ready!</div>
                        <div className="quiz-ready-sub">
                          You scored {quizFinalResult.totalCorrect}/10. High-yield 25-question practice bank unlocked below for exam prep.
                        </div>
                      </div>
                      <button
                        type="button"
                        className="btn-pill"
                        style={{
                          background: 'rgba(16, 185, 129, 0.2)',
                          color: '#34d399',
                          border: '1px solid rgba(16, 185, 129, 0.45)',
                          fontSize: '11.5px',
                          fontWeight: 700,
                          padding: '7px 12px',
                          cursor: 'pointer',
                        }}
                        onClick={() => {
                          const allIds: Record<number, boolean> = {}
                          const bank = quizTierOutcome?.questionBank || []
                          const shouldReveal = Object.keys(revealedBankAnswers).length < bank.length
                          if (shouldReveal) {
                            bank.forEach((q) => {
                              allIds[q.id] = true
                            })
                          }
                          setRevealedBankAnswers(allIds)
                        }}
                      >
                        {Object.keys(revealedBankAnswers).length > 0 ? 'Hide All Answers' : 'Reveal All Answers'}
                      </button>
                    </div>

                    {/* Scrollable 25-Question Practice Bank */}
                    {quizTierOutcome?.questionBank && (
                      <div className="quiz-bank-scroll">
                        {quizTierOutcome.questionBank.map((qItem) => {
                          const isRevealed = !!revealedBankAnswers[qItem.id]
                          return (
                            <div key={qItem.id} className="quiz-bank-item">
                              <div className="quiz-bank-q-header">
                                <span>Question {qItem.id} of 25</span>
                                <span style={{ fontSize: '10.5px', color: 'var(--text-secondary)', fontWeight: 500 }}>
                                  Hint: {qItem.hint}
                                </span>
                              </div>
                              <div className="quiz-bank-q-text">{qItem.question}</div>
                              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '4px' }}>
                                {isRevealed ? (
                                  <div className="quiz-bank-ans">
                                    <strong>Answer:</strong> {qItem.answer}
                                  </div>
                                ) : (
                                  <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Click to view solution</span>
                                )}
                                <button
                                  type="button"
                                  style={{
                                    background: 'transparent',
                                    border: 'none',
                                    color: '#34d399',
                                    fontSize: '11px',
                                    fontWeight: 700,
                                    cursor: 'pointer',
                                    textDecoration: 'underline',
                                  }}
                                  onClick={() => {
                                    setRevealedBankAnswers((prev) => ({
                                      ...prev,
                                      [qItem.id]: !prev[qItem.id],
                                    }))
                                  }}
                                >
                                  {isRevealed ? 'Hide Answer' : 'Show Answer'}
                                </button>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </div>
                )}

                {/* 4. Detailed Question-by-Question Review Breakdown with Filter Tabs */}
                <div className="quiz-review-section">
                  <div className="quiz-review-header">
                    <div className="quiz-review-title">Question-By-Question Breakdown</div>
                    <div className="quiz-filter-pills">
                      <button
                        type="button"
                        className={`quiz-filter-btn ${quizReviewFilter === 'all' ? 'active' : ''}`}
                        onClick={() => setQuizReviewFilter('all')}
                      >
                        All ({quizUserAnswers.length})
                      </button>
                      <button
                        type="button"
                        className={`quiz-filter-btn ${quizReviewFilter === 'wrong' ? 'active' : ''}`}
                        onClick={() => setQuizReviewFilter('wrong')}
                      >
                        Needs Review ({quizUserAnswers.filter((a) => !a.isCorrect).length})
                      </button>
                      <button
                        type="button"
                        className={`quiz-filter-btn ${quizReviewFilter === 'correct' ? 'active' : ''}`}
                        onClick={() => setQuizReviewFilter('correct')}
                      >
                        Correct ({quizUserAnswers.filter((a) => a.isCorrect).length})
                      </button>
                    </div>
                  </div>

                  <div className="quiz-review-list">
                    {quizUserAnswers
                      .map((ans, idx) => ({ ans, idx, q: quizQuestions[idx] }))
                      .filter(({ ans }) => {
                        if (quizReviewFilter === 'wrong') return !ans.isCorrect
                        if (quizReviewFilter === 'correct') return ans.isCorrect
                        return true
                      })
                      .map(({ ans, idx, q }) => (
                        <div key={idx} className={`quiz-review-card ${ans.isCorrect ? 'correct' : 'wrong'}`}>
                          <div className="quiz-review-card-top">
                            <div className="quiz-q-num-pill">
                              <span>{ans.isCorrect ? <CheckCircle size={14} className="text-emerald-400" /> : <XCircle size={14} className="text-rose-400" />}</span>
                              <span>Question {idx + 1}</span>
                              <span style={{ fontSize: '10.5px', color: 'var(--text-secondary)', fontWeight: 500 }}>
                                ({idx < 3 ? 'Stage 1: Baseline' : `Stage 2: ${adaptiveDifficulty?.toUpperCase() || 'ADAPTIVE'}`})
                              </span>
                            </div>
                            {q?.difficulty && (
                              <span className={`quiz-difficulty-tag ${q.difficulty}`}>
                                {q.difficulty}
                              </span>
                            )}
                          </div>

                          {q?.question && (
                            <div className="quiz-q-text">
                              {q.question}
                            </div>
                          )}

                          <div className="quiz-answers-comparison">
                            <div className={`quiz-ans-row ${ans.isCorrect ? 'user-correct' : 'user-wrong'}`}>
                              <span>{ans.isCorrect ? <Check size={12} className="inline text-emerald-400" /> : <X size={12} className="inline text-rose-400" />} Your Answer:</span>
                              <strong>{ans.selected_answer || '(No answer provided)'}</strong>
                            </div>

                            {!ans.isCorrect && q?.correct_answer && (
                              <div className="quiz-ans-row correct-ans">
                                <span><Check size={12} className="inline text-emerald-400" /> Correct Answer:</span>
                                <strong>{q.correct_answer}</strong>
                              </div>
                            )}
                          </div>

                          {q?.explanation && (
                            <div className="quiz-explanation-box">
                              <strong>Key Takeaway:</strong> {q.explanation}
                            </div>
                          )}
                        </div>
                      ))}
                  </div>
                </div>
              </div>
            ) : quizQuestions.length > 0 ? (
              /* ACTIVE QUESTION STEPPER */
              <div>
                {/* Spaced Repetition Notice for Retrying Past Mistakes */}
                {quizStage === 1 && mistakeNotice && (
                  <div className="quiz-spaced-repetition-banner">
                    <RotateCcw size={13} className="text-amber-400" />
                    <span>{mistakeNotice}</span>
                  </div>
                )}

                {/* Adaptive Stage 2 Notification Banner */}
                {quizStage === 2 && adaptiveNotice && (
                  <div className={`quiz-adaptive-banner ${adaptiveDifficulty || 'medium'}`}>
                    <Zap size={14} className="text-amber-400" />
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
                    {/* Spaced Repetition Badge if this question is from user's past mistakes */}
                    {(mistakeBank[currentQuizSubject] || []).some(
                      (q) => q.id === quizQuestions[currentQuestionIdx]?.id || q.question === quizQuestions[currentQuestionIdx]?.question
                    ) && (
                      <span className="badge-mistake-retry">
                        <RotateCcw size={10} className="inline mr-1 text-amber-400" />
                        Retrying Past Mistake
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
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                {criticalRemediationInfo && (
                  <button
                    type="button"
                    className="btn-pill"
                    style={{
                      background: 'rgba(239, 68, 68, 0.15)',
                      color: '#f87171',
                      border: '1px solid rgba(239, 68, 68, 0.45)',
                      fontWeight: 700,
                      fontSize: '12px',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                    }}
                    onClick={() => {
                      setSelectedCalDay(criticalRemediationInfo.dayNumber)
                      setCalYear(2026)
                      setCalMonth(8)
                      setGcalView('day')
                      setQuizModalOpen(false)
                      setCalendarModalOpen(true)
                    }}
                  >
                    <Calendar size={14} className="inline mr-1" /> <span>Open in Calendar</span>
                  </button>
                )}
                <button
                  type="button"
                  className="quiz-next-btn"
                  onClick={() => launchQuiz(currentQuizSubject)}
                >
                  <span>Take Another Adaptive Drill</span>
                  <RotateCcw size={14} />
                </button>
              </div>
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
                    <span>Unlocking 7 {adaptiveDifficulty?.toUpperCase()} questions...</span>
                  ) : (
                    <>
                      <span>Unlock Stage 2 (7 {adaptiveDifficulty?.toUpperCase()} Questions)</span>
                      <ArrowRightIcon size={16} />
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
                  <ArrowRightIcon size={16} />
                </button>
              ) : (
                <button
                  type="button"
                  className="quiz-next-btn"
                  onClick={handleFinishQuiz}
                >
                  <span>Finish Adaptive Quiz &amp; View Results</span>
                  <CheckIcon size={16} />
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
              <Clock size={14} />
              <span>Focus: {pomoSessionName}</span>
            </div>
            <button
              type="button"
              className="btn-icon"
              style={{ width: '30px', height: '30px' }}
              onClick={() => setPomoModalOpen(false)}
            >
              <X size={15} />
            </button>
          </div>
          <div className="modal-body">
            <div className="timer-display">
              <div className="timer-digits">
                {formatTimerDigits(pomoSeconds)}
              </div>
              <div style={{ fontSize: '13px', color: 'var(--text-secondary)', fontWeight: 500 }}>
                {pomoDurationMinutes <= 15 ? 'Break & Recovery Buffer' : 'Deep Focus Block · Work steadily'}
              </div>

              {/* Progress Track */}
              <div className="timer-progress-track">
                <div
                  className="timer-progress-fill"
                  style={{
                    width: `${Math.max(0, Math.min(100, ((pomoDurationMinutes * 60 - pomoSeconds) / (pomoDurationMinutes * 60)) * 100))}%`
                  }}
                />
              </div>

              {/* Interactive Duration Stepper & Custom Input */}
              <div className="timer-duration-adjuster">
                <button
                  type="button"
                  className="btn-duration-step"
                  onClick={() => adjustPomoDuration(-5)}
                  title="Decrease by 5 minutes"
                  disabled={pomoDurationMinutes <= 5}
                >
                  -5m
                </button>
                <button
                  type="button"
                  className="btn-duration-step"
                  onClick={() => adjustPomoDuration(-1)}
                  title="Decrease by 1 minute"
                  disabled={pomoDurationMinutes <= 1}
                >
                  -1m
                </button>

                <div className="duration-input-wrapper" title="Type custom minutes">
                  <input
                    type="number"
                    min="1"
                    max="180"
                    value={pomoDurationMinutes}
                    onChange={(e) => {
                      const val = parseInt(e.target.value, 10)
                      if (!isNaN(val) && val > 0 && val <= 300) {
                        changePomoDuration(val)
                      }
                    }}
                    className="duration-number-input"
                    aria-label="Pomodoro duration in minutes"
                  />
                  <span className="duration-unit">min</span>
                </div>

                <button
                  type="button"
                  className="btn-duration-step"
                  onClick={() => adjustPomoDuration(1)}
                  title="Increase by 1 minute"
                  disabled={pomoDurationMinutes >= 180}
                >
                  +1m
                </button>
                <button
                  type="button"
                  className="btn-duration-step"
                  onClick={() => adjustPomoDuration(5)}
                  title="Increase by 5 minutes"
                  disabled={pomoDurationMinutes >= 180}
                >
                  +5m
                </button>
              </div>

              {/* Smooth Quick Drag Range Slider */}
              <div className="duration-slider-row">
                <input
                  type="range"
                  min="5"
                  max="120"
                  step="5"
                  value={Math.min(120, Math.max(5, pomoDurationMinutes))}
                  onChange={(e) => changePomoDuration(parseInt(e.target.value, 10))}
                  className="duration-range-slider"
                  title={`Slide to adjust duration: ${pomoDurationMinutes} min`}
                />
              </div>
            </div>

            {/* Quick Presets Row */}
            <div className="timer-presets-row">
              {[
                { label: '15 min', mins: 15 },
                { label: '25 min', mins: 25 },
                { label: '45 min', mins: 45 },
                { label: '60 min', mins: 60 },
                { label: '90 min', mins: 90 },
                { label: '5m Break', mins: 5 },
              ].map((preset) => (
                <button
                  key={preset.mins}
                  type="button"
                  className={`timer-preset-chip ${pomoDurationMinutes === preset.mins ? 'active' : ''}`}
                  onClick={() => handleSelectPomoPreset(preset.mins, preset.label)}
                >
                  <span>{preset.label}</span>
                </button>
              ))}
            </div>

            <div className="timer-controls" style={{ justifyContent: 'center' }}>
              <button
                type="button"
                className={`btn-pill ${pomoRunning ? 'btn-timer-pause' : 'btn-primary'}`}
                style={{ padding: '10px 24px', fontSize: '14px', minWidth: '124px' }}
                onClick={togglePomodoro}
              >
                {pomoRunning ? <Pause size={14} /> : <Play size={14} />}
                <span>{pomoRunning ? 'Pause' : 'Start'}</span>
              </button>

              <button
                type="button"
                className={`btn-timer-reset ${isResettingPomo ? 'spinning' : ''}`}
                onClick={() => resetPomodoro()}
                title={`Reset timer to ${pomoDurationMinutes}:00`}
              >
                <svg
                  className="timer-reset-icon"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
                  <path d="M3 3v5h5" />
                </svg>
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
      {/* ==========================================================================
           UPCOMING TESTS & STUDY ALARMS MODAL WINDOW (Next 3 Tests)
           ========================================================================== */}
      <div
        className={`modal-backdrop ${alarmModalOpen ? 'active' : ''}`}
        onClick={(e) => {
          if (e.target === e.currentTarget) setAlarmModalOpen(false)
        }}
      >
        <div
          className="modal-window test-alarm-modal"
          style={{ maxWidth: '580px', width: '92%' }}
        >
          {/* Header */}
          <div className="modal-header" style={{ padding: '18px 22px', borderBottom: '1.5px solid var(--border-subtle)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '8px',
                  background: 'rgba(16, 185, 129, 0.15)',
                  border: '1px solid rgba(16, 185, 129, 0.3)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <BellIcon size={18} color="var(--accent-primary, #34d399)" />
              </div>
              <div>
                <h3 style={{ fontSize: '16px', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>
                  Upcoming Tests &amp; Study Alarms
                </h3>
                <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: '2px 0 0 0' }}>
                  Next 3 scheduled assessments · Auto-alarm monitoring enabled
                </p>
              </div>
            </div>
            <button
              type="button"
              className="btn-icon"
              onClick={() => setAlarmModalOpen(false)}
              aria-label="Close test alarms"
              style={{ width: '32px', height: '32px' }}
            >
              <X size={16} />
            </button>
          </div>

          {/* Modal Body */}
          <div className="modal-body" style={{ padding: '20px 22px', gap: '14px' }}>
            <div className="upcoming-tests-container">
              {[
                {
                  id: 'test-1',
                  title: 'Linear Algebra & Vector Spaces Diagnostic',
                  subject: 'Maths',
                  tagClass: 'task-tag-math',
                  dateDisplay: 'Today (Sep 13)',
                  timeSlot: '10:00 – 11:30 AM',
                  location: 'Interactive Drill Room',
                  daysAway: 0,
                },
                {
                  id: 'test-2',
                  title: 'Organic Chemistry Reaction Mechanisms Chapter Test',
                  subject: 'Chemistry',
                  tagClass: 'task-tag-chem',
                  dateDisplay: 'Tomorrow (Sep 14)',
                  timeSlot: '9:30 – 11:00 AM',
                  location: 'Science Wing Hall B',
                  daysAway: 1,
                },
                {
                  id: 'test-3',
                  title: 'Linear Algebra Semester Exam',
                  subject: 'Maths',
                  tagClass: 'task-tag-math',
                  dateDisplay: 'Tuesday, Sep 15',
                  timeSlot: '9:00 AM – 12:00 PM',
                  location: 'Examination Hall A',
                  daysAway: 2,
                },
              ].map((test) => {
                const isWithinDay = test.daysAway <= 1
                return (
                  <div
                    key={test.id}
                    className={`upcoming-test-card ${isWithinDay ? 'urgent-red' : ''}`}
                  >
                    <div className="upcoming-test-left">
                      {/* Icon: Turns RED for tests within 1 day */}
                      <div className={`upcoming-test-icon-box ${isWithinDay ? 'urgent-red' : ''}`}>
                        <BellIcon
                          size={18}
                          color={isWithinDay ? '#EF4444' : 'var(--text-secondary)'}
                        />
                      </div>

                      <div className="upcoming-test-details">
                        <div className="upcoming-test-title-row">
                          <span className="upcoming-test-title">{test.title}</span>
                          <span className={`task-tag ${test.tagClass}`}>{test.subject}</span>
                          <span
                            className={`upcoming-test-urgency-pill ${
                              isWithinDay ? 'urgent-red' : 'normal'
                            }`}
                          >
                            {isWithinDay ? (
                              <>
                                <AlertCircle size={10} className="inline mr-1" />
                                {test.daysAway === 0 ? 'Today · Urgent' : 'Within 24h · Urgent'}
                              </>
                            ) : (
                              `In ${test.daysAway} Days`
                            )}
                          </span>
                        </div>

                        <div className="upcoming-test-meta">
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                            <Calendar size={12} />
                            {test.dateDisplay}
                          </span>
                          <span>·</span>
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                            <Clock size={12} />
                            {test.timeSlot}
                          </span>
                          <span>·</span>
                          <span style={{ color: 'var(--text-tertiary)' }}>{test.location}</span>
                        </div>
                      </div>
                    </div>

                    <div className="upcoming-test-actions">
                      <button
                        type="button"
                        className={`btn-test-chime ${isWithinDay ? 'urgent-red' : ''}`}
                        onClick={() => {
                          soundSynth.playHarmonicChime()
                          showToast(`Alarm chime triggered for ${test.title}!`)
                        }}
                        title="Test audio chime for this specific test"
                      >
                        <BellIcon size={12} color={isWithinDay ? '#EF4444' : 'currentColor'} />
                        <span>Test Chime</span>
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Bottom Alert / Info Strip */}
            <div
              style={{
                background: 'rgba(239, 68, 68, 0.08)',
                border: '1px solid rgba(239, 68, 68, 0.25)',
                borderRadius: '10px',
                padding: '10px 14px',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                fontSize: '12px',
                color: 'var(--text-secondary)',
              }}
            >
              <AlertCircle size={16} color="#EF4444" style={{ flexShrink: 0 }} />
              <span>
                Tests occurring within <strong style={{ color: '#F87171' }}>24 hours</strong> are highlighted in red with high-priority study alarms armed.
              </span>
            </div>
          </div>

          {/* Footer */}
          <div
            className="modal-footer"
            style={{
              padding: '14px 22px',
              borderTop: '1.5px solid var(--border-subtle)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <button
              type="button"
              className="btn-pill"
              onClick={() => {
                soundSynth.playHarmonicChime()
                showToast('Master alarm audio synthesizer tested successfully!')
              }}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
            >
              <BellIcon size={13} color="currentColor" />
              <span>Play Master Alarm Sound</span>
            </button>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                type="button"
                className="btn-pill"
                onClick={() => {
                  setAlarmModalOpen(false)
                  setCalendarModalOpen(true)
                }}
              >
                <Calendar size={13} className="inline mr-1" />
                <span>View Full Calendar</span>
              </button>
              <button
                type="button"
                className="btn-pill btn-primary"
                onClick={() => setAlarmModalOpen(false)}
              >
                <span>Close</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ==========================================================================
           FULL-PAGE STUDY CALENDAR & WORKSPACE (Month + Day View with Full Scroll)
           ========================================================================== */}
      {/* ==========================================================================
           GOOGLE CALENDAR WORKSPACE (Authentic Fullscreen Layout)
           ========================================================================== */}
      <div
        className={`gcal-overlay ${calendarModalOpen ? 'active' : ''}`}
        id="google-calendar-workspace"
      >
        {/* 1. TOP APP BAR */}
        <header className="gcal-topbar">
          <div className="gcal-topbar-left">
            {/* Hamburger button to toggle sidebar */}
            <button
              type="button"
              className="gcal-menu-btn"
              onClick={() => setGcalSidebarOpen((prev) => !prev)}
              title="Main menu (Toggle Sidebar)"
            >
              <Menu size={16} />
            </button>

            {/* Google Calendar Logo & Brand */}
            <div className="gcal-logo" onClick={handleJumpToTodayMonth}>
              <div className="gcal-logo-icon">
                <span className="gcal-logo-icon-month">{MONTH_NAMES[calMonth].slice(0, 3)}</span>
                <span className="gcal-logo-icon-day">{selectedCalDay}</span>
              </div>
              <span>Reviso Calendar</span>
            </div>

            {/* Nav Group: Today, Chevrons, Dynamic Date Title */}
            <div className="gcal-nav-group">
              <button
                type="button"
                className="gcal-today-btn"
                onClick={handleJumpToTodayMonth}
              >
                Today
              </button>

              <div className="gcal-nav-arrows">
                <button
                  type="button"
                  className="gcal-arrow-btn"
                  onClick={handleNavPrev}
                  title="Previous period"
                >
                  ‹
                </button>
                <button
                  type="button"
                  className="gcal-arrow-btn"
                  onClick={handleNavNext}
                  title="Next period"
                >
                  ›
                </button>
              </div>

              <span className="gcal-title-range">{getGcalTitle()}</span>
            </div>
          </div>

          <div className="gcal-topbar-right">
            {/* Real-time search bar */}
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <input
                type="text"
                className="chat-input-field"
                style={{
                  width: '190px',
                  padding: '6px 12px 6px 30px',
                  fontSize: '12.5px',
                  background: '#21262d',
                  borderRadius: '8px',
                  border: '1px solid #30363d',
                }}
                placeholder="Search schedule..."
                value={gcalSearchQuery}
                onChange={(e) => setGcalSearchQuery(e.target.value)}
              />
              <span style={{ position: 'absolute', left: '10px', fontSize: '12px', color: '#8b949e', pointerEvents: 'none' }}>
                <Search size={14} />
              </span>
            </div>

            {/* View Selector Dropdown */}
            <select
              className="gcal-view-selector"
              value={gcalView}
              onChange={(e) => setGcalView(e.target.value as any)}
            >
              <option value="week">Week</option>
              <option value="month">Month</option>
              <option value="day">Day</option>
              <option value="agenda">Schedule</option>
            </select>

            {/* Sync / Export .ics */}
            <button
              type="button"
              className="gcal-action-btn primary"
              onClick={handleSyncCalendar}
              title="Download standard RFC-5545 .ics for Google Calendar"
            >
              <Download size={14} />
              <span>{calendarSyncActive ? 'Exporting...' : 'Export .ics'}</span>
            </button>

            {/* Close X Button */}
            <button
              type="button"
              className="gcal-close-btn"
              onClick={() => setCalendarModalOpen(false)}
              title="Exit Calendar (Esc)"
            >
              <X size={15} />
            </button>
          </div>
        </header>

        {/* 2. WORKSPACE CONTAINER (Sidebar + Main Grid Body) */}
        <div className="gcal-workspace">
          {/* Collapsible Left Sidebar */}
          <aside className={`gcal-sidebar ${gcalSidebarOpen ? '' : 'collapsed'}`}>
            {/* Google-style + Create Button */}
            <button
              type="button"
              className="gcal-create-btn"
              onClick={() => {
                setNewCalTaskTitle('')
                setGcalQuickCreateOpen(true)
              }}
            >
              <span className="gcal-create-icon">＋</span>
              <span>Create</span>
            </button>

            {/* Mini-Month Datepicker Widget */}
            <div className="gcal-mini-month">
              <div className="gcal-mini-header">
                <span className="gcal-mini-title">
                  {MONTH_NAMES[miniCalMonth]} {miniCalYear}
                </span>
                <div className="gcal-mini-arrows">
                  <button
                    type="button"
                    className="gcal-mini-arrow-btn"
                    onClick={() => {
                      if (miniCalMonth === 0) {
                        setMiniCalMonth(11)
                        setMiniCalYear((y) => y - 1)
                      } else {
                        setMiniCalMonth((m) => m - 1)
                      }
                    }}
                  >
                    ‹
                  </button>
                  <button
                    type="button"
                    className="gcal-mini-arrow-btn"
                    onClick={() => {
                      if (miniCalMonth === 11) {
                        setMiniCalMonth(0)
                        setMiniCalYear((y) => y + 1)
                      } else {
                        setMiniCalMonth((m) => m + 1)
                      }
                    }}
                  >
                    ›
                  </button>
                </div>
              </div>

              <div className="gcal-mini-grid">
                {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
                  <div key={i} className="gcal-mini-day-header">
                    {d}
                  </div>
                ))}

                {/* Empty cells */}
                {Array.from({ length: new Date(miniCalYear, miniCalMonth, 1).getDay() }).map((_, i) => (
                  <div key={`mini-empty-${i}`} />
                ))}

                {/* Day cells */}
                {Array.from({ length: new Date(miniCalYear, miniCalMonth + 1, 0).getDate() }, (_, i) => i + 1).map((d) => {
                  const isToday = miniCalYear === 2026 && miniCalMonth === 8 && d === 12
                  const isSelected = miniCalYear === calYear && miniCalMonth === calMonth && d === selectedCalDay
                  const dayTasks = getTasksForDate(miniCalYear, miniCalMonth, d)
                  const hasTasks = dayTasks.length > 0

                  let cls = 'gcal-mini-day-cell'
                  if (isToday) cls += ' today'
                  if (isSelected) cls += ' selected'
                  if (hasTasks && !isToday) cls += ' has-tasks'

                  return (
                    <div
                      key={d}
                      className={cls}
                      onClick={() => {
                        setSelectedCalDay(d)
                        setCalMonth(miniCalMonth)
                        setCalYear(miniCalYear)
                        soundSynth.playHarmonicChime()
                      }}
                    >
                      {d}
                    </div>
                  )
                })}
              </div>
            </div>

            {/* "My Calendars" Subject Category Checklist */}
            <div className="gcal-calendars-section">
              <div className="gcal-section-title">
                <span>My Calendars</span>
                <span style={{ fontSize: '10px', color: '#8b949e' }}>5 Active</span>
              </div>

              <div className="gcal-calendar-list">
                {[
                  { name: 'Maths', color: '#10b981' },
                  { name: 'Chemistry', color: '#38bdf8' },
                  { name: 'Python', color: '#2dd4bf' },
                  { name: 'AI Systems', color: '#a855f7' },
                  { name: 'Exams', color: '#f59e0b' },
                ].map((item) => {
                  const isChecked = selectedSubjects[item.name] !== false
                  return (
                    <div
                      key={item.name}
                      className="gcal-calendar-item"
                      onClick={() => {
                        setSelectedSubjects((prev) => ({
                          ...prev,
                          [item.name]: !isChecked,
                        }))
                        soundSynth.playHarmonicChime()
                      }}
                    >
                      <div
                        className="gcal-checkbox-custom"
                        style={{
                          background: isChecked ? item.color : 'transparent',
                          border: `1.5px solid ${item.color}`,
                        }}
                      >
                        {isChecked ? <Check size={11} strokeWidth={2.5} /> : ''}
                      </div>
                      <span>{item.name}</span>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Quick Stats Widget */}
            <div style={{ marginTop: 'auto', background: '#21262d', padding: '12px 14px', borderRadius: '10px', border: '1px solid #30363d', display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <div style={{ fontSize: '11px', fontWeight: 700, color: '#8b949e', textTransform: 'uppercase' }}>
                Study Velocity
              </div>
              <div style={{ fontSize: '13px', fontWeight: 800, color: '#34d399' }}>
                {Object.values(calTasksByDate).flat().filter((t) => t.completed).length + tasks.filter((t) => t.completed).length} Tasks Done
              </div>
              <div style={{ fontSize: '11px', color: '#8b949e' }}>
                Active Term • Sept 2026
              </div>
            </div>
          </aside>

          {/* 3. MAIN BODY: VIEW SWITCHER (Week / Month / Day / Agenda) */}
          <main className="gcal-main-body">
            {/* VIEW A: SIGNATURE GOOGLE CALENDAR WEEK VIEW */}
            {gcalView === 'week' && (() => {
              const weekDays = getWeekDays(calYear, calMonth, selectedCalDay)
              const curHour = 14
              const curMin = 25
              const curTotalMin = curHour * 60 + curMin
              const curTop = Math.max(0, curTotalMin - 420) // 7 AM = 420

              return (
                <div className="gcal-week-view">
                  {/* Week Header Row */}
                  <div className="gcal-week-header-row">
                    <div className="gcal-tz-cell">GMT+5:30</div>
                    {weekDays.map((wDay) => (
                      <div
                        key={wDay.dateKey}
                        className={`gcal-week-header-day ${wDay.isToday ? 'today' : ''}`}
                        onClick={() => {
                          setSelectedCalDay(wDay.day)
                          setCalMonth(wDay.month)
                          setCalYear(wDay.year)
                        }}
                      >
                        <span className="gcal-week-day-name">{wDay.weekday}</span>
                        <span className="gcal-week-day-num">{wDay.day}</span>
                      </div>
                    ))}
                  </div>

                  {/* All-Day Events Row */}
                  <div className="gcal-all-day-row">
                    <div className="gcal-all-day-label">all-day</div>
                    {weekDays.map((wDay) => {
                      const dayTasks = getTasksForDate(wDay.year, wDay.month, wDay.day).filter(filterTask)
                      const exams = dayTasks.filter((t) =>
                        t.title.toLowerCase().includes('exam') || t.title.toLowerCase().includes('midterm')
                      )

                      return (
                        <div key={wDay.dateKey} className="gcal-all-day-col">
                          {exams.map((ex) => (
                            <div
                              key={ex.id}
                              className="gcal-all-day-badge"
                              onClick={() => setGcalActiveEvent({ ...ex, dateKey: wDay.dateKey })}
                              title={ex.title}
                            >
                              {ex.title}
                            </div>
                          ))}
                        </div>
                      )
                    })}
                  </div>

                  {/* Scrollable Time Grid (7 AM to 10 PM) */}
                  <div className="gcal-time-scroll">
                    <div className="gcal-time-grid">
                      {/* Left Time Gutter */}
                      <div className="gcal-time-col">
                        {GCAL_HOURS.map((h) => (
                          <div key={h.hour} className="gcal-time-slot-label">
                            {h.label}
                          </div>
                        ))}
                      </div>

                      {/* 7 Day Columns */}
                      {weekDays.map((wDay) => {
                        const dayTasks = getTasksForDate(wDay.year, wDay.month, wDay.day).filter(filterTask)
                        const isDragOverThisCol = dragOverCol?.dateKey === wDay.dateKey

                        return (
                          <div
                            key={wDay.dateKey}
                            className={`gcal-grid-day-col ${isDragOverThisCol ? 'drag-over' : ''}`}
                            onDragOver={(e) => handleGridDayColDragOver(e, wDay.dateKey)}
                            onDragLeave={handleGridDayColDragLeave}
                            onDrop={(e) => handleGridDayColDrop(e, wDay.dateKey)}
                          >
                            {/* Horizontal Hour Guidelines */}
                            {GCAL_HOURS.map((h) => (
                              <div
                                key={h.hour}
                                className="gcal-hour-row-guide"
                                onClick={() => {
                                  setSelectedCalDay(wDay.day)
                                  setCalMonth(wDay.month)
                                  setCalYear(wDay.year)
                                  const startHour12 = h.hour > 12 ? h.hour - 12 : h.hour
                                  const endHour12 = (h.hour + 1) > 12 ? (h.hour + 1) - 12 : h.hour + 1
                                  const ampm = h.hour >= 12 ? 'PM' : 'AM'
                                  setNewCalTaskTime(`${startHour12}:00–${endHour12}:00 ${ampm}`)
                                  setGcalQuickCreateOpen(true)
                                }}
                                title={`Click to schedule session at ${h.label}`}
                              />
                            ))}

                            {/* Current Time Red Line on Today */}
                            {wDay.isToday && (
                              <div className="gcal-current-time-line" style={{ top: `${curTop}px` }}>
                                <div className="gcal-current-time-dot" />
                              </div>
                            )}

                            {/* Live Drag & Drop Ghost Slot Preview */}
                            {isDragOverThisCol && draggedCalEvent && dragOverCol && (
                              <div
                                className="gcal-drag-ghost-preview"
                                style={{
                                  top: `${Math.max(0, dragOverCol.snappedMinutes - 420)}px`,
                                  height: `${Math.max(34, draggedCalEvent.durationMinutes)}px`,
                                }}
                              >
                                <div className="gcal-ghost-title">
                                  {draggedCalEvent.task.title}
                                </div>
                                <div className="gcal-ghost-time">
                                  {dragOverCol.timeSlotPreview}
                                </div>
                              </div>
                            )}

                            {/* Positioned Event Blocks */}
                            {dayTasks.map((t) => {
                              const { startMinutes, durationMinutes } = parseTimeSlot(t.timeSlot)
                              const topPx = Math.max(0, startMinutes - 420) // 7 AM = 420
                              const heightPx = Math.max(34, durationMinutes)

                              const subLower = (t.subject || '').toLowerCase()
                              const isExam =
                                t.title.toLowerCase().includes('exam') ||
                                t.title.toLowerCase().includes('midterm')
                              let cardClass = 'math'
                              if (isExam) cardClass = 'exam'
                              else if (subLower.includes('chem')) cardClass = 'chem'
                              else if (subLower.includes('python')) cardClass = 'python'
                              else if (subLower.includes('ai')) cardClass = 'ai'

                              const isBeingDragged = draggedCalEvent?.task.id === t.id

                              return (
                                <div
                                  key={t.id}
                                  className={`gcal-event-block ${cardClass} ${t.completed ? 'completed' : ''} ${isBeingDragged ? 'dragging' : ''}`}
                                  style={{
                                    top: `${topPx}px`,
                                    height: `${heightPx}px`,
                                  }}
                                  draggable={true}
                                  onDragStart={(e) => handleEventDragStart(e, t, wDay.dateKey)}
                                  onDragEnd={() => {
                                    setDraggedCalEvent(null)
                                    setDragOverCol(null)
                                  }}
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    setGcalActiveEvent({ ...t, dateKey: wDay.dateKey })
                                    soundSynth.playHarmonicChime()
                                  }}
                                  title="Drag to change time or day • Click to view"
                                >
                                  <div className="gcal-event-title">
                                    {t.completed ? 'Completed: ' : ''}{t.title}
                                  </div>
                                  <div className="gcal-event-time">
                                    {t.timeSlot}
                                  </div>
                                </div>
                              )
                            })}
                          </div>
                        )
                      })}
                    </div>
                  </div>
                </div>
              )
            })()}

            {/* VIEW B: GOOGLE CALENDAR MONTH VIEW */}
            {gcalView === 'month' && (
              <div className="gcal-month-view">
                <div className="gcal-month-header">
                  {WEEKDAY_NAMES.map((d) => (
                    <div key={d} className="gcal-month-header-cell">
                      {d}
                    </div>
                  ))}
                </div>

                <div className="gcal-month-grid">
                  {/* Empty cells */}
                  {Array.from({ length: startDayOfWeek }).map((_, i) => (
                    <div key={`m-empty-${i}`} className="gcal-month-cell empty" />
                  ))}

                  {/* Day cells */}
                  {Array.from({ length: daysInCalMonth }, (_, i) => i + 1).map((d) => {
                    const isToday = calYear === 2026 && calMonth === 8 && d === 12
                    const isSelected = d === selectedCalDay
                    const rawTasks = getTasksForDate(calYear, calMonth, d)
                    const dayTasks = rawTasks.filter(filterTask)
                    const hasExam = rawTasks.some(
                      (t) => t.title.toLowerCase().includes('exam') || t.title.toLowerCase().includes('midterm')
                    )
                    const isDragOver = dragOverMonthDay === d
                    const dateKey = formatCalDateKey(calYear, calMonth, d)

                    let cellClass = 'gcal-month-cell'
                    if (isToday) cellClass += ' today'
                    if (isSelected) cellClass += ' selected'
                    if (isDragOver) cellClass += ' drag-over'

                    return (
                      <div
                        key={d}
                        className={cellClass}
                        onDragOver={(e) => handleMonthCellDragOver(e, d)}
                        onDragLeave={handleMonthCellDragLeave}
                        onDrop={(e) => handleMonthCellDrop(e, d)}
                        onClick={() => {
                          setSelectedCalDay(d)
                          soundSynth.playHarmonicChime()
                        }}
                      >
                        <div className="gcal-month-cell-header">
                          <span className="gcal-month-day-num">{d}</span>
                          {hasExam && (
                            <span style={{ fontSize: '10px', color: '#f59e0b', fontWeight: 800 }}>
                              Exam
                            </span>
                          )}
                        </div>

                        {dayTasks.slice(0, 3).map((t) => {
                          const subLower = (t.subject || '').toLowerCase()
                          const isExam =
                            t.title.toLowerCase().includes('exam') ||
                            t.title.toLowerCase().includes('midterm')
                          let bg = 'rgba(16, 185, 129, 0.25)'
                          let col = '#a7f3d0'
                          if (isExam) {
                            bg = 'rgba(245, 158, 11, 0.3)'
                            col = '#fde68a'
                          } else if (subLower.includes('chem')) {
                            bg = 'rgba(56, 189, 248, 0.25)'
                            col = '#bae6fd'
                          } else if (subLower.includes('python')) {
                            bg = 'rgba(45, 212, 191, 0.25)'
                            col = '#99f6e4'
                          } else if (subLower.includes('ai')) {
                            bg = 'rgba(168, 85, 247, 0.25)'
                            col = '#e9d5ff'
                          }

                          const isBeingDragged = draggedCalEvent?.task.id === t.id

                          return (
                            <div
                              key={t.id}
                              className={`gcal-month-pill ${isBeingDragged ? 'dragging' : ''}`}
                              style={{ background: bg, color: col }}
                              draggable={true}
                              onDragStart={(e) => handleEventDragStart(e, t, dateKey)}
                              onDragEnd={() => {
                                setDraggedCalEvent(null)
                                setDragOverMonthDay(null)
                              }}
                              onClick={(e) => {
                                e.stopPropagation()
                                setGcalActiveEvent({ ...t, dateKey })
                              }}
                              title={`Drag to move date • ${t.subject}: ${t.title}`}
                            >
                              {t.completed ? 'Completed: ' : ''}{t.subject}: {t.title}
                            </div>
                          )
                        })}

                        {dayTasks.length > 3 && (
                          <span style={{ fontSize: '10px', color: '#8b949e', fontWeight: 700, paddingLeft: '4px' }}>
                            +{dayTasks.length - 3} more
                          </span>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* VIEW C: GOOGLE CALENDAR DAY VIEW */}
            {gcalView === 'day' && (() => {
              const dayTasks = getTasksForDate(calYear, calMonth, selectedCalDay).filter(filterTask)
              const curHour = 14
              const curMin = 25
              const curTop = Math.max(0, (curHour * 60 + curMin) - 420)

              return (
                <div className="gcal-week-view">
                  <div className="gcal-week-header-row" style={{ gridTemplateColumns: '60px 1fr' }}>
                    <div className="gcal-tz-cell">GMT+5:30</div>
                    <div
                      className="gcal-week-header-day today"
                      style={{ borderRight: 'none', alignItems: 'flex-start', paddingLeft: '16px' }}
                    >
                      <span className="gcal-week-day-name">
                        {WEEKDAY_NAMES[new Date(calYear, calMonth, selectedCalDay).getDay()]}
                      </span>
                      <span className="gcal-week-day-num">{selectedCalDay}</span>
                    </div>
                  </div>

                  <div className="gcal-time-scroll">
                    <div className="gcal-time-grid" style={{ gridTemplateColumns: '60px 1fr' }}>
                      {/* Left Time Gutter */}
                      <div className="gcal-time-col">
                        {GCAL_HOURS.map((h) => (
                          <div key={h.hour} className="gcal-time-slot-label">
                            {h.label}
                          </div>
                        ))}
                      </div>

                      {/* Full-Width Day Column */}
                      {(() => {
                        const dayDateKey = formatCalDateKey(calYear, calMonth, selectedCalDay)
                        const isDragOverThisCol = dragOverCol?.dateKey === dayDateKey

                        return (
                          <div
                            className={`gcal-grid-day-col ${isDragOverThisCol ? 'drag-over' : ''}`}
                            style={{ borderRight: 'none' }}
                            onDragOver={(e) => handleGridDayColDragOver(e, dayDateKey)}
                            onDragLeave={handleGridDayColDragLeave}
                            onDrop={(e) => handleGridDayColDrop(e, dayDateKey)}
                          >
                            {GCAL_HOURS.map((h) => (
                              <div
                                key={h.hour}
                                className="gcal-hour-row-guide"
                                onClick={() => {
                                  const startHour12 = h.hour > 12 ? h.hour - 12 : h.hour
                                  const endHour12 = (h.hour + 1) > 12 ? (h.hour + 1) - 12 : h.hour + 1
                                  const ampm = h.hour >= 12 ? 'PM' : 'AM'
                                  setNewCalTaskTime(`${startHour12}:00–${endHour12}:00 ${ampm}`)
                                  setGcalQuickCreateOpen(true)
                                }}
                              />
                            ))}

                            {/* Current Time Indicator */}
                            {calYear === 2026 && calMonth === 8 && selectedCalDay === 12 && (
                              <div className="gcal-current-time-line" style={{ top: `${curTop}px` }}>
                                <div className="gcal-current-time-dot" />
                              </div>
                            )}

                            {/* Drag Ghost Preview */}
                            {isDragOverThisCol && draggedCalEvent && dragOverCol && (
                              <div
                                className="gcal-drag-ghost-preview"
                                style={{
                                  top: `${Math.max(0, dragOverCol.snappedMinutes - 420)}px`,
                                  height: `${Math.max(40, draggedCalEvent.durationMinutes)}px`,
                                  left: '12px',
                                  right: '12px',
                                }}
                              >
                                <div className="gcal-ghost-title">
                                  {draggedCalEvent.task.title}
                                </div>
                                <div className="gcal-ghost-time">
                                  {dragOverCol.timeSlotPreview}
                                </div>
                              </div>
                            )}

                            {/* Event blocks */}
                            {dayTasks.map((t) => {
                              const { startMinutes, durationMinutes } = parseTimeSlot(t.timeSlot)
                              const topPx = Math.max(0, startMinutes - 420)
                              const heightPx = Math.max(40, durationMinutes)

                              const subLower = (t.subject || '').toLowerCase()
                              const isExam =
                                t.title.toLowerCase().includes('exam') ||
                                t.title.toLowerCase().includes('midterm')
                              let cardClass = 'math'
                              if (isExam) cardClass = 'exam'
                              else if (subLower.includes('chem')) cardClass = 'chem'
                              else if (subLower.includes('python')) cardClass = 'python'
                              else if (subLower.includes('ai')) cardClass = 'ai'

                              const isBeingDragged = draggedCalEvent?.task.id === t.id

                              return (
                                <div
                                  key={t.id}
                                  className={`gcal-event-block ${cardClass} ${t.completed ? 'completed' : ''} ${isBeingDragged ? 'dragging' : ''}`}
                                  style={{
                                    top: `${topPx}px`,
                                    height: `${heightPx}px`,
                                    left: '12px',
                                    right: '12px',
                                  }}
                                  draggable={true}
                                  onDragStart={(e) => handleEventDragStart(e, t, dayDateKey)}
                                  onDragEnd={() => {
                                    setDraggedCalEvent(null)
                                    setDragOverCol(null)
                                  }}
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    setGcalActiveEvent({ ...t, dateKey: dayDateKey })
                                    soundSynth.playHarmonicChime()
                                  }}
                                  title="Drag to reschedule time slot • Click to view"
                                >
                                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                    <span className="gcal-event-title" style={{ fontSize: '13px' }}>
                                      {t.completed ? 'Completed: ' : ''}{t.title}
                                    </span>
                                    <span style={{ fontSize: '10.5px', opacity: 0.8 }}>{t.subject}</span>
                                  </div>
                                  <div className="gcal-event-time">{t.timeSlot} • {t.duration_minutes || 45} mins</div>
                                </div>
                              )
                            })}
                          </div>
                        )
                      })()}
                    </div>
                  </div>
                </div>
              )
            })()}

            {/* VIEW D: GOOGLE CALENDAR SCHEDULE / AGENDA VIEW */}
            {gcalView === 'agenda' && (
              <div className="gcal-agenda-view">
                {Array.from({ length: daysInCalMonth }, (_, i) => i + 1).map((d) => {
                  const dayTasks = getTasksForDate(calYear, calMonth, d).filter(filterTask)
                  if (dayTasks.length === 0) return null
                  const dateObj = new Date(calYear, calMonth, d)
                  const isToday = calYear === 2026 && calMonth === 8 && d === 12

                  return (
                    <div key={d} className="gcal-agenda-group">
                      <div className="gcal-agenda-date-badge">
                        <span className="gcal-agenda-date-name">
                          {MONTH_NAMES[calMonth].slice(0, 3)} {d}
                        </span>
                        <span className="gcal-agenda-date-sub">
                          {WEEKDAY_NAMES[dateObj.getDay()]} {isToday ? '• Today' : ''}
                        </span>
                      </div>

                      <div className="gcal-agenda-tasks">
                        {dayTasks.map((t) => (
                          <div
                            key={t.id}
                            className="cal-task-row"
                            style={{ padding: '10px 14px', cursor: 'pointer' }}
                            onClick={() => setGcalActiveEvent({ ...t, dateKey: formatCalDateKey(calYear, calMonth, d) })}
                          >
                            <button
                              type="button"
                              className={`cal-checkbox ${t.completed ? 'checked' : ''}`}
                              onClick={(e) => {
                                e.stopPropagation()
                                handleToggleCalTask(d, t.id, calYear, calMonth)
                              }}
                            >
                              {t.completed ? <Check size={11} strokeWidth={2.5} /> : ''}
                            </button>
                            <div className="cal-task-info">
                              <div className="cal-task-name">{t.title}</div>
                              <div className="cal-task-sub">
                                <span className={`task-tag ${t.tagClass}`}>{t.subject}</span>
                                <span><Clock size={11} className="inline mr-1" />{t.timeSlot}</span>
                                {t.videoUrl && (
                                  <a
                                    href={t.videoUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    onClick={(e) => e.stopPropagation()}
                                    style={{
                                      fontSize: '11px',
                                      color: '#EF4444',
                                      fontWeight: 700,
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      gap: '3px',
                                      textDecoration: 'none',
                                      marginLeft: '6px',
                                    }}
                                  >
                                    <Video size={11} style={{ marginRight: 3 }} /> Video Tutorial
                                  </a>
                                )}
                              </div>
                            </div>
                            <span className={`badge ${t.completed ? 'badge-done' : 'badge-upcoming'}`}>
                              {t.completed ? 'Completed' : 'Scheduled'}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </main>
        </div>

        {/* 4. GOOGLE CALENDAR EVENT DETAIL POPOVER */}
        {gcalActiveEvent && (
          <div
            className="gcal-popover-backdrop"
            onClick={(e) => {
              if (e.target === e.currentTarget) setGcalActiveEvent(null)
            }}
          >
            <div className="gcal-popover-card">
              <div
                className={`gcal-popover-header ${
                  gcalActiveEvent.title.toLowerCase().includes('exam')
                    ? 'exam'
                    : (gcalActiveEvent.subject || '').toLowerCase().includes('chem')
                    ? 'chem'
                    : (gcalActiveEvent.subject || '').toLowerCase().includes('python')
                    ? 'python'
                    : (gcalActiveEvent.subject || '').toLowerCase().includes('ai')
                    ? 'ai'
                    : 'math'
                }`}
              />

              <div className="gcal-popover-body">
                <div className="gcal-popover-title-row">
                  <div className="gcal-popover-title">{gcalActiveEvent.title}</div>
                  <button
                    type="button"
                    className="gcal-close-btn"
                    onClick={() => setGcalActiveEvent(null)}
                  >
                    <X size={15} />
                  </button>
                </div>

                <div className="gcal-popover-meta">
                  <div className="gcal-popover-meta-row">
                    <Calendar size={14} />
                    <span>{gcalActiveEvent.dateKey || `${MONTH_NAMES[calMonth]} ${selectedCalDay}, ${calYear}`}</span>
                  </div>
                  <div className="gcal-popover-meta-row">
                    <Clock size={14} />
                    <span>{gcalActiveEvent.timeSlot} ({gcalActiveEvent.duration_minutes || 45} mins)</span>
                  </div>
                  <div className="gcal-popover-meta-row">
                    <Bookmark size={14} />
                    <span className={`task-tag ${gcalActiveEvent.tagClass}`}>{gcalActiveEvent.subject}</span>
                    <span style={{ fontSize: '11px', color: '#8b949e', textTransform: 'capitalize' }}>
                      • {gcalActiveEvent.priority || 'medium'} priority
                    </span>
                  </div>
                </div>

                {gcalActiveEvent.videoUrl && (
                  <div
                    style={{
                      margin: '12px 0 6px 0',
                      padding: '12px 14px',
                      borderRadius: '8px',
                      background: 'rgba(239, 68, 68, 0.08)',
                      border: '1px solid rgba(239, 68, 68, 0.25)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '10px',
                      flexWrap: 'wrap',
                    }}
                  >
                    <div>
                      <div style={{ fontSize: '10.5px', fontWeight: 800, color: '#EF4444', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                        <Video size={14} className="inline mr-1.5" /> Recommended Video
                      </div>
                      <div style={{ fontSize: '12.5px', fontWeight: 700, color: 'var(--text-primary)', marginTop: '2px' }}>
                        {gcalActiveEvent.videoTitle || 'Curated Tutorial Lesson'}
                      </div>
                      {gcalActiveEvent.videoChannel && (
                        <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                          Channel: {gcalActiveEvent.videoChannel}
                        </div>
                      )}
                    </div>
                    <a
                      href={gcalActiveEvent.videoUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        background: '#EF4444',
                        color: '#FFFFFF',
                        fontWeight: 700,
                        fontSize: '11.5px',
                        padding: '6px 12px',
                        borderRadius: '6px',
                        textDecoration: 'none',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        boxShadow: '0 2px 4px rgba(239, 68, 68, 0.3)',
                      }}
                    ><Video size={13} style={{ marginRight: 4 }} /> Watch on YouTube</a>
                  </div>
                )}

                {/* Quick Reschedule / Move Controls */}
                <div className="gcal-quick-move-row">
                  <span style={{ fontSize: '11px', color: '#8b949e', fontWeight: 600, marginRight: '4px' }}>Move:</span>
                  <button
                    type="button"
                    className="gcal-shift-btn"
                    onClick={() => handleShiftEventTime(-30)}
                    title="Move 30 minutes earlier"
                  >
                    -30m
                  </button>
                  <button
                    type="button"
                    className="gcal-shift-btn"
                    onClick={() => handleShiftEventTime(30)}
                    title="Move 30 minutes later"
                  >
                    +30m
                  </button>
                  <button
                    type="button"
                    className="gcal-shift-btn"
                    onClick={() => handleShiftEventDay(-1)}
                    title="Move to Previous Day"
                  >
                    -1 Day
                  </button>
                  <button
                    type="button"
                    className="gcal-shift-btn"
                    onClick={() => handleShiftEventDay(1)}
                    title="Move to Next Day"
                  >
                    +1 Day
                  </button>
                </div>

                <div className="gcal-popover-actions">
                  <button
                    type="button"
                    className="btn-pill"
                    style={{
                      background: gcalActiveEvent.completed ? 'rgba(52, 211, 153, 0.2)' : 'var(--bg-surface-elevated)',
                      color: gcalActiveEvent.completed ? '#34d399' : 'var(--text-primary)',
                    }}
                    onClick={() => {
                      const dayNum = parseInt((gcalActiveEvent.dateKey || '').split('-')[2], 10) || selectedCalDay
                      handleToggleCalTask(dayNum, gcalActiveEvent.id, calYear, calMonth)
                      setGcalActiveEvent((prev) => (prev ? { ...prev, completed: !prev.completed } : null))
                    }}
                  >
                    <span>{gcalActiveEvent.completed ? 'Completed' : 'Mark Complete'}</span>
                  </button>

                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      type="button"
                      className="btn-pill btn-primary"
                      onClick={() => {
                        const title = gcalActiveEvent.title
                        setGcalActiveEvent(null)
                        setCalendarModalOpen(false)
                        openPomodoroModal(title)
                      }}
                      title="Start deep work Pomodoro focus session"
                    >
                      <span>Focus</span>
                    </button>

                    <button
                      type="button"
                      className="cal-btn-delete"
                      style={{ padding: '6px 12px', fontSize: '13px' }}
                      onClick={() => {
                        const dayNum = parseInt((gcalActiveEvent.dateKey || '').split('-')[2], 10) || selectedCalDay
                        handleDeleteCalTask(dayNum, gcalActiveEvent.id, calYear, calMonth)
                        setGcalActiveEvent(null)
                      }}
                      title="Delete event"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 5. QUICK EVENT CREATION MODAL */}
        {gcalQuickCreateOpen && (
          <div
            className="gcal-popover-backdrop"
            onClick={(e) => {
              if (e.target === e.currentTarget) setGcalQuickCreateOpen(false)
            }}
          >
            <div className="gcal-popover-card">
              <div className="gcal-popover-header" />
              <div className="gcal-popover-body">
                <div className="gcal-popover-title-row">
                  <div className="gcal-popover-title">
                    <Plus size={14} className="inline mr-1" /> New Study Session
                  </div>
                  <button
                    type="button"
                    className="gcal-close-btn"
                    onClick={() => setGcalQuickCreateOpen(false)}
                  >
                    <X size={15} />
                  </button>
                </div>

                <form
                  className="cal-add-form"
                  style={{ background: 'transparent', padding: 0, border: 'none' }}
                  onSubmit={(e) => {
                    e.preventDefault()
                    handleAddCalendarTask()
                    setGcalQuickCreateOpen(false)
                  }}
                >
                  <input
                    type="text"
                    className="chat-input-field"
                    placeholder="Add title (e.g. Physics Quantum recap)..."
                    value={newCalTaskTitle}
                    onChange={(e) => setNewCalTaskTitle(e.target.value)}
                    autoFocus
                    required
                  />

                  <div className="cal-add-row controls">
                    <select
                      className="cal-select"
                      value={newCalTaskSubject}
                      onChange={(e) => setNewCalTaskSubject(e.target.value as any)}
                    >
                      <option value="Maths">Maths</option>
                      <option value="Chemistry">Chemistry</option>
                      <option value="Python">Python</option>
                      <option value="AI Systems">AI Systems</option>
                    </select>

                    <input
                      type="text"
                      className="cal-time-input"
                      placeholder="Time slot"
                      value={newCalTaskTime}
                      onChange={(e) => setNewCalTaskTime(e.target.value)}
                    />
                  </div>

                  <div>
                    <span style={{ fontSize: '11px', color: '#8b949e', fontWeight: 600, display: 'block', marginBottom: '6px' }}>
                      Duration:
                    </span>
                    <div className="cal-duration-pills">
                      {[25, 45, 60, 90].map((dur) => (
                        <button
                          key={dur}
                          type="button"
                          className={`cal-duration-pill ${newCalTaskDuration === dur ? 'active' : ''}`}
                          onClick={() => setNewCalTaskDuration(dur)}
                        >
                          {dur}m
                        </button>
                      ))}
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '11px', color: '#8b949e', fontWeight: 600 }}>Priority:</span>
                    <select
                      className="cal-select"
                      style={{ padding: '6px 10px', fontSize: '11.5px' }}
                      value={newCalTaskPriority}
                      onChange={(e) => setNewCalTaskPriority(e.target.value as any)}
                    >
                      <option value="medium">Medium</option>
                      <option value="high">High Priority</option>
                      <option value="low">Low</option>
                    </select>
                  </div>

                  <div style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
                    <button
                      type="submit"
                      className="btn-pill btn-primary"
                      style={{ flex: 1, justifyContent: 'center', padding: '9px 16px' }}
                    >
                      Save to Calendar
                    </button>
                    <button
                      type="button"
                      className="btn-pill"
                      style={{ padding: '9px 16px' }}
                      onClick={() => setGcalQuickCreateOpen(false)}
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>


      {/* ==========================================================================
           MODAL: FULL CHAT HISTORY TRANSCRIPT
           ========================================================================== */}
      {isChatHistoryModalOpen && (
        <div
          className="chat-history-modal-overlay"
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsChatHistoryModalOpen(false)
          }}
        >
          <div className="chat-history-modal-card">
            <div
              className="modal-header"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '16px 20px',
                borderBottom: '1px solid var(--border-subtle)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '8px',
                    background: 'rgba(0, 77, 64, 0.2)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '18px',
                  }}
                >
                  <History size={16} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 800 }}>
                    Full Chat History &amp; Conversation Log
                  </h3>
                  <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                    {chatList.filter((c) => c.type === 'msg').length} total messages with Reviso AI Tutor
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <button
                  type="button"
                  className="btn-icon"
                  onClick={refreshChatHistory}
                  title="Reload from Database"
                  disabled={isRefreshingHistory}
                >
                  <span
                    style={{
                      display: 'inline-block',
                      transform: isRefreshingHistory ? 'rotate(180deg)' : 'none',
                      transition: 'transform 0.5s ease',
                    }}
                  >
                    <RotateCcw size={14} />
                  </span>
                </button>
                <button
                  type="button"
                  className="btn-icon"
                  onClick={() => setIsChatHistoryModalOpen(false)}
                >
                  <X size={15} />
                </button>
              </div>
            </div>

            <div
              style={{
                padding: '12px 20px',
                borderBottom: '1px solid var(--border-subtle)',
                background: 'var(--bg-canvas)',
              }}
            >
              <div className="history-search-bar" style={{ margin: 0 }}>
                <Search size={14} className="opacity-60" />
                <input
                  type="text"
                  placeholder="Search across all messages and tutor recommendations..."
                  value={historySearchQuery}
                  onChange={(e) => setHistorySearchQuery(e.target.value)}
                  className="history-search-input"
                />
                {historySearchQuery && (
                  <button
                    type="button"
                    className="history-clear-search-btn"
                    onClick={() => setHistorySearchQuery('')}
                  >
                    <X size={15} />
                  </button>
                )}
              </div>
            </div>

            <div className="chat-history-modal-body">
              {filteredChatList.length === 0 ? (
                <div className="history-empty-state" style={{ padding: '60px 20px' }}>
                  <MessageSquare size={36} className="text-slate-500" />
                  <div style={{ fontWeight: 700, fontSize: '14px', marginTop: '10px' }}>
                    {historySearchQuery ? 'No matching messages found' : 'No conversation history logged yet'}
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                    {historySearchQuery ? 'Try another query keyword' : 'Ask Reviso for help or start a quiz drill'}
                  </div>
                </div>
              ) : (
                filteredChatList.map((entry, idx) => (
                  <div
                    key={entry.id || idx}
                    className={`history-item ${entry.sender || 'bot'}`}
                    style={{ padding: '12px 14px' }}
                  >
                    <div className="history-item-meta" style={{ marginBottom: '4px' }}>
                      <span className="history-sender-badge" style={{ fontSize: '11px' }}>
                        {entry.sender === 'user' ? 'Laksh (You)' : 'Reviso Copilot'}
                      </span>
                      {entry.timestamp && (
                        <span className="history-timestamp" style={{ fontSize: '11px' }}>
                          {entry.timestamp}
                        </span>
                      )}
                    </div>
                    <div
                      className="history-item-bubble"
                      style={{ fontSize: '13px', lineHeight: 1.55 }}
                      dangerouslySetInnerHTML={{ __html: entry.text || '' }}
                    />
                  </div>
                ))
              )}
            </div>

            <div
              className="modal-footer"
              style={{
                padding: '14px 20px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                Showing {filteredChatList.length} of {chatList.filter((c) => c.type === 'msg').length} messages
              </span>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  type="button"
                  className="btn-pill"
                  onClick={() => setIsChatHistoryModalOpen(false)}
                >
                  Close
                </button>
                <button
                  type="button"
                  className="btn-pill"
                  style={{ background: 'var(--grad-primary)', color: '#fff', border: 'none' }}
                  onClick={() => {
                    setIsChatHistoryModalOpen(false)
                    const chatInputElem = document.querySelector('.chat-input-field') as HTMLInputElement
                    if (chatInputElem) chatInputElem.focus()
                    showToast('Focused tutor chat', 'chat')
                  }}
                >
                  <MessageSquare size={13} className="inline mr-1" /> Open Live Chat
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Interactive Toast */}
      <div className={`toast ${toast.visible ? 'active' : ''}`}>
        <span>
          {toast.icon === 'bell' || toast.icon === 'bell' ? (
            <BellIcon size={15} color="#f97316" />
          ) : toast.icon === 'bell-off' || toast.icon === 'bell-off' ? (
            <BellOffIcon size={15} color="#ffffff" />
          ) : toast.icon === 'check' ? (
            <CheckCircle size={15} className="text-emerald-400" />
          ) : toast.icon === 'calendar' ? (
            <Calendar size={15} className="text-sky-400" />
          ) : toast.icon === 'clock' ? (
            <Clock size={15} className="text-amber-400" />
          ) : toast.icon === 'alert' ? (
            <AlertCircle size={15} className="text-rose-400" />
          ) : toast.icon === 'zap' ? (
            <Zap size={15} className="text-amber-400" />
          ) : toast.icon === 'trash' ? (
            <Trash2 size={15} className="text-rose-400" />
          ) : (
            <Sparkles size={15} className="text-emerald-400" />
          )}
        </span>
        <span>{toast.message}</span>
      </div>
    </div>
  )
}
