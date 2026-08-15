import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { api } from "@/lib/api";
import type { RuleRequest } from "@/lib/types";

export const ruleKeys = {
  list: () => ["vendor-rules"] as const,
};

export function useVendorRules() {
  return useQuery({
    queryKey: ruleKeys.list(),
    queryFn: api.listRules,
  });
}

export function useCreateVendorRule() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: RuleRequest) => api.createRule(body),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ruleKeys.list() });
    },
  });
}

export function useDeleteVendorRule() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => api.deleteRule(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ruleKeys.list() });
    },
  });
}
