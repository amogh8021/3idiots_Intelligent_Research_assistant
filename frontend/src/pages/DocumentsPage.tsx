import React, { useEffect, useState } from 'react';
import { Header } from '../components/layout/Header';
import { PageContainer } from '../components/layout/PageContainer';
import { DocumentTable } from '../components/documents/DocumentTable';
import { DocumentSearch } from '../components/documents/DocumentSearch';
import { UploadDocumentModal } from '../components/documents/UploadDocumentModal';
import { documentService } from '../services/documentService';
import { Document } from '../types';
import { Plus, RefreshCw } from 'lucide-react';

export const DocumentsPage: React.FC = () => {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const loadDocuments = async () => {
    try {
      setIsLoading(true);
      const data = await documentService.getDocuments();
      setDocuments(data);
    } catch (err) {
      console.error('Failed to load documents:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = async () => {
    try {
      setIsRefreshing(true);
      const data = await documentService.getDocuments();
      setDocuments(data);
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadDocuments();

    // Auto refresh every 8 seconds if there are items in PROCESSING state
    const interval = setInterval(() => {
      setDocuments((prev) => {
        const hasProcessing = prev.some((d) => d.status === 'PROCESSING' || d.status === 'UPLOADING');
        if (hasProcessing) {
          documentService.getDocuments().then(setDocuments).catch(console.error);
        }
        return prev;
      });
    }, 8000);

    return () => clearInterval(interval);
  }, []);

  const handleDelete = async (id: string) => {
    await documentService.deleteDocument(id);
    loadDocuments();
  };

  const handleSeedSamples = async () => {
    try {
      setIsLoading(true);
      await documentService.seedSamples();
      await loadDocuments();
    } catch (err) {
      console.error('Failed to seed sample papers:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredDocs = documents.filter((d) =>
    d.fileName.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex-1 flex flex-col min-w-0 bg-canvas">
      <Header
        title="Research Documents"
        subtitle="Manage your corpus of uploaded research literature and PDFs"
        action={
          <div className="flex items-center gap-2">
            <button
              onClick={handleSeedSamples}
              disabled={isLoading}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-stone-200 bg-white text-stone-700 text-xs font-medium hover:bg-stone-50 transition-colors shadow-2xs disabled:opacity-50"
              title="Load 3 curated academic papers"
            >
              <span>✨ Load Sample Papers</span>
            </button>
            <button
              onClick={() => setIsUploadOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-stone-900 text-stone-50 text-xs font-medium hover:bg-stone-800 transition-colors shadow-2xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Upload Document</span>
            </button>
          </div>
        }
      />

      <PageContainer className="space-y-4">
        {/* Controls Bar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <DocumentSearch
            value={search}
            onChange={setSearch}
            className="sm:w-80"
            placeholder="Search papers by filename..."
          />

          <div className="flex items-center gap-2 self-end sm:self-auto">
            <button
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md border border-stone-200 bg-white text-stone-700 text-xs font-medium hover:bg-stone-50 transition-colors shadow-2xs disabled:opacity-50"
              title="Refresh document status"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-stone-500 ${isRefreshing ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Refresh</span>
            </button>

            <span className="text-xs text-stone-500 font-mono">
              {filteredDocs.length} {filteredDocs.length === 1 ? 'file' : 'files'}
            </span>
          </div>
        </div>

        {/* Table */}
        <DocumentTable
          documents={filteredDocs}
          isLoading={isLoading}
          onDelete={handleDelete}
          emptyMessage={
            search ? 'No documents match your search filter.' : 'No research documents found.'
          }
          onUploadClick={() => setIsUploadOpen(true)}
          onSeedClick={handleSeedSamples}
        />
      </PageContainer>

      <UploadDocumentModal
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        onSuccess={loadDocuments}
      />
    </div>
  );
};
