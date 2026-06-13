export interface EmailParams {
  to: string;
  subject: string;
  html: string;
}

export async function sendEmail({ to, subject, html }: EmailParams): Promise<void> {
  // Placeholder: logs to console.
  // Replace with real email provider (Resend, SendGrid, Nodemailer, etc.)
  console.log("=== EMAIL ===");
  console.log(`To: ${to}`);
  console.log(`Subject: ${subject}`);
  console.log(`Body:\n${html}`);
  console.log("=== END EMAIL ===");
}
