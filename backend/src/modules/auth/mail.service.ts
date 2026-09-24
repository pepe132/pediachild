import { env } from '../../config/env';

export interface MailService {
  sendPasswordReset(to: string, name: string, url: string): Promise<void>;
}

export class ConfiguredMailService implements MailService {
  async sendPasswordReset(to: string, name: string, url: string) {
    if (env.MAIL_PROVIDER === 'disabled') return;

    if (env.MAIL_PROVIDER === 'console') {
      if (env.NODE_ENV !== 'development') {
        throw new Error('Console mail provider is only allowed in development.');
      }
      console.info(`[password-reset] ${to} ${url}`);
      return;
    }

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: env.MAIL_FROM,
        to: [to],
        subject: 'Restablece tu contraseña',
        html: [
          `<p>Hola ${escapeHtml(name)},</p>`,
          '<p>Solicitaste restablecer tu contraseña.</p>',
          `<p><a href="${escapeHtml(url)}">Crear una contraseña nueva</a></p>`,
          '<p>El enlace expira en 30 minutos y solo puede utilizarse una vez.</p>',
        ].join(''),
      }),
    });

    if (!response.ok) {
      throw new Error(`Email provider failed with status ${response.status}`);
    }
  }
}

function escapeHtml(value: string) {
  return value.replace(
    /[&<>'"]/g,
    (character) =>
      ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        "'": '&#39;',
        '"': '&quot;',
      })[character]!,
  );
}
