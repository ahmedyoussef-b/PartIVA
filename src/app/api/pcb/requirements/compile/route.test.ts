import { beforeEach, describe, expect, it, vi } from 'vitest';

const requireAdminMock = vi.fn();
const callGroq = vi.fn();
const hasLlmProvider = vi.fn();
const getCache = vi.fn();
const setCache = vi.fn();
const acquireGuard = vi.fn();
const hashKey = vi.fn();

vi.mock('@/lib/auth-admin', () => ({
  requireAdmin: (...a: unknown[]) => requireAdminMock(...a),
}));
vi.mock('@/lib/ai/groq-client', () => ({
  callGroq: (...a: unknown[]) => callGroq(...a),
  hasLlmProvider: (...a: unknown[]) => hasLlmProvider(...a),
}));
vi.mock('@/lib/utils/llm-cache', () => ({
  getLlmCacheAsync: (...a: unknown[]) => getCache(...a),
  setLlmCacheAsync: (...a: unknown[]) => setCache(...a),
}));
vi.mock('@/lib/utils/llm-guard', () => ({
  acquireLlmGuard: (...a: unknown[]) => acquireGuard(...a),
  hashKey: (...a: unknown[]) => hashKey(...a),
}));

import { POST } from './route';

const DESCRIPTION = 'Je ne veux pas de Wi-Fi. Carte de commande 5V pour capteur, quantité 100.';

function llm(payload: unknown) {
  return { content: JSON.stringify(payload) };
}

function request(description = DESCRIPTION) {
  return new Request('http://localhost/api/pcb/requirements/compile', {
    method: 'POST',
    body: JSON.stringify({ description, projectName: 'Capteur test' }),
  });
}

describe('POST /api/pcb/requirements/compile — extraction fidèle au CDC', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    requireAdminMock.mockResolvedValue({ role: 'ADMIN' });
    hasLlmProvider.mockReturnValue(true);
    getCache.mockResolvedValue(null);
    setCache.mockResolvedValue(undefined);
    acquireGuard.mockReturnValue({ ok: true, release: vi.fn() });
    hashKey.mockReturnValue('hash');
    callGroq.mockResolvedValue(
      llm({
        compiled: 'Wi-Fi exclu. Alimentation 5 V. Quantité 100.',
        answers: [
          {
            blockId: 'mauvais-bloc',
            questionId: 'main_functions',
            answer: 'Commande de capteur',
            status: 'to_verify',
          },
          {
            blockId: 'functions',
            questionId: 'power',
            answer: '5 V',
            status: 'proposed',
          },
        ],
        conflicts: [],
      }),
    );
  });

  it('envoie un prompt d’extraction avec les interdictions et sans injonction à inventer', async () => {
    const res = await POST(request());
    expect(res.status).toBe(200);
    const prompt = String(callGroq.mock.calls[0]?.[0]?.[0]?.content ?? '');
    expect(prompt).toContain('INTERDICTIONS ABSOLUES');
    expect(prompt).toContain('- Wi-Fi');
    expect(prompt).toContain('À préciser');
    expect(prompt.toLowerCase()).not.toContain('déduis');
    expect(prompt.toLowerCase()).not.toContain('maximum');
    expect(prompt.toLowerCase()).not.toContain('sois exhaustif');
    expect(callGroq.mock.calls[0]?.[2]).toMatchObject({ temperature: 0 });
    const body = (await res.json()) as { constraints: string[] };
    expect(body.constraints).toEqual(['Wi-Fi']);
  });

  it('marque les champs requis non cités « À préciser » et reprend le blockId serveur', async () => {
    const res = await POST(request());
    const body = (await res.json()) as {
      answers: Array<{ questionId: string; blockId: string; answer: string; status: string }>;
      needsReview: boolean;
    };
    expect(body.needsReview).toBe(false);
    const mainFunctions = body.answers.find((a) => a.questionId === 'main_functions');
    expect(mainFunctions).toMatchObject({ blockId: 'functions', status: 'proposed' });
    expect(body.answers).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          questionId: 'usage_type',
          blockId: 'usage',
          answer: 'À préciser',
          status: 'missing',
        }),
      ]),
    );
  });

  it('signale une interdiction réintroduite sans mettre la compilation en cache', async () => {
    callGroq.mockResolvedValue(
      llm({
        compiled: 'La carte utilise le WiFi pour les notifications.',
        answers: [
          {
            blockId: 'functions',
            questionId: 'communications',
            answer: 'WiFi',
            status: 'proposed',
          },
        ],
        conflicts: [],
      }),
    );
    const res = await POST(request());
    const body = (await res.json()) as {
      needsReview: boolean;
      violations: Array<{ where: string; term: string }>;
      answers: Array<{ questionId: string; status: string }>;
    };
    expect(body.needsReview).toBe(true);
    expect(body.violations.length).toBeGreaterThan(0);
    expect(body.answers.find((a) => a.questionId === 'communications')?.status).toBe('to_verify');
    expect(setCache).not.toHaveBeenCalled();
  });

  it('conserve les conflits Liés à une interdiction et marque le champ à vérifier', async () => {
    callGroq.mockResolvedValue(
      llm({
        compiled: 'Notifications smartphone souhaitées, WiFi exclu.',
        answers: [],
        conflicts: [
          {
            questionId: 'communications',
            forbidden: 'WiFi',
            need: 'notifications smartphone',
            explanation: 'Le client exclut le WiFi.',
          },
        ],
      }),
    );
    const res = await POST(request());
    const body = (await res.json()) as {
      needsReview: boolean;
      conflicts: Array<{ questionId: string; forbidden: string }>;
      answers: Array<{ questionId: string; status: string }>;
    };
    expect(body.needsReview).toBe(true);
    expect(body.conflicts).toHaveLength(1);
    expect(body.answers.find((a) => a.questionId === 'communications')?.status).toBe('to_verify');
    expect(setCache).not.toHaveBeenCalled();
  });

  it('utilise un cache v4 et ne rappelle pas le LLM sur cache hit', async () => {
    getCache.mockResolvedValue({
      compiled: 'Wi-Fi exclu.',
      answers: [],
      constraints: ['Wi-Fi'],
      conflicts: [],
      violations: [],
      needsReview: false,
      count: 0,
    });
    const res = await POST(request());
    const body = (await res.json()) as { cached: boolean };
    expect(body.cached).toBe(true);
    expect(String(getCache.mock.calls[0]?.[0])).toContain('pcb:compile:v4:');
    expect(callGroq).not.toHaveBeenCalled();
  });

  it('convertit les devises en dinars tunisiens', async () => {
    callGroq.mockResolvedValue(
      llm({
        compiled: 'Budget 10 €, soit 5 USD.',
        answers: [
          { blockId: 'manufacturing', questionId: 'budget', answer: '5 EUR', status: 'proposed' },
        ],
        conflicts: [],
      }),
    );
    const res = await POST(request('Budget 10 €.'));
    const body = (await res.json()) as {
      compiled: string;
      answers: Array<{ answer: string }>;
    };
    expect(body.compiled).toContain('DT');
    expect(body.compiled).not.toContain('€');
    expect(body.answers.find((a) => a.answer.includes('DT'))).toBeDefined();
  });
});
