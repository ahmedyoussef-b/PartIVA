import React from 'react';
import { Lightbulb } from 'lucide-react';
import type { Suggestion } from '@/lib/ai/suggestions';

interface SuggestionListProps {
  suggestions: Suggestion[];
}

export function SuggestionList({ suggestions }: SuggestionListProps) {
  if (!suggestions.length) return null;
  return (
    <div className="mb-2 space-y-2">
      {suggestions.map((s) => (
        <div
          key={s.id}
          className={`flex items-start gap-2 rounded border-l-4 bg-gray-50 p-2 text-sm ${
            s.type === 'warning'
              ? 'border-yellow-400'
              : s.type === 'action'
                ? 'border-green-400'
                : 'border-blue-400'
          }`}
        >
          <Lightbulb className="mt-0.5 h-4 w-4 shrink-0 text-gray-500" />
          <span className="flex-1">{s.message}</span>
          {s.action && (
            <button
              type="button"
              onClick={s.action}
              className="text-xs text-blue-600 hover:underline"
            >
              Action
            </button>
          )}
        </div>
      ))}
    </div>
  );
}
