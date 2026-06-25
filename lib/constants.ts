/** Default VAT rate (TVA) applied when an item has none. */
export const DEFAULT_VAT_RATE = 21; // %

/** Default commercial markup (adaos comercial) applied when an item has none. */
export const DEFAULT_MARKUP_PERCENT = 20; // %

/**
 * Receiving company (our own firm) printed top-left on the NIR. It is not
 * captured from the supplier invoice; it prepopulates the header field and is
 * the fallback when the user clears it.
 */
export const DEFAULT_RECEIVING_COMPANY = "S.C. SIMCRIS DARMARKET SRL";
