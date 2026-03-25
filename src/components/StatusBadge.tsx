import {
  Clock,
  FlaskConical,
  Timer,
  CheckCircle2,
  XCircle,
  SkipForward,
  CircleDot,
  AlertTriangle,
  Search,
  Lock,
  Archive,
  FileEdit,
  Wrench,
  Gauge,
  Ban,
} from "lucide-react";

const sampleStatusConfig: Record<string, { label: string; color: string; icon: React.ComponentType<{ className?: string }> }> = {
  registered: { label: "Зарегистрирован", color: "bg-blue-100 text-blue-800 border-blue-200", icon: CircleDot },
  in_testing: { label: "На испытании", color: "bg-amber-100 text-amber-800 border-amber-200", icon: FlaskConical },
  curing: { label: "Выдержка", color: "bg-purple-100 text-purple-800 border-purple-200", icon: Timer },
  completed: { label: "Завершён", color: "bg-green-100 text-green-800 border-green-200", icon: CheckCircle2 },
  rejected: { label: "Забракован", color: "bg-red-100 text-red-800 border-red-200", icon: XCircle },
};

const testStatusConfig: Record<string, { label: string; color: string; icon: React.ComponentType<{ className?: string }> }> = {
  pending: { label: "Ожидает", color: "bg-slate-100 text-slate-700 border-slate-200", icon: Clock },
  curing: { label: "Выдержка", color: "bg-purple-100 text-purple-800 border-purple-200", icon: Timer },
  in_progress: { label: "Выполняется", color: "bg-amber-100 text-amber-800 border-amber-200", icon: FlaskConical },
  completed: { label: "Выполнен", color: "bg-green-100 text-green-800 border-green-200", icon: CheckCircle2 },
  failed: { label: "Не пройден", color: "bg-red-100 text-red-800 border-red-200", icon: XCircle },
  skipped: { label: "Пропущен", color: "bg-gray-100 text-gray-600 border-gray-200", icon: SkipForward },
};

const deviationStatusConfig: Record<string, { label: string; color: string; icon: React.ComponentType<{ className?: string }> }> = {
  open: { label: "Открыто", color: "bg-red-100 text-red-800 border-red-200", icon: AlertTriangle },
  investigating: { label: "Расследование", color: "bg-amber-100 text-amber-800 border-amber-200", icon: Search },
  resolved: { label: "Устранено", color: "bg-green-100 text-green-800 border-green-200", icon: CheckCircle2 },
  closed: { label: "Закрыто", color: "bg-slate-100 text-slate-600 border-slate-200", icon: Lock },
};

const protocolStatusConfig: Record<string, { label: string; color: string; icon: React.ComponentType<{ className?: string }> }> = {
  draft: { label: "Черновик", color: "bg-slate-100 text-slate-700 border-slate-200", icon: FileEdit },
  signed: { label: "Подписан", color: "bg-green-100 text-green-800 border-green-200", icon: CheckCircle2 },
  archived: { label: "В архиве", color: "bg-blue-100 text-blue-800 border-blue-200", icon: Archive },
};

const equipmentStatusConfig: Record<string, { label: string; color: string; icon: React.ComponentType<{ className?: string }> }> = {
  active: { label: "Активно", color: "bg-green-100 text-green-800 border-green-200", icon: CheckCircle2 },
  maintenance: { label: "Обслуживание", color: "bg-amber-100 text-amber-800 border-amber-200", icon: Wrench },
  calibration: { label: "Поверка", color: "bg-blue-100 text-blue-800 border-blue-200", icon: Gauge },
  decommissioned: { label: "Списано", color: "bg-red-100 text-red-800 border-red-200", icon: Ban },
};

const severityConfig: Record<string, { label: string; color: string }> = {
  minor: { label: "Незначительное", color: "bg-yellow-100 text-yellow-800 border-yellow-200" },
  major: { label: "Значительное", color: "bg-orange-100 text-orange-800 border-orange-200" },
  critical: { label: "Критическое", color: "bg-red-100 text-red-800 border-red-200" },
};

type BadgeType = "sample" | "test" | "deviation" | "protocol" | "equipment" | "severity";

const configMap: Record<string, Record<string, { label: string; color: string; icon?: React.ComponentType<{ className?: string }> }>> = {
  sample: sampleStatusConfig,
  test: testStatusConfig,
  deviation: deviationStatusConfig,
  protocol: protocolStatusConfig,
  equipment: equipmentStatusConfig,
  severity: severityConfig,
};

export function StatusBadge({ status, type }: { status: string; type: BadgeType }) {
  const config = configMap[type]?.[status];
  if (!config) return <span className="text-xs text-gray-500">{status}</span>;

  const Icon = "icon" in config ? config.icon : null;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${config.color}`}>
      {Icon && <Icon className="w-3.5 h-3.5" />}
      {config.label}
    </span>
  );
}
