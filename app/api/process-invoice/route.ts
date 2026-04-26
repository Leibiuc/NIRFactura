import { NextRequest, NextResponse } from "next/server";
import { extractInvoiceFromFile } from "@/lib/ocr";
import { ExtractedInvoiceSchema } from "@/lib/schemas";
import { MAX_UPLOAD_BYTES } from "@/lib/utils";

export const runtime = "nodejs";
export const maxDuration = 60;

const ALLOWED_TYPES = ["image/jpeg", "image/jpg", "image/png", "application/pdf"];
const ALLOWED_EXTENSIONS = /\.(jpg|jpeg|png|pdf)$/i;

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file");

    if (!file || !(file instanceof File)) {
      return NextResponse.json({ error: "No file provided." }, { status: 400 });
    }

    if (!ALLOWED_TYPES.includes(file.type) && !ALLOWED_EXTENSIONS.test(file.name)) {
      return NextResponse.json({ error: "Invalid file type." }, { status: 400 });
    }

    if (file.size > MAX_UPLOAD_BYTES) {
      return NextResponse.json({ error: "File exceeds size limit." }, { status: 400 });
    }

    const extracted = await extractInvoiceFromFile(file);
    const validated = ExtractedInvoiceSchema.parse(extracted);
    return NextResponse.json(validated);
  } catch (err) {
    console.error("process-invoice error:", err);
    return NextResponse.json({ error: "Extraction failed." }, { status: 500 });
  }
}
