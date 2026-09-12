export interface Task {
  id: number;
  subject: string;
  topic: string;
  duration_minutes: number;
  priority: 'high' | 'mid' | 'low';
  completed: boolean;
  scheduled_date: string;
  time_slot?: string;
}

export interface QuizQuestion {
  id: number;
  subject: string;
  topic: string;
  question: string;
  options: string[];
  source: string;
  correctIndex?: number;
}

export interface ChatMessage {
  id: string;
  sender: 'assistant' | 'user';
  text: string;
  timestamp: string;
  actionType?: 'remediation_accepted' | 'quiz_details' | 'math_warmup' | 'study_hours';
  quiz?: QuizQuestion;
}

export interface SubjectProficiency {
  name: string;
  level: 'HIGH' | 'MID' | 'CRITICAL';
  scorePercent: number;
  color: string;
  badgeClass: string;
}
