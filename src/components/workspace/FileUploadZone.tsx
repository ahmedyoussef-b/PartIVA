'use client';

import { useRef, useState } from 'react';
import { UploadCloud } from 'lucide-react';

interface FileUploadZoneProps {
  accept: string;
  onFiles: (files: FileList) => void;
  label?: string;
  hint?: string;
}

export function FileUploadZone({ accept, onFiles, label, hint }: FileUploadZoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => inputRef.current?.click()}
      onDragOver={(e) => {
        e.preventDefault();
        setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragging(false);
        if (e.dataTransfer.files?.length) onFiles(e.dataTransfer.files);
      }}
      className={`flex h-28 cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed p-4 text-center text-sm transition-colors ${
        dragging
          ? 'border-blue-500 bg-blue-50 text-blue-700'
          : 'border-gray-300 text-gray-500 hover:border-blue-400 hover:bg-gray-50'
      }`}
    >
      <input
        ref={inputRef}
        type="file"
        multiple
        accept={accept}
        onChange={(e) => {
          if (e.target.files?.length) onFiles(e.target.files);
          e.target.value = '';
        }}
        className="hidden"
      />
      <UploadCloud className="h-8 w-8" />
      <span>{label ?? 'Déposez vos fichiers ici ou cliquez pour parcourir'}</span>
      {hint && <span className="text-xs text-gray-400">{hint}</span>}
    </div>
  );
}
