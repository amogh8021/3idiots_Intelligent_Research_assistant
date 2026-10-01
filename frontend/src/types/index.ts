export type DocumentStatus = 'UPLOADING' | 'PROCESSING' | 'READY' | 'FAILED';

export interface User {
  id: string;
  name: string;
  email: string;
  createdAt: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface Document {
  id: string;
  fileName: string;
  status: DocumentStatus;
  fileSize: number;
  pageCount?: number;
  uploadedAt: string;
  processedAt?: string;
}

export interface Source {
  documentId: string;
  fileName: string;
  page: number;
  snippet: string;
}

export interface AskQuestionRequest {
  documentIds: string[];
  question: string;
}

export interface SynthesizeRequest {
  documentIds: string[];
  focus: 'executive' | 'methodology' | 'limitations' | 'comparison';
}

export interface AskQuestionResponse {
  answer: string;
  sources: Source[];
}

export interface ResearchHistoryItem {
  questionId: string;
  question: string;
  answer: string;
  createdAt: string;
  documentIds?: string[];
  documentNames?: string[];
  sources?: Source[];
}

export interface DashboardStats {
  totalDocuments: number;
  readyDocuments: number;
  processingDocuments: number;
  questionsAsked: number;
}

export interface ApiError {
  timestamp?: string;
  status?: number;
  error?: string;
  message: string;
}
