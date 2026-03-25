import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db/schema";
import crypto from "crypto";

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const db = getDb();

  const protocol = db.prepare(`
    SELECT p.*, s.sample_number, mt.name as material_type_name
    FROM protocols p
    JOIN samples s ON p.sample_id = s.id
    JOIN material_types mt ON s.material_type_id = mt.id
    WHERE p.id = ?
  `).get(id);

  if (!protocol) {
    return NextResponse.json({ error: "Протокол не найден" }, { status: 404 });
  }

  // Verify data integrity
  const p = protocol as Record<string, unknown>;
  const currentHash = crypto.createHash("sha256").update(p.data_snapshot as string).digest("hex");
  const isValid = currentHash === p.hash;

  return NextResponse.json({ ...protocol, integrity_valid: isValid });
}

export async function PATCH(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const db = getDb();
  const body = await _request.json();

  if (body.action === "sign") {
    db.prepare("UPDATE protocols SET status = 'signed', signed_by = ?, signed_at = datetime('now') WHERE id = ? AND status = 'draft'")
      .run(body.signed_by, id);
  } else if (body.action === "archive") {
    db.prepare("UPDATE protocols SET status = 'archived' WHERE id = ? AND status = 'signed'").run(id);
  }

  return NextResponse.json({ success: true });
}
