import { useState } from "react";
import type { FormEvent } from "react";
import { Plus, Trash2 } from "lucide-react";

import {
  useCreateVendorRule,
  useDeleteVendorRule,
  useVendorRules,
} from "@/hooks/useVendorRules";
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
  const rulesQuery = useVendorRules();
  const createMutation = useCreateVendorRule();
  const deleteMutation = useDeleteVendorRule();

  const [vendor, setVendor] = useState("");
  const [category, setCategory] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const submit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!vendor.trim() || !category.trim()) {
      setError("Vendor and category are required");
      return;
    }
    createMutation.mutate(
      { vendorName: vendor.trim(), category: category.trim() },
      {
        onSuccess: () => {
          setVendor("");
          setCategory("");
          setError(null);
        },
        onError: (err: Error) => setError(err.message),
      },
    );
  };

  const remove = (id: number) => {
    setDeleteError(null);
    deleteMutation.mutate(id, {
      onError: (err: Error) => setDeleteError(err.message),
    });
  };

  return (
    <Card className="flex flex-col lg:min-h-0 lg:flex-1">
      <CardHeader className="shrink-0">
        <CardTitle>Vendor Rules</CardTitle>
        <CardDescription>
          Vendor names are matched case-insensitively to assign a category automatically.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4 lg:min-h-0 lg:flex-1 lg:overflow-hidden">
        <form onSubmit={submit} className="shrink-0 space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="rule-vendor">Vendor</Label>
            <Input
              id="rule-vendor"
              placeholder="Swiggy"
              value={vendor}
              aria-invalid={error ? true : undefined}
              aria-describedby={error ? "rule-form-error" : undefined}
              onChange={(e) => {
                setVendor(e.target.value);
                setError(null);
              }}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="rule-category">Category</Label>
            <Input
              id="rule-category"
              placeholder="Food"
              value={category}
              aria-invalid={error ? true : undefined}
              aria-describedby={error ? "rule-form-error" : undefined}
              onChange={(e) => {
                setCategory(e.target.value);
                setError(null);
              }}
            />
          </div>
          {error && (
            <p id="rule-form-error" role="alert" className="text-sm text-destructive">
              {error}
            </p>
          )}
          <Button type="submit" disabled={createMutation.isPending} className="w-full">
            <Plus />
            Add Rule
          </Button>
        </form>

        {deleteError && (
          <p role="alert" className="shrink-0 text-sm text-destructive">
            {deleteError}
          </p>
        )}

        <div className="overflow-y-auto pr-0.5 lg:min-h-0 lg:flex-1">
          {rulesQuery.isLoading && (
            <p className="text-sm text-muted-foreground">Loading rules…</p>
          )}
          {rulesQuery.isError && (
            <p role="alert" className="text-sm text-destructive">
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
                      onClick={() => remove(rule.id)}
                    >
                      <Trash2 />
                    </Button>
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
