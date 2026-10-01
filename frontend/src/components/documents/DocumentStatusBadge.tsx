import React from 'react';
import { DocumentStatus } from '../../types';
import { CheckCircle2, Clock, AlertCircle, Loader2 } from 'lucide-react';

interface Props {
  status: DocumentStatus;
  className?: string;
}

export const DocumentStatusBadge: React.FC<Props> = ({ status, className = '' }) => {
  switch (status) {
    case 'READY':
      return (
        <span
          className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-medium bg-emerald-50 text-emerald-800 border border-emerald-200/80 ${className}`}
        >
          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
          Ready
        </span>
      );
    case 'PROCESSING':
      return (
        <span
          className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-medium bg-amber-50 text-amber-800 border border-amber-200/80 ${className}`}
        >
          <Loader2 className="w-3 h-3 text-amber-600 animate-spin" />
          Processing
        </span>
      );
    case 'UPLOADING':
      return (
        <span
          className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-medium bg-sky-50 text-sky-800 border border-sky-200/80 ${className}`}
        >
          <Clock className="w-3 h-3 text-sky-600" />
          Uploading
        </span>
      );
    case 'FAILED':
      return (
        <span
          className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-medium bg-rose-50 text-rose-800 border border-rose-200/80 ${className}`}
        >
          <AlertCircle className="w-3 h-3 text-rose-600" />
          Failed
        </span>
      );
    default:
      return null;
  }
};
