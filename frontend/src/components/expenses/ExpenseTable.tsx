import { useEffect, useMemo, useRef, useState } from "react";
import { AlertTriangle, ChevronDown } from "lucide-react";

import { formatDateTime, formatMoney } from "@/lib/format";
import { useExpenses } from "@/hooks/useExpenses";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const ALL = "all";

interface ExpenseTableProps {
  month: string;
}

export default function ExpenseTable({ month }: ExpenseTableProps) {
  const { data, isLoading, isError, error, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useExpenses(month);

  const [vendorFilter, setVendorFilter] = useState<string>(ALL);
  const [categoryFilter, setCategoryFilter] = useState<string>(ALL);
  const [typeFilter, setTypeFilter] = useState<string>(ALL);

  const tableScrollRef = useRef<HTMLDivElement>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);

  const rows = useMemo(
    () =>
      data?.pages.flatMap((p) => {
        if (Array.isArray(p)) return p;
        return p?.items ?? [];
      }) ?? [],
    [data],
  );

  const vendorOptions = useMemo(
    () => [...new Set(rows.map((e) => e.vendorName))].sort((a, b) => a.localeCompare(b)),
    [rows],
  );
  const categoryOptions = useMemo(
    () => [...new Set(rows.map((e) => e.category))].sort((a, b) => a.localeCompare(b)),
    [rows],
  );

  const filteredRows = useMemo(
    () =>
      rows.filter(
        (e) =>
          (vendorFilter === ALL || e.vendorName === vendorFilter) &&
          (categoryFilter === ALL || e.category === categoryFilter) &&
          (typeFilter === ALL || e.transactionType === typeFilter),
      ),
    [rows, vendorFilter, categoryFilter, typeFilter],
  );

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && hasNextPage && !isFetchingNextPage) {
          void fetchNextPage();
        }
      },
      { rootMargin: "300px" },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const scrollToMore = () => {
    tableScrollRef.current?.scrollTo({ top: tableScrollRef.current.scrollHeight, behavior: "smooth" });
  };

  const hasActiveFilters = vendorFilter !== ALL || categoryFilter !== ALL || typeFilter !== ALL;

  const headerSelect =
    "h-7 w-28 font-normal text-muted-foreground data-placeholder:text-muted-foreground";

  const onFilterChange =
    (setter: (value: string) => void) => (value: string | null) =>
      setter(value ?? ALL);

  return (
    <Card size="sm" className="flex min-h-0 flex-1 flex-col">
      <CardHeader className="shrink-0">
        <CardTitle>
          Expenses — {month}
          {data && (
            <span className="text-sm font-normal text-muted-foreground">
              {" "}
              ({data.pages[0]?.totalItems ?? 0} total)
              {hasActiveFilters && <> · {filteredRows.length} shown</>}
            </span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="flex min-h-0 flex-1 flex-col overflow-hidden">
        {isLoading && <p className="py-8 text-center text-muted-foreground">Loading…</p>}
        {isError && (
          <p className="py-8 text-center text-destructive">
            {error instanceof Error ? error.message : "Failed to load expenses"}
          </p>
        )}
        {!isLoading && !isError && rows.length === 0 && (
          <p className="py-8 text-center text-muted-foreground">
            No expenses recorded for this month.
          </p>
        )}
        {!isLoading && !isError && rows.length > 0 && filteredRows.length === 0 && (
          <p className="py-8 text-center text-muted-foreground">
            No expenses match the selected filters.
          </p>
        )}
        {rows.length > 0 && (
          <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-lg border border-border">
            <div ref={tableScrollRef} className="min-h-0 flex-1 overflow-y-auto">
              <table className="w-full text-sm">
                <thead className="sticky top-0 z-10 bg-card">
                  <tr className="border-b border-border text-left text-muted-foreground">
                    <th className="px-3 py-2.5 align-bottom font-medium">Date</th>
                    <th className="px-3 py-2.5 align-bottom">
                      <div className="flex flex-col items-start gap-1">
                        <span className="font-medium">Vendor</span>
                        <Select value={vendorFilter} onValueChange={onFilterChange(setVendorFilter)}>
                          <SelectTrigger size="sm" className={headerSelect} aria-label="Filter by vendor">
                            <SelectValue placeholder="All vendors" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value={ALL}>All vendors</SelectItem>
                            {vendorOptions.map((v) => (
                              <SelectItem key={v} value={v}>
                                {v}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </th>
                    <th className="px-3 py-2.5 align-bottom font-medium">Description</th>
                    <th className="px-3 py-2.5 align-bottom">
                      <div className="flex flex-col items-start gap-1">
                        <span className="font-medium">Category</span>
                        <Select value={categoryFilter} onValueChange={onFilterChange(setCategoryFilter)}>
                          <SelectTrigger size="sm" className={headerSelect} aria-label="Filter by category">
                            <SelectValue placeholder="All categories" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value={ALL}>All categories</SelectItem>
                            {categoryOptions.map((c) => (
                              <SelectItem key={c} value={c}>
                                {c}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </th>
                    <th className="px-3 py-2.5 align-bottom">
                      <div className="flex flex-col items-start gap-1">
                        <span className="font-medium">Type</span>
                        <Select value={typeFilter} onValueChange={onFilterChange(setTypeFilter)}>
                          <SelectTrigger size="sm" className={headerSelect} aria-label="Filter by type">
                            <SelectValue placeholder="All types" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value={ALL}>All types</SelectItem>
                            <SelectItem value="EXPENSE">Expense</SelectItem>
                            <SelectItem value="INCOME">Income</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </th>
                    <th className="px-3 py-2.5 align-bottom font-medium">
                      <span className="block text-right">Amount</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRows.map((e) => (
                    <tr
                      key={e.id}
                      className={`border-b border-border/60 last:border-0 ${
                        e.anomaly ? "bg-destructive/5" : ""
                      }`}
                    >
                      <td className="py-2 px-3 whitespace-nowrap">{formatDateTime(e.occurredAt)}</td>
                      <td className="py-2 px-3">
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
                      <td className="py-2 px-3 text-muted-foreground">{e.description ?? "—"}</td>
                      <td className="py-2 px-3">{e.category}</td>
                      <td className="py-2 px-3 text-muted-foreground">{e.transactionType}</td>
                      <td
                        className={`py-2 px-3 text-right whitespace-nowrap font-medium ${
                          e.transactionType === "INCOME" ? "text-emerald-600" : ""
                        }`}
                      >
                        {formatMoney(e.amount, e.currency)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div ref={sentinelRef} className="h-px" />
            </div>
          </div>
        )}
        {hasNextPage && filteredRows.length > 0 && (
          <div className="flex shrink-0 justify-center py-2">
            <Button type="button" variant="outline" size="sm" onClick={scrollToMore}>
              Scroll down to see more
              <ChevronDown />
            </Button>
          </div>
        )}
        {!hasNextPage && filteredRows.length > 0 && (
          <p className="shrink-0 py-3 text-center text-sm text-muted-foreground">
            You're all caught up.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
