import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Trophy, Hop as Home, RotateCcw } from 'lucide-react-native';

export default function ResultsScreen() {
  const { total, correct } = useLocalSearchParams<{
    total: string;
    correct: string;
  }>();
  const router = useRouter();

  const totalNum = parseInt(total) || 0;
  const correctNum = parseInt(correct) || 0;
  const percentage = totalNum > 0 ? (correctNum / totalNum) * 100 : 0;

  const getPerformanceMessage = () => {
    if (percentage >= 80) return 'Excelente!';
    if (percentage >= 60) return 'Muito bom!';
    if (percentage >= 40) return 'Bom trabalho!';
    return 'Continue estudando!';
  };

  const getPerformanceColor = () => {
    if (percentage >= 80) return '#10B981';
    if (percentage >= 60) return '#2563EB';
    if (percentage >= 40) return '#F59E0B';
    return '#DC2626';
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <Trophy size={80} color={getPerformanceColor()} strokeWidth={2} />
        </View>

        <Text style={[styles.title, { color: getPerformanceColor() }]}>
          {getPerformanceMessage()}
        </Text>

        <View style={styles.scoreContainer}>
          <Text style={styles.scoreLabel}>Seu resultado</Text>
          <Text style={styles.scoreText}>
            {correctNum} / {totalNum}
          </Text>
          <Text style={styles.percentageText}>
            {percentage.toFixed(0)}% de acertos
          </Text>
        </View>

        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{correctNum}</Text>
            <Text style={styles.statLabel}>Acertos</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{totalNum - correctNum}</Text>
            <Text style={styles.statLabel}>Erros</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{totalNum}</Text>
            <Text style={styles.statLabel}>Total</Text>
          </View>
        </View>

        <View style={styles.actions}>
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={() => router.push('/(tabs)')}
          >
            <Home size={20} color="#FFFFFF" strokeWidth={2} />
            <Text style={styles.primaryButtonText}>Voltar ao Início</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={() => router.back()}
          >
            <RotateCcw size={20} color="#DC2626" strokeWidth={2} />
            <Text style={styles.secondaryButtonText}>Estudar Novamente</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  content: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconContainer: {
    marginBottom: 24,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 32,
    textAlign: 'center',
  },
  scoreContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
    marginBottom: 24,
    width: '100%',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  scoreLabel: {
    fontSize: 16,
    color: '#6B7280',
    marginBottom: 8,
  },
  scoreText: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 8,
  },
  percentageText: {
    fontSize: 20,
    color: '#6B7280',
    fontWeight: '600',
  },
  statsContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 32,
    width: '100%',
  },
  statCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  statNumber: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  actions: {
    width: '100%',
    gap: 12,
  },
  primaryButton: {
    backgroundColor: '#DC2626',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 8,
    gap: 8,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  secondaryButton: {
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 8,
    gap: 8,
    borderWidth: 2,
    borderColor: '#DC2626',
  },
  secondaryButtonText: {
    color: '#DC2626',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
