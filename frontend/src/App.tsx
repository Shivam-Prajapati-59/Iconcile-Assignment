import { useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import MonthSelector from "@/components/MonthSelector";
import ExpenseForm from "@/components/ExpenseForm";
import CsvImportPanel from "@/components/CsvImportPanel";
import DashboardPanel from "@/components/DashboardPanel";
import ExpenseTable from "@/components/ExpenseTable";
import RulesPanel from "@/components/RulesPanel";
import { currentMonth } from "@/lib/format";

const queryClient = new QueryClient();

function App() {
  const [month, setMonth] = useState(currentMonth());

  return (
    <QueryClientProvider client={queryClient}>
      <div className="min-h-screen bg-background text-foreground">
        <header className="border-b border-border">
          <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
            <div>
              <h1 className="text-lg font-semibold">Mini Expense Manager</h1>
              <p className="text-sm text-muted-foreground">
                Track daily expenses with automatic categorization and anomaly detection.
              </p>
            </div>
            <MonthSelector value={month} onChange={setMonth} />
          </div>
        </header>

        <main className="mx-auto max-w-6xl space-y-6 px-6 py-6">
          <div className="grid gap-6 lg:grid-cols-3">
            <ExpenseForm />
            <CsvImportPanel />
            <RulesPanel />
          </div>

          <DashboardPanel month={month} />
          <ExpenseTable month={month} />
        </main>
      </div>
    </QueryClientProvider>
  );
}

export default App;
