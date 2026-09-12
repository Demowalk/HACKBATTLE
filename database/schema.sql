-- ==============================================================================
-- REVISO - AUTONOMOUS ADAPTIVE STUDY & SELF-LEARNING ENGINE
-- SUPABASE POSTGRESQL PRODUCTION SCHEMA & SEED DATA
-- Run this in the Supabase SQL Editor (https://supabase.com/dashboard/project/_/sql)
-- ==============================================================================

-- 1. USERS & PROFILES TABLE
CREATE TABLE IF NOT EXISTS public.users (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    username VARCHAR(100) UNIQUE,
    email VARCHAR(255) UNIQUE,
    full_name VARCHAR(255) DEFAULT 'Laksh Scholar',
    role VARCHAR(100) DEFAULT 'Student',
    grade VARCHAR(100) DEFAULT 'Grade 12 / Engineering Prep',
    streak INT DEFAULT 7,
    total_study_minutes INT DEFAULT 1260,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. STUDY SCHEDULE & CALENDAR TASKS TABLE
CREATE TABLE IF NOT EXISTS public.tasks (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    user_id BIGINT REFERENCES public.users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    subject VARCHAR(100) NOT NULL,
    topic VARCHAR(255) NOT NULL,
    duration_minutes INT DEFAULT 60,
    priority VARCHAR(20) DEFAULT 'medium',
    time_slot VARCHAR(100) DEFAULT '5:00–6:00 PM',
    scheduled_date VARCHAR(20) DEFAULT '2026-09-12',
    completed BOOLEAN DEFAULT FALSE,
    alarm_active BOOLEAN DEFAULT TRUE,
    is_critical BOOLEAN DEFAULT FALSE,
    status_tag VARCHAR(50) DEFAULT 'Upcoming',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. QUIZZES (DIAGNOSTIC & ADAPTIVE) TABLE
CREATE TABLE IF NOT EXISTS public.quizzes (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    user_id BIGINT REFERENCES public.users(id) ON DELETE SET NULL,
    subject VARCHAR(100) NOT NULL,
    topic VARCHAR(255) NOT NULL,
    difficulty VARCHAR(50) DEFAULT 'medium',
    score INT DEFAULT 0,
    total_questions INT DEFAULT 0,
    weak_topic VARCHAR(255),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. QUIZ QUESTIONS & OPTIONS TABLE
CREATE TABLE IF NOT EXISTS public.quiz_questions (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    quiz_id BIGINT REFERENCES public.quizzes(id) ON DELETE CASCADE,
    question_text TEXT NOT NULL,
    options JSONB NOT NULL,
    correct_answer VARCHAR(255) NOT NULL,
    selected_answer VARCHAR(255),
    explanation TEXT
);

-- 5. DEEP KNOWLEDGE TRACING (DKT) & CONCEPT MASTERY TABLE
CREATE TABLE IF NOT EXISTS public.concept_mastery (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    user_id BIGINT REFERENCES public.users(id) ON DELETE CASCADE,
    subject VARCHAR(100) NOT NULL,
    topic VARCHAR(255) NOT NULL,
    mastery_score FLOAT DEFAULT 0.5,
    decay_risk FLOAT DEFAULT 0.2,
    low_proficiency BOOLEAN DEFAULT FALSE,
    projected_note VARCHAR(255),
    last_reviewed_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. CRITICAL FOCUS AREAS & REMEDIATION ALERTS TABLE
CREATE TABLE IF NOT EXISTS public.critical_actions (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    user_id BIGINT REFERENCES public.users(id) ON DELETE CASCADE,
    badge_label VARCHAR(50) DEFAULT 'URGENT',
    desc_html TEXT NOT NULL,
    btn_text VARCHAR(100) DEFAULT 'Rebalance Schedule',
    is_scheduled BOOLEAN DEFAULT FALSE,
    target_slot VARCHAR(100) DEFAULT '5:30–6:15 PM',
    action_key VARCHAR(100) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. REVISO AI TUTOR CHAT HISTORY TABLE
CREATE TABLE IF NOT EXISTS public.chat_messages (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    user_id BIGINT REFERENCES public.users(id) ON DELETE CASCADE,
    sender VARCHAR(20) NOT NULL,
    text TEXT NOT NULL,
    timestamp_str VARCHAR(50),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. FOCUS STUDY & POMODORO SESSIONS TABLE
CREATE TABLE IF NOT EXISTS public.study_sessions (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    user_id BIGINT REFERENCES public.users(id) ON DELETE CASCADE,
    subject VARCHAR(100) NOT NULL,
    topic VARCHAR(255),
    duration_minutes INT DEFAULT 25,
    session_type VARCHAR(50) DEFAULT 'pomodoro',
    completed_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==============================================================================
-- INDEXES FOR INSTANT RETRIEVAL
-- ==============================================================================
CREATE INDEX IF NOT EXISTS idx_tasks_scheduled_date ON public.tasks(scheduled_date);
CREATE INDEX IF NOT EXISTS idx_tasks_completed ON public.tasks(completed);
CREATE INDEX IF NOT EXISTS idx_tasks_subject ON public.tasks(subject);
CREATE INDEX IF NOT EXISTS idx_quizzes_subject ON public.quizzes(subject);
CREATE INDEX IF NOT EXISTS idx_concept_mastery_lookup ON public.concept_mastery(subject, topic);
CREATE INDEX IF NOT EXISTS idx_chat_messages_user ON public.chat_messages(user_id);
CREATE INDEX IF NOT EXISTS idx_study_sessions_user ON public.study_sessions(user_id);

-- ==============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quizzes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.concept_mastery ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.critical_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.study_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public all on users" ON public.users FOR ALL USING (true);
CREATE POLICY "Allow public all on tasks" ON public.tasks FOR ALL USING (true);
CREATE POLICY "Allow public all on quizzes" ON public.quizzes FOR ALL USING (true);
CREATE POLICY "Allow public all on quiz_questions" ON public.quiz_questions FOR ALL USING (true);
CREATE POLICY "Allow public all on concept_mastery" ON public.concept_mastery FOR ALL USING (true);
CREATE POLICY "Allow public all on critical_actions" ON public.critical_actions FOR ALL USING (true);
CREATE POLICY "Allow public all on chat_messages" ON public.chat_messages FOR ALL USING (true);
CREATE POLICY "Allow public all on study_sessions" ON public.study_sessions FOR ALL USING (true);

-- ==============================================================================
-- REALISTIC SEED DATA (Exact match to Reviso Frontend State)
-- ==============================================================================
INSERT INTO public.users (username, email, full_name, role, grade, streak, total_study_minutes)
VALUES ('reviso_scholar', 'scholar@reviso.ai', 'Laksh Scholar', 'Student', 'Grade 12 / Engineering Prep', 7, 1260)
ON CONFLICT (username) DO NOTHING;

DO $$
DECLARE
    uid BIGINT;
BEGIN
    SELECT id INTO uid FROM public.users WHERE username = 'reviso_scholar' LIMIT 1;

    -- 1. Seed Study Schedule Tasks
    IF NOT EXISTS (SELECT 1 FROM public.tasks WHERE user_id = uid) THEN
        INSERT INTO public.tasks (user_id, title, subject, topic, duration_minutes, priority, time_slot, scheduled_date, completed, alarm_active, is_critical, status_tag)
        VALUES
            (uid, 'Eigenvalues & Diagonalization Practice', 'Maths', 'Linear Algebra', 90, 'high', '2:00–3:30 PM', '2026-09-12', true, true, false, 'Done'),
            (uid, 'Organic Reaction Mechanisms Recap', 'Chemistry', 'Organic Synthesis', 60, 'medium', '4:00–5:00 PM', '2026-09-12', false, true, false, 'Upcoming'),
            (uid, 'Async Programming & Generators', 'Python', 'Concurrency', 45, 'low', '5:30–6:15 PM', '2026-09-12', false, true, true, 'Critical Remediation'),
            (uid, 'Attention Mechanisms & Transformers', 'AI Systems', 'Deep Learning', 60, 'high', '7:00–8:00 PM', '2026-09-12', false, true, false, 'Upcoming'),
            (uid, 'Linear Algebra Semester Exam', 'Maths', 'Full Review', 180, 'high', '9:00 AM–12:00 PM', '2026-09-15', false, true, false, 'Upcoming'),
            (uid, 'Organic Chemistry Midterm', 'Chemistry', 'Reaction Mechanisms', 120, 'high', '10:00 AM–12:00 PM', '2026-09-28', false, true, false, 'Upcoming');
    END IF;

    -- 2. Seed Deep Knowledge Tracing (DKT) Retention Mastery
    IF NOT EXISTS (SELECT 1 FROM public.concept_mastery WHERE user_id = uid) THEN
        INSERT INTO public.concept_mastery (user_id, subject, topic, mastery_score, decay_risk, low_proficiency, projected_note)
        VALUES
            (uid, 'Maths', 'Eigenvalues & Matrix Decompositions', 0.84, 0.12, false, 'Consistent high retention across 3 reviews.'),
            (uid, 'Chemistry', 'SN1 vs SN2 Nucleophilic Substitution', 0.65, 0.28, false, 'Moderate decay risk. Scheduled recap in 2 days.'),
            (uid, 'Python', 'AsyncIO Event Loops & Coroutines', 0.35, 0.58, true, 'Critical decay alert! Requires active recall session.');
    END IF;

    -- 3. Seed Focus Areas & Remediation Alerts
    IF NOT EXISTS (SELECT 1 FROM public.critical_actions WHERE user_id = uid) THEN
        INSERT INTO public.critical_actions (user_id, badge_label, desc_html, btn_text, is_scheduled, target_slot, action_key)
        VALUES
            (uid, 'URGENT', 'Python AsyncIO retention has dropped to 35% with 58% decay risk.', 'Rebalance Schedule', false, '5:30–6:15 PM', 'python_remediation'),
            (uid, 'UPCOMING EXAM', 'Linear Algebra Final Exam is in 3 days (Sep 15). Review formula sheets.', 'Add Practice Exam Block', false, '9:00 AM–12:00 PM', 'math_midterm'),
            (uid, 'CRITICAL REMINDER', 'Organic Chemistry lab submission deadline is tomorrow at 5:00 PM.', 'View Lab Notes', false, '4:00–5:00 PM', 'chem_lab');
    END IF;

    -- 4. Seed Initial Reviso AI Tutor Chat Messages
    IF NOT EXISTS (SELECT 1 FROM public.chat_messages WHERE user_id = uid) THEN
        INSERT INTO public.chat_messages (user_id, sender, text, timestamp_str)
        VALUES
            (uid, 'bot', 'Hello Laksh! I am Reviso, your autonomous study copilot. How can I optimize your learning schedule today?', '02:00 PM'),
            (uid, 'user', 'Can you review my Python AsyncIO retention score?', '02:02 PM'),
            (uid, 'bot', 'Your Python AsyncIO mastery is currently at 35% with high decay danger. I have placed a remediation study block in your schedule for 5:30 PM today!', '02:02 PM');
    END IF;
END $$;
