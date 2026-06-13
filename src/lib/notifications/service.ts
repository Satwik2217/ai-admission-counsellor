import { sendEmail } from "@/lib/email/service";

interface OrgInfo {
  name: string;
  phone?: string | null;
  email?: string | null;
}

export async function notifyNewLead(params: {
  org: OrgInfo;
  leadName: string;
  leadPhone?: string | null;
  leadEmail?: string | null;
  interestedCourse?: string | null;
  staffEmail: string;
}) {
  const { subject, html } = buildNewLeadEmail(params);
  await sendEmail({ to: params.staffEmail, subject, html }).catch(console.error);
}

export async function notifyNewAppointment(params: {
  org: OrgInfo;
  leadName: string;
  date: string;
  time: string;
  staffEmail: string;
}) {
  const { subject, html } = buildNewAppointmentEmail(params);
  await sendEmail({ to: params.staffEmail, subject, html }).catch(console.error);
}

export async function notifyHighIntentLead(params: {
  org: OrgInfo;
  leadName: string;
  leadPhone?: string | null;
  leadEmail?: string | null;
  score: number;
  staffEmail: string;
}) {
  const { subject, html } = buildHighIntentEmail(params);
  await sendEmail({ to: params.staffEmail, subject, html }).catch(console.error);
}

function buildNewLeadEmail(params: {
  org: OrgInfo;
  leadName: string;
  leadPhone?: string | null;
  leadEmail?: string | null;
  interestedCourse?: string | null;
}) {
  return {
    subject: `New Lead: ${params.leadName} - ${params.org.name}`,
    html: `
      <h2>New Lead Captured</h2>
      <p><strong>Name:</strong> ${params.leadName}</p>
      ${params.leadPhone ? `<p><strong>Phone:</strong> ${params.leadPhone}</p>` : ""}
      ${params.leadEmail ? `<p><strong>Email:</strong> ${params.leadEmail}</p>` : ""}
      ${params.interestedCourse ? `<p><strong>Course:</strong> ${params.interestedCourse}</p>` : ""}
      <hr />
      <p style="color:#666;">${params.org.name}</p>
    `,
  };
}

function buildNewAppointmentEmail(params: {
  org: OrgInfo;
  leadName: string;
  date: string;
  time: string;
}) {
  return {
    subject: `New Appointment: ${params.leadName} - ${params.date}`,
    html: `
      <h2>New Appointment Booked</h2>
      <p><strong>Name:</strong> ${params.leadName}</p>
      <p><strong>Date:</strong> ${params.date}</p>
      <p><strong>Time:</strong> ${params.time}</p>
      <hr />
      <p style="color:#666;">${params.org.name}</p>
    `,
  };
}

function buildHighIntentEmail(params: {
  org: OrgInfo;
  leadName: string;
  leadPhone?: string | null;
  leadEmail?: string | null;
  score: number;
}) {
  return {
    subject: `High-Intent Lead: ${params.leadName} (Score: ${params.score})`,
    html: `
      <h2>High-Intent Lead Alert</h2>
      <p><strong>Name:</strong> ${params.leadName}</p>
      ${params.leadPhone ? `<p><strong>Phone:</strong> ${params.leadPhone}</p>` : ""}
      ${params.leadEmail ? `<p><strong>Email:</strong> ${params.leadEmail}</p>` : ""}
      <p><strong>Score:</strong> ${params.score}</p>
      <p style="color:#e53e3e;font-weight:bold;">This lead has high purchase intent. Contact immediately.</p>
      <hr />
      <p style="color:#666;">${params.org.name}</p>
    `,
  };
}
