import { NextResponse } from "next/server";
import { getDb } from "@/lib/db/schema";

export async function GET() {
  const db = getDb();
  const materials = db.prepare(`
    SELECT mt.*,
      (SELECT COUNT(*) FROM mandatory_tests mts WHERE mts.material_type_id = mt.id) as test_count
    FROM material_types mt
    ORDER BY mt.name
  `).all();
  return NextResponse.json(materials);
}
