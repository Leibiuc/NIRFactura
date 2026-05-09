---
name: invoice-ocr
description: Cost-effective invoice transcription via Codex vision. Apply when implementing or reviewing lib/ocr.ts to ensure lowest token cost per extraction.
license: MIT
metadata:
  author: NIRFactura
  version: '1.0'
---

Apply these rules whenever writing or reviewing the invoice OCR module (`lib/ocr.ts`).

---

## Model

Always use `Codex-sonnet-4-6`. Do not use Opus for structured extraction — it costs 67% more per token for no benefit on this task.

---

## Image cost rules (Sonnet 4.6 caps at 1568 tokens / 1568px long edge)

| Technique | Why |
|---|---|
| Resize image to max 1568px on the long edge before sending | Anything larger is silently downscaled anyway — you pay the base64 transfer cost for nothing |
| Convert to JPEG (quality 85) before base64 encoding | JPEG is 3–5× smaller than PNG for photos/scans; reduces request payload and latency |
| For PDFs: render only the first page at 1200px width | Most invoices are single-page; rendering at 1200px stays under the cap and keeps tokens ~1334 |
| Never send the raw uploaded file directly | Always go through the resize/convert step |

**Token formula:** `width × height / 750`  
Target: stay at or below ~1334 tokens per image (1000×1000px equivalent).

---

## Prompt rules (minimize output tokens)

The output is structured JSON, not prose. Every extra word costs $15/MTok.

```
You are an invoice extraction engine.
Extract invoice metadata and line items from the provided invoice image.
Return ONLY valid JSON matching the schema below. No explanation. No markdown.
If a value is missing or unreadable, use null. Never invent values.
Preserve product names exactly as printed.

Schema:
{
  "supplier_name": "string|null",
  "invoice_number": "string|null",
  "invoice_date": "YYYY-MM-DD|null",
  "currency": "string|null",
  "items": [{
    "raw_name": "string|null",
    "quantity": "number|null",
    "unit": "string|null",
    "purchase_price": "number|null",
    "vat_rate": "number|null",
    "line_total": "number|null"
  }]
}
```

- Set `max_tokens: 1024` — sufficient for any invoice JSON; do not over-allocate
- The system prompt above is identical on every call — apply `cache_control: { type: "ephemeral" }` to it (cached input billed at $0.30/MTok vs $3/MTok, ~90% saving)

---

## Reference implementation

```typescript
import Anthropic from "@anthropic-ai/sdk";
import sharp from "sharp"; // for resize/convert
import type { ExtractedInvoice } from "@/types/invoice";

const client = new Anthropic();

const SYSTEM_PROMPT = `You are an invoice extraction engine.
Extract invoice metadata and line items from the provided invoice image.
Return ONLY valid JSON matching the schema below. No explanation. No markdown.
If a value is missing or unreadable, use null. Never invent values.
Preserve product names exactly as printed.

Schema:
{"supplier_name":"string|null","invoice_number":"string|null","invoice_date":"YYYY-MM-DD|null","currency":"string|null","items":[{"raw_name":"string|null","quantity":"number|null","unit":"string|null","purchase_price":"number|null","vat_rate":"number|null","line_total":"number|null"}]}`;

export async function extractInvoiceFromFile(file: File): Promise<ExtractedInvoice> {
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  // Resize to max 1568px long edge, convert to JPEG quality 85
  const optimized = await sharp(buffer)
    .resize(1568, 1568, { fit: "inside", withoutEnlargement: true })
    .jpeg({ quality: 85 })
    .toBuffer();

  const base64 = optimized.toString("base64");

  const response = await client.messages.create({
    model: "Codex-sonnet-4-6",
    max_tokens: 1024,
    system: [
      {
        type: "text",
        text: SYSTEM_PROMPT,
        cache_control: { type: "ephemeral" }, // cache system prompt — same every call
      },
    ],
    messages: [
      {
        role: "user",
        content: [
          {
            type: "image",
            source: {
              type: "base64",
              media_type: "image/jpeg",
              data: base64,
            },
          },
          {
            type: "text",
            text: "Extract the invoice data.",
          },
        ],
      },
    ],
  });

  const text = response.content[0].type === "text" ? response.content[0].text : "";
  return JSON.parse(text) as ExtractedInvoice;
}
```

---

## Cost per request (after optimizations)

| Component | Tokens | Cost |
|---|---|---|
| System prompt (cached after first call) | ~200 | ~$0.00006 |
| Invoice image (1000×1000px JPEG) | ~1,334 | ~$0.004 |
| User message | ~10 | ~$0.00003 |
| JSON output | ~300 | ~$0.0045 |
| **Total** | ~1,844 | **~$0.009** |

Roughly **0.9 cents per invoice** with caching active (vs ~$0.012 without).

---

## PDF handling

Next.js API routes receive `File` objects. For PDFs, use `pdf2pic` or `pdfjs-dist` to render page 1 as a JPEG image at 150 DPI / 1200px width before passing to `sharp`. Do not send PDFs directly to the vision API — they are not a supported media type for the image block.

---

## Checklist before shipping `lib/ocr.ts`

- [ ] Image resized to ≤1568px long edge before base64
- [ ] Image converted to JPEG (quality ~85)
- [ ] System prompt uses `cache_control: { type: "ephemeral" }`
- [ ] `max_tokens` set to 1024 (not higher)
- [ ] Model is `Codex-sonnet-4-6`
- [ ] Prompt ends with "No explanation. No markdown."
- [ ] PDF input goes through page-1 render step before sharp
