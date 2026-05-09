import ExcelJS from "exceljs";
import type { NirInput, InvoiceItem } from "@/types/invoice";

function computeRow(item: InvoiceItem) {
  const qty = item.quantity ?? 0;
  const price = item.purchase_price ?? 0;
  const vatRate = item.vat_rate ?? 0;
  const markup = item.markup_percent ?? 0;
  const salePrice = item.sale_price ?? (markup > 0 ? price * (1 + markup / 100) : 0);

  const value_without_vat = qty * price;
  const deductible_vat = value_without_vat * vatRate / 100;
  const value_with_markup = value_without_vat * (1 + markup / 100);
  const sale_value = qty * salePrice;

  return { qty, price, vatRate, markup, salePrice, value_without_vat, deductible_vat, value_with_markup, sale_value };
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
    { key: "value_without_vat", width: 16 },
    { key: "value_with_markup", width: 16 },
    { key: "deductible_vat", width: 14 },
    { key: "sale_price", width: 14 },
    { key: "sale_value", width: 18 },
    { key: "markup_percent", width: 14 },
  ];

  const titleRow = ws.addRow(["NOTA DE RECEPTIE"]);
  titleRow.font = { bold: true, size: 14 };
  ws.mergeCells(`A${titleRow.number}:K${titleRow.number}`);
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
    "Valoare fara TVA",
    "Valoare cu adaos",
    "TVA deductibila",
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

  let totVwv = 0, totDvat = 0, totVwm = 0, totSv = 0;

  input.items.forEach((item, idx) => {
    const c = computeRow(item);
    totVwv += c.value_without_vat;
    totDvat += c.deductible_vat;
    totVwm += c.value_with_markup;
    totSv += c.sale_value;

    const dataRow = ws.addRow([
      idx + 1,
      item.name ?? item.raw_name ?? "",
      item.unit ?? "",
      c.qty,
      c.price,
      +c.value_without_vat.toFixed(2),
      +c.value_with_markup.toFixed(2),
      +c.deductible_vat.toFixed(2),
      +c.salePrice.toFixed(2),
      +c.sale_value.toFixed(2),
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
    "TOTAL", "", "", "", "",
    +totVwv.toFixed(2),
    +totVwm.toFixed(2),
    +totDvat.toFixed(2),
    "",
    +totSv.toFixed(2),
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
