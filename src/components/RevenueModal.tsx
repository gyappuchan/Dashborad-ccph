import React, { useState, useMemo, useRef } from 'react';
import { RevenueItem } from '../types/budget';
import {
  X,
  Plus,
  Trash2,
  Download,
  FileSpreadsheet,
  FileUp,
  Receipt,
  CheckCircle2,
  Layers,
  Edit3,
  Check,
  Building2,
  ShieldCheck,
  Lock,
} from 'lucide-react';

interface RevenueModalProps {
  isOpen: boolean;
  onClose: () => void;
  revenueItems: RevenueItem[];
  totalIncome?: number;
  onUpdateRevenueItems?: (items: RevenueItem[]) => void;
  onUpdateItems?: (items: RevenueItem[]) => void;
  onUploadRevenueFile: (file: File) => void;
  onDownloadTemplate?: () => void;
  onOpenAudit?: () => void;
  isAdmin?: boolean;
  onAdminLoginRequest?: (actionTitle?: string) => void;
}

const DEFAULT_ANU_OPTIONS = [
  'อนุสภาด้านวิชาการและการพัฒนามาตรฐานวิชาชีพ',
  'อนุสภาด้านการประเมินความรู้และหนังสืออนุมัติ',
  'อนุสภาด้านจรรยาบรรณและวินัยแห่งวิชาชีพ',
  'อนุสภาด้านการบริหารจัดการและกิจการสภา',
  'สภาการสาธารณสุขชุมชน (ส่วนกลาง)',
];

export const RevenueModal: React.FC<RevenueModalProps> = ({
  isOpen,
  onClose,
  revenueItems,
  totalIncome,
  onUpdateRevenueItems,
  onUpdateItems,
  onUploadRevenueFile,
  onDownloadTemplate,
  onOpenAudit,
  isAdmin = false,
  onAdminLoginRequest,
}) => {
  const [isAdding, setIsAdding] = useState(false);
  const [newSource, setNewSource] = useState('');
  const [newAmount, setNewAmount] = useState('');
  const [newAnu, setNewAnu] = useState(DEFAULT_ANU_OPTIONS[0]);
  const [customAnu, setCustomAnu] = useState('');
  const [newNote, setNewNote] = useState('');

  // Editing state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editSource, setEditSource] = useState('');
  const [editAmount, setEditAmount] = useState('');
  const [editAnu, setEditAnu] = useState('');
  const [editNote, setEditNote] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleUpdateList = (items: RevenueItem[]) => {
    if (onUpdateRevenueItems) onUpdateRevenueItems(items);
    if (onUpdateItems) onUpdateItems(items);
  };

  const computedIncome =
    totalIncome !== undefined
      ? totalIncome
      : revenueItems.reduce((sum, item) => sum + item.amount, 0);

  const formatMoney = (num: number) =>
    new Intl.NumberFormat('th-TH', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(num || 0);

  // Group items by Anu (ภาพรวมของอนุที่ได้รับรายได้)
  const groupedItems = useMemo(() => {
    const groups: { [anuName: string]: RevenueItem[] } = {};
    revenueItems.forEach((item) => {
      const anu = item.anuName?.trim() || 'สภาการสาธารณสุขชุมชน (ส่วนกลาง)';
      if (!groups[anu]) {
        groups[anu] = [];
      }
      groups[anu].push(item);
    });
    return groups;
  }, [revenueItems]);

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSource.trim()) return;
    const amountVal = parseFloat(newAmount.replace(/,/g, '')) || 0;
    const selectedAnu = newAnu === '__custom__' ? customAnu.trim() || 'สภาการสาธารณสุขชุมชน (ส่วนกลาง)' : newAnu;

    const newItem: RevenueItem = {
      id: `REV-${Date.now()}`,
      anuName: selectedAnu,
      source: newSource.trim(),
      amount: amountVal,
      note: newNote.trim() || undefined,
    };

    handleUpdateList([...revenueItems, newItem]);
    setNewSource('');
    setNewAmount('');
    setNewNote('');
    setCustomAnu('');
    setIsAdding(false);
  };

  const startEdit = (item: RevenueItem, index: number) => {
    setEditingId(item.id || `item-${index}`);
    setEditSource(item.source);
    setEditAmount(String(item.amount));
    setEditAnu(item.anuName || 'สภาการสาธารณสุขชุมชน (ส่วนกลาง)');
    setEditNote(item.note || '');
  };

  const saveEdit = (targetId: string, originalIndex: number) => {
    const amountVal = parseFloat(editAmount.replace(/,/g, '')) || 0;
    const updated = revenueItems.map((item, idx) => {
      const isTarget = item.id ? item.id === targetId : idx === originalIndex;
      if (isTarget) {
        return {
          ...item,
          source: editSource.trim() || item.source,
          amount: amountVal,
          anuName: editAnu.trim() || item.anuName,
          note: editNote.trim() || undefined,
        };
      }
      return item;
    });
    handleUpdateList(updated);
    setEditingId(null);
  };

  const handleDelete = (targetItem: RevenueItem) => {
    const updated = revenueItems.filter((it) => it !== targetItem);
    handleUpdateList(updated);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onUploadRevenueFile(file);
      e.target.value = '';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-800 flex items-center justify-center font-bold">
              <Receipt className="w-6 h-6 text-blue-700" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-slate-900 text-base sm:text-lg">
                  รายละเอียดประมาณการรายรับ ปี 2570
                </h3>
                {isAdmin && (
                  <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3 text-emerald-600" /> สิทธิ์ Admin: CCPHDB
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500">
                แยกตามภาพรวมของอนุที่ได้รับรายได้ · รายการ (ชื่อตามไฟล์) และงบประมาณ
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 p-2 rounded-xl hover:bg-slate-200/60 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5 overflow-y-auto flex-1">
          {/* Summary Box & Toolbar */}
          <div className="bg-gradient-to-r from-blue-50 via-sky-50 to-indigo-50 rounded-xl p-4 border border-blue-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
            <div>
              <span className="text-xs font-bold text-blue-900 block uppercase tracking-wide">
                ยอดรวมประมาณการรายรับปี 2570 (รวมทั้งหมด)
              </span>
              <div className="flex items-baseline gap-2 mt-0.5">
                <span className="text-2xl sm:text-3xl font-black text-blue-950 font-mono tabular-nums">
                  ฿ {formatMoney(computedIncome)}
                </span>
                <span className="text-xs text-blue-700 font-semibold">
                  ({Object.keys(groupedItems).length} อนุสภา / {revenueItems.length} รายการ)
                </span>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx, .xls, .csv"
                onChange={handleFileChange}
                className="hidden"
              />
              {isAdmin && (
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="text-xs font-bold text-white bg-blue-700 hover:bg-blue-800 border border-blue-800 px-3.5 py-2 rounded-xl transition-colors flex items-center gap-1.5 shadow-2xs cursor-pointer"
                  title="อัปโหลดไฟล์รายได้ (สิทธิ์ Admin)"
                >
                  <FileUp className="w-4 h-4" />
                  <span>นำเข้าไฟล์รายได้ 70</span>
                </button>
              )}

              {onOpenAudit && (
                <button
                  type="button"
                  onClick={onOpenAudit}
                  className="text-xs font-bold text-indigo-700 hover:text-indigo-900 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 px-3.5 py-2 rounded-xl transition-colors flex items-center gap-1.5 shadow-2xs cursor-pointer"
                  title="ตรวจสอบรายละเอียดย่อยแถวข้อมูลจริงจากไฟล์ Excel และการกระทบยอด"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5 text-indigo-600" />
                  <span>ตรวจสอบที่มาตัวเลข (Audit)</span>
                </button>
              )}

              <button
                onClick={onDownloadTemplate}
                className="text-xs font-semibold text-slate-700 hover:text-slate-900 bg-white hover:bg-slate-100 border border-slate-300 px-3 py-2 rounded-xl transition-colors flex items-center gap-1.5 shadow-2xs cursor-pointer"
                title="ดาวน์โหลดแบบฟอร์มประมาณการรายได้ที่มีคอลัมน์อนุที่ได้รับรายได้และชื่อตามไฟล์"
              >
                <Download className="w-3.5 h-3.5 text-slate-500" />
                <span>ดาวน์โหลดแบบฟอร์ม</span>
              </button>
            </div>
          </div>

          {/* Table of items: Grouped by อนุ with blue overview rows */}
          <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
            <table className="w-full text-left border-collapse text-xs sm:text-sm">
              <thead className="bg-slate-100 font-extrabold text-slate-800 border-b border-slate-200">
                <tr>
                  <th className="py-3 px-3 w-12 text-center">ลำดับ</th>
                  <th className="py-3 px-3">รายการ (ชื่อตามไฟล์)</th>
                  <th className="py-3 px-3 text-right w-48">งบประมาณ (บาท)</th>
                  <th className="py-3 px-3 text-right w-20">สัดส่วน</th>
                  {isAdmin && <th className="py-3 px-2 w-16 text-center"></th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {revenueItems.length === 0 ? (
                  <tr>
                    <td colSpan={isAdmin ? 5 : 4} className="py-10 text-center text-slate-400">
                      ยังไม่มีรายการรายรับแจกแจง
                    </td>
                  </tr>
                ) : (
                  Object.entries(groupedItems).map(([anuName, itemsInGroup], groupIndex) => {
                    const groupTotal = itemsInGroup.reduce((sum, item) => sum + item.amount, 0);
                    const groupPct = computedIncome > 0 ? (groupTotal / computedIncome) * 100 : 0;

                    return (
                      <React.Fragment key={anuName}>
                        {/* แทบช่องสีฟ้าคือภาพรวมของอนุที่ได้รับรายได้ */}
                        <tr className="bg-sky-600 text-white font-bold select-none border-t-2 border-sky-700">
                          <td className="py-2.5 px-3 text-center">
                            <Layers className="w-4 h-4 mx-auto text-sky-200" />
                          </td>
                          <td className="py-2.5 px-3">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="font-extrabold text-xs sm:text-sm text-white tracking-wide">
                                ภาพรวม: {anuName}
                              </span>
                              <span className="text-[11px] bg-sky-700/90 text-sky-100 px-2 py-0.5 rounded-full font-medium border border-sky-500/50">
                                {itemsInGroup.length} รายการ
                              </span>
                            </div>
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono font-black text-amber-200 text-xs sm:text-sm">
                            ฿ {formatMoney(groupTotal)}
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono font-bold text-sky-100 text-xs">
                            {groupPct.toFixed(1)}%
                          </td>
                          {isAdmin && <td className="py-2.5 px-2 text-center"></td>}
                        </tr>

                        {/* รายการใส่ชื่อตามไฟล์ และช่องงบประมาณ ภายในอนุนี้ */}
                        {itemsInGroup.map((item, itemIdx) => {
                          const itemTotalPct = computedIncome > 0 ? (item.amount / computedIncome) * 100 : 0;
                          const isEditing = editingId === (item.id || `item-${itemIdx}`);

                          if (isEditing) {
                            return (
                              <tr key={item.id || itemIdx} className="bg-amber-50/80">
                                <td className="py-2 px-3 text-center text-slate-400 font-mono text-xs">
                                  {itemIdx + 1}
                                </td>
                                <td className="py-2 px-3 space-y-1.5">
                                  <input
                                    type="text"
                                    value={editSource}
                                    onChange={(e) => setEditSource(e.target.value)}
                                    placeholder="ช่องรายการใส่ชื่อตามไฟล์"
                                    className="w-full px-2.5 py-1 text-xs border border-amber-300 rounded bg-white font-medium"
                                  />
                                  <input
                                    type="text"
                                    value={editNote}
                                    onChange={(e) => setEditNote(e.target.value)}
                                    placeholder="หมายเหตุ (ถ้ามี)"
                                    className="w-full px-2.5 py-1 text-[11px] border border-slate-200 rounded bg-white text-slate-600"
                                  />
                                </td>
                                <td className="py-2 px-3 text-right">
                                  <input
                                    type="number"
                                    value={editAmount}
                                    onChange={(e) => setEditAmount(e.target.value)}
                                    placeholder="ช่องงบประมาณ"
                                    className="w-full px-2.5 py-1 text-xs border border-amber-300 rounded bg-white font-mono text-right font-bold"
                                  />
                                </td>
                                <td className="py-2 px-3 text-right font-mono text-xs text-slate-400">
                                  --
                                </td>
                                <td className="py-2 px-2 text-center">
                                  <div className="flex items-center justify-center gap-1">
                                    <button
                                      onClick={() => saveEdit(item.id || '', itemIdx)}
                                      className="p-1 bg-emerald-600 text-white rounded hover:bg-emerald-700 cursor-pointer"
                                      title="บันทึก"
                                    >
                                      <Check className="w-3.5 h-3.5" />
                                    </button>
                                    <button
                                      onClick={() => setEditingId(null)}
                                      className="p-1 bg-slate-200 text-slate-600 rounded hover:bg-slate-300 cursor-pointer"
                                      title="ยกเลิก"
                                    >
                                      <X className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            );
                          }

                          return (
                            <tr key={item.id || itemIdx} className="hover:bg-slate-50 group transition-colors">
                              <td className="py-3 px-3 text-center text-slate-400 font-mono text-xs">
                                {itemIdx + 1}
                              </td>
                              <td className="py-3 px-3">
                                <div className="font-bold text-slate-900 leading-snug">
                                  {item.source}
                                </div>
                                {item.note && (
                                  <div className="text-xs text-slate-500 mt-0.5 leading-relaxed">
                                    {item.note}
                                  </div>
                                )}
                              </td>
                              <td className="py-3 px-3 text-right font-mono font-black text-slate-900">
                                ฿ {formatMoney(item.amount)}
                              </td>
                              <td className="py-3 px-3 text-right font-mono font-bold text-blue-700 text-xs">
                                {itemTotalPct.toFixed(1)}%
                              </td>
                              {isAdmin && (
                                <td className="py-3 px-2 text-center">
                                  <div className="opacity-0 group-hover:opacity-100 flex items-center justify-center gap-1 transition-opacity">
                                    <button
                                      onClick={() => startEdit(item, itemIdx)}
                                      className="p-1 text-slate-400 hover:text-blue-700 rounded transition-colors cursor-pointer"
                                      title="แก้ไขรายการ"
                                    >
                                      <Edit3 className="w-3.5 h-3.5" />
                                    </button>
                                    <button
                                      onClick={() => handleDelete(item)}
                                      className="p-1 text-slate-400 hover:text-rose-600 rounded transition-colors cursor-pointer"
                                      title="ลบรายการ"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                </td>
                              )}
                            </tr>
                          );
                        })}
                      </React.Fragment>
                    );
                  })
                )}
              </tbody>

              {/* ช่องรวมสุดท้ายคือ รวมทั้งหมด */}
              {revenueItems.length > 0 && (
                <tfoot className="bg-slate-900 text-white font-black border-t-2 border-slate-700">
                  <tr>
                    <td colSpan={2} className="py-3.5 px-4 text-right font-extrabold text-slate-200 text-sm sm:text-base">
                      รวมทั้งหมด :
                    </td>
                    <td className="py-3.5 px-3 text-right font-mono text-amber-300 font-black text-sm sm:text-base">
                      ฿ {formatMoney(computedIncome)}
                    </td>
                    <td className="py-3.5 px-3 text-right font-mono font-bold text-emerald-400 text-xs">
                      100.0%
                    </td>
                    {isAdmin && <td></td>}
                  </tr>
                </tfoot>
              )}
            </table>
          </div>

          {/* Add form - Only visible to Admin */}
          {isAdmin && (
            isAdding ? (
              <form onSubmit={handleAdd} className="p-4 bg-slate-50 rounded-xl border border-slate-300 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-slate-800 flex items-center gap-1.5">
                    <Plus className="w-4 h-4 text-blue-700" />
                    เพิ่มรายการรายรับใหม่
                  </span>
                  <button
                    type="button"
                    onClick={() => setIsAdding(false)}
                    className="text-slate-400 hover:text-slate-600 text-xs cursor-pointer"
                  >
                    ยกเลิก
                  </button>
                </div>

                {/* เลือกภาพรวมของอนุที่ได้รับรายได้ */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    ภาพรวมของอนุที่ได้รับรายได้ (สังกัดอนุสภา/หน่วยงาน)
                  </label>
                  <select
                    value={newAnu}
                    onChange={(e) => setNewAnu(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500"
                  >
                    {DEFAULT_ANU_OPTIONS.map((opt) => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                    {Object.keys(groupedItems)
                      .filter((anu) => !DEFAULT_ANU_OPTIONS.includes(anu))
                      .map((custom) => (
                        <option key={custom} value={custom}>
                          {custom}
                        </option>
                      ))}
                    <option value="__custom__">+ ระบุชื่ออนุสภาใหม่...</option>
                  </select>
                  {newAnu === '__custom__' && (
                    <input
                      type="text"
                      placeholder="พิมพ์ชื่ออนุสภาหรือหน่วยงานที่ได้รับรายได้..."
                      value={customAnu}
                      onChange={(e) => setCustomAnu(e.target.value)}
                      className="w-full mt-1.5 px-3 py-1.5 text-xs border border-blue-400 rounded-lg bg-white focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  )}
                </div>

                {/* ช่องรายการใส่ชื่อตามไฟล์ */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    ช่องรายการใส่ชื่อตามไฟล์ (ชื่อรายการที่มาของรายรับ)
                  </label>
                  <input
                    type="text"
                    placeholder="เช่น ค่าธรรมเนียมการขึ้นทะเบียนและรับใบอนุญาต, ค่าธรรมเนียมต่ออายุ..."
                    value={newSource}
                    onChange={(e) => setNewSource(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                {/* ช่องงบประมาณ */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      ช่องงบประมาณ (บาท)
                    </label>
                    <input
                      type="number"
                      step="1000"
                      placeholder="เช่น 12000000"
                      value={newAmount}
                      onChange={(e) => setNewAmount(e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 font-mono"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      หมายเหตุ (ถ้ามี)
                    </label>
                    <input
                      type="text"
                      placeholder="คำอธิบายเพิ่มเติม เช่น จำนวนคน, อัตราค่าบริการ"
                      value={newNote}
                      onChange={(e) => setNewNote(e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setIsAdding(false)}
                    className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-200 rounded-lg cursor-pointer"
                  >
                    ยกเลิก
                  </button>
                  <button
                    type="submit"
                    className="px-3.5 py-1.5 text-xs bg-blue-700 hover:bg-blue-800 text-white rounded-lg font-bold flex items-center gap-1 shadow-2xs cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" /> บันทึกรายการ
                  </button>
                </div>
              </form>
            ) : (
              <button
                onClick={() => setIsAdding(true)}
                className="w-full py-2.5 border-2 border-dashed border-slate-300 hover:border-blue-600 hover:bg-blue-50/40 text-slate-600 hover:text-blue-800 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                title="เพิ่มรายการรายรับใหม่ (สิทธิ์ Admin)"
              >
                <Plus className="w-4 h-4" /> เพิ่มรายการรายรับใหม่
              </button>
            )
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
          <span className="text-xs text-slate-500">
            * ระบบจัดกลุ่มตามภาพรวมของอนุที่ได้รับรายได้ และคำนวณเปรียบเทียบกับคำของบประมาณปี 70 โดยอัตโนมัติ
          </span>
          <button
            onClick={onClose}
            className="text-xs sm:text-sm font-semibold text-white bg-slate-800 hover:bg-slate-900 px-4 py-2 rounded-lg transition-colors cursor-pointer"
          >
            เสร็จสิ้น
          </button>
        </div>
      </div>
    </div>
  );
};
