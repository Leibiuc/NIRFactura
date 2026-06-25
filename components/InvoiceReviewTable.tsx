"use client";

import { useEffect, useState, type MouseEvent as ReactMouseEvent } from "react";
import type { NirInput, InvoiceItem } from "@/types/invoice";
import { DEFAULT_VAT_RATE } from "@/lib/constants";
import { computeNirRow, priceWithVat } from "@/lib/nir-compute";
import {
  Button,
  Card,
  Field,
  Input,
  NumberInput,
  TableRoot,
  Thead,
  Tbody,
  Tfoot,
  Tr,
  Th,
  Td,
  cn,
} from "@/components/ui";

interface Props {
  data: NirInput;
  onChange: (data: NirInput) => void;
}

const fmt = (n: number) => n.toFixed(2);
const round2 = (n: number) => Math.round(n * 100) / 100;

// Column headers, in physical order. The last entry is the delete-button column.
const COLUMNS: { label: string; className: string }[] = [
  { label: "Nr. crt.", className: "text-center" },
  { label: "Denumirea", className: "text-left" },
  { label: "UM", className: "text-center" },
  { label: "Cantitatea", className: "text-right" },
  { label: "Pret fara TVA", className: "text-right" },
  { label: "Valoare fara TVA", className: "text-right bg-gray-100" },
  { label: "Valoare cu adaos", className: "text-right bg-gray-100" },
  { label: "TVA %", className: "text-right" },
  { label: "TVA deductibil", className: "text-right bg-gray-100" },
  { label: "Pret de vanzare", className: "text-right" },
  { label: "Valoare la pret de vanzare", className: "text-right bg-gray-100" },
  { label: "Adaos %", className: "text-right" },
  { label: "Adaos Lei", className: "text-right bg-gray-100" },
  { label: "", className: "" },
];

const DEFAULT_WIDTHS = [40, 180, 52, 92, 100, 104, 104, 72, 104, 100, 116, 72, 104, 44];
const MIN_WIDTH = 36;
const WIDTHS_KEY = "nir-col-widths";

export default function InvoiceReviewTable({ data, onChange }: Props) {
  // Column widths are user-draggable (like a spreadsheet) and persisted locally.
  // This table only mounts after an upload (never during SSR), so reading
  // localStorage in the initializer is safe and avoids a hydration mismatch.
  const [widths, setWidths] = useState<number[]>(() => {
    if (typeof window === "undefined") return DEFAULT_WIDTHS;
    try {
      const saved = localStorage.getItem(WIDTHS_KEY);
      if (saved) {
        const arr = JSON.parse(saved);
        if (Array.isArray(arr) && arr.length === DEFAULT_WIDTHS.length) {
          return arr.map(Number);
        }
      }
    } catch {
      /* ignore unreadable/legacy storage */
    }
    return DEFAULT_WIDTHS;
  });
  const [resizing, setResizing] = useState(false);

  useEffect(() => {
    try {
      localStorage.setItem(WIDTHS_KEY, JSON.stringify(widths));
    } catch {
      /* storage may be unavailable (private mode); resizing still works */
    }
  }, [widths]);

  function startResize(index: number, e: ReactMouseEvent) {
    e.preventDefault();
    const startX = e.clientX;
    const startW = widths[index];
    setResizing(true);
    const onMove = (ev: MouseEvent) => {
      const next = Math.max(MIN_WIDTH, startW + ev.clientX - startX);
      setWidths((ws) => ws.map((w, i) => (i === index ? next : w)));
    };
    const onUp = () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
      setResizing(false);
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  }

  function updateHeader(field: keyof NirInput, value: string) {
    onChange({ ...data, [field]: value || undefined });
  }

  function updateItem(idx: number, field: keyof InvoiceItem, value: string) {
    const items = [...data.items];
    const numFields: (keyof InvoiceItem)[] = [
      "quantity",
      "purchase_price",
      "vat_rate",
      "markup_percent",
      "sale_price",
    ];

    if (numFields.includes(field)) {
      // Accept both "." and "," as the decimal separator.
      const n = parseFloat(value.replace(",", "."));
      items[idx] = { ...items[idx], [field]: isNaN(n) ? undefined : n };

      const price = items[idx].purchase_price ?? 0;
      const vatRate = items[idx].vat_rate ?? DEFAULT_VAT_RATE;
      const gross = priceWithVat(price, vatRate);

      if (field === "markup_percent" && !isNaN(n) && n >= 0) {
        items[idx].sale_price = parseFloat((gross * (1 + n / 100)).toFixed(4));
      }
      if (field === "sale_price" && !isNaN(n) && gross > 0) {
        items[idx].markup_percent = parseFloat(((n / gross - 1) * 100).toFixed(2));
      }
    } else {
      items[idx] = { ...items[idx], [field]: value || undefined };
    }

    onChange({ ...data, items });
  }

  function addRow() {
    onChange({ ...data, items: [...data.items, {}] });
  }

  function removeRow(idx: number) {
    onChange({ ...data, items: data.items.filter((_, i) => i !== idx) });
  }

  const totals = data.items.reduce(
    (acc, item) => {
      const c = computeNirRow(item);
      return {
        value_without_vat: acc.value_without_vat + c.value_without_vat,
        value_with_markup: acc.value_with_markup + c.value_with_markup,
        deductible_vat: acc.deductible_vat + c.deductible_vat,
        sale_value: acc.sale_value + c.sale_value,
        adaos_lei: acc.adaos_lei + c.adaos_lei,
      };
    },
    {
      value_without_vat: 0,
      value_with_markup: 0,
      deductible_vat: 0,
      sale_value: 0,
      adaos_lei: 0,
    }
  );

  const tableWidth = widths.reduce((a, b) => a + b, 0);

  return (
    <div className={cn("space-y-6", resizing && "cursor-col-resize select-none")}>
      <Card className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Field label="Unitatea" value={data.receiving_company} onChange={(v) => updateHeader("receiving_company", v)} />
        <Field label="Furnizor" value={data.supplier_name} onChange={(v) => updateHeader("supplier_name", v)} />
        <Field label="Cod Fiscal" value={data.supplier_fiscal_code} onChange={(v) => updateHeader("supplier_fiscal_code", v)} />
        <Field label="Nr. Factura" value={data.invoice_number} onChange={(v) => updateHeader("invoice_number", v)} />
        <Field label="Data Factura" value={data.invoice_date} onChange={(v) => updateHeader("invoice_date", v)} />
        <Field label="Nr. NIR" value={data.nir_number} onChange={(v) => updateHeader("nir_number", v)} />
        <Field label="Data NIR" value={data.nir_date} onChange={(v) => updateHeader("nir_date", v)} />
        <Field label="Delegat" value={data.delegate_name} onChange={(v) => updateHeader("delegate_name", v)} />
        <Field label="Mijloc transport" value={data.transport_means} onChange={(v) => updateHeader("transport_means", v)} />
      </Card>

      <TableRoot style={{ tableLayout: "fixed", width: tableWidth }}>
        <colgroup>
          {widths.map((w, i) => (
            <col key={i} style={{ width: w }} />
          ))}
        </colgroup>
        <Thead>
          <Tr className="bg-blue-50 text-gray-700">
            {COLUMNS.map((col, i) => (
              <Th key={i} className={cn("relative", col.className)}>
                {col.label}
                {i < COLUMNS.length - 1 && (
                  <span
                    onMouseDown={(e) => startResize(i, e)}
                    className="absolute top-0 right-0 z-10 h-full w-1.5 cursor-col-resize select-none hover:bg-blue-400"
                  />
                )}
              </Th>
            ))}
          </Tr>
        </Thead>
        <Tbody>
          {data.items.map((item, idx) => {
            const c = computeNirRow(item);
            return (
              <Tr key={idx} className="hover:bg-gray-50">
                <Td className="text-center text-gray-500">{idx + 1}</Td>
                <Td className="px-1">
                  <Input
                    variant="cell"
                    value={item.name ?? item.raw_name ?? ""}
                    onChange={(e) => updateItem(idx, "name", e.target.value)}
                  />
                </Td>
                <Td className="px-1">
                  <Input
                    variant="cell"
                    className="text-center"
                    value={item.unit ?? ""}
                    onChange={(e) => updateItem(idx, "unit", e.target.value)}
                  />
                </Td>
                <Td className="px-1">
                  <NumberInput value={item.quantity} onCommit={(v) => updateItem(idx, "quantity", v)} />
                </Td>
                <Td className="px-1">
                  <NumberInput value={item.purchase_price} onCommit={(v) => updateItem(idx, "purchase_price", v)} />
                </Td>
                <Td computed className="text-right">{fmt(c.value_without_vat)}</Td>
                <Td computed className="text-right">{fmt(c.value_with_markup)}</Td>
                <Td className="px-1">
                  <NumberInput value={item.vat_rate ?? DEFAULT_VAT_RATE} onCommit={(v) => updateItem(idx, "vat_rate", v)} />
                </Td>
                <Td computed className="text-right">{fmt(c.deductible_vat)}</Td>
                <Td className="px-1">
                  <NumberInput
                    value={c.salePrice ? round2(c.salePrice) : undefined}
                    onCommit={(v) => updateItem(idx, "sale_price", v)}
                  />
                </Td>
                <Td computed className="text-right">{fmt(c.sale_value)}</Td>
                <Td className="px-1">
                  <NumberInput value={item.markup_percent} onCommit={(v) => updateItem(idx, "markup_percent", v)} />
                </Td>
                <Td computed className="text-right">{fmt(c.adaos_lei)}</Td>
                <Td className="text-center">
                  <Button variant="danger" onClick={() => removeRow(idx)} title="Sterge randul">
                    ✕
                  </Button>
                </Td>
              </Tr>
            );
          })}
        </Tbody>
        <Tfoot>
          <Tr className="bg-yellow-50 font-semibold text-gray-900">
            <Td colSpan={5} className="text-right">TOTAL</Td>
            <Td computed className="text-right">{fmt(totals.value_without_vat)}</Td>
            <Td computed className="text-right">{fmt(totals.value_with_markup)}</Td>
            <Td />
            <Td computed className="text-right">{fmt(totals.deductible_vat)}</Td>
            <Td />
            <Td computed className="text-right">{fmt(totals.sale_value)}</Td>
            <Td />
            <Td computed className="text-right">{fmt(totals.adaos_lei)}</Td>
            <Td />
          </Tr>
        </Tfoot>
      </TableRoot>

      <Button variant="link" onClick={addRow}>
        <span className="text-lg leading-none">+</span> Adauga rand
      </Button>
    </div>
  );
}
