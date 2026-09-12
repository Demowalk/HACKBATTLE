-- ==============================================================================
-- REVISO SUPABASE POSTGRESQL SCHEMA & INITIAL SEED
-- Paste this directly into your Supabase project SQL Editor and click 'Run'
-- ==============================================================================

-- 1. Create Users Table
CREATE TABLE IF NOT EXISTS public.users (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    username VARCHAR(100) UNIQUE,
    email VARCHAR(255) UNIQUE,
    streak INT DEFAULT 1,
    total_study_minutes INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Create Tasks Table
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
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Create Quizzes Table
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

-- 4. Create Quiz Questions Table (with JSONB for options)
CREATE TABLE IF NOT EXISTS public.quiz_questions (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    quiz_id BIGINT REFERENCES public.quizzes(id) ON DELETE CASCADE,
    question_text TEXT NOT NULL,
    options JSONB NOT NULL,
    correct_answer VARCHAR(255) NOT NULL,
    selected_answer VARCHAR(255),
    explanation TEXT
);

-- 5. Create Concept Mastery (DKT) Table
CREATE TABLE IF NOT EXISTS public.concept_mastery (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    user_id BIGINT REFERENCES public.users(id) ON DELETE CASCADE,
    subject VARCHAR(100) NOT NULL,
    topic VARCHAR(255) NOT NULL,
    mastery_score FLOAT DEFAULT 0.5,
    decay_risk FLOAT DEFAULT 0.2,
    last_reviewed_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create Fast Lookup Indexes
CREATE INDEX IF NOT EXISTS idx_tasks_scheduled_date ON public.tasks(scheduled_date);
CREATE INDEX IF NOT EXISTS idx_tasks_completed ON public.tasks(completed);
CREATE INDEX IF NOT EXISTS idx_tasks_subject ON public.tasks(subject);
CREATE INDEX IF NOT EXISTS idx_quizzes_subject ON public.quizzes(subject);
CREATE INDEX IF NOT EXISTS idx_concept_mastery_lookup ON public.concept_mastery(subject, topic);

-- Enable Row Level Security (RLS)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quizzes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.concept_mastery ENABLE ROW LEVEL SECURITY;

-- Allow public anonymous/service read & write for API access
CREATE POLICY "Allow public read users" ON public.users FOR SELECT USING (true);
CREATE POLICY "Allow public write users" ON public.users FOR ALL USING (true);

CREATE POLICY "Allow public read tasks" ON public.tasks FOR SELECT USING (true);
CREATE POLICY "Allow public write tasks" ON public.tasks FOR ALL USING (true);

CREATE POLICY "Allow public read quizzes" ON public.quizzes FOR SELECT USING (true);
CREATE POLICY "Allow public write quizzes" ON public.quizzes FOR ALL USING (true);

CREATE POLICY "Allow public read quiz_questions" ON public.quiz_questions FOR SELECT USING (true);
CREATE POLICY "Allow public write quiz_questions" ON public.quiz_questions FOR ALL USING (true);

CREATE POLICY "Allow public read concept_mastery" ON public.concept_mastery FOR SELECT USING (true);
CREATE POLICY "Allow public write concept_mastery" ON public.concept_mastery FOR ALL USING (true);

-- ==============================================================================
-- INITIAL SEED DATA (Matching Reviso frontend state)
-- ==============================================================================
INSERT INTO public.users (username, email, streak, total_study_minutes)
VALUES ('reviso_scholar', 'scholar@reviso.ai', 7, 1260)
ON CONFLICT (username) DO NOTHING;

DO $$
DECLARE
    uid BIGINT;
BEGIN
    SELECT id INTO uid FROM public.users WHERE username = 'reviso_scholar' LIMIT 1;

    -- Seed Tasks
    IF NOT EXISTS (SELECT 1 FROM public.tasks WHERE user_id = uid) THEN
        INSERT INTO public.tasks (user_id, title, subject, topic, duration_minutes, priority, time_slot, scheduled_date, completed, alarm_active)
        VALUES
            (uid, 'Eigenvalues & Diagonalization Practice', 'Maths', 'Linear Algebra', 90, 'high', '2:00–3:30 PM', '2026-09-12', true, true),
            (uid, 'Organic Reaction Mechanisms Recap', 'Chemistry', 'Organic Synthesis', 60, 'medium', '4:00–5:00 PM', '2026-09-12', false, true),
            (uid, 'Async Programming & Generators', 'Python', 'Concurrency', 45, 'low', '5:30–6:15 PM', '2026-09-12', false, true),
            (uid, 'Attention Mechanisms & Transformers', 'AI Systems', 'Deep Learning', 60, 'high', '7:00–8:00 PM', '2026-09-12', false, true),
            (uid, 'Linear Algebra Semester Exam', 'Maths', 'Full Review', 180, 'high', '9:00 AM–12:00 PM', '2026-09-15', false, true),
            (uid, 'Organic Chemistry Midterm', 'Chemistry', 'Reaction Mechanisms', 120, 'high', '10:00 AM–12:00 PM', '2026-09-28', false, true);
    END IF;

    -- Seed Concept Mastery (DKT)
    IF NOT EXISTS (SELECT 1 FROM public.concept_mastery WHERE user_id = uid) THEN
        INSERT INTO public.concept_mastery (user_id, subject, topic, mastery_score, decay_risk)
        VALUES
            (uid, 'Maths', 'Eigenvalues & Matrix Decompositions', 0.84, 0.12),
            (uid, 'Chemistry', 'SN1 vs SN2 Nucleophilic Substitution', 0.65, 0.28),
            (uid, 'Python', 'AsyncIO Event Loops & Coroutines', 0.35, 0.58);
    END IF;
END $$;
