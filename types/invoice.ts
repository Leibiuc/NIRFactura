import type { z } from "zod";
import {
  InvoiceItemSchema,
  ExtractedInvoiceSchema,
  NirInputSchema,
} from "@/lib/schemas";

// Types are derived from the zod schemas (the single source of truth) so the
// runtime validation and the compile-time types can never drift apart. The
// value imports above are used only in `typeof` positions, so TS erases them at
// emit and zod never reaches the client bundle.
export type InvoiceItem = z.infer<typeof InvoiceItemSchema>;
export type ExtractedInvoice = z.infer<typeof ExtractedInvoiceSchema>;
export type NirInput = z.infer<typeof NirInputSchema>;
