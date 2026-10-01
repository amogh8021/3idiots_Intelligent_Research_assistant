import React, { useState } from 'react';
import { Document } from '../../types';
import { DocumentStatusBadge } from './DocumentStatusBadge';
import { FileText, Trash2, Loader2 } from 'lucide-react';

interface Props {
  document: Document;
  onDelete: (id: string) => Promise<void>;
}

export const DocumentRow: React.FC<Props> = ({ document, onDelete }) => {
  const [isDeleting, setIsDeleting] = useState(false);

  const formatBytes = (bytes: number) => {
    if (!bytes || bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
  };

  const formatDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  const handleDelete = async () => {
    if (window.confirm(`Delete "${document.fileName}"? This cannot be undone.`)) {
      try {
        setIsDeleting(true);
        await onDelete(document.id);
      } finally {
        setIsDeleting(false);
      }
    }
  };

  return (
    <tr className="hover:bg-stone-50/80 transition-colors border-b border-stone-200/60 last:border-0 text-xs">
      <td className="py-3 px-4">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded bg-red-50 text-red-700 border border-red-200/60 flex items-center justify-center shrink-0">
            <FileText className="w-3.5 h-3.5" />
          </div>
          <div className="font-medium text-stone-900 truncate max-w-md" title={document.fileName}>
            {document.fileName}
          </div>
        </div>
      </td>

      <td className="py-3 px-4">
        <DocumentStatusBadge status={document.status} />
      </td>

      <td className="py-3 px-4 text-stone-600 font-mono text-[11px]">
        {formatBytes(document.fileSize)}
      </td>

      <td className="py-3 px-4 text-stone-600 text-[11px]">
        {document.pageCount ? `${document.pageCount} ${document.pageCount === 1 ? 'page' : 'pages'}` : '—'}
      </td>

      <td className="py-3 px-4 text-stone-500 text-[11px]">
        {formatDate(document.uploadedAt)}
      </td>

      <td className="py-3 px-4 text-right">
        <button
          onClick={handleDelete}
          disabled={isDeleting}
          className="text-stone-400 hover:text-red-600 p-1 rounded hover:bg-stone-100 transition-colors disabled:opacity-50"
          title="Delete document"
          aria-label={`Delete ${document.fileName}`}
        >
          {isDeleting ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <Trash2 className="w-3.5 h-3.5" />
          )}
        </button>
      </td>
    </tr>
  );
};
