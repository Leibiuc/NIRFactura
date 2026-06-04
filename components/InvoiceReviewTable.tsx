"use client";

import type { NirInput, InvoiceItem } from "@/types/invoice";
import { DEFAULT_VAT_RATE } from "@/lib/constants";
import { computeNirRow } from "@/lib/nir-compute";
import {
  Button,
  Card,
  Field,
  Input,
  TableRoot,
  Thead,
  Tbody,
  Tfoot,
  Tr,
  Th,
  Td,
} from "@/components/ui";

interface Props {
  data: NirInput;
  onChange: (data: NirInput) => void;
}

function fmt(n: number) {
  return n.toFixed(2);
}

export default function InvoiceReviewTable({ data, onChange }: Props) {
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
      const n = parseFloat(value);
      items[idx] = { ...items[idx], [field]: isNaN(n) ? undefined : n };

      if (field === "markup_percent") {
        const price = items[idx].purchase_price ?? 0;
        const vatRate = items[idx].vat_rate ?? DEFAULT_VAT_RATE;
        const priceWithVat = price * (1 + vatRate / 100);
        if (!isNaN(n) && n >= 0) {
          items[idx].sale_price = parseFloat((priceWithVat * (1 + n / 100)).toFixed(4));
        }
      }
      if (field === "sale_price") {
        const price = items[idx].purchase_price ?? 0;
        const vatRate = items[idx].vat_rate ?? DEFAULT_VAT_RATE;
        const priceWithVat = price * (1 + vatRate / 100);
        if (!isNaN(n) && priceWithVat > 0) {
          items[idx].markup_percent = parseFloat(((n / priceWithVat - 1) * 100).toFixed(2));
        }
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

  return (
    <div className="space-y-6">
      <Card className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Field label="Furnizor" value={data.supplier_name} onChange={(v) => updateHeader("supplier_name", v)} />
        <Field label="Cod Fiscal" value={data.supplier_fiscal_code} onChange={(v) => updateHeader("supplier_fiscal_code", v)} />
        <Field label="Nr. Factura" value={data.invoice_number} onChange={(v) => updateHeader("invoice_number", v)} />
        <Field label="Data Factura" value={data.invoice_date} onChange={(v) => updateHeader("invoice_date", v)} />
        <Field label="Nr. NIR" value={data.nir_number} onChange={(v) => updateHeader("nir_number", v)} />
        <Field label="Data NIR" value={data.nir_date} onChange={(v) => updateHeader("nir_date", v)} />
        <Field label="Delegat" value={data.delegate_name} onChange={(v) => updateHeader("delegate_name", v)} />
        <Field label="Mijloc transport" value={data.transport_means} onChange={(v) => updateHeader("transport_means", v)} />
      </Card>

      <TableRoot>
        <Thead>
          <Tr className="bg-blue-50 text-gray-700">
            <Th className="text-center w-8">Nr. crt.</Th>
            <Th className="text-left min-w-40">Denumirea</Th>
            <Th className="text-center w-16">UM</Th>
            <Th className="text-right w-20">Cantitatea</Th>
            <Th className="text-right w-24">Pret fara TVA</Th>
            <Th className="text-right w-24 bg-gray-100">Valoare fara TVA</Th>
            <Th className="text-right w-24 bg-gray-100">Valoare cu adaos</Th>
            <Th className="text-right w-20">TVA %</Th>
            <Th className="text-right w-24 bg-gray-100">TVA deductibil</Th>
            <Th className="text-right w-24">Pret de vanzare</Th>
            <Th className="text-right w-24 bg-gray-100">Valoare la pret de vanzare</Th>
            <Th className="text-right w-20">Adaos %</Th>
            <Th className="text-right w-24 bg-gray-100">Adaos Lei</Th>
            <Th className="w-8" />
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
                  <Input
                    variant="cell"
                    type="number"
                    className="text-right"
                    value={item.quantity ?? ""}
                    onChange={(e) => updateItem(idx, "quantity", e.target.value)}
                  />
                </Td>
                <Td className="px-1">
                  <Input
                    variant="cell"
                    type="number"
                    className="text-right"
                    value={item.purchase_price ?? ""}
                    onChange={(e) => updateItem(idx, "purchase_price", e.target.value)}
                  />
                </Td>
                <Td computed className="text-right">{fmt(c.value_without_vat)}</Td>
                <Td computed className="text-right">{fmt(c.value_with_markup)}</Td>
                <Td className="px-1">
                  <Input
                    variant="cell"
                    type="number"
                    className="text-right"
                    value={item.vat_rate ?? DEFAULT_VAT_RATE}
                    onChange={(e) => updateItem(idx, "vat_rate", e.target.value)}
                  />
                </Td>
                <Td computed className="text-right">{fmt(c.deductible_vat)}</Td>
                <Td className="px-1">
                  <Input
                    variant="cell"
                    type="number"
                    className="text-right"
                    value={c.salePrice ? fmt(c.salePrice) : ""}
                    onChange={(e) => updateItem(idx, "sale_price", e.target.value)}
                  />
                </Td>
                <Td computed className="text-right">{fmt(c.sale_value)}</Td>
                <Td className="px-1">
                  <Input
                    variant="cell"
                    type="number"
                    className="text-right"
                    value={item.markup_percent ?? ""}
                    onChange={(e) => updateItem(idx, "markup_percent", e.target.value)}
                  />
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
