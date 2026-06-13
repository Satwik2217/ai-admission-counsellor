import { SCORING_RULES, CATEGORY_THRESHOLDS, LEAD_ACTIVITY_TYPES } from "./constants";

export function calculateLeadScore(params: {
  phone?: string | null;
  email?: string | null;
  activityTypes: string[];
}): number {
  let score = 0;

  if (params.phone) score += SCORING_RULES.PHONE_PROVIDED;
  if (params.email) score += SCORING_RULES.EMAIL_PROVIDED;

  for (const type of params.activityTypes) {
    switch (type) {
      case LEAD_ACTIVITY_TYPES.ASKED_ABOUT_FEES:
        score += SCORING_RULES.ASKED_ABOUT_FEES;
        break;
      case LEAD_ACTIVITY_TYPES.ASKED_ABOUT_ADMISSIONS:
        score += SCORING_RULES.ASKED_ABOUT_ADMISSIONS;
        break;
      case LEAD_ACTIVITY_TYPES.BOOKED_APPOINTMENT:
        score += SCORING_RULES.BOOKED_APPOINTMENT;
        break;
    }
  }

  return score;
}

export function getCategory(score: number): string {
  if (score >= CATEGORY_THRESHOLDS.HOT) return "hot";
  if (score >= CATEGORY_THRESHOLDS.WARM) return "warm";
  return "cold";
}
