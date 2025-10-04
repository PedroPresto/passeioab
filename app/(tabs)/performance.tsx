import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { supabase, UserStats, StudySession } from '@/services/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { TrendingUp, Target, Award, Clock } from 'lucide-react-native';

const { width } = Dimensions.get('window');

export default function PerformanceTab() {
  const [stats, setStats] = useState<UserStats[]>([]);
  const [sessions, setSessions] = useState<StudySession[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);

      const { data: statsData } = await supabase
        .from('user_stats')
        .select('*')
        .eq('user_id', user?.id)
        .order('accuracy_rate', { ascending: false });

      const { data: sessionsData } = await supabase
        .from('study_sessions')
        .select('*')
        .eq('user_id', user?.id)
        .not('completed_at', 'is', null)
        .order('created_at', { ascending: false })
        .limit(10);

      setStats(statsData || []);
      setSessions(sessionsData || []);
    } catch (error) {
      console.error('Error loading performance data:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateOverallStats = () => {
    const totalAttempts = stats.reduce((sum, s) => sum + s.total_attempts, 0);
    const totalCorrect = stats.reduce((sum, s) => sum + s.correct_attempts, 0);
    const overallAccuracy = totalAttempts > 0 ? (totalCorrect / totalAttempts) * 100 : 0;
    const completedSessions = sessions.length;

    return { totalAttempts, totalCorrect, overallAccuracy, completedSessions };
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#DC2626" />
      </View>
    );
  }

  const { totalAttempts, totalCorrect, overallAccuracy, completedSessions } =
    calculateOverallStats();

  const disciplineStats = stats
    .filter((s) => !s.assunto)
    .sort((a, b) => b.accuracy_rate - a.accuracy_rate);

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Seu Desempenho</Text>
        <Text style={styles.subtitle}>Acompanhe sua evolução</Text>
      </View>

      <View style={styles.content}>
        <View style={styles.overallCard}>
          <Text style={styles.cardTitle}>Estatísticas Gerais</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statItem}>
              <View style={[styles.statIcon, { backgroundColor: '#DBEAFE' }]}>
                <Target size={24} color="#2563EB" strokeWidth={2} />
              </View>
              <Text style={styles.statValue}>{totalAttempts}</Text>
              <Text style={styles.statLabel}>Questões</Text>
            </View>

            <View style={styles.statItem}>
              <View style={[styles.statIcon, { backgroundColor: '#D1FAE5' }]}>
                <Award size={24} color="#10B981" strokeWidth={2} />
              </View>
              <Text style={styles.statValue}>{totalCorrect}</Text>
              <Text style={styles.statLabel}>Acertos</Text>
            </View>

            <View style={styles.statItem}>
              <View style={[styles.statIcon, { backgroundColor: '#FEE2E2' }]}>
                <TrendingUp size={24} color="#DC2626" strokeWidth={2} />
              </View>
              <Text style={styles.statValue}>{overallAccuracy.toFixed(0)}%</Text>
              <Text style={styles.statLabel}>Taxa de Acerto</Text>
            </View>

            <View style={styles.statItem}>
              <View style={[styles.statIcon, { backgroundColor: '#FCE7F3' }]}>
                <Clock size={24} color="#DB2777" strokeWidth={2} />
              </View>
              <Text style={styles.statValue}>{completedSessions}</Text>
              <Text style={styles.statLabel}>Sessões</Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Desempenho por Disciplina</Text>
          {disciplineStats.length > 0 ? (
            disciplineStats.map((stat) => (
              <View key={stat.id} style={styles.disciplineCard}>
                <View style={styles.disciplineHeader}>
                  <Text style={styles.disciplineName}>{stat.disciplina}</Text>
                  <Text
                    style={[
                      styles.disciplineAccuracy,
                      {
                        color:
                          stat.accuracy_rate >= 70
                            ? '#10B981'
                            : stat.accuracy_rate >= 50
                            ? '#F59E0B'
                            : '#DC2626',
                      },
                    ]}
                  >
                    {stat.accuracy_rate.toFixed(0)}%
                  </Text>
                </View>

                <View style={styles.progressBar}>
                  <View
                    style={[
                      styles.progressFill,
                      {
                        width: `${Math.min(stat.accuracy_rate, 100)}%`,
                        backgroundColor:
                          stat.accuracy_rate >= 70
                            ? '#10B981'
                            : stat.accuracy_rate >= 50
                            ? '#F59E0B'
                            : '#DC2626',
                      },
                    ]}
                  />
                </View>

                <View style={styles.disciplineStats}>
                  <Text style={styles.disciplineStatText}>
                    {stat.correct_attempts} acertos de {stat.total_attempts} questões
                  </Text>
                </View>
              </View>
            ))
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateText}>
                Nenhuma estatística ainda. Comece a estudar para ver seu desempenho!
              </Text>
            </View>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Histórico Recente</Text>
          {sessions.length > 0 ? (
            sessions.map((session) => {
              const percentage =
                session.total_questions > 0
                  ? (session.correct_answers / session.total_questions) * 100
                  : 0;

              return (
                <View key={session.id} style={styles.sessionCard}>
                  <View style={styles.sessionHeader}>
                    <Text style={styles.sessionType}>
                      {session.session_type === 'quiz' ? 'Questões' : 'Simulado'}
                    </Text>
                    <Text style={styles.sessionDate}>
                      {new Date(session.created_at).toLocaleDateString('pt-BR', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                      })}
                    </Text>
                  </View>

                  <View style={styles.sessionStats}>
                    <Text style={styles.sessionScore}>
                      {session.correct_answers} / {session.total_questions}
                    </Text>
                    <Text
                      style={[
                        styles.sessionPercentage,
                        {
                          color:
                            percentage >= 70
                              ? '#10B981'
                              : percentage >= 50
                              ? '#F59E0B'
                              : '#DC2626',
                        },
                      ]}
                    >
                      {percentage.toFixed(0)}%
                    </Text>
                  </View>
                </View>
              );
            })
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateText}>
                Nenhuma sessão concluída ainda. Comece a estudar!
              </Text>
            </View>
          )}
        </View>
      </View>
    </ScrollView>
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
  },
  header: {
    backgroundColor: '#2563EB',
    paddingTop: 60,
    paddingBottom: 24,
    paddingHorizontal: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#BFDBFE',
  },
  content: {
    padding: 16,
  },
  overallCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 20,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  statItem: {
    width: (width - 88) / 2,
    alignItems: 'center',
  },
  statIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  statValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 16,
  },
  disciplineCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  disciplineHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  disciplineName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    flex: 1,
  },
  disciplineAccuracy: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  progressBar: {
    height: 8,
    backgroundColor: '#E5E7EB',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  disciplineStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  disciplineStatText: {
    fontSize: 14,
    color: '#6B7280',
  },
  sessionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  sessionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  sessionType: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  sessionDate: {
    fontSize: 14,
    color: '#6B7280',
  },
  sessionStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sessionScore: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
  sessionPercentage: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  emptyState: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 32,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  emptyStateText: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 24,
  },
});
