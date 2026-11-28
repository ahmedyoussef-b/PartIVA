// Contraintes négatives du CDC — pur, sans Next ni I/O.
// Le texte du client est la seule source de vérité : on y extrait les
// interdictions, puis on vérifie que la compilation ne les réintroduit pas.

import type { CompileConflict, CompileViolation } from './types';

const NEGATION_MARKER =
  /(?:ne\s+)?(?:veux|voudrais|souhaite)?\s*(?:pas\s+(?:besoin\s+)?(?:de\s+|d['’])?|sans\s+|aucun(?:e)?\s+|exclu(?:e)?\s+|interdit(?:e)?\s+|jamais\s+(?:de\s+|d['’])?|éviter\s+(?:de\s+)?)\s*([^,;.!?\n()]+)/giu;

const NEGATION_NEAR =
  /(?:pas\s+(?:de\s+|d['’])?|sans\s+|aucun(?:e)?\b|exclu(?:e)?\b|interdit(?:e)?\b|jamais\b|éviter\s+|ne\s+veux\s+pas)/iu;

// Ces expressions ne sont pas des interdictions techniques (idiomes ou
// tournures conversationnelles) : les ignorer évite les faux positifs.
const IGNORED_PHRASES = new Set([
  'problème',
  'probleme',
  'souci',
  'urgence',
  'plaisir',
  'attente',
  'fil',
  'seulement',
  'peur',
  'besoin',
]);

interface Alias {
  keywords: string[];
  questionIds: string[];
}

const ALIASES: Alias[] = [
  {
    keywords: ['wi-fi', 'wifi', '802.11', 'wlan'],
    questionIds: ['communications'],
  },
  {
    keywords: ['batterie', 'accumulateur', 'li-ion', 'lipo'],
    questionIds: ['power'],
  },
  {
    keywords: ['tactile', 'touchscreen', 'écran tactile'],
    questionIds: ['outputs'],
  },
  {
    keywords: ['écran', 'ecran', 'screen'],
    questionIds: ['outputs'],
  },
  { keywords: ['relais'], questionIds: ['outputs'] },
  { keywords: ['12v', '12 v'], questionIds: ['power'] },
];

function normalize(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[\s'’-]+/g, ' ')
    .trim();
}

function cleanPhrase(raw: string): string {
  return raw
    .trim()
    .replace(/^(?:de\s+|d['’]|du\s+|des\s+|la\s+|le\s+|les\s+|un\s+|une\s+)+/iu, '')
    .replace(/\s+(?:et|ou|mais|car|donc|avec|pour)\b.*$/iu, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Extrait les interdictions du texte libre, dans l'ordre d'apparition. */
export function extractNegativeConstraints(text: string): string[] {
  const out: string[] = [];
  const seen = new Set<string>();
  for (const match of text.matchAll(NEGATION_MARKER)) {
    const phrase = cleanPhrase(match[1] ?? '');
    const key = normalize(phrase);
    const firstWord = key.split(' ')[0] ?? '';
    if (
      !key ||
      key.length > 80 ||
      IGNORED_PHRASES.has(key) ||
      IGNORED_PHRASES.has(firstWord) ||
      seen.has(key)
    ) {
      continue;
    }
    seen.add(key);
    out.push(phrase);
  }
  return out;
}

function aliasFor(constraint: string): Alias | null {
  const key = normalize(constraint);
  if (/(?:wi\s?fi|wlan|802)/iu.test(key)) return ALIASES[0]!;
  if (/(?:batterie|accumulateur|li\s?ion|lipo)/iu.test(key)) return ALIASES[1]!;
  if (/(?:tactile|touch)/iu.test(key)) return ALIASES[2]!;
  if (/(?:ecran|screen)/iu.test(key)) return ALIASES[3]!;
  if (/relais/iu.test(key)) return ALIASES[4]!;
  if (/12\s?v/iu.test(key)) return ALIASES[5]!;
  return null;
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function keywordRegex(keyword: string): RegExp {
  const escaped = escapeRegExp(keyword);
  return new RegExp(`(?:^|[^\\p{L}\\p{N}])${escaped}(?:$|[^\\p{L}\\p{N}])`, 'giu');
}

function negatedAround(text: string, index: number): boolean {
  return NEGATION_NEAR.test(text.slice(Math.max(0, index - 70), Math.min(text.length, index + 70)));
}

function firstUnnegated(text: string, keywords: string[]): string | null {
  for (const keyword of keywords) {
    for (const match of text.matchAll(keywordRegex(keyword))) {
      if (match.index !== undefined && !negatedAround(text, match.index)) return keyword;
    }
  }
  return null;
}

export interface ConstraintCheckInput {
  compiled: string;
  answers: Array<{ questionId: string; answer: string }>;
  constraints: string[];
}

/**
 * Détecte les réintroductions d'une interdiction, dans le texte compilé et
 * dans les réponses. Une occurrence accompagnée d'une négation à proximité
 * (ex. « WiFi exclu ») n'est pas une violation : c'est la contrainte elle-même.
 */
export function checkConstraintViolations({
  compiled,
  answers,
  constraints,
}: ConstraintCheckInput): CompileViolation[] {
  const violations: CompileViolation[] = [];
  const seen = new Set<string>();

  const push = (violation: CompileViolation) => {
    const key = `${violation.questionId}|${violation.where}|${violation.term}|${violation.value}`;
    if (seen.has(key)) return;
    seen.add(key);
    violations.push(violation);
  };

  for (const constraint of constraints) {
    const alias = aliasFor(constraint);
    const keywords = alias?.keywords ?? [constraint];
    const questionIds = alias?.questionIds ?? [];

    const inCompiled = firstUnnegated(compiled, keywords);
    if (inCompiled) {
      push({
        questionId: questionIds[0] ?? '',
        term: constraint,
        where: 'compiled',
        value: inCompiled,
        message: `« ${constraint} » est interdit mais réapparaît dans la description compilée (${inCompiled}).`,
      });
    }

    for (const answer of answers) {
      if (questionIds.length > 0 && !questionIds.includes(answer.questionId)) continue;
      const inAnswer = firstUnnegated(answer.answer, keywords);
      if (inAnswer) {
        push({
          questionId: answer.questionId,
          term: constraint,
          where: 'answer',
          value: answer.answer,
          message: `« ${constraint} » est interdit mais est utilisé dans la réponse ${answer.questionId} (${inAnswer}).`,
        });
      }
    }
  }
  return violations;
}

function keywordSet(value: string): Set<string> {
  const key = normalize(value);
  const set = new Set<string>();
  const alias = aliasFor(value);
  for (const k of alias?.keywords ?? []) set.add(normalize(k));
  for (const word of key.split(' ')) {
    if (word.length >= 4) set.add(word);
  }
  return set;
}

function matchesConstraint(constraint: string, term: string): boolean {
  const a = normalize(constraint);
  const b = normalize(term);
  if (a.includes(b) || b.includes(a)) return true;
  const ka = keywordSet(constraint);
  return [...keywordSet(term)].some((k) => ka.has(k));
}

/** Ne conserve que les conflits adossés à une interdiction réellement extraite. */
export function reconcileConflicts(raw: unknown, constraints: string[]): CompileConflict[] {
  const list = Array.isArray(raw) ? raw : [];
  const out: CompileConflict[] = [];
  const seen = new Set<string>();
  for (const item of list) {
    if (!item || typeof item !== 'object') continue;
    const o = item as Record<string, unknown>;
    const questionId = typeof o.questionId === 'string' ? o.questionId.trim() : '';
    const forbidden = typeof o.forbidden === 'string' ? o.forbidden.trim() : '';
    const need = typeof o.need === 'string' ? o.need.trim() : '';
    const explanation = typeof o.explanation === 'string' ? o.explanation.trim() : '';
    if (!questionId || !forbidden || !need) continue;
    if (!constraints.some((c) => matchesConstraint(c, forbidden))) continue;
    const key = `${questionId}|${normalize(forbidden)}|${normalize(need)}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push({ questionId, forbidden, need, explanation });
  }
  return out;
}
