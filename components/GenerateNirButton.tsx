"use client";

import { useState } from "react";
import type { NirInput } from "@/types/invoice";
import { Button, ErrorMessage } from "@/components/ui";

interface Props {
  data: NirInput;
}

export default function GenerateNirButton({ data }: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>();

  async function generate() {
    setLoading(true);
    setError(undefined);
    try {
      const res = await fetch("/api/generate-nir", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? "Request failed");
      }

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "nir.xlsx";
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Generarea NIR a esuat.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col items-start gap-2">
      <Button
        onClick={generate}
        loading={loading}
        disabled={data.items.length === 0}
      >
        {loading ? (
          "Se genereaza..."
        ) : (
          <>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Genereaza NIR Excel
          </>
        )}
      </Button>
      {error && <ErrorMessage>{error}</ErrorMessage>}
    </div>
  );
}
