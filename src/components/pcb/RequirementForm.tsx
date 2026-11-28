'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { requirementBlocks } from '@/lib/pcb/requirement-blocks';
import { detectIncoherences } from '@/lib/pcb/incoherence-detector';
import { checkConstraintViolations } from '@/lib/pcb/negative-constraints';
import type { CompileConflict, CompileViolation, RequirementAnswer } from '@/lib/pcb/types';

export function RequirementForm({
  projectId,
  initialProjectName = '',
}: {
  projectId?: string;
  initialProjectName?: string;
}) {
  const router = useRouter();
  const [answers, setAnswers] = useState<RequirementAnswer[]>([]);
  const [currentBlock, setCurrentBlock] = useState(0);
  const [incoherences, setIncoherences] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [projectName, setProjectName] = useState(initialProjectName);
  const [generalIdea, setGeneralIdea] = useState('');
  const [compiledText, setCompiledText] = useState('');
  // Première version générée par « Compiler » : conservée même si l'utilisateur
  // relance la compilation ou modifie le texte avant de valider.
  const [firstCompiledText, setFirstCompiledText] = useState('');
  const [compiling, setCompiling] = useState(false);
  const [validated, setValidated] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [constraints, setConstraints] = useState<string[]>([]);
  const [conflicts, setConflicts] = useState<CompileConflict[]>([]);

  // Même helper pur que le serveur, recalculé au rendu : aucune copie locale
  // ne peut rester obsolète après une édition du texte ou des réponses.
  const violations = checkConstraintViolations({ compiled: compiledText, answers, constraints });
  const needsReview = violations.length > 0 || conflicts.length > 0;

  function focusIssue(message: string, questionId?: string) {
    setError(message);
    if (!questionId) return;
    const bi = requirementBlocks.findIndex((b) => b.questions.some((q) => q.id === questionId));
    if (bi >= 0) setCurrentBlock(bi);
    requestAnimationFrame(() => {
      const el = document.querySelector<HTMLElement>(
        `[data-field-id="field-${questionId}"], [data-testid="field-${questionId}"]`,
      );
      el?.focus();
      el?.scrollIntoView({ block: 'center' });
    });
  }

  function unresolvedIssue(): { message: string; questionId?: string } | null {
    const pending = answers.find((a) => a.status === 'missing' || a.status === 'to_verify');
    if (pending) {
      const label = pending.status === 'missing' ? 'À préciser' : 'À vérifier';
      return {
        message: `${label} : ${pending.questionId}. Renseignez ce champ avant de valider.`,
        questionId: pending.questionId,
      };
    }
    if (violations.length > 0) {
      return {
        message: violations[0]!.message,
        questionId: violations[0]!.questionId || undefined,
      };
    }
    if (conflicts.length > 0) {
      const c = conflicts[0]!;
      return {
        message: `Conflit à arbitrer : ${c.need} — « ${c.forbidden} » est exclu.`,
        questionId: c.questionId,
      };
    }
    return null;
  }

  const block = requirementBlocks[currentBlock];
  if (!block) return null;
  const isLastBlock = currentBlock === requirementBlocks.length - 1;

  function handleAnswer(questionId: string, answer: string) {
    // Un message de champ manquant devient faux dès que l'utilisateur corrige
    // une réponse : on l'efface immédiatement (pas seulement au prochain clic).
    setError(null);
    setAnswers((prev) => {
      const next = prev.filter((a) => a.questionId !== questionId);
      next.push({ blockId: block!.id, questionId, answer, status: 'proposed' });
      setIncoherences(detectIncoherences(next));
      return next;
    });
  }

  function answerFor(questionId: string): string {
    return answers.find((a) => a.questionId === questionId)?.answer ?? '';
  }

  function toggleMulti(questionId: string, option: string, current: string) {
    const values = current
      .split(',')
      .map((v) => v.trim())
      .filter(Boolean);
    const next = values.includes(option) ? values.filter((v) => v !== option) : [...values, option];
    handleAnswer(questionId, next.join(', '));
  }

  // Validation du contexte compilé : focus sur le premier champ requis manquant,
  // sinon création du projet et redirection vers l'analyse automatique du CDC.
  async function submitValidated() {
    const contextText = compiledText.trim();
    if (!projectName.trim()) {
      setError('Le nom du projet est obligatoire.');
      return;
    }
    if (!contextText) {
      setError('La description technique compilée est obligatoire.');
      return;
    }
    const missing = requirementBlocks.flatMap((b, bi) =>
      b.questions.filter((q) => q.required && !answerFor(q.id).trim()).map((q) => ({ q, bi })),
    );
    if (missing.length > 0) {
      const first = missing[0]!;
      setCurrentBlock(first.bi);
      setError(`Champ requis manquant : ${first.q.label}`);
      requestAnimationFrame(() => {
        const el = document.querySelector<HTMLElement>(
          `[data-field-id="field-${first.q.id}"], [data-testid="field-${first.q.id}"]`,
        );
        el?.focus();
        el?.scrollIntoView({ block: 'center' });
      });
      return;
    }
    const issue = unresolvedIssue();
    if (issue) {
      focusIssue(issue.message, issue.questionId);
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
          initialDescription: firstCompiledText || contextText,
          projectName: projectName.trim(),
          status: 'requirements_validated',
        }),
      });
      const data = await res.json();
      if (!res.ok || data.error) throw new Error(data.error || `Erreur ${res.status}`);
      if (!data.projectId) throw new Error('Projet créé mais projectId manquant');
      router.push(`/admin/pcb/${data.projectId}/cahier-des-charges`);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur');
    } finally {
      setSubmitting(false);
    }
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
          <>
            <div className="mb-4 space-y-2">
              <label className="block text-sm font-medium" htmlFor="project-name">
                Nom du projet <span className="text-red-500">*</span>
              </label>
              <input
                id="project-name"
                data-testid="input-project-name"
                type="text"
                className="w-full rounded border p-2"
                placeholder="Ex : Clignotant LED 9V — banc d'essai"
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
              />
              <p className="text-xs text-gray-500">
                Contexte métier conservé avec le projet : il servira à retrouver des projets
                similaires (RAG) et à guider la compilation IA.
              </p>
            </div>
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
                    disabled={compiling || !generalIdea.trim() || !projectName.trim()}
                    className="rounded bg-blue-600 px-3 py-1.5 text-sm text-white disabled:opacity-50"
                    onClick={async () => {
                      if (compiling) return;
                      setCompiling(true);
                      setError(null);
                      try {
                        const res = await fetch('/api/pcb/requirements/compile', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({
                            description: generalIdea.trim(),
                            projectName: projectName.trim(),
                          }),
                        });
                        const data = await res.json();
                        if (!res.ok || data.error) {
                          throw new Error(data.error || `Erreur ${res.status}`);
                        }
                        const compiled =
                          typeof data.compiled === 'string' ? data.compiled.trim() : '';
                        const nextConstraints = Array.isArray(data.constraints)
                          ? (data.constraints as string[])
                          : [];
                        const nextConflicts = Array.isArray(data.conflicts)
                          ? (data.conflicts as CompileConflict[])
                          : [];
                        const serverViolations = Array.isArray(data.violations)
                          ? (data.violations as CompileViolation[])
                          : [];
                        const clean =
                          data.needsReview !== true &&
                          nextConflicts.length === 0 &&
                          serverViolations.length === 0;
                        setCompiledText(compiled);
                        setConstraints(nextConstraints);
                        setConflicts(nextConflicts);
                        // Piège F1 : la première compilation sert d'initialDescription.
                        // Ne la figer que si elle est fidèle au texte client.
                        if (clean) setFirstCompiledText((prev) => prev || compiled);
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
                        void submitValidated();
                      }}
                    >
                      Valider
                    </button>
                  )}
                </div>

                {constraints.length > 0 && (
                  <div className="mt-2 rounded border border-blue-200 bg-blue-50 p-2 text-xs text-blue-800">
                    <p className="font-semibold">Contraintes extraites du texte client</p>
                    <div className="mt-1 flex flex-wrap gap-1">
                      {constraints.map((c, i) => (
                        <span key={`${c}-${i}`} className="rounded bg-white px-1.5 py-0.5">
                          « {c} »
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                {conflicts.length > 0 && (
                  <div className="mt-2 rounded border border-amber-300 bg-amber-50 p-2 text-xs text-amber-800">
                    <p className="font-semibold">Conflits à arbitrer</p>
                    <ul className="mt-1 list-disc pl-5">
                      {conflicts.map((c, i) => (
                        <li key={`${c.questionId}-${i}`}>
                          {c.need} — « {c.forbidden} » exclu. {c.explanation}
                          <button
                            type="button"
                            className="ml-2 underline"
                            onClick={() => setConflicts((prev) => prev.filter((_, j) => j !== i))}
                          >
                            Arbitré
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {violations.length > 0 && (
                  <div className="mt-2 rounded border border-red-300 bg-red-50 p-2 text-xs text-red-700">
                    <p className="font-semibold">Interdictions réintroduites par la compilation</p>
                    <ul className="mt-1 list-disc pl-5">
                      {violations.map((v, i) => (
                        <li key={`${v.questionId}-${v.term}-${i}`}>{v.message}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {needsReview && (
                  <p className="mt-2 text-xs font-medium text-amber-700">
                    Corrigez les champs signalés avant de valider.
                  </p>
                )}
                <p className="text-xs text-gray-500">
                  Généré par IA à partir de l&apos;idée générale. Modifiable avant validation.
                </p>
              </div>
            </div>
          </>
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
                  onClick={() => {
                    void submitValidated();
                  }}
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
        {block.questions.map((q) => {
          const fieldStatus = answers.find((a) => a.questionId === q.id)?.status;
          return (
            <div key={q.id}>
              <label className="block text-sm font-medium">
                {q.label} {q.required && <span className="text-red-500">*</span>}
                {fieldStatus === 'missing' && (
                  <span className="ml-2 rounded bg-red-100 px-1.5 py-0.5 text-[10px] font-medium text-red-700">
                    À préciser
                  </span>
                )}
                {fieldStatus === 'to_verify' && (
                  <span className="ml-2 rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-medium text-amber-700">
                    À vérifier
                  </span>
                )}
              </label>
              {q.type === 'select' && (
                <select
                  data-testid={`select-${q.id}`}
                  data-field-id={`field-${q.id}`}
                  className="mt-1 w-full rounded border p-2"
                  value={answerFor(q.id)}
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
              {q.type === 'multiselect' && (
                <div data-testid={`field-${q.id}`} className="mt-1 flex flex-wrap gap-3">
                  {(q.options ?? []).map((o) => {
                    const selected = answerFor(q.id)
                      .split(',')
                      .map((v) => v.trim())
                      .filter(Boolean)
                      .includes(o);
                    return (
                      <label key={o} className="flex items-center gap-1 text-sm">
                        <input
                          type="checkbox"
                          checked={selected}
                          onChange={() => toggleMulti(q.id, o, answerFor(q.id))}
                        />
                        {o}
                      </label>
                    );
                  })}
                </div>
              )}
              {q.type === 'text' && (
                <input
                  data-testid={`input-${q.id}`}
                  data-field-id={`field-${q.id}`}
                  type="text"
                  className="mt-1 w-full rounded border p-2"
                  value={answerFor(q.id)}
                  onChange={(e) => handleAnswer(q.id, e.target.value)}
                />
              )}
              {q.type === 'number' && (
                <input
                  data-testid={`field-${q.id}`}
                  type="number"
                  className="mt-1 w-full rounded border p-2"
                  value={answerFor(q.id)}
                  onChange={(e) => handleAnswer(q.id, e.target.value)}
                />
              )}
              {q.type === 'checkbox' && (
                <input
                  data-testid={`field-${q.id}`}
                  type="checkbox"
                  className="mt-1"
                  checked={answerFor(q.id) === 'oui'}
                  onChange={(e) => handleAnswer(q.id, e.target.checked ? 'oui' : 'non')}
                />
              )}
            </div>
          );
        })}
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
              const issue = unresolvedIssue();
              if (issue) {
                focusIssue(issue.message, issue.questionId);
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
                    initialDescription: firstCompiledText || contextText,
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
