"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { KB_CATEGORIES } from "@/lib/knowledge-base";
import { ArrowLeft, Loader2 } from "lucide-react";

export default function NewFAQPage() {
  const router = useRouter();
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [category, setCategory] = useState("");
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  function validate() {
    const errs: Record<string, string> = {};
    if (!question.trim()) errs.question = "Question is required";
    if (!answer.trim()) errs.answer = "Answer is required";
    if (!category) errs.category = "Category is required";
    return errs;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const errs = validate();
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;

    setSaving(true);
    try {
      const res = await fetch("/api/faqs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: question.trim(), answer: answer.trim(), category }),
      });

      if (res.ok) {
        router.push("/dashboard/faqs");
        router.refresh();
      } else {
        const data = await res.json();
        setErrors({ form: data.error || "Failed to save" });
      }
    } catch {
      setErrors({ form: "Something went wrong" });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Add FAQ</h1>
          <p className="text-muted-foreground">Add a new frequently asked question.</p>
        </div>
      </div>
      <Separator />

      <Card className="max-w-2xl">
        <CardContent className="pt-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="question">Question</Label>
              <Input
                id="question"
                placeholder="e.g., What is the admission process?"
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
              />
              {errors.question && <p className="text-xs text-destructive">{errors.question}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="answer">Answer</Label>
              <textarea
                id="answer"
                className="flex min-h-[120px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm"
                placeholder="Write the answer here..."
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
              />
              {errors.answer && <p className="text-xs text-destructive">{errors.answer}</p>}
            </div>

            <div className="space-y-2">
              <Label>Category</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent>
                  {KB_CATEGORIES.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>{cat.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.category && <p className="text-xs text-destructive">{errors.category}</p>}
            </div>

            {errors.form && <p className="text-sm text-destructive">{errors.form}</p>}

            <div className="flex gap-3">
              <Button type="submit" disabled={saving}>
                {saving ? <><Loader2 className="mr-1 h-4 w-4 animate-spin" /> Saving...</> : "Save FAQ"}
              </Button>
              <Button type="button" variant="outline" onClick={() => router.back()}>
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
