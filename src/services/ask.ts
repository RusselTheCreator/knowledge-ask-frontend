import { api } from './api';
import type { Ask, AskRequest } from '../types';

export const askService = {
  ask: async (data: AskRequest): Promise<Ask> => {
    return api.post<Ask>('/api/ask', data);
  },

  history: async (): Promise<Ask[]> => {
    try {
      const result = await api.get<Ask[]>('/api/ask/history');
      // Backend might return error object instead of array for new users
      return Array.isArray(result) ? result : [];
    } catch (error) {
      // Return empty array on error - new users have no history
      console.warn('History endpoint failed, returning empty history:', error);
      return [];
    }
  },

  get: async (id: number): Promise<Ask> => {
    return api.get<Ask>(`/api/ask/${id}`);
  },
};
