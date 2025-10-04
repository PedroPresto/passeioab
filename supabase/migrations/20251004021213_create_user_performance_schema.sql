/*
  # Create User Performance Tracking Schema for Passei OAB
  
  ## Overview
  This migration creates the database structure to track user study sessions,
  question attempts, and performance metrics for the Passei OAB application.
  
  ## New Tables
  
  ### 1. `profiles`
  Extends auth.users with additional user information
  - `id` (uuid, primary key) - References auth.users
  - `full_name` (text) - User's full name
  - `created_at` (timestamptz) - Account creation timestamp
  - `updated_at` (timestamptz) - Last update timestamp
  
  ### 2. `study_sessions`
  Tracks individual study sessions (quizzes or simulations)
  - `id` (uuid, primary key)
  - `user_id` (uuid) - References profiles
  - `session_type` (text) - Type: 'quiz' or 'simulado'
  - `total_questions` (integer) - Total questions in session
  - `correct_answers` (integer) - Number of correct answers
  - `started_at` (timestamptz) - Session start time
  - `completed_at` (timestamptz) - Session completion time
  - `created_at` (timestamptz) - Record creation timestamp
  
  ### 3. `question_attempts`
  Records individual question attempts within sessions
  - `id` (uuid, primary key)
  - `session_id` (uuid) - References study_sessions
  - `user_id` (uuid) - References profiles
  - `question_id` (integer) - External API question ID
  - `disciplina` (text) - Question subject/discipline
  - `assunto` (text) - Question topic
  - `user_answer` (text) - User's selected answer (A, B, C, or D)
  - `correct_answer` (text) - Correct answer from API
  - `is_correct` (boolean) - Whether answer was correct
  - `answered_at` (timestamptz) - When question was answered
  
  ### 4. `user_stats`
  Aggregated statistics per discipline and topic
  - `id` (uuid, primary key)
  - `user_id` (uuid) - References profiles
  - `disciplina` (text) - Subject name
  - `assunto` (text) - Topic name (nullable for discipline-level stats)
  - `total_attempts` (integer) - Total questions attempted
  - `correct_attempts` (integer) - Total correct answers
  - `accuracy_rate` (numeric) - Calculated accuracy percentage
  - `last_attempt_at` (timestamptz) - Last activity timestamp
  - `updated_at` (timestamptz) - Stats last updated
  
  ## Security
  - RLS enabled on all tables
  - Users can only access their own data
  - Authenticated users required for all operations
  
  ## Notes
  - All timestamps use UTC timezone
  - Default values set for boolean and timestamp fields
  - Indexes created on foreign keys for performance
  - Unique constraints on user_stats to prevent duplicates
*/

-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Create study_sessions table
CREATE TABLE IF NOT EXISTS study_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  session_type text NOT NULL CHECK (session_type IN ('quiz', 'simulado')),
  total_questions integer NOT NULL DEFAULT 0,
  correct_answers integer NOT NULL DEFAULT 0,
  started_at timestamptz DEFAULT now(),
  completed_at timestamptz,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE study_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own study sessions"
  ON study_sessions FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own study sessions"
  ON study_sessions FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own study sessions"
  ON study_sessions FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_study_sessions_user_id ON study_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_study_sessions_created_at ON study_sessions(created_at);

-- Create question_attempts table
CREATE TABLE IF NOT EXISTS question_attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES study_sessions(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  question_id integer NOT NULL,
  disciplina text NOT NULL,
  assunto text NOT NULL,
  user_answer text NOT NULL,
  correct_answer text NOT NULL,
  is_correct boolean NOT NULL DEFAULT false,
  answered_at timestamptz DEFAULT now()
);

ALTER TABLE question_attempts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own question attempts"
  ON question_attempts FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own question attempts"
  ON question_attempts FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_question_attempts_user_id ON question_attempts(user_id);
CREATE INDEX IF NOT EXISTS idx_question_attempts_session_id ON question_attempts(session_id);
CREATE INDEX IF NOT EXISTS idx_question_attempts_disciplina ON question_attempts(disciplina);
CREATE INDEX IF NOT EXISTS idx_question_attempts_assunto ON question_attempts(assunto);

-- Create user_stats table
CREATE TABLE IF NOT EXISTS user_stats (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  disciplina text NOT NULL,
  assunto text,
  total_attempts integer NOT NULL DEFAULT 0,
  correct_attempts integer NOT NULL DEFAULT 0,
  accuracy_rate numeric(5,2) NOT NULL DEFAULT 0.0,
  last_attempt_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, disciplina, assunto)
);

ALTER TABLE user_stats ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own stats"
  ON user_stats FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own stats"
  ON user_stats FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own stats"
  ON user_stats FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_user_stats_user_id ON user_stats(user_id);
CREATE INDEX IF NOT EXISTS idx_user_stats_disciplina ON user_stats(disciplina);

-- Function to automatically create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, created_at, updated_at)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'full_name', now(), now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile automatically
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();