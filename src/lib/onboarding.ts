export interface InstituteInfo {
  phone: string;
  email: string;
  website: string;
  address: string;
}

export interface CourseData {
  id?: string;
  name: string;
  description: string;
  duration: string;
  fees?: FeeData[];
}

export interface FeeData {
  id?: string;
  courseId: string;
  amount: number;
  discount: number;
}

export interface WorkingHours {
  openingTime: string;
  closingTime: string;
}

export interface AdmissionInfo {
  admissionProcess: string;
  documentsRequired: string;
}

export interface GreetingInfo {
  greetingMessage: string;
}

export interface OnboardingState {
  phone: string;
  email: string;
  website: string;
  address: string;
  openingTime: string;
  closingTime: string;
  admissionProcess: string;
  documentsRequired: string;
  greetingMessage: string;
  courses: CourseData[];
  onboardingComplete: boolean;
}

export const STEPS = [
  { id: "institute", title: "Institute Info", description: "Basic information about your institute" },
  { id: "courses", title: "Courses", description: "Add the courses you offer" },
  { id: "fees", title: "Fees", description: "Set fee structure for each course" },
  { id: "hours", title: "Working Hours", description: "Your institute's operating hours" },
  { id: "admission", title: "Admission Info", description: "Admission process and requirements" },
  { id: "greeting", title: "Greeting Message", description: "Welcome message for students" },
] as const;

export function validateInstituteInfo(data: Partial<InstituteInfo>): Record<string, string> {
  const errors: Record<string, string> = {};
  if (!data.phone?.trim()) errors.phone = "Phone number is required";
  else if (!/^[+\d\s()-]{7,20}$/.test(data.phone)) errors.phone = "Invalid phone number";
  if (!data.email?.trim()) errors.email = "Email is required";
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) errors.email = "Invalid email address";
  if (data.website?.trim() && !/^https?:\/\/.+/.test(data.website)) errors.website = "URL must start with http:// or https://";
  if (!data.address?.trim()) errors.address = "Address is required";
  return errors;
}

export function validateCourse(data: Partial<CourseData>): Record<string, string> {
  const errors: Record<string, string> = {};
  if (!data.name?.trim()) errors.name = "Course name is required";
  if (!data.duration?.trim()) errors.duration = "Duration is required";
  return errors;
}

export function validateFee(data: Partial<FeeData>): Record<string, string> {
  const errors: Record<string, string> = {};
  if (!data.courseId) errors.courseId = "Course is required";
  if (!data.amount || data.amount <= 0) errors.amount = "Fee amount must be greater than 0";
  if (data.discount && (data.discount < 0 || data.discount > 100)) errors.discount = "Discount must be between 0 and 100";
  return errors;
}

export function validateWorkingHours(data: Partial<WorkingHours>): Record<string, string> {
  const errors: Record<string, string> = {};
  if (!data.openingTime) errors.openingTime = "Opening time is required";
  if (!data.closingTime) errors.closingTime = "Closing time is required";
  if (data.openingTime && data.closingTime && data.openingTime >= data.closingTime) {
    errors.closingTime = "Closing time must be after opening time";
  }
  return errors;
}

export function validateAdmissionInfo(data: Partial<AdmissionInfo>): Record<string, string> {
  const errors: Record<string, string> = {};
  if (!data.admissionProcess?.trim()) errors.admissionProcess = "Admission process is required";
  if (!data.documentsRequired?.trim()) errors.documentsRequired = "Documents required is required";
  return errors;
}

export function validateGreeting(data: Partial<GreetingInfo>): Record<string, string> {
  const errors: Record<string, string> = {};
  if (!data.greetingMessage?.trim()) errors.greetingMessage = "Greeting message is required";
  else if (data.greetingMessage.length < 10) errors.greetingMessage = "Greeting message should be at least 10 characters";
  return errors;
}

export function hasStepErrors(stepId: string, state: OnboardingState): boolean {
  switch (stepId) {
    case "institute":
      return Object.keys(validateInstituteInfo(state)).length > 0;
    case "courses":
      return state.courses.length === 0;
    case "fees":
      return state.courses.some((c) => {
        const fee = state.courses.find((f) => f.id === c.id);
        return !fee;
      });
    case "hours":
      return Object.keys(validateWorkingHours(state)).length > 0;
    case "admission":
      return Object.keys(validateAdmissionInfo(state)).length > 0;
    case "greeting":
      return Object.keys(validateGreeting(state)).length > 0;
    default:
      return false;
  }
}
