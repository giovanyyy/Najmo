import { NextResponse, NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get("token");

  if (!token) {
    return new NextResponse("Unauthorized: Token is required", { status: 401 });
  }

  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/operations`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    if (!res.ok) {
      return new NextResponse("Failed to fetch operations from backend", { status: res.status });
    }

    const operations = await res.json();

    const headers = [
      "ID",
      "Date",
      "Type",
      "Client",
      "Produit",
      "Montant DZD",
      "Coût DZD",
      "Profit DZD",
      "Devise Originale",
      "Montant Original",
      "Notes"
    ];

    const rows = operations.map((op: any) => {
      const opDate = op.operation_date ? new Date(op.operation_date).toLocaleDateString('fr-FR') : '';
      const opTypeLabel = op.operation_type === 'SALE' ? 'VENTE' : 
                          op.operation_type === 'PURCHASE' ? 'ACHAT' : 
                          op.operation_type === 'EXPENSE' ? 'CHARGE' : 'VIREMENT';
      const clientName = op.clients?.full_name || 'Passant';
      const productName = op.products?.name || 'Inconnu';
      const amount = Number(op.amount_dzd || 0).toFixed(2);
      const cost = Number(op.operation_cost || 0).toFixed(2);
      const profit = Number(op.profit || 0).toFixed(2);
      const foreignCur = op.foreign_currency || 'DZD';
      const foreignAmt = Number(op.foreign_amount || op.amount_dzd).toFixed(2);
      const notes = op.notes ? op.notes.replace(/"/g, '""') : '';

      return [
        `"${op.id}"`,
        `"${opDate}"`,
        `"${opTypeLabel}"`,
        `"${clientName}"`,
        `"${productName}"`,
        `"${amount}"`,
        `"${cost}"`,
        `"${profit}"`,
        `"${foreignCur}"`,
        `"${foreignAmt}"`,
        `"${notes}"`
      ].join(";");
    });

    const csvContent = "\uFEFF" + [headers.join(";"), ...rows].join("\n");

    const response = new NextResponse(csvContent, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": "attachment; filename=najmo_export_global.csv"
      }
    });

    return response;
  } catch (error: any) {
    console.error("Export error:", error);
    return new NextResponse("Server Error", { status: 500 });
  }
}
