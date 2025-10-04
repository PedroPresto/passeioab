import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { questionsAPI, Question } from '@/services/api';
import { supabase } from '@/services/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { ArrowLeft, CircleCheck as CheckCircle2, Circle as XCircle } from 'lucide-react-native';

export default function QuizScreen() {
  const { disciplina, assuntos, quantidade } = useLocalSearchParams<{
    disciplina: string;
    assuntos: string;
    quantidade: string;
  }>();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [answers, setAnswers] = useState<{ [key: number]: string }>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const router = useRouter();
  const { user } = useAuth();

  useEffect(() => {
    loadQuestions();
  }, []);

  const loadQuestions = async () => {
    try {
      setLoading(true);
      const qtd = parseInt(quantidade) || 10;
      const selectedAssuntos = assuntos ? JSON.parse(assuntos) : [];

      let loadedQuestions: Question[] = [];

      if (selectedAssuntos.length > 0) {
        for (const assunto of selectedAssuntos) {
          const questionsPerAssunto = Math.ceil(qtd / selectedAssuntos.length);
          const assuntoQuestions = await questionsAPI.getQuestionsByAssunto(
            assunto,
            questionsPerAssunto
          );
          loadedQuestions = [...loadedQuestions, ...assuntoQuestions];
        }
        loadedQuestions = loadedQuestions.slice(0, qtd);
      } else {
        loadedQuestions = await questionsAPI.getQuestionsByDisciplina(
          disciplina,
          qtd
        );
      }

      setQuestions(loadedQuestions);

      const { data: session } = await supabase
        .from('study_sessions')
        .insert({
          user_id: user?.id,
          session_type: 'quiz',
          total_questions: loadedQuestions.length,
          correct_answers: 0,
        })
        .select()
        .single();

      if (session) {
        setSessionId(session.id);
      }

      setError(null);
    } catch (err) {
      setError('Erro ao carregar questões');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAnswer = async (answer: string) => {
    if (showResult) return;

    setSelectedAnswer(answer);
    setShowResult(true);

    const currentQuestion = questions[currentIndex];
    const isCorrect = answer === currentQuestion.gabarito;

    setAnswers({
      ...answers,
      [currentIndex]: answer,
    });

    if (sessionId) {
      await supabase.from('question_attempts').insert({
        session_id: sessionId,
        user_id: user?.id,
        question_id: currentQuestion.id,
        disciplina: currentQuestion.disciplina,
        assunto: currentQuestion.assunto,
        user_answer: answer,
        correct_answer: currentQuestion.gabarito,
        is_correct: isCorrect,
      });
    }
  };

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setSelectedAnswer(null);
      setShowResult(false);
    } else {
      finishQuiz();
    }
  };

  const finishQuiz = async () => {
    const correctCount = Object.entries(answers).filter(
      ([index, answer]) => answer === questions[parseInt(index)].gabarito
    ).length;

    if (sessionId) {
      await supabase
        .from('study_sessions')
        .update({
          correct_answers: correctCount,
          completed_at: new Date().toISOString(),
        })
        .eq('id', sessionId);

      for (const question of questions) {
        const { data: existingStats } = await supabase
          .from('user_stats')
          .select()
          .eq('user_id', user?.id)
          .eq('disciplina', question.disciplina)
          .eq('assunto', question.assunto)
          .maybeSingle();

        const userAnswer = answers[questions.indexOf(question)];
        const isCorrect = userAnswer === question.gabarito;

        if (existingStats) {
          const newTotal = existingStats.total_attempts + 1;
          const newCorrect = existingStats.correct_attempts + (isCorrect ? 1 : 0);
          const newAccuracy = (newCorrect / newTotal) * 100;

          await supabase
            .from('user_stats')
            .update({
              total_attempts: newTotal,
              correct_attempts: newCorrect,
              accuracy_rate: newAccuracy,
              last_attempt_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            })
            .eq('id', existingStats.id);
        } else {
          await supabase.from('user_stats').insert({
            user_id: user?.id,
            disciplina: question.disciplina,
            assunto: question.assunto,
            total_attempts: 1,
            correct_attempts: isCorrect ? 1 : 0,
            accuracy_rate: isCorrect ? 100 : 0,
            last_attempt_at: new Date().toISOString(),
          });
        }
      }
    }

    router.push({
      pathname: '/results',
      params: {
        total: questions.length.toString(),
        correct: correctCount.toString(),
        sessionId: sessionId || '',
      },
    });
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#DC2626" />
      </View>
    );
  }

  if (error || questions.length === 0) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>
          {error || 'Nenhuma questão encontrada'}
        </Text>
        <TouchableOpacity
          style={styles.retryButton}
          onPress={() => router.back()}
        >
          <Text style={styles.retryButtonText}>Voltar</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const currentQuestion = questions[currentIndex];
  const alternatives = [
    { key: 'A', text: currentQuestion.alternativa_a },
    { key: 'B', text: currentQuestion.alternativa_b },
    currentQuestion.alternativa_c && { key: 'C', text: currentQuestion.alternativa_c },
    currentQuestion.alternativa_d && { key: 'D', text: currentQuestion.alternativa_d },
  ].filter(Boolean) as { key: string; text: string }[];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <ArrowLeft size={24} color="#1F2937" strokeWidth={2} />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.progress}>
            Questão {currentIndex + 1} de {questions.length}
          </Text>
          <View style={styles.progressBar}>
            <View
              style={[
                styles.progressFill,
                { width: `${((currentIndex + 1) / questions.length) * 100}%` },
              ]}
            />
          </View>
        </View>
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.questionCard}>
          <Text style={styles.disciplina}>{currentQuestion.disciplina}</Text>
          <Text style={styles.assunto}>{currentQuestion.assunto}</Text>
          <Text style={styles.enunciado}>{currentQuestion.enunciado}</Text>
        </View>

        <View style={styles.alternatives}>
          {alternatives.map((alt) => {
            const isSelected = selectedAnswer === alt.key;
            const isCorrect = alt.key === currentQuestion.gabarito;
            const showCorrectAnswer = showResult && isCorrect;
            const showWrongAnswer = showResult && isSelected && !isCorrect;

            return (
              <TouchableOpacity
                key={alt.key}
                style={[
                  styles.alternative,
                  isSelected && styles.alternativeSelected,
                  showCorrectAnswer && styles.alternativeCorrect,
                  showWrongAnswer && styles.alternativeWrong,
                ]}
                onPress={() => handleAnswer(alt.key)}
                disabled={showResult}
              >
                <View style={styles.alternativeContent}>
                  <View
                    style={[
                      styles.alternativeKey,
                      isSelected && styles.alternativeKeySelected,
                      showCorrectAnswer && styles.alternativeKeyCorrect,
                      showWrongAnswer && styles.alternativeKeyWrong,
                    ]}
                  >
                    <Text
                      style={[
                        styles.alternativeKeyText,
                        (isSelected || showCorrectAnswer || showWrongAnswer) &&
                          styles.alternativeKeyTextSelected,
                      ]}
                    >
                      {alt.key}
                    </Text>
                  </View>
                  <Text
                    style={[
                      styles.alternativeText,
                      (showCorrectAnswer || showWrongAnswer) &&
                        styles.alternativeTextBold,
                    ]}
                  >
                    {alt.text}
                  </Text>
                </View>
                {showCorrectAnswer && (
                  <CheckCircle2 size={24} color="#10B981" strokeWidth={2} />
                )}
                {showWrongAnswer && (
                  <XCircle size={24} color="#DC2626" strokeWidth={2} />
                )}
              </TouchableOpacity>
            );
          })}
        </View>

        {showResult && (
          <View style={styles.comentarioCard}>
            <Text style={styles.comentarioTitle}>Comentário:</Text>
            <Text style={styles.comentarioText}>{currentQuestion.comentario}</Text>
          </View>
        )}
      </ScrollView>

      {showResult && (
        <View style={styles.footer}>
          <TouchableOpacity style={styles.nextButton} onPress={handleNext}>
            <Text style={styles.nextButtonText}>
              {currentIndex < questions.length - 1 ? 'Próxima' : 'Finalizar'}
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    padding: 24,
  },
  header: {
    backgroundColor: '#FFFFFF',
    paddingTop: 60,
    paddingBottom: 16,
    paddingHorizontal: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    marginRight: 16,
  },
  headerContent: {
    flex: 1,
  },
  progress: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 8,
  },
  progressBar: {
    height: 6,
    backgroundColor: '#E5E7EB',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#DC2626',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  questionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  disciplina: {
    fontSize: 14,
    fontWeight: '600',
    color: '#DC2626',
    marginBottom: 4,
  },
  assunto: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 16,
  },
  enunciado: {
    fontSize: 16,
    color: '#1F2937',
    lineHeight: 24,
  },
  alternatives: {
    marginBottom: 16,
  },
  alternative: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    flexDirection: 'row',
    alignItems: 'center',
  },
  alternativeSelected: {
    borderColor: '#2563EB',
    backgroundColor: '#EFF6FF',
  },
  alternativeCorrect: {
    borderColor: '#10B981',
    backgroundColor: '#D1FAE5',
  },
  alternativeWrong: {
    borderColor: '#DC2626',
    backgroundColor: '#FEE2E2',
  },
  alternativeContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  alternativeKey: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  alternativeKeySelected: {
    backgroundColor: '#2563EB',
  },
  alternativeKeyCorrect: {
    backgroundColor: '#10B981',
  },
  alternativeKeyWrong: {
    backgroundColor: '#DC2626',
  },
  alternativeKeyText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#6B7280',
  },
  alternativeKeyTextSelected: {
    color: '#FFFFFF',
  },
  alternativeText: {
    flex: 1,
    fontSize: 15,
    color: '#1F2937',
    lineHeight: 22,
  },
  alternativeTextBold: {
    fontWeight: '600',
  },
  comentarioCard: {
    backgroundColor: '#EFF6FF',
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  comentarioTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1E40AF',
    marginBottom: 8,
  },
  comentarioText: {
    fontSize: 15,
    color: '#1F2937',
    lineHeight: 22,
  },
  footer: {
    backgroundColor: '#FFFFFF',
    padding: 24,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  nextButton: {
    backgroundColor: '#DC2626',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  nextButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  errorText: {
    fontSize: 16,
    color: '#DC2626',
    textAlign: 'center',
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: '#DC2626',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
