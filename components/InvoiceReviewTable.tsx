"use client";

import type { NirInput, InvoiceItem } from "@/types/invoice";

interface Props {
  data: NirInput;
  onChange: (data: NirInput) => void;
}

function computeRow(item: InvoiceItem) {
  const qty = item.quantity ?? 0;
  const price = item.purchase_price ?? 0;
  const vatRate = item.vat_rate ?? 0;
  const markup = item.markup_percent ?? 0;
  const salePrice = item.sale_price ?? (markup > 0 ? price * (1 + markup / 100) : 0);

  return {
    value_without_vat: qty * price,
    deductible_vat: qty * price * vatRate / 100,
    value_with_markup: qty * price * (1 + markup / 100),
    sale_value: qty * salePrice,
  };
}

function fmt(n: number) {
  return n.toFixed(2);
}

function HeaderField({ label, value, onChange }: { label: string; value?: string; onChange: (v: string) => void }) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">{label}</label>
      <input
        type="text"
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value)}
        className="border border-gray-200 rounded px-2 py-1 text-sm text-gray-900 focus:outline-none focus:ring-1 focus:ring-blue-400"
      />
    </div>
  );
}

export default function InvoiceReviewTable({ data, onChange }: Props) {
  function updateHeader(field: keyof NirInput, value: string) {
    onChange({ ...data, [field]: value || undefined });
  }

  function updateItem(idx: number, field: keyof InvoiceItem, value: string) {
    const items = [...data.items];
    const numFields: (keyof InvoiceItem)[] = ["quantity", "purchase_price", "vat_rate", "markup_percent", "sale_price"];
    if (numFields.includes(field)) {
      const n = parseFloat(value);
      items[idx] = { ...items[idx], [field]: isNaN(n) ? undefined : n };

      // keep sale_price in sync when markup changes
      if (field === "markup_percent") {
        const price = items[idx].purchase_price ?? 0;
        if (!isNaN(n) && n >= 0) {
          items[idx].sale_price = parseFloat((price * (1 + n / 100)).toFixed(4));
        }
      }
      if (field === "sale_price") {
        const price = items[idx].purchase_price ?? 0;
        if (!isNaN(n) && price > 0) {
          items[idx].markup_percent = parseFloat(((n / price - 1) * 100).toFixed(2));
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
    const items = data.items.filter((_, i) => i !== idx);
    onChange({ ...data, items });
  }

  const totals = data.items.reduce(
    (acc, item) => {
      const c = computeRow(item);
      return {
        value_without_vat: acc.value_without_vat + c.value_without_vat,
        deductible_vat: acc.deductible_vat + c.deductible_vat,
        value_with_markup: acc.value_with_markup + c.value_with_markup,
        sale_value: acc.sale_value + c.sale_value,
      };
    },
    { value_without_vat: 0, deductible_vat: 0, value_with_markup: 0, sale_value: 0 }
  );

  return (
    <div className="space-y-6">
      {/* Header fields */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-gray-50 rounded-xl p-4 border border-gray-200">
        <HeaderField label="Furnizor" value={data.supplier_name} onChange={(v) => updateHeader("supplier_name", v)} />
        <HeaderField label="Cod Fiscal" value={data.supplier_fiscal_code} onChange={(v) => updateHeader("supplier_fiscal_code", v)} />
        <HeaderField label="Nr. Factura" value={data.invoice_number} onChange={(v) => updateHeader("invoice_number", v)} />
        <HeaderField label="Data Factura" value={data.invoice_date} onChange={(v) => updateHeader("invoice_date", v)} />
        <HeaderField label="Nr. NIR" value={data.nir_number} onChange={(v) => updateHeader("nir_number", v)} />
        <HeaderField label="Data NIR" value={data.nir_date} onChange={(v) => updateHeader("nir_date", v)} />
        <HeaderField label="Delegat" value={data.delegate_name} onChange={(v) => updateHeader("delegate_name", v)} />
        <HeaderField label="Mijloc transport" value={data.transport_means} onChange={(v) => updateHeader("transport_means", v)} />
      </div>

      {/* Items table */}
      <div className="overflow-x-auto rounded-xl border border-gray-200">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="bg-blue-50 text-gray-700">
              <th className="border border-gray-200 px-2 py-2 text-center w-8">#</th>
              <th className="border border-gray-200 px-2 py-2 text-left min-w-[160px]">Denumirea</th>
              <th className="border border-gray-200 px-2 py-2 text-center w-16">UM</th>
              <th className="border border-gray-200 px-2 py-2 text-right w-20">Cantit.</th>
              <th className="border border-gray-200 px-2 py-2 text-right w-24">Pret fara TVA</th>
              <th className="border border-gray-200 px-2 py-2 text-right w-24 bg-gray-100">Val. fara TVA</th>
              <th className="border border-gray-200 px-2 py-2 text-right w-24 bg-gray-100">Val. cu adaos</th>
              <th className="border border-gray-200 px-2 py-2 text-right w-24 bg-gray-100">TVA ded.</th>
              <th className="border border-gray-200 px-2 py-2 text-right w-20">TVA %</th>
              <th className="border border-gray-200 px-2 py-2 text-right w-20">Adaos %</th>
              <th className="border border-gray-200 px-2 py-2 text-right w-24">Pret vanzare</th>
              <th className="border border-gray-200 px-2 py-2 text-right w-24 bg-gray-100">Val. vanzare</th>
              <th className="border border-gray-200 px-2 py-2 w-8"></th>
            </tr>
          </thead>
          <tbody>
            {data.items.map((item, idx) => {
              const c = computeRow(item);
              return (
                <tr key={idx} className="hover:bg-gray-50">
                  <td className="border border-gray-200 px-2 py-1 text-center text-gray-400">{idx + 1}</td>
                  <td className="border border-gray-200 px-1 py-1">
                    <input
                      className="w-full px-1 py-0.5 rounded focus:outline-none focus:ring-1 focus:ring-blue-400 text-sm text-gray-900"
                      value={item.name ?? item.raw_name ?? ""}
                      onChange={(e) => updateItem(idx, "name", e.target.value)}
                    />
                  </td>
                  <td className="border border-gray-200 px-1 py-1">
                    <input
                      className="w-full px-1 py-0.5 rounded focus:outline-none focus:ring-1 focus:ring-blue-400 text-sm text-center"
                      value={item.unit ?? ""}
                      onChange={(e) => updateItem(idx, "unit", e.target.value)}
                    />
                  </td>
                  <td className="border border-gray-200 px-1 py-1">
                    <input
                      type="number"
                      className="w-full px-1 py-0.5 rounded focus:outline-none focus:ring-1 focus:ring-blue-400 text-sm text-right text-gray-900"
                      value={item.quantity ?? ""}
                      onChange={(e) => updateItem(idx, "quantity", e.target.value)}
                    />
                  </td>
                  <td className="border border-gray-200 px-1 py-1">
                    <input
                      type="number"
                      className="w-full px-1 py-0.5 rounded focus:outline-none focus:ring-1 focus:ring-blue-400 text-sm text-right text-gray-900"
                      value={item.purchase_price ?? ""}
                      onChange={(e) => updateItem(idx, "purchase_price", e.target.value)}
                    />
                  </td>
                  <td className="border border-gray-200 px-2 py-1 text-right text-gray-600 bg-gray-50 tabular-nums">{fmt(c.value_without_vat)}</td>
                  <td className="border border-gray-200 px-2 py-1 text-right text-gray-600 bg-gray-50 tabular-nums">{fmt(c.value_with_markup)}</td>
                  <td className="border border-gray-200 px-2 py-1 text-right text-gray-600 bg-gray-50 tabular-nums">{fmt(c.deductible_vat)}</td>
                  <td className="border border-gray-200 px-1 py-1">
                    <input
                      type="number"
                      className="w-full px-1 py-0.5 rounded focus:outline-none focus:ring-1 focus:ring-blue-400 text-sm text-right text-gray-900"
                      value={item.vat_rate ?? ""}
                      onChange={(e) => updateItem(idx, "vat_rate", e.target.value)}
                    />
                  </td>
                  <td className="border border-gray-200 px-1 py-1">
                    <input
                      type="number"
                      className="w-full px-1 py-0.5 rounded focus:outline-none focus:ring-1 focus:ring-blue-400 text-sm text-right text-gray-900"
                      value={item.markup_percent ?? ""}
                      onChange={(e) => updateItem(idx, "markup_percent", e.target.value)}
                    />
                  </td>
                  <td className="border border-gray-200 px-1 py-1">
                    <input
                      type="number"
                      className="w-full px-1 py-0.5 rounded focus:outline-none focus:ring-1 focus:ring-blue-400 text-sm text-right text-gray-900"
                      value={item.sale_price ?? ""}
                      onChange={(e) => updateItem(idx, "sale_price", e.target.value)}
                    />
                  </td>
                  <td className="border border-gray-200 px-2 py-1 text-right text-gray-600 bg-gray-50 tabular-nums">{fmt(c.sale_value)}</td>
                  <td className="border border-gray-200 px-1 py-1 text-center">
                    <button
                      onClick={() => removeRow(idx)}
                      className="text-red-400 hover:text-red-600 text-xs font-bold"
                      title="Sterge randul"
                    >✕</button>
                  </td>
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr className="bg-yellow-50 font-semibold">
              <td colSpan={5} className="border border-gray-200 px-2 py-1 text-right">TOTAL</td>
              <td className="border border-gray-200 px-2 py-1 text-right tabular-nums">{fmt(totals.value_without_vat)}</td>
              <td className="border border-gray-200 px-2 py-1 text-right tabular-nums">{fmt(totals.value_with_markup)}</td>
              <td className="border border-gray-200 px-2 py-1 text-right tabular-nums">{fmt(totals.deductible_vat)}</td>
              <td colSpan={3} className="border border-gray-200" />
              <td className="border border-gray-200 px-2 py-1 text-right tabular-nums">{fmt(totals.sale_value)}</td>
              <td className="border border-gray-200" />
            </tr>
          </tfoot>
        </table>
      </div>

      <button
        onClick={addRow}
        className="text-sm text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1"
      >
        <span className="text-lg leading-none">+</span> Adauga rand
      </button>
    </div>
  );
}
