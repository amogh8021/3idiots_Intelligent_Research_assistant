import React, { useEffect, useState } from 'react';
import { Header } from '../components/layout/Header';
import { PageContainer } from '../components/layout/PageContainer';
import { researchService } from '../services/researchService';
import { ResearchHistoryItem } from '../types';
import { SourceCard } from '../components/research/SourceCard';
import {
  History,
  Clock,
  ChevronRight,
  HelpCircle,
  Copy,
  Check,
  X,
  BookOpen,
} from 'lucide-react';

export const HistoryPage: React.FC = () => {
  const [history, setHistory] = useState<ResearchHistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState<ResearchHistoryItem | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    researchService
      .getHistory()
      .then(setHistory)
      .catch(console.error)
      .finally(() => setIsLoading(false));
  }, []);

  const formatDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateStr;
    }
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex-1 flex flex-col min-w-0 bg-canvas">
      <Header
        title="Inquiry History"
        subtitle="Chronological log of past research queries and generated answers"
      />

      <PageContainer className="space-y-4">
        {isLoading ? (
          <div className="bg-white rounded-lg border border-stone-200/80 p-8 text-center text-xs text-stone-500">
            <div className="inline-block w-5 h-5 border-2 border-stone-300 border-t-stone-800 rounded-full animate-spin mb-2"></div>
            <div>Loading research history...</div>
          </div>
        ) : history.length === 0 ? (
          <div className="bg-white rounded-lg border border-stone-200/80 p-12 text-center shadow-2xs">
            <div className="w-10 h-10 rounded-full bg-stone-100 text-stone-400 mx-auto flex items-center justify-center mb-3">
              <History className="w-5 h-5" />
            </div>
            <h3 className="text-xs font-semibold text-stone-900 mb-1">No Past Research Queries</h3>
            <p className="text-xs text-stone-500 max-w-sm mx-auto">
              Questions you ask in the Research workspace will be automatically logged here with their synthesized answers and citation records.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {history.map((item) => (
              <div
                key={item.questionId}
                onClick={() => setSelectedItem(item)}
                className="bg-white rounded-lg border border-stone-200/80 p-4 hover:border-stone-400 cursor-pointer transition-all shadow-2xs flex items-center justify-between gap-4"
              >
                <div className="min-w-0 flex-1 space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-stone-900 truncate">
                      {item.question}
                    </span>
                  </div>

                  <p className="text-xs text-stone-500 line-clamp-1">
                    {item.answer || 'No answer recorded'}
                  </p>

                  <div className="flex items-center gap-3 text-[11px] text-stone-400 font-mono pt-1">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3 text-stone-400" />
                      {formatDate(item.createdAt)}
                    </span>
                  </div>
                </div>

                <div className="text-stone-400 hover:text-stone-700 shrink-0">
                  <ChevronRight className="w-4 h-4" />
                </div>
              </div>
            ))}
          </div>
        )}
      </PageContainer>

      {/* Full Answer Modal */}
      {selectedItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-lg border border-stone-200 shadow-xl max-w-2xl w-full max-h-[85vh] flex flex-col overflow-hidden">
            {/* Header */}
            <div className="px-5 py-4 border-b border-stone-100 flex items-start justify-between gap-3">
              <div className="space-y-1 min-w-0">
                <div className="flex items-center gap-2 text-[11px] text-stone-500 font-mono">
                  <span>Logged inquiry</span>
                  <span>•</span>
                  <span>{formatDate(selectedItem.createdAt)}</span>
                </div>
                <h3 className="text-sm font-semibold text-stone-900">
                  {selectedItem.question}
                </h3>
              </div>

              <button
                onClick={() => setSelectedItem(null)}
                className="text-stone-400 hover:text-stone-600 p-1 rounded hover:bg-stone-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Content */}
            <div className="p-5 overflow-y-auto space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-stone-900">Synthesized Answer</span>
                <button
                  onClick={() => handleCopy(selectedItem.answer)}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-medium text-stone-600 hover:text-stone-900 hover:bg-stone-100 transition-colors border border-stone-200"
                >
                  {copied ? (
                    <>
                      <Check className="w-3 h-3 text-emerald-600" />
                      <span className="text-emerald-700 text-[11px]">Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3 text-stone-500" />
                      <span className="text-[11px]">Copy answer</span>
                    </>
                  )}
                </button>
              </div>

              <div className="text-xs text-stone-800 leading-relaxed whitespace-pre-wrap bg-stone-50/70 p-4 rounded-md border border-stone-200/60 font-sans">
                {selectedItem.answer}
              </div>

              {selectedItem.sources && selectedItem.sources.length > 0 && (
                <div className="space-y-2 pt-2">
                  <h4 className="text-xs font-semibold text-stone-800 uppercase tracking-wider font-mono">
                    Referenced Sources
                  </h4>
                  <div className="space-y-2">
                    {selectedItem.sources.map((s, idx) => (
                      <SourceCard key={idx} source={s} index={idx} />
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-5 py-3 bg-stone-50 border-t border-stone-100 flex justify-end">
              <button
                onClick={() => setSelectedItem(null)}
                className="px-3 py-1.5 rounded-md bg-stone-900 text-stone-50 text-xs font-medium hover:bg-stone-800 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
