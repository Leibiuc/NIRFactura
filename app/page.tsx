"use client";

import { useState } from "react";
import UploadInvoice from "@/components/UploadInvoice";
import InvoiceReviewTable from "@/components/InvoiceReviewTable";
import GenerateNirButton from "@/components/GenerateNirButton";
import type { ExtractedInvoice, NirInput } from "@/types/invoice";
import { Button, Text } from "@/components/ui";

type Stage = "idle" | "uploading" | "review";

function extractedToNirInput(extracted: ExtractedInvoice): NirInput {
  const today = new Date().toISOString().split("T")[0];
  return {
    supplier_name: extracted.supplier_name,
    supplier_fiscal_code: extracted.supplier_fiscal_code,
    invoice_number: extracted.invoice_number,
    invoice_date: extracted.invoice_date,
    nir_number: undefined,
    nir_date: today,
    delegate_name: extracted.delegate_name,
    transport_means: extracted.transport_means,
    currency: extracted.currency ?? "RON",
    items: extracted.items.map((item) => ({ ...item, name: item.raw_name })),
  };
}

export default function Home() {
  const [stage, setStage] = useState<Stage>("idle");
  const [nirData, setNirData] = useState<NirInput | null>(null);
  const [uploadError, setUploadError] = useState<string>();

  async function handleFile(file: File) {
    setStage("uploading");
    setUploadError(undefined);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/process-invoice", { method: "POST", body: formData });
      const body = await res.json();

      if (!res.ok) {
        setUploadError(body.error ?? "Extragere esuata.");
        setStage("idle");
        return;
      }

      setNirData(extractedToNirInput(body as ExtractedInvoice));
      setStage("review");
    } catch {
      setUploadError("Eroare de retea. Incercati din nou.");
      setStage("idle");
    }
  }

  function reset() {
    setStage("idle");
    setNirData(null);
    setUploadError(undefined);
  }

  return (
    <main className="min-h-screen bg-[#f5f5f0]">
      <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <Text as="h1" variant="heading">NIRFactura</Text>
            <Text variant="subheading">Factura → NIR Excel in secunde</Text>
          </div>
          {stage === "review" && (
            <Button variant="ghost" onClick={reset}>
              Incarca alta factura
            </Button>
          )}
        </div>

        {stage !== "review" && (
          <UploadInvoice
            onFileSelect={handleFile}
            loading={stage === "uploading"}
            error={uploadError}
          />
        )}

        {stage === "review" && nirData && (
          <div className="space-y-6">
            <InvoiceReviewTable data={nirData} onChange={setNirData} />
            <div className="border-t border-gray-200 pt-6">
              <GenerateNirButton data={nirData} />
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
