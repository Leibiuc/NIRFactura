import { z } from "zod";

export const InvoiceItemSchema = z.object({
  raw_name: z.string().optional(),
  name: z.string().optional(),
  quantity: z.number().positive().optional(),
  unit: z.string().optional(),
  purchase_price: z.number().nonnegative().optional(),
  vat_rate: z.number().nonnegative().optional(),
  markup_percent: z.number().nonnegative().optional(),
  sale_price: z.number().nonnegative().optional(),
});

export const ExtractedInvoiceSchema = z.object({
  supplier_name: z.string().optional(),
  supplier_fiscal_code: z.string().optional(),
  invoice_number: z.string().optional(),
  invoice_date: z.string().optional(),
  delegate_name: z.string().optional(),
  transport_means: z.string().optional(),
  currency: z.string().optional(),
  items: z.array(InvoiceItemSchema),
});

export const NirInputSchema = z.object({
  supplier_name: z.string().optional(),
  supplier_fiscal_code: z.string().optional(),
  invoice_number: z.string().optional(),
  invoice_date: z.string().optional(),
  nir_number: z.string().optional(),
  nir_date: z.string().optional(),
  delegate_name: z.string().optional(),
  transport_means: z.string().optional(),
  currency: z.string().optional(),
  items: z.array(InvoiceItemSchema),
});
