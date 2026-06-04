import ExcelJS from "exceljs";
import type { NirInput, InvoiceItem } from "@/types/invoice";
import { DEFAULT_VAT_RATE, DEFAULT_MARKUP_PERCENT } from "@/lib/constants";

// The receiving company (your own firm) is printed top-left on the paper form.
// It is NOT captured from the supplier invoice — set it here to have it printed.
const RECEIVING_COMPANY = "";

const NUM_FMT = "#,##0.00";

const thin = { style: "thin" as const };
const borderAll = { top: thin, bottom: thin, left: thin, right: thin };
const HEADER_FILL: ExcelJS.Fill = {
  type: "pattern",
  pattern: "solid",
  fgColor: { argb: "FFD9E1F2" },
};
const TOTAL_FILL: ExcelJS.Fill = {
  type: "pattern",
  pattern: "solid",
  fgColor: { argb: "FFFFF2CC" },
};

function computeRow(item: InvoiceItem) {
  const qty = item.quantity ?? 0;
  const price = item.purchase_price ?? 0;
  const vatRate = item.vat_rate ?? DEFAULT_VAT_RATE;
  const markup = item.markup_percent ?? DEFAULT_MARKUP_PERCENT;

  const value_without_vat = qty * price;
  const adaos_lei = (value_without_vat * markup) / 100;
  const value_with_markup = value_without_vat + adaos_lei;
  const deductible_vat = (value_without_vat * vatRate) / 100;

  const price_with_vat = price * (1 + vatRate / 100);
  const salePrice =
    item.sale_price ??
    (markup > 0 ? price_with_vat * (1 + markup / 100) : price_with_vat);
  const sale_value = qty * salePrice;

  return {
    qty,
    price,
    markup,
    value_without_vat,
    adaos_lei,
    value_with_markup,
    deductible_vat,
    salePrice,
    sale_value,
  };
}

type BoxOpts = {
  bold?: boolean;
  size?: number;
  align?: ExcelJS.Alignment["horizontal"];
  wrap?: boolean;
  fill?: ExcelJS.Fill;
  numFmt?: string;
  border?: boolean;
};

const round2 = (n: number) => Math.round(n * 100) / 100;

export async function generateNirExcel(input: NirInput): Promise<Buffer> {
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet("NIR");

  // 12 physical columns (A..L). "Adaos comercial" occupies the last two (% | Lei).
  ws.columns = [
    { key: "nr", width: 6 },
    { key: "name", width: 34 },
    { key: "um", width: 6 },
    { key: "qty", width: 10 },
    { key: "price", width: 12 },
    { key: "val_no_vat", width: 14 },
    { key: "val_markup", width: 14 },
    { key: "vat", width: 13 },
    { key: "sale_price", width: 12 },
    { key: "sale_value", width: 15 },
    { key: "adaos_pct", width: 8 },
    { key: "adaos_lei", width: 12 },
  ];

  // Merge [top,left]..[bottom,right], write value to the master cell, and
  // apply border/fill to every covered cell so the whole region is outlined.
  const box = (
    top: number,
    left: number,
    bottom: number,
    right: number,
    value: ExcelJS.CellValue,
    opts: BoxOpts = {}
  ): ExcelJS.Cell => {
    if (top !== bottom || left !== right) ws.mergeCells(top, left, bottom, right);
    const cell = ws.getCell(top, left);
    cell.value = value ?? "";
    cell.font = { bold: !!opts.bold, ...(opts.size ? { size: opts.size } : {}) };
    cell.alignment = {
      horizontal: opts.align ?? "left",
      vertical: "middle",
      wrapText: !!opts.wrap,
    };
    if (opts.numFmt) cell.numFmt = opts.numFmt;
    for (let r = top; r <= bottom; r++) {
      for (let c = left; c <= right; c++) {
        const cc = ws.getCell(r, c);
        if (opts.border !== false) cc.border = borderAll;
        if (opts.fill) cc.fill = opts.fill;
      }
    }
    return cell;
  };

  // ── Title band (no borders) ───────────────────────────────────────────────
  box(1, 1, 1, 12, "NOTA DE RECEPTIE", {
    bold: true,
    size: 14,
    align: "center",
    border: false,
  });
  box(2, 1, 2, 4, RECEIVING_COMPANY, { bold: true, border: false });
  box(
    2,
    9,
    2,
    12,
    `Nr. ${input.nir_number ?? "______"}   din ${input.nir_date ?? ""}`,
    { align: "right", border: false }
  );

  // ── Document / supplier header table (2 rows, 6 fields × 2 cols each) ──────
  const docHead = [
    "DOCUMENT LIVRARE",
    "Nr.",
    "DATA",
    "FURNIZORUL",
    "COD FISCAL",
    "ACHITAT CU",
  ];
  const docVals: (string | undefined)[] = [
    "Factura",
    input.invoice_number,
    input.invoice_date,
    input.supplier_name,
    input.supplier_fiscal_code,
    "",
  ];
  docHead.forEach((label, i) => {
    const left = i * 2 + 1;
    box(4, left, 4, left + 1, label, {
      bold: true,
      fill: HEADER_FILL,
      align: "center",
      wrap: true,
    });
  });
  docVals.forEach((v, i) => {
    const left = i * 2 + 1;
    box(5, left, 5, left + 1, v ?? "", { align: "left" });
  });

  // ── Delegat / transport line ──────────────────────────────────────────────
  box(6, 1, 6, 6, `DELEGAT: ${input.delegate_name ?? ""}`, {});
  box(6, 7, 6, 12, `Mijloc de transport: ${input.transport_means ?? ""}`, {});

  // ── Items column header (two rows; "Adaos comercial" spans % | Lei) ───────
  const HDR_TOP = 8;
  const HDR_BOT = 9;
  const verticalHeaders = [
    "Nr. crt.",
    "Denumirea",
    "UM",
    "Cantitatea",
    "Pret fără TVA",
    "Valoare fără TVA",
    "Valoare cu adaos",
    "TVA deductibil",
    "Pret de vânzare",
    "Valoare la pret de vânzare",
  ];
  verticalHeaders.forEach((label, i) => {
    const col = i + 1;
    box(HDR_TOP, col, HDR_BOT, col, label, {
      bold: true,
      fill: HEADER_FILL,
      align: "center",
      wrap: true,
    });
  });
  box(HDR_TOP, 11, HDR_TOP, 12, "Adaos comercial", {
    bold: true,
    fill: HEADER_FILL,
    align: "center",
    wrap: true,
  });
  box(HDR_BOT, 11, HDR_BOT, 11, "%", {
    bold: true,
    fill: HEADER_FILL,
    align: "center",
  });
  box(HDR_BOT, 12, HDR_BOT, 12, "Lei", {
    bold: true,
    fill: HEADER_FILL,
    align: "center",
  });
  ws.getRow(HDR_TOP).height = 28;
  ws.getRow(HDR_BOT).height = 16;

  // ── Data rows ─────────────────────────────────────────────────────────────
  let cur = HDR_BOT + 1;
  let totNoVat = 0,
    totMarkup = 0,
    totVat = 0,
    totSaleValue = 0,
    totAdaosLei = 0;

  input.items.forEach((item, idx) => {
    const c = computeRow(item);
    totNoVat += c.value_without_vat;
    totMarkup += c.value_with_markup;
    totVat += c.deductible_vat;
    totSaleValue += c.sale_value;
    totAdaosLei += c.adaos_lei;

    const num = (col: number, val: number) =>
      box(cur, col, cur, col, round2(val), { align: "right", numFmt: NUM_FMT });

    box(cur, 1, cur, 1, idx + 1, { align: "center" });
    box(cur, 2, cur, 2, item.name ?? item.raw_name ?? "", { align: "left" });
    box(cur, 3, cur, 3, item.unit ?? "", { align: "center" });
    num(4, c.qty);
    num(5, c.price);
    num(6, c.value_without_vat);
    num(7, c.value_with_markup);
    num(8, c.deductible_vat);
    num(9, c.salePrice);
    num(10, c.sale_value);
    box(cur, 11, cur, 11, c.markup, { align: "right" });
    num(12, c.adaos_lei);
    cur++;
  });

  // ── Totals row ────────────────────────────────────────────────────────────
  const totFmt: BoxOpts = {
    bold: true,
    fill: TOTAL_FILL,
    align: "right",
    numFmt: NUM_FMT,
  };
  box(cur, 1, cur, 5, "TOTAL", { bold: true, fill: TOTAL_FILL, align: "right" });
  box(cur, 6, cur, 6, round2(totNoVat), totFmt);
  box(cur, 7, cur, 7, round2(totMarkup), totFmt);
  box(cur, 8, cur, 8, round2(totVat), totFmt);
  box(cur, 9, cur, 9, "", { bold: true, fill: TOTAL_FILL });
  box(cur, 10, cur, 10, round2(totSaleValue), totFmt);
  box(cur, 11, cur, 11, "", { bold: true, fill: TOTAL_FILL });
  box(cur, 12, cur, 12, round2(totAdaosLei), totFmt);

  const buf = await wb.xlsx.writeBuffer();
  return Buffer.from(buf) as Buffer;
}
