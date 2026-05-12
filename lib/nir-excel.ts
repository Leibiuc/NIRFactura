import ExcelJS from "exceljs";
import type { NirInput, InvoiceItem } from "@/types/invoice";

function computeRow(item: InvoiceItem) {
  const qty = item.quantity ?? 0;
  const price = item.purchase_price ?? 0;
  const vatRate = item.vat_rate ?? 21;
  const markup = item.markup_percent ?? 20;
  const price_with_vat = price * (1 + vatRate / 100);
  const salePrice = item.sale_price ?? (markup > 0 ? price_with_vat * (1 + markup / 100) : 0);

  const value_without_vat = qty * price;
  const deductible_vat = value_without_vat * vatRate / 100;
  const value_with_vat = value_without_vat + deductible_vat;
  const sale_value = qty * salePrice;

  return { qty, price, price_with_vat, vatRate, markup, salePrice, value_without_vat, deductible_vat, value_with_vat, sale_value };
}

export async function generateNirExcel(input: NirInput): Promise<Buffer> {
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet("NIR");

  ws.columns = [
    { key: "nr", width: 6 },
    { key: "name", width: 30 },
    { key: "um", width: 8 },
    { key: "qty", width: 10 },
    { key: "purchase_price", width: 14 },
    { key: "price_with_vat", width: 14 },
    { key: "value_without_vat", width: 16 },
    { key: "value_with_vat", width: 16 },
    { key: "deductible_vat", width: 14 },
    { key: "sale_price", width: 14 },
    { key: "sale_value", width: 18 },
    { key: "markup_percent", width: 14 },
  ];

  const titleRow = ws.addRow(["NOTA DE RECEPTIE"]);
  titleRow.font = { bold: true, size: 14 };
  ws.mergeCells(`A${titleRow.number}:L${titleRow.number}`);
  titleRow.alignment = { horizontal: "center" };

  ws.addRow([]);

  const addHeaderPair = (label: string, value: string | undefined) => {
    const row = ws.addRow([label, value ?? ""]);
    row.getCell(1).font = { bold: true };
  };

  addHeaderPair("NIR Nr.:", input.nir_number);
  addHeaderPair("Data NIR:", input.nir_date);
  addHeaderPair("Furnizorul:", input.supplier_name);
  addHeaderPair("Cod Fiscal:", input.supplier_fiscal_code);
  addHeaderPair("Document Livrare Nr.:", input.invoice_number);
  addHeaderPair("Data Factura:", input.invoice_date);
  addHeaderPair("Delegat:", input.delegate_name);
  addHeaderPair("Mijloc de transport:", input.transport_means);
  addHeaderPair("Moneda:", input.currency);

  ws.addRow([]);

  const colHeaders = [
    "Nr. crt.",
    "Denumirea",
    "UM",
    "Cantitatea",
    "Pret fara TVA",
    "Pret cu TVA",
    "Valoare fara TVA",
    "Valoare cu TVA",
    "TVA",
    "Pret de vanzare",
    "Valoare la pret de vanzare",
    "% Adaos comercial",
  ];
  const headerRow = ws.addRow(colHeaders);
  headerRow.font = { bold: true };
  headerRow.eachCell((cell) => {
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFD9E1F2" } };
    cell.border = {
      top: { style: "thin" }, bottom: { style: "thin" },
      left: { style: "thin" }, right: { style: "thin" },
    };
    cell.alignment = { wrapText: true, horizontal: "center" };
  });

  let totVwv = 0, totDvat = 0, totVwvat = 0, totSv = 0;

  input.items.forEach((item, idx) => {
    const c = computeRow(item);
    totVwv += c.value_without_vat;
    totDvat += c.deductible_vat;
    totVwvat += c.value_with_vat;
    totSv += c.sale_value;

    const dataRow = ws.addRow([
      idx + 1,
      item.name ?? item.raw_name ?? "",
      item.unit ?? "",
      c.qty,
      c.price,
      +c.price_with_vat.toFixed(1),
      +c.value_without_vat.toFixed(1),
      +c.value_with_vat.toFixed(1),
      +c.deductible_vat.toFixed(1),
      +c.salePrice.toFixed(1),
      +c.sale_value.toFixed(1),
      item.markup_percent ?? "",
    ]);
    dataRow.eachCell((cell) => {
      cell.border = {
        top: { style: "thin" }, bottom: { style: "thin" },
        left: { style: "thin" }, right: { style: "thin" },
      };
    });
  });

  const totalRow = ws.addRow([
    "TOTAL", "", "", "", "", "",
    +totVwv.toFixed(1),
    +totVwvat.toFixed(1),
    +totDvat.toFixed(1),
    "",
    +totSv.toFixed(1),
    "",
  ]);
  totalRow.font = { bold: true };
  totalRow.eachCell((cell) => {
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFFFF2CC" } };
    cell.border = {
      top: { style: "thin" }, bottom: { style: "thin" },
      left: { style: "thin" }, right: { style: "thin" },
    };
  });

  const buf = await wb.xlsx.writeBuffer();
  return Buffer.from(buf) as Buffer;
}
