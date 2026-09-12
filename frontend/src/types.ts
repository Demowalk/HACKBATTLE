export interface Task {
  id: string | number;
  title: string;
  subject: 'Maths' | 'Chemistry' | 'Python' | string;
  timeSlot: string;
  completed: boolean;
  alarmEnabled: boolean;
  isCritical?: boolean;
  statusTag?: 'Upcoming' | 'Done' | 'Critical Remediation' | string;
}

export type TaskItem = Task;

export interface EmptyBlockItem {
  id: string;
  timeSlot: string;
  label: string;
  subLabel: string;
  isOptimal?: boolean;
  isFilled?: boolean;
  filledTask?: TaskItem;
}

export interface SubjectProgressItem {
  id: string;
  name: string;
  percent: number;
  colorKey: 'math' | 'chem' | 'python';
  lowProficiency?: boolean;
  projectedNote?: string;
}

export interface CriticalActionItem {
  id: string;
  badgeLabel: 'URGENT' | 'UPCOMING EXAM' | 'CRITICAL REMINDER';
  descHtml: string;
  btnText: string;
  scheduled: boolean;
  scheduledText?: string;
  targetSlot: string;
  actionKey: 'python_remediation' | 'math_midterm' | 'chem_lab';
}

export interface ChatMessage {
  id: string;
  sender: 'bot' | 'user';
  text: string;
  timestamp?: string;
}

export interface UserProfile {
  name: string;
  email: string;
  role: string;
  grade: string;
}
