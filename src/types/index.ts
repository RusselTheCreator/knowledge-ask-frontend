export interface User {
  id: number;
  name: string;
  email: string;
  role: 'User' | 'Admin';
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface File {
  id: number;
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  uploadedAt: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  chunkCount: number;
  userId: number;
}

export interface AskRequest {
  question: string;
  fileIds?: number[];
}

export interface Source {
  fileId: number;
  filename: string;
  chunkText: string;
  similarity: number;
}

export interface Ask {
  id: number;
  question: string;
  answer: string;
  sources: Source[];
  createdAt: string;
  userId: number;
}

export interface ApiError {
  error: string;
  details?: string;
}
