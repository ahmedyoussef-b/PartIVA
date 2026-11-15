'use client';

interface ChatMessageItem {
  role: 'user' | 'assistant';
  content: string;
}

interface MessageListProps {
  messages: ChatMessageItem[];
}

export function MessageList({ messages }: MessageListProps) {
  return (
    <>
      {messages.map((m, i) => (
        <div key={i} className="mb-2 whitespace-pre-wrap">
          {m.content}
        </div>
      ))}
    </>
  );
}
