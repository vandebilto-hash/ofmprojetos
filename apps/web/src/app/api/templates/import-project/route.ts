import { NextResponse } from "next/server";
import { readFile } from "fs/promises";
import { join } from "path";

export async function GET() {
  const filePath = join(process.cwd(), "public", "templates", "template-importacao-projeto.csv");
  const content = await readFile(filePath, "utf-8");

  return new NextResponse(content, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="template-importacao-projeto.csv"'
    }
  });
}
