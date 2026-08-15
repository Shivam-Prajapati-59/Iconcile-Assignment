import { useInfiniteQuery, useMutation, useQueryClient } from "@tanstack/react-query";

import { api } from "@/lib/api";
import type { ExpenseRequest } from "@/lib/types";

const PAGE_SIZE = 20;

export const expenseKeys = {
  list: (month: string) => ["expenses", "list", month] as const,
};

export function useExpenses(month: string) {
  return useInfiniteQuery({
    queryKey: expenseKeys.list(month),
    queryFn: ({ pageParam }) => api.listExpenses(month, pageParam, PAGE_SIZE),
    initialPageParam: 0,
    getNextPageParam: (lastPage) => (lastPage.hasNext ? lastPage.page + 1 : undefined),
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
