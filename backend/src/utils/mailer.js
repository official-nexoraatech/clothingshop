const RESEND_EMAILS_ENDPOINT = 'https://api.resend.com/emails';
const REQUEST_TIMEOUT_MS = 10000;

export const isMailConfigured = () => Boolean(
  process.env.RESEND_API_KEY?.trim() &&
  process.env.RESEND_FROM?.trim()
);

export function getMailConfigurationStatus() {
  return {
    apiKey: Boolean(process.env.RESEND_API_KEY?.trim()),
    from: Boolean(process.env.RESEND_FROM?.trim()),
  };
}

export async function sendPasswordResetEmail({ email, resetUrl }) {
  if (!isMailConfigured()) {
    throw new Error('Resend configuration is incomplete. Check RESEND_API_KEY and RESEND_FROM.');
  }

  let response;
  try {
    response = await fetch(RESEND_EMAILS_ENDPOINT, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: process.env.RESEND_FROM,
        to: [email],
        subject: 'Reset your password',
        text: `We received a request to reset your password. Use this link within one hour: ${resetUrl}\n\nIf you did not request this, you can safely ignore this email.`,
        html: `<p>We received a request to reset your password.</p><p><a href="${resetUrl}">Reset your password</a></p><p>This link expires in one hour. If you did not request this, you can safely ignore this email.</p>`,
      }),
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });
  } catch (error) {
    // Fetch errors may include request details; keep logs free of URLs/tokens/keys.
    const safeError = new Error(
      error.name === 'TimeoutError'
        ? 'Resend email request timed out.'
        : 'Unable to reach the Resend email service.'
    );
    safeError.code = error.name === 'TimeoutError' ? 'RESEND_TIMEOUT' : 'RESEND_NETWORK_ERROR';
    throw safeError;
  }

  if (!response.ok) {
    // Do not include the provider response body; it may include recipient details.
    const error = new Error(`Resend email request failed with HTTP ${response.status}.`);
    error.code = `RESEND_HTTP_${response.status}`;
    throw error;
  }
}
