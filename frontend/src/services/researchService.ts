import { api } from './api';
import { AskQuestionRequest, AskQuestionResponse, ResearchHistoryItem } from '../types';

export const researchService = {
  async askQuestion(data: AskQuestionRequest): Promise<AskQuestionResponse> {
    const res = await api.post<AskQuestionResponse>('/api/research/ask', data);
    return res.data;
  },

  async synthesize(data: { documentIds: string[]; focus: string }): Promise<AskQuestionResponse> {
    const res = await api.post<AskQuestionResponse>('/api/research/synthesize', data);
    return res.data;
  },

  async getHistory(): Promise<ResearchHistoryItem[]> {
    const res = await api.get<ResearchHistoryItem[]>('/api/research/history');
    return res.data;
  },
};
