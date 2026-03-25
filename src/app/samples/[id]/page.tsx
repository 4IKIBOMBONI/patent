"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { StatusBadge } from "@/components/StatusBadge";
import {
  ArrowLeft,
  FlaskConical,
  Route,
  Timer,
  Play,
  CheckCircle2,
  XCircle,
  SkipForward,
  Thermometer,
  Droplets,
  Gauge,
  Wrench,
  AlertTriangle,
  FileCheck2,
  Clock,
  User,
  MapPin,
  Hash,
  Package,
  Calendar,
  Building2,
  ChevronDown,
  ChevronUp,
  Plus,
  Shield,
} from "lucide-react";

interface SampleData {
  sample: Record<string, unknown>;
  tests: Array<Record<string, unknown>>;
  envLogs: Array<Record<string, unknown>>;
  deviations: Array<Record<string, unknown>>;
}

interface Equipment {
  id: number;
  name: string;
  inventory_number: string;
  status: string;
}

export default function SampleDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [data, setData] = useState<SampleData | null>(null);
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedTest, setExpandedTest] = useState<number | null>(null);
  const [showEnvForm, setShowEnvForm] = useState<number | null>(null);
  const [showCompleteForm, setShowCompleteForm] = useState<number | null>(null);
  const [envForm, setEnvForm] = useState({ temperature: "", humidity: "", pressure: "", recorded_by: "", location: "" });
  const [resultForm, setResultForm] = useState({ result_value: "", result_unit: "", result_text: "", is_passed: true, notes: "", operator: "", equipment_id: "" });

  const fetchData = useCallback(async () => {
    const [sampleRes, eqRes] = await Promise.all([
      fetch(`/api/samples/${params.id}`),
      fetch("/api/equipment"),
    ]);
    setData(await sampleRes.json());
    setEquipment(await eqRes.json());
    setLoading(false);
  }, [params.id]);

  useEffect(() => { fetchData(); }, [fetchData]);

  async function handleTestAction(testId: number, action: string, extra?: Record<string, unknown>) {
    await fetch("/api/tests", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ test_id: testId, action, ...extra }),
    });
    fetchData();
  }

  async function handleEnvSubmit(sampleTestId: number) {
    await fetch("/api/environment", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...envForm, sample_test_id: sampleTestId, temperature: Number(envForm.temperature), humidity: Number(envForm.humidity), pressure: envForm.pressure ? Number(envForm.pressure) : null }),
    });
    setShowEnvForm(null);
    setEnvForm({ temperature: "", humidity: "", pressure: "", recorded_by: "", location: "" });
    fetchData();
  }

  async function handleComplete(testId: number) {
    await handleTestAction(testId, "complete_test", {
      ...resultForm,
      result_value: Number(resultForm.result_value),
      is_passed: resultForm.is_passed,
      equipment_id: resultForm.equipment_id ? Number(resultForm.equipment_id) : null,
    });
    setShowCompleteForm(null);
    setResultForm({ result_value: "", result_unit: "", result_text: "", is_passed: true, notes: "", operator: "", equipment_id: "" });
  }

  async function handleGenerateProtocol() {
    const res = await fetch("/api/protocols", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sample_id: params.id, generated_by: "Лаборант" }),
    });
    const protocol = await res.json();
    router.push(`/protocols?highlight=${protocol.id}`);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!data) return <div className="p-8 text-center text-red-600">Образец не найден</div>;

  const { sample: s, tests, envLogs, deviations } = data;
  const allDone = tests.every(t => ["completed", "skipped", "failed"].includes(t.status as string));

  return (
    <div>
      <button onClick={() => router.push("/samples")} className="flex items-center gap-2 text-slate-500 hover:text-slate-800 text-sm mb-4 transition-colors">
        <ArrowLeft className="w-4 h-4" /> К реестру образцов
      </button>

      {/* Header */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 mb-6">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-2xl font-bold text-slate-900 font-mono">{s.sample_number as string}</h1>
              <StatusBadge status={s.status as string} type="sample" />
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4 text-sm">
              <div className="flex items-center gap-2 text-slate-600">
                <FlaskConical className="w-4 h-4 text-blue-500" />
                <span>{s.material_type_name as string}</span>
              </div>
              <div className="flex items-center gap-2 text-slate-600">
                <Package className="w-4 h-4 text-slate-400" />
                <span>Партия: {s.batch_number as string}</span>
              </div>
              <div className="flex items-center gap-2 text-slate-600">
                <Calendar className="w-4 h-4 text-slate-400" />
                <span>{new Date(s.delivery_date as string).toLocaleDateString("ru")}</span>
              </div>
              <div className="flex items-center gap-2 text-slate-600">
                <User className="w-4 h-4 text-slate-400" />
                <span>{s.registered_by as string}</span>
              </div>
              {s.project_name ? (
                <div className="flex items-center gap-2 text-slate-600 col-span-2">
                  <Building2 className="w-4 h-4 text-slate-400" />
                  <span>{String(s.project_name)} {s.project_code ? `(${s.project_code})` : ""}</span>
                </div>
              ) : null}
              {s.supplier ? (
                <div className="flex items-center gap-2 text-slate-600 col-span-2">
                  <MapPin className="w-4 h-4 text-slate-400" />
                  <span>{String(s.supplier)}</span>
                </div>
              ) : null}
            </div>
          </div>
          {allDone && (
            <button
              onClick={handleGenerateProtocol}
              className="flex items-center gap-2 bg-gradient-to-r from-green-600 to-green-700 text-white px-5 py-2.5 rounded-xl text-sm font-medium hover:from-green-700 hover:to-green-800 shadow-lg shadow-green-200"
            >
              <FileCheck2 className="w-4 h-4" />
              Сформировать протокол
            </button>
          )}
        </div>

        {/* Progress bar */}
        <div className="mt-5">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-1.5">
            <span>Прогресс маршрута</span>
            <span>{tests.filter(t => ["completed", "skipped", "failed"].includes(t.status as string)).length} / {tests.length} испытаний</span>
          </div>
          <div className="w-full h-2.5 bg-slate-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-blue-500 to-green-500 rounded-full transition-all duration-500"
              style={{ width: `${tests.length ? (tests.filter(t => ["completed", "skipped", "failed"].includes(t.status as string)).length / tests.length) * 100 : 0}%` }}
            />
          </div>
        </div>
      </div>

      {/* Route (tests) */}
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-2 mb-4">
          <Route className="w-5 h-5 text-blue-600" />
          Маршрут испытаний
        </h2>
        <div className="space-y-3">
          {tests.map((t, idx) => {
            const isExpanded = expandedTest === (t.id as number);
            const curingDone = t.curing_end ? new Date(t.curing_end as string) <= new Date() : false;
            const curingRemaining = t.curing_end ? Math.max(0, Math.ceil((new Date(t.curing_end as string).getTime() - Date.now()) / 3600000)) : 0;

            return (
              <div key={t.id as number} className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                <div
                  className="flex items-center gap-4 p-4 cursor-pointer hover:bg-slate-50 transition-colors"
                  onClick={() => setExpandedTest(isExpanded ? null : (t.id as number))}
                >
                  {/* Step indicator */}
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                    t.status === "completed" ? "bg-green-100 text-green-700" :
                    t.status === "failed" ? "bg-red-100 text-red-700" :
                    t.status === "in_progress" ? "bg-amber-100 text-amber-700" :
                    t.status === "curing" ? "bg-purple-100 text-purple-700" :
                    "bg-slate-100 text-slate-500"
                  }`}>
                    {idx + 1}
                  </div>

                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-sm text-slate-900">{t.test_name as string}</p>
                      <span className="text-xs text-slate-400 font-mono">{t.test_code as string}</span>
                    </div>
                    <p className="text-xs text-slate-500">{t.method_standard as string}</p>
                  </div>

                  {t.status === "curing" && !curingDone && (
                    <div className="flex items-center gap-1.5 text-xs text-purple-600 bg-purple-50 px-3 py-1.5 rounded-lg">
                      <Timer className="w-3.5 h-3.5" />
                      Ещё {curingRemaining} ч
                    </div>
                  )}

                  {t.status === "curing" && curingDone && (
                    <div className="flex items-center gap-1.5 text-xs text-green-600 bg-green-50 px-3 py-1.5 rounded-lg">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Выдержка завершена
                    </div>
                  )}

                  <StatusBadge status={t.status as string} type="test" />
                  {isExpanded ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                </div>

                {isExpanded && (
                  <div className="border-t border-slate-100 p-5 bg-slate-50/50">
                    {/* Test details */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4 text-sm">
                      {Number(t.curing_hours) > 0 ? (
                        <div className="flex items-center gap-2 text-slate-600">
                          <Timer className="w-4 h-4 text-purple-500" />
                          <span>Выдержка: {Number(t.curing_hours)} ч</span>
                        </div>
                      ) : null}
                      {t.temperature_min != null ? (
                        <div className="flex items-center gap-2 text-slate-600">
                          <Thermometer className="w-4 h-4 text-red-500" />
                          <span>{Number(t.temperature_min)}...{Number(t.temperature_max)} °C</span>
                        </div>
                      ) : null}
                      {t.humidity_min != null ? (
                        <div className="flex items-center gap-2 text-slate-600">
                          <Droplets className="w-4 h-4 text-blue-500" />
                          <span>{Number(t.humidity_min)}...{Number(t.humidity_max)} %</span>
                        </div>
                      ) : null}
                      {t.equipment_name ? (
                        <div className="flex items-center gap-2 text-slate-600">
                          <Wrench className="w-4 h-4 text-slate-400" />
                          <span>{String(t.equipment_name)}</span>
                        </div>
                      ) : null}
                    </div>

                    {t.test_description ? (
                      <p className="text-sm text-slate-500 mb-4">{String(t.test_description)}</p>
                    ) : null}

                    {/* Results */}
                    {t.status === "completed" && (
                      <div className={`p-4 rounded-lg border mb-4 ${t.is_passed ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200"}`}>
                        <div className="flex items-center gap-2 mb-2">
                          {t.is_passed ? <CheckCircle2 className="w-5 h-5 text-green-600" /> : <XCircle className="w-5 h-5 text-red-600" />}
                          <span className={`font-semibold ${t.is_passed ? "text-green-800" : "text-red-800"}`}>
                            {t.is_passed ? "Испытание пройдено" : "Испытание не пройдено"}
                          </span>
                        </div>
                        {t.result_value != null ? (
                          <p className="text-sm text-slate-700">Результат: <strong>{String(t.result_value)}</strong> {String(t.result_unit || "")}</p>
                        ) : null}
                        {t.result_text ? <p className="text-sm text-slate-600 mt-1">{String(t.result_text)}</p> : null}
                        {t.operator ? <p className="text-xs text-slate-500 mt-2 flex items-center gap-1"><User className="w-3 h-3" /> {String(t.operator)}</p> : null}
                        {t.completed_at ? <p className="text-xs text-slate-400 mt-1 flex items-center gap-1"><Clock className="w-3 h-3" /> {new Date(t.completed_at as string).toLocaleString("ru")}</p> : null}
                      </div>
                    )}

                    {/* Action buttons */}
                    <div className="flex flex-wrap gap-2">
                      {t.status === "pending" && (t.curing_hours as number) > 0 && (
                        <button onClick={() => handleTestAction(t.id as number, "start_curing")}
                          className="flex items-center gap-1.5 px-4 py-2 bg-purple-600 text-white text-xs font-medium rounded-lg hover:bg-purple-700">
                          <Timer className="w-3.5 h-3.5" /> Начать выдержку
                        </button>
                      )}
                      {(t.status === "pending" && (t.curing_hours as number) === 0) || (t.status === "curing" && curingDone) ? (
                        <button onClick={() => { handleTestAction(t.id as number, "start_test", { operator: "Лаборант" }); }}
                          className="flex items-center gap-1.5 px-4 py-2 bg-amber-600 text-white text-xs font-medium rounded-lg hover:bg-amber-700">
                          <Play className="w-3.5 h-3.5" /> Начать испытание
                        </button>
                      ) : null}
                      {t.status === "in_progress" && (
                        <>
                          <button onClick={() => setShowCompleteForm(showCompleteForm === (t.id as number) ? null : (t.id as number))}
                            className="flex items-center gap-1.5 px-4 py-2 bg-green-600 text-white text-xs font-medium rounded-lg hover:bg-green-700">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Завершить
                          </button>
                          <button onClick={() => handleTestAction(t.id as number, "fail_test", { result_text: "Не прошёл", notes: "" })}
                            className="flex items-center gap-1.5 px-4 py-2 bg-red-600 text-white text-xs font-medium rounded-lg hover:bg-red-700">
                            <XCircle className="w-3.5 h-3.5" /> Не пройден
                          </button>
                        </>
                      )}
                      {["pending", "curing"].includes(t.status as string) && (
                        <button onClick={() => handleTestAction(t.id as number, "skip_test", { notes: "Пропущен по решению ответственного" })}
                          className="flex items-center gap-1.5 px-4 py-2 bg-slate-200 text-slate-700 text-xs font-medium rounded-lg hover:bg-slate-300">
                          <SkipForward className="w-3.5 h-3.5" /> Пропустить
                        </button>
                      )}
                      {!["completed", "skipped", "failed"].includes(t.status as string) && (
                        <button onClick={() => setShowEnvForm(showEnvForm === (t.id as number) ? null : (t.id as number))}
                          className="flex items-center gap-1.5 px-4 py-2 bg-cyan-600 text-white text-xs font-medium rounded-lg hover:bg-cyan-700">
                          <Thermometer className="w-3.5 h-3.5" /> Записать условия
                        </button>
                      )}
                    </div>

                    {/* Complete form */}
                    {showCompleteForm === (t.id as number) && (
                      <div className="mt-4 p-4 bg-white rounded-lg border border-slate-200">
                        <h4 className="font-semibold text-sm text-slate-900 mb-3">Результаты испытания</h4>
                        <div className="grid grid-cols-2 gap-3 mb-3">
                          <div>
                            <label className="text-xs font-medium text-slate-600 mb-1 block">Значение *</label>
                            <input type="number" step="any" value={resultForm.result_value} onChange={e => setResultForm(f => ({ ...f, result_value: e.target.value }))}
                              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm" placeholder="0.00" />
                          </div>
                          <div>
                            <label className="text-xs font-medium text-slate-600 mb-1 block">Ед. измерения</label>
                            <input value={resultForm.result_unit} onChange={e => setResultForm(f => ({ ...f, result_unit: e.target.value }))}
                              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm" placeholder="МПа, мм, %" />
                          </div>
                          <div>
                            <label className="text-xs font-medium text-slate-600 mb-1 block">Оператор</label>
                            <input value={resultForm.operator} onChange={e => setResultForm(f => ({ ...f, operator: e.target.value }))}
                              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm" placeholder="ФИО" />
                          </div>
                          <div>
                            <label className="text-xs font-medium text-slate-600 mb-1 block">Оборудование</label>
                            <select value={resultForm.equipment_id} onChange={e => setResultForm(f => ({ ...f, equipment_id: e.target.value }))}
                              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm">
                              <option value="">— Не указано —</option>
                              {equipment.filter(e => e.status === "active").map(e => (
                                <option key={e.id} value={e.id}>{e.name} ({e.inventory_number})</option>
                              ))}
                            </select>
                          </div>
                        </div>
                        <div className="mb-3">
                          <label className="text-xs font-medium text-slate-600 mb-1 block">Описание результата</label>
                          <input value={resultForm.result_text} onChange={e => setResultForm(f => ({ ...f, result_text: e.target.value }))}
                            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm" placeholder="Текстовый результат" />
                        </div>
                        <div className="flex items-center gap-4 mb-3">
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input type="radio" checked={resultForm.is_passed} onChange={() => setResultForm(f => ({ ...f, is_passed: true }))} className="text-green-600" />
                            <span className="text-sm text-green-700 font-medium">Пройден</span>
                          </label>
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input type="radio" checked={!resultForm.is_passed} onChange={() => setResultForm(f => ({ ...f, is_passed: false }))} className="text-red-600" />
                            <span className="text-sm text-red-700 font-medium">Не пройден</span>
                          </label>
                        </div>
                        <button onClick={() => handleComplete(t.id as number)}
                          disabled={!resultForm.result_value}
                          className="flex items-center gap-1.5 px-4 py-2 bg-green-600 text-white text-xs font-medium rounded-lg hover:bg-green-700 disabled:opacity-50">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Сохранить результат
                        </button>
                      </div>
                    )}

                    {/* Environment form */}
                    {showEnvForm === (t.id as number) && (
                      <div className="mt-4 p-4 bg-white rounded-lg border border-slate-200">
                        <h4 className="font-semibold text-sm text-slate-900 mb-3">Условия окружающей среды</h4>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-3">
                          <div>
                            <label className="text-xs font-medium text-slate-600 mb-1 flex items-center gap-1"><Thermometer className="w-3 h-3" /> Температура, °C *</label>
                            <input type="number" step="0.1" value={envForm.temperature} onChange={e => setEnvForm(f => ({ ...f, temperature: e.target.value }))}
                              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm" />
                          </div>
                          <div>
                            <label className="text-xs font-medium text-slate-600 mb-1 flex items-center gap-1"><Droplets className="w-3 h-3" /> Влажность, % *</label>
                            <input type="number" step="0.1" value={envForm.humidity} onChange={e => setEnvForm(f => ({ ...f, humidity: e.target.value }))}
                              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm" />
                          </div>
                          <div>
                            <label className="text-xs font-medium text-slate-600 mb-1 flex items-center gap-1"><Gauge className="w-3 h-3" /> Давление, мм рт.ст.</label>
                            <input type="number" step="0.1" value={envForm.pressure} onChange={e => setEnvForm(f => ({ ...f, pressure: e.target.value }))}
                              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm" />
                          </div>
                          <div>
                            <label className="text-xs font-medium text-slate-600 mb-1 block">Записал *</label>
                            <input value={envForm.recorded_by} onChange={e => setEnvForm(f => ({ ...f, recorded_by: e.target.value }))}
                              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm" placeholder="ФИО" />
                          </div>
                          <div>
                            <label className="text-xs font-medium text-slate-600 mb-1 block">Помещение</label>
                            <input value={envForm.location} onChange={e => setEnvForm(f => ({ ...f, location: e.target.value }))}
                              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm" placeholder="Зал испытаний №1" />
                          </div>
                        </div>
                        <button onClick={() => handleEnvSubmit(t.id as number)}
                          disabled={!envForm.temperature || !envForm.humidity || !envForm.recorded_by}
                          className="flex items-center gap-1.5 px-4 py-2 bg-cyan-600 text-white text-xs font-medium rounded-lg hover:bg-cyan-700 disabled:opacity-50">
                          <Plus className="w-3.5 h-3.5" /> Записать
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Environment logs */}
      {envLogs.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden mb-6">
          <div className="p-5 border-b border-slate-100">
            <h2 className="font-semibold text-slate-900 flex items-center gap-2">
              <Thermometer className="w-5 h-5 text-cyan-600" />
              Журнал условий среды
            </h2>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="text-left px-5 py-2.5 font-medium text-slate-600">Дата/время</th>
                <th className="text-left px-5 py-2.5 font-medium text-slate-600">T, °C</th>
                <th className="text-left px-5 py-2.5 font-medium text-slate-600">Влажность, %</th>
                <th className="text-left px-5 py-2.5 font-medium text-slate-600">Давление</th>
                <th className="text-left px-5 py-2.5 font-medium text-slate-600">Записал</th>
                <th className="text-left px-5 py-2.5 font-medium text-slate-600">Помещение</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {envLogs.map(log => (
                <tr key={log.id as number}>
                  <td className="px-5 py-2.5 text-slate-600">{new Date(log.recorded_at as string).toLocaleString("ru")}</td>
                  <td className="px-5 py-2.5 font-mono">{log.temperature as number}</td>
                  <td className="px-5 py-2.5 font-mono">{log.humidity as number}</td>
                  <td className="px-5 py-2.5 font-mono">{(log.pressure as number) || "—"}</td>
                  <td className="px-5 py-2.5 text-slate-600">{log.recorded_by as string}</td>
                  <td className="px-5 py-2.5 text-slate-500">{(log.location as string) || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Deviations for this sample */}
      {deviations.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden mb-6">
          <div className="p-5 border-b border-slate-100">
            <h2 className="font-semibold text-slate-900 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-red-600" />
              Отклонения ({deviations.length})
            </h2>
          </div>
          <div className="divide-y divide-slate-100">
            {deviations.map(d => (
              <div key={d.id as number} className="p-4 flex items-start gap-3">
                <div className={`w-2 h-2 rounded-full mt-1.5 ${
                  d.severity === "critical" ? "bg-red-500" : d.severity === "major" ? "bg-orange-500" : "bg-yellow-500"
                }`} />
                <div>
                  <div className="flex items-center gap-2">
                    <StatusBadge status={d.status as string} type="deviation" />
                    <StatusBadge status={d.severity as string} type="severity" />
                  </div>
                  <p className="text-sm text-slate-800 mt-1">{d.description as string}</p>
                  <p className="text-xs text-slate-400 mt-1 flex items-center gap-1">
                    <Clock className="w-3 h-3" /> {new Date(d.detected_at as string).toLocaleString("ru")}
                    <span className="mx-1">·</span>
                    <User className="w-3 h-3" /> {d.detected_by as string}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Integrity info */}
      <div className="bg-slate-50 rounded-xl border border-slate-200 p-4 flex items-center gap-3 text-sm text-slate-500">
        <Shield className="w-5 h-5 text-blue-500" />
        <span>Все действия фиксируются в журнале аудита. Данные испытаний защищены от подмены хешированием SHA-256 при формировании протокола.</span>
      </div>
    </div>
  );
}
