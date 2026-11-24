'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { requirementBlocks } from '@/lib/pcb/requirement-blocks';
import { detectIncoherences } from '@/lib/pcb/incoherence-detector';
import type { RequirementAnswer } from '@/lib/pcb/types';

export function RequirementForm({ projectId }: { projectId?: string }) {
  const router = useRouter();
  const [answers, setAnswers] = useState<RequirementAnswer[]>([]);
  const [currentBlock, setCurrentBlock] = useState(0);
  const [incoherences, setIncoherences] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [generalIdea, setGeneralIdea] = useState('');
  const [compiledText, setCompiledText] = useState('');
  const [compiling, setCompiling] = useState(false);
  const [validated, setValidated] = useState(false);
  const [dirty, setDirty] = useState(false);

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
        {!validated ? (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <label className="block text-sm font-medium">
                Idée générale de la carte <span className="text-red-500">*</span>
              </label>
              <textarea
                data-testid="textarea-general-idea"
                rows={6}
                className="mt-1 w-full rounded border p-2"
                placeholder="Ex : Carte de commande moteur pour convoyeur industriel, alimentée en 24 V, avec communication CAN..."
                value={generalIdea}
                onChange={(e) => setGeneralIdea(e.target.value)}
              />
              <p className="text-xs text-gray-500">
                Description libre du projet : fonction, contexte, contraintes majeures.
              </p>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium">
                Description technique compilée (IA)
              </label>
              <textarea
                data-testid="textarea-compiled"
                rows={6}
                className="mt-1 w-full rounded border p-2"
                placeholder="Cliquez sur « Compiler » pour générer la description technique structurée..."
                value={compiledText}
                onChange={(e) => setCompiledText(e.target.value)}
              />
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  data-testid="btn-compile"
                  disabled={compiling || !generalIdea.trim()}
                  className="rounded bg-blue-600 px-3 py-1.5 text-sm text-white disabled:opacity-50"
                  onClick={async () => {
                    if (compiling) return;
                    setCompiling(true);
                    setError(null);
                    try {
                      const res = await fetch('/api/pcb/requirements/compile', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ description: generalIdea.trim() }),
                      });
                      const data = await res.json();
                      if (!res.ok || data.error) {
                        throw new Error(data.error || `Erreur ${res.status}`);
                      }
                      setCompiledText(data.compiled || '');
                      if (Array.isArray(data.answers)) {
                        setAnswers((prev) => {
                          const next = prev.filter(
                            (a) =>
                              !data.answers.some(
                                (na: { questionId: string }) => na.questionId === a.questionId,
                              ),
                          );
                          next.push(...data.answers);
                          setIncoherences(detectIncoherences(next));
                          return next;
                        });
                      }
                    } catch (e) {
                      setError(e instanceof Error ? e.message : 'Erreur de compilation');
                    } finally {
                      setCompiling(false);
                    }
                  }}
                >
                  {compiling ? 'Compilation...' : compiledText ? 'Relancer' : 'Compiler'}
                </button>
                {compiledText && (
                  <button
                    type="button"
                    data-testid="btn-validate"
                    disabled={compiling}
                    className="rounded bg-green-600 px-3 py-1.5 text-sm text-white disabled:opacity-50"
                    onClick={() => {
                      if (!compiledText.trim()) return;
                      setValidated(true);
                      setDirty(false);
                      setError(null);
                    }}
                  >
                    Valider
                  </button>
                )}
              </div>
              <p className="text-xs text-gray-500">
                Généré par IA à partir de l&apos;idée générale. Modifiable avant validation.
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            <label className="block text-sm font-medium">
              Contexte validé <span className="text-green-600">✓</span>
            </label>
            <textarea
              data-testid="textarea-validated"
              rows={6}
              className="mt-1 w-full rounded border border-green-300 bg-green-50 p-2"
              value={compiledText}
              onChange={(e) => {
                setCompiledText(e.target.value);
                setDirty(true);
              }}
            />
            <div className="flex flex-wrap gap-2">
              {dirty && (
                <button
                  type="button"
                  data-testid="btn-revalidate"
                  className="rounded bg-green-600 px-3 py-1.5 text-sm text-white"
                  onClick={() => setDirty(false)}
                >
                  Valider les modifications
                </button>
              )}
              <button
                type="button"
                data-testid="btn-edit"
                className="rounded border px-3 py-1.5 text-sm"
                onClick={() => {
                  setValidated(false);
                  setDirty(false);
                }}
              >
                Modifier
              </button>
              {!dirty && (
                <span className="self-center text-xs text-green-700">
                  ✓ Phase pré-implantation validée
                </span>
              )}
              {dirty && (
                <span className="self-center text-xs text-amber-700">
                  Modifications non validées
                </span>
              )}
            </div>
            <p className="text-xs text-gray-500">
              Contexte technique validé. Les réponses du formulaire ont été pré-remplies.
            </p>
          </div>
        )}
      </div>

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

      {error && (
        <div className="mt-4 rounded border border-red-300 bg-red-50 p-3 text-sm text-red-700">
          {error}
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
            className="rounded bg-blue-600 px-4 py-2 text-white disabled:opacity-50"
            disabled={submitting}
            onClick={async () => {
              if (submitting) return;
              const contextText = validated ? compiledText.trim() : generalIdea.trim();
              if (!contextText) {
                setError("L'idée générale de la carte est obligatoire.");
                return;
              }
              setSubmitting(true);
              setError(null);
              try {
                const res = await fetch('/api/pcb/requirements/parse', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    projectId,
                    answers,
                    description: contextText,
                    status: validated && !dirty ? 'requirements_validated' : 'draft',
                  }),
                });
                const data = await res.json();
                if (!res.ok || data.error) {
                  throw new Error(data.error || `Erreur ${res.status}`);
                }
                if (data.projectId) {
                  router.push(`/admin/pcb/${data.projectId}`);
                } else {
                  setError('Projet créé mais projectId manquant');
                }
              } catch (e) {
                setError(e instanceof Error ? e.message : 'Erreur');
              } finally {
                setSubmitting(false);
              }
            }}
          >
            {submitting ? 'Validation...' : 'Valider le cahier des charges'}
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
