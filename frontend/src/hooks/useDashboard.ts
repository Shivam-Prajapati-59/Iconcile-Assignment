import { useQuery } from "@tanstack/react-query";

import { api } from "@/lib/api";

export const dashboardKeys = {
  summary: (month: string) => ["dashboard", "summary", month] as const,
};

export function useDashboard(month: string) {
  return useQuery({
    queryKey: dashboardKeys.summary(month),
    queryFn: () => api.dashboard(month),
  });
}
