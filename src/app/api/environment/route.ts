import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db/schema";

export async function GET(request: NextRequest) {
  const db = getDb();
  const { searchParams } = new URL(request.url);
  const sampleTestId = searchParams.get("sample_test_id");

  let query = "SELECT * FROM environment_logs";
  const params: string[] = [];

  if (sampleTestId) {
    query += " WHERE sample_test_id = ?";
    params.push(sampleTestId);
  }

  query += " ORDER BY recorded_at DESC LIMIT 100";

  const logs = db.prepare(query).all(...params);
  return NextResponse.json(logs);
}

export async function POST(request: NextRequest) {
  const db = getDb();
  const body = await request.json();

  const result = db.prepare(`
    INSERT INTO environment_logs (sample_test_id, temperature, humidity, pressure, recorded_by, location, notes)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(
    body.sample_test_id || null, body.temperature, body.humidity,
    body.pressure || null, body.recorded_by,
    body.location || null, body.notes || null
  );

  // Check for environmental deviations
  if (body.sample_test_id) {
    const test = db.prepare(`
      SELECT mt.temperature_min, mt.temperature_max, mt.humidity_min, mt.humidity_max
      FROM sample_tests st
      JOIN mandatory_tests mt ON st.mandatory_test_id = mt.id
      WHERE st.id = ?
    `).get(body.sample_test_id) as Record<string, number | null> | undefined;

    if (test) {
      const violations: string[] = [];
      if (test.temperature_min !== null && body.temperature < test.temperature_min)
        violations.push(`Температура ${body.temperature}°C ниже минимума ${test.temperature_min}°C`);
      if (test.temperature_max !== null && body.temperature > test.temperature_max)
        violations.push(`Температура ${body.temperature}°C выше максимума ${test.temperature_max}°C`);
      if (test.humidity_min !== null && body.humidity < test.humidity_min)
        violations.push(`Влажность ${body.humidity}% ниже минимума ${test.humidity_min}%`);
      if (test.humidity_max !== null && body.humidity > test.humidity_max)
        violations.push(`Влажность ${body.humidity}% выше максимума ${test.humidity_max}%`);

      if (violations.length > 0) {
        const st = db.prepare("SELECT sample_id FROM sample_tests WHERE id = ?").get(body.sample_test_id) as { sample_id: string };
        db.prepare(`
          INSERT INTO deviations (sample_id, sample_test_id, deviation_type, severity, description, detected_by)
          VALUES (?, ?, 'environmental', 'major', ?, ?)
        `).run(st.sample_id, body.sample_test_id, violations.join("; "), "system");
      }
    }
  }

  return NextResponse.json({ id: Number(result.lastInsertRowid) }, { status: 201 });
}
