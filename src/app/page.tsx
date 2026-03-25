import { getDb } from "@/lib/db/schema";
import Link from "next/link";
import {
  FlaskConical,
  Timer,
  CheckCircle2,
  AlertTriangle,
  FileCheck2,
  Wrench,
  ArrowRight,
  TrendingUp,
  ShieldAlert,
  Clock,
} from "lucide-react";

export const dynamic = "force-dynamic";

function getStats() {
  const db = getDb();

  const totalSamples = (db.prepare("SELECT COUNT(*) as cnt FROM samples").get() as { cnt: number }).cnt;
  const inTesting = (db.prepare("SELECT COUNT(*) as cnt FROM samples WHERE status = 'in_testing'").get() as { cnt: number }).cnt;
  const curing = (db.prepare("SELECT COUNT(*) as cnt FROM samples WHERE status = 'curing'").get() as { cnt: number }).cnt;
  const completed = (db.prepare("SELECT COUNT(*) as cnt FROM samples WHERE status = 'completed'").get() as { cnt: number }).cnt;

  const openDeviations = (db.prepare("SELECT COUNT(*) as cnt FROM deviations WHERE status IN ('open','investigating')").get() as { cnt: number }).cnt;
  const criticalDeviations = (db.prepare("SELECT COUNT(*) as cnt FROM deviations WHERE severity = 'critical' AND status IN ('open','investigating')").get() as { cnt: number }).cnt;

  const totalProtocols = (db.prepare("SELECT COUNT(*) as cnt FROM protocols").get() as { cnt: number }).cnt;

  const equipmentDue = (db.prepare("SELECT COUNT(*) as cnt FROM equipment WHERE calibration_due <= date('now', '+30 days') AND status = 'active'").get() as { cnt: number }).cnt;

  const recentSamples = db.prepare(`
    SELECT s.*, mt.name as material_type_name, mt.code as material_type_code
    FROM samples s JOIN material_types mt ON s.material_type_id = mt.id
    ORDER BY s.registration_date DESC LIMIT 5
  `).all() as Array<Record<string, unknown>>;

  const recentDeviations = db.prepare(`
    SELECT d.*, s.sample_number
    FROM deviations d LEFT JOIN samples s ON d.sample_id = s.id
    WHERE d.status IN ('open', 'investigating')
    ORDER BY d.detected_at DESC LIMIT 5
  `).all() as Array<Record<string, unknown>>;

  return { totalSamples, inTesting, curing, completed, openDeviations, criticalDeviations, totalProtocols, equipmentDue, recentSamples, recentDeviations };
}

const statusLabels: Record<string, string> = {
  registered: "Зарегистрирован",
  in_testing: "На испытании",
  curing: "Выдержка",
  completed: "Завершён",
  rejected: "Забракован",
};

const statusColors: Record<string, string> = {
  registered: "text-blue-600",
  in_testing: "text-amber-600",
  curing: "text-purple-600",
  completed: "text-green-600",
  rejected: "text-red-600",
};

export default function Dashboard() {
  const stats = getStats();

  const cards = [
    { label: "Всего образцов", value: stats.totalSamples, icon: FlaskConical, color: "from-blue-600 to-blue-700", href: "/samples" },
    { label: "На испытании", value: stats.inTesting, icon: TrendingUp, color: "from-amber-500 to-amber-600", href: "/samples?status=in_testing" },
    { label: "На выдержке", value: stats.curing, icon: Timer, color: "from-purple-600 to-purple-700", href: "/samples?status=curing" },
    { label: "Завершено", value: stats.completed, icon: CheckCircle2, color: "from-green-600 to-green-700", href: "/samples?status=completed" },
    { label: "Откл. (открытые)", value: stats.openDeviations, icon: AlertTriangle, color: stats.openDeviations > 0 ? "from-red-500 to-red-600" : "from-slate-500 to-slate-600", href: "/deviations" },
    { label: "Протоколы", value: stats.totalProtocols, icon: FileCheck2, color: "from-cyan-600 to-cyan-700", href: "/protocols" },
  ];

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Панель управления</h1>
        <p className="text-sm text-slate-500 mt-1">Лабораторный маршрут испытаний строительных материалов</p>
      </div>

      {/* Alert for critical deviations */}
      {stats.criticalDeviations > 0 && (
        <Link href="/deviations" className="flex items-center gap-3 p-4 mb-6 bg-red-50 border border-red-200 rounded-xl hover:bg-red-100 transition-colors">
          <ShieldAlert className="w-6 h-6 text-red-600" />
          <div>
            <p className="font-semibold text-red-800">Критические отклонения: {stats.criticalDeviations}</p>
            <p className="text-sm text-red-600">Требуется немедленное вмешательство</p>
          </div>
          <ArrowRight className="w-5 h-5 text-red-400 ml-auto" />
        </Link>
      )}

      {/* Equipment calibration warning */}
      {stats.equipmentDue > 0 && (
        <Link href="/equipment" className="flex items-center gap-3 p-4 mb-6 bg-amber-50 border border-amber-200 rounded-xl hover:bg-amber-100 transition-colors">
          <Wrench className="w-6 h-6 text-amber-600" />
          <div>
            <p className="font-semibold text-amber-800">Оборудование: {stats.equipmentDue} ед. требует поверки в ближайшие 30 дней</p>
          </div>
          <ArrowRight className="w-5 h-5 text-amber-400 ml-auto" />
        </Link>
      )}

      {/* Stats cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <Link key={card.label} href={card.href} className="group relative overflow-hidden rounded-xl bg-white border border-slate-200 p-5 hover:shadow-lg transition-all duration-200">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-slate-500 font-medium">{card.label}</p>
                  <p className="text-3xl font-bold text-slate-900 mt-1">{card.value}</p>
                </div>
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${card.color} flex items-center justify-center shadow-lg`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
              </div>
              <div className="mt-3 flex items-center gap-1 text-xs text-slate-400 group-hover:text-slate-600 transition-colors">
                <span>Подробнее</span>
                <ArrowRight className="w-3 h-3" />
              </div>
            </Link>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent samples */}
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="flex items-center justify-between p-5 border-b border-slate-100">
            <h2 className="font-semibold text-slate-900 flex items-center gap-2">
              <FlaskConical className="w-5 h-5 text-blue-600" />
              Последние образцы
            </h2>
            <Link href="/samples" className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1">
              Все <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          {stats.recentSamples.length === 0 ? (
            <div className="p-8 text-center text-slate-400">
              <FlaskConical className="w-10 h-10 mx-auto mb-2 text-slate-300" />
              <p>Нет зарегистрированных образцов</p>
              <Link href="/samples/new" className="text-blue-600 text-sm hover:underline mt-1 inline-block">Зарегистрировать первый</Link>
            </div>
          ) : (
            <div className="divide-y divide-slate-50">
              {stats.recentSamples.map((s) => (
                <Link key={s.id as string} href={`/samples/${s.id}`} className="flex items-center justify-between p-4 hover:bg-slate-50 transition-colors">
                  <div>
                    <p className="font-medium text-sm text-slate-900">{s.sample_number as string}</p>
                    <p className="text-xs text-slate-500">{s.material_type_name as string} — партия {s.batch_number as string}</p>
                  </div>
                  <span className={`text-xs font-medium ${statusColors[s.status as string] || "text-slate-500"}`}>
                    {statusLabels[s.status as string] || (s.status as string)}
                  </span>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Open deviations */}
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="flex items-center justify-between p-5 border-b border-slate-100">
            <h2 className="font-semibold text-slate-900 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-red-600" />
              Открытые отклонения
            </h2>
            <Link href="/deviations" className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1">
              Все <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          {stats.recentDeviations.length === 0 ? (
            <div className="p-8 text-center text-slate-400">
              <CheckCircle2 className="w-10 h-10 mx-auto mb-2 text-green-300" />
              <p>Нет открытых отклонений</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-50">
              {stats.recentDeviations.map((d) => (
                <div key={d.id as number} className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded ${
                          d.severity === "critical" ? "bg-red-100 text-red-700" :
                          d.severity === "major" ? "bg-orange-100 text-orange-700" : "bg-yellow-100 text-yellow-700"
                        }`}>{d.severity === "critical" ? "КРИТ" : d.severity === "major" ? "ЗНАЧ" : "НЕЗН"}</span>
                        {d.sample_number ? <span className="text-xs text-slate-500">{String(d.sample_number)}</span> : null}
                      </div>
                      <p className="text-sm text-slate-800 mt-1 line-clamp-2">{d.description as string}</p>
                    </div>
                    <Clock className="w-4 h-4 text-slate-300 ml-2 flex-shrink-0" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
