import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db/schema";
import crypto from "crypto";

export async function GET() {
  const db = getDb();
  const protocols = db.prepare(`
    SELECT p.*, s.sample_number, mt.name as material_type_name
    FROM protocols p
    JOIN samples s ON p.sample_id = s.id
    JOIN material_types mt ON s.material_type_id = mt.id
    ORDER BY p.generated_at DESC
  `).all();
  return NextResponse.json(protocols);
}

export async function POST(request: NextRequest) {
  const db = getDb();
  const body = await request.json();
  const { sample_id, generated_by } = body;

  // Gather complete snapshot of all data
  const sample = db.prepare(`
    SELECT s.*, mt.name as material_type_name, mt.code as material_type_code
    FROM samples s JOIN material_types mt ON s.material_type_id = mt.id
    WHERE s.id = ?
  `).get(sample_id);

  const tests = db.prepare(`
    SELECT st.*, mt.test_name, mt.test_code, mt.method_standard, mt.curing_hours
    FROM sample_tests st
    JOIN mandatory_tests mt ON st.mandatory_test_id = mt.id
    WHERE st.sample_id = ?
    ORDER BY st.sort_order
  `).all(sample_id);

  const envLogs = db.prepare(`
    SELECT el.* FROM environment_logs el
    JOIN sample_tests st ON el.sample_test_id = st.id
    WHERE st.sample_id = ?
    ORDER BY el.recorded_at
  `).all(sample_id);

  const deviations = db.prepare(`
    SELECT * FROM deviations WHERE sample_id = ? ORDER BY detected_at
  `).all(sample_id);

  const equipmentUsed = db.prepare(`
    SELECT DISTINCT e.* FROM equipment e
    JOIN sample_tests st ON st.equipment_id = e.id
    WHERE st.sample_id = ?
  `).all(sample_id);

  const snapshot = {
    generated_at: new Date().toISOString(),
    sample,
    tests,
    environment_logs: envLogs,
    deviations,
    equipment_used: equipmentUsed,
  };

  const snapshotJson = JSON.stringify(snapshot);
  const hash = crypto.createHash("sha256").update(snapshotJson).digest("hex");

  const protocolNumber = `PROT-${new Date().getFullYear()}-${String(Date.now()).slice(-6)}`;

  const result = db.prepare(`
    INSERT INTO protocols (protocol_number, sample_id, generated_by, data_snapshot, hash)
    VALUES (?, ?, ?, ?, ?)
  `).run(protocolNumber, sample_id, generated_by, snapshotJson, hash);

  db.prepare(`INSERT INTO audit_log (table_name, record_id, action, new_data, performed_by) VALUES ('protocols', ?, 'INSERT', ?, ?)`)
    .run(String(result.lastInsertRowid), JSON.stringify({ protocol_number: protocolNumber, hash }), generated_by);

  return NextResponse.json({
    id: Number(result.lastInsertRowid),
    protocol_number: protocolNumber,
    hash
  }, { status: 201 });
}
