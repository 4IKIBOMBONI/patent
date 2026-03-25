import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db/schema";

export async function GET() {
  const db = getDb();
  const equipment = db.prepare(`
    SELECT e.*,
      (SELECT COUNT(*) FROM equipment_maintenance em WHERE em.equipment_id = e.id) as maintenance_count,
      (SELECT MAX(em.performed_at) FROM equipment_maintenance em WHERE em.equipment_id = e.id) as last_maintenance
    FROM equipment e
    ORDER BY e.name
  `).all();
  return NextResponse.json(equipment);
}

export async function POST(request: NextRequest) {
  const db = getDb();
  const body = await request.json();

  const result = db.prepare(`
    INSERT INTO equipment (name, inventory_number, model, manufacturer, serial_number, calibration_date, calibration_due, status, location, responsible_person, notes)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    body.name, body.inventory_number, body.model || null,
    body.manufacturer || null, body.serial_number || null,
    body.calibration_date || null, body.calibration_due || null,
    body.status || "active", body.location || null,
    body.responsible_person || null, body.notes || null
  );

  return NextResponse.json({ id: Number(result.lastInsertRowid) }, { status: 201 });
}

export async function PATCH(request: NextRequest) {
  const db = getDb();
  const body = await request.json();
  const { id, ...data } = body;

  if (data.maintenance) {
    db.prepare(`
      INSERT INTO equipment_maintenance (equipment_id, maintenance_type, performed_by, next_due, result, notes)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(id, data.maintenance.type, data.maintenance.performed_by, data.maintenance.next_due || null, data.maintenance.result || null, data.maintenance.notes || null);

    if (data.maintenance.type === "calibration" && data.maintenance.next_due) {
      db.prepare("UPDATE equipment SET calibration_date = datetime('now'), calibration_due = ? WHERE id = ?")
        .run(data.maintenance.next_due, id);
    }
  } else {
    const fields = Object.keys(data).map(k => `${k} = ?`).join(", ");
    const values = Object.values(data);
    db.prepare(`UPDATE equipment SET ${fields} WHERE id = ?`).run(...values, id);
  }

  return NextResponse.json({ success: true });
}
