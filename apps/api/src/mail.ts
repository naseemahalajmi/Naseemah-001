import nodemailer from "nodemailer";

const host = process.env.SMTP_HOST ?? "mail";
const port = Number(process.env.SMTP_PORT ?? 1025);

const transporter = nodemailer.createTransport({
  host,
  port,
  secure: false,
});

export async function sendPasswordResetEmail(to: string, resetUrl: string): Promise<void> {
  await transporter.sendMail({
    from: "Naseemah <noreply@naseemah.local>",
    to,
    subject: "Reset your password",
    textEncoding: "base64",
    text: `Use this link to set a new password. It expires in one hour.\n\n${resetUrl}\n`,
    html: `<p>Use this link to set a new password. It expires in one hour.</p><p><a href="${resetUrl}">Set a new password</a></p>`,
  });
}
