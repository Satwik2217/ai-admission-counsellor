import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface AdmissionInfoStepProps {
  data: {
    admissionProcess: string;
    documentsRequired: string;
  };
  errors: Record<string, string>;
  onChange: (field: string, value: string) => void;
}

export function AdmissionInfoStep({ data, errors, onChange }: AdmissionInfoStepProps) {
  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-semibold">Admission Information</h2>
        <p className="text-sm text-muted-foreground">
          Describe your admission process and required documents.
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="admission-process">Admission Process</Label>
        <textarea
          id="admission-process"
          className="flex min-h-[80px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          placeholder="Describe the admission process step by step..."
          value={data.admissionProcess}
          onChange={(e) => onChange("admissionProcess", e.target.value)}
        />
        {errors.admissionProcess && <p className="text-xs text-destructive">{errors.admissionProcess}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="documents-required">Documents Required</Label>
        <textarea
          id="documents-required"
          className="flex min-h-[80px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          placeholder="List the documents required for admission..."
          value={data.documentsRequired}
          onChange={(e) => onChange("documentsRequired", e.target.value)}
        />
        {errors.documentsRequired && <p className="text-xs text-destructive">{errors.documentsRequired}</p>}
      </div>
    </div>
  );
}
