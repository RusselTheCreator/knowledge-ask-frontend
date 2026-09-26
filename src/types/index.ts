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
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'error';
  chunkCount: number;
  userId: number;
  errorMessage?: string;
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

export interface AskApiResponse {
  message: string;
  answer: string;
  askId: number;
  sources: {
    fileId: number;
    fileName: string;
    chunkId: number;
    relevanceScore: number;
    excerpt: string;
  }[];
}

export interface HistoryApiResponse {
  message: string;
  count: number;
  asks: {
    id: number;
    question: string;
    answer: string;
    status: string;
    error_message: string | null;
    createdAt: string;
    created_at?: string;
  }[];
}

export interface AskByIdApiResponse {
  message: string;
  ask: {
    id: number;
    question: string;
    answer: string;
    status: string;
    errorMessage: string | null;
    createdAt: string;
    sources: {
      file_id: number;
      file_name: string;
      chunk_id: number;
      relevance_score: number;
      chunk_excerpt: string;
    }[];
  };
}

export interface ApiError {
  error: string;
  details?: string;
}
