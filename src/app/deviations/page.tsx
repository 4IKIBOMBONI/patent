"use client";

import { useEffect, useState } from "react";
import { StatusBadge } from "@/components/StatusBadge";
import {
  AlertTriangle,
  Plus,
  Search,
  CheckCircle2,
  Clock,
  User,
  FlaskConical,
  Wrench,
  Shield,
  Eye,
  Lock,
  ChevronDown,
  ChevronUp,
  Filter,
} from "lucide-react";

interface Deviation {
  id: number;
  sample_id: string | null;
  sample_number: string | null;
  test_name: string | null;
  equipment_name: string | null;
  deviation_type: string;
  severity: string;
  description: string;
  detected_at: string;
  detected_by: string;
  corrective_action: string | null;
  resolved_at: string | null;
  resolved_by: string | null;
  status: string;
}

const typeLabels: Record<string, string> = {
  environmental: "Условия среды",
  equipment: "Оборудование",
  procedural: "Процедурное",
  result: "Результат",
  sample: "Образец",
  other: "Прочее",
};

export default function DeviationsPage() {
  const [deviations, setDeviations] = useState<Deviation[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [filter, setFilter] = useState("");

  const [form, setForm] = useState({
    deviation_type: "procedural",
    severity: "minor",
    description: "",
    detected_by: "",
    corrective_action: "",
  });

  useEffect(() => {
    fetch("/api/deviations").then(r => r.json()).then(d => { setDeviations(d); setLoading(false); });
  }, []);

  const filtered = deviations
    .filter(d => !filter || d.status === filter)
    .filter(d =>
      d.description.toLowerCase().includes(search.toLowerCase()) ||
      (d.sample_number || "").toLowerCase().includes(search.toLowerCase()) ||
      d.detected_by.toLowerCase().includes(search.toLowerCase())
    );

  async function handleAdd(ev: React.FormEvent) {
    ev.preventDefault();
    await fetch("/api/deviations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setShowForm(false);
    setForm({ deviation_type: "procedural", severity: "minor", description: "", detected_by: "", corrective_action: "" });
    const data = await fetch("/api/deviations").then(r => r.json());
    setDeviations(data);
  }

  async function handleAction(id: number, action: string, extra?: Record<string, string>) {
    await fetch("/api/deviations", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, action, ...extra }),
    });
    const data = await fetch("/api/deviations").then(r => r.json());
    setDeviations(data);
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
            <AlertTriangle className="w-7 h-7 text-red-600" />
            Журнал отклонений
          </h1>
          <p className="text-sm text-slate-500 mt-1">Регистрация и отслеживание несоответствий</p>
        </div>
        <button onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 bg-gradient-to-r from-red-500 to-red-600 text-white px-5 py-2.5 rounded-xl text-sm font-medium hover:from-red-600 hover:to-red-700 shadow-lg shadow-red-200">
          <Plus className="w-4 h-4" />
          Зарегистрировать
        </button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 mb-6">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input type="text" placeholder="Поиск..." value={search} onChange={e => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-500" />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400" />
          {["", "open", "investigating", "resolved", "closed"].map(s => (
            <button key={s} onClick={() => setFilter(s)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${filter === s ? "bg-red-100 text-red-800" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}>
              {s === "" ? "Все" : s === "open" ? "Открытые" : s === "investigating" ? "Расследование" : s === "resolved" ? "Устранённые" : "Закрытые"}
            </button>
          ))}
        </div>
      </div>

      {/* Add form */}
      {showForm && (
        <form onSubmit={handleAdd} className="bg-white rounded-xl border border-slate-200 p-6 mb-6">
          <h3 className="font-semibold text-slate-900 mb-4">Новое отклонение</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div>
              <label className="text-xs font-medium text-slate-600 mb-1 block">Тип *</label>
              <select value={form.deviation_type} onChange={e => setForm(f => ({ ...f, deviation_type: e.target.value }))}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm">
                {Object.entries(typeLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-slate-600 mb-1 block">Серьёзность *</label>
              <select value={form.severity} onChange={e => setForm(f => ({ ...f, severity: e.target.value }))}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm">
                <option value="minor">Незначительное</option>
                <option value="major">Значительное</option>
                <option value="critical">Критическое</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-slate-600 mb-1 block">Обнаружил *</label>
              <input required value={form.detected_by} onChange={e => setForm(f => ({ ...f, detected_by: e.target.value }))}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm" placeholder="ФИО" />
            </div>
          </div>
          <div className="mb-4">
            <label className="text-xs font-medium text-slate-600 mb-1 block">Описание *</label>
            <textarea required value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm min-h-[80px]" placeholder="Подробное описание отклонения..." />
          </div>
          <div className="mb-4">
            <label className="text-xs font-medium text-slate-600 mb-1 block">Корректирующее действие</label>
            <input value={form.corrective_action} onChange={e => setForm(f => ({ ...f, corrective_action: e.target.value }))}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm" placeholder="Предпринятые меры" />
          </div>
          <button type="submit" disabled={!form.description || !form.detected_by}
            className="flex items-center gap-2 px-5 py-2.5 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 disabled:opacity-50">
            <Plus className="w-4 h-4" /> Зарегистрировать
          </button>
        </form>
      )}

      {/* Deviations list */}
      <div className="space-y-3">
        {loading ? (
          <div className="p-12 text-center text-slate-400 bg-white rounded-xl border border-slate-200">
            <div className="animate-spin w-8 h-8 border-2 border-red-600 border-t-transparent rounded-full mx-auto mb-3" />
            Загрузка...
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center text-slate-400 bg-white rounded-xl border border-slate-200">
            <Shield className="w-12 h-12 mx-auto mb-3 text-green-300" />
            <p className="font-medium">Отклонений не обнаружено</p>
          </div>
        ) : filtered.map(d => {
          const isExpanded = expandedId === d.id;
          return (
            <div key={d.id} className={`bg-white rounded-xl border overflow-hidden ${
              d.severity === "critical" && d.status === "open" ? "border-red-300" : "border-slate-200"
            }`}>
              <div className="flex items-center gap-4 p-4 cursor-pointer hover:bg-slate-50" onClick={() => setExpandedId(isExpanded ? null : d.id)}>
                <div className={`w-3 h-3 rounded-full ${
                  d.severity === "critical" ? "bg-red-500" : d.severity === "major" ? "bg-orange-500" : "bg-yellow-500"
                }`} />
                <div className="flex-1">
                  <p className="text-sm text-slate-900 line-clamp-1">{d.description}</p>
                  <div className="flex items-center gap-3 text-xs text-slate-500 mt-0.5">
                    <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {new Date(d.detected_at).toLocaleString("ru")}</span>
                    <span>{typeLabels[d.deviation_type]}</span>
                    {d.sample_number && <span className="flex items-center gap-1"><FlaskConical className="w-3 h-3" /> {d.sample_number}</span>}
                    {d.equipment_name && <span className="flex items-center gap-1"><Wrench className="w-3 h-3" /> {d.equipment_name}</span>}
                  </div>
                </div>
                <StatusBadge status={d.severity} type="severity" />
                <StatusBadge status={d.status} type="deviation" />
                {isExpanded ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
              </div>

              {isExpanded && (
                <div className="border-t border-slate-100 p-5 bg-slate-50/50">
                  <p className="text-sm text-slate-800 mb-3">{d.description}</p>
                  <div className="flex items-center gap-4 text-sm text-slate-600 mb-4">
                    <span className="flex items-center gap-1"><User className="w-4 h-4 text-slate-400" /> {d.detected_by}</span>
                    {d.corrective_action && <span className="text-green-700">Корр. действие: {d.corrective_action}</span>}
                    {d.resolved_by && <span className="flex items-center gap-1"><CheckCircle2 className="w-4 h-4 text-green-500" /> Устранил: {d.resolved_by}</span>}
                  </div>
                  <div className="flex gap-2">
                    {d.status === "open" && (
                      <button onClick={() => handleAction(d.id, "investigate")}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-600 text-white text-xs rounded-lg hover:bg-amber-700">
                        <Eye className="w-3.5 h-3.5" /> Расследование
                      </button>
                    )}
                    {["open", "investigating"].includes(d.status) && (
                      <button onClick={() => handleAction(d.id, "resolve", { resolved_by: "Лаборант", corrective_action: d.corrective_action || "Устранено" })}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-green-600 text-white text-xs rounded-lg hover:bg-green-700">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Устранить
                      </button>
                    )}
                    {d.status === "resolved" && (
                      <button onClick={() => handleAction(d.id, "close")}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-600 text-white text-xs rounded-lg hover:bg-slate-700">
                        <Lock className="w-3.5 h-3.5" /> Закрыть
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
