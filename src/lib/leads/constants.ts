export const LEAD_STATUSES = [
  { value: "new", label: "New", color: "bg-blue-100 text-blue-800" },
  { value: "contacted", label: "Contacted", color: "bg-yellow-100 text-yellow-800" },
  { value: "interested", label: "Interested", color: "bg-purple-100 text-purple-800" },
  { value: "converted", label: "Converted", color: "bg-green-100 text-green-800" },
  { value: "lost", label: "Lost", color: "bg-red-100 text-red-800" },
] as const;

export const LEAD_SOURCES = [
  { value: "direct", label: "Direct" },
  { value: "website", label: "Website" },
  { value: "referral", label: "Referral" },
  { value: "social_media", label: "Social Media" },
  { value: "phone_inquiry", label: "Phone Inquiry" },
  { value: "chat", label: "Chat" },
  { value: "whatsapp", label: "WhatsApp" },
  { value: "campaign", label: "Campaign" },
  { value: "walk_in", label: "Walk-in" },
  { value: "other", label: "Other" },
] as const;

export const SCORING_RULES_V2 = {
  PHONE_PROVIDED: 20,
  EMAIL_PROVIDED: 10,
  FIRST_FEES_QUESTION: 20,
  REPEAT_FEES_QUESTION: 10,
  FIRST_ADMISSIONS_QUESTION: 30,
  REPEAT_ADMISSIONS_QUESTION: 15,
  BOOKED_APPOINTMENT: 30,
  RECENCY_24H: 15,
  RECENCY_7D: 10,
  RECENCY_30D: 5,
} as const;

export const SOURCE_BOOSTS: Record<string, number> = {
  referral: 10,
  walk_in: 10,
  phone_inquiry: 5,
  whatsapp: 5,
  chat: 3,
  website: 2,
  social_media: 2,
};

export const CATEGORY_THRESHOLDS = {
  VIP: 80,
  HOT: 50,
  WARM: 20,
} as const;

export const LEAD_ACTIVITY_TYPES = {
  PHONE_PROVIDED: "phone_provided",
  EMAIL_PROVIDED: "email_provided",
  ASKED_ABOUT_FEES: "asked_about_fees",
  ASKED_ABOUT_ADMISSIONS: "asked_about_admissions",
  BOOKED_APPOINTMENT: "booked_appointment",
  STATUS_CHANGED: "status_changed",
  NOTE_ADDED: "note_added",
  LEAD_CREATED: "lead_created",
  LEAD_UPDATED: "lead_updated",
} as const;

export type LeadStatus = (typeof LEAD_STATUSES)[number]["value"];
export type LeadSource = (typeof LEAD_SOURCES)[number]["value"];
export type LeadActivityType = (typeof LEAD_ACTIVITY_TYPES)[keyof typeof LEAD_ACTIVITY_TYPES];
