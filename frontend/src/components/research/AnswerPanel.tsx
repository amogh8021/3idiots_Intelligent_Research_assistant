import React, { useState } from 'react';
import { AskQuestionResponse } from '../../types';
import { SourceCard } from './SourceCard';
import { ResearchLoadingState } from './ResearchLoadingState';
import { Copy, Check, BookOpen, AlertCircle, FileText } from 'lucide-react';

interface Props {
  response: AskQuestionResponse | null;
  isLoading: boolean;
  error: string | null;
  question: string;
}

export const AnswerPanel: React.FC<Props> = ({
  response,
  isLoading,
  error,
  question,
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    if (!response?.answer) return;
    navigator.clipboard.writeText(response.answer);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (isLoading) {
    return <ResearchLoadingState />;
  }

  if (error) {
    return (
      <div className="bg-red-50/70 rounded-lg border border-red-200/80 p-5 flex items-start gap-3">
        <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <h3 className="text-xs font-semibold text-red-800">Query Failed</h3>
          <p className="text-xs text-red-600 leading-relaxed">{error}</p>
        </div>
      </div>
    );
  }

  if (!response) {
    return (
      <div className="bg-white rounded-lg border border-stone-200/80 p-10 text-center shadow-2xs">
        <div className="w-9 h-9 rounded-full bg-stone-100 mx-auto flex items-center justify-center mb-3">
          <BookOpen className="w-4 h-4 text-stone-400" />
        </div>
        <h3 className="text-xs font-semibold text-stone-800 mb-1">
          Awaiting Query
        </h3>
        <p className="text-xs text-stone-500 max-w-xs mx-auto leading-relaxed">
          Select one or more documents on the left, then enter a research question to generate a grounded answer with source citations.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Answer Box */}
      <div className="bg-white rounded-lg border border-stone-200/80 shadow-2xs overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-stone-100 bg-stone-50/50">
          <div className="flex items-center gap-2">
            <FileText className="w-3.5 h-3.5 text-stone-500" />
            <span className="text-xs font-semibold text-stone-900">Synthesized Findings</span>
          </div>
          <button
            onClick={handleCopy}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-medium text-stone-600 hover:text-stone-900 hover:bg-stone-100 transition-colors border border-stone-200"
            title="Copy answer to clipboard"
          >
            {copied ? (
              <>
                <Check className="w-3 h-3 text-emerald-600" />
                <span className="text-emerald-700 text-[11px]">Copied</span>
              </>
            ) : (
              <>
                <Copy className="w-3 h-3 text-stone-500" />
                <span className="text-[11px]">Copy</span>
              </>
            )}
          </button>
        </div>

        <div className="p-4 space-y-3">
          {/* Question Recap */}
          {question && (
            <div className="p-2.5 bg-stone-50 rounded border border-stone-200/60 text-xs text-stone-700 leading-relaxed">
              <span className="text-stone-400 font-mono mr-1.5">Q:</span>
              <span className="font-medium">{question}</span>
            </div>
          )}

          {/* Answer Content */}
          <div className="text-xs text-stone-800 leading-relaxed whitespace-pre-wrap font-sans">
            {response.answer}
          </div>
        </div>
      </div>

      {/* Sources / Citations Panel */}
      {response.sources && response.sources.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between px-0.5">
            <h4 className="text-[11px] font-semibold text-stone-700 uppercase tracking-wider font-mono">
              Source Evidence ({response.sources.length})
            </h4>
            <span className="text-[11px] text-stone-400">page-level citations</span>
          </div>

          <div className="space-y-2">
            {response.sources.map((source, idx) => (
              <SourceCard key={idx} source={source} index={idx} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
