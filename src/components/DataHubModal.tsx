import React, { useRef, useState } from 'react';
import {
  X,
  FileSpreadsheet,
  Download,
  FileUp,
  Receipt,
  TrendingUp,
  Layers,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  ShieldCheck,
  Clock,
  Sparkles,
  Info,
} from 'lucide-react';
import {
  downloadExcelTemplate,
  downloadRevenueTemplate,
  downloadFY69Template,
  downloadReq69Template,
  downloadActual69Template,
} from '../utils/excelExport';

interface DataHubModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUploadBudget70: (file: File) => void;
  onUploadRevenue70: (file: File) => void;
  onUploadFY69: (file: File) => void;
  onUploadReq69?: (file: File) => void;
  onUploadActual69?: (file: File) => void;
  totalExpense70: number;
  totalIncome70: number;
  totalReq69: number;
  totalActual69: number;
  itemCount70: number;
  revenueItemCount: number;
  isLoading: boolean;
  onOpenStructureGuide: () => void;
  onOpenRevenueModal?: () => void;
  onOpenAudit?: (tab?: 'revenue70' | 'actual69' | 'req69' | 'budget70') => void;
  isAdmin?: boolean;
  onAdminLoginRequest?: (actionTitle?: string) => void;
}

export const DataHubModal: React.FC<DataHubModalProps> = ({
  isOpen,
  onClose,
  onUploadBudget70,
  onUploadRevenue70,
  onUploadFY69,
  onUploadReq69,
  onUploadActual69,
  totalExpense70,
  totalIncome70,
  totalReq69,
  totalActual69,
  itemCount70,
  revenueItemCount,
  isLoading,
  onOpenStructureGuide,
  onOpenRevenueModal,
  onOpenAudit,
  isAdmin = false,
  onAdminLoginRequest,
}) => {
  const [activeTab, setActiveTab] = useState<'fourPillars' | 'combined69'>('fourPillars');

  const budget70InputRef = useRef<HTMLInputElement>(null);
  const revenue70InputRef = useRef<HTMLInputElement>(null);
  const req69InputRef = useRef<HTMLInputElement>(null);
  const actual69InputRef = useRef<HTMLInputElement>(null);
  const fy69InputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const formatMoney = (num: number) =>
    new Intl.NumberFormat('th-TH', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(num || 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl max-w-5xl w-full max-h-[94vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="font-extrabold text-slate-900 text-lg">
                  ระบบจัดการข้อมูลหลังบ้าน (Admin Data Hub)
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3 text-emerald-600" /> สิทธิ์ Admin: CCPHDB
                </span>
              </div>
              <p className="text-xs text-slate-500">
                จัดการและนำเข้าข้อมูล 4 ด้าน: 1.คำขอ 69 · 2.จ่ายจริง 69 · 3.ประมาณการรายได้ 70 · 4.คำขอ 70
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 p-2 rounded-xl hover:bg-slate-200/60 transition-colors cursor-pointer"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1 text-xs sm:text-sm">
          {/* Quick Notice banner */}
          <div className="bg-blue-50/70 border border-blue-200 rounded-xl p-3.5 flex items-start justify-between gap-3">
            <div className="flex items-start gap-2.5">
              <CheckCircle2 className="w-5 h-5 text-blue-700 flex-shrink-0 mt-0.5" />
              <div>
                <strong className="text-blue-950 font-bold block">
                  รองรับข้อมูลหลักทั้ง 4 ด้านตามโครงสร้างจริง
                </strong>
                <p className="text-blue-900/90 text-xs mt-0.5 leading-relaxed">
                  • <strong>คำขอ 69 และ 70:</strong> จะมีช่องรหัสโครงการ, รายละเอียดกิจกรรม, งบประมาณ<br />
                  • <strong>จ่ายจริง 69 และ รายรับ 70:</strong> จะมีรายกิจกรรม, งบประมาณ และช่องรวมของอนุนั้นๆ กับย่อยรายละเอียด
                </p>
              </div>
            </div>
            <button
              onClick={onOpenStructureGuide}
              className="text-xs font-bold text-blue-800 hover:underline flex items-center gap-1 flex-shrink-0 cursor-pointer"
            >
              <HelpCircle className="w-3.5 h-3.5" /> ดูโครงสร้างไฟล์
            </button>
          </div>

          {/* Tab Mode Selector: แยก 4 ด้าน หรือ ไฟล์รวม 69 */}
          <div className="flex items-center gap-2 p-1 bg-slate-100 rounded-xl border border-slate-200/80 w-fit">
            <button
              onClick={() => setActiveTab('fourPillars')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'fourPillars'
                  ? 'bg-blue-700 text-white shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              นำเข้าแยก 4 ด้านอย่างอิสระ (แนะนำ)
            </button>
            <button
              onClick={() => setActiveTab('combined69')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'combined69'
                  ? 'bg-blue-700 text-white shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              หรือใช้ไฟล์รวมข้อมูลปี 2569 (คำขอ+จ่ายจริงในไฟล์เดียว)
            </button>
          </div>

          {/* 4 Upload Slots Grid */}
          {activeTab === 'fourPillars' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Slot 1: คำของบประมาณปี 2569 */}
              <div className="bg-white rounded-2xl border-2 border-slate-200 hover:border-slate-400 transition-all p-4 flex flex-col justify-between shadow-2xs">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center font-bold">
                      <FileSpreadsheet className="w-4 h-4" />
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-800">
                      ด้านที่ 1
                    </span>
                  </div>
                  <h4 className="font-extrabold text-slate-900 text-sm mb-1">
                    1. คำของบประมาณ 2569
                  </h4>
                  <p className="text-[11px] text-slate-500 mb-2 leading-relaxed">
                    มีช่อง: รหัสโครงการ · รายละเอียดกิจกรรม · งบประมาณ
                  </p>

                  <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 mb-3">
                    <span className="text-[10px] font-bold text-slate-600 block">
                      สถานะปัจจุบัน:
                    </span>
                    <div className="text-base font-black text-slate-900 font-mono mt-0.5">
                      ฿ {formatMoney(totalReq69)}
                    </div>
                  </div>
                </div>

                <div className="space-y-1.5 pt-1">
                  <input
                    ref={req69InputRef}
                    type="file"
                    accept=".xlsx, .xls, .csv"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        if (onUploadReq69) onUploadReq69(file);
                        else onUploadFY69(file);
                        e.target.value = '';
                      }
                    }}
                    className="hidden"
                  />
                  <button
                    onClick={() => {
                      if (!isAdmin && onAdminLoginRequest) {
                        onAdminLoginRequest('นำเข้าไฟล์คำของบประมาณ 2569');
                        return;
                      }
                      req69InputRef.current?.click();
                    }}
                    disabled={isLoading}
                    className="w-full py-2 px-2.5 bg-slate-800 hover:bg-slate-900 disabled:bg-slate-300 text-white rounded-lg font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <FileUp className="w-3.5 h-3.5" />
                    <span>นำเข้าไฟล์คำขอ 69</span>
                  </button>
                  <button
                    onClick={downloadReq69Template}
                    className="w-full py-1 px-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md text-[11px] font-semibold flex items-center justify-center gap-1 transition-colors cursor-pointer"
                  >
                    <Download className="w-3 h-3" />
                    <span>แบบฟอร์มคำขอ 69</span>
                  </button>
                  {onOpenAudit && (
                    <button
                      type="button"
                      onClick={() => onOpenAudit('req69')}
                      className="w-full py-1 px-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-md text-[11px] font-semibold flex items-center justify-center gap-1 transition-colors cursor-pointer"
                    >
                      <FileSpreadsheet className="w-3 h-3 text-indigo-600" />
                      <span>ดูรายละเอียดการอ่านไฟล์ (Audit)</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Slot 2: จ่ายจริงในปี 2569 */}
              <div className="bg-white rounded-2xl border-2 border-amber-200/80 hover:border-amber-400 transition-all p-4 flex flex-col justify-between shadow-2xs">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-900 flex items-center justify-center font-bold">
                      <TrendingUp className="w-4 h-4" />
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-950">
                      ด้านที่ 2
                    </span>
                  </div>
                  <h4 className="font-extrabold text-slate-900 text-sm mb-1">
                    2. จ่ายจริงในปี 2569
                  </h4>
                  <p className="text-[11px] text-slate-500 mb-2 leading-relaxed">
                    มีช่อง: รายกิจกรรม · งบประมาณ และช่องรวมของอนุนั้นๆ
                  </p>

                  <div className="p-2.5 bg-amber-50/70 rounded-xl border border-amber-200 mb-3">
                    <span className="text-[10px] font-bold text-amber-900 block">
                      สถานะปัจจุบัน:
                    </span>
                    <div className="text-base font-black text-amber-950 font-mono mt-0.5">
                      ฿ {formatMoney(totalActual69)}
                    </div>
                  </div>
                </div>

                <div className="space-y-1.5 pt-1">
                  <input
                    ref={actual69InputRef}
                    type="file"
                    accept=".xlsx, .xls, .csv"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        if (onUploadActual69) onUploadActual69(file);
                        else onUploadFY69(file);
                        e.target.value = '';
                      }
                    }}
                    className="hidden"
                  />
                  <button
                    onClick={() => {
                      if (!isAdmin && onAdminLoginRequest) {
                        onAdminLoginRequest('นำเข้าไฟล์ผลจ่ายจริงปี 2569');
                        return;
                      }
                      actual69InputRef.current?.click();
                    }}
                    disabled={isLoading}
                    className="w-full py-2 px-2.5 bg-amber-700 hover:bg-amber-800 disabled:bg-amber-300 text-white rounded-lg font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <FileUp className="w-3.5 h-3.5" />
                    <span>นำเข้าไฟล์จ่ายจริง 69</span>
                  </button>
                  <button
                    onClick={downloadActual69Template}
                    className="w-full py-1 px-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md text-[11px] font-semibold flex items-center justify-center gap-1 transition-colors cursor-pointer"
                  >
                    <Download className="w-3 h-3" />
                    <span>แบบฟอร์มจ่ายจริง 69</span>
                  </button>
                  {onOpenAudit && (
                    <button
                      type="button"
                      onClick={() => onOpenAudit('actual69')}
                      className="w-full py-1 px-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-md text-[11px] font-semibold flex items-center justify-center gap-1 transition-colors cursor-pointer"
                    >
                      <FileSpreadsheet className="w-3 h-3 text-indigo-600" />
                      <span>ดูรายละเอียดการอ่านไฟล์ (Audit)</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Slot 3: ประมาณการรายได้ปี 2570 */}
              <div className="bg-white rounded-2xl border-2 border-emerald-200/80 hover:border-emerald-400 transition-all p-4 flex flex-col justify-between shadow-2xs">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
                      <Receipt className="w-4 h-4" />
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-950">
                      ด้านที่ 3
                    </span>
                  </div>
                  <h4 className="font-extrabold text-slate-900 text-sm mb-1">
                    3. ประมาณการรายได้ 2570
                  </h4>
                  <p className="text-[11px] text-slate-500 mb-2 leading-relaxed">
                    มีช่อง: รายกิจกรรม/ที่มา · งบประมาณ และช่องรวมของอนุนั้นๆ
                  </p>

                  <div className="p-2.5 bg-emerald-50/70 rounded-xl border border-emerald-200 mb-3">
                    <span className="text-[10px] font-bold text-emerald-900 block">
                      สถานะปัจจุบัน:
                    </span>
                    <div className="text-base font-black text-emerald-950 font-mono mt-0.5">
                      ฿ {formatMoney(totalIncome70)}
                    </div>
                  </div>
                </div>

                <div className="space-y-1.5 pt-1">
                  <input
                    ref={revenue70InputRef}
                    type="file"
                    accept=".xlsx, .xls, .csv"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        onUploadRevenue70(file);
                        e.target.value = '';
                      }
                    }}
                    className="hidden"
                  />
                  <button
                    onClick={() => {
                      if (!isAdmin && onAdminLoginRequest) {
                        onAdminLoginRequest('นำเข้าไฟล์ประมาณการรายได้ 70');
                        return;
                      }
                      revenue70InputRef.current?.click();
                    }}
                    disabled={isLoading}
                    className="w-full py-2 px-2.5 bg-emerald-700 hover:bg-emerald-800 disabled:bg-emerald-300 text-white rounded-lg font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <FileUp className="w-3.5 h-3.5" />
                    <span>นำเข้าไฟล์รายได้ 70</span>
                  </button>
                  <button
                    onClick={downloadRevenueTemplate}
                    className="w-full py-1 px-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md text-[11px] font-semibold flex items-center justify-center gap-1 transition-colors cursor-pointer"
                  >
                    <Download className="w-3 h-3" />
                    <span>แบบฟอร์มรายได้ 70</span>
                  </button>
                  {onOpenAudit && (
                    <button
                      type="button"
                      onClick={() => onOpenAudit('revenue70')}
                      className="w-full py-1 px-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-md text-[11px] font-semibold flex items-center justify-center gap-1 transition-colors cursor-pointer"
                    >
                      <FileSpreadsheet className="w-3 h-3 text-indigo-600" />
                      <span>ดูรายละเอียดการอ่านไฟล์ (Audit)</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Slot 4: คำของบประมาณรายจ่ายปี 2570 */}
              <div className="bg-white rounded-2xl border-2 border-blue-200/80 hover:border-blue-400 transition-all p-4 flex flex-col justify-between shadow-2xs">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-800 flex items-center justify-center font-bold">
                      <Layers className="w-4 h-4" />
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-950">
                      ด้านที่ 4
                    </span>
                  </div>
                  <h4 className="font-extrabold text-slate-900 text-sm mb-1">
                    4. คำของบประมาณ 2570
                  </h4>
                  <p className="text-[11px] text-slate-500 mb-2 leading-relaxed">
                    มีช่อง: รหัสโครงการ · รายละเอียดกิจกรรม · งบประมาณ
                  </p>

                  <div className="p-2.5 bg-blue-50/70 rounded-xl border border-blue-200 mb-3">
                    <span className="text-[10px] font-bold text-blue-900 block">
                      สถานะปัจจุบัน:
                    </span>
                    <div className="text-base font-black text-blue-950 font-mono mt-0.5">
                      ฿ {formatMoney(totalExpense70)}
                    </div>
                  </div>
                </div>

                <div className="space-y-1.5 pt-1">
                  <input
                    ref={budget70InputRef}
                    type="file"
                    accept=".xlsx, .xls, .csv"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        onUploadBudget70(file);
                        e.target.value = '';
                      }
                    }}
                    className="hidden"
                  />
                  <button
                    onClick={() => {
                      if (!isAdmin && onAdminLoginRequest) {
                        onAdminLoginRequest('นำเข้าไฟล์คำของบประมาณ 2570');
                        return;
                      }
                      budget70InputRef.current?.click();
                    }}
                    disabled={isLoading}
                    className="w-full py-2 px-2.5 bg-blue-700 hover:bg-blue-800 disabled:bg-blue-300 text-white rounded-lg font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <FileUp className="w-3.5 h-3.5" />
                    <span>นำเข้าไฟล์คำขอ 70</span>
                  </button>
                  <button
                    onClick={downloadExcelTemplate}
                    className="w-full py-1 px-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md text-[11px] font-semibold flex items-center justify-center gap-1 transition-colors cursor-pointer"
                  >
                    <Download className="w-3 h-3" />
                    <span>แบบฟอร์มคำขอ 70</span>
                  </button>
                  {onOpenAudit && (
                    <button
                      type="button"
                      onClick={() => onOpenAudit('budget70')}
                      className="w-full py-1 px-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-md text-[11px] font-semibold flex items-center justify-center gap-1 transition-colors cursor-pointer"
                    >
                      <FileSpreadsheet className="w-3 h-3 text-indigo-600" />
                      <span>ดูรายละเอียดการอ่านไฟล์ (Audit)</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          ) : (
            /* Combined Slot for FY 69 */
            <div className="p-5 rounded-2xl border-2 border-amber-200 bg-amber-50/40 space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-900 flex items-center justify-center font-bold">
                  <TrendingUp className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-extrabold text-slate-900 text-base">
                    ไฟล์รวมข้อมูลปี 2569 (คำขอ 69 และ จ่ายจริง 69 ในไฟล์เดียว)
                  </h4>
                  <p className="text-xs text-slate-600">
                    หากหน่วยงานของท่านบันทึกทั้งคำขอปี 69 และผลการจ่ายจริงปี 69 ไว้ในชีตเดียวกัน สามารถอัปโหลดช่องนี้ได้ทันที
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3 pt-2">
                <input
                  ref={fy69InputRef}
                  type="file"
                  accept=".xlsx, .xls, .csv"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      onUploadFY69(file);
                      e.target.value = '';
                    }
                  }}
                  className="hidden"
                />
                <button
                  onClick={() => {
                    if (!isAdmin && onAdminLoginRequest) {
                      onAdminLoginRequest('นำเข้าไฟล์รวมปี 2569');
                      return;
                    }
                    fy69InputRef.current?.click();
                  }}
                  className="py-2.5 px-4 bg-amber-700 hover:bg-amber-800 text-white rounded-xl font-bold text-xs flex items-center gap-2 transition-colors cursor-pointer shadow-2xs"
                >
                  <FileUp className="w-4 h-4" />
                  <span>เลือกไฟล์รวมปี 2569</span>
                </button>
                <button
                  onClick={downloadFY69Template}
                  className="py-2 px-3 bg-white hover:bg-slate-100 text-slate-700 rounded-xl font-bold text-xs border border-slate-300 flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  <span>ดาวน์โหลดแบบฟอร์มรวมปี 69</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
          <span className="text-xs text-slate-500 font-medium">
            * ระบบทำการประมวลผลข้อมูลในเบราว์เซอร์ของคุณอย่างปลอดภัย 100%
          </span>
          <button
            onClick={onClose}
            className="text-xs sm:text-sm font-semibold text-slate-700 hover:text-slate-900 bg-white hover:bg-slate-100 border border-slate-300 px-4 py-2 rounded-lg transition-colors cursor-pointer"
          >
            ปิดหน้าต่าง
          </button>
        </div>
      </div>
    </div>
  );
};
