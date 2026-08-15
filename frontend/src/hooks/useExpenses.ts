import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { api } from "@/lib/api";
import type { Expense, ExpenseFilters, ExpenseRequest } from "@/lib/types";

const PAGE_SIZE = 20;
const FACET_SIZE = 100;

export const expenseKeys = {
  list: (month: string, filters?: ExpenseFilters) =>
    ["expenses", "list", month, filters ?? null] as const,
  facets: (month: string) => ["expenses", "facets", month] as const,
};

export function useExpenses(month: string, filters?: ExpenseFilters) {
  return useInfiniteQuery({
    queryKey: expenseKeys.list(month, filters),
    queryFn: ({ pageParam }) => api.listExpenses(month, pageParam, PAGE_SIZE, filters),
    initialPageParam: 0,
    getNextPageParam: (lastPage) => (lastPage.hasNext ? lastPage.page + 1 : undefined),
  });
}

export function useExpenseFacets(month: string) {
  return useQuery({
    queryKey: expenseKeys.facets(month),
    queryFn: async () => {
      const all: Expense[] = [];
      let page = 0;
      for (;;) {
        const res = await api.listExpenses(month, page, FACET_SIZE);
        all.push(...res.items);
        if (!res.hasNext) break;
        page += 1;
      }
      return all;
    },
  });
}

export function useCreateExpense() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: ExpenseRequest) => api.createExpense(body),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["expenses"] });
      void queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
}

export function useImportExpenses() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (file: File) => api.importCsv(file),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["expenses"] });
      void queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
}
