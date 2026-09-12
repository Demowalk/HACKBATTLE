import type { Task, QuizQuestion, SubjectProficiency } from './types'

export const INITIAL_TASKS: Task[] = [
  {
    id: 1,
    subject: 'Maths',
    topic: 'Algebra basics',
    duration_minutes: 90,
    priority: 'high',
    completed: true,
    scheduled_date: '2026-09-13',
    time_slot: '9:00–10:30 AM',
  },
  {
    id: 2,
    subject: 'Chemistry',
    topic: 'Organic chemistry intro',
    duration_minutes: 60,
    priority: 'mid',
    completed: false,
    scheduled_date: '2026-09-13',
    time_slot: '11:00 AM–12:00 PM',
  },
  {
    id: 3,
    subject: 'Python',
    topic: 'Loop structures & list comprehension',
    duration_minutes: 45,
    priority: 'high',
    completed: false,
    scheduled_date: '2026-09-13',
    time_slot: '1:30–2:15 PM',
  },
  {
    id: 4,
    subject: 'Maths',
    topic: 'Quadratic equations practice',
    duration_minutes: 60,
    priority: 'high',
    completed: true,
    scheduled_date: '2026-09-13',
    time_slot: '3:00–4:00 PM',
  },
  {
    id: 5,
    subject: 'Chemistry',
    topic: 'Periodic table trends review',
    duration_minutes: 45,
    priority: 'low',
    completed: true,
    scheduled_date: '2026-09-13',
    time_slot: '4:30–5:15 PM',
  },
  {
    id: 6,
    subject: 'Python',
    topic: 'Function arguments & scope drills',
    duration_minutes: 45,
    priority: 'high',
    completed: true,
    scheduled_date: '2026-09-13',
    time_slot: '5:30–6:15 PM',
  },
  {
    id: 7,
    subject: 'Chemistry',
    topic: 'Chemical bonding laboratory prep',
    duration_minutes: 60,
    priority: 'high',
    completed: false,
    scheduled_date: '2026-09-14',
    time_slot: 'Tomorrow 9:00 AM',
  },
]

export const MATH_WARMUP_QUIZ: QuizQuestion = {
  id: 1,
  subject: 'Maths',
  topic: 'Algebra basics',
  question: 'Solve for x: 2x + 4 = 10',
  options: ['x=2', 'x=3', 'x=4', 'x=5'],
  source: 'ai',
  correctIndex: 1, // x=3
}

export const PYTHON_LOOP_QUIZ: QuizQuestion = {
  id: 2,
  subject: 'Python',
  topic: 'Python Loop Quiz',
  question: 'What is the output of: [i*2 for i in range(3)]?',
  options: ['[0, 2, 4]', '[2, 4, 6]', '[0, 1, 2]', '[1, 2, 3]'],
  source: 'ai',
  correctIndex: 0,
}

export const SUBJECT_PROFICIENCIES: SubjectProficiency[] = [
  {
    name: 'Maths',
    level: 'HIGH',
    scorePercent: 88,
    color: '#22c55e',
    badgeClass: 'badge-high',
  },
  {
    name: 'Chemistry',
    level: 'MID',
    scorePercent: 64,
    color: '#3b82f6',
    badgeClass: 'badge-mid',
  },
  {
    name: 'Python',
    level: 'CRITICAL',
    scorePercent: 35,
    color: '#ef4444',
    badgeClass: 'badge-critical',
  },
]

export const ALARMING_CRITICALS = [
  'URGENT: Python loop proficiency critical! Schedule affected.',
  'UPCOMING EXAM: Math Midterm in 5 days!',
  'CRITICAL REMINDER: Chemistry Lab Prep (Due tomorrow)',
]
