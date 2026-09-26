import { api } from './api';
import type { Ask, AskRequest, AskApiResponse, HistoryApiResponse, AskByIdApiResponse, Source } from '../types';

// Normalize source from POST /api/ask response
function normalizeAskSource(source: AskApiResponse['sources'][0]): Source {
  return {
    fileId: source.fileId,
    filename: source.fileName,
    chunkText: source.excerpt,
    similarity: source.relevanceScore,
  };
}

// Normalize source from GET /api/ask/:id response
function normalizeAskByIdSource(source: AskByIdApiResponse['ask']['sources'][0]): Source {
  return {
    fileId: source.file_id,
    filename: source.file_name,
    chunkText: source.chunk_excerpt,
    similarity: source.relevance_score,
  };
}

export const askService = {
  ask: async (data: AskRequest): Promise<Ask> => {
    const response = await api.post<AskApiResponse>('/api/ask', data);
    
    // Normalize the POST response to match the UI Ask model
    return {
      id: response.askId,
      question: data.question, // Echo back the question since API doesn't return it
      answer: response.answer,
      sources: response.sources.map(normalizeAskSource),
      createdAt: new Date().toISOString(), // Generate timestamp since API doesn't return it
      userId: 0, // Not provided by API in POST response
    };
  },

  history: async (): Promise<Ask[]> => {
    try {
      const result = await api.get<HistoryApiResponse>('/api/ask/history');
      
      // Extract asks array from envelope and normalize field names
      if (result && result.asks && Array.isArray(result.asks)) {
        return result.asks.map(ask => ({
          id: ask.id,
          question: ask.question,
          answer: ask.answer,
          sources: [], // History endpoint doesn't include sources
          createdAt: ask.created_at, // Map snake_case to camelCase
          userId: 0, // Not provided by API
        }));
      }
      
      return [];
    } catch (error) {
      // Return empty array on error - new users have no history
      console.warn('History endpoint failed, returning empty history:', error);
      return [];
    }
  },

  get: async (id: number): Promise<Ask> => {
    const response = await api.get<AskByIdApiResponse>(`/api/ask/${id}`);
    
    // Normalize the GET by ID response
    return {
      id: response.ask.id,
      question: response.ask.question,
      answer: response.ask.answer,
      sources: response.ask.sources.map(normalizeAskByIdSource),
      createdAt: response.ask.createdAt,
      userId: 0, // Not provided by API
    };
  },
};
