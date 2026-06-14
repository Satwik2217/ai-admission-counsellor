import type { LeadInfo } from "./types";
import { getAIProvider } from "./provider";

const patterns: Record<keyof Required<LeadInfo>, RegExp[]> = {
  studentName: [
    /(?:my name is|i am|i'm|student name(?: is)?)\s+([A-Za-z\s]+?)(?:\.|,|$)/i,
    /(?:name|call me)\s+([A-Za-z\s]+?)(?:\.|,|$)/i,
  ],
  parentName: [
    /(?:parent(?:'s)? name|father(?:'s)? name|mother(?:'s)? name|my (?:father|mother|parent))(?: is)?\s+([A-Za-z\s]+?)(?:\.|,|$)/i,
    /(?:my (?:father|mother|parent)(?:'s)? name is)\s+([A-Za-z\s]+?)(?:\.|,|$)/i,
  ],
  phone: [
    /(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/g,
    /(\+?\d{1,3}[-.\s]?)?\d{10}/g,
  ],
  email: [
    /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g,
  ],
  classField: [
    /(?:class|grade|standard|year|studying in)\s+(?:\d{1,2})(?:th|rd|nd|st)?/i,
    /(?:class|grade|standard)\s+(?:\d{1,2})/i,
  ],
  targetExam: [
    /(?:target|aiming for|preparing for|want to (?:crack|clear|give))?\s*([A-Za-z\s]+?(?:exam|entrance|test|jee|neet|cuet|gate|cat))/i,
    /\b(JEE|NEET|CUET|GATE|CAT|GMAT|GRE|SAT|UPSC|SSC|CBSE|ICSE)\b/i,
  ],
};

function extractLeadInfoRegex(text: string): LeadInfo {
  const info: LeadInfo = {};

  for (const [field, regexps] of Object.entries(patterns)) {
    for (const regex of regexps) {
      const matches = text.match(regex);
      if (matches) {
        const value = matches[1] || matches[0];
        const clean = value.trim();
        if (clean) {
          if (field === "classField") {
            const numMatch = clean.match(/\d{1,2}/);
            if (numMatch) info[field] = numMatch[0] + getOrdinalSuffix(parseInt(numMatch[0]));
          } else if (field === "targetExam") {
            const examMatch = clean.match(/\b(JEE|NEET|CUET|GATE|CAT|GMAT|GRE|SAT|UPSC|SSC)\b/i);
            if (examMatch) {
              info[field] = examMatch[1].toUpperCase();
            } else {
              const examName = clean.replace(/^(?:target|aiming for|preparing for|want to (?:crack|clear|give))\s*/i, "").trim();
              if (examName) info[field] = examName;
            }
          } else {
            info[field as keyof LeadInfo] = clean;
          }
          break;
        }
      }
    }
  }

  return info;
}

export async function extractLeadInfo(text: string): Promise<LeadInfo> {
  const provider = getAIProvider();

  try {
    const aiResult = await provider.extractLeadInfo(text);
    if (Object.values(aiResult).some((v) => v)) {
      return aiResult;
    }
  } catch {
    // fall through to regex
  }

  return extractLeadInfoRegex(text);
}

export function mergeLeadInfo(existing: LeadInfo, extracted: LeadInfo): LeadInfo {
  return {
    studentName: extracted.studentName || existing.studentName,
    parentName: extracted.parentName || existing.parentName,
    phone: extracted.phone || existing.phone,
    email: extracted.email || existing.email,
    classField: extracted.classField || existing.classField,
    targetExam: extracted.targetExam || existing.targetExam,
  };
}

function getOrdinalSuffix(n: number): string {
  if (n >= 11 && n <= 13) return "th";
  switch (n % 10) {
    case 1: return "st";
    case 2: return "nd";
    case 3: return "rd";
    default: return "th";
  }
}
