import Anthropic from "@anthropic-ai/sdk";
import sharp from "sharp";
import type { ExtractedInvoice } from "@/types/invoice";
import { ExtractedInvoiceSchema } from "@/lib/schemas";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const SYSTEM_PROMPT = `You are an invoice extraction engine.
Extract invoice metadata and line items from the provided invoice image.
Return ONLY valid JSON matching the schema below. No explanation. No markdown. No code fences.
If a value is missing or unreadable, omit the field entirely. Never invent values.
Preserve product names exactly as printed on the invoice.
Dates must be in YYYY-MM-DD format.

Schema:
{"supplier_name":"string","supplier_fiscal_code":"string","invoice_number":"string","invoice_date":"YYYY-MM-DD","delegate_name":"string","transport_means":"string","currency":"string","items":[{"raw_name":"string","quantity":"number","unit":"string","purchase_price":"number","vat_rate":"number","markup_percent":"number","sale_price":"number"}]}`;

async function fileToJpegBase64(file: File): Promise<string> {
  const buffer = Buffer.from(await file.arrayBuffer());
  const optimized = await sharp(buffer)
    .resize(1568, 1568, { fit: "inside", withoutEnlargement: true })
    .jpeg({ quality: 85 })
    .toBuffer();
  return optimized.toString("base64");
}

async function pdfToJpegBase64(file: File): Promise<string> {
  const { fromBuffer } = await import("pdf2pic");
  const buffer = Buffer.from(await file.arrayBuffer());
  const convert = fromBuffer(buffer, {
    density: 150,
    width: 1200,
    height: 1700,
    format: "jpeg",
    saveFilename: "page",
    savePath: "/tmp",
  });
  const result = await convert(1) as { base64?: string };
  if (!result.base64) throw new Error("PDF page render failed");
  const optimized = await sharp(Buffer.from(result.base64, "base64"))
    .resize(1568, 1568, { fit: "inside", withoutEnlargement: true })
    .jpeg({ quality: 85 })
    .toBuffer();
  return optimized.toString("base64");
}

export async function extractInvoiceFromFile(file: File): Promise<ExtractedInvoice> {
  const isPdf = file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
  const base64 = isPdf ? await pdfToJpegBase64(file) : await fileToJpegBase64(file);

  const response = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 1024,
    system: [
      {
        type: "text",
        text: SYSTEM_PROMPT,
        cache_control: { type: "ephemeral" },
      },
    ],
    messages: [
      {
        role: "user",
        content: [
          {
            type: "image",
            source: { type: "base64", media_type: "image/jpeg", data: base64 },
          },
          { type: "text", text: "Extract the invoice data." },
        ],
      },
    ],
  });

  const text = response.content[0].type === "text" ? response.content[0].text.trim() : "";
  const parsed = JSON.parse(text);
  return ExtractedInvoiceSchema.parse(parsed);
}
