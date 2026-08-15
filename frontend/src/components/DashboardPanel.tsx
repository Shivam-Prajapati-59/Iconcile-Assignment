import { useQuery } from "@tanstack/react-query";
import { AlertTriangle, TrendingUp, Wallet } from "lucide-react";

import { api } from "@/lib/api";
import { formatDateTime, formatMoney } from "@/lib/format";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface DashboardPanelProps {
  month: string;
}

function LoadingCard() {
  return (
    <Card>
      <CardContent className="py-8 text-center text-muted-foreground">Loading…</CardContent>
    </Card>
  );
}

export default function DashboardPanel({ month }: DashboardPanelProps) {
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["dashboard", month],
    queryFn: () => api.dashboard(month),
  });

  if (isLoading) return <LoadingCard />;
  if (isError) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-destructive">
          {error instanceof Error ? error.message : "Failed to load dashboard"}
        </CardContent>
      </Card>
    );
  }
  if (!data) return null;

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wallet className="size-4" />
            Total Spend
          </CardTitle>
          <CardDescription>{month}</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-semibold">{formatMoney(data.totalSpend)}</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="size-4" />
            Top 5 Vendors
          </CardTitle>
        </CardHeader>
        <CardContent>
          {data.topVendors.length === 0 ? (
            <p className="text-muted-foreground">No expenses this month.</p>
          ) : (
            <ul className="space-y-2">
              {data.topVendors.map((v) => (
                <li key={v.vendor} className="flex items-center justify-between gap-2 text-sm">
                  <span className="truncate">{v.vendor}</span>
                  <span className="font-medium">{formatMoney(v.total)}</span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="size-4" />
            Anomalies
            {data.anomalyCount > 0 && (
              <Badge className="bg-destructive/10 text-destructive">{data.anomalyCount}</Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {data.anomalies.length === 0 ? (
            <p className="text-muted-foreground">No anomalies this month.</p>
          ) : (
            <ul className="space-y-2">
              {data.anomalies.map((a) => (
                <li
                  key={a.id}
                  className="flex items-center justify-between gap-2 text-sm text-destructive"
                >
                  <span className="truncate">
                    {a.vendorName} · {formatDateTime(a.occurredAt)}
                  </span>
                  <span className="font-medium">{formatMoney(a.amount, a.currency)}</span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Card className="lg:col-span-3">
        <CardHeader>
          <CardTitle>Monthly Totals by Category</CardTitle>
        </CardHeader>
        <CardContent>
          {Object.keys(data.categoryTotals).length === 0 ? (
            <p className="text-muted-foreground">No expenses this month.</p>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {Object.entries(data.categoryTotals).map(([category, total]) => (
                <div
                  key={category}
                  className="flex items-center justify-between rounded-lg border border-border px-3 py-2 text-sm"
                >
                  <span className="text-muted-foreground">{category}</span>
                  <span className="font-medium">{formatMoney(total)}</span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
