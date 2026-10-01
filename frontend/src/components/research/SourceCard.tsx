import React from 'react';
import { Source } from '../../types';
import { FileText, ExternalLink, Bookmark } from 'lucide-react';

interface Props {
  source: Source;
  index: number;
}

export const SourceCard: React.FC<Props> = ({ source, index }) => {
  return (
    <div className="bg-white rounded-md border border-stone-200/90 p-3 hover:border-stone-300 transition-colors shadow-2xs">
      <div className="flex items-center justify-between gap-2 mb-1.5">
        <div className="flex items-center gap-1.5 min-w-0">
          <div className="w-5 h-5 rounded bg-stone-100 text-stone-700 flex items-center justify-center shrink-0">
            <Bookmark className="w-3 h-3 text-stone-600" />
          </div>
          <span className="text-xs font-semibold text-stone-800 truncate" title={source.fileName}>
            {source.fileName}
          </span>
          <span className="text-stone-300">•</span>
          <span className="text-[11px] font-mono text-stone-500 shrink-0">
            Page {source.page || 1}
          </span>
        </div>

        <span className="text-[10px] font-mono text-stone-400 bg-stone-50 px-1.5 py-0.5 rounded border border-stone-100">
          [{index + 1}]
        </span>
      </div>

      <p className="text-xs text-stone-600 font-serif italic border-l-2 border-stone-300 pl-2.5 py-0.5 my-1 leading-relaxed bg-stone-50/50 rounded-r">
        "{source.snippet}"
      </p>
    </div>
  );
};
