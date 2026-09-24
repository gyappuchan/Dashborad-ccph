import React, { useState, useMemo } from 'react';
import { BudgetItem } from '../types/budget';
import {
  Search,
  ChevronDown,
  ChevronRight,
  Filter,
  Download,
  Plus,
  Trash2,
  FileSpreadsheet,
  ArrowUpDown,
  Maximize2,
  Minimize2,
  Edit2,
  Check,
  X,
  SlidersHorizontal,
  TrendingUp,
  Lock,
} from 'lucide-react';

interface ProjectTableProps {
  items: BudgetItem[];
  totalExpense: number;
  totalIncome: number;
  onExportExcel: () => void;
  onAddItem?: (item: BudgetItem) => void;
  onDeleteItem?: (index: number) => void;
  onUpdateActivity?: (originalIndex: number, newActivity: string) => void;
  isAdmin?: boolean;
  onAdminLoginRequest?: (actionTitle?: string) => void;
}

export const ProjectTable: React.FC<ProjectTableProps> = ({
  items,
  totalExpense,
  totalIncome,
  onExportExcel,
  onAddItem,
  onDeleteItem,
  onUpdateActivity,
  isAdmin = false,
  onAdminLoginRequest,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [sortOrder, setSortOrder] = useState<'default' | 'desc' | 'asc'>('default');
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({});
  const [showThreePillars, setShowThreePillars] = useState<boolean>(true);

  // Inline editing state for activity title
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editingText, setEditingText] = useState<string>('');

  // Add new activity modal/form state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newActivityName, setNewActivityName] = useState('');
  const [newActivityCode, setNewActivityCode] = useState('');
  const [newActivityBudget, setNewActivityBudget] = useState('');
  const [newActivityReq69, setNewActivityReq69] = useState('');
  const [newActivityAct69, setNewActivityAct69] = useState('');
  const [newActivityCategory, setNewActivityCategory] = useState('');

  const formatMoney = (num: number) =>
    new Intl.NumberFormat('th-TH', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(num || 0);

  // Group items by category
  const categoriesList = useMemo(() => {
    const set = new Set<string>();
    items.forEach((item) => {
      if (item.parentName) set.add(item.parentName);
    });
    return Array.from(set);
  }, [items]);

  // Toggle group expansion
  const toggleGroup = (groupId: string) => {
    setCollapsedGroups((prev) => ({
      ...prev,
      [groupId]: !prev[groupId],
    }));
  };

  const collapseAll = () => {
    const newCollapsed: Record<string, boolean> = {};
    let gId = 0;
    items.forEach((item) => {
      if (item.isMain) {
        gId++;
        newCollapsed[`group-${gId}`] = true;
      }
    });
    setCollapsedGroups(newCollapsed);
  };

  const expandAll = () => {
    setCollapsedGroups({});
  };

  // Prepare grouped data structure for structured rendering
  const structuredData = useMemo(() => {
    interface Group {
      groupId: string;
      mainItem: BudgetItem;
      subItems: { item: BudgetItem; originalIndex: number }[];
      groupTotal: number;
      groupReq69: number;
      groupAct69: number;
    }

    const groups: Group[] = [];
    let currentGroup: Group | null = null;
    let groupIdCounter = 0;

    items.forEach((item, index) => {
      if (item.isMain) {
        groupIdCounter++;
        currentGroup = {
          groupId: `group-${groupIdCounter}`,
          mainItem: item,
          subItems: [],
          groupTotal: 0,
          groupReq69: 0,
          groupAct69: 0,
        };
        groups.push(currentGroup);
      } else {
        if (!currentGroup) {
          // Fallback if first item wasn't main
          groupIdCounter++;
          currentGroup = {
            groupId: `group-${groupIdCounter}`,
            mainItem: {
              id: '-',
              activity: item.parentName || 'หมวดหมู่ทั่วไป',
              budget: 0,
              isMain: true,
              parentName: item.parentName || 'หมวดหมู่ทั่วไป',
            },
            subItems: [],
            groupTotal: 0,
            groupReq69: 0,
            groupAct69: 0,
          };
          groups.push(currentGroup);
        }
        currentGroup.subItems.push({ item, originalIndex: index });
        currentGroup.groupTotal += item.budget;
        currentGroup.groupReq69 += item.budget69 || 0;
        currentGroup.groupAct69 += item.actual69 || 0;
      }
    });

    return groups;
  }, [items]);

  // Filter and sort
  const filteredGroups = useMemo(() => {
    return structuredData
      .filter((group) => {
        if (selectedCategory !== 'all' && group.mainItem.parentName !== selectedCategory) {
          return false;
        }
        return true;
      })
      .map((group) => {
        let filteredSubs = group.subItems.filter(({ item }) => {
          if (!searchTerm.trim()) return true;
          const term = searchTerm.toLowerCase();
          return (
            item.activity.toLowerCase().includes(term) ||
            item.id.toLowerCase().includes(term) ||
            group.mainItem.activity.toLowerCase().includes(term)
          );
        });

        if (sortOrder === 'desc') {
          filteredSubs = [...filteredSubs].sort((a, b) => b.item.budget - a.item.budget);
        } else if (sortOrder === 'asc') {
          filteredSubs = [...filteredSubs].sort((a, b) => a.item.budget - b.item.budget);
        }

        return {
          ...group,
          subItems: filteredSubs,
        };
      })
      .filter((group) => {
        // Keep group if search matched main category or has matching subs
        if (!searchTerm.trim()) return true;
        const term = searchTerm.toLowerCase();
        const mainMatches =
          group.mainItem.activity.toLowerCase().includes(term) ||
          group.mainItem.id.toLowerCase().includes(term);
        return mainMatches || group.subItems.length > 0;
      });
  }, [structuredData, selectedCategory, searchTerm, sortOrder]);

  const totalVisibleSubItems = useMemo(() => {
    return filteredGroups.reduce((acc, g) => acc + g.subItems.length, 0);
  }, [filteredGroups]);

  const totalFilteredBudget70 = useMemo(() => {
    return filteredGroups.reduce(
      (acc, g) => acc + g.subItems.reduce((subAcc, s) => subAcc + s.item.budget, 0),
      0
    );
  }, [filteredGroups]);

  const totalFilteredReq69 = useMemo(() => {
    return filteredGroups.reduce(
      (acc, g) => acc + g.subItems.reduce((subAcc, s) => subAcc + (s.item.budget69 || 0), 0),
      0
    );
  }, [filteredGroups]);

  const totalFilteredAct69 = useMemo(() => {
    return filteredGroups.reduce(
      (acc, g) => acc + g.subItems.reduce((subAcc, s) => subAcc + (s.item.actual69 || 0), 0),
      0
    );
  }, [filteredGroups]);

  let runningSubIndex = 1;

  return (
    <div className="space-y-4">
      {/* Header and Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 flex items-center gap-2.5">
            <FileSpreadsheet className="w-6 h-6 text-blue-700 flex-shrink-0" />
            3. รายละเอียดโครงการและการเปรียบเทียบงบประมาณ (2569 vs 2570)
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 mt-0.5">
            คลิกที่แถบสีฟ้าเพื่อย่อ/ขยาย หรือกดปุ่ม &quot;สลับมุมมอง&quot; เพื่อดูการเปรียบเทียบ 3 มิติ
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Toggle 3 Pillars */}
          <button
            onClick={() => setShowThreePillars(!showThreePillars)}
            className={`text-xs sm:text-sm font-bold px-3 py-1.5 rounded-lg border transition-colors flex items-center gap-1.5 shadow-2xs cursor-pointer ${
              showThreePillars
                ? 'bg-blue-700 text-white border-blue-700 hover:bg-blue-800'
                : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
            }`}
            title="กดเพื่อเปิด/ปิดคอลัมน์เปรียบเทียบคำขอ 69 และจ่ายจริง 69"
          >
            <SlidersHorizontal className="w-4 h-4" />
            <span>{showThreePillars ? 'แสดง 3 ด้าน (เปิดอยู่)' : 'แสดงเฉพาะงบปี 70'}</span>
          </button>

          <button
            onClick={expandAll}
            className="text-xs sm:text-sm font-semibold text-slate-700 hover:text-slate-900 bg-white hover:bg-slate-100 border border-slate-300 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
            title="ขยายทั้งหมด"
          >
            <Maximize2 className="w-4 h-4" /> ขยายทั้งหมด
          </button>

          <button
            onClick={collapseAll}
            className="text-xs sm:text-sm font-semibold text-slate-700 hover:text-slate-900 bg-white hover:bg-slate-100 border border-slate-300 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
            title="ย่อทั้งหมด"
          >
            <Minimize2 className="w-4 h-4" /> ย่อทั้งหมด
          </button>

          <button
            onClick={onExportExcel}
            className="text-xs sm:text-sm font-bold text-emerald-800 hover:text-white bg-emerald-100 hover:bg-emerald-700 border border-emerald-300 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 shadow-2xs cursor-pointer"
          >
            <Download className="w-4 h-4" /> ส่งออก Excel
          </button>

          {onAddItem && isAdmin && (
            <button
              onClick={() => {
                const defaultCat = categoriesList[0] || 'อนุสภาด้านวิชาการและการพัฒนามาตรฐานวิชาชีพ';
                setNewActivityCategory(defaultCat);
                setNewActivityCode('70' + Math.floor(1000 + Math.random() * 9000));
                setNewActivityName('');
                setNewActivityBudget('');
                setNewActivityReq69('');
                setNewActivityAct69('');
                setIsAddModalOpen(true);
              }}
              className="text-xs sm:text-sm font-bold text-white bg-blue-700 hover:bg-blue-800 border border-blue-700 px-3.5 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 shadow-2xs cursor-pointer"
              title="เพิ่มรายการกิจกรรมใหม่ (สิทธิ์ Admin)"
            >
              <Plus className="w-4 h-4" />
              <span>เพิ่มรายการกิจกรรม</span>
            </button>
          )}
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-3.5 rounded-xl border border-slate-200 flex flex-col sm:flex-row items-center gap-3 shadow-2xs">
        {/* Search */}
        <div className="relative flex-1 w-full">
          <Search className="w-5 h-5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="ค้นหาตามรหัสโครงการ หรือชื่อกิจกรรม..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-12 py-2 text-sm text-slate-900 font-medium bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white transition-all placeholder:text-slate-400"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-600 hover:text-slate-900 bg-slate-200 px-2 py-0.5 rounded cursor-pointer"
            >
              ล้าง
            </button>
          )}
        </div>

        {/* Category filter */}
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="w-4 h-4 text-slate-500 flex-shrink-0" />
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="text-sm font-semibold text-slate-800 bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-600 w-full sm:w-56 truncate cursor-pointer"
          >
            <option value="all">ทุกหมวดหมู่ / อนุสภา</option>
            {categoriesList.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>

        {/* Sort */}
        <div className="flex items-center gap-1.5 w-full sm:w-auto">
          <ArrowUpDown className="w-4 h-4 text-slate-500 flex-shrink-0" />
          <select
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value as any)}
            className="text-sm font-semibold text-slate-800 bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-600 w-full sm:w-auto cursor-pointer"
          >
            <option value="default">ลำดับตามไฟล์</option>
            <option value="desc">งบประมาณ: สูงสุดไปต่ำสุด</option>
            <option value="asc">งบประมาณ: ต่ำสุดไปสูงสุด</option>
          </select>
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[950px]">
            <thead>
              <tr className="bg-slate-100 border-b-2 border-slate-200 text-slate-800 text-xs sm:text-sm uppercase tracking-wide font-extrabold">
                <th className="px-4 py-4 w-16 text-center">ลำดับ</th>
                <th className="px-4 py-4 w-32">รหัสโครงการ</th>
                <th className="px-4 py-4">รายการกิจกรรม / แผนงาน</th>
                {showThreePillars && (
                  <>
                    <th className="px-4 py-4 text-right w-44 bg-slate-200/50">
                      1. คำขอ 2569 (บาท)
                    </th>
                    <th className="px-4 py-4 text-right w-48 bg-amber-100/60 text-amber-950">
                      2. จ่ายจริง 2569 (บาท)
                    </th>
                  </>
                )}
                <th className="px-4 py-4 text-right w-48 bg-blue-100/60 text-blue-950">
                  {showThreePillars ? '3. คำขอ 2570 (บาท)' : 'งบประมาณ ปี 70 (บาท)'}
                </th>
                {showThreePillars && (
                  <th className="px-4 py-4 text-right w-40 bg-emerald-50 text-emerald-950">
                    เทียบจ่ายจริง 69
                  </th>
                )}
                {onDeleteItem && isAdmin && <th className="px-3 py-4 w-10 text-center"></th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {filteredGroups.length === 0 ? (
                <tr>
                  <td
                    colSpan={(showThreePillars ? 6 : 4) + (onDeleteItem && isAdmin ? 1 : 0)}
                    className="px-6 py-12 text-center text-slate-400 bg-slate-50/50"
                  >
                    <FileSpreadsheet className="w-10 h-10 mx-auto text-slate-300 mb-2" />
                    <p className="font-medium text-slate-600">ไม่พบรายการที่ตรงกับเงื่อนไขการค้นหา</p>
                    <p className="text-xs text-slate-400 mt-1">
                      ลองเปลี่ยนคำค้นหา หรือกดเลือก &quot;ทุกหมวดหมู่&quot;
                    </p>
                  </td>
                </tr>
              ) : (
                filteredGroups.map((group) => {
                  const isCollapsed = !!collapsedGroups[group.groupId];
                  const grpB70 = group.groupTotal || group.mainItem.budget;
                  const grpReq69 = group.groupReq69 || group.mainItem.budget69 || 0;
                  const grpAct69 = group.groupAct69 || group.mainItem.actual69 || 0;
                  const grpDiffVsAct = grpB70 - grpAct69;

                  return (
                    <React.Fragment key={group.groupId}>
                      {/* Main Category Header Row */}
                      <tr
                        onClick={() => toggleGroup(group.groupId)}
                        className="bg-blue-50/95 border-y-2 border-blue-200 cursor-pointer hover:bg-blue-100/90 transition-colors select-none"
                      >
                        <td colSpan={3} className="px-4 py-3.5 font-bold text-blue-950">
                          <div className="flex items-center gap-3">
                            <span
                              className={`transition-transform duration-200 text-blue-800 ${
                                isCollapsed ? '-rotate-90' : 'rotate-0'
                              }`}
                            >
                              <ChevronDown className="w-5 h-5" />
                            </span>
                            <span className="px-2.5 py-1 bg-blue-800 text-white rounded-md text-xs font-mono font-bold shadow-2xs">
                              รหัส {group.mainItem.id}
                            </span>
                            <span className="text-base font-extrabold tracking-tight text-slate-900">
                              {group.mainItem.activity}
                            </span>
                            <span className="text-xs text-blue-800 font-semibold ml-1.5 bg-blue-100/80 px-2 py-0.5 rounded-full">
                              ({group.subItems.length} รายการ)
                            </span>
                          </div>
                        </td>

                        {showThreePillars && (
                          <>
                            {/* Group Req 69 */}
                            <td className="px-4 py-3.5 text-right font-bold text-slate-700 text-sm font-mono tabular-nums bg-slate-200/40">
                              ฿ {formatMoney(grpReq69)}
                            </td>
                            {/* Group Act 69 */}
                            <td className="px-4 py-3.5 text-right font-extrabold text-amber-950 text-sm font-mono tabular-nums bg-amber-100/40">
                              ฿ {formatMoney(grpAct69)}
                              <span className="block text-[11px] font-semibold text-amber-800">
                                ({grpReq69 > 0 ? ((grpAct69 / grpReq69) * 100).toFixed(1) : 0}%)
                              </span>
                            </td>
                          </>
                        )}

                        {/* Group Req 70 */}
                        <td className="px-4 py-3.5 text-right font-black text-blue-950 text-base font-mono tabular-nums bg-blue-100/40">
                          ฿ {formatMoney(grpB70)}
                        </td>

                        {showThreePillars && (
                          <td
                            className={`px-4 py-3.5 text-right font-extrabold font-mono tabular-nums text-xs ${
                              grpDiffVsAct >= 0 ? 'text-emerald-800' : 'text-rose-800'
                            }`}
                          >
                            {grpDiffVsAct >= 0 ? '+' : ''}
                            {formatMoney(grpDiffVsAct)}
                          </td>
                        )}

                        {onDeleteItem && <td className="px-3 py-3.5"></td>}
                      </tr>

                      {/* Sub-item rows */}
                      {!isCollapsed &&
                        group.subItems.map(({ item, originalIndex }) => {
                          const currentIndex = runningSubIndex++;
                          const pctOfGroup =
                            group.groupTotal > 0 ? (item.budget / group.groupTotal) * 100 : 0;
                          const b69 = item.budget69 || 0;
                          const act69 = item.actual69 || 0;
                          const diffVsAct = item.budget - act69;
                          const disbursePct = b69 > 0 ? (act69 / b69) * 100 : 0;

                          return (
                            <tr
                              key={`${item.id}-${item.activity}-${originalIndex}`}
                              className="hover:bg-slate-50 transition-colors bg-white group"
                            >
                              <td className="px-4 py-3 text-slate-500 text-center font-mono text-sm">
                                {currentIndex}
                              </td>
                              <td className="px-4 py-3">
                                <span className="font-mono text-sm font-semibold text-slate-800 bg-slate-100 px-2.5 py-1 rounded-md border border-slate-200">
                                  {item.id}
                                </span>
                              </td>
                              <td className="px-4 py-3">
                                {editingIndex === originalIndex ? (
                                  <div className="flex items-center gap-1.5 py-1">
                                    <input
                                      type="text"
                                      value={editingText}
                                      onChange={(e) => setEditingText(e.target.value)}
                                      onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                          if (editingText.trim() && onUpdateActivity) {
                                            onUpdateActivity(originalIndex, editingText.trim());
                                          }
                                          setEditingIndex(null);
                                        } else if (e.key === 'Escape') {
                                          setEditingIndex(null);
                                        }
                                      }}
                                      className="flex-1 px-3 py-1.5 text-sm border-2 border-blue-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                                      autoFocus
                                    />
                                    <button
                                      onClick={() => {
                                        if (editingText.trim() && onUpdateActivity) {
                                          onUpdateActivity(originalIndex, editingText.trim());
                                        }
                                        setEditingIndex(null);
                                      }}
                                      className="p-1.5 text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors cursor-pointer"
                                      title="บันทึกชื่อกิจกรรม"
                                    >
                                      <Check className="w-4 h-4" />
                                    </button>
                                    <button
                                      onClick={() => setEditingIndex(null)}
                                      className="p-1.5 text-slate-600 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
                                      title="ยกเลิก"
                                    >
                                      <X className="w-4 h-4" />
                                    </button>
                                  </div>
                                ) : (
                                  <div className="flex items-start justify-between gap-2 group/act">
                                    <div>
                                      <div className="font-semibold text-slate-900 text-sm leading-relaxed flex items-center gap-2">
                                        <span>{item.activity}</span>
                                        {onUpdateActivity && isAdmin && (
                                          <button
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              setEditingIndex(originalIndex);
                                              setEditingText(item.activity);
                                            }}
                                            className="opacity-0 group-hover/act:opacity-100 hover:opacity-100 text-slate-400 hover:text-blue-600 transition-opacity p-1 rounded cursor-pointer"
                                            title="แก้ไข/เปลี่ยนชื่อรายการกิจกรรม"
                                          >
                                            <Edit2 className="w-4 h-4" />
                                          </button>
                                        )}
                                      </div>
                                      <div className="text-xs text-slate-500 flex items-center gap-2 mt-0.5">
                                        <span>{group.mainItem.activity}</span>
                                        <span>·</span>
                                        <span className="font-medium text-blue-700">
                                          {pctOfGroup.toFixed(1)}% ของหมวด
                                        </span>
                                      </div>
                                    </div>
                                  </div>
                                )}
                              </td>

                              {showThreePillars && (
                                <>
                                  {/* Col 1: คำขอ 69 */}
                                  <td className="px-4 py-3 text-right font-medium text-slate-700 font-mono tabular-nums text-sm bg-slate-50/50">
                                    {b69 > 0 ? `฿ ${formatMoney(b69)}` : '-'}
                                  </td>

                                  {/* Col 2: จ่ายจริง 69 */}
                                  <td className="px-4 py-3 text-right font-semibold text-amber-950 font-mono tabular-nums text-sm bg-amber-50/30">
                                    {act69 > 0 ? (
                                      <div>
                                        <span>฿ {formatMoney(act69)}</span>
                                        {b69 > 0 && (
                                          <span className="block text-[11px] text-amber-800 font-bold">
                                            ({disbursePct.toFixed(1)}%)
                                          </span>
                                        )}
                                      </div>
                                    ) : (
                                      '-'
                                    )}
                                  </td>
                                </>
                              )}

                              {/* Col 3: คำขอ 70 */}
                              <td className="px-4 py-3 text-right font-bold text-slate-900 font-mono tabular-nums text-sm bg-blue-50/20">
                                ฿ {formatMoney(item.budget)}
                              </td>

                              {showThreePillars && (
                                <td
                                  className={`px-4 py-3 text-right font-mono tabular-nums text-xs font-semibold ${
                                    diffVsAct >= 0 ? 'text-emerald-700' : 'text-rose-700'
                                  }`}
                                >
                                  {act69 > 0 ? (
                                    <>
                                      {diffVsAct >= 0 ? '+' : ''}
                                      {formatMoney(diffVsAct)}
                                    </>
                                  ) : (
                                    '-'
                                  )}
                                </td>
                              )}

                              {onDeleteItem && isAdmin && (
                                <td className="px-3 py-3 text-center">
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      if (confirm(`คุณต้องการลบรายการ "${item.activity}" ใช่หรือไม่?`)) {
                                        onDeleteItem(originalIndex);
                                      }
                                    }}
                                    className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-rose-600 transition-opacity p-1 cursor-pointer"
                                    title="ลบรายการ"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
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

            {/* Table Footer: Grand Total */}
            <tfoot className="bg-slate-100 border-t-2 border-slate-300">
              <tr>
                <td colSpan={3} className="px-4 py-4 text-right font-extrabold text-slate-800 text-sm sm:text-base">
                  รวมงบประมาณรายจ่ายทั้งสิ้น (นับเฉพาะรายการย่อย) :
                </td>
                {showThreePillars && (
                  <>
                    <td className="px-4 py-4 text-right font-bold text-slate-800 text-sm sm:text-base font-mono tabular-nums bg-slate-200/50">
                      ฿ {formatMoney(totalFilteredReq69)}
                    </td>
                    <td className="px-4 py-4 text-right font-extrabold text-amber-950 text-sm sm:text-base font-mono tabular-nums bg-amber-100/50">
                      ฿ {formatMoney(totalFilteredAct69)}
                      <span className="block text-xs font-bold text-amber-800">
                        ({totalFilteredReq69 > 0 ? ((totalFilteredAct69 / totalFilteredReq69) * 100).toFixed(1) : 0}%)
                      </span>
                    </td>
                  </>
                )}
                <td className="px-4 py-4 text-right font-black text-rose-700 text-base sm:text-lg font-mono tabular-nums bg-blue-100/50">
                  ฿ {formatMoney(totalFilteredBudget70)}
                </td>
                {showThreePillars && (
                  <td
                    className={`px-4 py-4 text-right font-bold font-mono tabular-nums text-xs sm:text-sm ${
                      totalFilteredBudget70 >= totalFilteredAct69 ? 'text-emerald-800' : 'text-rose-800'
                    }`}
                  >
                    {totalFilteredBudget70 >= totalFilteredAct69 ? '+' : ''}
                    {formatMoney(totalFilteredBudget70 - totalFilteredAct69)}
                  </td>
                )}
                {onDeleteItem && isAdmin && <td></td>}
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* Add New Activity Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50">
              <div className="flex items-center gap-2">
                <Plus className="w-5 h-5 text-blue-700" />
                <h3 className="font-bold text-slate-800 text-base">เพิ่มรายการกิจกรรมใหม่</h3>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-200/60 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!newActivityName.trim()) {
                  alert('กรุณากรอกชื่อรายการกิจกรรม');
                  return;
                }
                const budgetNum = parseFloat(newActivityBudget.replace(/,/g, '')) || 0;
                const req69Num = parseFloat(newActivityReq69.replace(/,/g, '')) || undefined;
                const act69Num = parseFloat(newActivityAct69.replace(/,/g, '')) || undefined;

                if (onAddItem) {
                  onAddItem({
                    id: newActivityCode.trim() || '70' + Math.floor(1000 + Math.random() * 9000),
                    activity: newActivityName.trim(),
                    budget: budgetNum,
                    isMain: false,
                    parentName: newActivityCategory,
                    budget69: req69Num,
                    actual69: act69Num,
                  });
                }
                setIsAddModalOpen(false);
                setNewActivityName('');
                setNewActivityBudget('');
                setNewActivityReq69('');
                setNewActivityAct69('');
              }}
              className="p-6 space-y-4 text-xs text-slate-700"
            >
              <div>
                <label className="block font-semibold text-slate-800 mb-1.5">
                  เลือกหมวดหมู่ / อนุสภา <span className="text-rose-500">*</span>
                </label>
                <select
                  value={newActivityCategory}
                  onChange={(e) => setNewActivityCategory(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white cursor-pointer"
                  required
                >
                  {categoriesList.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-800 mb-1.5">
                  ชื่อรายการกิจกรรม / แผนงาน <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="เช่น โครงการพัฒนาทักษะวิชาชีพการสาธารณสุขชุมชน..."
                  value={newActivityName}
                  onChange={(e) => setNewActivityName(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                  autoFocus
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-800 mb-1.5">
                    รหัสกิจกรรม (Code)
                  </label>
                  <input
                    type="text"
                    placeholder="เช่น 700109"
                    value={newActivityCode}
                    onChange={(e) => setNewActivityCode(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-blue-900 mb-1.5">
                    3. คำขอปี 2570 (บาท) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="1000"
                    placeholder="เช่น 500000"
                    value={newActivityBudget}
                    onChange={(e) => setNewActivityBudget(e.target.value)}
                    className="w-full px-3 py-2 text-xs border-2 border-blue-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
                <div>
                  <label className="block font-medium text-slate-700 mb-1.5">
                    1. คำขอปี 2569 (บาท) <span className="text-slate-400">(ไม่บังคับ)</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="1000"
                    placeholder="เช่น 450000"
                    value={newActivityReq69}
                    onChange={(e) => setNewActivityReq69(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-500 font-mono bg-white"
                  />
                </div>
                <div>
                  <label className="block font-medium text-amber-900 mb-1.5">
                    2. จ่ายจริงปี 2569 (บาท) <span className="text-slate-400">(ไม่บังคับ)</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="1000"
                    placeholder="เช่น 420000"
                    value={newActivityAct69}
                    onChange={(e) => setNewActivityAct69(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-amber-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 font-mono bg-white"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors font-medium cursor-pointer"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-semibold shadow-xs flex items-center gap-1.5 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  บันทึกรายการ
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
