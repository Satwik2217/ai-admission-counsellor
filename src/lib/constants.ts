export const ORGANIZATION_COOKIE = "ai-ac:active-org";

export const ROLES = {
  SUPER_ADMIN: "SUPER_ADMIN",
  OWNER: "OWNER",
  STAFF: "STAFF",
} as const;

export const SUBSCRIPTION_PLANS = {
  FREE: "free",
  STARTER: "starter",
  PROFESSIONAL: "professional",
  ENTERPRISE: "enterprise",
} as const;

export const ROUTES = {
  HOME: "/",
  SIGN_IN: "/sign-in",
  SIGN_UP: "/sign-up",
  DASHBOARD: "/dashboard",
  SETTINGS: "/dashboard/settings",
  SETTINGS_GENERAL: "/dashboard/settings/general",
  SETTINGS_MEMBERS: "/dashboard/settings/members",
  SETTINGS_BILLING: "/dashboard/settings/billing",
} as const;
