import { api } from './api';
import { Document, DashboardStats } from '../types';

export const documentService = {
  async getDocuments(): Promise<Document[]> {
    const res = await api.get<Document[]>('/api/documents');
    return res.data;
  },

  async getDocument(id: string): Promise<Document> {
    const res = await api.get<Document>(`/api/documents/${id}`);
    return res.data;
  },

  async uploadDocument(
    file: File,
    onProgress?: (percentCompleted: number) => void
  ): Promise<{ id: string; fileName: string; status: string }> {
    const formData = new FormData();
    formData.append('file', file);

    const res = await api.post('/api/documents', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: (progressEvent) => {
        if (progressEvent.total && onProgress) {
          const percentCompleted = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total
          );
          onProgress(percentCompleted);
        }
      },
    });

    return res.data;
  },

  async deleteDocument(id: string): Promise<void> {
    await api.delete(`/api/documents/${id}`);
  },

  async getStats(): Promise<DashboardStats> {
    const res = await api.get<DashboardStats>('/api/documents/stats');
    return res.data;
  },

  async seedSamples(): Promise<Document[]> {
    const res = await api.post<Document[]>('/api/documents/seed-samples');
    return res.data;
  },
};
