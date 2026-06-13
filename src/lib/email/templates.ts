interface ConfirmationParams {
  leadName: string;
  date: string;
  time: string;
  instituteName: string;
  institutePhone?: string | null;
  instituteEmail?: string | null;
  status: string;
}

export function buildConfirmationEmail({
  leadName,
  date,
  time,
  instituteName,
  institutePhone,
  instituteEmail,
  status,
}: ConfirmationParams): { subject: string; html: string } {
  const statusLabel =
    status === "confirmed"
      ? "Confirmed"
      : status === "cancelled"
        ? "Cancelled"
        : status === "completed"
          ? "Completed"
          : "Pending";

  const subject = `Appointment ${statusLabel} - ${instituteName}`;

  const html = `
<!DOCTYPE html>
<html>
<body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: #f8f9fa; border-radius: 8px; padding: 24px;">
    <h2 style="color: #1a1a2e; margin-top: 0;">Appointment ${statusLabel}</h2>
    <p style="color: #666;">Dear ${leadName},</p>
    <p style="color: #666;">Your appointment with <strong>${instituteName}</strong> has been <strong>${statusLabel.toLowerCase()}</strong>.</p>

    <div style="background: white; border-radius: 6px; padding: 16px; margin: 16px 0;">
      <p style="margin: 4px 0;"><strong>Date:</strong> ${date}</p>
      <p style="margin: 4px 0;"><strong>Time:</strong> ${time}</p>
      <p style="margin: 4px 0;"><strong>Status:</strong> ${statusLabel}</p>
    </div>

    <p style="color: #666;">Please save this information for your reference.</p>

    ${institutePhone ? `<p style="color: #666;">For any changes, contact: <strong>${institutePhone}</strong></p>` : ""}
    ${instituteEmail ? `<p style="color: #666;">Email: <strong>${instituteEmail}</strong></p>` : ""}

    <p style="color: #999; font-size: 12px; margin-top: 24px;">
      This is an automated message from ${instituteName}. Please do not reply.
    </p>
  </div>
</body>
</html>`;

  return { subject, html };
}
