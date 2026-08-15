import { useState } from "react";
import type { FormEvent } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Trash2 } from "lucide-react";

import { api } from "@/lib/api";
import type { RuleRequest } from "@/lib/types";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function RulesPanel() {
  const queryClient = useQueryClient();
  const [vendor, setVendor] = useState("");
  const [category, setCategory] = useState("");
  const [error, setError] = useState<string | null>(null);

  const rulesQuery = useQuery({
    queryKey: ["rules"],
    queryFn: api.listRules,
  });

  const createMutation = useMutation({
    mutationFn: (body: RuleRequest) => api.createRule(body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["rules"] });
      setVendor("");
      setCategory("");
      setError(null);
    },
    onError: (err: Error) => setError(err.message),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => api.deleteRule(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["rules"] });
    },
  });

  const submit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!vendor.trim() || !category.trim()) {
      setError("Vendor and category are required");
      return;
    }
    createMutation.mutate({ vendorName: vendor.trim(), category: category.trim() });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Vendor Rules</CardTitle>
        <CardDescription>
          Vendor names are matched case-insensitively to assign a category automatically.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <form onSubmit={submit} className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="rule-vendor">Vendor</Label>
            <Input
              id="rule-vendor"
              placeholder="Swiggy"
              value={vendor}
              onChange={(e) => setVendor(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="rule-category">Category</Label>
            <Input
              id="rule-category"
              placeholder="Food"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            />
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <Button type="submit" disabled={createMutation.isPending} className="w-full">
            <Plus />
            Add Rule
          </Button>
        </form>

        {rulesQuery.isLoading && (
          <p className="text-sm text-muted-foreground">Loading rules…</p>
        )}
        {rulesQuery.isError && (
          <p className="text-sm text-destructive">
            {rulesQuery.error instanceof Error
              ? rulesQuery.error.message
              : "Failed to load rules"}
          </p>
        )}
        {rulesQuery.data && rulesQuery.data.length === 0 && (
          <p className="text-sm text-muted-foreground">No rules yet.</p>
        )}
        {rulesQuery.data && rulesQuery.data.length > 0 && (
          <ul className="space-y-1.5">
            {rulesQuery.data.map((rule) => (
              <li
                key={rule.id}
                className="flex items-center justify-between gap-2 rounded-lg border border-border px-3 py-2 text-sm"
              >
                <span className="truncate">{rule.normalizedVendorName}</span>
                <span className="flex items-center gap-2">
                  <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium">
                    {rule.category}
                  </span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    aria-label={`Delete rule for ${rule.normalizedVendorName}`}
                    disabled={deleteMutation.isPending}
                    onClick={() => deleteMutation.mutate(rule.id)}
                  >
                    <Trash2 />
                  </Button>
                </span>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
