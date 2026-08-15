import { useState } from "react";

import { QueryProvider } from "@/providers/QueryProvider";
import Sidebar from "@/components/layout/Sidebar";
import DashboardHeader from "@/components/layout/DashboardHeader";
import DashboardPanel from "@/components/dashboard/DashboardPanel";
import ExpenseTable from "@/components/expenses/ExpenseTable";
import ExpenseForm from "@/components/expenses/ExpenseForm";
import CsvImportPanel from "@/components/import/CsvImportPanel";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { currentMonth } from "@/lib/format";

export default function App() {
  const [month, setMonth] = useState(currentMonth());
  const [expenseOpen, setExpenseOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);

  return (
    <QueryProvider>
      <div className="flex h-dvh flex-col overflow-y-auto bg-background text-foreground lg:flex-row lg:overflow-hidden">
        <Sidebar
          onAddExpense={() => setExpenseOpen(true)}
          onImportCsv={() => setImportOpen(true)}
        />

        <main className="flex min-w-0 flex-col lg:min-h-0 lg:flex-1 lg:overflow-hidden">
          <DashboardHeader month={month} onMonthChange={setMonth} />
          <div className="flex flex-col gap-4 p-5 lg:min-h-0 lg:flex-1 lg:overflow-hidden">
            <div className="shrink-0">
              <DashboardPanel month={month} />
            </div>
            <ExpenseTable month={month} />
          </div>
        </main>
      </div>

      <Dialog open={expenseOpen} onOpenChange={setExpenseOpen}>
        <DialogContent className="p-0 sm:max-w-md">
          <DialogTitle className="sr-only">Add Expense</DialogTitle>
          <ExpenseForm onSuccess={() => setExpenseOpen(false)} />
        </DialogContent>
      </Dialog>

      <Dialog open={importOpen} onOpenChange={setImportOpen}>
        <DialogContent className="p-0 sm:max-w-md">
          <DialogTitle className="sr-only">Import from CSV</DialogTitle>
          <CsvImportPanel />
        </DialogContent>
      </Dialog>
    </QueryProvider>
  );
}
