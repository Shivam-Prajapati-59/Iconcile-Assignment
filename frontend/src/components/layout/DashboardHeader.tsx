import MonthSelector from "@/components/common/MonthSelector";

interface DashboardHeaderProps {
  month: string;
  onMonthChange: (month: string) => void;
}

export default function DashboardHeader({ month, onMonthChange }: DashboardHeaderProps) {
  return (
    <header className="flex h-14 shrink-0 flex-wrap items-center justify-between gap-4 border-b border-border px-5">
      <div className="min-w-0">
        <h2 className="text-base font-semibold leading-tight">Dashboard</h2>
        <p className="truncate text-xs text-muted-foreground">
          Spending overview for the selected month
        </p>
      </div>
      <MonthSelector value={month} onChange={onMonthChange} />
    </header>
  );
}
