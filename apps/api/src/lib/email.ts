import { env } from "./env.js";

export async function sendPasswordResetEmail(
  to: string,
  resetUrl: string
) {
  if (!env.RESEND_API_KEY || !env.PASSWORD_RESET_FROM_EMAIL) {
    console.warn(
      "PASSWORD_RESET_EMAIL_DISABLED",
      "Configure RESEND_API_KEY e PASSWORD_RESET_FROM_EMAIL."
    );

    return false;
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      authorization: `Bearer ${env.RESEND_API_KEY}`,
      "content-type": "application/json"
    },
    body: JSON.stringify({
      from: env.PASSWORD_RESET_FROM_EMAIL,
      to: [to],
      subject: "Redefinição de senha do PromptHub",
      html: `
        <div style="font-family:Arial,sans-serif;line-height:1.6;color:#24292f">
          <h2>Redefinição de senha</h2>
          <p>Recebemos uma solicitação para redefinir sua senha no PromptHub.</p>
          <p>
            <a href="${resetUrl}"
               style="display:inline-block;padding:10px 16px;background:#238636;color:white;text-decoration:none;border-radius:6px">
              Redefinir senha
            </a>
          </p>
          <p>O link expira em 30 minutos.</p>
          <p>Se você não solicitou esta alteração, ignore esta mensagem.</p>
        </div>
      `
    })
  });

  if (!response.ok) {
    const body = await response.text();
    console.error("RESEND_ERROR", response.status, body.slice(0, 500));
    return false;
  }

  return true;
}
