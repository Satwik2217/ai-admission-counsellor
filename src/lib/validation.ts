export function validateRequired(value: unknown, field: string): string | null {
  if (value === undefined || value === null || (typeof value === "string" && !value.trim())) {
    return `${field} is required`;
  }
  return null;
}

export function validateEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function validatePhone(phone: string): boolean {
  return /^[\d\s+\-()]{7,20}$/.test(phone);
}

export function validateTime(time: string): boolean {
  return /^([01]\d|2[0-3]):[0-5]\d$/.test(time);
}

export function validateDate(date: string): boolean {
  const d = new Date(date);
  return !isNaN(d.getTime());
}

export function validateSlug(slug: string): boolean {
  return /^[a-z0-9-]+$/.test(slug) && slug.length >= 2 && slug.length <= 60;
}

export function sanitizeString(input: string): string {
  return input
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;")
    .trim();
}

export function validateFields(data: Record<string, unknown>, rules: Record<string, { required?: boolean; type?: string; validate?: (v: unknown) => boolean }>): Record<string, string> {
  const errors: Record<string, string> = {};

  for (const [field, rule] of Object.entries(rules)) {
    const value = data[field];

    if (rule.required) {
      const err = validateRequired(value, field);
      if (err) {
        errors[field] = err;
        continue;
      }
    }

    if (value !== undefined && value !== null && value !== "") {
      if (rule.type === "email" && !validateEmail(value as string)) {
        errors[field] = `Invalid email format`;
      }
      if (rule.type === "phone" && !validatePhone(value as string)) {
        errors[field] = `Invalid phone format`;
      }
      if (rule.type === "time" && !validateTime(value as string)) {
        errors[field] = `Invalid time format`;
      }
      if (rule.validate && !rule.validate(value)) {
        errors[field] = `Invalid ${field}`;
      }
    }
  }

  return errors;
}
