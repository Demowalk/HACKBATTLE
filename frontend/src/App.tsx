import React, { useState, useEffect } from 'react'
import {
  Calendar,
  Check,
  AlertTriangle,
  FileText,
  CalendarCheck,
  ArrowRight,
  Bot,
  Sparkles,
  SendHorizontal,
  Flame,
} from 'lucide-react'
import './App.css'
import type { Task, ChatMessage } from './types'
import {
  INITIAL_TASKS,
  MATH_WARMUP_QUIZ,
  PYTHON_LOOP_QUIZ,
  SUBJECT_PROFICIENCIES,
  ALARMING_CRITICALS,
} from './mockData'
import { fetchTasks, updateTaskCompletion } from './services/api'

export default function App() {
  const [tasks, setTasks] = useState<Task[]>(INITIAL_TASKS)
  const [isLiveBackend, setIsLiveBackend] = useState<boolean>(false)
  const [inputValue, setInputValue] = useState<string>('')
  const [selectedQuizOption, setSelectedQuizOption] = useState<{ [quizId: number]: number }>({})

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'msg-1',
      sender: 'assistant',
      text: 'Hi Laksh! Based on your low score in Python Loop Quiz, I have auto-scheduled a revision session. Review the new plan or tell me how to adjust.',
      timestamp: 'Just now',
    },
  ])

  // Fetch tasks on initial mount (tries FastAPI backend, falls back gracefully to mock)
  useEffect(() => {
    async function loadTasks() {
      const result = await fetchTasks()
      if (result.tasks && result.tasks.length > 0) {
        setTasks(result.tasks)
      }
      setIsLiveBackend(result.isLive)
    }
    loadTasks()
  }, [])

  // Toggle task completion
  const handleToggleTask = async (taskId: number) => {
    // Optimistic UI update
    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, completed: !t.completed } : t))
    )

    // Call backend endpoint: PATCH http://127.0.0.1:8000/tasks/{id}
    await updateTaskCompletion(taskId)
  }

  // Handle Suggested Quick Action Prompts
  const handlePromptClick = (action: string) => {
    const newMessages: ChatMessage[] = [...messages]

    if (action === 'accept_remediation') {
      newMessages.push({
        id: `user-${Date.now()}`,
        sender: 'user',
        text: 'Accept remediation plan',
        timestamp: 'Just now',
      })

      // Auto-schedule new remediation task if not already added
      const alreadyScheduled = tasks.some((t) => t.topic.includes('Remediation'))
      if (!alreadyScheduled) {
        const remediationTask: Task = {
          id: Date.now(),
          subject: 'Python',
          topic: 'Python Loop Remediation Session',
          duration_minutes: 45,
          priority: 'high',
          completed: false,
          scheduled_date: '2026-09-13',
          time_slot: '2:00–2:45 PM',
        }
        setTasks((prev) => [remediationTask, ...prev])
      }

      newMessages.push({
        id: `asst-${Date.now() + 1}`,
        sender: 'assistant',
        text: "Remediation session scheduled! I added 'Python Loop Remediation Session' (2:00–2:45 PM) to today's study plan. Let's conquer loops!",
        timestamp: 'Just now',
      })
    } else if (action === 'quiz_score') {
      newMessages.push({
        id: `user-${Date.now()}`,
        sender: 'user',
        text: 'What was my quiz score details?',
        timestamp: 'Just now',
      })

      newMessages.push({
        id: `asst-${Date.now() + 1}`,
        sender: 'assistant',
        text: 'You scored 35% on the Python Loop Quiz. You struggled with list comprehensions and loop indexing. Here is a sample question to retry:',
        timestamp: 'Just now',
        quiz: PYTHON_LOOP_QUIZ,
      })
    } else if (action === 'math_warmup') {
      newMessages.push({
        id: `user-${Date.now()}`,
        sender: 'user',
        text: 'Start a quick Math warm-up',
        timestamp: 'Just now',
      })

      newMessages.push({
        id: `asst-${Date.now() + 1}`,
        sender: 'assistant',
        text: 'Great initiative! Try this algebra question generated for your skill level:',
        timestamp: 'Just now',
        quiz: MATH_WARMUP_QUIZ,
      })
    } else if (action === 'update_hours') {
      newMessages.push({
        id: `user-${Date.now()}`,
        sender: 'user',
        text: 'Update my weekly study hours',
        timestamp: 'Just now',
      })

      newMessages.push({
        id: `asst-${Date.now() + 1}`,
        sender: 'assistant',
        text: 'You are currently scheduled for 18.5 hours this week across Maths, Chemistry, and Python. How many hours would you like to allocate?',
        timestamp: 'Just now',
      })
    }

    setMessages(newMessages)
  }

  // Handle User typing custom chat message
  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault()
    if (!inputValue.trim()) return

    const userText = inputValue.trim()
    setInputValue('')

    const updated = [
      ...messages,
      {
        id: `user-${Date.now()}`,
        sender: 'user' as const,
        text: userText,
        timestamp: 'Just now',
      },
    ]
    setMessages(updated)

    // Simulated intelligent assistant response
    setTimeout(() => {
      setMessages((curr) => [
        ...curr,
        {
          id: `asst-${Date.now()}`,
          sender: 'assistant',
          text: `Got it, Laksh. I've noted: "${userText}". I'm updating your adaptive study model accordingly.`,
          timestamp: 'Just now',
        },
      ])
    }, 600)
  }

  // Answer a quiz question inside chat
  const handleAnswerQuiz = (quizId: number, optionIndex: number) => {
    setSelectedQuizOption((prev) => ({ ...prev, [quizId]: optionIndex }))
  }

  const completedTasksCount = tasks.filter((t) => t.completed).length

  return (
    <div className="dashboard-root">
      {/* Top Status Bar */}
      <header className="top-nav">
        <div className="top-metrics-group">
          <div className="metric-item">
            <span>TASKS DONE:</span>
            <span style={{ color: '#fff' }}>
              {completedTasksCount}/{tasks.length}
            </span>
          </div>

          <span className="metric-divider">|</span>

          <div className="metric-item">
            <Flame size={15} color="#f97316" />
            <span>STREAK: 5 DAYS</span>
          </div>

          <span className="metric-divider">|</span>

          <div className="proficiency-group">
            <span>SUBJECT PROFICIENCY:</span>
            <span>
              MATHS <span className="cite-tag tag-high">[cite: HIGH]</span>
            </span>
            <span className="metric-divider">|</span>
            <span>
              CHEMISTRY <span className="cite-tag tag-mid">[cite: MID]</span>
            </span>
            <span className="metric-divider">|</span>
            <span>
              PYTHON <span className="cite-tag tag-critical">[cite: CRITICAL]</span>
            </span>
          </div>
        </div>

        {/* Backend Connectivity Status */}
        <div className={`backend-pill ${isLiveBackend ? 'live' : ''}`} title="FastAPI status">
          <span className="status-dot" />
          <span>{isLiveBackend ? 'Live Backend (127.0.0.1:8000)' : 'Mock Mode (Ready for Backend)'}</span>
        </div>
      </header>

      {/* Main Dashboard Layout */}
      <main className="dashboard-main">
        {/* Left Panel: Today's Study Plan & Progress */}
        <section className="panel left-panel">
          {/* Plan Header + Quiz Sync Widget */}
          <div className="plan-header">
            <div className="plan-title-group">
              <Calendar size={22} color="#60a5fa" />
              <h1 className="plan-title">Today's Study Plan</h1>
            </div>

            {/* Calendar & Quiz Sync Widget */}
            <div className="quiz-sync-container">
              <h2 className="quiz-sync-title">Calendar & Quiz Sync</h2>
              <div className="quiz-sync-flow">
                <div className="sync-card">
                  <div className="quiz-icon-badge">
                    <FileText size={18} color="#94a3b8" />
                    <span className="badge-label">QUIZ</span>
                  </div>
                  <div className="quiz-info">
                    <span className="score-text">SCORE: 35%</span>
                    <span className="quiz-topic-text">Python Loop Quiz</span>
                    <span className="quiz-sub-note">
                      <AlertTriangle size={12} color="#ef4444" />
                      e.g.
                    </span>
                  </div>
                </div>

                <div className="sync-arrow">
                  <ArrowRight size={20} />
                </div>

                <div className="remediation-card">
                  <CalendarCheck size={26} className="remediation-icon" />
                  <span className="remediation-label">AUTO-SCHEDULED REMEDIATION</span>
                </div>
              </div>
            </div>
          </div>

          {/* Task List */}
          <div className="task-list">
            {tasks.slice(0, 4).map((task) => (
              <div
                key={task.id}
                className={`task-card ${task.completed ? 'completed' : ''}`}
              >
                <div className="task-left">
                  <button
                    type="button"
                    className={`task-check-btn ${task.completed ? 'checked' : ''}`}
                    onClick={() => handleToggleTask(task.id)}
                    aria-label={`Mark ${task.topic} as ${task.completed ? 'incomplete' : 'complete'}`}
                  >
                    {task.completed && <Check size={16} strokeWidth={3} />}
                  </button>
                  <div className="task-content">
                    <span className="task-title">{task.topic}</span>
                    <span className="task-meta">
                      {task.subject} · {task.time_slot || `${task.duration_minutes} mins`}
                    </span>
                  </div>
                </div>

                <div className="task-right">
                  <span className={`status-pill ${task.completed ? 'done' : 'upcoming'}`}>
                    {task.completed ? 'Done' : 'Upcoming'}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Subject Progress */}
          <div className="subject-progress-section">
            <div className="progress-header">
              <h2 className="progress-title">Subject Progress</h2>
              <span className="critical-badge-pill">CRITICAL</span>
            </div>

            <div className="subject-bars-grid">
              {SUBJECT_PROFICIENCIES.map((subj) => (
                <div key={subj.name} className="subject-bar-card">
                  <div className="subject-name-row">
                    <span className="subject-name">{subj.name}</span>
                  </div>
                  <div className="progress-track">
                    <div
                      className="progress-fill"
                      style={{
                        width: `${subj.scorePercent}%`,
                        backgroundColor: subj.color,
                      }}
                    />
                  </div>
                  {subj.level === 'CRITICAL' && (
                    <div className="low-proficiency-warning">
                      <span>●</span>
                      <span>LOW PROFICIENCY</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Alarming Criticals Box */}
          <div className="alarming-criticals-box">
            <h3 className="criticals-title">ALARMING CRITICALS</h3>
            <div className="critical-items-list">
              {ALARMING_CRITICALS.map((criticalMsg, idx) => (
                <div key={idx} className="critical-item">
                  <AlertTriangle size={15} className="critical-item-icon" />
                  <span>{criticalMsg}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Right Panel: AI Study Assistant */}
        <section className="panel assistant-panel">
          <div className="assistant-header">
            <div className="assistant-icon-badge">
              <Bot size={22} />
            </div>
            <h2 className="assistant-header-title">Study assistant</h2>
          </div>

          {/* Chat History */}
          <div className="chat-history-area">
            {messages.map((msg) => (
              <div key={msg.id} className={`chat-bubble ${msg.sender}`}>
                <p>{msg.text}</p>

                {/* Inline Quiz Question Component */}
                {msg.quiz && (
                  <div className="assistant-quiz-card">
                    <div className="quiz-card-header">
                      <span>{msg.quiz.subject} • {msg.quiz.topic}</span>
                      <span className="cite-tag tag-mid">AI Generated</span>
                    </div>
                    <div className="quiz-card-question">{msg.quiz.question}</div>
                    <div className="quiz-options-list">
                      {msg.quiz.options.map((opt, optIdx) => {
                        const isSelected = selectedQuizOption[msg.quiz!.id] === optIdx
                        const isCorrect = msg.quiz!.correctIndex === optIdx
                        return (
                          <button
                            key={optIdx}
                            type="button"
                            className={`quiz-option-btn ${
                              isSelected
                                ? isCorrect
                                  ? 'selected-correct'
                                  : 'selected-wrong'
                                : ''
                            }`}
                            onClick={() => handleAnswerQuiz(msg.quiz!.id, optIdx)}
                          >
                            {opt} {isSelected && (isCorrect ? '✓' : '')}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Interactive Prompt Action Buttons */}
          <div className="prompt-actions-list">
            <button
              type="button"
              className="prompt-btn"
              onClick={() => handlePromptClick('accept_remediation')}
            >
              <span>Accept remediation plan</span>
              <ArrowRight size={15} color="#64748b" />
            </button>

            <button
              type="button"
              className="prompt-btn"
              onClick={() => handlePromptClick('quiz_score')}
            >
              <span>What was my quiz score details?</span>
              <ArrowRight size={15} color="#64748b" />
            </button>

            <button
              type="button"
              className="prompt-btn"
              onClick={() => handlePromptClick('math_warmup')}
            >
              <span>Start a quick Math warm-up</span>
              <ArrowRight size={15} color="#64748b" />
            </button>

            <button
              type="button"
              className="prompt-btn"
              onClick={() => handlePromptClick('update_hours')}
            >
              <span>Update my weekly study hours</span>
              <ArrowRight size={15} color="#64748b" />
            </button>
          </div>

          {/* Chat Input Bar */}
          <div className="chat-input-container">
            <form className="chat-input-form" onSubmit={handleSendMessage}>
              <input
                type="text"
                className="chat-input-field"
                placeholder="Type on your own"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
              />
              <div className="sparkle-decor" title="AI powered">
                <Sparkles size={18} />
              </div>
              <button
                type="submit"
                className="send-btn"
                disabled={!inputValue.trim()}
                aria-label="Send message"
              >
                <SendHorizontal size={18} />
              </button>
            </form>
          </div>
        </section>
      </main>
    </div>
  )
}
