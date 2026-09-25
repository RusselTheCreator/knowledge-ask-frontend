import { api } from './api';
import type { Ask, AskRequest } from '../types';

export const askService = {
  ask: async (data: AskRequest): Promise<Ask> => {
    return api.post<Ask>('/api/ask', data);
  },

  history: async (): Promise<Ask[]> => {
    return api.get<Ask[]>('/api/ask/history');
  },

  get: async (id: number): Promise<Ask> => {
    return api.get<Ask>(`/api/ask/${id}`);
  },
};
