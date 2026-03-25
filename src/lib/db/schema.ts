import Database from "better-sqlite3";
import path from "path";

const DB_PATH = path.join(process.cwd(), "lab_testing.db");

let _db: Database.Database | null = null;

export function getDb(): Database.Database {
  if (!_db) {
    _db = new Database(DB_PATH);
    _db.pragma("journal_mode = WAL");
    _db.pragma("foreign_keys = ON");
    initializeDb(_db);
  }
  return _db;
}

function initializeDb(db: Database.Database) {
  db.exec(`
    -- Справочник видов материалов
    CREATE TABLE IF NOT EXISTS material_types (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      code TEXT NOT NULL UNIQUE,
      description TEXT
    );

    -- Справочник обязательных испытаний для вида материала
    CREATE TABLE IF NOT EXISTS mandatory_tests (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      material_type_id INTEGER NOT NULL REFERENCES material_types(id),
      test_name TEXT NOT NULL,
      test_code TEXT NOT NULL,
      method_standard TEXT NOT NULL,
      curing_hours INTEGER NOT NULL DEFAULT 0,
      temperature_min REAL,
      temperature_max REAL,
      humidity_min REAL,
      humidity_max REAL,
      description TEXT,
      sort_order INTEGER NOT NULL DEFAULT 0
    );

    -- Образцы
    CREATE TABLE IF NOT EXISTS samples (
      id TEXT PRIMARY KEY,
      sample_number TEXT NOT NULL UNIQUE,
      material_type_id INTEGER NOT NULL REFERENCES material_types(id),
      batch_number TEXT NOT NULL,
      supplier TEXT,
      delivery_date TEXT NOT NULL,
      registration_date TEXT NOT NULL DEFAULT (datetime('now')),
      registered_by TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'registered'
        CHECK(status IN ('registered','in_testing','curing','completed','rejected')),
      notes TEXT,
      project_name TEXT,
      project_code TEXT
    );

    -- Назначенные испытания образца (маршрут)
    CREATE TABLE IF NOT EXISTS sample_tests (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      sample_id TEXT NOT NULL REFERENCES samples(id),
      mandatory_test_id INTEGER NOT NULL REFERENCES mandatory_tests(id),
      status TEXT NOT NULL DEFAULT 'pending'
        CHECK(status IN ('pending','curing','in_progress','completed','failed','skipped')),
      scheduled_date TEXT,
      curing_start TEXT,
      curing_end TEXT,
      started_at TEXT,
      completed_at TEXT,
      result_value REAL,
      result_unit TEXT,
      result_text TEXT,
      is_passed INTEGER,
      operator TEXT,
      equipment_id INTEGER REFERENCES equipment(id),
      notes TEXT,
      sort_order INTEGER NOT NULL DEFAULT 0
    );

    -- Условия окружающей среды (журнал)
    CREATE TABLE IF NOT EXISTS environment_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      sample_test_id INTEGER REFERENCES sample_tests(id),
      recorded_at TEXT NOT NULL DEFAULT (datetime('now')),
      temperature REAL NOT NULL,
      humidity REAL NOT NULL,
      pressure REAL,
      recorded_by TEXT NOT NULL,
      location TEXT,
      notes TEXT
    );

    -- Журнал оборудования
    CREATE TABLE IF NOT EXISTS equipment (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      inventory_number TEXT NOT NULL UNIQUE,
      model TEXT,
      manufacturer TEXT,
      serial_number TEXT,
      calibration_date TEXT,
      calibration_due TEXT,
      status TEXT NOT NULL DEFAULT 'active'
        CHECK(status IN ('active','maintenance','calibration','decommissioned')),
      location TEXT,
      responsible_person TEXT,
      notes TEXT
    );

    -- Журнал обслуживания оборудования
    CREATE TABLE IF NOT EXISTS equipment_maintenance (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      equipment_id INTEGER NOT NULL REFERENCES equipment(id),
      maintenance_type TEXT NOT NULL CHECK(maintenance_type IN ('calibration','repair','inspection','cleaning')),
      performed_at TEXT NOT NULL DEFAULT (datetime('now')),
      performed_by TEXT NOT NULL,
      next_due TEXT,
      result TEXT,
      notes TEXT
    );

    -- Журнал отклонений
    CREATE TABLE IF NOT EXISTS deviations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      sample_id TEXT REFERENCES samples(id),
      sample_test_id INTEGER REFERENCES sample_tests(id),
      equipment_id INTEGER REFERENCES equipment(id),
      deviation_type TEXT NOT NULL
        CHECK(deviation_type IN ('environmental','equipment','procedural','result','sample','other')),
      severity TEXT NOT NULL CHECK(severity IN ('minor','major','critical')),
      description TEXT NOT NULL,
      detected_at TEXT NOT NULL DEFAULT (datetime('now')),
      detected_by TEXT NOT NULL,
      corrective_action TEXT,
      resolved_at TEXT,
      resolved_by TEXT,
      status TEXT NOT NULL DEFAULT 'open'
        CHECK(status IN ('open','investigating','resolved','closed'))
    );

    -- Финальные протоколы (неизменяемые)
    CREATE TABLE IF NOT EXISTS protocols (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      protocol_number TEXT NOT NULL UNIQUE,
      sample_id TEXT NOT NULL REFERENCES samples(id),
      generated_at TEXT NOT NULL DEFAULT (datetime('now')),
      generated_by TEXT NOT NULL,
      data_snapshot TEXT NOT NULL,
      hash TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'draft'
        CHECK(status IN ('draft','signed','archived')),
      signed_by TEXT,
      signed_at TEXT,
      notes TEXT
    );

    -- Аудит-лог для защиты от подмены
    CREATE TABLE IF NOT EXISTS audit_log (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      table_name TEXT NOT NULL,
      record_id TEXT NOT NULL,
      action TEXT NOT NULL CHECK(action IN ('INSERT','UPDATE','DELETE')),
      old_data TEXT,
      new_data TEXT,
      performed_at TEXT NOT NULL DEFAULT (datetime('now')),
      performed_by TEXT NOT NULL DEFAULT 'system'
    );
  `);

  // Seed reference data if empty
  const count = db.prepare("SELECT COUNT(*) as cnt FROM material_types").get() as { cnt: number };
  if (count.cnt === 0) {
    seedData(db);
  }
}

function seedData(db: Database.Database) {
  const insertMaterial = db.prepare(
    "INSERT INTO material_types (name, code, description) VALUES (?, ?, ?)"
  );
  const insertTest = db.prepare(
    `INSERT INTO mandatory_tests (material_type_id, test_name, test_code, method_standard, curing_hours, temperature_min, temperature_max, humidity_min, humidity_max, description, sort_order)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  );
  const insertEquipment = db.prepare(
    `INSERT INTO equipment (name, inventory_number, model, manufacturer, serial_number, calibration_date, calibration_due, status, location, responsible_person)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  );

  const seedTx = db.transaction(() => {
    // Material types
    const materials = [
      { name: "Бетон", code: "BET", desc: "Бетонные смеси и изделия" },
      { name: "Цемент", code: "CEM", desc: "Портландцемент и специальные цементы" },
      { name: "Щебень", code: "SCH", desc: "Щебень и гравий" },
      { name: "Песок", code: "PES", desc: "Песок строительный" },
      { name: "Арматура", code: "ARM", desc: "Арматурная сталь" },
      { name: "Кирпич", code: "KIR", desc: "Кирпич керамический и силикатный" },
      { name: "Асфальтобетон", code: "ASF", desc: "Асфальтобетонные смеси" },
      { name: "Грунт", code: "GRU", desc: "Грунты строительных площадок" },
    ];

    const materialIds: Record<string, number> = {};
    for (const m of materials) {
      const result = insertMaterial.run(m.name, m.code, m.desc);
      materialIds[m.code] = Number(result.lastInsertRowid);
    }

    // Mandatory tests for Бетон
    const betonTests = [
      ["Прочность на сжатие (7 сут)", "BET-CS7", "ГОСТ 10180-2012", 168, 20, 22, 90, 100, "Испытание кубов 7 суток", 1],
      ["Прочность на сжатие (28 сут)", "BET-CS28", "ГОСТ 10180-2012", 672, 20, 22, 90, 100, "Испытание кубов 28 суток", 2],
      ["Водонепроницаемость", "BET-W", "ГОСТ 12730.5-2018", 672, 18, 22, 60, 80, "Определение марки по водонепроницаемости", 3],
      ["Морозостойкость", "BET-F", "ГОСТ 10060-2012", 672, -18, -15, null, null, "Определение марки по морозостойкости", 4],
      ["Подвижность смеси", "BET-SL", "ГОСТ 10181-2014", 0, 15, 30, null, null, "Определение подвижности (осадка конуса)", 5],
    ];

    for (const t of betonTests) {
      insertTest.run(materialIds["BET"], ...t);
    }

    // Mandatory tests for Цемент
    const cementTests = [
      ["Прочность на сжатие (2 сут)", "CEM-CS2", "ГОСТ 30744-2001", 48, 20, 22, 90, 100, "Ранняя прочность", 1],
      ["Прочность на сжатие (28 сут)", "CEM-CS28", "ГОСТ 30744-2001", 672, 20, 22, 90, 100, "Марочная прочность", 2],
      ["Тонкость помола", "CEM-FIN", "ГОСТ 310.2-76", 0, 18, 25, null, null, "Остаток на сите 008", 3],
      ["Нормальная густота", "CEM-NC", "ГОСТ 310.3-76", 0, 18, 25, null, null, "Нормальная густота цементного теста", 4],
      ["Сроки схватывания", "CEM-SET", "ГОСТ 310.3-76", 0, 18, 25, 50, 70, "Начало и конец схватывания", 5],
    ];

    for (const t of cementTests) {
      insertTest.run(materialIds["CEM"], ...t);
    }

    // Mandatory tests for Щебень
    const schTests = [
      ["Зерновой состав", "SCH-GR", "ГОСТ 8269.0-97", 0, 15, 30, null, null, "Ситовой анализ", 1],
      ["Дробимость", "SCH-CR", "ГОСТ 8269.0-97", 0, 15, 30, null, null, "Марка по дробимости", 2],
      ["Содержание пылевидных частиц", "SCH-DU", "ГОСТ 8269.0-97", 0, 15, 30, null, null, "Промывка", 3],
      ["Насыпная плотность", "SCH-BD", "ГОСТ 9758-2012", 0, 15, 30, null, null, "Насыпная плотность", 4],
    ];

    for (const t of schTests) {
      insertTest.run(materialIds["SCH"], ...t);
    }

    // Mandatory tests for Песок
    const pesTests = [
      ["Зерновой состав", "PES-GR", "ГОСТ 8735-88", 0, 15, 30, null, null, "Модуль крупности", 1],
      ["Содержание глинистых частиц", "PES-CL", "ГОСТ 8735-88", 0, 15, 30, null, null, "Метод набухания", 2],
      ["Насыпная плотность", "PES-BD", "ГОСТ 8735-88", 0, 15, 30, null, null, "Насыпная плотность в стандартном состоянии", 3],
    ];

    for (const t of pesTests) {
      insertTest.run(materialIds["PES"], ...t);
    }

    // Mandatory tests for Арматура
    const armTests = [
      ["Испытание на растяжение", "ARM-TS", "ГОСТ 12004-81", 0, 18, 25, null, null, "Предел текучести и прочности", 1],
      ["Испытание на изгиб", "ARM-BN", "ГОСТ 14019-2003", 0, 18, 25, null, null, "Изгиб в холодном состоянии", 2],
    ];

    for (const t of armTests) {
      insertTest.run(materialIds["ARM"], ...t);
    }

    // Equipment
    const equipmentData = [
      ["Пресс гидравлический ПГМ-1000", "ПР-001", "ПГМ-1000МГ4", "МЕТРОТЕСТ", "SN-2023-001", "2025-06-15", "2026-06-15", "active", "Зал испытаний №1", "Иванов А.В."],
      ["Пресс гидравлический ПГМ-500", "ПР-002", "ПГМ-500МГ4", "МЕТРОТЕСТ", "SN-2023-002", "2025-08-20", "2026-08-20", "active", "Зал испытаний №1", "Иванов А.В."],
      ["Разрывная машина Р-50", "РМ-001", "Р-50", "ТОЧМАШПРИБОР", "SN-2022-105", "2025-03-10", "2026-03-10", "active", "Зал испытаний №2", "Петров С.И."],
      ["Климатическая камера КТХ-200", "КК-001", "КТХ-200", "БИНАР", "SN-2024-010", "2025-09-01", "2026-09-01", "active", "Камера выдержки", "Сидорова Е.Н."],
      ["Весы лабораторные ВЛТ-1500", "ВЛ-001", "ВЛТ-1500-П", "МАССА-К", "SN-2024-055", "2025-11-15", "2026-05-15", "active", "Зал подготовки", "Козлов Д.М."],
      ["Сушильный шкаф СНОЛ-67", "СШ-001", "СНОЛ 67/350", "БОРТЕК", "SN-2023-088", "2025-04-22", "2026-04-22", "active", "Зал подготовки", "Козлов Д.М."],
      ["Виброплощадка СМЖ-539", "ВП-001", "СМЖ-539", "СТРОЙМАШ", "SN-2022-033", "2025-07-18", "2026-07-18", "active", "Зал формовки", "Иванов А.В."],
      ["Набор сит лабораторных КП-131", "НС-001", "КП-131", "ВИБРОТЕХНИК", "SN-2024-077", "2025-10-05", "2026-10-05", "active", "Зал подготовки", "Петров С.И."],
    ];

    for (const e of equipmentData) {
      insertEquipment.run(...e);
    }
  });

  seedTx();
}
