import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface MonthSelectorProps {
  value: string;
  onChange: (month: string) => void;
}

export default function MonthSelector({ value, onChange }: MonthSelectorProps) {
  return (
    <div className="flex items-center gap-3">
      <Label htmlFor="month" className="text-base">
        Month
      </Label>
      <Input
        id="month"
        type="month"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-44"
      />
    </div>
  );
}
