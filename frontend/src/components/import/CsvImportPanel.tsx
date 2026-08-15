import { useRef, useState } from "react";
import type { ChangeEvent, FormEvent } from "react";
import { Upload } from "lucide-react";

import { useImportExpenses } from "@/hooks/useExpenses";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function CsvImportPanel({ onSuccess }: { onSuccess?: () => void }) {
  const mutation = useImportExpenses();
  const [file, setFile] = useState<File | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const onFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    setFile(e.target.files?.[0] ?? null);
    mutation.reset();
  };

  const submit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (file)
      mutation.mutate(file, {
        onSuccess: () => {
          setFile(null);
          if (inputRef.current) inputRef.current.value = "";
          onSuccess?.();
        },
      });
  };

  const result = mutation.data;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Import from CSV</CardTitle>
        <CardDescription>
          Columns: date, amount, currency, transactionType, accountName, vendorName, description
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <form onSubmit={submit} className="flex items-center gap-2">
          <input
            ref={inputRef}
            type="file"
            accept=".csv,text/csv"
            onChange={onFileChange}
            className="min-w-0 flex-1 text-sm text-muted-foreground file:mr-2 file:rounded-md file:border-0 file:bg-muted file:px-2.5 file:py-1 file:text-sm file:font-medium file:text-foreground"
          />
          <Button type="submit" disabled={!file || mutation.isPending} variant={"outline"}>
            <Upload />
            Upload
          </Button>
        </form>

        {mutation.isError && (
          <p className="text-sm text-destructive">{(mutation.error as Error).message}</p>
        )}

        {result && (
          <div className="space-y-2 rounded-lg border border-border p-3 text-sm">
            <p className="font-medium">Import complete</p>
            <p>
              {result.importedRows} imported, {result.failedRows} failed, {result.anomalyCount}{" "}
              anomaly flagged
            </p>
            {result.errors.length > 0 && (
              <ul className="max-h-40 space-y-1 overflow-y-auto text-muted-foreground">
                {result.errors.map((err, idx) => (
                  <li key={idx}>
                    Row {err.row}: {err.message}
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
