import nodemailer from "nodemailer";

export async function sendEmail({ to, subject, text, html }) {
  const host = process.env.SMTP_HOST;
  const port = process.env.SMTP_PORT || 587;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const from = process.env.SMTP_FROM || `"TutorHub" <noreply@tutorhub.local>`;

  if (!host || !user || !pass) {
    console.warn("[Email Log] SMTP is not configured. Skipping email sending.");
    return { sent: false, reason: "SMTP credentials missing" };
  }

  try {
    const transporter = nodemailer.createTransport({
      host,
      port: Number(port),
      secure: Number(port) === 465,
      auth: {
        user,
        pass,
      },
    });

    const info = await transporter.sendMail({
      from,
      to,
      subject,
      text,
      html,
    });

    console.log(`[Email Log] Email sent to ${to}: ${info.messageId}`);
    return { sent: true, messageId: info.messageId };
  } catch (error) {
    console.error(`[Email Log] Error sending email to ${to}:`, error);
    return { sent: false, error: error.message };
  }
}
