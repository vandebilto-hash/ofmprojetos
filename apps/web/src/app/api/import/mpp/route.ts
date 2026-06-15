import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const serviceUrl = process.env.MPP_SERVICE_URL ?? "http://localhost:8081";
  const formData = await request.formData();
  const response = await fetch(`${serviceUrl}/import`, {
    method: "POST",
    body: formData
  });

  if (!response.ok) {
    return NextResponse.json({ error: "Falha ao importar MPP pelo servico MPXJ" }, { status: 502 });
  }

  return NextResponse.json(await response.json());
}
