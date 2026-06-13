import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface InstituteInfoProps {
  data: {
    phone: string;
    email: string;
    website: string;
    address: string;
  };
  errors: Record<string, string>;
  onChange: (field: string, value: string) => void;
}

export function InstituteInfoStep({ data, errors, onChange }: InstituteInfoProps) {
  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-semibold">Institute Information</h2>
        <p className="text-sm text-muted-foreground">Tell us about your institute.</p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="phone">Phone Number</Label>
        <Input
          id="phone"
          type="tel"
          placeholder="+91 98765 43210"
          value={data.phone}
          onChange={(e) => onChange("phone", e.target.value)}
        />
        {errors.phone && <p className="text-xs text-destructive">{errors.phone}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="email">Email Address</Label>
        <Input
          id="email"
          type="email"
          placeholder="contact@institute.com"
          value={data.email}
          onChange={(e) => onChange("email", e.target.value)}
        />
        {errors.email && <p className="text-xs text-destructive">{errors.email}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="website">Website (optional)</Label>
        <Input
          id="website"
          type="url"
          placeholder="https://institute.com"
          value={data.website}
          onChange={(e) => onChange("website", e.target.value)}
        />
        {errors.website && <p className="text-xs text-destructive">{errors.website}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="address">Address</Label>
        <Input
          id="address"
          placeholder="123, Main Street, City, State"
          value={data.address}
          onChange={(e) => onChange("address", e.target.value)}
        />
        {errors.address && <p className="text-xs text-destructive">{errors.address}</p>}
      </div>
    </div>
  );
}
