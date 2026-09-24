import React, { useState, useMemo } from 'react';
import {
  BudgetItem,
  CategorySummary,
  RevenueItem,
} from '../types/budget';
import {
  PieChart,
  BarChart3,
  TrendingUp,
  Scale,
  Receipt,
  FileSpreadsheet,
  ChevronRight,
  ChevronDown,
  X,
  Search,
  Filter,
  CheckCircle2,
  AlertCircle,
  Clock,
  Sparkles,
  ArrowUpRight,
  ArrowDownRight,
  Maximize2,
  Eye,
  Layers,
  Percent,
  Download,
  Info,
  ShieldCheck,
} from 'lucide-react';
import * as XLSX from 'xlsx';

interface CoreDashboardViewsProps {
  items: BudgetItem[];
  categories: CategorySummary[];
  revenueItems: RevenueItem[];
  totalExpense: number;
  totalIncome: number;
  onOpenRevenueModal?: () => void;
  onOpenDataHub?: () => void;
  onOpenAudit?: (tab?: 'revenue70' | 'actual69' | 'req69' | 'budget70') => void;
  isAdmin?: boolean;
}

export type DashboardMode = 'dimension1' | 'dimension2';

export const CoreDashboardViews: React.FC<CoreDashboardViewsProps> = ({
  items,
  categories,
  revenueItems,
  totalExpense,
  totalIncome,
  onOpenRevenueModal,
  onOpenDataHub,
  onOpenAudit,
  isAdmin = false,
}) => {
  // Active Tab Mode
  const [activeMode, setActiveMode] = useState<DashboardMode>('dimension1');

  // Dimension 1 State: Selected Sub-committee for Deep Drill-Down Modal
  const [selectedSubCommittee, setSelectedSubCommittee] = useState<CategorySummary | null>(null);

  // Dimension 2 State: Filters & Search
  const [activityFilterMode, setActivityFilterMode] = useState<'historical' | 'new' | 'all'>('historical');
  const [historicalSearch, setHistoricalSearch] = useState<string>('');
  const [historicalCategoryFilter, setHistoricalCategoryFilter] = useState<string>('ALL');

  const formatMoney = (num: number) =>
    new Intl.NumberFormat('th-TH', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(num || 0);

  // -------------------------------------------------------------
  // DIMENSION 1 CALCULATIONS: รายได้ 2570 vs คำขอ 2570
  // -------------------------------------------------------------
  const netBalance = totalIncome - totalExpense;
  const isSurplus = netBalance >= 0;
  const coveragePercent = totalIncome > 0 ? (totalExpense / totalIncome) * 100 : 0;

  // Breakdown by Sub-committee
  const subCommitteeComparison = useMemo(() => {
    return categories.map((cat) => {
      // Find revenue items matching this category
      const matchedRevenue = revenueItems.filter((rev) => {
        if (!rev.anuName) return false;
        const normAnu = rev.anuName.trim().toLowerCase();
        const normCat = cat.name.trim().toLowerCase();
        return normAnu.includes(normCat) || normCat.includes(normAnu);
      });

      const catRevenue = matchedRevenue.reduce((sum, r) => sum + r.amount, 0);
      const catExpense = cat.totalBudget;
      const catBalance = catRevenue - catExpense;
      const catCoverage = catRevenue > 0 ? (catExpense / catRevenue) * 100 : 0;

      return {
        ...cat,
        catRevenue,
        catExpense,
        catBalance,
        catCoverage,
        matchedRevenue,
      };
    });
  }, [categories, revenueItems]);

  // General Revenue not tied to any sub-committee
  const unassignedRevenue = useMemo(() => {
    return revenueItems.filter((rev) => {
      if (!rev.anuName) return true;
      const normAnu = rev.anuName.trim().toLowerCase();
      return (
        normAnu.includes('ส่วนกลาง') ||
        normAnu.includes('สภา') ||
        !categories.some((c) => {
          const normCat = c.name.trim().toLowerCase();
          return normAnu.includes(normCat) || normCat.includes(normAnu);
        })
      );
    });
  }, [revenueItems, categories]);

  // -------------------------------------------------------------
  // DIMENSION 2 CALCULATIONS: กิจกรรมรายเก่า (จ่ายจริง 69 เทียบคำขอ 69 และ 70)
  // -------------------------------------------------------------
  const allSubActivities = useMemo(() => {
    return items.filter((it) => !it.isMain);
  }, [items]);

  // Historical activities with actual spending in 69
  const historicalActivities = useMemo(() => {
    return allSubActivities.filter((it) => it.actual69 !== undefined && it.actual69 > 0);
  }, [allSubActivities]);

  // Brand new activities in 70 (no actual spending in 69)
  const newActivities = useMemo(() => {
    return allSubActivities.filter((it) => !it.actual69 || it.actual69 === 0);
  }, [allSubActivities]);

  // Filtered dataset for Dimension 2
  const displayedActivities = useMemo(() => {
    let list =
      activityFilterMode === 'historical'
        ? historicalActivities
        : activityFilterMode === 'new'
        ? newActivities
        : allSubActivities;

    if (historicalCategoryFilter !== 'ALL') {
      list = list.filter((it) => it.parentName === historicalCategoryFilter);
    }

    if (historicalSearch.trim()) {
      const q = historicalSearch.trim().toLowerCase();
      list = list.filter(
        (it) =>
          it.activity.toLowerCase().includes(q) ||
          (it.id && it.id.toLowerCase().includes(q)) ||
          it.parentName.toLowerCase().includes(q)
      );
    }

    return list;
  }, [
    activityFilterMode,
    historicalActivities,
    newActivities,
    allSubActivities,
    historicalCategoryFilter,
    historicalSearch,
  ]);

  // Historical Activities Summary KPIs
  const histTotalReq69 = useMemo(() => {
    return historicalActivities.reduce((sum, it) => sum + (it.budget69 || 0), 0);
  }, [historicalActivities]);

  const histTotalAct69 = useMemo(() => {
    return historicalActivities.reduce((sum, it) => sum + (it.actual69 || 0), 0);
  }, [historicalActivities]);

  const histTotalReq70 = useMemo(() => {
    return historicalActivities.reduce((sum, it) => sum + it.budget, 0);
  }, [historicalActivities]);

  const histDisburseRate69 = histTotalReq69 > 0 ? (histTotalAct69 / histTotalReq69) * 100 : 0;
  const histDiffVsAct69 = histTotalReq70 - histTotalAct69;
  const histDiffPctVsAct69 = histTotalAct69 > 0 ? (histDiffVsAct69 / histTotalAct69) * 100 : 0;

  // Export Dimension 2 table to Excel
  const handleExportHistoricalExcel = () => {
    const rows = displayedActivities.map((it, idx) => {
      const b69 = it.budget69 || 0;
      const a69 = it.actual69 || 0;
      const b70 = it.budget;
      const rate69 = b69 > 0 ? (a69 / b69) * 100 : 0;
      const diffVsAct = b70 - a69;
      const diffPctVsAct = a69 > 0 ? (diffVsAct / a69) * 100 : 0;

      return {
        'ลำดับ': idx + 1,
        'รหัสโครงการ': it.id || '-',
        'รายละเอียดกิจกรรม': it.activity,
        'อนุกรรมการ / หมวดหมู่': it.parentName,
        '1. คำขอ 2569 (บาท)': b69,
        '2. จ่ายจริง 2569 (บาท)': a69,
        'อัตราเบิกจ่ายจริง 69 (%)': Number(rate69.toFixed(1)),
        '3. คำขอ 2570 (บาท)': b70,
        'เทียบคำขอ 70 กับ จ่ายจริง 69 (บาท)': diffVsAct,
        'การเปลี่ยนแปลง (%)': Number(diffPctVsAct.toFixed(1)),
        'สถานะ': a69 > 0 ? 'กิจกรรมรายเก่า (มีจ่ายจริง 69)' : 'กิจกรรมใหม่ปี 70',
      };
    });

    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'วิเคราะห์กิจกรรมรายเก่า');
    XLSX.writeFile(wb, `วิเคราะห์กิจกรรมรายเก่า_จ่ายจริง69_เทียบคำขอ69_70_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  return (
    <div className="space-y-6">
      {/* ------------------------------------------------------------- */}
      {/* TOP NAVIGATION: 2 CORE DASHBOARD MODES                        */}
      {/* ------------------------------------------------------------- */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-3 sm:p-4 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-black uppercase tracking-wider bg-blue-100 text-blue-800">
                Core Dashboards
              </span>
              <h2 className="text-base sm:text-lg font-extrabold text-slate-900">
                แดชบอร์ดวิเคราะห์งบประมาณหลัก (2 มิติสำคัญ)
              </h2>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              เลือกมุมมองวิเคราะห์: 1.ประมาณการรายได้ vs คำขอ 70 หรือ 2.กิจกรรมรายเก่าที่มีการจ่ายจริง 69 เทียบคำขอ 69 และ 70
            </p>
          </div>

          <div className="flex items-center gap-2 p-1 bg-slate-100 rounded-xl border border-slate-200/80">
            <button
              onClick={() => setActiveMode('dimension1')}
              className={`px-3.5 py-2 rounded-lg text-xs sm:text-sm font-extrabold transition-all flex items-center gap-2 cursor-pointer ${
                activeMode === 'dimension1'
                  ? 'bg-blue-700 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              <Scale className="w-4 h-4" />
              <span>1. ประมาณการรายได้ vs คำขอ 70</span>
            </button>

            <button
              onClick={() => setActiveMode('dimension2')}
              className={`px-3.5 py-2 rounded-lg text-xs sm:text-sm font-extrabold transition-all flex items-center gap-2 cursor-pointer ${
                activeMode === 'dimension2'
                  ? 'bg-blue-700 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              <TrendingUp className="w-4 h-4" />
              <span>2. กิจกรรมรายเก่า (จ่ายจริง 69 เทียบ 69/70)</span>
            </button>
          </div>
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* VIEW 1: ประมาณการรายได้ 2570 vs คำของบประมาณ 2570 (ภาพใหญ่ & ย่อย) */}
      {/* ------------------------------------------------------------- */}
      {activeMode === 'dimension1' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* Section 1.1: ภาพใหญ่ (Macro Summary) */}
          <div className="bg-white rounded-2xl border border-slate-200/90 p-5 sm:p-6 shadow-xs space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-2">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
                  <Scale className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-black text-slate-900">
                    ภาพใหญ่: ประมาณการรายได้ 2570 กับ คำของบประมาณรายจ่าย 2570
                  </h3>
                  <p className="text-xs text-slate-500">
                    เปรียบเทียบกระแสเงินรับ-จ่ายทั้งสภาการสาธารณสุขชุมชน และวิเคราะห์ความคุ้มงบประมาณ
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
                {onOpenAudit && (
                  <button
                    onClick={() => onOpenAudit('revenue70')}
                    className="text-xs font-bold text-indigo-700 hover:text-white bg-indigo-50 hover:bg-indigo-700 border border-indigo-300 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
                    title="ตรวจสอบรายละเอียดย่อยและการกระทบยอดจากไฟล์รายได้จริง"
                  >
                    <FileSpreadsheet className="w-4 h-4 text-indigo-600" />
                    <span>ตรวจสอบแถวไฟล์รายได้ (Audit)</span>
                  </button>
                )}

                {onOpenRevenueModal && isAdmin && (
                  <button
                    onClick={onOpenRevenueModal}
                    className="text-xs font-bold text-emerald-800 hover:text-white bg-emerald-50 hover:bg-emerald-700 border border-emerald-300 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
                  >
                    <Receipt className="w-4 h-4" />
                    <span>จัดการข้อมูลรายได้ 70</span>
                  </button>
                )}
              </div>
            </div>

            {/* Macro KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Card 1: รายได้ 70 */}
              <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50/40">
                <span className="text-xs font-bold text-emerald-800 uppercase tracking-wide block mb-1">
                  ประมาณการรายได้ 2570 (รวม)
                </span>
                <div className="text-2xl sm:text-3xl font-black text-slate-900 font-mono tabular-nums">
                  ฿ {formatMoney(totalIncome)}
                </div>
                <span className="text-xs text-emerald-700 font-semibold mt-1 block">
                  {revenueItems.length} รายการแหล่งรายรับ
                </span>
              </div>

              {/* Card 2: คำขอจ่าย 70 */}
              <div className="p-4 rounded-xl border border-blue-200 bg-blue-50/40">
                <span className="text-xs font-bold text-blue-800 uppercase tracking-wide block mb-1">
                  คำของบประมาณรายจ่าย 2570 (รวม)
                </span>
                <div className="text-2xl sm:text-3xl font-black text-slate-900 font-mono tabular-nums">
                  ฿ {formatMoney(totalExpense)}
                </div>
                <span className="text-xs text-blue-700 font-semibold mt-1 block">
                  {allSubActivities.length} กิจกรรมโครงการ
                </span>
              </div>

              {/* Card 3: ผลต่างสุทธิ */}
              <div
                className={`p-4 rounded-xl border ${
                  isSurplus ? 'border-emerald-300 bg-emerald-100/50' : 'border-rose-300 bg-rose-100/50'
                }`}
              >
                <span
                  className={`text-xs font-bold uppercase tracking-wide block mb-1 ${
                    isSurplus ? 'text-emerald-900' : 'text-rose-900'
                  }`}
                >
                  สถานะดุลการเงินสุทธิ
                </span>
                <div
                  className={`text-2xl sm:text-3xl font-black font-mono tabular-nums ${
                    isSurplus ? 'text-emerald-900' : 'text-rose-900'
                  }`}
                >
                  {isSurplus ? '+' : ''}฿ {formatMoney(netBalance)}
                </div>
                <span
                  className={`text-xs font-bold mt-1 inline-flex items-center gap-1 ${
                    isSurplus ? 'text-emerald-800' : 'text-rose-800'
                  }`}
                >
                  {isSurplus ? (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> งบประมาณเพียงพอ (มีเงินเหลือ)
                    </>
                  ) : (
                    <>
                      <AlertCircle className="w-3.5 h-3.5 text-rose-600" /> คำขอเกินรายรับ {(Math.abs(netBalance) / 1000000).toFixed(2)} ล้านบาท
                    </>
                  )}
                </span>
              </div>

              {/* Card 4: สัดส่วนการใช้จ่าย */}
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50">
                <span className="text-xs font-bold text-slate-700 uppercase tracking-wide block mb-1">
                  สัดส่วนการใช้งบเทียบรายได้
                </span>
                <div className="text-2xl sm:text-3xl font-black text-slate-900 font-mono tabular-nums">
                  {coveragePercent.toFixed(1)}%
                </div>
                <div className="w-full bg-slate-200 rounded-full h-2 mt-2 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${
                      coveragePercent > 100
                        ? 'bg-rose-600'
                        : coveragePercent > 90
                        ? 'bg-amber-600'
                        : 'bg-emerald-600'
                    }`}
                    style={{ width: `${Math.min(coveragePercent, 100)}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Macro Visual Comparison Bar */}
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/80">
              <div className="flex items-center justify-between text-xs font-bold text-slate-700 mb-2">
                <span>สัดส่วนเปรียบเทียบภาพรวม: รายรับประมาณการ 70 vs คำของบรายจ่าย 70</span>
                <span>
                  {totalIncome >= totalExpense
                    ? `มีเงินสภาพคล่องคงเหลือ ${formatMoney(totalIncome - totalExpense)} บาท`
                    : `ขาดสภาพคล่อง ${formatMoney(totalExpense - totalIncome)} บาท`}
                </span>
              </div>
              <div className="h-6 w-full bg-slate-200 rounded-lg overflow-hidden flex shadow-inner">
                <div
                  className="bg-emerald-600 flex items-center justify-center text-[11px] font-bold text-white transition-all"
                  style={{
                    width: `${totalIncome + totalExpense > 0 ? (totalIncome / (totalIncome + totalExpense)) * 100 : 50}%`,
                  }}
                  title={`รายได้ 70: ฿${formatMoney(totalIncome)}`}
                >
                  รายได้ {formatMoney(totalIncome)}
                </div>
                <div
                  className="bg-blue-600 flex items-center justify-center text-[11px] font-bold text-white transition-all"
                  style={{
                    width: `${totalIncome + totalExpense > 0 ? (totalExpense / (totalIncome + totalExpense)) * 100 : 50}%`,
                  }}
                  title={`คำขอรายจ่าย 70: ฿${formatMoney(totalExpense)}`}
                >
                  คำขอจ่าย {formatMoney(totalExpense)}
                </div>
              </div>
            </div>
          </div>

          {/* Section 1.2: ลงไปรายละเอียดย่อยของอนุกรรมการนั้นๆ (Sub-committee Drill-Down) */}
          <div className="bg-white rounded-2xl border border-slate-200/90 p-5 sm:p-6 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 gap-2">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-800 flex items-center justify-center font-bold">
                  <Layers className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-black text-slate-900">
                    รายละเอียดย่อยของอนุกรรมการแต่ละชุด (Sub-committee Breakdown & Drill-Down)
                  </h3>
                  <p className="text-xs text-slate-500">
                    เปรียบเทียบประมาณการรายได้ที่อนุได้รับ vs คำขอจ่าย 70 ของอนุนั้น (คลิกเพื่อดูรายละเอียดโครงการย่อย)
                  </p>
                </div>
              </div>
              <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200 self-start sm:self-auto">
                ทั้งหมด {categories.length} อนุกรรมการ/หมวดงาน
              </span>
            </div>

            {/* Table of Sub-Committees */}
            <div className="overflow-x-auto rounded-xl border border-slate-200">
              <table className="w-full text-left text-xs sm:text-sm">
                <thead className="bg-slate-50 text-slate-700 font-extrabold border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4 w-12 text-center">#</th>
                    <th className="py-3 px-4">อนุกรรมการ / หมวดหมู่</th>
                    <th className="py-3 px-4 text-right">ประมาณการรายได้ (บาท)</th>
                    <th className="py-3 px-4 text-right">คำของบปี 70 (บาท)</th>
                    <th className="py-3 px-4 text-right">ดุลสุทธิ (รายรับ - รายจ่าย)</th>
                    <th className="py-3 px-4 text-center w-24">สัดส่วนใช้</th>
                    <th className="py-3 px-4 text-center w-36">การเจาะลึก</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {subCommitteeComparison.map((cat, idx) => {
                    const isCatSurplus = cat.catBalance >= 0;
                    return (
                      <tr
                        key={cat.id || cat.name}
                        onClick={() => setSelectedSubCommittee(cat)}
                        className="hover:bg-blue-50/40 transition-colors group cursor-pointer"
                      >
                        <td className="py-3 px-4 text-center text-slate-400 font-mono">
                          {idx + 1}
                        </td>
                        <td className="py-3 px-4">
                          <div className="font-extrabold text-slate-900 group-hover:text-blue-700 transition-colors flex items-center gap-2">
                            <span>{cat.name}</span>
                          </div>
                          <span className="text-xs text-slate-500">
                            {cat.items.length} กิจกรรมโครงการ · {cat.matchedRevenue.length} แหล่งรายรับ
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right font-mono font-bold text-emerald-800">
                          {cat.catRevenue > 0 ? (
                            `฿ ${formatMoney(cat.catRevenue)}`
                          ) : (
                            <span className="text-slate-400 text-xs font-normal">
                              (งบส่วนกลาง)
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-right font-mono font-bold text-blue-900">
                          ฿ {formatMoney(cat.catExpense)}
                        </td>
                        <td className="py-3 px-4 text-right font-mono font-extrabold">
                          {cat.catRevenue > 0 ? (
                            <span
                              className={`px-2 py-0.5 rounded ${
                                isCatSurplus
                                  ? 'bg-emerald-100 text-emerald-900'
                                  : 'bg-rose-100 text-rose-900'
                              }`}
                            >
                              {isCatSurplus ? '+' : ''}฿ {formatMoney(cat.catBalance)}
                            </span>
                          ) : (
                            <span className="text-slate-400 text-xs">
                              เบิกจากรายรับรวม
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-center font-mono font-bold text-xs">
                          {cat.catRevenue > 0 ? (
                            <span
                              className={`${
                                cat.catCoverage > 100 ? 'text-rose-700' : 'text-emerald-700'
                              }`}
                            >
                              {cat.catCoverage.toFixed(0)}%
                            </span>
                          ) : (
                            <span className="text-slate-400">-</span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedSubCommittee(cat);
                            }}
                            className="px-2.5 py-1 text-xs font-bold text-blue-700 hover:text-white bg-blue-50 hover:bg-blue-700 rounded-lg border border-blue-200 transition-colors flex items-center gap-1 mx-auto cursor-pointer"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>ดูรายละเอียดย่อย</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot className="bg-slate-100 font-extrabold text-slate-900 border-t-2 border-slate-300">
                  <tr>
                    <td colSpan={2} className="py-3 px-4">
                      รวมทุกอนุกรรมการ / หมวดหมู่
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-emerald-900 text-sm">
                      ฿ {formatMoney(totalIncome)}
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-blue-900 text-sm">
                      ฿ {formatMoney(totalExpense)}
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-sm">
                      <span
                        className={`px-2 py-0.5 rounded ${
                          isSurplus ? 'bg-emerald-200 text-emerald-950' : 'bg-rose-200 text-rose-950'
                        }`}
                      >
                        {isSurplus ? '+' : ''}฿ {formatMoney(netBalance)}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center font-mono text-xs">
                      {coveragePercent.toFixed(1)}%
                    </td>
                    <td></td>
                  </tr>
                </tfoot>
              </table>
            </div>

            {/* Unassigned / Central Revenue Notice */}
            {unassignedRevenue.length > 0 && (
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-600 flex items-start gap-2.5">
                <Info className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                <div>
                  <strong className="text-slate-800 font-bold block">
                    แหล่งรายได้ส่วนกลาง / กองทุนสภา ({unassignedRevenue.length} รายการ รวม ฿
                    {formatMoney(unassignedRevenue.reduce((s, r) => s + r.amount, 0))}):
                  </strong>
                  <span>
                    เป็นรายได้ที่ใช้เป็นงบกลางรองรับค่าใช้จ่ายของทุกอนุกรรมการ เช่น{' '}
                    {unassignedRevenue.map((r) => r.source).join(', ')}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* VIEW 2: กิจกรรมรายเก่า (จ่ายจริง 2569 เทียบคำขอ 69 และ 70)      */}
      {/* ------------------------------------------------------------- */}
      {activeMode === 'dimension2' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* Section 2.1: Historical Activities Overview KPIs */}
          <div className="bg-white rounded-2xl border border-slate-200/90 p-5 sm:p-6 shadow-xs space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-900 flex items-center justify-center font-bold">
                  <TrendingUp className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-black text-slate-900">
                    วิเคราะห์กิจกรรมรายเก่าที่มีการจ่ายจริงในปี 2569 (เทียบคำขอ 69 และ คำขอ 70)
                  </h3>
                  <p className="text-xs text-slate-500">
                    วิเคราะห์ประสิทธิภาพการเบิกจ่ายปี 69 และการของบประมาณต่อเนื่องในปี 2570
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {onOpenAudit && (
                  <button
                    onClick={() => onOpenAudit('actual69')}
                    className="text-xs font-bold text-indigo-700 hover:text-white bg-indigo-50 hover:bg-indigo-700 border border-indigo-300 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
                    title="ตรวจสอบรายละเอียดย่อยและการกระทบยอดจากไฟล์จ่ายจริง 69 จริง"
                  >
                    <FileSpreadsheet className="w-4 h-4 text-indigo-600" />
                    <span>ตรวจสอบแถวไฟล์จ่ายจริง 69 (Audit)</span>
                  </button>
                )}

                <button
                  onClick={handleExportHistoricalExcel}
                  className="text-xs font-bold text-slate-700 hover:text-blue-800 bg-slate-100 hover:bg-blue-50 border border-slate-300 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
                  title="ส่งออกรายงานเปรียบเทียบกิจกรรมรายเก่าเป็น Excel"
                >
                  <Download className="w-4 h-4" />
                  <span>ส่งออก Excel รายงานนี้</span>
                </button>
              </div>
            </div>

            {/* Historical KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
              {/* Card 1: Count */}
              <div className="p-3.5 rounded-xl border border-amber-200 bg-amber-50/50">
                <span className="text-[11px] font-bold text-amber-900 uppercase tracking-wide block mb-1">
                  กิจกรรมรายเก่า (มีจ่ายจริง 69)
                </span>
                <div className="text-2xl font-black text-slate-900 font-mono tabular-nums">
                  {historicalActivities.length}
                </div>
                <span className="text-[11px] text-amber-800 font-semibold mt-0.5 block">
                  จากทั้งหมด {allSubActivities.length} กิจกรรม
                </span>
              </div>

              {/* Card 2: คำขอ 69 */}
              <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50">
                <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wide block mb-1">
                  1. คำของบประมาณ 2569
                </span>
                <div className="text-2xl font-black text-slate-900 font-mono tabular-nums">
                  ฿ {formatMoney(histTotalReq69)}
                </div>
                <span className="text-[11px] text-slate-500 font-medium mt-0.5 block">
                  กรอบคำขอเดิมปี 69
                </span>
              </div>

              {/* Card 3: จ่ายจริง 69 */}
              <div className="p-3.5 rounded-xl border border-emerald-200 bg-emerald-50/50">
                <span className="text-[11px] font-bold text-emerald-900 uppercase tracking-wide block mb-1">
                  2. ผลจ่ายจริง 2569
                </span>
                <div className="text-2xl font-black text-slate-900 font-mono tabular-nums">
                  ฿ {formatMoney(histTotalAct69)}
                </div>
                <span className="text-[11px] text-emerald-800 font-bold mt-0.5 block">
                  เบิกจ่ายจริง {histDisburseRate69.toFixed(1)}% ของคำขอ 69
                </span>
              </div>

              {/* Card 4: คำขอ 70 */}
              <div className="p-3.5 rounded-xl border border-blue-200 bg-blue-50/50">
                <span className="text-[11px] font-bold text-blue-900 uppercase tracking-wide block mb-1">
                  3. คำของบประมาณ 2570
                </span>
                <div className="text-2xl font-black text-slate-900 font-mono tabular-nums">
                  ฿ {formatMoney(histTotalReq70)}
                </div>
                <span className="text-[11px] text-blue-800 font-semibold mt-0.5 block">
                  คำขอสำหรับกิจกรรมเดิม
                </span>
              </div>

              {/* Card 5: ส่วนต่างเทียบจ่ายจริง 69 */}
              <div
                className={`p-3.5 rounded-xl border ${
                  histDiffVsAct69 >= 0
                    ? 'border-blue-300 bg-blue-100/50'
                    : 'border-emerald-300 bg-emerald-100/50'
                }`}
              >
                <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wide block mb-1">
                  เทียบคำขอ 70 กับ จ่ายจริง 69
                </span>
                <div
                  className={`text-2xl font-black font-mono tabular-nums ${
                    histDiffVsAct69 >= 0 ? 'text-blue-950' : 'text-emerald-950'
                  }`}
                >
                  {histDiffVsAct69 >= 0 ? '+' : ''}฿ {formatMoney(histDiffVsAct69)}
                </div>
                <span className="text-[11px] font-extrabold text-slate-800 mt-0.5 block">
                  {histDiffVsAct69 >= 0 ? 'ขอเพิ่มขึ้น' : 'ขอลดลง'} {Math.abs(histDiffPctVsAct69).toFixed(1)}%
                </span>
              </div>
            </div>
          </div>

          {/* Section 2.2: ตารางเปรียบเทียบระดับโครงการ/กิจกรรม */}
          <div className="bg-white rounded-2xl border border-slate-200/90 p-5 sm:p-6 shadow-xs space-y-4">
            {/* Filter and Search Bar */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
              {/* Filter Tabs */}
              <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl border border-slate-200/80">
                <button
                  onClick={() => setActivityFilterMode('historical')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                    activityFilterMode === 'historical'
                      ? 'bg-amber-600 text-white shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Clock className="w-3.5 h-3.5" />
                  <span>กิจกรรมรายเก่า (มีจ่ายจริง 69) ({historicalActivities.length})</span>
                </button>

                <button
                  onClick={() => setActivityFilterMode('new')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                    activityFilterMode === 'new'
                      ? 'bg-blue-600 text-white shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>กิจกรรมใหม่ปี 70 ({newActivities.length})</span>
                </button>

                <button
                  onClick={() => setActivityFilterMode('all')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                    activityFilterMode === 'all'
                      ? 'bg-slate-700 text-white shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <span>ทั้งหมด ({allSubActivities.length})</span>
                </button>
              </div>

              {/* Search and Committee Dropdown */}
              <div className="flex flex-wrap items-center gap-2">
                <div className="relative">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="ค้นหากิจกรรมหรือรหัสโครงการ..."
                    value={historicalSearch}
                    onChange={(e) => setHistoricalSearch(e.target.value)}
                    className="pl-9 pr-3 py-1.5 text-xs border border-slate-300 rounded-lg bg-white w-48 sm:w-60 focus:ring-2 focus:ring-blue-500"
                  />
                  {historicalSearch && (
                    <button
                      onClick={() => setHistoricalSearch('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                <select
                  value={historicalCategoryFilter}
                  onChange={(e) => setHistoricalCategoryFilter(e.target.value)}
                  className="px-3 py-1.5 text-xs border border-slate-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500"
                >
                  <option value="ALL">ทุกอนุสภา / หมวดหมู่</option>
                  {categories.map((c) => (
                    <option key={c.name} value={c.name}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* The Detailed 3-Pillar Comparison Table */}
            <div className="overflow-x-auto rounded-xl border border-slate-200">
              <table className="w-full text-left text-xs sm:text-sm">
                <thead className="bg-slate-50 text-slate-700 font-extrabold border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-3 w-16 text-center">รหัส</th>
                    <th className="py-3 px-3 min-w-[240px]">รายละเอียดกิจกรรม</th>
                    <th className="py-3 px-3 w-44">อนุกรรมการ</th>
                    <th className="py-3 px-3 text-right w-28 bg-slate-100/60">1. คำขอ 69</th>
                    <th className="py-3 px-3 text-right w-28 bg-amber-50/70">2. จ่ายจริง 69</th>
                    <th className="py-3 px-3 text-center w-24 bg-amber-50/70">% เบิกจ่าย</th>
                    <th className="py-3 px-3 text-right w-28 bg-blue-50/70">3. คำขอ 70</th>
                    <th className="py-3 px-3 text-right w-36 bg-blue-50/70">เทียบจ่ายจริง 69</th>
                    <th className="py-3 px-3 text-center w-28">สถานะ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {displayedActivities.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="py-12 text-center text-slate-400">
                        <FileSpreadsheet className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                        ไม่พบกิจกรรมที่ตรงกับเงื่อนไขการค้นหา
                      </td>
                    </tr>
                  ) : (
                    displayedActivities.map((it) => {
                      const b69 = it.budget69 || 0;
                      const a69 = it.actual69 || 0;
                      const b70 = it.budget;
                      const rate69 = b69 > 0 ? (a69 / b69) * 100 : 0;
                      const diffVsAct = a69 > 0 ? b70 - a69 : 0;
                      const diffPctVsAct = a69 > 0 ? (diffVsAct / a69) * 100 : 0;
                      const isOld = a69 > 0;

                      return (
                        <tr key={it.id || it.activity} className="hover:bg-slate-50 transition-colors">
                          <td className="py-2.5 px-3 text-center font-mono font-bold text-slate-600 text-xs">
                            {it.id || '-'}
                          </td>
                          <td className="py-2.5 px-3">
                            <div className="font-bold text-slate-900 leading-snug">
                              {it.activity}
                            </div>
                          </td>
                          <td className="py-2.5 px-3 text-xs text-slate-600 truncate max-w-[180px]">
                            {it.parentName}
                          </td>

                          {/* 1. คำขอ 69 */}
                          <td className="py-2.5 px-3 text-right font-mono font-semibold text-slate-700 bg-slate-50/40">
                            {b69 > 0 ? formatMoney(b69) : '-'}
                          </td>

                          {/* 2. จ่ายจริง 69 */}
                          <td className="py-2.5 px-3 text-right font-mono font-bold text-amber-900 bg-amber-50/30">
                            {a69 > 0 ? formatMoney(a69) : '-'}
                          </td>

                          {/* % เบิกจ่าย 69 */}
                          <td className="py-2.5 px-3 text-center font-mono text-xs font-bold bg-amber-50/30">
                            {a69 > 0 && b69 > 0 ? (
                              <span
                                className={`px-1.5 py-0.5 rounded text-[11px] ${
                                  rate69 >= 80
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : rate69 >= 50
                                    ? 'bg-amber-100 text-amber-800'
                                    : 'bg-rose-100 text-rose-800'
                                }`}
                              >
                                {rate69.toFixed(0)}%
                              </span>
                            ) : (
                              <span className="text-slate-400">-</span>
                            )}
                          </td>

                          {/* 3. คำขอ 70 */}
                          <td className="py-2.5 px-3 text-right font-mono font-black text-blue-900 bg-blue-50/30">
                            {formatMoney(b70)}
                          </td>

                          {/* เทียบจ่ายจริง 69 */}
                          <td className="py-2.5 px-3 text-right font-mono text-xs font-extrabold bg-blue-50/30">
                            {isOld ? (
                              <span
                                className={
                                  diffVsAct > 0
                                    ? 'text-blue-700'
                                    : diffVsAct < 0
                                    ? 'text-emerald-700'
                                    : 'text-slate-600'
                                }
                              >
                                {diffVsAct > 0 ? '+' : ''}
                                {formatMoney(diffVsAct)}{' '}
                                <span className="text-[10px] font-normal">
                                  ({diffPctVsAct > 0 ? '+' : ''}
                                  {diffPctVsAct.toFixed(0)}%)
                                </span>
                              </span>
                            ) : (
                              <span className="text-slate-400 text-[11px] font-normal">โครงการใหม่</span>
                            )}
                          </td>

                          {/* Status Badge */}
                          <td className="py-2.5 px-3 text-center text-xs">
                            {isOld ? (
                              rate69 >= 80 ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800">
                                  <CheckCircle2 className="w-3 h-3 text-emerald-600" /> เบิกจ่ายดี
                                </span>
                              ) : rate69 >= 50 ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800">
                                  เบิกจ่ายปานกลาง
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-rose-100 text-rose-800">
                                  เบิกจ่ายต่ำ
                                </span>
                              )
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-blue-100 text-blue-800">
                                <Sparkles className="w-3 h-3 text-blue-600" /> ใหม่ปี 70
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* SUB-COMMITTEE DRILL-DOWN MODAL                                */}
      {/* ------------------------------------------------------------- */}
      {selectedSubCommittee && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50 flex-shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
                  <Layers className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-900 text-base sm:text-lg">
                    {selectedSubCommittee.name}
                  </h3>
                  <p className="text-xs text-slate-500">
                    เจาะลึกรายละเอียดย่อย: ประมาณการรายรับ 2570 vs คำของบประมาณรายจ่าย 2570
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedSubCommittee(null)}
                className="text-slate-400 hover:text-slate-700 p-2 rounded-xl hover:bg-slate-200/60 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-6 flex-1 text-xs sm:text-sm">
              {/* Summary KPIs for this sub-committee */}
              {(() => {
                const matchedRev = revenueItems.filter((rev) => {
                  if (!rev.anuName) return false;
                  const normAnu = rev.anuName.trim().toLowerCase();
                  const normCat = selectedSubCommittee.name.trim().toLowerCase();
                  return normAnu.includes(normCat) || normCat.includes(normAnu);
                });
                const catRevTotal = matchedRev.reduce((s, r) => s + r.amount, 0);
                const catExpTotal = selectedSubCommittee.totalBudget;
                const catBal = catRevTotal - catExpTotal;

                return (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50/50">
                      <span className="text-xs font-bold text-emerald-900 block mb-1">
                        ประมาณการรายได้ที่อนุได้รับ
                      </span>
                      <div className="text-2xl font-black text-slate-900 font-mono tabular-nums">
                        {catRevTotal > 0 ? `฿ ${formatMoney(catRevTotal)}` : 'ใช้งบส่วนกลาง'}
                      </div>
                      <span className="text-xs text-emerald-700 mt-1 block">
                        {matchedRev.length} รายการที่มารายได้
                      </span>
                    </div>

                    <div className="p-4 rounded-xl border border-blue-200 bg-blue-50/50">
                      <span className="text-xs font-bold text-blue-900 block mb-1">
                        คำของบประมาณรายจ่าย 2570
                      </span>
                      <div className="text-2xl font-black text-slate-900 font-mono tabular-nums">
                        ฿ {formatMoney(catExpTotal)}
                      </div>
                      <span className="text-xs text-blue-700 mt-1 block">
                        {selectedSubCommittee.items.length} กิจกรรมโครงการ
                      </span>
                    </div>

                    <div
                      className={`p-4 rounded-xl border ${
                        catBal >= 0
                          ? 'border-emerald-300 bg-emerald-100/50'
                          : 'border-rose-300 bg-rose-100/50'
                      }`}
                    >
                      <span className="text-xs font-bold text-slate-800 block mb-1">
                        ดุลสุทธิเฉพาะอนุกรรมการนี้
                      </span>
                      <div
                        className={`text-2xl font-black font-mono tabular-nums ${
                          catBal >= 0 ? 'text-emerald-900' : 'text-rose-900'
                        }`}
                      >
                        {catRevTotal > 0 ? (
                          `${catBal >= 0 ? '+' : ''}฿ ${formatMoney(catBal)}`
                        ) : (
                          <span className="text-xs text-slate-600 font-normal">
                            เบิกจากรายรับรวมของสภา
                          </span>
                        )}
                      </div>
                      <span className="text-xs font-bold mt-1 block">
                        {catRevTotal > 0 ? (
                          catBal >= 0 ? (
                            'รายได้เพียงพอ มีเงินคงเหลือ'
                          ) : (
                            'ขอเกินรายได้ที่ได้รับ'
                          )
                        ) : (
                          'ไม่มีรายได้จัดเก็บเฉพาะอนุ'
                        )}
                      </span>
                    </div>
                  </div>
                );
              })()}

              {/* Side-by-side lists: Activities (Left) vs Revenue sources (Right) */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                {/* Left: คำของบประมาณ 2570 ทุกกิจกรรม */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                    <h4 className="font-extrabold text-slate-900 text-sm flex items-center gap-1.5">
                      <FileSpreadsheet className="w-4 h-4 text-blue-700" />
                      รายการคำของบประมาณรายจ่าย 2570
                    </h4>
                    <span className="text-xs font-bold text-blue-700 font-mono">
                      {selectedSubCommittee.items.length} รายการ
                    </span>
                  </div>

                  <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1">
                    {selectedSubCommittee.items.map((it, idx) => (
                      <div
                        key={it.id || idx}
                        className="p-3 rounded-xl border border-slate-200 bg-slate-50/70 hover:bg-slate-100/70 transition-colors"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <span className="text-[11px] font-mono font-bold text-slate-500 block">
                              รหัส: {it.id || '-'}
                            </span>
                            <span className="font-bold text-slate-900 text-xs leading-snug block mt-0.5">
                              {it.activity}
                            </span>
                          </div>
                          <span className="font-mono font-extrabold text-blue-900 text-xs flex-shrink-0">
                            ฿ {formatMoney(it.budget)}
                          </span>
                        </div>
                        {it.actual69 !== undefined && (
                          <div className="mt-2 pt-2 border-t border-slate-200/80 flex items-center justify-between text-[11px] text-slate-500">
                            <span>จ่ายจริง 69: ฿{formatMoney(it.actual69)}</span>
                            <span>คำขอ 69: ฿{formatMoney(it.budget69 || 0)}</span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Right: แหล่งรายได้ 2570 ของอนุนี้ */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                    <h4 className="font-extrabold text-slate-900 text-sm flex items-center gap-1.5">
                      <Receipt className="w-4 h-4 text-emerald-700" />
                      แหล่งประมาณการรายรับ 2570 ของอนุนี้
                    </h4>
                    <span className="text-xs font-bold text-emerald-700 font-mono">
                      {
                        revenueItems.filter((rev) => {
                          if (!rev.anuName) return false;
                          const normAnu = rev.anuName.trim().toLowerCase();
                          const normCat = selectedSubCommittee.name.trim().toLowerCase();
                          return normAnu.includes(normCat) || normCat.includes(normAnu);
                        }).length
                      }{' '}
                      รายการ
                    </span>
                  </div>

                  <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1">
                    {(() => {
                      const matchedRev = revenueItems.filter((rev) => {
                        if (!rev.anuName) return false;
                        const normAnu = rev.anuName.trim().toLowerCase();
                        const normCat = selectedSubCommittee.name.trim().toLowerCase();
                        return normAnu.includes(normCat) || normCat.includes(normAnu);
                      });

                      if (matchedRev.length === 0) {
                        return (
                          <div className="p-8 text-center text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                            <Receipt className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                            <p className="font-semibold text-slate-600">ไม่มีรายได้จัดเก็บเฉพาะอนุสภานี้</p>
                            <p className="text-xs text-slate-400 mt-1">
                              กิจกรรมของอนุนี้จะได้รับการสนับสนุนจากรายได้ส่วนกลางของสภา
                            </p>
                          </div>
                        );
                      }

                      return matchedRev.map((rev, idx) => (
                        <div
                          key={rev.id || idx}
                          className="p-3 rounded-xl border border-emerald-200 bg-emerald-50/40 hover:bg-emerald-50/80 transition-colors"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <span className="font-bold text-slate-900 text-xs leading-snug">
                              {rev.source}
                            </span>
                            <span className="font-mono font-extrabold text-emerald-900 text-xs flex-shrink-0">
                              ฿ {formatMoney(rev.amount)}
                            </span>
                          </div>
                          {rev.note && (
                            <p className="text-[11px] text-slate-500 mt-1 italic">
                              * {rev.note}
                            </p>
                          )}
                        </div>
                      ));
                    })()}
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100 bg-slate-50 flex-shrink-0">
              <span className="text-xs text-slate-500 font-medium">
                ข้อมูลได้รับการเชื่อมโยงจากไฟล์คำขอ 69/70, จ่ายจริง 69 และรายรับ 70
              </span>
              <button
                onClick={() => setSelectedSubCommittee(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
              >
                ปิดหน้าต่าง
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
