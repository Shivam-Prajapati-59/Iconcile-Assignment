import type {
  DashboardSummary,
  Expense,
  ExpenseFilters,
  ExpensePage,
  ExpenseRequest,
  ImportResult,
  RuleRequest,
  VendorCategoryRule,
} from "./types";

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8080";

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const isForm = init?.body instanceof FormData;
  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: {
      ...(isForm ? {} : { "Content-Type": "application/json" }),
      ...init?.headers,
    },
  });

  if (!res.ok) {
    let message = `Request failed (${res.status})`;
    try {
      const body = (await res.json()) as { message?: string };
      if (body?.message) message = body.message;
    } catch {
      // non-JSON error body; keep default message
    }
    throw new Error(message);
  }

  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

export const api = {
  listExpenses: (month?: string, page = 0, size = 20, filters?: ExpenseFilters) => {
    const params = new URLSearchParams();
    params.set("page", String(page));
    params.set("size", String(size));
    if (month) params.set("month", month);
    if (filters?.vendors?.length) params.set("vendors", filters.vendors.join(","));
    if (filters?.categories?.length) params.set("categories", filters.categories.join(","));
    if (filters?.types?.length) params.set("types", filters.types.join(","));
    return request<ExpensePage>(`/api/expenses?${params.toString()}`);
  },

  createExpense: (body: ExpenseRequest) =>
    request<Expense>("/api/expenses", { method: "POST", body: JSON.stringify(body) }),

  importCsv: (file: File) => {
    const form = new FormData();
    form.append("file", file);
    return request<ImportResult>("/api/expenses/import", { method: "POST", body: form });
  },

  dashboard: (month: string) =>
    request<DashboardSummary>(`/api/dashboard/summary?month=${month}`),

  listRules: () => request<VendorCategoryRule[]>("/api/vendor-rules"),

  createRule: (body: RuleRequest) =>
    request<VendorCategoryRule>("/api/vendor-rules", { method: "POST", body: JSON.stringify(body) }),

  deleteRule: (id: number) =>
    request<void>(`/api/vendor-rules/${id}`, { method: "DELETE" }),
};
