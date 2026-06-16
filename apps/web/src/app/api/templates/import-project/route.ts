import { NextResponse } from "next/server";

export async function GET() {
  const serviceUrl = process.env.MPP_SERVICE_URL;

  if (!serviceUrl) {
    return NextResponse.json(
      { error: "Servico MPP nao esta disponivel. O template MPP requer o servico MPXJ." },
      { status: 503 }
    );
  }

  try {
    const response = await fetch(`${serviceUrl}/template`);

    if (!response.ok) {
      return NextResponse.json({ error: "Falha ao gerar template MPP." }, { status: 502 });
    }

    const buffer = await response.arrayBuffer();

    return new NextResponse(buffer, {
      headers: {
        "Content-Type": "application/octet-stream",
        "Content-Disposition": 'attachment; filename="template-projete-se.mpp"'
      }
    });
  } catch {
    return NextResponse.json(
      { error: "Servico MPP nao esta acessivel." },
      { status: 503 }
    );
  }
}
