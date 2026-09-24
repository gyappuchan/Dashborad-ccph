import React, { useState, useMemo } from 'react';
import { ParseAuditReport, RawRowAudit } from '../types/budget';
import {
  X,
  FileSpreadsheet,
  CheckCircle2,
  AlertTriangle,
  Info,
  Search,
  Filter,
  Layers,
  ArrowRight,
  TrendingUp,
  Receipt,
  RotateCcw,
  Sparkles,
} from 'lucide-react';

interface FileAuditModalProps {
  isOpen: boolean;
  onClose: () => void;
  reports: {
    revenue70?: ParseAuditReport;
    actual69?: ParseAuditReport;
    req69?: ParseAuditReport;
    budget70?: ParseAuditReport;
  };
  initialTab?: 'revenue70' | 'actual69' | 'req69' | 'budget70';
  onUpdateRevenueAudit?: (updatedReport: ParseAuditReport) => void;
  onUpdateActual69Audit?: (updatedReport: ParseAuditReport) => void;
}

export const FileAuditModal: React.FC<FileAuditModalProps> = ({
  isOpen,
  onClose,
  reports,
  initialTab = 'revenue70',
}) => {
  const [activeTab, setActiveTab] = useState<'revenue70' | 'actual69' | 'req69' | 'budget70'>(initialTab);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | 'detail' | 'overview' | 'grand_total' | 'skipped'>('all');

  // Sync initial tab when opening
  React.useEffect(() => {
    if (initialTab && reports[initialTab]) {
      setActiveTab(initialTab);
    } else {
      const available = (['revenue70', 'actual69', 'req69', 'budget70'] as const).find((k) => reports[k]);
      if (available) setActiveTab(available);
    }
  }, [initialTab, isOpen, reports]);

  const currentReport = reports[activeTab];

  const formatMoney = (num: number) =>
    new Intl.NumberFormat('th-TH', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(num || 0);

  const filteredRows = useMemo(() => {
    if (!currentReport || !currentReport.rows) return [];
    return currentReport.rows.filter((row) => {
      if (roleFilter !== 'all') {
        if (roleFilter === 'skipped' && row.rowRole !== 'skipped' && row.rowRole !== 'empty') return false;
        if (roleFilter !== 'skipped' && row.rowRole !== roleFilter) return false;
      }
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchName = row.extractedName.toLowerCase().includes(query);
        const matchAnu = row.extractedAnu.toLowerCase().includes(query);
        const matchText = row.rawText.toLowerCase().includes(query);
        const matchRow = String(row.rowNumber).includes(query);
        return matchName || matchAnu || matchText || matchRow;
      }
      return true;
    });
  }, [currentReport, roleFilter, searchQuery]);

  if (!isOpen) return null;

  const tabLabels = {
    revenue70: { label: 'ประมาณการรายรับ 2570', icon: Receipt, color: 'text-blue-700 bg-blue-50 border-blue-200' },
    actual69: { label: 'ผลการจ่ายจริง 2569', icon: TrendingUp, color: 'text-amber-700 bg-amber-50 border-amber-200' },
    req69: { label: 'คำของบประมาณ 2569', icon: Layers, color: 'text-slate-700 bg-slate-50 border-slate-200' },
    budget70: { label: 'คำของบประมาณ 2570', icon: Layers, color: 'text-emerald-700 bg-emerald-50 border-emerald-200' },
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/65 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl max-w-5xl w-full max-h-[94vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold shadow-2xs">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-slate-900 text-base sm:text-lg">
                  ตรวจสอบและกระทบยอดข้อมูลจากไฟล์ Excel (Audit & Breakdown)
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                  เจาะลึกรายแถว
                </span>
              </div>
              <p className="text-xs text-slate-500">
                แสดงผลการอ่านไฟล์จริงทุกแถว ตรวจสอบยอดรวม และไขข้อข้องใจว่าทำไมตัวเลขจึงคำนวณเช่นนั้น
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

        {/* Tab Selection */}
        <div className="flex border-b border-slate-200 bg-slate-100/70 px-6 gap-2 pt-2 flex-shrink-0 overflow-x-auto">
          {(['revenue70', 'actual69', 'req69', 'budget70'] as const).map((key) => {
            const tabInfo = tabLabels[key];
            const Icon = tabInfo.icon;
            const hasData = !!reports[key];
            const isActive = activeTab === key;

            return (
              <button
                key={key}
                onClick={() => setActiveTab(key)}
                className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-t-xl transition-all border-t border-x cursor-pointer ${
                  isActive
                    ? 'bg-white text-slate-900 border-slate-200 border-b-white -mb-px shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900 border-transparent hover:bg-slate-200/60'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-indigo-600' : 'text-slate-400'}`} />
                <span>{tabInfo.label}</span>
                {hasData ? (
                  <span className="w-2 h-2 rounded-full bg-emerald-500" title="มีรายงานการอ่านไฟล์" />
                ) : (
                  <span className="text-[10px] text-slate-400 font-normal">(ไม่มีไฟล์)</span>
                )}
              </button>
            );
          })}
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {!currentReport ? (
            <div className="text-center py-16 px-4 bg-slate-50 rounded-2xl border border-dashed border-slate-300">
              <FileSpreadsheet className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <h4 className="text-base font-bold text-slate-700">ยังไม่มีประวัติการอัปโหลดไฟล์สำหรับหมวดนี้</h4>
              <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
                กรุณาอัปโหลดไฟล์ Excel ในหน้า <strong>จัดการข้อมูล (Data Hub)</strong> เพื่อดูรายงานการกระทบยอดรายแถว
              </p>
            </div>
          ) : (
            <>
              {/* Reconciliation Summary Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* File Grand Total */}
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5">
                  <span className="text-xs font-bold text-slate-500 block">1. ยอดรวมท้ายตารางในไฟล์ Excel</span>
                  <div className="flex items-baseline gap-1 mt-1">
                    <span className="text-xl sm:text-2xl font-black text-slate-900 font-mono">
                      ฿{formatMoney(currentReport.fileGrandTotal)}
                    </span>
                  </div>
                  <span className="text-[11px] text-slate-400">
                    {currentReport.fileGrandTotal > 0
                      ? 'พบแถว "รวมทั้งหมด/รวมทั้งสิ้น" ในไฟล์'
                      : 'ไม่พบแถวรวมสุทธิในไฟล์ (ประมวลผลจากรายการย่อย)'}
                  </span>
                </div>

                {/* Parsed Sum */}
                <div className="bg-indigo-50/60 border border-indigo-200 rounded-xl p-3.5">
                  <span className="text-xs font-bold text-indigo-700 block">2. ยอดรวมที่ระบบดึงมาได้</span>
                  <div className="flex items-baseline gap-1 mt-1">
                    <span className="text-xl sm:text-2xl font-black text-indigo-950 font-mono">
                      ฿{formatMoney(currentReport.parsedSum)}
                    </span>
                  </div>
                  <span className="text-[11px] text-indigo-600 font-semibold">
                    ดึงได้ {currentReport.itemsCount} รายการย่อย
                  </span>
                </div>

                {/* Reconciliation Diff */}
                <div
                  className={`border rounded-xl p-3.5 ${
                    currentReport.reconciliationDiff === 0
                      ? 'bg-emerald-50/60 border-emerald-200'
                      : 'bg-amber-50/60 border-amber-200'
                  }`}
                >
                  <span
                    className={`text-xs font-bold block ${
                      currentReport.reconciliationDiff === 0 ? 'text-emerald-700' : 'text-amber-800'
                    }`}
                  >
                    3. การกระทบยอด (ผลต่าง Diff)
                  </span>
                  <div className="flex items-center gap-1.5 mt-1">
                    {currentReport.reconciliationDiff === 0 ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                    ) : (
                      <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0" />
                    )}
                    <span
                      className={`text-xl sm:text-2xl font-black font-mono ${
                        currentReport.reconciliationDiff === 0 ? 'text-emerald-900' : 'text-amber-900'
                      }`}
                    >
                      ฿{formatMoney(Math.abs(currentReport.reconciliationDiff))}
                    </span>
                  </div>
                  <span
                    className={`text-[11px] font-semibold ${
                      currentReport.reconciliationDiff === 0 ? 'text-emerald-700' : 'text-amber-700'
                    }`}
                  >
                    {currentReport.reconciliationDiff === 0
                      ? 'ตรงกับยอดรวมในไฟล์ 100% สมบูรณ์'
                      : currentReport.reconciliationDiff > 0
                      ? `ยอดระบบสูงกว่ายอดท้ายตาราง ฿${formatMoney(currentReport.reconciliationDiff)}`
                      : `ยอดระบบต่ำกว่ายอดท้ายตาราง ฿${formatMoney(Math.abs(currentReport.reconciliationDiff))}`}
                  </span>
                </div>
              </div>

              {/* Diagnostic Insight Note */}
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-4 flex items-start gap-3 shadow-2xs">
                <Info className="w-5 h-5 text-blue-700 flex-shrink-0 mt-0.5" />
                <div className="text-xs text-blue-900 space-y-1">
                  <div className="font-extrabold text-blue-950 text-sm flex items-center gap-2">
                    <span>วิเคราะห์โครงสร้างไฟล์: {currentReport.filename}</span>
                    <span className="font-normal text-xs text-blue-700">(แผ่นงาน: {currentReport.sheetName})</span>
                  </div>
                  <p className="leading-relaxed">
                    <strong>คอลัมน์ที่ตรวจพบ:</strong> รายการ/กิจกรรม: <code>{currentReport.detectedColumns['รายการรายรับ'] || currentReport.detectedColumns['รายกิจกรรม'] || currentReport.detectedColumns['รายละเอียดกิจกรรม']}</code> | ยอดเงิน: <code>{currentReport.detectedColumns['งบประมาณรายรับ'] || currentReport.detectedColumns['จ่ายจริง 69'] || currentReport.detectedColumns['คำขอปี 70']}</code>
                  </p>
                  <p className="leading-relaxed text-blue-800">
                    💡 <strong>เหตุผลที่ตัวเลขถูกประมวลผลเช่นนี้:</strong> ในไฟล์มีแถวภาพรวม/ช่องรวมของอนุสภาจำนวน{' '}
                    <strong>{currentReport.overviewCount} แถว</strong>{' '}
                    ระบบตรวจสอบพบว่ามีรายการย่อยอยู่ภายใต้หมวดนั้นๆ จึงทำการ{' '}
                    <strong>"นับเฉพาะรายการย่อย และยกเว้นแถวภาพรวม"</strong> เพื่อป้องกันไม่ให้ยอดงบประมาณถูกบวกซ้ำซ้อนเป็น 2 เท่าตามหลักการทำบัญชีงบประมาณ
                  </p>
                </div>
              </div>

              {/* Search & Filter Toolbar */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
                <div className="relative w-full sm:w-80">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="ค้นหาชื่อรายการ, อนุสภา หรือแถวที่..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs"
                    >
                      ✕
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto">
                  <span className="text-xs font-bold text-slate-500 flex items-center gap-1 mr-1">
                    <Filter className="w-3.5 h-3.5" /> กรอง:
                  </span>
                  {[
                    { id: 'all', label: `ทั้งหมด (${currentReport.rows.length})` },
                    { id: 'detail', label: `รายการย่อยที่นับ (${currentReport.rows.filter((r) => r.isCounted).length})` },
                    { id: 'overview', label: `แถวรวมของอนุ (${currentReport.overviewCount})` },
                    { id: 'grand_total', label: `แถวรวมทั้งหมด` },
                    { id: 'skipped', label: `แถวที่ข้าม` },
                  ].map((filter) => (
                    <button
                      key={filter.id}
                      onClick={() => setRoleFilter(filter.id as any)}
                      className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-all cursor-pointer whitespace-nowrap ${
                        roleFilter === filter.id
                          ? 'bg-indigo-600 text-white shadow-2xs font-bold'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200/80'
                      }`}
                    >
                      {filter.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Row-by-Row Inspection Table */}
              <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
                <div className="max-h-[380px] overflow-y-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead className="bg-slate-100 font-extrabold text-slate-800 border-b border-slate-200 sticky top-0 z-10">
                      <tr>
                        <th className="py-2.5 px-3 w-16 text-center">แถวที่</th>
                        <th className="py-2.5 px-3">รายการ / กิจกรรม (ตามไฟล์)</th>
                        <th className="py-2.5 px-3 w-48">อนุสภา / หมวด</th>
                        <th className="py-2.5 px-3 text-right w-36">งบประมาณ (บาท)</th>
                        <th className="py-2.5 px-3 text-center w-28">ประเภทแถว</th>
                        <th className="py-2.5 px-3 text-center w-24">การนับยอด</th>
                        <th className="py-2.5 px-3 w-56">คำอธิบายเหตุผล</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredRows.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="text-center py-10 text-slate-400">
                            ไม่พบแถวข้อมูลที่ตรงกับเงื่อนไขการค้นหา
                          </td>
                        </tr>
                      ) : (
                        filteredRows.map((row, idx) => {
                          const isCounted = row.isCounted;

                          let roleBadge = {
                            text: 'รายการย่อย',
                            bg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
                          };
                          if (row.rowRole === 'overview') {
                            roleBadge = {
                              text: 'ภาพรวมอนุสภา',
                              bg: 'bg-blue-50 text-blue-700 border-blue-200',
                            };
                          } else if (row.rowRole === 'grand_total') {
                            roleBadge = {
                              text: 'รวมทั้งหมด',
                              bg: 'bg-purple-50 text-purple-700 border-purple-200',
                            };
                          } else if (row.rowRole === 'skipped' || row.rowRole === 'empty') {
                            roleBadge = {
                              text: 'ข้าม/ว่าง',
                              bg: 'bg-slate-100 text-slate-500 border-slate-200',
                            };
                          }

                          return (
                            <tr
                              key={`${row.rowNumber}-${idx}`}
                              className={`transition-colors hover:bg-slate-50/80 ${
                                row.rowRole === 'overview'
                                  ? 'bg-blue-50/20'
                                  : row.rowRole === 'grand_total'
                                  ? 'bg-purple-50/20 font-bold'
                                  : !isCounted
                                  ? 'opacity-70 bg-slate-50/40'
                                  : ''
                              }`}
                            >
                              <td className="py-2.5 px-3 text-center font-mono text-slate-400 font-bold">
                                {row.rowNumber}
                              </td>
                              <td className="py-2.5 px-3">
                                <div className="font-semibold text-slate-900 line-clamp-2">
                                  {row.extractedName || <span className="text-slate-400 italic">(ไม่มีชื่อ)</span>}
                                </div>
                                <div className="text-[10px] text-slate-400 font-mono truncate max-w-md" title={row.rawText}>
                                  Raw: {row.rawText}
                                </div>
                              </td>
                              <td className="py-2.5 px-3 text-slate-600">
                                <span className="line-clamp-1" title={row.extractedAnu}>
                                  {row.extractedAnu}
                                </span>
                              </td>
                              <td className="py-2.5 px-3 text-right font-mono font-bold">
                                {row.extractedAmount > 0 ? (
                                  <span className={isCounted ? 'text-indigo-950' : 'text-slate-400 line-through'}>
                                    ฿{formatMoney(row.extractedAmount)}
                                  </span>
                                ) : (
                                  <span className="text-slate-300">-</span>
                                )}
                              </td>
                              <td className="py-2.5 px-3 text-center">
                                <span
                                  className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold border ${roleBadge.bg}`}
                                >
                                  {roleBadge.text}
                                </span>
                              </td>
                              <td className="py-2.5 px-3 text-center">
                                {isCounted ? (
                                  <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                                    <CheckCircle2 className="w-3 h-3 text-emerald-600" /> นับยอด
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                                    ไม่นับ
                                  </span>
                                )}
                              </td>
                              <td className="py-2.5 px-3 text-[11px] text-slate-600">
                                {row.statusMessage}
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-200 bg-slate-50 flex items-center justify-between flex-shrink-0">
          <div className="text-xs text-slate-500">
            ระบบตรวจสอบข้อมูล Real-Time · ไม่มีการสุ่มตัวเลข · ข้อมูลตรงตามตาราง Excel จริง 100%
          </div>
          <button
            onClick={onClose}
            className="px-5 py-2 text-xs font-bold text-slate-700 bg-white border border-slate-300 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer shadow-2xs"
          >
            ปิดหน้าต่าง
          </button>
        </div>
      </div>
    </div>
  );
};
