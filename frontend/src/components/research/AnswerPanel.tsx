import React, { useState } from 'react';
import { AskQuestionResponse } from '../../types';
import { SourceCard } from './SourceCard';
import { ResearchLoadingState } from './ResearchLoadingState';
import { Copy, Check, Clock, BookOpen, AlertCircle } from 'lucide-react';

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
      <div className="bg-red-50/70 rounded-lg border border-red-200/80 p-6 text-center space-y-2">
        <AlertCircle className="w-8 h-8 text-red-500 mx-auto" />
        <h3 className="text-xs font-semibold text-red-800">Research Query Failed</h3>
        <p className="text-xs text-red-600 max-w-md mx-auto">{error}</p>
      </div>
    );
  }

  if (!response) {
    return (
      <div className="bg-white rounded-lg border border-stone-200/80 p-12 text-center shadow-2xs">
        <div className="w-10 h-10 rounded-full bg-stone-100 text-stone-400 mx-auto flex items-center justify-center mb-3">
          <BookOpen className="w-5 h-5 text-stone-500" />
        </div>
        <h3 className="text-xs font-semibold text-stone-800 mb-1">
          No Query Executed Yet
        </h3>
        <p className="text-xs text-stone-500 max-w-sm mx-auto">
          Select one or more research documents on the left and enter your question above to generate synthesized answers with page citations.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Answer Box */}
      <div className="bg-white rounded-lg border border-stone-200/80 p-5 shadow-2xs">
        <div className="flex items-center justify-between border-b border-stone-100 pb-3 mb-4">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-stone-900">Synthesized Findings</span>
            <span className="text-stone-300">•</span>
            <div className="flex items-center gap-1 text-[11px] text-stone-500">
              <Clock className="w-3 h-3 text-stone-400" />
              <span>Just now</span>
            </div>
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
                <span className="text-[11px]">Copy markdown</span>
              </>
            )}
          </button>
        </div>

        {/* Question Recap */}
        {question && (
          <div className="mb-3 p-2.5 bg-stone-50 rounded border border-stone-200/60 text-xs font-medium text-stone-800">
            <span className="text-stone-400 mr-1.5 font-mono">Q:</span>
            {question}
          </div>
        )}

        {/* Answer Content */}
        <div className="text-xs text-stone-800 leading-relaxed space-y-2 whitespace-pre-wrap font-sans">
          {response.answer}
        </div>
      </div>

      {/* Sources / Citations Panel */}
      {response.sources && response.sources.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between px-1">
            <h4 className="text-xs font-semibold text-stone-800 uppercase tracking-wider font-mono">
              Cited Evidence & Snippets ({response.sources.length})
            </h4>
            <span className="text-[11px] text-stone-500">Extracted from research corpus</span>
          </div>

          <div className="grid grid-cols-1 gap-2">
            {response.sources.map((source, idx) => (
              <SourceCard key={idx} source={source} index={idx} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
