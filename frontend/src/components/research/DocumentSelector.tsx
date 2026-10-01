import React, { useState } from 'react';
import { Document } from '../../types';
import { Search, CheckSquare, Square, FileText, Check } from 'lucide-react';

interface Props {
  documents: Document[];
  selectedIds: string[];
  onToggle: (id: string) => void;
  onSelectAll: () => void;
  onDeselectAll: () => void;
}

export const DocumentSelector: React.FC<Props> = ({
  documents,
  selectedIds,
  onToggle,
  onSelectAll,
  onDeselectAll,
}) => {
  const [search, setSearch] = useState('');

  const readyDocuments = documents.filter((d) => d.status === 'READY');
  const filtered = readyDocuments.filter((d) =>
    d.fileName.toLowerCase().includes(search.toLowerCase())
  );

  const allSelected = filtered.length > 0 && filtered.every((d) => selectedIds.includes(d.id));

  return (
    <div className="bg-white rounded-lg border border-stone-200/80 flex flex-col h-full overflow-hidden shadow-2xs">
      {/* Header */}
      <div className="p-3.5 border-b border-stone-200/70 bg-stone-50/50">
        <div className="flex items-center justify-between mb-2">
          <div className="text-xs font-semibold text-stone-900 flex items-center gap-1.5">
            <span>Context Documents</span>
            <span className="px-1.5 py-0.5 rounded-full bg-stone-200/80 text-stone-700 text-[10px] font-mono">
              {selectedIds.length} selected
            </span>
          </div>

          <button
            onClick={allSelected ? onDeselectAll : onSelectAll}
            className="text-[11px] text-stone-600 hover:text-stone-900 font-medium underline underline-offset-2"
          >
            {allSelected ? 'Clear all' : 'Select all'}
          </button>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-stone-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Filter documents..."
            className="w-full pl-8 pr-3 py-1.5 text-xs bg-white border border-stone-200 rounded-md placeholder-stone-400 focus:outline-none focus:ring-1 focus:ring-stone-400"
          />
        </div>
      </div>

      {/* Document List */}
      <div className="flex-1 overflow-y-auto divide-y divide-stone-100 p-1">
        {filtered.length === 0 ? (
          <div className="p-6 text-center text-xs text-stone-400">
            {readyDocuments.length === 0
              ? 'No ready documents. Please upload documents first.'
              : 'No matching documents.'}
          </div>
        ) : (
          filtered.map((doc) => {
            const isSelected = selectedIds.includes(doc.id);
            return (
              <div
                key={doc.id}
                onClick={() => onToggle(doc.id)}
                className={`flex items-start gap-2.5 p-2.5 rounded-md cursor-pointer transition-colors text-xs ${
                  isSelected
                    ? 'bg-stone-100/90 text-stone-900 font-medium'
                    : 'hover:bg-stone-50 text-stone-700'
                }`}
              >
                <div className="mt-0.5 shrink-0">
                  <div
                    className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${
                      isSelected
                        ? 'bg-stone-900 border-stone-900 text-stone-100'
                        : 'border-stone-300 bg-white'
                    }`}
                  >
                    {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                  </div>
                </div>

                <div className="min-w-0 flex-1">
                  <div className="truncate text-xs" title={doc.fileName}>
                    {doc.fileName}
                  </div>
                  <div className="text-[10px] text-stone-400 font-mono flex items-center gap-1.5 mt-0.5">
                    <span>{doc.pageCount ? `${doc.pageCount} p.` : 'PDF'}</span>
                    <span>•</span>
                    <span>{(doc.fileSize / (1024 * 1024)).toFixed(1)} MB</span>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Footer Info */}
      <div className="p-2.5 bg-stone-50 border-t border-stone-200/70 text-[11px] text-stone-500 flex items-center justify-between">
        <span>Ready: {readyDocuments.length}</span>
        <span className="text-stone-400">Only ready docs are queryable</span>
      </div>
    </div>
  );
};
