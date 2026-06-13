import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Plus, Trash2 } from "lucide-react";
import type { CourseData } from "@/lib/onboarding";
import { validateCourse } from "@/lib/onboarding";

interface CoursesStepProps {
  courses: CourseData[];
  onChange: (courses: CourseData[]) => void;
}

export function CoursesStep({ courses, onChange }: CoursesStepProps) {
  const [newCourse, setNewCourse] = useState<CourseData>({
    name: "",
    description: "",
    duration: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  function handleAdd() {
    const validationErrors = validateCourse(newCourse);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }
    onChange([...courses, { ...newCourse }]);
    setNewCourse({ name: "", description: "", duration: "" });
    setErrors({});
  }

  function handleRemove(index: number) {
    onChange(courses.filter((_, i) => i !== index));
  }

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-semibold">Courses Offered</h2>
        <p className="text-sm text-muted-foreground">Add the courses your institute offers.</p>
      </div>

      <div className="rounded-lg border p-4 space-y-3">
        <div className="space-y-2">
          <Label htmlFor="course-name">Course Name</Label>
          <Input
            id="course-name"
            placeholder="e.g., JEE Advanced"
            value={newCourse.name}
            onChange={(e) => setNewCourse({ ...newCourse, name: e.target.value })}
          />
          {errors.name && <p className="text-xs text-destructive">{errors.name}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="course-desc">Description (optional)</Label>
          <Input
            id="course-desc"
            placeholder="e.g., Comprehensive IIT-JEE preparation"
            value={newCourse.description}
            onChange={(e) => setNewCourse({ ...newCourse, description: e.target.value })}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="course-duration">Duration</Label>
          <Input
            id="course-duration"
            placeholder="e.g., 2 Years"
            value={newCourse.duration}
            onChange={(e) => setNewCourse({ ...newCourse, duration: e.target.value })}
          />
          {errors.duration && <p className="text-xs text-destructive">{errors.duration}</p>}
        </div>
        <Button type="button" variant="outline" size="sm" onClick={handleAdd} className="gap-1">
          <Plus className="h-3 w-3" /> Add Course
        </Button>
      </div>

      {courses.length === 0 && (
        <p className="text-sm text-muted-foreground">No courses added yet.</p>
      )}

      <div className="space-y-2">
        {courses.map((course, index) => (
          <Card key={index}>
            <CardContent className="flex items-center justify-between p-3">
              <div>
                <p className="text-sm font-medium">{course.name}</p>
                <p className="text-xs text-muted-foreground">
                  {course.duration}{course.description ? ` — ${course.description}` : ""}
                </p>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => handleRemove(index)}
              >
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
