import { useEffect, useMemo, useRef, useState } from "react";
import { AlertTriangle } from "lucide-react";

import { formatDateTime, formatMoney } from "@/lib/format";
import type { TransactionType } from "@/lib/types";
import { useExpenseFacets, useExpenses } from "@/hooks/useExpenses";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MultiSelect } from "@/components/ui/multi-select";

interface ExpenseTableProps {
  month: string;
}

export default function ExpenseTable({ month }: ExpenseTableProps) {
  const [vendorFilter, setVendorFilter] = useState<string[]>([]);
  const [categoryFilter, setCategoryFilter] = useState<string[]>([]);
  const [typeFilter, setTypeFilter] = useState<string[]>([]);

  const filters = useMemo(
    () => ({
      vendors: vendorFilter,
      categories: categoryFilter,
      types: typeFilter as TransactionType[],
    }),
    [vendorFilter, categoryFilter, typeFilter],
  );

  const { data, isLoading, isError, error, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useExpenses(month, filters);

  const sentinelRef = useRef<HTMLDivElement>(null);

  const rows = useMemo(
    () =>
      data?.pages.flatMap((p) => {
        if (Array.isArray(p)) return p;
        return p?.items ?? [];
      }) ?? [],
    [data],
  );

  const facets = useExpenseFacets(month);
  const facetRows = useMemo(() => facets.data ?? [], [facets.data]);

  const vendorOptions = useMemo(() => {
    const byLower = new Map<string, string[]>();
    for (const name of facetRows.map((e) => e.vendorName)) {
      const key = name.toLowerCase();
      byLower.set(key, [...(byLower.get(key) ?? []), name]);
    }
    return [...byLower.values()]
      .map((spellings) => {
        const capitalized = spellings.find((s) => /[A-Z]/.test(s.charAt(0)));
        return capitalized ?? spellings[0];
      })
      .sort((a, b) => a.localeCompare(b));
  }, [facetRows]);
  const categoryOptions = useMemo(
    () => [...new Set(facetRows.map((e) => e.category))].sort((a, b) => a.localeCompare(b)),
    [facetRows],
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

  const hasActiveFilters =
    vendorFilter.length > 0 || categoryFilter.length > 0 || typeFilter.length > 0;

  const headerSelect = "w-28";

  return (
    <Card size="sm" className="flex flex-col lg:min-h-0 lg:flex-1">
      <CardHeader className="shrink-0">
        <CardTitle>
          Expenses — {month}
          {data && (
            <span className="text-sm font-normal text-muted-foreground">
              {" "}
              ({data.pages[0]?.totalItems ?? 0} total)
            </span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col lg:min-h-0 lg:flex-1 lg:overflow-hidden">
        {isError && (
          <p className="py-8 text-center text-destructive">
            {error instanceof Error ? error.message : "Failed to load expenses"}
          </p>
        )}
        {!isLoading && !isError && rows.length === 0 && !hasActiveFilters && (
          <p className="py-8 text-center text-muted-foreground">
            No expenses recorded for this month.
          </p>
        )}
        {(rows.length > 0 || hasActiveFilters || isLoading) && (
          <div className="flex flex-col overflow-hidden rounded-lg border border-border lg:min-h-0 lg:flex-1">
            <div className="overflow-auto lg:min-h-0 lg:flex-1">
              <table className="w-full min-w-[640px] text-sm">
                <thead className="sticky top-0 z-10 bg-card">
                  <tr className="border-b border-border text-left text-muted-foreground">
                    <th className="px-3 py-2.5 align-middle font-medium">Date</th>
                    <th className="px-3 py-2.5 align-middle">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">Vendor</span>
                        <MultiSelect
                          placeholder="All vendors"
                          ariaLabel="Filter by vendor"
                          value={vendorFilter}
                          onChange={setVendorFilter}
                          options={vendorOptions}
                          className={headerSelect}
                        />
                      </div>
                    </th>
                    <th className="px-3 py-2.5 align-middle font-medium">Description</th>
                    <th className="px-3 py-2.5 align-middle">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">Category</span>
                        <MultiSelect
                          placeholder="All categories"
                          ariaLabel="Filter by category"
                          value={categoryFilter}
                          onChange={setCategoryFilter}
                          options={categoryOptions}
                          className={headerSelect}
                        />
                      </div>
                    </th>
                    <th className="px-3 py-2.5 align-middle">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">Type</span>
                        <MultiSelect
                          placeholder="All types"
                          ariaLabel="Filter by type"
                          value={typeFilter}
                          onChange={setTypeFilter}
                          options={["EXPENSE", "INCOME"]}
                          className={headerSelect}
                        />
                      </div>
                    </th>
                    <th className="px-3 py-2.5 align-middle font-medium">
                      <span className="block text-right">Amount</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {isLoading && (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-muted-foreground">
                        Loading…
                      </td>
                    </tr>
                  )}
                  {rows.length === 0 && !isLoading && hasActiveFilters && (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-muted-foreground">
                        No expenses match the selected filters.
                      </td>
                    </tr>
                  )}
                  {rows.map((e) => (
                    <tr
                      key={e.id}
                      className={`border-b border-border/60 last:border-0 ${e.anomaly ? "bg-destructive/5" : ""
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
                        className={`py-2 px-3 text-right whitespace-nowrap font-medium ${e.transactionType === "INCOME" ? "text-emerald-600" : ""
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
      </CardContent>
    </Card>
  );
}
