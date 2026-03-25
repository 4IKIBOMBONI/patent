"use client";

import { useEffect, useState } from "react";
import { StatusBadge } from "@/components/StatusBadge";
import {
  FileCheck2,
  Search,
  Clock,
  User,
  Shield,
  ShieldCheck,
  ShieldAlert,
  ChevronDown,
  ChevronUp,
  Pen,
  Archive,
  Hash,
  FlaskConical,
  Lock,
  Fingerprint,
} from "lucide-react";

interface Protocol {
  id: number;
  protocol_number: string;
  sample_id: string;
  sample_number: string;
  material_type_name: string;
  generated_at: string;
  generated_by: string;
  hash: string;
  status: string;
  signed_by: string | null;
  signed_at: string | null;
  data_snapshot: string;
}

export default function ProtocolsPage() {
  const [protocols, setProtocols] = useState<Protocol[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [verifying, setVerifying] = useState<number | null>(null);
  const [verifyResult, setVerifyResult] = useState<Record<number, boolean>>({});

  useEffect(() => {
    fetch("/api/protocols").then(r => r.json()).then(d => { setProtocols(d); setLoading(false); });
  }, []);

  const filtered = protocols.filter(p =>
    p.protocol_number.toLowerCase().includes(search.toLowerCase()) ||
    p.sample_number.toLowerCase().includes(search.toLowerCase()) ||
    p.material_type_name.toLowerCase().includes(search.toLowerCase())
  );

  async function handleSign(id: number) {
    await fetch(`/api/protocols/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "sign", signed_by: "Руководитель лаборатории" }),
    });
    const data = await fetch("/api/protocols").then(r => r.json());
    setProtocols(data);
  }

  async function handleArchive(id: number) {
    await fetch(`/api/protocols/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "archive" }),
    });
    const data = await fetch("/api/protocols").then(r => r.json());
    setProtocols(data);
  }

  async function verifyIntegrity(id: number) {
    setVerifying(id);
    const res = await fetch(`/api/protocols/${id}`);
    const data = await res.json();
    setVerifyResult(prev => ({ ...prev, [id]: data.integrity_valid }));
    setVerifying(null);
  }

  function renderSnapshot(snapshotJson: string) {
    try {
      const snapshot = JSON.parse(snapshotJson);
      const sample = snapshot.sample;
      const tests = snapshot.tests || [];

      return (
        <div className="space-y-4">
          {/* Sample info */}
          <div className="bg-slate-50 rounded-lg p-4">
            <h4 className="font-semibold text-sm text-slate-900 mb-2">Образец</h4>
            <div className="grid grid-cols-2 gap-2 text-xs text-slate-600">
              <div>Номер: <span className="font-mono font-medium">{sample.sample_number}</span></div>
              <div>Материал: {sample.material_type_name}</div>
              <div>Партия: {sample.batch_number}</div>
              <div>Поставка: {new Date(sample.delivery_date).toLocaleDateString("ru")}</div>
              {sample.project_name && <div>Объект: {sample.project_name}</div>}
              <div>Ответственный: {sample.registered_by}</div>
            </div>
          </div>

          {/* Test results */}
          <div className="bg-slate-50 rounded-lg p-4">
            <h4 className="font-semibold text-sm text-slate-900 mb-2">Результаты испытаний ({tests.length})</h4>
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="text-left py-1.5 font-medium text-slate-600">Испытание</th>
                  <th className="text-left py-1.5 font-medium text-slate-600">ГОСТ</th>
                  <th className="text-left py-1.5 font-medium text-slate-600">Результат</th>
                  <th className="text-left py-1.5 font-medium text-slate-600">Статус</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {tests.map((t: Record<string, unknown>, i: number) => (
                  <tr key={i}>
                    <td className="py-1.5">{t.test_name as string}</td>
                    <td className="py-1.5 text-slate-500">{t.method_standard as string}</td>
                    <td className="py-1.5 font-mono">{t.result_value != null ? `${t.result_value} ${t.result_unit || ""}` : (t.result_text as string) || "—"}</td>
                    <td className="py-1.5">
                      {t.status === "completed" ? (
                        t.is_passed ? <span className="text-green-600 font-medium">Пройден</span> : <span className="text-red-600 font-medium">Не пройден</span>
                      ) : <span className="text-slate-400">{t.status as string}</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Deviations */}
          {snapshot.deviations?.length > 0 && (
            <div className="bg-red-50 rounded-lg p-4">
              <h4 className="font-semibold text-sm text-red-900 mb-2">Отклонения ({snapshot.deviations.length})</h4>
              {snapshot.deviations.map((d: Record<string, unknown>, i: number) => (
                <div key={i} className="text-xs text-red-800 py-1">{d.description as string}</div>
              ))}
            </div>
          )}
        </div>
      );
    } catch {
      return <p className="text-xs text-slate-400">Ошибка чтения данных</p>;
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
            <FileCheck2 className="w-7 h-7 text-cyan-600" />
            Протоколы испытаний
          </h1>
          <p className="text-sm text-slate-500 mt-1">Финальные протоколы с защитой от подмены данных</p>
        </div>
      </div>

      <div className="relative max-w-md mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input type="text" placeholder="Поиск по номеру протокола, образца..." value={search} onChange={e => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500" />
      </div>

      <div className="space-y-3">
        {loading ? (
          <div className="p-12 text-center text-slate-400 bg-white rounded-xl border border-slate-200">
            <div className="animate-spin w-8 h-8 border-2 border-cyan-600 border-t-transparent rounded-full mx-auto mb-3" />
            Загрузка...
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center text-slate-400 bg-white rounded-xl border border-slate-200">
            <FileCheck2 className="w-12 h-12 mx-auto mb-3 text-slate-300" />
            <p className="font-medium">Протоколы не найдены</p>
            <p className="text-sm mt-1">Протоколы формируются автоматически при завершении всех испытаний образца</p>
          </div>
        ) : filtered.map(p => {
          const isExpanded = expandedId === p.id;
          return (
            <div key={p.id} className="bg-white rounded-xl border border-slate-200 overflow-hidden">
              <div className="flex items-center gap-4 p-4 cursor-pointer hover:bg-slate-50" onClick={() => setExpandedId(isExpanded ? null : p.id)}>
                <div className="w-10 h-10 rounded-xl bg-cyan-100 flex items-center justify-center">
                  <FileCheck2 className="w-5 h-5 text-cyan-600" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-sm text-slate-900 font-mono">{p.protocol_number}</p>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-slate-500 mt-0.5">
                    <span className="flex items-center gap-1"><FlaskConical className="w-3 h-3" /> {p.sample_number}</span>
                    <span>{p.material_type_name}</span>
                    <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {new Date(p.generated_at).toLocaleString("ru")}</span>
                    <span className="flex items-center gap-1"><User className="w-3 h-3" /> {p.generated_by}</span>
                  </div>
                </div>

                {/* Integrity badge */}
                {verifyResult[p.id] !== undefined && (
                  verifyResult[p.id] ? (
                    <span className="flex items-center gap-1 text-xs text-green-600 bg-green-50 px-2.5 py-1 rounded-lg">
                      <ShieldCheck className="w-3.5 h-3.5" /> Целостность подтверждена
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-xs text-red-600 bg-red-50 px-2.5 py-1 rounded-lg">
                      <ShieldAlert className="w-3.5 h-3.5" /> Данные изменены!
                    </span>
                  )
                )}

                <StatusBadge status={p.status} type="protocol" />
                {isExpanded ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
              </div>

              {isExpanded && (
                <div className="border-t border-slate-100 p-5 bg-slate-50/50">
                  {/* Hash */}
                  <div className="flex items-center gap-2 mb-4 p-3 bg-slate-100 rounded-lg">
                    <Fingerprint className="w-4 h-4 text-slate-500" />
                    <span className="text-xs text-slate-500">SHA-256:</span>
                    <code className="text-xs font-mono text-slate-700 break-all">{p.hash}</code>
                  </div>

                  {/* Snapshot data */}
                  {renderSnapshot(p.data_snapshot)}

                  {/* Actions */}
                  <div className="flex gap-2 mt-4 pt-4 border-t border-slate-200">
                    <button onClick={() => verifyIntegrity(p.id)} disabled={verifying === p.id}
                      className="flex items-center gap-1.5 px-4 py-2 bg-slate-700 text-white text-xs font-medium rounded-lg hover:bg-slate-800 disabled:opacity-50">
                      <Shield className="w-3.5 h-3.5" />
                      {verifying === p.id ? "Проверка..." : "Проверить целостность"}
                    </button>
                    {p.status === "draft" && (
                      <button onClick={() => handleSign(p.id)}
                        className="flex items-center gap-1.5 px-4 py-2 bg-green-600 text-white text-xs font-medium rounded-lg hover:bg-green-700">
                        <Pen className="w-3.5 h-3.5" /> Подписать
                      </button>
                    )}
                    {p.status === "signed" && (
                      <button onClick={() => handleArchive(p.id)}
                        className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white text-xs font-medium rounded-lg hover:bg-blue-700">
                        <Archive className="w-3.5 h-3.5" /> В архив
                      </button>
                    )}
                  </div>

                  {p.signed_by && (
                    <div className="mt-3 flex items-center gap-2 text-xs text-green-700">
                      <Lock className="w-3.5 h-3.5" />
                      Подписан: {p.signed_by} ({p.signed_at ? new Date(p.signed_at).toLocaleString("ru") : ""})
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
