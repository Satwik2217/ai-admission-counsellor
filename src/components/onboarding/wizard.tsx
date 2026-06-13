"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { StepIndicator } from "./step-indicator";
import { InstituteInfoStep } from "./steps/institute-info";
import { CoursesStep } from "./steps/courses";
import { FeesStep } from "./steps/fees";
import { WorkingHoursStep } from "./steps/working-hours";
import { AdmissionInfoStep } from "./steps/admission-info";
import { GreetingStep } from "./steps/greeting";
import {
  STEPS,
  validateInstituteInfo,
  validateWorkingHours,
  validateAdmissionInfo,
  validateGreeting,
  type OnboardingState,
  type CourseData,
} from "@/lib/onboarding";
import { CheckCircle2, ChevronLeft, ChevronRight, Loader2, Save } from "lucide-react";

const emptyState: OnboardingState = {
  phone: "",
  email: "",
  website: "",
  address: "",
  openingTime: "",
  closingTime: "",
  admissionProcess: "",
  documentsRequired: "",
  greetingMessage: "",
  courses: [],
  onboardingComplete: false,
};

export function OnboardingWizard() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [data, setData] = useState<OnboardingState>(emptyState);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [finished, setFinished] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/organizations/onboarding");
        if (res.ok) {
          const json = await res.json();
          setData({
            phone: json.phone || "",
            email: json.email || "",
            website: json.website || "",
            address: json.address || "",
            openingTime: json.openingTime || "",
            closingTime: json.closingTime || "",
            admissionProcess: json.admissionProcess || "",
            documentsRequired: json.documentsRequired || "",
            greetingMessage: json.greetingMessage || "",
            courses: json.courses || [],
            onboardingComplete: json.onboardingComplete || false,
          });
          if (json.onboardingComplete) {
            setFinished(true);
          }
        }
      } catch {
        // continue with empty state
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const saveOrgFields = useCallback(async (fields: Record<string, unknown>) => {
    setSaveStatus("saving");
    try {
      const res = await fetch("/api/organizations/onboarding", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(fields),
      });
      if (!res.ok) throw new Error("Save failed");
      setSaveStatus("saved");
      setTimeout(() => setSaveStatus("idle"), 2000);
    } catch {
      setSaveStatus("error");
    }
  }, []);

  async function handleNext() {
    let stepErrors: Record<string, string> = {};
    const currentStepId = STEPS[step].id;

    switch (currentStepId) {
      case "institute":
        stepErrors = validateInstituteInfo(data);
        break;
      case "courses":
        if (data.courses.length === 0) {
          stepErrors = { courses: "Add at least one course" };
        }
        break;
      case "hours":
        stepErrors = validateWorkingHours(data);
        break;
      case "admission":
        stepErrors = validateAdmissionInfo(data);
        break;
      case "greeting":
        stepErrors = validateGreeting(data);
        break;
    }

    setErrors(stepErrors);
    if (Object.keys(stepErrors).length > 0) return;

    setSaving(true);
    try {
      const stepId = STEPS[step].id;
      const fieldsToSave: Record<string, unknown> = {};

      if (stepId === "institute") {
        fieldsToSave.phone = data.phone;
        fieldsToSave.email = data.email;
        fieldsToSave.website = data.website;
        fieldsToSave.address = data.address;
      } else if (stepId === "hours") {
        fieldsToSave.openingTime = data.openingTime;
        fieldsToSave.closingTime = data.closingTime;
      } else if (stepId === "admission") {
        fieldsToSave.admissionProcess = data.admissionProcess;
        fieldsToSave.documentsRequired = data.documentsRequired;
      } else if (stepId === "greeting") {
        fieldsToSave.greetingMessage = data.greetingMessage;
      }

      if (Object.keys(fieldsToSave).length > 0) {
        await saveOrgFields(fieldsToSave);
      }

      if (step < STEPS.length - 1) {
        setStep(step + 1);
        setErrors({});
      } else {
        await saveOrgFields({ onboardingComplete: true });
        setFinished(true);
      }
    } finally {
      setSaving(false);
    }
  }

  async function handleFinish() {
    router.push("/dashboard");
    router.refresh();
  }

  function handlePrev() {
    if (step > 0) {
      setStep(step - 1);
      setErrors({});
    }
  }

  function handleFieldChange(field: string, value: string) {
    setData((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => {
      const next = { ...prev };
      delete next[field];
      return next;
    });
  }

  function handleCoursesChange(courses: CourseData[]) {
    setData((prev) => ({ ...prev, courses }));
  }

  async function handleSaveCourses() {
    setSaving(true);
    try {
      for (const course of data.courses) {
        if (!course.id) {
          const res = await fetch("/api/courses", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(course),
          });
          if (res.ok) {
            const json = await res.json();
            course.id = json.course.id;
          }
        }
      }
      setSaveStatus("saved");
      setTimeout(() => setSaveStatus("idle"), 2000);
    } catch {
      setSaveStatus("error");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex h-40 items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (finished) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <CheckCircle2 className="h-16 w-16 text-primary" />
        <h2 className="mt-4 text-2xl font-bold">All Set!</h2>
        <p className="mt-2 text-muted-foreground">
          Your institute is configured and ready to go.
        </p>
        <Button onClick={handleFinish} className="mt-6">
          Go to Dashboard
        </Button>
      </div>
    );
  }

  const stepId = STEPS[step].id;
  const isFirst = step === 0;
  const isLast = step === STEPS.length - 1;

  return (
    <div className="mx-auto max-w-2xl">
      <StepIndicator steps={STEPS} currentStep={step} />

      <div className="rounded-lg border bg-card p-6 shadow-sm">
        <div className="min-h-[250px]">
          {stepId === "institute" && (
            <InstituteInfoStep
              data={data}
              errors={errors}
              onChange={handleFieldChange}
            />
          )}
          {stepId === "courses" && (
            <CoursesStep
              courses={data.courses}
              onChange={handleCoursesChange}
            />
          )}
          {stepId === "fees" && (
            <FeesStep
              courses={data.courses}
              onChange={handleCoursesChange}
            />
          )}
          {stepId === "hours" && (
            <WorkingHoursStep
              data={data}
              errors={errors}
              onChange={handleFieldChange}
            />
          )}
          {stepId === "admission" && (
            <AdmissionInfoStep
              data={data}
              errors={errors}
              onChange={handleFieldChange}
            />
          )}
          {stepId === "greeting" && (
            <GreetingStep
              data={data}
              errors={errors}
              onChange={handleFieldChange}
            />
          )}
        </div>

        <div className="mt-6 flex items-center justify-between border-t pt-4">
          <div className="flex items-center gap-2">
            {saveStatus === "saving" && (
              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                <Loader2 className="h-3 w-3 animate-spin" /> Saving...
              </span>
            )}
            {saveStatus === "saved" && (
              <span className="flex items-center gap-1 text-xs text-emerald-600">
                <Save className="h-3 w-3" /> Saved
              </span>
            )}
            {saveStatus === "error" && (
              <span className="text-xs text-destructive">Save failed</span>
            )}
          </div>

          <div className="flex gap-2">
            {!isFirst && (
              <Button
                type="button"
                variant="outline"
                onClick={handlePrev}
                disabled={saving}
              >
                <ChevronLeft className="mr-1 h-4 w-4" /> Previous
              </Button>
            )}
            {isLast ? (
              <Button type="button" onClick={handleNext} disabled={saving}>
                {saving ? (
                  <>
                    <Loader2 className="mr-1 h-4 w-4 animate-spin" /> Finishing...
                  </>
                ) : (
                  "Finish Setup"
                )}
              </Button>
            ) : (
              <Button type="button" onClick={handleNext} disabled={saving}>
                {saving ? (
                  <>
                    <Loader2 className="mr-1 h-4 w-4 animate-spin" /> Saving...
                  </>
                ) : (
                  <>
                    Next <ChevronRight className="ml-1 h-4 w-4" />
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </div>

      <p className="mt-4 text-center text-xs text-muted-foreground">
        Step {step + 1} of {STEPS.length} — {STEPS[step].description}
      </p>
    </div>
  );
}
