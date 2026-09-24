import React, { useState } from 'react';
import { CategorySummary, BudgetItem } from '../types/budget';
import {
  PieChart,
  BarChart2,
  TrendingUp,
  Info,
  Maximize2,
  X,
  ArrowUpRight,
  ArrowDownRight,
  Layers,
  Table,
  SlidersHorizontal,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  ChevronsUpDown,
  FolderTree,
  CornerDownRight,
  Filter,
  Search,
  RotateCcw,
} from 'lucide-react';

interface BudgetChartsProps {
  categories: CategorySummary[];
  totalExpense: number;
  onOpenDataHub?: () => void;
}

export const BudgetCharts: React.FC<BudgetChartsProps> = ({
  categories,
  totalExpense,
  onOpenDataHub,
}) => {
  const [hoveredSlice, setHoveredSlice] = useState<number | null>(null);
  const [hoveredBarIndex, setHoveredBarIndex] = useState<number | null>(null);

  // State for expanding/zooming in modals
  const [expandedModal, setExpandedModal] = useState<'proportion' | 'comparison' | null>(null);
  const [modalViewTab, setModalViewTab] = useState<'table' | 'bars'>('table');

  // State for drill-down into specific activities per category
  const [expandedCategoryIds, setExpandedCategoryIds] = useState<Record<string, boolean>>({});

  const toggleCategory = (key: string) => {
    setExpandedCategoryIds((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const expandAllCategories = () => {
    const next: Record<string, boolean> = {};
    categories.forEach((c) => {
      next[c.id || c.name] = true;
    });
    setExpandedCategoryIds(next);
  };

  const collapseAllCategories = () => {
    setExpandedCategoryIds({});
  };

  // Filter state for 3-Pillar Comparison (กรองเลือกอนุสภา/หมวดหมู่)
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('ALL');
  const [comparisonSearchTerm, setComparisonSearchTerm] = useState<string>('');

  const handleSelectCategory = (catKey: string) => {
    setSelectedCategoryFilter(catKey);
    if (catKey !== 'ALL') {
      setExpandedCategoryIds((prev) => ({
        ...prev,
        [catKey]: true,
      }));
    }
  };

  const handleResetFilter = () => {
    setSelectedCategoryFilter('ALL');
    setComparisonSearchTerm('');
  };

  const isAllExpanded =
    categories.length > 0 && categories.every((c) => expandedCategoryIds[c.id || c.name]);

  const formatMoney = (num: number) =>
    new Intl.NumberFormat('th-TH', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(num || 0);

  const formatMillions = (num: number) => {
    return `${(num / 1000000).toFixed(2)} ล้านบาท`;
  };

  // If no categories or 0 total
  if (categories.length === 0 || totalExpense === 0) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center flex flex-col items-center justify-center min-h-[340px]">
          <PieChart className="w-14 h-14 text-slate-300 mb-3" />
          <p className="text-slate-700 font-semibold text-base">ยังไม่มีข้อมูลสำหรับแสดงแผนภูมิสัดส่วน</p>
          <p className="text-sm text-slate-400 mt-1">กรุณานำเข้าไฟล์ Excel หรือกด &quot;ข้อมูลตัวอย่าง&quot;</p>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center flex flex-col items-center justify-center min-h-[340px]">
          <BarChart2 className="w-14 h-14 text-slate-300 mb-3" />
          <p className="text-slate-700 font-semibold text-base">ยังไม่มีข้อมูลสำหรับเปรียบเทียบงบประมาณ</p>
          <p className="text-sm text-slate-400 mt-1">กรุณานำเข้าไฟล์ Excel หรือกด &quot;ข้อมูลตัวอย่าง&quot;</p>
        </div>
      </div>
    );
  }

  // --- Doughnut Chart Calculations (SVG) ---
  const size = 260;
  const strokeWidth = 38;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  let accumulatedPercent = 0;
  const slices = categories.map((cat, idx) => {
    const percent = cat.totalBudget / totalExpense;
    const strokeDasharray = `${percent * circumference} ${circumference}`;
    const strokeDashoffset = -accumulatedPercent * circumference;
    accumulatedPercent += percent;

    return {
      ...cat,
      index: idx,
      percent,
      strokeDasharray,
      strokeDashoffset,
    };
  });

  const activeCategory = hoveredSlice !== null ? categories[hoveredSlice] : null;

  // --- 3-Pillar Calculations with Filter by Sub-Council / Category ---
  const filteredComparisonCategories = categories.filter((cat) => {
    const catKey = cat.id || cat.name;
    const matchesCategory =
      selectedCategoryFilter === 'ALL' || catKey === selectedCategoryFilter;
    if (!matchesCategory) return false;

    if (!comparisonSearchTerm.trim()) return true;
    const query = comparisonSearchTerm.trim().toLowerCase();
    const matchName = cat.name.toLowerCase().includes(query);
    const matchItems = cat.items?.some(
      (item) =>
        item.activity.toLowerCase().includes(query) ||
        (item.id && item.id.toLowerCase().includes(query))
    );
    return matchName || matchItems;
  });

  // Global totals (Grand total)
  const totalReq69 = categories.reduce((sum, c) => sum + (c.budget69 || 0), 0);
  const totalActual69 = categories.reduce((sum, c) => sum + (c.actual69 || 0), 0);
  const totalReq70 = totalExpense;
  const totalDisburseRate69 = totalReq69 > 0 ? (totalActual69 / totalReq69) * 100 : 0;
  const totalDiffVsAct69 = totalReq70 - totalActual69;
  const totalDiffPctVsAct69 = totalActual69 > 0 ? (totalDiffVsAct69 / totalActual69) * 100 : 0;
  const totalDiffVsReq69 = totalReq70 - totalReq69;
  const totalDiffPctVsReq69 = totalReq69 > 0 ? (totalDiffVsReq69 / totalReq69) * 100 : 0;

  // Filtered totals (responsive to filter)
  const filteredReq69 = filteredComparisonCategories.reduce((sum, c) => sum + (c.budget69 || 0), 0);
  const filteredActual69 = filteredComparisonCategories.reduce((sum, c) => sum + (c.actual69 || 0), 0);
  const filteredReq70 = filteredComparisonCategories.reduce((sum, c) => sum + c.totalBudget, 0);

  const filteredDisburseRate69 = filteredReq69 > 0 ? (filteredActual69 / filteredReq69) * 100 : 0;
  const filteredDiffVsAct69 = filteredReq70 - filteredActual69;
  const filteredDiffPctVsAct69 = filteredActual69 > 0 ? (filteredDiffVsAct69 / filteredActual69) * 100 : 0;
  const filteredDiffVsReq69 = filteredReq70 - filteredReq69;
  const filteredDiffPctVsReq69 = filteredReq69 > 0 ? (filteredDiffVsReq69 / filteredReq69) * 100 : 0;

  const maxBarVal = Math.max(
    ...categories.map((c) => Math.max(c.totalBudget, c.budget69 || 0, c.actual69 || 0)),
    1000000
  );

  const isFiltered = selectedCategoryFilter !== 'ALL' || !!comparisonSearchTerm.trim();
  const selectedCategoryObj = categories.find((c) => (c.id || c.name) === selectedCategoryFilter);

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <h2 className="text-xl font-extrabold text-slate-900 flex items-center gap-2.5">
          <PieChart className="w-6 h-6 text-blue-700 flex-shrink-0" />
          2. สัดส่วนและการเปรียบเทียบงบประมาณ (3 ด้าน: คำขอ 69 · จ่ายจริง 69 · คำขอ 70)
        </h2>
        <span className="text-xs sm:text-sm text-slate-700 font-semibold bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-300">
          สามารถกดปุ่ม <strong className="text-blue-800 font-bold">&quot;ขยายดูเต็มจอ&quot;</strong> เพื่อดูรายละเอียดขนาดใหญ่ได้
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
        {/* Chart 1: Doughnut Chart */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-xs flex flex-col justify-between">
          <div>
            {/* Header */}
            <div className="flex items-center justify-between pb-3.5 border-b border-slate-100 mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-800 flex items-center justify-center flex-shrink-0">
                  <PieChart className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-900 text-base sm:text-lg">สัดส่วนการของบประมาณ (ปี 70)</h3>
                  <p className="text-xs sm:text-sm text-slate-600 font-medium">แยกตามอนุสภาและกลุ่มงาน ({categories.length} หน่วยงาน)</p>
                </div>
              </div>
              <button
                onClick={() => setExpandedModal('proportion')}
                className="text-xs sm:text-sm font-bold text-blue-800 hover:text-white bg-blue-50 hover:bg-blue-700 border border-blue-300 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 shadow-2xs cursor-pointer"
                title="กดเพื่อขยายดูสัดส่วนแบบจอใหญ่"
              >
                <Maximize2 className="w-4 h-4" />
                <span>ขยายดูเต็มจอ</span>
              </button>
            </div>

            {/* Doughnut Graphic and Legend */}
            <div className="flex flex-col sm:flex-row items-center gap-6">
              {/* SVG Doughnut */}
              <div className="relative flex-shrink-0 flex items-center justify-center my-2">
                <svg
                  width={size}
                  height={size}
                  viewBox={`0 0 ${size} ${size}`}
                  className="transform -rotate-90"
                >
                  {slices.map((slice) => {
                    const isHovered = hoveredSlice === slice.index;
                    return (
                      <circle
                        key={slice.id + slice.name}
                        cx={size / 2}
                        cy={size / 2}
                        r={radius}
                        fill="transparent"
                        stroke={slice.color}
                        strokeWidth={isHovered ? strokeWidth + 6 : strokeWidth}
                        strokeDasharray={slice.strokeDasharray}
                        strokeDashoffset={slice.strokeDashoffset}
                        className="transition-all duration-200 cursor-pointer"
                        onMouseEnter={() => setHoveredSlice(slice.index)}
                        onMouseLeave={() => setHoveredSlice(null)}
                      />
                    );
                  })}
                </svg>

                {/* Center text of Doughnut */}
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none px-4">
                  {activeCategory ? (
                    <>
                      <span className="text-xs font-semibold text-slate-500 line-clamp-1 max-w-[130px]">
                        {activeCategory.name}
                      </span>
                      <span className="text-lg font-black text-slate-900 font-mono tabular-nums leading-tight mt-0.5">
                        ฿{(activeCategory.totalBudget / 1000000).toFixed(2)}M
                      </span>
                      <span
                        className="text-xs font-bold px-2 py-0.5 rounded-full text-white mt-1"
                        style={{ backgroundColor: activeCategory.color }}
                      >
                        {activeCategory.percentage.toFixed(1)}%
                      </span>
                    </>
                  ) : (
                    <>
                      <span className="text-xs font-bold text-slate-500 tracking-wider uppercase">
                        รวมงบปี 70
                      </span>
                      <span className="text-xl font-black text-slate-900 font-mono tabular-nums mt-0.5">
                        ฿{(totalExpense / 1000000).toFixed(2)}M
                      </span>
                      <span className="text-xs text-blue-700 font-semibold mt-0.5">
                        {categories.length} หน่วยงาน
                      </span>
                    </>
                  )}
                </div>
              </div>

              {/* Legend List */}
              <div className="w-full space-y-2 max-h-[290px] overflow-y-auto pr-1">
                {categories.map((cat, idx) => (
                  <div
                    key={cat.id + cat.name}
                    onMouseEnter={() => setHoveredSlice(idx)}
                    onMouseLeave={() => setHoveredSlice(null)}
                    className={`flex items-center justify-between p-2 rounded-xl transition-all border cursor-pointer ${
                      hoveredSlice === idx
                        ? 'bg-slate-100 border-slate-300 shadow-2xs scale-[1.01]'
                        : 'border-transparent hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0 pr-2">
                      <span
                        className="w-4 h-4 rounded-md flex-shrink-0 shadow-2xs"
                        style={{ backgroundColor: cat.color }}
                      />
                      <span className="text-xs sm:text-sm font-bold text-slate-900 truncate" title={cat.name}>
                        {cat.name}
                      </span>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <div className="text-xs sm:text-sm font-black text-slate-900 font-mono tabular-nums">
                        ฿{(cat.totalBudget / 1000000).toFixed(2)}M
                      </div>
                      <div className="text-xs font-bold text-blue-800">
                        {cat.percentage.toFixed(1)}%
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 text-center text-xs text-slate-600 font-medium">
            * นำเมาส์ชี้ที่แถบสีหรือชื่อหน่วยงาน เพื่อดูรายละเอียดสัดส่วนงบประมาณ
          </div>
        </div>

        {/* Chart 2: 3-Pillar Comparison Bar Chart (คำขอ 69 vs จ่ายจริง 69 vs คำขอ 70) */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-xs flex flex-col justify-between">
          <div>
            {/* Header */}
            <div className="flex items-center justify-between pb-3.5 border-b border-slate-100 mb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center flex-shrink-0">
                  <BarChart2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-900 text-base sm:text-lg">
                    เปรียบเทียบงบประมาณ 3 ด้าน (2569 vs 2570)
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-600 font-medium">
                    1. คำขอ 2569 · 2. จ่ายจริง 2569 · 3. คำขอ 2570
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    setModalViewTab('table');
                    setExpandedModal('comparison');
                  }}
                  className="text-xs sm:text-sm font-bold text-emerald-800 hover:text-white bg-emerald-50 hover:bg-emerald-700 border border-emerald-300 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 shadow-2xs cursor-pointer"
                  title="กดเพื่อขยายดูการเปรียบเทียบแบบจอใหญ่"
                >
                  <Maximize2 className="w-4 h-4" />
                  <span>ขยายดูเต็มจอ</span>
                </button>
              </div>
            </div>

            {/* Filter by Sub-Council / Category (ฟิลเตอร์เลือกอนุสภา/กลุ่มงาน) */}
            <div className="bg-slate-50/90 p-3 rounded-xl border border-slate-200 mb-3 space-y-2.5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                {/* Dropdown Selector */}
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-800 flex items-center justify-center flex-shrink-0">
                    <Filter className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <label className="text-[11px] font-bold text-slate-700 block mb-0.5">
                      กรองเลือกอนุสภา / หมวดหมู่:
                    </label>
                    <select
                      value={selectedCategoryFilter}
                      onChange={(e) => handleSelectCategory(e.target.value)}
                      className="w-full text-xs sm:text-sm font-semibold bg-white border border-slate-300 hover:border-blue-500 rounded-lg px-2.5 py-1.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600 cursor-pointer shadow-2xs truncate transition-colors"
                    >
                      <option value="ALL">
                        🏢 ทุกอนุสภา ({categories.length} หน่วยงาน · ยอดรวมคำขอ ฿{(totalExpense / 1000000).toFixed(2)}M)
                      </option>
                      {categories.map((c) => (
                        <option key={'sel-opt-' + (c.id || c.name)} value={c.id || c.name}>
                          {c.name} (ขอ 70: ฿{(c.totalBudget / 1000000).toFixed(2)}M · {c.percentage.toFixed(1)}%)
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Search Box */}
                <div className="relative flex-shrink-0 w-full sm:w-48 self-end sm:self-auto">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="ค้นหากิจกรรม / รหัส..."
                    value={comparisonSearchTerm}
                    onChange={(e) => setComparisonSearchTerm(e.target.value)}
                    className="w-full pl-8 pr-7 py-1.5 text-xs border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-600 text-slate-800 placeholder-slate-400 shadow-2xs"
                  />
                  {comparisonSearchTerm && (
                    <button
                      onClick={() => setComparisonSearchTerm('')}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 p-0.5 cursor-pointer"
                      title="ล้างคำค้นหา"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              {/* Quick Filter Pills (Scrollable) */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-thin text-xs">
                <button
                  onClick={() => handleSelectCategory('ALL')}
                  className={`px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap transition-all cursor-pointer flex-shrink-0 ${
                    selectedCategoryFilter === 'ALL'
                      ? 'bg-blue-700 text-white shadow-2xs ring-1 ring-blue-800'
                      : 'bg-white hover:bg-slate-200 text-slate-700 border border-slate-300'
                  }`}
                >
                  ทั้งหมด ({categories.length})
                </button>
                {categories.map((c) => {
                  const catKey = c.id || c.name;
                  const isSelected = selectedCategoryFilter === catKey;
                  return (
                    <button
                      key={'pill-' + catKey}
                      onClick={() => handleSelectCategory(catKey)}
                      className={`px-2.5 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition-all cursor-pointer flex-shrink-0 flex items-center gap-1.5 ${
                        isSelected
                          ? 'bg-blue-700 text-white font-bold shadow-2xs ring-1 ring-blue-800'
                          : 'bg-white hover:bg-slate-100 text-slate-800 border border-slate-300'
                      }`}
                    >
                      <span
                        className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                        style={{ backgroundColor: c.color }}
                      />
                      <span className="truncate max-w-[150px]">{c.name}</span>
                    </button>
                  );
                })}

                {isFiltered && (
                  <button
                    onClick={handleResetFilter}
                    className="px-2.5 py-1 rounded-full text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 whitespace-nowrap flex items-center gap-1 transition-colors cursor-pointer ml-auto flex-shrink-0"
                    title="รีเซ็ตตัวกรองเพื่อแสดงทั้งหมด"
                  >
                    <RotateCcw className="w-3 h-3" />
                    ล้างตัวกรอง
                  </button>
                )}
              </div>

              {/* Active filter status note */}
              {isFiltered && (
                <div className="flex items-center justify-between text-[11px] text-blue-900 bg-blue-50/70 px-2.5 py-1 rounded-md border border-blue-200/60 font-medium">
                  <span>
                    กำลังแสดง: <strong className="font-bold">{selectedCategoryObj ? selectedCategoryObj.name : 'ค้นหาตามคำ'}</strong>
                    {comparisonSearchTerm && ` · คำค้น "${comparisonSearchTerm}"`}
                    {` (${filteredComparisonCategories.length} หน่วยงาน / ${filteredComparisonCategories.reduce((s, c) => s + (c.items?.length || 0), 0)} กิจกรรม)`}
                  </span>
                  <span className="font-mono font-bold text-blue-950">
                    ขอ 70 รวม: ฿{(filteredReq70 / 1000000).toFixed(2)}M
                  </span>
                </div>
              )}
            </div>

            {/* 3-Pillar Legend Header with Totals */}
            <div className="grid grid-cols-3 gap-2 p-2.5 bg-slate-50 rounded-xl border border-slate-200 text-xs mb-3">
              <div className="flex items-center gap-1.5">
                <span className="w-3.5 h-3.5 rounded bg-slate-500 flex-shrink-0" />
                <div>
                  <span className="text-[11px] text-slate-600 block leading-tight">1. คำขอ 69</span>
                  <span className="font-extrabold text-slate-900 font-mono">
                    ฿{(filteredReq69 / 1000000).toFixed(2)}M
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3.5 h-3.5 rounded bg-amber-500 flex-shrink-0" />
                <div>
                  <span className="text-[11px] text-amber-800 block leading-tight">
                    2. จ่ายจริง 69 ({filteredDisburseRate69.toFixed(1)}%)
                  </span>
                  <span className="font-extrabold text-amber-950 font-mono">
                    ฿{(filteredActual69 / 1000000).toFixed(2)}M
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3.5 h-3.5 rounded bg-blue-600 flex-shrink-0" />
                <div>
                  <span className="text-[11px] text-blue-800 block leading-tight">3. คำขอ 70</span>
                  <span className="font-black text-blue-950 font-mono">
                    ฿{(filteredReq70 / 1000000).toFixed(2)}M
                  </span>
                </div>
              </div>
            </div>

            {/* Header controls with Expand/Collapse All */}
            <div className="flex items-center justify-between px-1 mb-2">
              <span className="text-xs text-slate-500 font-medium">
                แสดง {filteredComparisonCategories.length} จาก {categories.length} หน่วยงาน (คลิกเพื่อกดย่อยดูรายกิจกรรม)
              </span>
              <button
                onClick={isAllExpanded ? collapseAllCategories : expandAllCategories}
                className="text-xs font-bold text-blue-700 hover:text-blue-900 bg-blue-50 hover:bg-blue-100 border border-blue-200 px-2.5 py-1 rounded-lg transition-colors flex items-center gap-1 cursor-pointer shadow-2xs"
              >
                <ChevronsUpDown className="w-3.5 h-3.5" />
                <span>{isAllExpanded ? 'ยุบรายกิจกรรมทั้งหมด' : 'ขยายดูรายกิจกรรมทั้งหมด'}</span>
              </button>
            </div>

            {/* Bar List with 3 Bars each */}
            <div className="w-full space-y-3 max-h-[380px] overflow-y-auto pr-1">
              {filteredComparisonCategories.length === 0 ? (
                <div className="p-8 text-center bg-slate-50 rounded-xl border border-slate-200 space-y-3 my-2">
                  <Filter className="w-8 h-8 text-slate-400 mx-auto" />
                  <p className="text-sm font-semibold text-slate-700">
                    ไม่พบข้อมูลอนุสภาหรือกิจกรรมที่ตรงกับตัวกรอง
                  </p>
                  <button
                    onClick={handleResetFilter}
                    className="text-xs font-bold text-blue-700 hover:text-white bg-blue-50 hover:bg-blue-600 border border-blue-200 px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
                  >
                    แสดงข้อมูลทั้งหมด ({categories.length} หน่วยงาน)
                  </button>
                </div>
              ) : (
                filteredComparisonCategories.map((cat, idx) => {
                  const val70 = cat.totalBudget;
                  const val69 = cat.budget69 || 0;
                  const valAct69 = cat.actual69 || 0;

                  const pct70 = (val70 / maxBarVal) * 100;
                  const pct69 = (val69 / maxBarVal) * 100;
                  const pctAct69 = (valAct69 / maxBarVal) * 100;

                  // Disbursement rate 69
                  const disburseRate69 = val69 > 0 ? (valAct69 / val69) * 100 : 0;

                  // Difference: 70 vs Actual 69
                  const diffVsAct69 = val70 - valAct69;
                  const diffPctVsAct69 = valAct69 > 0 ? (diffVsAct69 / valAct69) * 100 : 0;

                const catKey = cat.id || cat.name;
                const isExpanded = !!expandedCategoryIds[catKey];
                const isHovered = hoveredBarIndex === idx;

                return (
                  <div
                    key={cat.id + cat.name}
                    className={`p-3 rounded-xl transition-all border ${
                      isExpanded
                        ? 'bg-blue-50/40 border-blue-300 shadow-xs'
                        : isHovered
                        ? 'bg-blue-50/20 border-blue-200'
                        : 'bg-white border-slate-200/90 hover:border-slate-300'
                    }`}
                    onMouseEnter={() => setHoveredBarIndex(idx)}
                    onMouseLeave={() => setHoveredBarIndex(null)}
                  >
                    {/* Title and numbers */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-2">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <button
                          onClick={() => toggleCategory(catKey)}
                          className="p-1 rounded-md hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer flex-shrink-0"
                          title={isExpanded ? 'ยุบรายกิจกรรม' : 'กดย่อยดูรายกิจกรรม'}
                        >
                          <ChevronDown
                            className={`w-4 h-4 text-slate-800 transition-transform duration-200 ${
                              isExpanded ? 'rotate-180 text-blue-700' : ''
                            }`}
                          />
                        </button>
                        <span
                          className="text-xs sm:text-sm font-extrabold text-slate-900 truncate cursor-pointer hover:text-blue-800"
                          title={cat.name}
                          onClick={() => toggleCategory(catKey)}
                        >
                          {cat.name}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 text-xs font-mono tabular-nums flex-shrink-0">
                        <span className="text-slate-600 font-medium">
                          ขอ 69: <strong className="text-slate-800">฿{(val69 / 1000000).toFixed(2)}M</strong>
                        </span>
                        <span className="text-slate-300 font-bold">|</span>
                        <span className="text-amber-800 font-medium">
                          จริง 69: <strong className="text-amber-950">฿{(valAct69 / 1000000).toFixed(2)}M</strong>
                        </span>
                        <span className="text-slate-300 font-bold">|</span>
                        <span className="text-blue-800 font-medium">
                          ขอ 70: <strong className="text-blue-950 font-black">฿{(val70 / 1000000).toFixed(2)}M</strong>
                        </span>
                      </div>
                    </div>

                    {/* Progress 3 bars with clear height & badges */}
                    <div className="space-y-1.5 bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                      {/* Bar 1: คำขอ 69 */}
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] font-bold text-slate-600 w-16 flex-shrink-0">
                          1. คำขอ 69
                        </span>
                        <div className="h-3 w-full bg-slate-200 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-slate-500 rounded-full transition-all duration-500"
                            style={{ width: `${Math.max(pct69, 2)}%` }}
                          />
                        </div>
                        <span className="text-[11px] font-mono font-bold text-slate-600 w-16 text-right flex-shrink-0">
                          ฿{(val69 / 1000000).toFixed(2)}M
                        </span>
                      </div>

                      {/* Bar 2: จ่ายจริง 69 */}
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] font-bold text-amber-800 w-16 flex-shrink-0">
                          2. จ่ายจริง 69
                        </span>
                        <div className="h-3.5 w-full bg-amber-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-amber-500 rounded-full transition-all duration-500"
                            style={{ width: `${Math.max(pctAct69, 2)}%` }}
                          />
                        </div>
                        <span className="text-[11px] font-mono font-bold text-amber-900 w-16 text-right flex-shrink-0">
                          ฿{(valAct69 / 1000000).toFixed(2)}M
                        </span>
                      </div>

                      {/* Bar 3: คำขอ 70 */}
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] font-extrabold text-blue-800 w-16 flex-shrink-0">
                          3. คำขอ 70
                        </span>
                        <div className="h-4 w-full bg-blue-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-blue-600 rounded-full transition-all duration-500"
                            style={{ width: `${Math.max(pct70, 2)}%` }}
                          />
                        </div>
                        <span className="text-[11px] font-mono font-black text-blue-950 w-16 text-right flex-shrink-0">
                          ฿{(val70 / 1000000).toFixed(2)}M
                        </span>
                      </div>
                    </div>

                    {/* Comparative indicators */}
                    <div className="mt-2 flex flex-wrap items-center justify-between gap-1 text-[11px] text-slate-600">
                      <span className="flex items-center gap-1 font-semibold text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                        เบิกจ่ายปี 69: {disburseRate69.toFixed(1)}%
                      </span>
                      <span
                        className={`font-bold px-2 py-0.5 rounded border flex items-center gap-0.5 ${
                          diffVsAct69 >= 0
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                            : 'bg-rose-50 text-rose-800 border-rose-200'
                        }`}
                      >
                        ขอ 70 เทียบจ่ายจริง 69: {diffVsAct69 >= 0 ? '+' : ''}
                        {(diffVsAct69 / 1000000).toFixed(2)}M ({diffVsAct69 >= 0 ? '+' : ''}
                        {diffPctVsAct69.toFixed(1)}%)
                      </span>
                    </div>

                    {/* Drill-down Toggle Button */}
                    <button
                      onClick={() => toggleCategory(catKey)}
                      className="w-full mt-2.5 py-1.5 px-3 bg-blue-50/70 hover:bg-blue-100 text-blue-800 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer border border-blue-200/60 shadow-2xs"
                    >
                      <FolderTree className="w-3.5 h-3.5 text-blue-600" />
                      <span>
                        {isExpanded
                          ? 'ซ่อนรายละเอียดรายกิจกรรม'
                          : `กดย่อยดูรายกิจกรรม (${cat.items?.length || 0} รายการ)`}
                      </span>
                      <ChevronDown
                        className={`w-3.5 h-3.5 transition-transform duration-200 ${
                          isExpanded ? 'rotate-180' : ''
                        }`}
                      />
                    </button>

                    {/* Drill-down Content */}
                    {isExpanded && (
                      <div className="mt-2.5 p-3 bg-slate-50/90 rounded-xl border border-blue-200 space-y-2.5 animate-in fade-in duration-150">
                        <div className="flex items-center justify-between border-b border-slate-200 pb-1.5">
                          <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                            <FolderTree className="w-3.5 h-3.5 text-blue-700" />
                            รายการกิจกรรมภายใต้ {cat.name} ({cat.items.length} รายการ)
                          </span>
                          <span className="text-[10px] text-slate-500 font-medium">
                            (1. คำขอ 69 · 2. จ่ายจริง 69 · 3. คำขอ 70)
                          </span>
                        </div>

                        {cat.items.length === 0 ? (
                          <div className="text-center py-3 text-xs text-slate-400">
                            ไม่มีรายการกิจกรรมย่อย
                          </div>
                        ) : (
                          <div className="space-y-2">
                            {cat.items.map((sub, sIdx) => {
                              const subReq69 =
                                sub.budget69 !== undefined
                                  ? sub.budget69
                                  : Math.round(sub.budget * 0.9);
                              const subAct69 =
                                sub.actual69 !== undefined
                                  ? sub.actual69
                                  : Math.round(subReq69 * 0.92);
                              const subDisbRate =
                                subReq69 > 0 ? (subAct69 / subReq69) * 100 : 0;
                              const subDiffAct = sub.budget - subAct69;
                              const subDiffActPct =
                                subAct69 > 0 ? (subDiffAct / subAct69) * 100 : 0;
                              const subMax = Math.max(sub.budget, subReq69, subAct69, 1);
                              const subPct69 = (subReq69 / subMax) * 100;
                              const subPctAct69 = (subAct69 / subMax) * 100;
                              const subPct70 = (sub.budget / subMax) * 100;

                              return (
                                <div
                                  key={sub.id || sIdx}
                                  className="p-2.5 bg-white rounded-lg border border-slate-200/90 shadow-2xs space-y-1.5"
                                >
                                  {/* Activity name and ID */}
                                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-1">
                                    <div className="flex items-start gap-1.5">
                                      <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-blue-100 text-blue-800 flex-shrink-0 mt-0.5">
                                        {sub.id}
                                      </span>
                                      <span className="text-xs font-bold text-slate-900 leading-snug">
                                        {sub.activity}
                                      </span>
                                    </div>
                                    <div className="flex items-center gap-1.5 text-[11px] font-mono flex-shrink-0">
                                      <span
                                        className={`font-bold px-1.5 py-0.5 rounded text-[10px] ${
                                          subDiffAct >= 0
                                            ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                                            : 'bg-rose-50 text-rose-800 border border-rose-200'
                                        }`}
                                      >
                                        ขอ 70 vs จริง 69: {subDiffAct >= 0 ? '+' : ''}
                                        {formatMoney(subDiffAct)} ({subDiffAct >= 0 ? '+' : ''}
                                        {subDiffActPct.toFixed(1)}%)
                                      </span>
                                    </div>
                                  </div>

                                  {/* 3 Value Stats */}
                                  <div className="grid grid-cols-3 gap-1 text-[11px] font-mono bg-slate-50 p-1.5 rounded border border-slate-100">
                                    <div className="text-slate-600">
                                      <span className="text-[9px] block text-slate-500 font-sans">
                                        1. คำขอ 69
                                      </span>
                                      <strong className="text-slate-800">
                                        ฿ {formatMoney(subReq69)}
                                      </strong>
                                    </div>
                                    <div className="text-amber-900">
                                      <span className="text-[9px] block text-amber-800 font-sans">
                                        2. จ่ายจริง 69 ({subDisbRate.toFixed(1)}%)
                                      </span>
                                      <strong className="text-amber-950">
                                        ฿ {formatMoney(subAct69)}
                                      </strong>
                                    </div>
                                    <div className="text-blue-900">
                                      <span className="text-[9px] block text-blue-800 font-sans">
                                        3. คำขอ 70
                                      </span>
                                      <strong className="text-blue-950 font-black">
                                        ฿ {formatMoney(sub.budget)}
                                      </strong>
                                    </div>
                                  </div>

                                  {/* Mini 3 Bars Strip */}
                                  <div className="space-y-0.5 pt-0.5">
                                    <div className="flex items-center gap-1.5">
                                      <span className="text-[9px] text-slate-500 w-12 flex-shrink-0 font-sans">
                                        ขอ 69
                                      </span>
                                      <div className="h-1.5 w-full bg-slate-200 rounded-full overflow-hidden">
                                        <div
                                          className="h-full bg-slate-500 rounded-full"
                                          style={{ width: `${Math.max(subPct69, 3)}%` }}
                                        />
                                      </div>
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                      <span className="text-[9px] text-amber-800 w-12 flex-shrink-0 font-sans">
                                        จริง 69
                                      </span>
                                      <div className="h-1.5 w-full bg-amber-100 rounded-full overflow-hidden">
                                        <div
                                          className="h-full bg-amber-500 rounded-full"
                                          style={{ width: `${Math.max(subPctAct69, 3)}%` }}
                                        />
                                      </div>
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                      <span className="text-[9px] text-blue-800 font-bold w-12 flex-shrink-0 font-sans">
                                        ขอ 70
                                      </span>
                                      <div className="h-2 w-full bg-blue-100 rounded-full overflow-hidden">
                                        <div
                                          className="h-full bg-blue-600 rounded-full"
                                          style={{ width: `${Math.max(subPct70, 3)}%` }}
                                        />
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              }))}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 text-center text-xs text-slate-600 font-medium">
            * เปรียบเทียบ 3 ตัวเลขสำคัญ: คำของบประมาณ 2569 · ผลการใช้จ่ายจริง 2569 · คำขอปี 2570
          </div>
        </div>
      </div>

      {/* Modal 1: Expanded Proportion View */}
      {expandedModal === 'proportion' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50 flex-shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center">
                  <PieChart className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-900 text-lg sm:text-xl">
                    สัดส่วนการของบประมาณรายจ่าย ประจำปี 2570
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-500">
                    แสดงรายละเอียดสัดส่วนงบประมาณแยกตามอนุสภาและส่วนงาน ({categories.length} หน่วยงาน)
                  </p>
                </div>
              </div>
              <button
                onClick={() => setExpandedModal(null)}
                className="text-slate-400 hover:text-slate-700 p-2 rounded-xl hover:bg-slate-200/70 transition-colors"
                title="ปิดหน้าต่าง"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 overflow-y-auto space-y-6 flex-1">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                <div className="flex flex-col items-center justify-center p-6 bg-slate-50 rounded-2xl border border-slate-200">
                  <svg
                    width={280}
                    height={280}
                    viewBox={`0 0 ${size} ${size}`}
                    className="transform -rotate-90 drop-shadow-xs"
                  >
                    {slices.map((slice) => {
                      const isHovered = hoveredSlice === slice.index;
                      return (
                        <circle
                          key={'modal-' + slice.id + slice.name}
                          cx={size / 2}
                          cy={size / 2}
                          r={radius}
                          fill="transparent"
                          stroke={slice.color}
                          strokeWidth={isHovered ? strokeWidth + 8 : strokeWidth}
                          strokeDasharray={slice.strokeDasharray}
                          strokeDashoffset={slice.strokeDashoffset}
                          className="transition-all duration-200 cursor-pointer"
                          onMouseEnter={() => setHoveredSlice(slice.index)}
                          onMouseLeave={() => setHoveredSlice(null)}
                        />
                      );
                    })}
                  </svg>
                  <div className="mt-4 text-center">
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-wide">
                      รวมงบประมาณรายจ่ายปี 70
                    </p>
                    <p className="text-2xl font-black text-slate-900 font-mono mt-0.5">
                      ฿ {formatMoney(totalExpense)}
                    </p>
                  </div>
                </div>

                {/* Table Breakdown */}
                <div className="border border-slate-200 rounded-xl overflow-hidden">
                  <table className="w-full text-left border-collapse text-xs sm:text-sm">
                    <thead className="bg-slate-100 font-bold text-slate-700 border-b border-slate-200">
                      <tr>
                        <th className="py-3 px-4">อนุสภา / ส่วนงาน</th>
                        <th className="py-3 px-4 text-right">งบปี 70</th>
                        <th className="py-3 px-4 text-center">สัดส่วน</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {categories
                        .slice()
                        .sort((a, b) => b.totalBudget - a.totalBudget)
                        .map((cat) => (
                          <tr
                            key={'table-modal-' + cat.id + cat.name}
                            className="hover:bg-slate-50 transition-colors"
                          >
                            <td className="py-3 px-4 font-semibold text-slate-800 flex items-center gap-2.5">
                              <span
                                className="w-3.5 h-3.5 rounded flex-shrink-0"
                                style={{ backgroundColor: cat.color }}
                              />
                              <span className="truncate">{cat.name}</span>
                            </td>
                            <td className="py-3 px-4 text-right font-bold text-slate-900 font-mono">
                              ฿ {(cat.totalBudget / 1000000).toFixed(2)}M
                            </td>
                            <td className="py-3 px-4 text-center">
                              <span
                                className="font-bold font-mono px-2.5 py-1 rounded-md text-xs text-white"
                                style={{ backgroundColor: cat.color }}
                              >
                                {cat.percentage.toFixed(1)}%
                              </span>
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-3.5 border-t border-slate-100 bg-slate-50 flex items-center justify-end flex-shrink-0">
              <button
                onClick={() => setExpandedModal(null)}
                className="px-5 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-sm font-semibold transition-colors cursor-pointer"
              >
                ปิดหน้าต่าง
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal 2: Expanded 3-Pillar Comparison View */}
      {expandedModal === 'comparison' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-5xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50 flex-shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center">
                  <BarChart2 className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-900 text-lg sm:text-xl">
                    เปรียบเทียบงบประมาณ 3 ด้าน (คำขอ 2569 · จ่ายจริง 2569 · คำขอ 2570)
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-600 font-medium">
                    วิเคราะห์ผลการเบิกจ่ายจริงปี 69 และความสมเหตุสมผลของการของบประมาณปี 70
                  </p>
                </div>
              </div>
              <button
                onClick={() => setExpandedModal(null)}
                className="text-slate-400 hover:text-slate-700 p-2 rounded-xl hover:bg-slate-200/70 transition-colors cursor-pointer"
                title="ปิดหน้าต่าง"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 overflow-y-auto space-y-5 flex-1">
              {/* Grand Summary 3-Card Banner */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-300">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-600 uppercase tracking-wide">
                      1. รวมคำของบประมาณ 2569 {isFiltered && <span className="text-blue-700">(กรอง)</span>}
                    </span>
                    <span className="w-3.5 h-3.5 rounded bg-slate-500" />
                  </div>
                  <div className="text-2xl font-black text-slate-900 font-mono mt-1">
                    ฿ {formatMoney(filteredReq69)}
                  </div>
                  <div className="text-xs text-slate-500 mt-1">
                    {isFiltered
                      ? `คำขอปี 69 เฉพาะ ${filteredComparisonCategories.length} หน่วยงานที่เลือก`
                      : 'กรอบวงเงินคำขอปีงบประมาณ 2569'}
                  </div>
                </div>

                <div className="bg-amber-50 p-4 rounded-xl border border-amber-300">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-amber-900 uppercase tracking-wide">
                      2. รวมจ่ายจริง 2569 {isFiltered && <span className="text-amber-800">(กรอง)</span>}
                    </span>
                    <span className="w-3.5 h-3.5 rounded bg-amber-500" />
                  </div>
                  <div className="text-2xl font-black text-amber-950 font-mono mt-1">
                    ฿ {formatMoney(filteredActual69)}
                  </div>
                  <div className="text-xs font-bold text-amber-800 mt-1 flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    อัตราเบิกจ่ายจริง: {filteredDisburseRate69.toFixed(1)}% ของคำขอ
                  </div>
                </div>

                <div className="bg-blue-50 p-4 rounded-xl border border-blue-300">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-blue-900 uppercase tracking-wide">
                      3. รวมคำของบประมาณ 2570 {isFiltered && <span className="text-blue-800">(กรอง)</span>}
                    </span>
                    <span className="w-3.5 h-3.5 rounded bg-blue-600" />
                  </div>
                  <div className="text-2xl font-black text-blue-950 font-mono mt-1">
                    ฿ {formatMoney(filteredReq70)}
                  </div>
                  <div className="text-xs font-bold text-blue-800 mt-1">
                    {filteredDiffVsAct69 >= 0 ? '+' : ''}
                    {(filteredDiffVsAct69 / 1000000).toFixed(2)}M ({filteredDiffVsAct69 >= 0 ? '+' : ''}
                    {filteredDiffPctVsAct69.toFixed(1)}% เทียบจ่ายจริง 69)
                  </div>
                </div>
              </div>

              {/* Modal Sub-Council Filter Bar */}
              <div className="bg-slate-50/90 p-3 rounded-xl border border-slate-200 space-y-2.5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                  {/* Dropdown Selector */}
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-800 flex items-center justify-center flex-shrink-0">
                      <Filter className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <label className="text-[11px] font-bold text-slate-700 block mb-0.5">
                        กรองเลือกอนุสภา / หมวดหมู่:
                      </label>
                      <select
                        value={selectedCategoryFilter}
                        onChange={(e) => handleSelectCategory(e.target.value)}
                        className="w-full text-xs sm:text-sm font-semibold bg-white border border-slate-300 hover:border-blue-500 rounded-lg px-2.5 py-1.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600 cursor-pointer shadow-2xs truncate transition-colors"
                      >
                        <option value="ALL">
                          🏢 ทุกอนุสภา ({categories.length} หน่วยงาน · ยอดรวมคำขอ ฿{(totalExpense / 1000000).toFixed(2)}M)
                        </option>
                        {categories.map((c) => (
                          <option key={'modal-sel-opt-' + (c.id || c.name)} value={c.id || c.name}>
                            {c.name} (ขอ 70: ฿{(c.totalBudget / 1000000).toFixed(2)}M · {c.percentage.toFixed(1)}%)
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Search Box */}
                  <div className="relative flex-shrink-0 w-full sm:w-56 self-end sm:self-auto">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="ค้นหากิจกรรม / รหัส..."
                      value={comparisonSearchTerm}
                      onChange={(e) => setComparisonSearchTerm(e.target.value)}
                      className="w-full pl-8 pr-7 py-1.5 text-xs border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-600 text-slate-800 placeholder-slate-400 shadow-2xs"
                    />
                    {comparisonSearchTerm && (
                      <button
                        onClick={() => setComparisonSearchTerm('')}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 p-0.5 cursor-pointer"
                        title="ล้างคำค้นหา"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Quick Filter Pills (Scrollable) */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-thin text-xs">
                  <button
                    onClick={() => handleSelectCategory('ALL')}
                    className={`px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap transition-all cursor-pointer flex-shrink-0 ${
                      selectedCategoryFilter === 'ALL'
                        ? 'bg-blue-700 text-white shadow-2xs ring-1 ring-blue-800'
                        : 'bg-white hover:bg-slate-200 text-slate-700 border border-slate-300'
                    }`}
                  >
                    ทั้งหมด ({categories.length})
                  </button>
                  {categories.map((c) => {
                    const catKey = c.id || c.name;
                    const isSelected = selectedCategoryFilter === catKey;
                    return (
                      <button
                        key={'modal-pill-' + catKey}
                        onClick={() => handleSelectCategory(catKey)}
                        className={`px-2.5 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition-all cursor-pointer flex-shrink-0 flex items-center gap-1.5 ${
                          isSelected
                            ? 'bg-blue-700 text-white font-bold shadow-2xs ring-1 ring-blue-800'
                            : 'bg-white hover:bg-slate-100 text-slate-800 border border-slate-300'
                        }`}
                      >
                        <span
                          className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                          style={{ backgroundColor: c.color }}
                        />
                        <span className="truncate max-w-[150px]">{c.name}</span>
                      </button>
                    );
                  })}

                  {isFiltered && (
                    <button
                      onClick={handleResetFilter}
                      className="px-2.5 py-1 rounded-full text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 whitespace-nowrap flex items-center gap-1 transition-colors cursor-pointer ml-auto flex-shrink-0"
                      title="รีเซ็ตตัวกรองเพื่อแสดงทั้งหมด"
                    >
                      <RotateCcw className="w-3 h-3" />
                      ล้างตัวกรอง
                    </button>
                  )}
                </div>

                {/* Active filter status note */}
                {isFiltered && (
                  <div className="flex items-center justify-between text-[11px] text-blue-900 bg-blue-50/70 px-2.5 py-1 rounded-md border border-blue-200/60 font-medium">
                    <span>
                      กำลังแสดง: <strong className="font-bold">{selectedCategoryObj ? selectedCategoryObj.name : 'ค้นหาตามคำ'}</strong>
                      {comparisonSearchTerm && ` · คำค้น "${comparisonSearchTerm}"`}
                      {` (${filteredComparisonCategories.length} หน่วยงาน / ${filteredComparisonCategories.reduce((s, c) => s + (c.items?.length || 0), 0)} กิจกรรม)`}
                    </span>
                    <span className="font-mono font-bold text-blue-950">
                      ขอ 70 รวม: ฿{(filteredReq70 / 1000000).toFixed(2)}M
                    </span>
                  </div>
                )}
              </div>

              {/* View Switcher: Table vs Bars & Expand All Controls */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-3">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setModalViewTab('table')}
                    className={`px-3 py-1.5 rounded-lg text-xs sm:text-sm font-bold flex items-center gap-1.5 transition-colors cursor-pointer ${
                      modalViewTab === 'table'
                        ? 'bg-blue-700 text-white shadow-2xs'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    <Table className="w-4 h-4" />
                    ตารางเปรียบเทียบ 3 ด้านครบถ้วน
                  </button>
                  <button
                    onClick={() => setModalViewTab('bars')}
                    className={`px-3 py-1.5 rounded-lg text-xs sm:text-sm font-bold flex items-center gap-1.5 transition-colors cursor-pointer ${
                      modalViewTab === 'bars'
                        ? 'bg-blue-700 text-white shadow-2xs'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    <BarChart2 className="w-4 h-4" />
                    แผนภูมิแท่ง 3 สีขนาดใหญ่
                  </button>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={isAllExpanded ? collapseAllCategories : expandAllCategories}
                    className="text-xs font-bold text-blue-700 hover:text-blue-900 bg-blue-50 hover:bg-blue-100 border border-blue-200 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
                  >
                    <ChevronsUpDown className="w-3.5 h-3.5" />
                    <span>{isAllExpanded ? 'ยุบรายกิจกรรมทั้งหมด' : 'ขยายดูรายกิจกรรมทั้งหมด'}</span>
                  </button>
                  <span className="text-xs text-slate-500 font-medium">
                    แสดง {filteredComparisonCategories.length} จาก {categories.length} หน่วยงาน
                  </span>
                </div>
              </div>

              {/* View 1: Detailed 3-Way Table */}
              {modalViewTab === 'table' && (
                <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
                  <table className="w-full text-left border-collapse text-xs sm:text-sm">
                    <thead className="bg-slate-100 font-bold text-slate-800 border-b border-slate-200">
                      <tr>
                        <th className="py-3 px-3">อนุสภา / แผนงาน / รายการกิจกรรม</th>
                        <th className="py-3 px-3 text-right bg-slate-200/60">1. คำขอ 2569</th>
                        <th className="py-3 px-3 text-right bg-amber-100/70 text-amber-950">
                          2. จ่ายจริง 2569
                        </th>
                        <th className="py-3 px-3 text-center bg-amber-50 text-amber-900">
                          % เบิกจ่าย 69
                        </th>
                        <th className="py-3 px-3 text-right bg-blue-100/70 text-blue-950">
                          3. คำขอ 2570
                        </th>
                        <th className="py-3 px-3 text-right bg-emerald-50 text-emerald-900">
                          เทียบจ่ายจริง 69 (+/-)
                        </th>
                        <th className="py-3 px-3 text-right bg-slate-50 text-slate-700">
                          เทียบคำขอ 69 (+/-)
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredComparisonCategories.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="py-12 text-center text-slate-500">
                            <div className="flex flex-col items-center justify-center space-y-2">
                              <Filter className="w-8 h-8 text-slate-400" />
                              <p className="font-semibold text-slate-700">ไม่พบข้อมูลที่ตรงกับตัวกรอง</p>
                              <button
                                onClick={handleResetFilter}
                                className="text-xs font-bold text-blue-700 hover:text-white bg-blue-50 hover:bg-blue-600 border border-blue-200 px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
                              >
                                ล้างตัวกรอง (แสดงทั้งหมด)
                              </button>
                            </div>
                          </td>
                        </tr>
                      ) : (
                        filteredComparisonCategories.map((cat) => {
                        const val70 = cat.totalBudget;
                        const val69 = cat.budget69 || 0;
                        const valAct69 = cat.actual69 || 0;
                        const rate69 = val69 > 0 ? (valAct69 / val69) * 100 : 0;
                        const diffAct = val70 - valAct69;
                        const diffActPct = valAct69 > 0 ? (diffAct / valAct69) * 100 : 0;
                        const diffReq = val70 - val69;
                        const diffReqPct = val69 > 0 ? (diffReq / val69) * 100 : 0;

                        const catKey = cat.id || cat.name;
                        const isExpanded = !!expandedCategoryIds[catKey];

                        return (
                          <React.Fragment key={'modal-tbl-frag-' + catKey}>
                            {/* Main Category Row */}
                            <tr className="hover:bg-slate-50/90 font-bold bg-slate-50/30">
                              <td className="py-3 px-3 text-slate-900">
                                <div className="flex items-center gap-2">
                                  <button
                                    onClick={() => toggleCategory(catKey)}
                                    className="p-1 rounded hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
                                    title={isExpanded ? 'ยุบ' : 'กดย่อยดูรายกิจกรรม'}
                                  >
                                    <ChevronDown
                                      className={`w-4 h-4 transition-transform duration-200 ${
                                        isExpanded ? 'rotate-180 text-blue-700' : ''
                                      }`}
                                    />
                                  </button>
                                  <span
                                    className="w-3.5 h-3.5 rounded flex-shrink-0"
                                    style={{ backgroundColor: cat.color }}
                                  />
                                  <span
                                    className="cursor-pointer hover:text-blue-800"
                                    onClick={() => toggleCategory(catKey)}
                                  >
                                    {cat.name}
                                  </span>
                                  <span className="text-[11px] font-normal text-slate-500 bg-slate-200/80 px-2 py-0.5 rounded-full">
                                    {cat.items?.length || 0} กิจกรรม
                                  </span>
                                </div>
                              </td>
                              <td className="py-3 px-3 text-right font-mono font-bold text-slate-700 bg-slate-50/50">
                                ฿ {formatMoney(val69)}
                              </td>
                              <td className="py-3 px-3 text-right font-mono font-bold text-amber-950 bg-amber-50/40">
                                ฿ {formatMoney(valAct69)}
                              </td>
                              <td className="py-3 px-3 text-center font-mono font-bold text-amber-900">
                                <span className="px-2 py-0.5 rounded bg-amber-100/80">
                                  {rate69.toFixed(1)}%
                                </span>
                              </td>
                              <td className="py-3 px-3 text-right font-mono font-black text-blue-950 bg-blue-50/40">
                                ฿ {formatMoney(val70)}
                              </td>
                              <td
                                className={`py-3 px-3 text-right font-mono font-bold ${
                                  diffAct >= 0 ? 'text-emerald-700' : 'text-rose-700'
                                }`}
                              >
                                {diffAct >= 0 ? '+' : ''}
                                {formatMoney(diffAct)}
                                <span className="text-[11px] block font-semibold">
                                  ({diffAct >= 0 ? '+' : ''}
                                  {diffActPct.toFixed(1)}%)
                                </span>
                              </td>
                              <td
                                className={`py-3 px-3 text-right font-mono font-semibold ${
                                  diffReq >= 0 ? 'text-slate-800' : 'text-rose-700'
                                }`}
                              >
                                {diffReq >= 0 ? '+' : ''}
                                {formatMoney(diffReq)}
                                <span className="text-[11px] block text-slate-500">
                                  ({diffReq >= 0 ? '+' : ''}
                                  {diffReqPct.toFixed(1)}%)
                                </span>
                              </td>
                            </tr>

                            {/* Sub-activities drilldown rows */}
                            {isExpanded &&
                              cat.items.map((sub, sIdx) => {
                                const subReq69 =
                                  sub.budget69 !== undefined
                                    ? sub.budget69
                                    : Math.round(sub.budget * 0.9);
                                const subAct69 =
                                  sub.actual69 !== undefined
                                    ? sub.actual69
                                    : Math.round(subReq69 * 0.92);
                                const subRate69 =
                                  subReq69 > 0 ? (subAct69 / subReq69) * 100 : 0;
                                const subDiffAct = sub.budget - subAct69;
                                const subDiffActPct =
                                  subAct69 > 0 ? (subDiffAct / subAct69) * 100 : 0;
                                const subDiffReq = sub.budget - subReq69;
                                const subDiffReqPct =
                                  subReq69 > 0 ? (subDiffReq / subReq69) * 100 : 0;

                                return (
                                  <tr
                                    key={'sub-row-' + catKey + '-' + (sub.id || sIdx)}
                                    className="bg-blue-50/20 hover:bg-blue-50/40 text-[11px] sm:text-xs transition-colors"
                                  >
                                    <td className="py-2.5 px-3 pl-8">
                                      <div className="flex items-center gap-2">
                                        <CornerDownRight className="w-3.5 h-3.5 text-blue-500 flex-shrink-0 ml-2" />
                                        <span className="font-mono font-bold px-1.5 py-0.5 rounded bg-blue-100 text-blue-800 text-[10px] flex-shrink-0">
                                          {sub.id}
                                        </span>
                                        <span className="text-slate-800 font-medium leading-snug">
                                          {sub.activity}
                                        </span>
                                      </div>
                                    </td>
                                    <td className="py-2.5 px-3 text-right font-mono text-slate-600 bg-slate-50/30">
                                      ฿ {formatMoney(subReq69)}
                                    </td>
                                    <td className="py-2.5 px-3 text-right font-mono text-amber-900 bg-amber-50/30 font-semibold">
                                      ฿ {formatMoney(subAct69)}
                                    </td>
                                    <td className="py-2.5 px-3 text-center font-mono text-amber-800 text-[11px]">
                                      <span className="px-1.5 py-0.5 rounded bg-amber-100/60">
                                        {subRate69.toFixed(1)}%
                                      </span>
                                    </td>
                                    <td className="py-2.5 px-3 text-right font-mono font-bold text-blue-950 bg-blue-50/30">
                                      ฿ {formatMoney(sub.budget)}
                                    </td>
                                    <td
                                      className={`py-2.5 px-3 text-right font-mono font-semibold ${
                                        subDiffAct >= 0 ? 'text-emerald-700' : 'text-rose-700'
                                      }`}
                                    >
                                      {subDiffAct >= 0 ? '+' : ''}
                                      {formatMoney(subDiffAct)}
                                      <span className="text-[10px] block opacity-80">
                                        ({subDiffAct >= 0 ? '+' : ''}
                                        {subDiffActPct.toFixed(1)}%)
                                      </span>
                                    </td>
                                    <td
                                      className={`py-2.5 px-3 text-right font-mono ${
                                        subDiffReq >= 0 ? 'text-slate-700' : 'text-rose-700'
                                      }`}
                                    >
                                      {subDiffReq >= 0 ? '+' : ''}
                                      {formatMoney(subDiffReq)}
                                      <span className="text-[10px] block opacity-80">
                                        ({subDiffReq >= 0 ? '+' : ''}
                                        {subDiffReqPct.toFixed(1)}%)
                                      </span>
                                    </td>
                                  </tr>
                                );
                              })}
                          </React.Fragment>
                        );
                      }))}
                    </tbody>
                    <tfoot className="bg-slate-100 font-black border-t-2 border-slate-300 text-xs sm:text-sm">
                      <tr>
                        <td className="py-3.5 px-3 font-extrabold text-slate-900">
                          รวมทั้งสิ้น ({filteredComparisonCategories.length} หน่วยงาน{isFiltered ? ' ที่เลือก' : ''})
                        </td>
                        <td className="py-3.5 px-3 text-right font-mono text-slate-800">
                          ฿ {formatMoney(filteredReq69)}
                        </td>
                        <td className="py-3.5 px-3 text-right font-mono text-amber-950">
                          ฿ {formatMoney(filteredActual69)}
                        </td>
                        <td className="py-3.5 px-3 text-center font-mono text-amber-900">
                          <span className="px-2 py-0.5 rounded bg-amber-200">
                            {filteredDisburseRate69.toFixed(1)}%
                          </span>
                        </td>
                        <td className="py-3.5 px-3 text-right font-mono text-blue-950 text-sm">
                          ฿ {formatMoney(filteredReq70)}
                        </td>
                        <td
                          className={`py-3.5 px-3 text-right font-mono ${
                            filteredDiffVsAct69 >= 0 ? 'text-emerald-800' : 'text-rose-800'
                          }`}
                        >
                          {filteredDiffVsAct69 >= 0 ? '+' : ''}
                          {formatMoney(filteredDiffVsAct69)}
                          <span className="text-[11px] block">
                            ({filteredDiffVsAct69 >= 0 ? '+' : ''}
                            {filteredDiffPctVsAct69.toFixed(1)}%)
                          </span>
                        </td>
                        <td
                          className={`py-3.5 px-3 text-right font-mono ${
                            filteredDiffVsReq69 >= 0 ? 'text-slate-900' : 'text-rose-800'
                          }`}
                        >
                          {filteredDiffVsReq69 >= 0 ? '+' : ''}
                          {formatMoney(filteredDiffVsReq69)}
                          <span className="text-[11px] block text-slate-600">
                            ({filteredDiffVsReq69 >= 0 ? '+' : ''}
                            {filteredDiffPctVsReq69.toFixed(1)}%)
                          </span>
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              )}

              {/* View 2: Large Graphic Bars */}
              {modalViewTab === 'bars' && (
                <div className="space-y-4">
                  {filteredComparisonCategories.length === 0 ? (
                    <div className="p-12 text-center bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                      <Filter className="w-8 h-8 text-slate-400 mx-auto" />
                      <p className="font-semibold text-slate-700">ไม่พบข้อมูลที่ตรงกับตัวกรอง</p>
                      <button
                        onClick={handleResetFilter}
                        className="text-xs font-bold text-blue-700 hover:text-white bg-blue-50 hover:bg-blue-600 border border-blue-200 px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
                      >
                        ล้างตัวกรอง (แสดงทั้งหมด)
                      </button>
                    </div>
                  ) : (
                    filteredComparisonCategories.map((cat) => {
                    const val70 = cat.totalBudget;
                    const val69 = cat.budget69 || 0;
                    const valAct69 = cat.actual69 || 0;

                    const pct70 = (val70 / maxBarVal) * 100;
                    const pct69 = (val69 / maxBarVal) * 100;
                    const pctAct69 = (valAct69 / maxBarVal) * 100;

                    const rate69 = val69 > 0 ? (valAct69 / val69) * 100 : 0;
                    const diffAct = val70 - valAct69;
                    const diffActPct = valAct69 > 0 ? (diffAct / valAct69) * 100 : 0;

                    const catKey = cat.id || cat.name;
                    const isExpanded = !!expandedCategoryIds[catKey];

                    return (
                      <div
                        key={'modal-bars-' + cat.id + cat.name}
                        className="p-4 rounded-xl border border-slate-200 bg-white hover:border-blue-300 transition-all space-y-3"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => toggleCategory(catKey)}
                              className="p-1 rounded-md hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
                              title={isExpanded ? 'ยุบ' : 'กดย่อยดูรายกิจกรรม'}
                            >
                              <ChevronDown
                                className={`w-4 h-4 transition-transform duration-200 ${
                                  isExpanded ? 'rotate-180 text-blue-700' : ''
                                }`}
                              />
                            </button>
                            <span
                              className="text-sm sm:text-base font-extrabold text-slate-900 cursor-pointer hover:text-blue-800"
                              onClick={() => toggleCategory(catKey)}
                            >
                              {cat.name}
                            </span>
                          </div>
                          <div className="flex flex-wrap items-center gap-2 text-xs font-mono">
                            <span className="px-2 py-0.5 bg-amber-50 text-amber-900 border border-amber-200 rounded font-bold">
                              เบิกจ่าย 69: {rate69.toFixed(1)}%
                            </span>
                            <span
                              className={`px-2 py-0.5 rounded font-extrabold border ${
                                diffAct >= 0
                                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                                  : 'bg-rose-50 text-rose-800 border-rose-200'
                              }`}
                            >
                              ขอ 70 vs จ่ายจริง 69: {diffAct >= 0 ? '+' : ''}
                              {(diffAct / 1000000).toFixed(2)}M ({diffAct >= 0 ? '+' : ''}
                              {diffActPct.toFixed(1)}%)
                            </span>
                          </div>
                        </div>

                        {/* 3 Bars graphic */}
                        <div className="space-y-2.5 bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                          {/* 1. Bar คำขอ 69 */}
                          <div className="flex items-center gap-3">
                            <span className="text-xs font-bold text-slate-600 w-28 flex-shrink-0">
                              1. คำขอ 2569
                            </span>
                            <div className="h-4 w-full bg-slate-200 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-slate-500 rounded-full transition-all duration-500"
                                style={{ width: `${Math.max(pct69, 2)}%` }}
                              />
                            </div>
                            <span className="text-xs font-mono font-bold text-slate-700 w-28 text-right flex-shrink-0">
                              ฿ {formatMoney(val69)}
                            </span>
                          </div>

                          {/* 2. Bar จ่ายจริง 69 */}
                          <div className="flex items-center gap-3">
                            <span className="text-xs font-bold text-amber-800 w-28 flex-shrink-0">
                              2. จ่ายจริง 2569
                            </span>
                            <div className="h-4.5 w-full bg-amber-100 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-amber-500 rounded-full transition-all duration-500"
                                style={{ width: `${Math.max(pctAct69, 2)}%` }}
                              />
                            </div>
                            <span className="text-xs font-mono font-bold text-amber-900 w-28 text-right flex-shrink-0">
                              ฿ {formatMoney(valAct69)}
                            </span>
                          </div>

                          {/* 3. Bar คำขอ 70 */}
                          <div className="flex items-center gap-3">
                            <span className="text-xs font-extrabold text-blue-800 w-28 flex-shrink-0">
                              3. คำขอ 2570
                            </span>
                            <div className="h-5 w-full bg-blue-100 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-blue-600 rounded-full transition-all duration-500"
                                style={{ width: `${Math.max(pct70, 2)}%` }}
                              />
                            </div>
                            <span className="text-xs font-mono font-black text-blue-950 w-28 text-right flex-shrink-0">
                              ฿ {formatMoney(val70)}
                            </span>
                          </div>
                        </div>

                        {/* Drill-down Toggle Button */}
                        <button
                          onClick={() => toggleCategory(catKey)}
                          className="w-full py-1.5 px-3 bg-blue-50/70 hover:bg-blue-100 text-blue-800 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer border border-blue-200/60 shadow-2xs"
                        >
                          <FolderTree className="w-3.5 h-3.5 text-blue-600" />
                          <span>
                            {isExpanded
                              ? 'ซ่อนรายละเอียดรายกิจกรรม'
                              : `กดย่อยดูรายกิจกรรม (${cat.items?.length || 0} รายการ)`}
                          </span>
                          <ChevronDown
                            className={`w-3.5 h-3.5 transition-transform duration-200 ${
                              isExpanded ? 'rotate-180' : ''
                            }`}
                          />
                        </button>

                        {/* Sub-activities in Bars view */}
                        {isExpanded && (
                          <div className="p-3 bg-slate-50/80 rounded-xl border border-blue-200 space-y-2 animate-in fade-in duration-150">
                            {cat.items.map((sub, sIdx) => {
                              const subReq69 =
                                sub.budget69 !== undefined
                                  ? sub.budget69
                                  : Math.round(sub.budget * 0.9);
                              const subAct69 =
                                sub.actual69 !== undefined
                                  ? sub.actual69
                                  : Math.round(subReq69 * 0.92);
                              const subRate69 =
                                subReq69 > 0 ? (subAct69 / subReq69) * 100 : 0;
                              const subDiffAct = sub.budget - subAct69;
                              const subDiffActPct =
                                subAct69 > 0 ? (subDiffAct / subAct69) * 100 : 0;

                              return (
                                <div
                                  key={'bar-sub-' + catKey + '-' + (sub.id || sIdx)}
                                  className="p-2.5 bg-white rounded-lg border border-slate-200 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                                >
                                  <div className="flex items-center gap-2">
                                    <span className="font-mono font-bold px-1.5 py-0.5 rounded bg-blue-100 text-blue-800 text-[10px]">
                                      {sub.id}
                                    </span>
                                    <span className="text-xs font-bold text-slate-900">
                                      {sub.activity}
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-2 text-xs font-mono">
                                    <span className="text-slate-600">
                                      ขอ 69: ฿{formatMoney(subReq69)}
                                    </span>
                                    <span className="text-amber-900">
                                      จริง 69: ฿{formatMoney(subAct69)} ({subRate69.toFixed(1)}%)
                                    </span>
                                    <span className="text-blue-950 font-black">
                                      ขอ 70: ฿{formatMoney(sub.budget)}
                                    </span>
                                    <span
                                      className={`px-1.5 py-0.5 rounded font-bold text-[10px] ${
                                        subDiffAct >= 0
                                          ? 'bg-emerald-50 text-emerald-800'
                                          : 'bg-rose-50 text-rose-800'
                                      }`}
                                    >
                                      {subDiffAct >= 0 ? '+' : ''}
                                      {formatMoney(subDiffAct)}
                                    </span>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  }))}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-3.5 border-t border-slate-100 bg-slate-50 flex items-center justify-end flex-shrink-0">
              <button
                onClick={() => setExpandedModal(null)}
                className="px-5 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-sm font-semibold transition-colors cursor-pointer"
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
