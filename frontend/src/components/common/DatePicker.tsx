import { Calendar as CalendarIcon } from "lucide-react";
import { format } from "date-fns";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface DatePickerProps {
  id?: string;
  value: string;
  onChange: (value: string) => void;
}

export default function DatePicker({ id, value, onChange }: DatePickerProps) {
  const date = value ? new Date(`${value}T00:00:00`) : undefined;

  return (
    <Popover>
      <PopoverTrigger
        render={
          <Button
            id={id}
            variant="outline"
            data-empty={!date}
            className="justify-start text-left font-normal data-[empty=true]:text-muted-foreground"
          />
        }
      >
        <CalendarIcon />
        {date ? format(date, "PPP") : <span>Pick a date</span>}
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0">
        <Calendar
          mode="single"
          selected={date}
          onSelect={(selected) => {
            if (selected) onChange(format(selected, "yyyy-MM-dd"));
          }}
          autoFocus
        />
      </PopoverContent>
    </Popover>
  );
}
