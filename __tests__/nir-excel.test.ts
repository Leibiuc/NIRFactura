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
  await wb.xlsx.load(buffer);
  return wb.getWorksheet("NIR")!;
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
    // Find the column-header row by looking for "Denumirea"
    let headerRowNum = -1;
    ws.eachRow((row, num) => {
      row.eachCell((cell) => {
        if (String(cell.value) === "Denumirea") headerRowNum = num;
      });
    });
    expect(headerRowNum).toBeGreaterThan(0);
    // Data rows = items.length, then 1 total row
    const dataRowNum = headerRowNum + BASE_INPUT.items.length;
    const totalRowNum = dataRowNum + 1;
    expect(ws.rowCount).toBeGreaterThanOrEqual(totalRowNum);
  });

  it("correctly calculates value_without_vat for first item", async () => {
    const buf = await generateNirExcel(BASE_INPUT);
    const ws = await parseWorkbook(buf);
    // Find header row
    let headerRowNum = -1;
    ws.eachRow((row, num) => {
      row.eachCell((cell) => {
        if (String(cell.value) === "Denumirea") headerRowNum = num;
      });
    });
    const firstDataRow = ws.getRow(headerRowNum + 1);
    // Col 6 = Valoare fara TVA
    const valueWithoutVat = Number(firstDataRow.getCell(6).value);
    expect(valueWithoutVat).toBeCloseTo(12 * 4.5, 2); // 54.00
  });

  it("correctly calculates deductible_vat for first item", async () => {
    const buf = await generateNirExcel(BASE_INPUT);
    const ws = await parseWorkbook(buf);
    let headerRowNum = -1;
    ws.eachRow((row, num) => {
      row.eachCell((cell) => {
        if (String(cell.value) === "Denumirea") headerRowNum = num;
      });
    });
    const firstDataRow = ws.getRow(headerRowNum + 1);
    const deductibleVat = Number(firstDataRow.getCell(8).value);
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
    let headerRowNum = -1;
    ws.eachRow((row, num) => {
      row.eachCell((cell) => {
        if (String(cell.value) === "Denumirea") headerRowNum = num;
      });
    });
    const dataRow = ws.getRow(headerRowNum + 1);
    const saleValue = Number(dataRow.getCell(10).value); // Valoare la pret de vanzare
    expect(saleValue).toBeCloseTo(2 * 15, 2); // 2 × (10 × 1.5) = 30
  });
});
