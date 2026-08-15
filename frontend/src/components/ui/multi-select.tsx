import { cn } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";

interface MultiSelectProps {
  placeholder: string;
  value: string[];
  onChange: (value: string[]) => void;
  options: string[];
  className?: string;
  ariaLabel?: string;
}

export function MultiSelect({
  placeholder,
  value,
  onChange,
  options,
  className,
  ariaLabel,
}: MultiSelectProps) {
  const display =
    value.length === 0
      ? placeholder
      : value.length === 1
        ? value[0]
        : `${value.length} selected`;

  return (
    <Select multiple value={value} onValueChange={onChange}>
      <SelectTrigger
        size="sm"
        aria-label={ariaLabel}
        className={cn("h-7 font-normal", value.length === 0 ? "text-muted-foreground" : "", className)}
      >
        <span className="truncate">{display}</span>
      </SelectTrigger>
      <SelectContent side="bottom" align="start">
        {options.map((opt) => (
          <SelectItem key={opt} value={opt}>
            {opt}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
