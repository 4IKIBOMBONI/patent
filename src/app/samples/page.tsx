"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { StatusBadge } from "@/components/StatusBadge";
import {
  FlaskConical,
  Plus,
  Search,
  Filter,
  Package,
  Calendar,
  Hash,
  ArrowRight,
  Layers,
} from "lucide-react";

interface Sample {
  id: string;
  sample_number: string;
  material_type_name: string;
  material_type_code: string;
  batch_number: string;
  supplier: string | null;
  delivery_date: string;
  registration_date: string;
  registered_by: string;
  status: string;
  project_name: string | null;
  project_code: string | null;
  total_tests: number;
  completed_tests: number;
}

export default function SamplesPage() {
  return (
    <Suspense fallback={<div className="p-12 text-center text-slate-400"><div className="animate-spin w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full mx-auto mb-3" />Загрузка...</div>}>
      <SamplesContent />
    </Suspense>
  );
}

function SamplesContent() {
  const [samples, setSamples] = useState<Sample[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const searchParams = useSearchParams();
  const statusFilter = searchParams.get("status");

  useEffect(() => {
    const url = statusFilter ? `/api/samples?status=${statusFilter}` : "/api/samples";
    fetch(url).then(r => r.json()).then(data => { setSamples(data); setLoading(false); });
  }, [statusFilter]);

  const filtered = samples.filter(s =>
    s.sample_number.toLowerCase().includes(search.toLowerCase()) ||
    s.material_type_name.toLowerCase().includes(search.toLowerCase()) ||
    s.batch_number.toLowerCase().includes(search.toLowerCase()) ||
    (s.project_name || "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
            <FlaskConical className="w-7 h-7 text-blue-600" />
            Реестр образцов
          </h1>
          <p className="text-sm text-slate-500 mt-1">Управление образцами и маршрутами испытаний</p>
        </div>
        <Link href="/samples/new" className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white px-5 py-2.5 rounded-xl text-sm font-medium hover:from-blue-700 hover:to-blue-800 transition-all shadow-lg shadow-blue-200">
          <Plus className="w-4 h-4" />
          Новый образец
        </Link>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 mb-6">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Поиск по номеру, материалу, партии..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400" />
          {["", "registered", "in_testing", "curing", "completed"].map(s => (
            <Link
              key={s}
              href={s ? `/samples?status=${s}` : "/samples"}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                (statusFilter || "") === s
                  ? "bg-blue-100 text-blue-800"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {s === "" ? "Все" : s === "registered" ? "Новые" : s === "in_testing" ? "Испытания" : s === "curing" ? "Выдержка" : "Готовые"}
            </Link>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-400">
            <div className="animate-spin w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full mx-auto mb-3" />
            Загрузка...
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center text-slate-400">
            <Package className="w-12 h-12 mx-auto mb-3 text-slate-300" />
            <p className="font-medium">Образцы не найдены</p>
            <Link href="/samples/new" className="text-blue-600 text-sm hover:underline mt-2 inline-block">Зарегистрировать новый</Link>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="text-left px-5 py-3 font-semibold text-slate-600"><div className="flex items-center gap-1.5"><Hash className="w-3.5 h-3.5"/>Номер</div></th>
                <th className="text-left px-5 py-3 font-semibold text-slate-600"><div className="flex items-center gap-1.5"><Layers className="w-3.5 h-3.5"/>Материал</div></th>
                <th className="text-left px-5 py-3 font-semibold text-slate-600"><div className="flex items-center gap-1.5"><Package className="w-3.5 h-3.5"/>Партия</div></th>
                <th className="text-left px-5 py-3 font-semibold text-slate-600"><div className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5"/>Дата</div></th>
                <th className="text-left px-5 py-3 font-semibold text-slate-600">Тесты</th>
                <th className="text-left px-5 py-3 font-semibold text-slate-600">Статус</th>
                <th className="px-5 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map(s => (
                <tr key={s.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-5 py-3.5">
                    <span className="font-mono font-semibold text-slate-900">{s.sample_number}</span>
                  </td>
                  <td className="px-5 py-3.5">
                    <div>
                      <p className="text-slate-800">{s.material_type_name}</p>
                      <p className="text-xs text-slate-400">{s.material_type_code}</p>
                    </div>
                  </td>
                  <td className="px-5 py-3.5 text-slate-600">{s.batch_number}</td>
                  <td className="px-5 py-3.5 text-slate-500">{new Date(s.registration_date).toLocaleDateString("ru")}</td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-2">
                      <div className="w-16 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                        <div className="h-full bg-green-500 rounded-full transition-all" style={{ width: `${s.total_tests ? (s.completed_tests / s.total_tests) * 100 : 0}%` }} />
                      </div>
                      <span className="text-xs text-slate-500">{s.completed_tests}/{s.total_tests}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3.5"><StatusBadge status={s.status} type="sample" /></td>
                  <td className="px-5 py-3.5">
                    <Link href={`/samples/${s.id}`} className="text-blue-600 hover:text-blue-800">
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
