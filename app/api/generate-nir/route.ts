import { NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";
import { generateNirExcel } from "@/lib/nir-excel";
import { NirInputSchema } from "@/lib/schemas";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const input = NirInputSchema.parse(body);
    const buffer = await generateNirExcel(input);

    return new NextResponse(new Uint8Array(buffer), {
      status: 200,
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": 'attachment; filename="nir.xlsx"',
      },
    });
  } catch (err) {
    if (err instanceof ZodError) {
      return NextResponse.json({ error: "Invalid NIR data." }, { status: 400 });
    }
    console.error("generate-nir error:", err);
    return NextResponse.json({ error: "Excel generation failed." }, { status: 500 });
  }
}
