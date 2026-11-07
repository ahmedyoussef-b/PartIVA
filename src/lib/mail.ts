import nodemailer from 'nodemailer';

function getAppUrl() {
  return process.env.BETTER_AUTH_URL || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
}

function getFrom() {
  return process.env.SMTP_FROM || process.env.EMAIL_FROM || 'PartIVA <no-reply@partiva.local>';
}

function getTransport() {
  const host = process.env.SMTP_HOST;
  if (!host) return null;

  const port = Number(process.env.SMTP_PORT || 587);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: user && pass ? { user, pass } : undefined,
  });
}

export async function sendPasswordResetEmail(params: {
  to: string;
  url: string;
  userName?: string | null;
}) {
  const { to, url, userName } = params;
  const appUrl = getAppUrl().replace(/\/$/, '');
  const safeUrl = url.startsWith('http') ? url : `${appUrl}${url.startsWith('/') ? '' : '/'}${url}`;
  const transport = getTransport();

  const subject = 'Réinitialisation de votre mot de passe PartIVA';
  const text = [
    `Bonjour${userName ? ` ${userName}` : ''},`,
    '',
    'Vous avez demandé la réinitialisation de votre mot de passe PartIVA.',
    'Ouvrez le lien ci-dessous pour définir un nouveau mot de passe :',
    safeUrl,
    '',
    "Si vous n'êtes pas à l'origine de cette demande, vous pouvez ignorer cet email.",
  ].join('\n');

  const html = `
    <div style="font-family:Arial,sans-serif;line-height:1.5;color:#111">
      <h2 style="margin:0 0 12px">Réinitialisation du mot de passe</h2>
      <p>Bonjour${userName ? ` ${userName}` : ''},</p>
      <p>Vous avez demandé la réinitialisation de votre mot de passe PartIVA.</p>
      <p>
        <a href="${safeUrl}" style="display:inline-block;padding:10px 16px;background:#111;color:#fff;text-decoration:none;border-radius:6px">
          Définir un nouveau mot de passe
        </a>
      </p>
      <p style="font-size:13px;color:#555">Si le bouton ne fonctionne pas, copiez ce lien dans votre navigateur :<br/>${safeUrl}</p>
      <p style="font-size:13px;color:#555">Si vous n'êtes pas à l'origine de cette demande, ignorez cet email.</p>
    </div>
  `;

  if (!transport) {
    // Aucun SMTP configuré : on journalise le lien réel (flux non mock côté auth/token).
    // Cela évite un échec silencieux en développement tout en restant explicite.
    console.warn('[auth] SMTP non configuré — lien de réinitialisation (usage dev) :', safeUrl);
    return;
  }

  await transport.sendMail({
    from: getFrom(),
    to,
    subject,
    text,
    html,
  });
}
