import {
  SCORING_RULES_V2,
  CATEGORY_THRESHOLDS,
  SOURCE_BOOSTS,
  LEAD_ACTIVITY_TYPES,
} from "./constants";

function countByType(types: string[], target: string): number {
  return types.filter((t) => t === target).length;
}

function diminishingValue(count: number, firstValue: number, repeatValue: number): number {
  if (count <= 0) return 0;
  if (count === 1) return firstValue;
  return firstValue + (count - 1) * repeatValue;
}

export function calculateLeadScore(params: {
  phone?: string | null;
  email?: string | null;
  activityTypes: string[];
  source?: string | null;
  lastActivityAt?: Date | null;
}): number {
  let score = 0;

  if (params.phone) score += SCORING_RULES_V2.PHONE_PROVIDED;
  if (params.email) score += SCORING_RULES_V2.EMAIL_PROVIDED;

  const feesCount = countByType(params.activityTypes, LEAD_ACTIVITY_TYPES.ASKED_ABOUT_FEES);
  const admissionsCount = countByType(params.activityTypes, LEAD_ACTIVITY_TYPES.ASKED_ABOUT_ADMISSIONS);
  const appointmentCount = countByType(params.activityTypes, LEAD_ACTIVITY_TYPES.BOOKED_APPOINTMENT);

  score += diminishingValue(feesCount, SCORING_RULES_V2.FIRST_FEES_QUESTION, SCORING_RULES_V2.REPEAT_FEES_QUESTION);
  score += diminishingValue(admissionsCount, SCORING_RULES_V2.FIRST_ADMISSIONS_QUESTION, SCORING_RULES_V2.REPEAT_ADMISSIONS_QUESTION);
  if (appointmentCount > 0) score += SCORING_RULES_V2.BOOKED_APPOINTMENT;

  if (params.source && SOURCE_BOOSTS[params.source]) {
    score += SOURCE_BOOSTS[params.source];
  }

  if (params.lastActivityAt) {
    const hoursSince = (Date.now() - params.lastActivityAt.getTime()) / (1000 * 60 * 60);
    if (hoursSince < 24) score += SCORING_RULES_V2.RECENCY_24H;
    else if (hoursSince < 7 * 24) score += SCORING_RULES_V2.RECENCY_7D;
    else if (hoursSince < 30 * 24) score += SCORING_RULES_V2.RECENCY_30D;
  }

  return score;
}

export function getCategory(score: number): string {
  if (score >= CATEGORY_THRESHOLDS.VIP) return "vip";
  if (score >= CATEGORY_THRESHOLDS.HOT) return "hot";
  if (score >= CATEGORY_THRESHOLDS.WARM) return "warm";
  return "cold";
}
