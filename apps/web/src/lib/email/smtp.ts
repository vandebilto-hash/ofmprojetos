import nodemailer from "nodemailer";

type EmailMessage = {
  to: string;
  subject: string;
  text: string;
  html: string;
};

export function isSmtpConfigured() {
  return Boolean(process.env.SMTP_HOST && process.env.SMTP_PORT && process.env.SMTP_USER && process.env.SMTP_PASS && process.env.SMTP_FROM);
}

function isResendConfigured() {
  return Boolean(process.env.RESEND_API_KEY);
}

export async function sendEmail(message: EmailMessage) {
  if (isResendConfigured()) {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        from: process.env.RESEND_FROM || "Projete-se <onboarding@resend.dev>",
        to: [message.to],
        subject: message.subject,
        text: message.text,
        html: message.html
      })
    });

    if (!response.ok) {
      const body = await response.text();
      throw new Error(`Falha ao enviar e-mail pelo Resend: ${response.status} ${body}`);
    }

    return { sent: true as const };
  }

  if (!isSmtpConfigured()) {
    return { sent: false, reason: "EMAIL_NOT_CONFIGURED" as const };
  }

  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT),
    secure: String(process.env.SMTP_SECURE ?? "false") === "true",
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    }
  });

  await transporter.sendMail({
    from: process.env.SMTP_FROM,
    to: message.to,
    subject: message.subject,
    text: message.text,
    html: message.html
  });

  return { sent: true as const };
}
