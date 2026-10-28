'use client';

import { useState, KeyboardEvent } from 'react';

interface ChatInputProps {
  onSend: (message: string) => void;
  disabled?: boolean;
  isStreaming?: boolean;
}

export function ChatInput({ onSend, disabled, isStreaming }: ChatInputProps) {
  const [value, setValue] = useState('');

  function handleSend() {
    const trimmed = value.trim();
    if (!trimmed || disabled || isStreaming) return;
    onSend(trimmed);
    setValue('');
  }

  function handleKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  return (
    <div className="border-t bg-white p-4">
      <div className="mx-auto flex max-w-4xl items-end gap-2">
        <textarea
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Posez votre question..."
          disabled={disabled || isStreaming}
          rows={1}
          className="flex-1 resize-none rounded-xl border px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none disabled:opacity-50"
          style={{ minHeight: '42px', maxHeight: '200px' }}
        />
        <button
          onClick={handleSend}
          disabled={!value.trim() || disabled || isStreaming}
          className="rounded-xl bg-blue-600 px-4 py-2 font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isStreaming ? '⏳' : 'Envoyer'}
        </button>
      </div>
      <div className="mt-2 text-center text-xs text-gray-400">
        Entrée pour envoyer • Maj+Entrée pour nouvelle ligne
      </div>
    </div>
  );
}
