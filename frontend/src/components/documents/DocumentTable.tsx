import React from 'react';
import { Document } from '../../types';
import { DocumentRow } from './DocumentRow';
import { FileQuestion } from 'lucide-react';

interface Props {
  documents: Document[];
  isLoading: boolean;
  onDelete: (id: string) => Promise<void>;
  emptyMessage?: string;
  onUploadClick?: () => void;
  onSeedClick?: () => void;
}

export const DocumentTable: React.FC<Props> = ({
  documents,
  isLoading,
  onDelete,
  emptyMessage = 'No research documents found.',
  onUploadClick,
  onSeedClick,
}) => {
  if (isLoading) {
    return (
      <div className="bg-white rounded-lg border border-stone-200/80 overflow-hidden shadow-2xs">
        <div className="p-8 text-center text-xs text-stone-500 space-y-2">
          <div className="inline-block w-5 h-5 border-2 border-stone-300 border-t-stone-800 rounded-full animate-spin"></div>
          <div>Loading research documents...</div>
        </div>
      </div>
    );
  }

  if (documents.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-stone-200/80 p-12 text-center shadow-2xs">
        <div className="w-10 h-10 rounded-full bg-stone-100 text-stone-400 mx-auto flex items-center justify-center mb-3">
          <FileQuestion className="w-5 h-5" />
        </div>
        <h3 className="text-sm font-medium text-stone-900 mb-1">{emptyMessage}</h3>
        <p className="text-xs text-stone-500 max-w-sm mx-auto mb-4">
          Upload PDF research papers to analyze, extract insights, and query using our connected RAG engine.
        </p>
        <div className="flex items-center justify-center gap-2.5">
          {onUploadClick && (
            <button
              onClick={onUploadClick}
              className="inline-flex items-center px-3 py-1.5 bg-stone-900 text-stone-50 text-xs font-medium rounded-md hover:bg-stone-800 transition-colors shadow-2xs"
            >
              + Upload document
            </button>
          )}
          {onSeedClick && (
            <button
              onClick={onSeedClick}
              className="inline-flex items-center px-3 py-1.5 bg-stone-100 border border-stone-200 text-stone-800 text-xs font-medium rounded-md hover:bg-stone-200 transition-colors shadow-2xs"
            >
              ✨ Load Sample Research Papers
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-stone-200/80 overflow-hidden shadow-2xs">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-stone-200 bg-stone-50/75 text-[11px] font-medium text-stone-500 tracking-wider font-mono uppercase">
              <th className="py-2.5 px-4">Document Name</th>
              <th className="py-2.5 px-4">Status</th>
              <th className="py-2.5 px-4">Size</th>
              <th className="py-2.5 px-4">Pages</th>
              <th className="py-2.5 px-4">Uploaded</th>
              <th className="py-2.5 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {documents.map((doc) => (
              <DocumentRow key={doc.id} document={doc} onDelete={onDelete} />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
