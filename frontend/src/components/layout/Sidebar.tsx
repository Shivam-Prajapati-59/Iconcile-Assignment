import { useRef, useState } from "react";
import { CirclePlus, ReceiptText, Tags, Upload } from "lucide-react";

import RulesPanel from "@/components/rules/RulesPanel";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Section = "add" | "import" | "rules";

const NAV_ITEMS: { id: Section; label: string; icon: typeof CirclePlus }[] = [
  { id: "add", label: "Add Expense", icon: CirclePlus },
  { id: "import", label: "Import CSV", icon: Upload },
  { id: "rules", label: "Vendor Rules", icon: Tags },
];

interface SidebarProps {
  onAddExpense: () => void;
  onImportCsv: () => void;
}

export default function Sidebar({ onAddExpense, onImportCsv }: SidebarProps) {
  const [active, setActive] = useState<Section>("rules");
  const rulesRef = useRef<HTMLDivElement>(null);

  const openSection = (id: Section) => {
    setActive(id);
    if (id === "add") onAddExpense();
    if (id === "import") onImportCsv();
    if (id === "rules") rulesRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <aside className="flex w-full shrink-0 flex-col overflow-hidden border-b border-border bg-sidebar lg:h-full lg:w-80 lg:border-b-0 lg:border-r">
      <div className="flex h-14 shrink-0 items-center gap-3 border-b border-border px-4">
        <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground">
          <ReceiptText className="size-4" />
        </div>
        <div className="min-w-0">
          <h1 className="truncate text-sm font-semibold leading-tight">Expense Manager</h1>
          <p className="truncate text-xs text-muted-foreground">
            Track, categorize and import daily expenses
          </p>
        </div>
      </div>

      <div className="flex min-h-0 flex-1 flex-col gap-5 overflow-hidden px-3 py-4">
        <nav className="shrink-0 space-y-1" aria-label="Actions">
          {NAV_ITEMS.map((item) => (
            <Button
              key={item.id}
              type="button"
              variant="outline"
              onClick={() => openSection(item.id)}
              aria-current={active === item.id ? "true" : undefined}
              className={cn(
                "w-full justify-start gap-2.5 px-3",
                active === item.id
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-sidebar-foreground hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground",
              )}
            >
              <item.icon className="size-4 shrink-0" />
              {item.label}
            </Button>
          ))}
        </nav>
        <div ref={rulesRef} className="flex min-h-0 flex-1 scroll-mt-2 flex-col">
          <RulesPanel />
        </div>
      </div>
    </aside>
  );
}
