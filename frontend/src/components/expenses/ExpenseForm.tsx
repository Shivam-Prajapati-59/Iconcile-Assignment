import { useState } from "react";
import type { FormEvent } from "react";

import type { ExpenseRequest, TransactionType } from "@/lib/types";
import DatePicker from "@/components/common/DatePicker";
import { useCreateExpense } from "@/hooks/useExpenses";
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

const selectClasses =
  "flex h-8 w-full min-w-0 rounded-md border border-input bg-transparent px-2.5 py-1 text-sm shadow-xs outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50";

function today(): string {
  const now = new Date();
  const local = new Date(now.getTime() - now.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 10);
}

interface ExpenseFormProps {
  onSuccess?: () => void;
}

export default function ExpenseForm({ onSuccess }: ExpenseFormProps) {
  const mutation = useCreateExpense();
  const [date, setDate] = useState(today());
  const [amount, setAmount] = useState("");
  const [vendor, setVendor] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState<TransactionType>("EXPENSE");
  const [error, setError] = useState<string | null>(null);

  const submit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const parsed = Number(amount);
    if (!date) {
      setError("Date is required");
      return;
    }
    if (!vendor.trim()) {
      setError("Vendor name is required");
      return;
    }
    if (!Number.isFinite(parsed) || parsed <= 0) {
      setError("Amount must be a positive number");
      return;
    }
    mutation.mutate(
      {
        occurredAt: `${date}T12:00:00`,
        amount: parsed,
        currency: "INR",
        transactionType: type,
        vendorName: vendor.trim(),
        description: description.trim() || null,
      } satisfies ExpenseRequest,
      {
        onSuccess: () => {
          setAmount("");
          setVendor("");
          setDescription("");
          setError(null);
          onSuccess?.();
        },
        onError: (err: Error) => setError(err.message),
      },
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Add Expense</CardTitle>
        <CardDescription>Category is assigned automatically from vendor rules.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={submit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="exp-date">Date</Label>
              <DatePicker value={date} onChange={setDate} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="exp-amount">Amount (INR)</Label>
              <Input
                id="exp-amount"
                type="number"
                min="0"
                step="0.01"
                placeholder="250.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="exp-vendor">Vendor</Label>
            <Input
              id="exp-vendor"
              placeholder="Swiggy"
              value={vendor}
              onChange={(e) => setVendor(e.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="exp-desc">Description</Label>
            <Input
              id="exp-desc"
              placeholder="Lunch order"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="exp-type">Type</Label>
            <select
              id="exp-type"
              className={selectClasses}
              value={type}
              onChange={(e) => setType(e.target.value as TransactionType)}
            >
              <option value="EXPENSE">Expense</option>
              <option value="INCOME">Income</option>
            </select>
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}
          {mutation.isSuccess && <p className="text-sm text-emerald-600">Expense saved.</p>}

          <Button type="submit" disabled={mutation.isPending} className="w-full">
            {mutation.isPending ? "Saving…" : "Save Expense"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
