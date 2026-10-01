import React, { KeyboardEvent } from 'react';
import { Send, CornerDownLeft, Loader2 } from 'lucide-react';

interface Props {
  question: string;
  onChange: (q: string) => void;
  onSubmit: () => void;
  isLoading: boolean;
  selectedDocsCount: number;
}

export const QuestionInput: React.FC<Props> = ({
  question,
  onChange,
  onSubmit,
  isLoading,
  selectedDocsCount,
}) => {
  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      if (canSubmit) {
        onSubmit();
      }
    }
  };

  const canSubmit = question.trim().length > 0 && selectedDocsCount > 0 && !isLoading;

  return (
    <div className="bg-white rounded-lg border border-stone-200/80 p-3 shadow-2xs">
      <textarea
        value={question}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={
          selectedDocsCount === 0
            ? 'Select at least one document from the left panel to begin asking questions...'
            : 'Ask a question about your selected research (e.g. "What are the major findings and limitations?")...'
        }
        rows={3}
        disabled={isLoading}
        className="w-full text-xs text-stone-900 placeholder-stone-400 border-0 resize-none focus:outline-none focus:ring-0 leading-relaxed bg-transparent"
      />

      <div className="mt-2 pt-2 border-t border-stone-100 flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-[11px] text-stone-400">
          <kbd className="px-1.5 py-0.5 rounded bg-stone-100 border border-stone-200 font-mono text-[10px] text-stone-500">
            Ctrl
          </kbd>
          <span>+</span>
          <kbd className="px-1.5 py-0.5 rounded bg-stone-100 border border-stone-200 font-mono text-[10px] text-stone-500">
            Enter
          </kbd>
          <span className="hidden sm:inline">to submit query</span>
        </div>

        <button
          onClick={onSubmit}
          disabled={!canSubmit}
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-md bg-stone-900 text-stone-50 text-xs font-medium hover:bg-stone-800 transition-colors disabled:opacity-40 disabled:cursor-not-allowed shadow-2xs"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              <span>Analyzing...</span>
            </>
          ) : (
            <>
              <span>Ask ResearchDesk</span>
              <CornerDownLeft className="w-3 h-3 text-stone-400" />
            </>
          )}
        </button>
      </div>
    </div>
  );
};
