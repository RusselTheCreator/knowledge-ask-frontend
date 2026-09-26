import { api } from './api';
import type { File } from '../types';

// Backend returns snake_case, frontend expects camelCase - transform to frontend format
function transformBackendFile(backendFile: any): File {
  return {
    id: backendFile.id,
    filename: backendFile.filename || backendFile.original_name,
    originalName: backendFile.originalName || backendFile.original_name,
    mimeType: backendFile.mimeType || backendFile.mime_type,
    size: backendFile.size || backendFile.size_bytes || backendFile.sizeBytes,
    uploadedAt: backendFile.uploadedAt || backendFile.created_at || backendFile.createdAt,
    status: (backendFile.status === 'error' ? 'failed' : backendFile.status) as File['status'],
    chunkCount: backendFile.chunkCount || parseInt(backendFile.chunk_count || '0'),
    userId: backendFile.userId || backendFile.user_id || 0,
    errorMessage: backendFile.errorMessage || backendFile.error_message || undefined,
  };
}

export const filesService = {
  upload: async (file: globalThis.File): Promise<File> => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await api.post<any>('/api/files', formData);
    return transformBackendFile(response.file || response);
  },

  list: async (): Promise<File[]> => {
    const response = await api.get<any>('/api/files');
    // Handle both array response and {files: []} response
    const filesList = Array.isArray(response) ? response : (response.files || []);
    return filesList.map(transformBackendFile);
  },

  get: async (id: number): Promise<File> => {
    const response = await api.get<any>(`/api/files/${id}`);
    return transformBackendFile(response.file || response);
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
