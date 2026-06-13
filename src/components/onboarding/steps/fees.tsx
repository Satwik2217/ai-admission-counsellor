import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { CourseData } from "@/lib/onboarding";

interface FeesStepProps {
  courses: CourseData[];
  onChange: (courses: CourseData[]) => void;
}

export function FeesStep({ courses, onChange }: FeesStepProps) {
  const [selectedCourseIdx, setSelectedCourseIdx] = useState<number | null>(null);
  const [amount, setAmount] = useState("");
  const [discount, setDiscount] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  const selectedCourse = selectedCourseIdx !== null ? courses[selectedCourseIdx] : null;

  function handleCourseSelect(idx: number | null) {
    setSelectedCourseIdx(idx);
    setAmount("");
    setDiscount("");
    setErrors({});
    if (idx !== null && courses[idx]?.fees?.[0]) {
      setAmount(String(courses[idx].fees![0].amount));
      setDiscount(String(courses[idx].fees![0].discount));
    }
  }

  function handleSaveFee() {
    if (selectedCourseIdx === null) {
      setErrors({ courseId: "Select a course" });
      return;
    }

    const feeAmount = parseInt(amount);
    if (!feeAmount || feeAmount <= 0) {
      setErrors({ amount: "Fee amount must be greater than 0" });
      return;
    }

    const feeDiscount = parseInt(discount) || 0;
    if (feeDiscount < 0 || feeDiscount > 100) {
      setErrors({ discount: "Discount must be between 0 and 100" });
      return;
    }

    const updated = [...courses];
    updated[selectedCourseIdx] = {
      ...updated[selectedCourseIdx],
      fees: [
        {
          courseId: updated[selectedCourseIdx].id || "",
          amount: feeAmount,
          discount: feeDiscount,
        },
      ],
    };
    onChange(updated);
    setErrors({});
  }

  const coursesWithFees = courses.filter((c) => c.fees && c.fees.length > 0);

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-semibold">Fee Structure</h2>
        <p className="text-sm text-muted-foreground">Set fees and discounts for each course.</p>
      </div>

      <div className="rounded-lg border p-4 space-y-3">
        <div className="space-y-2">
          <Label>Course</Label>
          <Select
            value={selectedCourseIdx !== null ? String(selectedCourseIdx) : ""}
            onValueChange={(v) => handleCourseSelect(v ? parseInt(v) : null)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select a course" />
            </SelectTrigger>
            <SelectContent>
              {courses.map((course, idx) => (
                <SelectItem key={idx} value={String(idx)}>
                  {course.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.courseId && <p className="text-xs text-destructive">{errors.courseId}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="fee-amount">Fee Amount (₹)</Label>
          <Input
            id="fee-amount"
            type="number"
            min="0"
            placeholder="e.g., 50000"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
          {errors.amount && <p className="text-xs text-destructive">{errors.amount}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="fee-discount">Discount (%)</Label>
          <Input
            id="fee-discount"
            type="number"
            min="0"
            max="100"
            placeholder="e.g., 10"
            value={discount}
            onChange={(e) => setDiscount(e.target.value)}
          />
          {errors.discount && <p className="text-xs text-destructive">{errors.discount}</p>}
        </div>

        <button
          type="button"
          onClick={handleSaveFee}
          disabled={selectedCourseIdx === null}
          className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
        >
          {selectedCourse?.fees?.length ? "Update Fee" : "Add Fee"}
        </button>
      </div>

      {coursesWithFees.length === 0 && (
        <p className="text-sm text-muted-foreground">No fees configured yet.</p>
      )}

      <div className="space-y-2">
        {coursesWithFees.map((course, idx) => (
          <Card key={idx}>
            <CardContent className="flex items-center justify-between p-3">
              <div>
                <p className="text-sm font-medium">{course.name}</p>
                {course.fees?.map((fee, fi) => (
                  <p key={fi} className="text-xs text-muted-foreground">
                    ₹{fee.amount.toLocaleString()}
                    {fee.discount > 0 && ` (${fee.discount}% off)`}
                  </p>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
