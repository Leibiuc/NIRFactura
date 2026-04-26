import { InvoiceItemSchema, ExtractedInvoiceSchema, NirInputSchema } from "@/lib/schemas";

describe("InvoiceItemSchema", () => {
  it("accepts a fully populated item", () => {
    const result = InvoiceItemSchema.safeParse({
      raw_name: "APA PLATA 2L",
      quantity: 12,
      unit: "buc",
      purchase_price: 4.5,
      vat_rate: 19,
      markup_percent: 25,
      sale_price: 5.625,
    });
    expect(result.success).toBe(true);
  });

  it("accepts an empty item (all optional)", () => {
    expect(InvoiceItemSchema.safeParse({}).success).toBe(true);
  });

  it("rejects negative quantity", () => {
    expect(InvoiceItemSchema.safeParse({ quantity: -1 }).success).toBe(false);
  });

  it("rejects negative purchase_price", () => {
    expect(InvoiceItemSchema.safeParse({ purchase_price: -0.01 }).success).toBe(false);
  });

  it("rejects negative vat_rate", () => {
    expect(InvoiceItemSchema.safeParse({ vat_rate: -5 }).success).toBe(false);
  });

  it("rejects negative markup_percent", () => {
    expect(InvoiceItemSchema.safeParse({ markup_percent: -10 }).success).toBe(false);
  });

  it("accepts zero values for prices", () => {
    const result = InvoiceItemSchema.safeParse({ purchase_price: 0, vat_rate: 0, markup_percent: 0 });
    expect(result.success).toBe(true);
  });
});

describe("ExtractedInvoiceSchema", () => {
  it("accepts a complete extracted invoice", () => {
    const result = ExtractedInvoiceSchema.safeParse({
      supplier_name: "SC EXEMPLU SRL",
      supplier_fiscal_code: "RO12345678",
      invoice_number: "3007-006571",
      invoice_date: "2026-04-10",
      delegate_name: "Popescu Ion",
      transport_means: "SC TRANSPORT SRL",
      currency: "RON",
      items: [{ raw_name: "PRODUS 1", quantity: 2, unit: "buc", purchase_price: 10, vat_rate: 19 }],
    });
    expect(result.success).toBe(true);
  });

  it("accepts an invoice with no optional header fields", () => {
    expect(ExtractedInvoiceSchema.safeParse({ items: [] }).success).toBe(true);
  });

  it("requires items array", () => {
    expect(ExtractedInvoiceSchema.safeParse({}).success).toBe(false);
  });

  it("rejects invalid item inside items array", () => {
    const result = ExtractedInvoiceSchema.safeParse({
      items: [{ quantity: -5 }],
    });
    expect(result.success).toBe(false);
  });
});

describe("NirInputSchema", () => {
  it("accepts full nir input", () => {
    const result = NirInputSchema.safeParse({
      supplier_name: "SC EXEMPLU SRL",
      invoice_number: "INV-001",
      invoice_date: "2026-04-10",
      nir_number: "561",
      nir_date: "2026-04-10",
      currency: "RON",
      items: [{ name: "PRODUS", quantity: 1, unit: "buc", purchase_price: 10, vat_rate: 19, markup_percent: 20, sale_price: 12 }],
    });
    expect(result.success).toBe(true);
  });

  it("accepts empty items list", () => {
    expect(NirInputSchema.safeParse({ items: [] }).success).toBe(true);
  });
});
