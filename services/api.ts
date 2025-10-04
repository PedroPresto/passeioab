const API_BASE_URL = 'http://72.60.1.187:5000';

export interface Question {
  id: number;
  disciplina: string;
  assunto: string;
  material: string;
  enunciado: string;
  alternativa_a: string;
  alternativa_b: string;
  alternativa_c: string | null;
  alternativa_d: string | null;
  gabarito: string;
  comentario: string;
}

export interface QuestionCount {
  total: number;
}

class QuestionsAPI {
  private async fetchAPI<T>(endpoint: string): Promise<T> {
    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`);
      if (!response.ok) {
        throw new Error(`API Error: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error('API Fetch Error:', error);
      throw error;
    }
  }

  async getAllQuestions(): Promise<Question[]> {
    return this.fetchAPI<Question[]>('/api/questoes');
  }

  async getRandomQuestion(): Promise<Question> {
    return this.fetchAPI<Question>('/api/questoes/aleatoria');
  }

  async getQuestionsByDisciplinaAndAssunto(
    disciplina: string,
    assunto: string
  ): Promise<Question[]> {
    const encodedDisciplina = encodeURIComponent(disciplina);
    const encodedAssunto = encodeURIComponent(assunto);
    return this.fetchAPI<Question[]>(
      `/api/questoes/disciplina/${encodedDisciplina}/assunto/${encodedAssunto}`
    );
  }

  async getRandomQuestionByDisciplinaAndAssunto(
    disciplina: string,
    assunto: string
  ): Promise<Question> {
    const encodedDisciplina = encodeURIComponent(disciplina);
    const encodedAssunto = encodeURIComponent(assunto);
    return this.fetchAPI<Question>(
      `/api/questoes/disciplina/${encodedDisciplina}/assunto/${encodedAssunto}/aleatoria`
    );
  }

  async getDisciplinas(): Promise<string[]> {
    return this.fetchAPI<string[]>('/api/questoes/disciplinas');
  }

  async getAssuntos(): Promise<string[]> {
    return this.fetchAPI<string[]>('/api/questoes/assunto');
  }

  async getQuestionsByDisciplina(
    disciplina: string,
    quantidade: number
  ): Promise<Question[]> {
    const encodedDisciplina = encodeURIComponent(disciplina);
    return this.fetchAPI<Question[]>(
      `/api/questoes/disciplina/${encodedDisciplina}/${quantidade}`
    );
  }

  async getQuestionsByAssunto(
    assunto: string,
    quantidade: number
  ): Promise<Question[]> {
    const encodedAssunto = encodeURIComponent(assunto);
    return this.fetchAPI<Question[]>(
      `/api/questoes/assunto/${encodedAssunto}/${quantidade}`
    );
  }

  async countQuestionsByDisciplina(disciplina: string): Promise<number> {
    const encodedDisciplina = encodeURIComponent(disciplina);
    const result = await this.fetchAPI<QuestionCount>(
      `/api/questoes/disciplina/${encodedDisciplina}/contagem`
    );
    return result.total;
  }

  async countQuestionsByAssunto(assunto: string): Promise<number> {
    const encodedAssunto = encodeURIComponent(assunto);
    const result = await this.fetchAPI<QuestionCount>(
      `/api/questoes/assunto/${encodedAssunto}/contagem`
    );
    return result.total;
  }

  async getQuestionById(id: number): Promise<Question> {
    return this.fetchAPI<Question>(`/api/questoes/${id}`);
  }
}

export const questionsAPI = new QuestionsAPI();
