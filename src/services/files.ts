import { api } from './api';
import type { File } from '../types';

export const filesService = {
  upload: async (file: globalThis.File): Promise<File> => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post<File>('/api/files', formData);
  },

  list: async (): Promise<File[]> => {
    return api.get<File[]>('/api/files');
  },

  get: async (id: number): Promise<File> => {
    return api.get<File>(`/api/files/${id}`);
  },

  download: async (id: number): Promise<Blob> => {
    const response = await api.fetchApi<Response>(`/api/files/${id}/download`, {
      method: 'GET',
    });
    return response.blob();
  },

  delete: async (id: number): Promise<{ message: string }> => {
    return api.delete<{ message: string }>(`/api/files/${id}`);
  },
};
