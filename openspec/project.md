# MVP Spec for AI Coding Agents

## Project
Invoice image/PDF to NIR Excel generator.

## Goal
Build a stateless web tool that lets a user upload an invoice image or PDF, extracts invoice data with OCR/AI, allows manual review/editing, and generates a downloadable NIR Excel file.

This MVP must not use:
- database
- authentication
- persistent storage
- background workers
- job queues
- Supabase
- AWS

Everything should run inside a single Next.js application.

---

## Product Summary

The app has one main flow:

```txt
Upload invoice
→ Extract invoice data
→ Review/edit extracted rows
→ Generate NIR Excel
→ Download .xlsx
```

No uploaded invoice or generated file is saved permanently.
Files are processed temporarily during the request/session only.

---

## Tech Stack

```txt
Framework: Next.js App Router
Language: TypeScript
UI: React
Styling: Tailwind CSS
Excel generation: ExcelJS
OCR/AI: Anthropic API (Claude claude-sonnet-4-6, vision)
Validation: Zod
```

Recommended packages:

```txt
exceljs
zod
@anthropic-ai/sdk
react-hook-form optional
```

---

## High-Level Architecture

```txt
Browser UI
  ↓
Next.js API route: /api/process-invoice
  ↓
OCR/AI extraction
  ↓
Structured invoice JSON
  ↓
Review table in UI
  ↓
Next.js API route: /api/generate-nir
  ↓
ExcelJS creates .xlsx in memory
  ↓
Browser downloads file
```

---

## Folder Structure

```txt
app/
  page.tsx
  api/
    process-invoice/
      route.ts
    generate-nir/
      route.ts

components/
  UploadInvoice.tsx
  InvoiceReviewTable.tsx
  GenerateNirButton.tsx

lib/
  ocr.ts
  invoice-parser.ts
  nir-excel.ts
  schemas.ts
  utils.ts

types/
  invoice.ts
```

---

## Core Screens

### 1. Main page

Path:

```txt
/
```

Responsibilities:

- show upload area
- accept invoice file
- call `/api/process-invoice`
- display extracted invoice data
- allow user edits
- call `/api/generate-nir`
- trigger Excel download

---

### 2. Upload component

Component:

```txt
components/UploadInvoice.tsx
```

Requirements:

- accept `.jpg`, `.jpeg`, `.png`, `.pdf`
- max file size should be configurable
- show selected file name
- show loading state while processing
- show error message if extraction fails

---

### 3. Review table

Component:

```txt
components/InvoiceReviewTable.tsx
```

The user must be able to edit:

**Header fields:**
- supplier name
- supplier fiscal code
- invoice number
- invoice date
- NIR number
- NIR date
- delegate name
- transport means

**Per-row fields:**
- product name
- unit (UM)
- quantity
- purchase price (fără TVA)
- VAT rate (%)
- markup % (adaos comercial)
- sale price (pret de vânzare) — editable or auto-computed from markup

The following are computed and display-only (not editable):
- valoare fără TVA = quantity × purchase_price
- TVA deductibilă = value_without_vat × vat_rate / 100
- valoare cu adaos = value_without_vat × (1 + markup_percent / 100)
- valoare la pret de vânzare = quantity × sale_price

The table should support adding/removing rows manually.

---

## API Routes

## POST /api/process-invoice

Purpose:

Receive an uploaded invoice file and return structured invoice data.

Input:

```txt
multipart/form-data
file: image or PDF
```

Output:

```json
{
  "supplier_name": "SC EXEMPLU SRL",
  "supplier_fiscal_code": "RO12345678",
  "invoice_number": "3007-006571",
  "invoice_date": "2026-04-10",
  "delegate_name": "Teoace Cristian",
  "transport_means": "SC COMINTRY SRL",
  "currency": "RON",
  "items": [
    {
      "raw_name": "APA PLATA DORNA 2L",
      "quantity": 12,
      "unit": "buc",
      "purchase_price": 4.5,
      "vat_rate": 19,
      "markup_percent": null,
      "sale_price": null
    }
  ]
}
```

Rules:

- Do not save the uploaded file.
- Process the file in memory or temporary runtime storage only.
- Return `null` for unknown fields.
- Do not invent missing values.
- Validate output with Zod before returning to UI.

---

## POST /api/generate-nir

Purpose:

Receive reviewed invoice data and return an Excel NIR file.

Input:

```json
{
  "supplier_name": "SC EXEMPLU SRL",
  "supplier_fiscal_code": "RO12345678",
  "invoice_number": "3007-006571",
  "invoice_date": "2026-04-10",
  "nir_number": "561",
  "nir_date": "2026-04-10",
  "delegate_name": "Teoace Cristian",
  "transport_means": "SC COMINTRY SRL",
  "currency": "RON",
  "items": [
    {
      "name": "APA PLATA DORNA 2L",
      "quantity": 12,
      "unit": "buc",
      "purchase_price": 4.5,
      "vat_rate": 19,
      "markup_percent": 25,
      "sale_price": 5.625
    }
  ]
}
```

Output:

```txt
application/vnd.openxmlformats-officedocument.spreadsheetml.sheet
```

Headers:

```txt
Content-Disposition: attachment; filename="nir.xlsx"
```

Rules:

- Generate Excel in memory.
- Do not save generated file.
- Return file directly in response.

---

## Data Types

Create:

```txt
types/invoice.ts
```

```ts
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
```

---

## Zod Schemas

Create:

```txt
lib/schemas.ts
```

Schemas required:

- `InvoiceItemSchema`
- `ExtractedInvoiceSchema`
- `NirInputSchema`

Validation rules:

- items must be an array
- quantity is optional; when present must be a positive number
- prices are optional; when present must be non-negative
- vat_rate is optional; when present must be non-negative
- markup_percent is optional; when present must be non-negative
- sale_price is optional; when present must be non-negative
- string fields are optional

---

## OCR/AI Module

Create:

```txt
lib/ocr.ts
```

Export:

```ts
export async function extractInvoiceFromFile(file: File): Promise<ExtractedInvoice>
```

Responsibilities:

- receive uploaded file
- convert file to base64
- call Anthropic API using `@anthropic-ai/sdk` with `claude-sonnet-4-6`, passing the file as a vision message
- parse the structured JSON response
- return normalized `ExtractedInvoice`

Prompt requirements for AI extraction:

```txt
You are an invoice extraction engine.
Extract invoice metadata and line items from the provided invoice.
Return only valid JSON matching the schema.
Do not invent values.
If a value is missing or unreadable, return null.
Line items must preserve product names exactly as seen on the invoice.
```

Target JSON schema:

```json
{
  "supplier_name": "string|null",
  "supplier_fiscal_code": "string|null",
  "invoice_number": "string|null",
  "invoice_date": "YYYY-MM-DD|null",
  "delegate_name": "string|null",
  "transport_means": "string|null",
  "currency": "string|null",
  "items": [
    {
      "raw_name": "string|null",
      "quantity": "number|null",
      "unit": "string|null",
      "purchase_price": "number|null",
      "vat_rate": "number|null",
      "markup_percent": "number|null",
      "sale_price": "number|null"
    }
  ]
}
```

---

## Excel/NIR Module

Create:

```txt
lib/nir-excel.ts
```

Export:

```ts
export async function generateNirExcel(input: NirInput): Promise<Buffer>
```

Use ExcelJS.

The Excel file should include:

### Header

- title: `NOTA DE RECEPTIE`
- NIR number (`Nr.`)
- NIR date (`Data`)
- supplier name (`Furnizorul`)
- supplier fiscal code (`Cod Fiscal`)
- invoice/delivery document reference (`Document Livrare Nr.`)
- invoice date
- delegate name (`Delegat`)
- transport means (`Mijloc de transport`)

### Table columns

```txt
Nr. crt.
Denumirea
UM
Cantitatea
Pret fara TVA
Valoare fara TVA
Valoare cu adaos
TVA deductibila
Pret de vanzare
Valoare la pret de vanzare
% Adaos comercial
```

### Calculations

For each row:

```txt
value_without_vat   = quantity × purchase_price
deductible_vat      = value_without_vat × vat_rate / 100
value_with_markup   = value_without_vat × (1 + markup_percent / 100)
sale_value          = quantity × sale_price
```

`sale_price` is user-entered or derived as: `purchase_price × (1 + markup_percent / 100)` when not provided directly.

### Footer totals

Include column totals for:

- total value_without_vat
- total deductible_vat
- total value_with_markup
- total sale_value

---

## UI Behavior

Initial state:

```txt
No invoice uploaded.
Show upload box.
```

After upload:

```txt
Show loading state: "Procesam factura..."
```

After extraction:

```txt
Show editable invoice metadata.
Show editable line items table.
Show button: "Genereaza NIR Excel"
```

After generate:

```txt
Download starts automatically.
```

Error states:

- invalid file type
- file too large
- OCR failed
- invalid extracted JSON
- Excel generation failed

---

## Privacy Requirements

The app must not persist:

- uploaded invoice files
- extracted invoice data
- generated NIR files

Data may exist only:

- in browser state
- in request memory
- temporarily during API execution

No database.
No storage bucket.
No auth.

---

## Environment Variables

```txt
ANTHROPIC_API_KEY=
MAX_UPLOAD_MB=10
```

---

## Non-Goals for MVP

Do not implement:

- user accounts
- database
- invoice history
- product nomenclator
- continuous learning
- product matching
- Supabase
- AWS
- workers
- queues
- persistent storage
- ERP integrations

---

## Acceptance Criteria

The MVP is complete when:

1. User can upload a JPG/PNG/PDF invoice.
2. App extracts invoice metadata and line items.
3. User can edit extracted values in the browser.
4. User can add or remove invoice rows manually.
5. App generates a valid `.xlsx` NIR file.
6. Browser downloads the file.
7. No uploaded or generated documents are saved.
8. The app runs as a single Next.js app.

---

## Implementation Order

1. Create Next.js app structure.
2. Build upload UI.
3. Build `/api/process-invoice` with mocked extraction.
4. Build review/edit table.
5. Build `/api/generate-nir` using ExcelJS.
6. Add real OCR/AI provider.
7. Add Zod validation.
8. Polish errors and loading states.

---

## Mock Extraction Example

Before real OCR is connected, `/api/process-invoice` may return:

```json
{
  "supplier_name": "SC EXEMPLU SRL",
  "supplier_fiscal_code": "RO12345678",
  "invoice_number": "3007-006571",
  "invoice_date": "2026-04-10",
  "delegate_name": "Popescu Ion",
  "transport_means": "SC TRANSPORT SRL",
  "currency": "RON",
  "items": [
    {
      "raw_name": "APA PLATA DORNA 2L",
      "quantity": 12,
      "unit": "buc",
      "purchase_price": 4.5,
      "vat_rate": 19,
      "markup_percent": 25,
      "sale_price": 5.625
    },
    {
      "raw_name": "LAPTE ZUZU 1L",
      "quantity": 6,
      "unit": "buc",
      "purchase_price": 5.2,
      "vat_rate": 9,
      "markup_percent": 20,
      "sale_price": 6.24
    }
  ]
}
```

---

## Future Phase, Not MVP

Later versions may add:

- Supabase Auth
- Supabase Postgres
- product nomenclator
- automatic product learning
- saved invoices
- saved NIR documents
- worker-based processing
- AWS migration
- ERP integrations
