import type { InvoiceItem } from "@/types/invoice";
import { DEFAULT_VAT_RATE, DEFAULT_MARKUP_PERCENT } from "@/lib/constants";

export type NirRow = {
  qty: number;
  price: number;
  vatRate: number;
  markup: number;
  value_without_vat: number;
  adaos_lei: number;
  value_with_markup: number;
  deductible_vat: number;
  price_with_vat: number;
  salePrice: number;
  sale_value: number;
};

/** Gross unit price: purchase price with VAT added. */
export const priceWithVat = (price: number, vatRate: number) =>
  price * (1 + vatRate / 100);

/**
 * Single source of truth for NIR row math, shared by the on-screen review
 * table and the generated Excel so they never drift apart.
 */
export function computeNirRow(item: InvoiceItem): NirRow {
  const qty = item.quantity ?? 0;
  const price = item.purchase_price ?? 0;
  const vatRate = item.vat_rate ?? DEFAULT_VAT_RATE;
  const markup = item.markup_percent ?? DEFAULT_MARKUP_PERCENT;

  const value_without_vat = qty * price;
  const adaos_lei = (value_without_vat * markup) / 100;
  const value_with_markup = value_without_vat + adaos_lei;
  const deductible_vat = (value_without_vat * vatRate) / 100;

  const price_with_vat = priceWithVat(price, vatRate);
  const salePrice =
    item.sale_price ??
    (markup > 0 ? price_with_vat * (1 + markup / 100) : price_with_vat);
  const sale_value = qty * salePrice;

  return {
    qty,
    price,
    vatRate,
    markup,
    value_without_vat,
    adaos_lei,
    value_with_markup,
    deductible_vat,
    price_with_vat,
    salePrice,
    sale_value,
  };
}
