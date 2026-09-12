import type {
  TaskItem,
  EmptyBlockItem,
  SubjectProgressItem,
  CriticalActionItem,
  ChatMessage,
  UserProfile,
} from './types'

export const INITIAL_USER_PROFILE: UserProfile = {
  name: 'Laksh HS',
  email: 'laksh.hs@adaptive.ai',
  role: 'Student',
  grade: 'Grade 12 • Standard Track',
}

export const INITIAL_TASKS: TaskItem[] = [
  {
    id: 'task-1',
    title: 'Algebra basics',
    subject: 'Maths',
    timeSlot: '9:00–10:30 AM',
    completed: false,
    alarmEnabled: true,
    statusTag: 'Upcoming',
  },
  {
    id: 'task-2',
    title: 'Organic chemistry intro',
    subject: 'Chemistry',
    timeSlot: '11:00 AM–12:00 PM',
    completed: false,
    alarmEnabled: true,
    statusTag: 'Upcoming',
  },
  {
    id: 'task-3',
    title: 'Loop structures & list comprehension',
    subject: 'Python',
    timeSlot: '1:30–2:15 PM',
    completed: false,
    alarmEnabled: true,
    statusTag: 'Upcoming',
  },
  {
    id: 'task-4',
    title: 'Quadratic equations practice',
    subject: 'Maths',
    timeSlot: '3:00–4:00 PM',
    completed: true,
    alarmEnabled: false,
    statusTag: 'Done',
  },
]

export const INITIAL_EMPTY_BLOCKS: Record<string, EmptyBlockItem> = {
  'empty-block-1': {
    id: 'empty-block-1',
    timeSlot: '10:30–11:00 AM',
    label: 'Empty Block',
    subLabel: '10:30–11:00 AM (30 min buffer)',
    isOptimal: false,
  },
  'empty-block-2': {
    id: 'empty-block-2',
    timeSlot: '12:00–1:30 PM',
    label: 'Optimal Empty Block',
    subLabel: '12:00–1:30 PM (90 min open study window)',
    isOptimal: true,
  },
  'empty-block-3': {
    id: 'empty-block-3',
    timeSlot: '2:15–3:00 PM',
    label: 'Empty Block',
    subLabel: '2:15–3:00 PM (45 min open window)',
    isOptimal: false,
  },
}

export const INITIAL_SUBJECT_PROGRESS: SubjectProgressItem[] = [
  {
    id: 'math',
    name: 'Maths',
    percent: 82,
    colorKey: 'math',
  },
  {
    id: 'chem',
    name: 'Chemistry',
    percent: 65,
    colorKey: 'chem',
  },
  {
    id: 'python',
    name: 'Python',
    percent: 32,
    colorKey: 'python',
    lowProficiency: true,
  },
]

export const INITIAL_CRITICAL_ACTIONS: CriticalActionItem[] = [
  {
    id: 'critical-python',
    badgeLabel: 'URGENT',
    descHtml: 'Python loop proficiency critical! Schedule affected.',
    btnText: 'Find Empty Block & Schedule',
    scheduled: false,
    targetSlot: '12:00–1:00 PM',
    actionKey: 'python_remediation',
  },
  {
    id: 'critical-math',
    badgeLabel: 'UPCOMING EXAM',
    descHtml: 'Math Midterm in 5 days!',
    btnText: 'Slot in Gap',
    scheduled: false,
    targetSlot: '4:00–5:30 PM',
    actionKey: 'math_midterm',
  },
  {
    id: 'critical-chem',
    badgeLabel: 'CRITICAL REMINDER',
    descHtml: 'Chemistry Lab Prep (Due tomorrow)',
    btnText: 'Slot in Gap',
    scheduled: false,
    targetSlot: '2:15–3:00 PM',
    actionKey: 'chem_lab',
  },
]

export const INITIAL_CHAT_MESSAGES: ChatMessage[] = [
  {
    id: 'msg-1',
    sender: 'bot',
    text: 'Hi Laksh! Based on your low score (35%) in Python Loop Quiz, I have auto-detected critical skill gaps in loop structures. Review the plan or let me know how to adjust.',
  },
]
