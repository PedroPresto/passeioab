import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { BookOpen, FileText, Target, TrendingUp } from 'lucide-react-native';
import { useAuth } from '@/contexts/AuthContext';

export default function HomeTab() {
  const router = useRouter();
  const { user } = useAuth();

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.greeting}>Olá!</Text>
        <Text style={styles.title}>Passei OAB</Text>
        <Text style={styles.subtitle}>Sua jornada de aprovação começa aqui</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Como deseja estudar?</Text>

        <TouchableOpacity
          style={[styles.card, styles.cardPrimary]}
          onPress={() => router.push('/study')}
        >
          <View style={styles.cardIcon}>
            <BookOpen size={32} color="#FFFFFF" strokeWidth={2} />
          </View>
          <View style={styles.cardContent}>
            <Text style={styles.cardTitle}>Questões Avulsas</Text>
            <Text style={styles.cardDescription}>
              Resolva questões por disciplina ou assunto
            </Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.card, styles.cardSecondary]}
          onPress={() => router.push('/study')}
        >
          <View style={styles.cardIcon}>
            <FileText size={32} color="#FFFFFF" strokeWidth={2} />
          </View>
          <View style={styles.cardContent}>
            <Text style={styles.cardTitle}>Simulado</Text>
            <Text style={styles.cardDescription}>
              Faça um simulado completo da prova
            </Text>
          </View>
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Recursos</Text>

        <TouchableOpacity
          style={styles.featureCard}
          onPress={() => router.push('/performance')}
        >
          <TrendingUp size={24} color="#2563EB" strokeWidth={2} />
          <View style={styles.featureContent}>
            <Text style={styles.featureTitle}>Ver Desempenho</Text>
            <Text style={styles.featureDescription}>
              Acompanhe sua evolução e estatísticas
            </Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity style={styles.featureCard}>
          <Target size={24} color="#2563EB" strokeWidth={2} />
          <View style={styles.featureContent}>
            <Text style={styles.featureTitle}>Metas de Estudo</Text>
            <Text style={styles.featureDescription}>
              Em breve: Defina e acompanhe suas metas
            </Text>
          </View>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    backgroundColor: '#DC2626',
    paddingTop: 60,
    paddingBottom: 32,
    paddingHorizontal: 24,
  },
  greeting: {
    fontSize: 18,
    color: '#FFFFFF',
    marginBottom: 4,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#FEE2E2',
  },
  section: {
    padding: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 16,
  },
  card: {
    flexDirection: 'row',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    alignItems: 'center',
  },
  cardPrimary: {
    backgroundColor: '#DC2626',
  },
  cardSecondary: {
    backgroundColor: '#2563EB',
  },
  cardIcon: {
    marginRight: 16,
  },
  cardContent: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  cardDescription: {
    fontSize: 14,
    color: '#FEE2E2',
  },
  featureCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  featureContent: {
    flex: 1,
    marginLeft: 16,
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 2,
  },
  featureDescription: {
    fontSize: 14,
    color: '#6B7280',
  },
});
