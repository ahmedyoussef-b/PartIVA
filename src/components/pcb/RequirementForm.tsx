'use client';

import { useState } from 'react';
import { requirementBlocks } from '@/lib/pcb/requirement-blocks';
import { detectIncoherences } from '@/lib/pcb/incoherence-detector';
import type { RequirementAnswer } from '@/lib/pcb/types';

export function RequirementForm({ projectId }: { projectId?: string }) {
  const [answers, setAnswers] = useState<RequirementAnswer[]>([]);
  const [currentBlock, setCurrentBlock] = useState(0);
  const [incoherences, setIncoherences] = useState<string[]>([]);

  const block = requirementBlocks[currentBlock];
  if (!block) return null;
  const isLastBlock = currentBlock === requirementBlocks.length - 1;

  function handleAnswer(questionId: string, answer: string) {
    setAnswers((prev) => {
      const next = prev.filter((a) => a.questionId !== questionId);
      next.push({ blockId: block!.id, questionId, answer, status: 'proposed' });
      setIncoherences(detectIncoherences(next));
      return next;
    });
  }

  function nextBlock() {
    if (isLastBlock) return;
    setCurrentBlock((b) => b + 1);
  }

  function prevBlock() {
    if (currentBlock === 0) return;
    setCurrentBlock((b) => b - 1);
  }

  return (
    <div className="mx-auto max-w-3xl p-6">
      <div className="mb-6">
        <div className="flex gap-2">
          {requirementBlocks.map((b, i) => (
            <div
              key={b.id}
              className={`h-2 flex-1 rounded ${i <= currentBlock ? 'bg-blue-600' : 'bg-gray-200'}`}
            />
          ))}
        </div>
        <p className="mt-2 text-sm text-gray-500">
          Bloc {currentBlock + 1} / {requirementBlocks.length}
        </p>
      </div>

      <h2 className="text-2xl font-bold" data-testid="block-title">
        {block.title}
      </h2>
      <p className="mb-6 text-gray-600">{block.description}</p>

      <div className="space-y-4">
        {block.questions.map((q) => (
          <div key={q.id}>
            <label className="block text-sm font-medium">
              {q.label} {q.required && <span className="text-red-500">*</span>}
            </label>
            {q.type === 'select' && (
              <select
                data-testid={`select-${q.id}`}
                className="mt-1 w-full rounded border p-2"
                onChange={(e) => handleAnswer(q.id, e.target.value)}
              >
                <option value="">Sélectionner...</option>
                {q.options?.map((o) => (
                  <option key={o} value={o}>
                    {o}
                  </option>
                ))}
              </select>
            )}
            {q.type === 'text' && (
              <input
                data-testid={`input-${q.id}`}
                type="text"
                className="mt-1 w-full rounded border p-2"
                onChange={(e) => handleAnswer(q.id, e.target.value)}
              />
            )}
            {q.type === 'number' && (
              <input
                type="number"
                className="mt-1 w-full rounded border p-2"
                onChange={(e) => handleAnswer(q.id, e.target.value)}
              />
            )}
            {q.type === 'checkbox' && (
              <input
                type="checkbox"
                className="mt-1"
                onChange={(e) => handleAnswer(q.id, e.target.checked ? 'oui' : 'non')}
              />
            )}
          </div>
        ))}
      </div>

      {incoherences.length > 0 && (
        <div className="mt-6 rounded border border-amber-300 bg-amber-50 p-3">
          <p className="font-semibold text-amber-800">Incohérences détectées :</p>
          <ul className="mt-1 list-disc pl-5 text-sm text-amber-700">
            {incoherences.map((inc, i) => (
              <li key={i}>{inc}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="mt-8 flex justify-between">
        <button
          type="button"
          onClick={prevBlock}
          disabled={currentBlock === 0}
          className="rounded border px-4 py-2 disabled:opacity-50"
        >
          Précédent
        </button>
        {isLastBlock ? (
          <button
            type="button"
            className="rounded bg-blue-600 px-4 py-2 text-white"
            onClick={() => {
              // TODO 7-c : sauvegarder en BDD + lancer Requirement Engine
              console.log('Valider le cahier des charges', { answers, projectId });
            }}
          >
            Valider le cahier des charges
          </button>
        ) : (
          <button
            type="button"
            onClick={nextBlock}
            className="rounded bg-blue-600 px-4 py-2 text-white"
          >
            Suivant
          </button>
        )}
      </div>
    </div>
  );
}
