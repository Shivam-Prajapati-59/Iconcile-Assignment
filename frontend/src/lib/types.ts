export type TransactionType = "INCOME" | "EXPENSE";

export interface Expense {
  id: number;
  occurredAt: string;
  amount: number;
  currency: string;
  transactionType: TransactionType;
  accountName: string | null;
  vendorName: string;
  description: string | null;
  category: string;
  anomaly: boolean;
}

export interface ExpensePage {
  items: Expense[];
  page: number;
  size: number;
  totalItems: number;
  totalPages: number;
  hasNext: boolean;
}

export interface ExpenseFilters {
  vendors?: string[];
  categories?: string[];
  types?: TransactionType[];
}

export interface ExpenseRequest {
  occurredAt: string;
  amount: number;
  currency: string;
  transactionType: TransactionType;
  accountName?: string | null;
  vendorName: string;
  description?: string | null;
}

export interface VendorCategoryRule {
  id: number;
  normalizedVendorName: string;
  category: string;
}

export interface RuleRequest {
  vendorName: string;
  category: string;
}

export interface RowError {
  row: number;
  message: string;
}

export interface ImportResult {
  importedRows: number;
  failedRows: number;
  anomalyCount: number;
  errors: RowError[];
}

export interface TopVendor {
  vendor: string;
  total: number;
}

export interface DashboardSummary {
  totalSpend: number;
  categoryTotals: Record<string, number>;
  topVendors: TopVendor[];
  anomalyCount: number;
  anomalies: Expense[];
}
