export const KB_CATEGORIES = [
  { id: "courses", label: "Courses" },
  { id: "fees", label: "Fees" },
  { id: "admissions", label: "Admissions" },
  { id: "hostel", label: "Hostel" },
  { id: "scholarships", label: "Scholarships" },
  { id: "contact", label: "Contact Information" },
  { id: "policies", label: "Policies" },
  { id: "general", label: "General" },
] as const;

export type KBCategoryId = (typeof KB_CATEGORIES)[number]["id"];

export const FALLBACK_RESPONSE =
  "I don't have enough information to answer that. Please leave your contact details and our team will assist you.";

export const SIMILARITY_THRESHOLD = 0.7;

export interface SearchResult {
  id: string;
  sourceType: "FAQ" | "KB";
  sourceId: string;
  content: string;
  title?: string;
  category: string;
  score: number;
}

export interface FAQData {
  id?: string;
  question: string;
  answer: string;
  category: string;
}

export interface KBEntryData {
  id?: string;
  title: string;
  content: string;
  category: string;
}
