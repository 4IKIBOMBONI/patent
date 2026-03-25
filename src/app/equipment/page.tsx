"use client";

import { useEffect, useState } from "react";
import { StatusBadge } from "@/components/StatusBadge";
import {
  Wrench,
  Plus,
  Calendar,
  User,
  MapPin,
  Hash,
  Search,
  Gauge,
  ClipboardCheck,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Settings,
  Factory,
  Tag,
} from "lucide-react";

interface EquipmentItem {
  id: number;
  name: string;
  inventory_number: string;
  model: string | null;
  manufacturer: string | null;
  serial_number: string | null;
  calibration_date: string | null;
  calibration_due: string | null;
  status: string;
  location: string | null;
  responsible_person: string | null;
  notes: string | null;
  maintenance_count: number;
  last_maintenance: string | null;
}

export default function EquipmentPage() {
  const [equipment, setEquipment] = useState<EquipmentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [showMaintenanceForm, setShowMaintenanceForm] = useState<number | null>(null);

  const [form, setForm] = useState({
    name: "", inventory_number: "", model: "", manufacturer: "",
    serial_number: "", calibration_date: "", calibration_due: "",
    location: "", responsible_person: "",
  });
  const [maintForm, setMaintForm] = useState({
    type: "calibration" as string, performed_by: "", next_due: "", result: "", notes: "",
  });

  useEffect(() => {
    fetch("/api/equipment").then(r => r.json()).then(d => { setEquipment(d); setLoading(false); });
  }, []);

  const filtered = equipment.filter(e =>
    e.name.toLowerCase().includes(search.toLowerCase()) ||
    e.inventory_number.toLowerCase().includes(search.toLowerCase()) ||
    (e.manufacturer || "").toLowerCase().includes(search.toLowerCase())
  );

  async function handleAdd(ev: React.FormEvent) {
    ev.preventDefault();
    await fetch("/api/equipment", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setShowForm(false);
    setForm({ name: "", inventory_number: "", model: "", manufacturer: "", serial_number: "", calibration_date: "", calibration_due: "", location: "", responsible_person: "" });
    const data = await fetch("/api/equipment").then(r => r.json());
    setEquipment(data);
  }

  async function handleMaintenance(eqId: number) {
    await fetch("/api/equipment", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: eqId, maintenance: { type: maintForm.type, performed_by: maintForm.performed_by, next_due: maintForm.next_due || null, result: maintForm.result || null, notes: maintForm.notes || null } }),
    });
    setShowMaintenanceForm(null);
    setMaintForm({ type: "calibration", performed_by: "", next_due: "", result: "", notes: "" });
    const data = await fetch("/api/equipment").then(r => r.json());
    setEquipment(data);
  }

  const isCalibrationDueSoon = (date: string | null) => {
    if (!date) return false;
    return new Date(date) <= new Date(Date.now() + 30 * 86400000);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
            <Wrench className="w-7 h-7 text-amber-600" />
            Журнал оборудования
          </h1>
          <p className="text-sm text-slate-500 mt-1">Учёт, поверка и обслуживание лабораторного оборудования</p>
        </div>
        <button onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 bg-gradient-to-r from-amber-500 to-amber-600 text-white px-5 py-2.5 rounded-xl text-sm font-medium hover:from-amber-600 hover:to-amber-700 shadow-lg shadow-amber-200">
          <Plus className="w-4 h-4" />
          Добавить
        </button>
      </div>

      {/* Search */}
      <div className="relative max-w-md mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input type="text" placeholder="Поиск по названию, инв. номеру..." value={search} onChange={e => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500" />
      </div>

      {/* Add form */}
      {showForm && (
        <form onSubmit={handleAdd} className="bg-white rounded-xl border border-slate-200 p-6 mb-6">
          <h3 className="font-semibold text-slate-900 mb-4">Новое оборудование</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div>
              <label className="text-xs font-medium text-slate-600 mb-1 block">Наименование *</label>
              <input required value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm" />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-600 mb-1 block">Инв. номер *</label>
              <input required value={form.inventory_number} onChange={e => setForm(f => ({ ...f, inventory_number: e.target.value }))}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm" />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-600 mb-1 block">Модель</label>
              <input value={form.model} onChange={e => setForm(f => ({ ...f, model: e.target.value }))}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm" />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-600 mb-1 block">Производитель</label>
              <input value={form.manufacturer} onChange={e => setForm(f => ({ ...f, manufacturer: e.target.value }))}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm" />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-600 mb-1 block">Серийный номер</label>
              <input value={form.serial_number} onChange={e => setForm(f => ({ ...f, serial_number: e.target.value }))}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm" />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-600 mb-1 block">Расположение</label>
              <input value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm" />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-600 mb-1 block">Ответственный</label>
              <input value={form.responsible_person} onChange={e => setForm(f => ({ ...f, responsible_person: e.target.value }))}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm" />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-600 mb-1 block">Дата поверки</label>
              <input type="date" value={form.calibration_date} onChange={e => setForm(f => ({ ...f, calibration_date: e.target.value }))}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm" />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-600 mb-1 block">Поверка до</label>
              <input type="date" value={form.calibration_due} onChange={e => setForm(f => ({ ...f, calibration_due: e.target.value }))}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm" />
            </div>
          </div>
          <button type="submit" className="flex items-center gap-2 px-5 py-2.5 bg-amber-600 text-white text-sm font-medium rounded-lg hover:bg-amber-700">
            <Plus className="w-4 h-4" /> Добавить
          </button>
        </form>
      )}

      {/* Equipment list */}
      <div className="space-y-3">
        {loading ? (
          <div className="p-12 text-center text-slate-400 bg-white rounded-xl border border-slate-200">
            <div className="animate-spin w-8 h-8 border-2 border-amber-600 border-t-transparent rounded-full mx-auto mb-3" />
            Загрузка...
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center text-slate-400 bg-white rounded-xl border border-slate-200">
            <Wrench className="w-12 h-12 mx-auto mb-3 text-slate-300" />
            <p>Оборудование не найдено</p>
          </div>
        ) : filtered.map(eq => {
          const isExpanded = expandedId === eq.id;
          const dueSoon = isCalibrationDueSoon(eq.calibration_due);
          return (
            <div key={eq.id} className={`bg-white rounded-xl border ${dueSoon ? "border-amber-300" : "border-slate-200"} overflow-hidden`}>
              <div className="flex items-center gap-4 p-4 cursor-pointer hover:bg-slate-50" onClick={() => setExpandedId(isExpanded ? null : eq.id)}>
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                  eq.status === "active" ? "bg-green-100" : eq.status === "maintenance" ? "bg-amber-100" : eq.status === "calibration" ? "bg-blue-100" : "bg-red-100"
                }`}>
                  <Settings className={`w-5 h-5 ${
                    eq.status === "active" ? "text-green-600" : eq.status === "maintenance" ? "text-amber-600" : eq.status === "calibration" ? "text-blue-600" : "text-red-600"
                  }`} />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-sm text-slate-900">{eq.name}</p>
                    {dueSoon && (
                      <span className="flex items-center gap-1 text-xs text-amber-600 bg-amber-50 px-2 py-0.5 rounded">
                        <AlertTriangle className="w-3 h-3" /> Поверка
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-4 text-xs text-slate-500 mt-0.5">
                    <span className="flex items-center gap-1"><Hash className="w-3 h-3" /> {eq.inventory_number}</span>
                    {eq.location && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {eq.location}</span>}
                    {eq.manufacturer && <span className="flex items-center gap-1"><Factory className="w-3 h-3" /> {eq.manufacturer}</span>}
                  </div>
                </div>
                <StatusBadge status={eq.status} type="equipment" />
                {isExpanded ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
              </div>

              {isExpanded && (
                <div className="border-t border-slate-100 p-5 bg-slate-50/50">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-4">
                    {eq.model && <div className="flex items-center gap-2 text-slate-600"><Tag className="w-4 h-4 text-slate-400" /> Модель: {eq.model}</div>}
                    {eq.serial_number && <div className="flex items-center gap-2 text-slate-600"><Hash className="w-4 h-4 text-slate-400" /> S/N: {eq.serial_number}</div>}
                    {eq.calibration_date && <div className="flex items-center gap-2 text-slate-600"><Calendar className="w-4 h-4 text-green-500" /> Поверен: {new Date(eq.calibration_date).toLocaleDateString("ru")}</div>}
                    {eq.calibration_due && <div className={`flex items-center gap-2 ${dueSoon ? "text-amber-600 font-medium" : "text-slate-600"}`}><Gauge className="w-4 h-4 ${dueSoon ? 'text-amber-500' : 'text-slate-400'}" /> До: {new Date(eq.calibration_due).toLocaleDateString("ru")}</div>}
                    {eq.responsible_person && <div className="flex items-center gap-2 text-slate-600"><User className="w-4 h-4 text-slate-400" /> {eq.responsible_person}</div>}
                    <div className="flex items-center gap-2 text-slate-600"><ClipboardCheck className="w-4 h-4 text-slate-400" /> Обслуживаний: {eq.maintenance_count}</div>
                    {eq.last_maintenance && <div className="flex items-center gap-2 text-slate-600"><Calendar className="w-4 h-4 text-slate-400" /> Последнее: {new Date(eq.last_maintenance).toLocaleDateString("ru")}</div>}
                  </div>

                  <button onClick={(e) => { e.stopPropagation(); setShowMaintenanceForm(showMaintenanceForm === eq.id ? null : eq.id); }}
                    className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white text-xs font-medium rounded-lg hover:bg-blue-700">
                    <ClipboardCheck className="w-3.5 h-3.5" /> Записать обслуживание
                  </button>

                  {showMaintenanceForm === eq.id && (
                    <div className="mt-4 p-4 bg-white rounded-lg border border-slate-200">
                      <h4 className="font-semibold text-sm text-slate-900 mb-3">Запись обслуживания</h4>
                      <div className="grid grid-cols-2 gap-3 mb-3">
                        <div>
                          <label className="text-xs font-medium text-slate-600 mb-1 block">Тип *</label>
                          <select value={maintForm.type} onChange={e => setMaintForm(f => ({ ...f, type: e.target.value }))}
                            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm">
                            <option value="calibration">Поверка</option>
                            <option value="repair">Ремонт</option>
                            <option value="inspection">Осмотр</option>
                            <option value="cleaning">Чистка</option>
                          </select>
                        </div>
                        <div>
                          <label className="text-xs font-medium text-slate-600 mb-1 block">Выполнил *</label>
                          <input value={maintForm.performed_by} onChange={e => setMaintForm(f => ({ ...f, performed_by: e.target.value }))}
                            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm" />
                        </div>
                        <div>
                          <label className="text-xs font-medium text-slate-600 mb-1 block">След. обслуживание</label>
                          <input type="date" value={maintForm.next_due} onChange={e => setMaintForm(f => ({ ...f, next_due: e.target.value }))}
                            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm" />
                        </div>
                        <div>
                          <label className="text-xs font-medium text-slate-600 mb-1 block">Результат</label>
                          <input value={maintForm.result} onChange={e => setMaintForm(f => ({ ...f, result: e.target.value }))}
                            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm" placeholder="Годен / Требует замены" />
                        </div>
                      </div>
                      <button onClick={() => handleMaintenance(eq.id)} disabled={!maintForm.performed_by}
                        className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white text-xs font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50">
                        <Plus className="w-3.5 h-3.5" /> Сохранить
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
  );
}
