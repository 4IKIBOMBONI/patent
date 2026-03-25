"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  FlaskConical,
  Package,
  Truck,
  Calendar,
  User,
  FileText,
  Building2,
  Hash,
  ArrowLeft,
  CheckCircle2,
  Layers,
} from "lucide-react";

interface MaterialType {
  id: number;
  name: string;
  code: string;
  description: string;
  test_count: number;
}

export default function NewSamplePage() {
  const router = useRouter();
  const [materials, setMaterials] = useState<MaterialType[]>([]);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    material_type_id: "",
    batch_number: "",
    supplier: "",
    delivery_date: new Date().toISOString().split("T")[0],
    registered_by: "",
    project_name: "",
    project_code: "",
    notes: "",
  });

  useEffect(() => {
    fetch("/api/materials").then(r => r.json()).then(setMaterials);
  }, []);

  const selectedMaterial = materials.find(m => m.id === Number(form.material_type_id));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const res = await fetch("/api/samples", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, material_type_id: Number(form.material_type_id) }),
    });
    const data = await res.json();
    router.push(`/samples/${data.id}`);
  }

  return (
    <div className="max-w-3xl">
      <button onClick={() => router.back()} className="flex items-center gap-2 text-slate-500 hover:text-slate-800 text-sm mb-4 transition-colors">
        <ArrowLeft className="w-4 h-4" /> Назад
      </button>

      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
          <FlaskConical className="w-7 h-7 text-blue-600" />
          Регистрация образца
        </h1>
        <p className="text-sm text-slate-500 mt-1">Заполните данные для автоматического назначения обязательных испытаний</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Material type */}
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h2 className="font-semibold text-slate-900 flex items-center gap-2 mb-4">
            <Layers className="w-5 h-5 text-blue-600" />
            Вид материала
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {materials.map(m => (
              <button
                type="button"
                key={m.id}
                onClick={() => setForm(f => ({ ...f, material_type_id: String(m.id) }))}
                className={`p-4 rounded-xl border-2 text-left transition-all ${
                  form.material_type_id === String(m.id)
                    ? "border-blue-500 bg-blue-50 shadow-md"
                    : "border-slate-200 hover:border-slate-300 bg-white"
                }`}
              >
                <p className="font-semibold text-sm text-slate-900">{m.name}</p>
                <p className="text-xs text-slate-500 mt-0.5">{m.code}</p>
                <p className="text-xs text-blue-600 mt-2">{m.test_count} испытаний</p>
              </button>
            ))}
          </div>
          {selectedMaterial && (
            <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-100">
              <p className="text-sm text-blue-800 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" />
                Будет автоматически назначено <strong>{selectedMaterial.test_count}</strong> обязательных испытаний
              </p>
            </div>
          )}
        </div>

        {/* Sample details */}
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h2 className="font-semibold text-slate-900 flex items-center gap-2 mb-4">
            <Package className="w-5 h-5 text-blue-600" />
            Данные образца
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="flex items-center gap-1.5 text-sm font-medium text-slate-700 mb-1.5">
                <Hash className="w-3.5 h-3.5 text-slate-400" /> Номер партии *
              </label>
              <input
                required
                value={form.batch_number}
                onChange={e => setForm(f => ({ ...f, batch_number: e.target.value }))}
                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Например: П-2025-001"
              />
            </div>
            <div>
              <label className="flex items-center gap-1.5 text-sm font-medium text-slate-700 mb-1.5">
                <Truck className="w-3.5 h-3.5 text-slate-400" /> Поставщик
              </label>
              <input
                value={form.supplier}
                onChange={e => setForm(f => ({ ...f, supplier: e.target.value }))}
                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Название организации"
              />
            </div>
            <div>
              <label className="flex items-center gap-1.5 text-sm font-medium text-slate-700 mb-1.5">
                <Calendar className="w-3.5 h-3.5 text-slate-400" /> Дата поставки *
              </label>
              <input
                type="date"
                required
                value={form.delivery_date}
                onChange={e => setForm(f => ({ ...f, delivery_date: e.target.value }))}
                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="flex items-center gap-1.5 text-sm font-medium text-slate-700 mb-1.5">
                <User className="w-3.5 h-3.5 text-slate-400" /> Ответственный *
              </label>
              <input
                required
                value={form.registered_by}
                onChange={e => setForm(f => ({ ...f, registered_by: e.target.value }))}
                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="ФИО сотрудника"
              />
            </div>
          </div>
        </div>

        {/* Project info */}
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h2 className="font-semibold text-slate-900 flex items-center gap-2 mb-4">
            <Building2 className="w-5 h-5 text-blue-600" />
            Объект строительства
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-slate-700 mb-1.5 block">Наименование объекта</label>
              <input
                value={form.project_name}
                onChange={e => setForm(f => ({ ...f, project_name: e.target.value }))}
                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="ЖК «Новый квартал»"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700 mb-1.5 block">Шифр объекта</label>
              <input
                value={form.project_code}
                onChange={e => setForm(f => ({ ...f, project_code: e.target.value }))}
                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="НК-2025"
              />
            </div>
          </div>
        </div>

        {/* Notes */}
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h2 className="font-semibold text-slate-900 flex items-center gap-2 mb-4">
            <FileText className="w-5 h-5 text-blue-600" />
            Примечания
          </h2>
          <textarea
            value={form.notes}
            onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
            className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[80px]"
            placeholder="Дополнительная информация..."
          />
        </div>

        <button
          type="submit"
          disabled={!form.material_type_id || !form.batch_number || !form.registered_by || loading}
          className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-3 rounded-xl text-sm font-semibold hover:from-blue-700 hover:to-blue-800 transition-all shadow-lg shadow-blue-200 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? (
            <div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full" />
          ) : (
            <>
              <CheckCircle2 className="w-5 h-5" />
              Зарегистрировать образец
            </>
          )}
        </button>
      </form>
    </div>
  );
}
