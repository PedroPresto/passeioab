import { createClient } from '@supabase/supabase-js';
import 'react-native-url-polyfill/auto';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

export interface Profile {
  id: string;
  full_name: string | null;
  created_at: string;
  updated_at: string;
}

export interface StudySession {
  id: string;
  user_id: string;
  session_type: 'quiz' | 'simulado';
  total_questions: number;
  correct_answers: number;
  started_at: string;
  completed_at: string | null;
  created_at: string;
}

export interface QuestionAttempt {
  id: string;
  session_id: string;
  user_id: string;
  question_id: number;
  disciplina: string;
  assunto: string;
  user_answer: string;
  correct_answer: string;
  is_correct: boolean;
  answered_at: string;
}

export interface UserStats {
  id: string;
  user_id: string;
  disciplina: string;
  assunto: string | null;
  total_attempts: number;
  correct_attempts: number;
  accuracy_rate: number;
  last_attempt_at: string;
  updated_at: string;
}
