import ExcelJS from "exceljs";
import { generateNirExcel } from "@/lib/nir-excel";
import type { NirInput } from "@/types/invoice";

const BASE_INPUT: NirInput = {
  supplier_name: "SC EXEMPLU SRL",
  supplier_fiscal_code: "RO12345678",
  invoice_number: "INV-001",
  invoice_date: "2026-04-10",
  nir_number: "561",
  nir_date: "2026-04-10",
  delegate_name: "Popescu Ion",
  transport_means: "SC TRANSPORT SRL",
  currency: "RON",
  items: [
    {
      name: "APA PLATA 2L",
      quantity: 12,
      unit: "buc",
      purchase_price: 4.5,
      vat_rate: 19,
      markup_percent: 25,
      sale_price: 5.625,
    },
    {
      name: "LAPTE 1L",
      quantity: 6,
      unit: "buc",
      purchase_price: 5.2,
      vat_rate: 9,
      markup_percent: 20,
      sale_price: 6.24,
    },
  ],
};

async function parseWorkbook(buffer: Buffer) {
  const wb = new ExcelJS.Workbook();
  // @ts-expect-error: ExcelJS types predate TypeScript 6 Buffer generics
  await wb.xlsx.load(buffer);
  return wb.getWorksheet("NIR")!;
}

// The column header spans two rows ("Adaos comercial" → % | Lei), so the first
// data row is the first row whose Nr. crt. cell (col 1) holds a number.
function firstDataRow(ws: ExcelJS.Worksheet) {
  let num = -1;
  ws.eachRow((row, rowNum) => {
    if (num === -1 && typeof row.getCell(1).value === "number") num = rowNum;
  });
  return ws.getRow(num);
}

describe("generateNirExcel", () => {
  it("returns a non-empty Buffer", async () => {
    const buf = await generateNirExcel(BASE_INPUT);
    expect(buf).toBeInstanceOf(Buffer);
    expect(buf.length).toBeGreaterThan(0);
  });

  it("produces a valid xlsx workbook with NIR sheet", async () => {
    const buf = await generateNirExcel(BASE_INPUT);
    const ws = await parseWorkbook(buf);
    expect(ws).toBeDefined();
    expect(ws.name).toBe("NIR");
  });

  it("includes NOTA DE RECEPTIE title", async () => {
    const buf = await generateNirExcel(BASE_INPUT);
    const ws = await parseWorkbook(buf);
    const firstCell = ws.getRow(1).getCell(1).value;
    expect(String(firstCell)).toContain("NOTA DE RECEPTIE");
  });

  it("has the correct number of data rows (one per item + header + totals)", async () => {
    const buf = await generateNirExcel(BASE_INPUT);
    const ws = await parseWorkbook(buf);
    const dataStart = firstDataRow(ws).number;
    expect(dataStart).toBeGreaterThan(0);
    // Data rows = items.length, then 1 total row
    const totalRowNum = dataStart + BASE_INPUT.items.length;
    expect(ws.rowCount).toBeGreaterThanOrEqual(totalRowNum);
  });

  it("includes the split 'Adaos comercial' sub-header (% | Lei)", async () => {
    const buf = await generateNirExcel(BASE_INPUT);
    const ws = await parseWorkbook(buf);
    const values: string[] = [];
    ws.eachRow((row) => row.eachCell((cell) => values.push(String(cell.value))));
    expect(values).toContain("Adaos comercial");
    expect(values).toContain("%");
    expect(values).toContain("Lei");
    expect(values).toContain("ACHITAT CU");
    expect(values).toContain("FURNIZORUL");
  });

  it("correctly calculates value_without_vat for first item", async () => {
    const buf = await generateNirExcel(BASE_INPUT);
    const ws = await parseWorkbook(buf);
    // Col 6 = Valoare fara TVA
    const valueWithoutVat = Number(firstDataRow(ws).getCell(6).value);
    expect(valueWithoutVat).toBeCloseTo(12 * 4.5, 2); // 54.00
  });

  it("correctly calculates deductible_vat for first item", async () => {
    const buf = await generateNirExcel(BASE_INPUT);
    const ws = await parseWorkbook(buf);
    const deductibleVat = Number(firstDataRow(ws).getCell(8).value);
    expect(deductibleVat).toBeCloseTo(54 * 0.19, 2); // 10.26
  });

  it("handles empty items list without throwing", async () => {
    const buf = await generateNirExcel({ ...BASE_INPUT, items: [] });
    expect(buf.length).toBeGreaterThan(0);
  });

  it("derives sale_price from markup_percent when sale_price is missing", async () => {
    const input: NirInput = {
      ...BASE_INPUT,
      items: [
        {
          name: "PRODUS",
          quantity: 2,
          unit: "buc",
          purchase_price: 10,
          vat_rate: 19,
          markup_percent: 50,
        },
      ],
    };
    const buf = await generateNirExcel(input);
    const ws = await parseWorkbook(buf);
    const saleValue = Number(firstDataRow(ws).getCell(10).value); // Valoare la pret de vanzare
    expect(saleValue).toBeCloseTo(2 * 15, 2); // 2 × (10 × 1.5) = 30
  });
});
