import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db/schema";

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const db = getDb();

  const sample = db.prepare(`
    SELECT s.*, mt.name as material_type_name, mt.code as material_type_code
    FROM samples s
    JOIN material_types mt ON s.material_type_id = mt.id
    WHERE s.id = ?
  `).get(id);

  if (!sample) {
    return NextResponse.json({ error: "Образец не найден" }, { status: 404 });
  }

  const tests = db.prepare(`
    SELECT st.*, mt.test_name, mt.test_code, mt.method_standard,
           mt.curing_hours, mt.temperature_min, mt.temperature_max,
           mt.humidity_min, mt.humidity_max, mt.description as test_description,
           e.name as equipment_name, e.inventory_number as equipment_inv
    FROM sample_tests st
    JOIN mandatory_tests mt ON st.mandatory_test_id = mt.id
    LEFT JOIN equipment e ON st.equipment_id = e.id
    WHERE st.sample_id = ?
    ORDER BY st.sort_order
  `).all(id);

  const envLogs = db.prepare(`
    SELECT el.* FROM environment_logs el
    JOIN sample_tests st ON el.sample_test_id = st.id
    WHERE st.sample_id = ?
    ORDER BY el.recorded_at DESC
  `).all(id);

  const deviations = db.prepare(`
    SELECT * FROM deviations WHERE sample_id = ? ORDER BY detected_at DESC
  `).all(id);

  return NextResponse.json({ sample, tests, envLogs, deviations });
}

export async function PATCH(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const db = getDb();
  const body = await _request.json();

  if (body.status) {
    db.prepare("UPDATE samples SET status = ? WHERE id = ?").run(body.status, id);
    db.prepare(`INSERT INTO audit_log (table_name, record_id, action, new_data, performed_by) VALUES ('samples', ?, 'UPDATE', ?, ?)`)
      .run(id, JSON.stringify(body), body.updated_by || "system");
  }

  return NextResponse.json({ success: true });
}
