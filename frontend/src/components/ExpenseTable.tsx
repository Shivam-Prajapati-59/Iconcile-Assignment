import { useQuery } from "@tanstack/react-query";
import { AlertTriangle } from "lucide-react";

import { api } from "@/lib/api";
import { formatDateTime, formatMoney } from "@/lib/format";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface ExpenseTableProps {
  month: string;
}

export default function ExpenseTable({ month }: ExpenseTableProps) {
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["expenses", month],
    queryFn: () => api.listExpenses(month),
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Expenses — {month}</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading && <p className="py-8 text-center text-muted-foreground">Loading…</p>}
        {isError && (
          <p className="py-8 text-center text-destructive">
            {error instanceof Error ? error.message : "Failed to load expenses"}
          </p>
        )}
        {!isLoading && !isError && data && data.length === 0 && (
          <p className="py-8 text-center text-muted-foreground">
            No expenses recorded for this month.
          </p>
        )}
        {data && data.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-muted-foreground">
                  <th className="pb-2 pr-3 font-medium">Date</th>
                  <th className="pb-2 pr-3 font-medium">Vendor</th>
                  <th className="pb-2 pr-3 font-medium">Description</th>
                  <th className="pb-2 pr-3 font-medium">Category</th>
                  <th className="pb-2 pr-3 font-medium">Type</th>
                  <th className="pb-2 text-right font-medium">Amount</th>
                </tr>
              </thead>
              <tbody>
                {data.map((e) => (
                  <tr
                    key={e.id}
                    className={`border-b border-border/60 last:border-0 ${
                      e.anomaly ? "bg-destructive/5" : ""
                    }`}
                  >
                    <td className="py-2 pr-3 whitespace-nowrap">{formatDateTime(e.occurredAt)}</td>
                    <td className="py-2 pr-3">
                      <span className="flex items-center gap-1.5">
                        {e.vendorName}
                        {e.anomaly && (
                          <Badge className="bg-destructive/10 text-destructive">
                            <AlertTriangle className="size-3" />
                            Anomaly
                          </Badge>
                        )}
                      </span>
                    </td>
                    <td className="py-2 pr-3 text-muted-foreground">{e.description ?? "—"}</td>
                    <td className="py-2 pr-3">{e.category}</td>
                    <td className="py-2 pr-3 text-muted-foreground">{e.transactionType}</td>
                    <td
                      className={`py-2 text-right whitespace-nowrap font-medium ${
                        e.transactionType === "INCOME" ? "text-emerald-600" : ""
                      }`}
                    >
                      {formatMoney(e.amount, e.currency)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
