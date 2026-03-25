import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db/schema";

export async function PATCH(request: NextRequest) {
  const db = getDb();
  const body = await request.json();
  const { test_id, action, ...data } = body;

  const test = db.prepare("SELECT * FROM sample_tests WHERE id = ?").get(test_id) as Record<string, unknown> | undefined;
  if (!test) {
    return NextResponse.json({ error: "Тест не найден" }, { status: 404 });
  }

  const now = new Date().toISOString();

  switch (action) {
    case "start_curing": {
      const mandatoryTest = db.prepare("SELECT * FROM mandatory_tests WHERE id = ?").get(test.mandatory_test_id as number) as Record<string, unknown>;
      const curingHours = mandatoryTest.curing_hours as number;
      const curingEnd = new Date(Date.now() + curingHours * 3600000).toISOString();
      db.prepare("UPDATE sample_tests SET status = 'curing', curing_start = ?, curing_end = ? WHERE id = ?")
        .run(now, curingEnd, test_id);
      // Update sample status
      db.prepare("UPDATE samples SET status = 'curing' WHERE id = ?").run(test.sample_id);
      break;
    }
    case "start_test": {
      db.prepare("UPDATE sample_tests SET status = 'in_progress', started_at = ?, operator = ?, equipment_id = ? WHERE id = ?")
        .run(now, data.operator || null, data.equipment_id || null, test_id);
      db.prepare("UPDATE samples SET status = 'in_testing' WHERE id = ?").run(test.sample_id);
      break;
    }
    case "complete_test": {
      db.prepare(`UPDATE sample_tests SET status = 'completed', completed_at = ?, result_value = ?, result_unit = ?, result_text = ?, is_passed = ?, notes = ? WHERE id = ?`)
        .run(now, data.result_value, data.result_unit || null, data.result_text || null, data.is_passed ? 1 : 0, data.notes || null, test_id);

      // Check if all tests completed
      const sampleId = test.sample_id as string;
      const pending = db.prepare("SELECT COUNT(*) as cnt FROM sample_tests WHERE sample_id = ? AND status NOT IN ('completed','skipped','failed')").get(sampleId) as { cnt: number };
      if (pending.cnt === 0) {
        db.prepare("UPDATE samples SET status = 'completed' WHERE id = ?").run(sampleId);
      }
      break;
    }
    case "fail_test": {
      db.prepare("UPDATE sample_tests SET status = 'failed', completed_at = ?, result_text = ?, is_passed = 0, notes = ? WHERE id = ?")
        .run(now, data.result_text || null, data.notes || null, test_id);
      break;
    }
    case "skip_test": {
      db.prepare("UPDATE sample_tests SET status = 'skipped', notes = ? WHERE id = ?")
        .run(data.notes || "Пропущен", test_id);
      break;
    }
  }

  // Audit
  db.prepare(`INSERT INTO audit_log (table_name, record_id, action, new_data, performed_by) VALUES ('sample_tests', ?, 'UPDATE', ?, ?)`)
    .run(String(test_id), JSON.stringify({ action, ...data }), data.operator || "system");

  return NextResponse.json({ success: true });
}
