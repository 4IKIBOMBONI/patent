import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db/schema";

export async function GET() {
  const db = getDb();
  const deviations = db.prepare(`
    SELECT d.*,
      s.sample_number,
      mt.test_name,
      e.name as equipment_name
    FROM deviations d
    LEFT JOIN samples s ON d.sample_id = s.id
    LEFT JOIN sample_tests st ON d.sample_test_id = st.id
    LEFT JOIN mandatory_tests mt ON st.mandatory_test_id = mt.id
    LEFT JOIN equipment e ON d.equipment_id = e.id
    ORDER BY d.detected_at DESC
  `).all();
  return NextResponse.json(deviations);
}

export async function POST(request: NextRequest) {
  const db = getDb();
  const body = await request.json();

  const result = db.prepare(`
    INSERT INTO deviations (sample_id, sample_test_id, equipment_id, deviation_type, severity, description, detected_by, corrective_action)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    body.sample_id || null, body.sample_test_id || null,
    body.equipment_id || null, body.deviation_type,
    body.severity, body.description, body.detected_by,
    body.corrective_action || null
  );

  return NextResponse.json({ id: Number(result.lastInsertRowid) }, { status: 201 });
}

export async function PATCH(request: NextRequest) {
  const db = getDb();
  const body = await request.json();

  if (body.action === "resolve") {
    db.prepare(`UPDATE deviations SET status = 'resolved', resolved_at = datetime('now'), resolved_by = ?, corrective_action = ? WHERE id = ?`)
      .run(body.resolved_by, body.corrective_action || null, body.id);
  } else if (body.action === "close") {
    db.prepare(`UPDATE deviations SET status = 'closed' WHERE id = ?`).run(body.id);
  } else if (body.action === "investigate") {
    db.prepare(`UPDATE deviations SET status = 'investigating' WHERE id = ?`).run(body.id);
  }

  return NextResponse.json({ success: true });
}
