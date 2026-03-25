import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db/schema";
import { v4 as uuidv4 } from "uuid";

export async function GET(request: NextRequest) {
  const db = getDb();
  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");

  let query = `
    SELECT s.*, mt.name as material_type_name, mt.code as material_type_code,
      (SELECT COUNT(*) FROM sample_tests st WHERE st.sample_id = s.id) as total_tests,
      (SELECT COUNT(*) FROM sample_tests st WHERE st.sample_id = s.id AND st.status = 'completed') as completed_tests
    FROM samples s
    JOIN material_types mt ON s.material_type_id = mt.id
  `;
  const params: string[] = [];

  if (status) {
    query += " WHERE s.status = ?";
    params.push(status);
  }

  query += " ORDER BY s.registration_date DESC";

  const samples = db.prepare(query).all(...params);
  return NextResponse.json(samples);
}

export async function POST(request: NextRequest) {
  const db = getDb();
  const body = await request.json();

  const id = uuidv4();
  const sampleNumber = `SMP-${Date.now().toString(36).toUpperCase()}`;

  const insertSample = db.prepare(`
    INSERT INTO samples (id, sample_number, material_type_id, batch_number, supplier, delivery_date, registered_by, notes, project_name, project_code)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const assignTests = db.prepare(`
    INSERT INTO sample_tests (sample_id, mandatory_test_id, status, sort_order)
    SELECT ?, id, 'pending', sort_order
    FROM mandatory_tests WHERE material_type_id = ?
  `);

  const tx = db.transaction(() => {
    insertSample.run(
      id, sampleNumber, body.material_type_id, body.batch_number,
      body.supplier || null, body.delivery_date, body.registered_by,
      body.notes || null, body.project_name || null, body.project_code || null
    );

    // Auto-assign mandatory tests
    assignTests.run(id, body.material_type_id);

    // Audit log
    db.prepare(`INSERT INTO audit_log (table_name, record_id, action, new_data, performed_by) VALUES ('samples', ?, 'INSERT', ?, ?)`)
      .run(id, JSON.stringify({ ...body, id, sample_number: sampleNumber }), body.registered_by);

    return { id, sample_number: sampleNumber };
  });

  const result = tx();
  return NextResponse.json(result, { status: 201 });
}
