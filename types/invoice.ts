export type InvoiceItem = {
  raw_name?: string;
  name?: string;
  quantity?: number;
  unit?: string;
  purchase_price?: number;
  vat_rate?: number;
  markup_percent?: number;
  sale_price?: number;
};

export type ExtractedInvoice = {
  supplier_name?: string;
  supplier_fiscal_code?: string;
  invoice_number?: string;
  invoice_date?: string;
  delegate_name?: string;
  transport_means?: string;
  currency?: string;
  items: InvoiceItem[];
};

export type NirInput = {
  supplier_name?: string;
  supplier_fiscal_code?: string;
  invoice_number?: string;
  invoice_date?: string;
  nir_number?: string;
  nir_date?: string;
  delegate_name?: string;
  transport_means?: string;
  currency?: string;
  items: InvoiceItem[];
};
