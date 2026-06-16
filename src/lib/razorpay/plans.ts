export interface PlanConfig {
  id: string;
  name: string;
  price: number;
  description: string;
  features: string[];
  maxStudents: number;
  maxStaff: number;
}

export const PLANS: PlanConfig[] = [
  {
    id: "free",
    name: "Free",
    price: 0,
    description: "For small institutes getting started",
    features: ["Up to 50 students", "Basic AI counseling", "1 staff member"],
    maxStudents: 50,
    maxStaff: 1,
  },
  {
    id: "starter",
    name: "Starter",
    price: 99900,
    description: "For growing coaching centers",
    features: ["Up to 200 students", "Advanced AI counseling", "5 staff members", "Analytics"],
    maxStudents: 200,
    maxStaff: 5,
  },
  {
    id: "professional",
    name: "Professional",
    price: 299900,
    description: "For established training institutes",
    features: ["Unlimited students", "Full AI counseling suite", "Unlimited staff", "Priority support"],
    maxStudents: 999999,
    maxStaff: 999999,
  },
];

export function getPlanById(id: string): PlanConfig | undefined {
  return PLANS.find((p) => p.id === id);
}

export function formatPrice(paise: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(paise / 100);
}
