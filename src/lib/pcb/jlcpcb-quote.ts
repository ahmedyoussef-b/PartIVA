// Devis JLCPCB via l'API Open Platform (JOP). Sans credentials, mode fallback documenté.
// La signature et le chemin exact doivent être validés par un test live une fois l'accès obtenu.

import { createHmac, randomBytes } from 'node:crypto';

export interface JlcpcbQuoteInput {
  widthMm: number;
  heightMm: number;
  layers: 2 | 4;
  quantity: number;
}

export interface JlcpcbQuoteResult {
  ok: boolean;
  configured: boolean;
  price?: number;
  currency?: string;
  deliveryDays?: number;
  message?: string;
}

export function hasJLCPCBCredentials(): boolean {
  const appId = process.env.JLCPCB_APP_ID?.trim() || process.env.JLCPCB_API_KEY?.trim();
  const accessKey = process.env.JLCPCB_ACCESS_KEY?.trim();
  const secret = process.env.JLCPCB_SECRET_KEY?.trim() || process.env.JLCPCB_API_SECRET?.trim();
  return !!(appId && accessKey && secret);
}

export const MISSING_CREDENTIALS_MESSAGE =
  'Pour obtenir un devis en temps réel, configurez vos credentials JLCPCB dans .env (voir docs/TECHNIQUE.md).';

function signRequest(method: string, requestPath: string, body: string): string {
  const appId = process.env.JLCPCB_APP_ID?.trim() || process.env.JLCPCB_API_KEY!.trim();
  const accessKey = process.env.JLCPCB_ACCESS_KEY!.trim();
  const secret = process.env.JLCPCB_SECRET_KEY?.trim() || process.env.JLCPCB_API_SECRET!.trim();
  const timestamp = Math.floor(Date.now() / 1000).toString();
  const nonce = randomBytes(16).toString('hex');
  const stringToSign = `${method}\n${requestPath}\n${timestamp}\n${nonce}\n${body}\n`;
  const signature = createHmac('sha256', secret).update(stringToSign).digest('base64');
  return `JOP appid="${appId}",accesskey="${accessKey}",nonce="${nonce}",timestamp="${timestamp}",signature="${signature}"`;
}

export async function getJlcpcbQuote(input: JlcpcbQuoteInput): Promise<JlcpcbQuoteResult> {
  if (!hasJLCPCBCredentials()) {
    return { ok: false, configured: false, message: MISSING_CREDENTIALS_MESSAGE };
  }

  const endpoint = (process.env.JLCPCB_ENDPOINT?.trim() || 'https://open.jlcpcb.com').replace(
    /\/$/,
    '',
  );
  const requestPath =
    process.env.JLCPCB_QUOTE_PATH?.trim() || '/overseas/openapi/pcb/calculatePrice';
  const body = JSON.stringify({
    orderType: 'PCB',
    pcbParam: {
      layers: input.layers,
      width: Math.max(1, Math.ceil(input.widthMm)),
      height: Math.max(1, Math.ceil(input.heightMm)),
      quantity: Math.max(1, Math.floor(input.quantity)),
      thickness: 1.6,
    },
  });

  try {
    const response = await fetch(`${endpoint}${requestPath}`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        authorization: signRequest('POST', requestPath, body),
      },
      body,
      signal: AbortSignal.timeout(20_000),
    });
    const json = (await response.json().catch(() => ({}))) as Record<string, unknown>;
    if (!response.ok) {
      return {
        ok: false,
        configured: true,
        message: `JLCPCB ${response.status} : ${JSON.stringify(json).slice(0, 400)}`,
      };
    }
    const data = (json.data ?? json) as Record<string, unknown>;
    const price = Number(data.totalPrice ?? data.price ?? data.amount ?? NaN);
    if (!Number.isFinite(price)) {
      return { ok: false, configured: true, message: 'Réponse JLCPCB illisible (prix absent).' };
    }
    return {
      ok: true,
      configured: true,
      price,
      currency: typeof data.currency === 'string' ? data.currency : 'USD',
      deliveryDays: typeof data.deliveryDays === 'number' ? data.deliveryDays : undefined,
    };
  } catch (e) {
    return {
      ok: false,
      configured: true,
      message: e instanceof Error ? e.message : 'Appel JLCPCB impossible',
    };
  }
}
