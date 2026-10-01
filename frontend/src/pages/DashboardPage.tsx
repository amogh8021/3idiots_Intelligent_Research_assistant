import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '../components/layout/Header';
import { PageContainer } from '../components/layout/PageContainer';
import { DocumentTable } from '../components/documents/DocumentTable';
import { UploadDocumentModal } from '../components/documents/UploadDocumentModal';
import { documentService } from '../services/documentService';
import { Document, DashboardStats } from '../types';
import {
  FileText,
  CheckCircle2,
  Clock,
  HelpCircle,
  Plus,
  ArrowRight,
  BookOpen,
} from 'lucide-react';

export const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [stats, setStats] = useState<DashboardStats>({
    totalDocuments: 0,
    readyDocuments: 0,
    processingDocuments: 0,
    questionsAsked: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isUploadOpen, setIsUploadOpen] = useState(false);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [docsData, statsData] = await Promise.all([
        documentService.getDocuments(),
        documentService.getStats(),
      ]);
      setDocuments(docsData);
      setStats(statsData);
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleDelete = async (id: string) => {
    await documentService.deleteDocument(id);
    loadData();
  };

  const handleSeedSamples = async () => {
    try {
      setIsLoading(true);
      await documentService.seedSamples();
      await loadData();
    } catch (err) {
      console.error('Failed to seed papers:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col min-w-0 bg-canvas">
      <Header
        title="Research Overview"
        subtitle="Workspace summary and active research literature"
        action={
          <button
            onClick={() => setIsUploadOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-stone-900 text-stone-50 text-xs font-medium hover:bg-stone-800 transition-colors shadow-2xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Upload Document</span>
          </button>
        }
      />

      <PageContainer className="space-y-6">
        {/* Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-lg border border-stone-200/80 shadow-2xs">
            <div className="flex items-center justify-between text-stone-500 mb-2">
              <span className="text-xs font-medium">Total Documents</span>
              <FileText className="w-4 h-4 text-stone-400" />
            </div>
            <div className="text-2xl font-bold font-mono text-stone-900">
              {stats.totalDocuments}
            </div>
            <div className="text-[11px] text-stone-500 mt-1">Research papers cataloged</div>
          </div>

          <div className="bg-white p-4 rounded-lg border border-stone-200/80 shadow-2xs">
            <div className="flex items-center justify-between text-stone-500 mb-2">
              <span className="text-xs font-medium">Ready for Query</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            </div>
            <div className="text-2xl font-bold font-mono text-stone-900">
              {stats.readyDocuments}
            </div>
            <div className="text-[11px] text-emerald-600 mt-1">Indexed in storage</div>
          </div>

          <div className="bg-white p-4 rounded-lg border border-stone-200/80 shadow-2xs">
            <div className="flex items-center justify-between text-stone-500 mb-2">
              <span className="text-xs font-medium">Processing</span>
              <Clock className="w-4 h-4 text-amber-500" />
            </div>
            <div className="text-2xl font-bold font-mono text-stone-900">
              {stats.processingDocuments}
            </div>
            <div className="text-[11px] text-stone-500 mt-1">Chunking & embedding</div>
          </div>

          <div className="bg-white p-4 rounded-lg border border-stone-200/80 shadow-2xs">
            <div className="flex items-center justify-between text-stone-500 mb-2">
              <span className="text-xs font-medium">Questions Asked</span>
              <HelpCircle className="w-4 h-4 text-stone-500" />
            </div>
            <div className="text-2xl font-bold font-mono text-stone-900">
              {stats.questionsAsked}
            </div>
            <div className="text-[11px] text-stone-500 mt-1">AI synthesis requests</div>
          </div>
        </div>

        {/* Quick Launch Banner */}
        <div className="bg-stone-900 text-stone-50 rounded-lg p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-stone-300" />
              <h2 className="text-sm font-semibold tracking-tight">Launch Research Query</h2>
            </div>
            <p className="text-xs text-stone-300 max-w-xl">
              Perform cross-document semantic synthesis across your indexed papers. Extracts citations with exact page numbers.
            </p>
          </div>
          <button
            onClick={() => navigate('/research')}
            className="inline-flex items-center gap-2 px-4 py-2 bg-stone-100 text-stone-900 text-xs font-semibold rounded-md hover:bg-white transition-colors shrink-0"
          >
            <span>Open Research Desk</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Recent Documents Table */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-semibold text-stone-900 uppercase tracking-wider font-mono">
              Recent Documents
            </h2>
            <button
              onClick={() => navigate('/documents')}
              className="text-xs text-stone-600 hover:text-stone-900 font-medium flex items-center gap-1"
            >
              <span>View all ({documents.length})</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          <DocumentTable
            documents={documents.slice(0, 5)}
            isLoading={isLoading}
            onDelete={handleDelete}
            emptyMessage="No documents uploaded yet."
            onUploadClick={() => setIsUploadOpen(true)}
            onSeedClick={handleSeedSamples}
          />
        </div>
      </PageContainer>

      <UploadDocumentModal
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        onSuccess={loadData}
      />
    </div>
  );
};
