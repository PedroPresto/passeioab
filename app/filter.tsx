import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { questionsAPI } from '@/services/api';
import { ArrowLeft, Play } from 'lucide-react-native';

export default function FilterScreen() {
  const { disciplina } = useLocalSearchParams<{ disciplina: string }>();
  const [assuntos, setAssuntos] = useState<string[]>([]);
  const [selectedAssuntos, setSelectedAssuntos] = useState<string[]>([]);
  const [quantidade, setQuantidade] = useState('10');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    loadAssuntos();
  }, []);

  const loadAssuntos = async () => {
    try {
      setLoading(true);
      const allAssuntos = await questionsAPI.getAssuntos();
      setAssuntos(allAssuntos);
      setError(null);
    } catch (err) {
      setError('Erro ao carregar assuntos');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const toggleAssunto = (assunto: string) => {
    setSelectedAssuntos((prev) =>
      prev.includes(assunto)
        ? prev.filter((a) => a !== assunto)
        : [...prev, assunto]
    );
  };

  const handleStartStudy = () => {
    const qtd = parseInt(quantidade) || 10;
    router.push({
      pathname: '/quiz',
      params: {
        disciplina,
        assuntos: JSON.stringify(selectedAssuntos),
        quantidade: qtd.toString(),
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

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <ArrowLeft size={24} color="#1F2937" strokeWidth={2} />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.title}>{disciplina}</Text>
          <Text style={styles.subtitle}>Configure seu estudo</Text>
        </View>
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quantidade de Questões</Text>
          <TextInput
            style={styles.input}
            value={quantidade}
            onChangeText={setQuantidade}
            keyboardType="number-pad"
            placeholder="Ex: 10"
            placeholderTextColor="#9CA3AF"
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            Assuntos (opcional - deixe em branco para todos)
          </Text>
          <Text style={styles.sectionDescription}>
            Selecione os assuntos específicos que deseja estudar
          </Text>
          {assuntos.map((assunto) => (
            <TouchableOpacity
              key={assunto}
              style={[
                styles.assuntoCard,
                selectedAssuntos.includes(assunto) && styles.assuntoCardSelected,
              ]}
              onPress={() => toggleAssunto(assunto)}
            >
              <View
                style={[
                  styles.checkbox,
                  selectedAssuntos.includes(assunto) && styles.checkboxSelected,
                ]}
              >
                {selectedAssuntos.includes(assunto) && (
                  <View style={styles.checkboxInner} />
                )}
              </View>
              <Text
                style={[
                  styles.assuntoText,
                  selectedAssuntos.includes(assunto) && styles.assuntoTextSelected,
                ]}
              >
                {assunto}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.startButton}
          onPress={handleStartStudy}
        >
          <Play size={20} color="#FFFFFF" strokeWidth={2} />
          <Text style={styles.startButtonText}>Começar</Text>
        </TouchableOpacity>
      </View>
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
  },
  header: {
    backgroundColor: '#FFFFFF',
    paddingTop: 60,
    paddingBottom: 20,
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
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#6B7280',
  },
  content: {
    flex: 1,
  },
  section: {
    padding: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 8,
  },
  sectionDescription: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 16,
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    padding: 16,
    fontSize: 16,
    color: '#1F2937',
  },
  assuntoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 16,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  assuntoCardSelected: {
    backgroundColor: '#DBEAFE',
    borderColor: '#2563EB',
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    marginRight: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxSelected: {
    borderColor: '#2563EB',
    backgroundColor: '#2563EB',
  },
  checkboxInner: {
    width: 12,
    height: 12,
    borderRadius: 3,
    backgroundColor: '#FFFFFF',
  },
  assuntoText: {
    flex: 1,
    fontSize: 16,
    color: '#1F2937',
  },
  assuntoTextSelected: {
    color: '#1F2937',
    fontWeight: '600',
  },
  footer: {
    backgroundColor: '#FFFFFF',
    padding: 24,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  startButton: {
    backgroundColor: '#DC2626',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 8,
    gap: 8,
  },
  startButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
});
