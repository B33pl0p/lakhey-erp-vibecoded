import nodemailer from "nodemailer";

export interface MailMessage {
  to: string;
  subject: string;
  text: string;
  html: string;
  replyTo?: string;
}

function getRequiredEnv(key: string) {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Missing ${key}. Add it to your SMTP environment variables.`);
  }
  return value;
}

function getSmtpPort() {
  const rawPort = process.env.SMTP_PORT || "465";
  const port = Number(rawPort);
  if (!Number.isFinite(port)) {
    throw new Error("SMTP_PORT must be a number.");
  }
  return port;
}

function isSecureSmtp(port: number) {
  if (process.env.SMTP_SECURE) {
    return process.env.SMTP_SECURE === "true";
  }
  return port === 465;
}

export async function sendMail(message: MailMessage) {
  const port = getSmtpPort();
  const user = getRequiredEnv("SMTP_USER");

  const transporter = nodemailer.createTransport({
    host: getRequiredEnv("SMTP_HOST"),
    port,
    secure: isSecureSmtp(port),
    auth: {
      user,
      pass: getRequiredEnv("SMTP_PASS"),
    },
  });

  return transporter.sendMail({
    from: process.env.SMTP_FROM || user,
    ...message,
  });
}
