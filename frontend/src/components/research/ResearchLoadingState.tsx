import React from 'react';
import { Loader2, Sparkles, BookOpen } from 'lucide-react';

export const ResearchLoadingState: React.FC = () => {
  return (
    <div className="bg-white rounded-lg border border-stone-200/80 p-8 text-center shadow-2xs space-y-4">
      <div className="w-10 h-10 rounded-full bg-stone-100 text-stone-800 mx-auto flex items-center justify-center animate-pulse">
        <BookOpen className="w-5 h-5 text-stone-700" />
      </div>

      <div className="space-y-1">
        <h3 className="text-xs font-semibold text-stone-900 flex items-center justify-center gap-1.5">
          <Loader2 className="w-3.5 h-3.5 animate-spin text-stone-600" />
          Querying Research Intelligence Engine
        </h3>
        <p className="text-[11px] text-stone-500 max-w-sm mx-auto">
          Searching indexed document chunks, comparing findings across selected literature, and extracting verified citations...
        </p>
      </div>

      <div className="max-w-xs mx-auto space-y-2 pt-2">
        <div className="h-2 bg-stone-100 rounded-full overflow-hidden">
          <div className="h-full bg-stone-700 rounded-full animate-[pulse_1.5s_ease-in-out_infinite] w-2/3"></div>
        </div>
        <div className="text-[10px] font-mono text-stone-400">
          Synthesizing cross-document evidence
        </div>
      </div>
    </div>
  );
};
