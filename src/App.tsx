/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useCallback } from 'react';
import { BudgetItem, CategorySummary, RevenueItem, ParseAuditReport } from './types/budget';
import { INITIAL_SAMPLE_DATA, INITIAL_SAMPLE_REVENUE } from './data/sampleData';
import { parseExcelData, parseRevenueExcel, parseFY69Excel, parseActual69Excel, parseReq69Excel } from './utils/excelParser';
import { downloadExcelTemplate, exportCurrentDataToExcel } from './utils/excelExport';
import { Navbar } from './components/Navbar';
import { ExecutiveSummary } from './components/ExecutiveSummary';
import { CoreDashboardViews } from './components/CoreDashboardViews';
import { BudgetCharts } from './components/BudgetCharts';
import { ProjectTable } from './components/ProjectTable';
import { ExcelGuideModal } from './components/ExcelGuideModal';
import { RevenueModal } from './components/RevenueModal';
import { DataHubModal } from './components/DataHubModal';
import { AdminLoginModal } from './components/AdminLoginModal';
import { FileAuditModal } from './components/FileAuditModal';
import {
  AlertTriangle,
  FileSpreadsheet,
  CheckCircle2,
  X,
  UploadCloud,
  FileUp,
  Info,
  Type,
  Receipt,
  Layers,
  ShieldCheck,
  Lock,
} from 'lucide-react';

export default function App() {
  const [items, setItems] = useState<BudgetItem[]>(INITIAL_SAMPLE_DATA);
  const [revenueItems, setRevenueItems] = useState<RevenueItem[]>(INITIAL_SAMPLE_REVENUE);
  const [income, setIncome] = useState<number>(25000000);
  const [dataSourceName, setDataSourceName] = useState<string>('ข้อมูลตัวอย่าง (สภาการสาธารณสุขชุมชน)');
  const [warnings, setWarnings] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isGuideOpen, setIsGuideOpen] = useState<boolean>(false);
  const [isRevenueModalOpen, setIsRevenueModalOpen] = useState<boolean>(false);
  const [isDataHubOpen, setIsDataHubOpen] = useState<boolean>(false);
  const [isLargeFont, setIsLargeFont] = useState<boolean>(false);
  const [isDragOver, setIsDragOver] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isSampleData, setIsSampleData] = useState<boolean>(true);

  // Excel Audit & Reconciliation State
  const [auditReports, setAuditReports] = useState<{
    revenue70?: ParseAuditReport;
    actual69?: ParseAuditReport;
    req69?: ParseAuditReport;
    budget70?: ParseAuditReport;
  }>({});
  const [isFileAuditOpen, setIsFileAuditOpen] = useState<boolean>(false);
  const [fileAuditTab, setFileAuditTab] = useState<'revenue70' | 'actual69' | 'req69' | 'budget70'>('revenue70');

  const handleOpenAudit = useCallback((tab: 'revenue70' | 'actual69' | 'req69' | 'budget70' = 'revenue70') => {
    setFileAuditTab(tab);
    setIsFileAuditOpen(true);
  }, []);

  // Admin authentication state (CCPHDB / ccph234)
  const [isAdmin, setIsAdmin] = useState<boolean>(() => {
    return sessionStorage.getItem('ccph_admin_authenticated') === 'true';
  });
  const [isAdminLoginOpen, setIsAdminLoginOpen] = useState<boolean>(false);
  const [adminActionTitle, setAdminActionTitle] = useState<string>('');
  const [pendingAdminAction, setPendingAdminAction] = useState<(() => void) | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((curr) => (curr === msg ? null : curr));
    }, 4500);
  };

  const handleAdminLoginRequest = useCallback((actionTitle?: string, callback?: () => void) => {
    setAdminActionTitle(actionTitle || '');
    setPendingAdminAction(() => (callback ? callback : null));
    setIsAdminLoginOpen(true);
  }, []);

  const handleAdminLoginSuccess = useCallback(() => {
    setIsAdmin(true);
    sessionStorage.setItem('ccph_admin_authenticated', 'true');
    setIsAdminLoginOpen(false);
    showToast('เข้าสู่ระบบผู้ดูแลระบบ (Admin: CCPHDB) สำเร็จ ปลดล็อคสิทธิ์นำเข้าและแก้ไขข้อมูลแล้ว');
    if (pendingAdminAction) {
      const cb = pendingAdminAction;
      setPendingAdminAction(null);
      cb();
    }
  }, [pendingAdminAction]);

  const handleAdminLogout = useCallback(() => {
    setIsAdmin(false);
    sessionStorage.removeItem('ccph_admin_authenticated');
    showToast('ออกจากระบบผู้ดูแลระบบเรียบร้อยแล้ว (สลับเป็นโหมดดูข้อมูลทั่วไป)');
  }, []);

  const formatMoney = (num: number) =>
    new Intl.NumberFormat('th-TH', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(num || 0);

  // Keep total income aligned with revenue items if present
  const totalRevenueCalculated = useMemo(() => {
    if (revenueItems.length === 0) return income;
    return revenueItems.reduce((sum, item) => sum + item.amount, 0);
  }, [revenueItems, income]);

  // Calculate total expense from sub-items only
  const totalExpense = useMemo(() => {
    return items.reduce((sum, item) => {
      if (!item.isMain) {
        return sum + item.budget;
      }
      return sum;
    }, 0);
  }, [items]);

  const itemCount = useMemo(() => {
    return items.filter((item) => !item.isMain).length;
  }, [items]);

  const totalReq69 = useMemo(() => {
    return items.reduce((sum, item) => (!item.isMain ? sum + (item.budget69 || 0) : sum), 0);
  }, [items]);

  const totalActual69 = useMemo(() => {
    return items.reduce((sum, item) => (!item.isMain ? sum + (item.actual69 || 0) : sum), 0);
  }, [items]);

  // Aggregate category summaries for charts
  const categorySummaries = useMemo<CategorySummary[]>(() => {
    const map = new Map<
      string,
      {
        id: string;
        name: string;
        total: number;
        count: number;
        items: BudgetItem[];
        budget69: number;
        actual69: number;
      }
    >();

    items.forEach((item) => {
      if (!item.isMain) {
        const parent = item.parentName || 'หมวดหมู่ทั่วไป';
        const existing = map.get(parent) || {
          id: item.parentId || '',
          name: parent,
          total: 0,
          count: 0,
          items: [],
          budget69: 0,
          actual69: 0,
        };
        existing.total += item.budget;
        existing.count += 1;
        existing.items.push(item);
        existing.budget69 += item.budget69 || 0;
        existing.actual69 += item.actual69 || 0;
        map.set(parent, existing);
      }
    });

    // Also include any committees that have revenue from file even if they haven't submitted expenses yet
    revenueItems.forEach((rev) => {
      if (!rev.anuName) return;
      const anu = rev.anuName.trim();
      let found = false;
      map.forEach((existing) => {
        const normAnu = anu.toLowerCase();
        const normCat = existing.name.toLowerCase();
        if (normAnu.includes(normCat) || normCat.includes(normAnu)) {
          found = true;
        }
      });

      if (!found && !anu.includes('ส่วนกลาง')) {
        map.set(anu, {
          id: `rev-anu-${map.size + 1}`,
          name: anu,
          total: 0,
          count: 0,
          items: [],
          budget69: 0,
          actual69: 0,
        });
      }
    });

    const colors = [
      '#3b82f6', // Blue 500
      '#10b981', // Emerald 500
      '#f59e0b', // Amber 500
      '#8b5cf6', // Violet 500
      '#06b6d4', // Cyan 500
      '#ef4444', // Red 500
      '#f43f5e', // Rose 500
      '#84cc16', // Lime 500
      '#6366f1', // Indigo 500
      '#14b8a6', // Teal 500
    ];

    let totalAll = 0;
    map.forEach((c) => {
      totalAll += c.total;
    });

    let colorIdx = 0;
    const list: CategorySummary[] = [];
    map.forEach((val) => {
      // Match revenue for this committee
      const matchedRev = revenueItems.filter((rev) => {
        if (!rev.anuName) return false;
        const normAnu = rev.anuName.trim().toLowerCase();
        const normCat = val.name.trim().toLowerCase();
        return normAnu.includes(normCat) || normCat.includes(normAnu);
      });
      const catRevenue = matchedRev.reduce((sum, r) => sum + r.amount, 0);

      list.push({
        id: val.id,
        name: val.name,
        totalBudget: val.total,
        itemCount: val.count,
        items: val.items,
        budget69: val.budget69,
        actual69: val.actual69,
        color: colors[colorIdx % colors.length],
        percentage: totalAll > 0 ? (val.total / totalAll) * 100 : 0,
        revenue70: catRevenue,
        revenueItems: matchedRev,
      });
      colorIdx++;
    });

    return list;
  }, [items, revenueItems]);

  // Handle main Budget Excel file processing
  const processFile = useCallback((file: File) => {
    setIsLoading(true);
    setWarnings([]);

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const buffer = e.target?.result as ArrayBuffer;
        if (!buffer) throw new Error('ไม่สามารถอ่านไฟล์ได้');

        const result = parseExcelData(buffer, file.name);

        if (result.data.length === 0) {
          throw new Error('ไม่พบข้อมูลรายการโครงการในไฟล์ Excel');
        }

        setItems(result.data);
        setDataSourceName(`ไฟล์: ${file.name}`);
        setWarnings(result.warnings);
        setIsSampleData(false);
        if (result.audit) {
          setAuditReports((prev) => ({ ...prev, budget70: result.audit }));
        }

        const subCount = result.data.filter((d: BudgetItem) => !d.isMain).length;
        showToast(
          `นำเข้าสำเร็จ: พบ ${subCount} รายการกิจกรรมคำขอ 2570 (คลิก "ตรวจสอบที่มาตัวเลข" เพื่อดูรายงานแจกแจงรายแถว)`
        );
      } catch (err: any) {
        console.error(err);
        alert(`เกิดข้อผิดพลาดในการอ่านไฟล์: ${err.message || err}`);
      } finally {
        setIsLoading(false);
      }
    };

    reader.onerror = () => {
      alert('เกิดข้อผิดพลาดขณะโหลดไฟล์');
      setIsLoading(false);
    };

    reader.readAsArrayBuffer(file);
  }, []);

  // Handle Revenue 70 Excel File processing
  const handleUploadRevenueFile = useCallback((file: File) => {
    setIsLoading(true);
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const buffer = e.target?.result as ArrayBuffer;
        if (!buffer) throw new Error('ไม่สามารถอ่านไฟล์รายได้ได้');

        const result = parseRevenueExcel(buffer, file.name);
        if (result.items.length === 0) {
          throw new Error('ไม่พบรายการประมาณการรายได้ในไฟล์ที่เลือก');
        }

        setRevenueItems(result.items);
        setIncome(result.totalRevenue);
        if (result.audit) {
          setAuditReports((prev) => ({ ...prev, revenue70: result.audit }));
        }

        showToast(
          `นำเข้าประมาณการรายได้ 2570 สำเร็จ: ${result.items.length} รายการ (รวม ฿${formatMoney(
            result.totalRevenue
          )}) - คลิก "ตรวจสอบที่มาตัวเลข" เพื่อดูรายงานแจกแจงรายแถว`
        );
      } catch (err: any) {
        console.error(err);
        alert(`เกิดข้อผิดพลาดในการนำเข้าไฟล์รายได้: ${err.message || err}`);
      } finally {
        setIsLoading(false);
      }
    };
    reader.readAsArrayBuffer(file);
  }, []);

  // Helper to normalize activity names for robust matching
  const normalizeActivityName = (str: string) =>
    str
      .toLowerCase()
      .replace(/[\s\-_.\(\)\[\]]/g, '')
      .replace(/^[\d.]+/g, '')
      .replace(/โครงการ/g, '')
      .replace(/กิจกรรม/g, '')
      .trim();

  // Handle FY69 (All 69 Data) File processing
  const handleUploadFY69File = useCallback(
    (file: File) => {
      setIsLoading(true);
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const buffer = e.target?.result as ArrayBuffer;
          if (!buffer) throw new Error('ไม่สามารถอ่านไฟล์ปี 2569 ได้');

          const result = parseFY69Excel(buffer, file.name);
          if (result.items.length === 0) {
            throw new Error('ไม่พบข้อมูลปี 2569 ในไฟล์ที่เลือก');
          }

          if (result.audit) {
            setAuditReports((prev) => ({ ...prev, actual69: result.audit, req69: result.audit }));
          }

          let matched = 0;
          const matchedResultKeys = new Set<string>();

          setItems((prev) => {
            if (isSampleData || prev.length === 0) {
              setIsSampleData(false);
              return result.items.map((it, idx) => ({
                id: it.id || `FY69-${idx + 1}`,
                activity: it.activity,
                budget: 0,
                isMain: false,
                parentName: it.anuName || 'สภาการสาธารณสุขชุมชน (ส่วนกลาง)',
                budget69: it.budget69,
                actual69: it.actual69,
              }));
            }

            // 1. Update matching 2570 items
            const updated = prev.map((it) => {
              if (it.isMain) return it;
              const normIt = normalizeActivityName(it.activity);

              const match = result.items.find((f) => {
                if (f.id && it.id && f.id.trim() === it.id.trim()) return true;
                const normF = normalizeActivityName(f.activity);
                if (normF && normIt && (normF === normIt || normIt.includes(normF) || normF.includes(normIt))) {
                  return true;
                }
                return false;
              });

              if (match) {
                matched++;
                matchedResultKeys.add(match.id || match.activity);
                return {
                  ...it,
                  budget69: match.budget69 !== undefined && match.budget69 > 0 ? match.budget69 : it.budget69,
                  actual69: match.actual69 !== undefined && match.actual69 > 0 ? match.actual69 : it.actual69,
                  parentName:
                    it.parentName && it.parentName !== 'หมวดหมู่ทั่วไป'
                      ? it.parentName
                      : match.anuName || it.parentName,
                };
              }
              return it;
            });

            // 2. CRITICAL: Add all items from 69 file that were NOT in 2570 as historical activities!
            const unmatched = result.items.filter(
              (f) => !matchedResultKeys.has(f.id || f.activity) && (f.actual69 > 0 || (f.budget69 && f.budget69 > 0))
            );

            const newHistorical: BudgetItem[] = unmatched.map((f, idx) => ({
              id: f.id || `HIST69-${idx + 1}`,
              activity: f.activity,
              budget: 0,
              isMain: false,
              parentName: f.anuName || 'สภาการสาธารณสุขชุมชน (ส่วนกลาง)',
              budget69: f.budget69,
              actual69: f.actual69,
            }));

            return [...updated, ...newHistorical];
          });

          const historicalCount = result.items.length - matched;
          showToast(
            `นำเข้าข้อมูลปี 2569 ครบถ้วน: ทั้งหมด ${result.items.length} รายการ (เชื่อมโยงกับคำขอปี 70 ได้ ${matched} รายการ, กิจกรรมเดิมปี 69 เพิ่มเติม ${Math.max(0, historicalCount)} รายการ, ยอดคำขอ 69 รวม ฿${formatMoney(
              result.totalReq69
            )}, จ่ายจริง 69 รวม ฿${formatMoney(result.totalActual69)})`
          );
        } catch (err: any) {
          console.error(err);
          alert(`เกิดข้อผิดพลาดในการอ่านไฟล์ข้อมูลปี 2569: ${err.message || err}`);
        } finally {
          setIsLoading(false);
        }
      };
      reader.readAsArrayBuffer(file);
    },
    [formatMoney]
  );

  // Dedicated handler for จ่ายจริง 2569
  const handleUploadActual69File = useCallback(
    (file: File) => {
      setIsLoading(true);
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const buffer = e.target?.result as ArrayBuffer;
          if (!buffer) throw new Error('ไม่สามารถอ่านไฟล์จ่ายจริง 2569 ได้');

          const result = parseActual69Excel(buffer, file.name);
          if (result.items.length === 0) {
            throw new Error('ไม่พบข้อมูลผลการจ่ายจริงปี 2569 ในไฟล์');
          }

          if (result.audit) {
            setAuditReports((prev) => ({ ...prev, actual69: result.audit }));
          }

          let matched = 0;
          const matchedResultKeys = new Set<string>();

          setItems((prev) => {
            if (isSampleData || prev.length === 0) {
              setIsSampleData(false);
              return result.items.map((it, idx) => ({
                id: it.id || `ACT69-${idx + 1}`,
                activity: it.activity,
                budget: 0,
                isMain: false,
                parentName: it.anuName || 'สภาการสาธารณสุขชุมชน (ส่วนกลาง)',
                actual69: it.actual69,
              }));
            }

            // 1. Update matched 2570 items
            const updated = prev.map((it) => {
              if (it.isMain) return it;
              const normIt = normalizeActivityName(it.activity);

              const match = result.items.find((f) => {
                if (f.id && it.id && f.id.trim() === it.id.trim()) return true;
                const normF = normalizeActivityName(f.activity);
                if (normF && normIt && (normF === normIt || normIt.includes(normF) || normF.includes(normIt))) {
                  return true;
                }
                return false;
              });

              if (match && match.actual69 > 0) {
                matched++;
                matchedResultKeys.add(match.id || match.activity);
                return {
                  ...it,
                  actual69: match.actual69,
                  parentName:
                    it.parentName && it.parentName !== 'หมวดหมู่ทั่วไป'
                      ? it.parentName
                      : match.anuName || it.parentName,
                };
              }
              return it;
            });

            // 2. CRITICAL: Add all items from จ่ายจริง 69 file that were not in 2570 as historical activities!
            const unmatched = result.items.filter(
              (f) => !matchedResultKeys.has(f.id || f.activity) && f.actual69 > 0
            );

            const newHistorical: BudgetItem[] = unmatched.map((f, idx) => ({
              id: f.id || `ACT69-HIST-${idx + 1}`,
              activity: f.activity,
              budget: 0,
              isMain: false,
              parentName: f.anuName || 'สภาการสาธารณสุขชุมชน (ส่วนกลาง)',
              actual69: f.actual69,
            }));

            return [...updated, ...newHistorical];
          });

          const historicalCount = result.items.length - matched;
          showToast(
            `นำเข้าผลจ่ายจริงปี 2569 ครบถ้วน: ทั้งหมด ${result.items.length} รายการ (เชื่อมโยงกับคำขอปี 70 ได้ ${matched} รายการ, กิจกรรมเดิมที่มีจ่ายจริง 69 เพิ่มเติม ${Math.max(0, historicalCount)} รายการ, ยอดจ่ายจริงรวม ฿${formatMoney(
              result.totalActual69
            )})`
          );
        } catch (err: any) {
          console.error(err);
          alert(`เกิดข้อผิดพลาดในการอ่านไฟล์ผลจ่ายจริง 2569: ${err.message || err}`);
        } finally {
          setIsLoading(false);
        }
      };
      reader.readAsArrayBuffer(file);
    },
    [formatMoney]
  );

  // Dedicated handler for คำของบประมาณ 2569
  const handleUploadReq69File = useCallback(
    (file: File) => {
      setIsLoading(true);
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const buffer = e.target?.result as ArrayBuffer;
          if (!buffer) throw new Error('ไม่สามารถอ่านไฟล์คำขอ 2569 ได้');

          const result = parseReq69Excel(buffer, file.name);
          if (result.items.length === 0) {
            throw new Error('ไม่พบข้อมูลคำของบประมาณปี 2569 ในไฟล์');
          }

          if (result.audit) {
            setAuditReports((prev) => ({ ...prev, req69: result.audit }));
          }

          let matched = 0;
          const matchedResultKeys = new Set<string>();

          setItems((prev) => {
            if (isSampleData || prev.length === 0) {
              setIsSampleData(false);
              return result.items.map((it, idx) => ({
                id: it.id || `REQ69-${idx + 1}`,
                activity: it.activity,
                budget: 0,
                isMain: false,
                parentName: it.anuName || 'สภาการสาธารณสุขชุมชน (ส่วนกลาง)',
                budget69: it.budget69,
              }));
            }

            // 1. Update matched 2570 items
            const updated = prev.map((it) => {
              if (it.isMain) return it;
              const normIt = normalizeActivityName(it.activity);

              const match = result.items.find((f) => {
                if (f.id && it.id && f.id.trim() === it.id.trim()) return true;
                const normF = normalizeActivityName(f.activity);
                if (normF && normIt && (normF === normIt || normIt.includes(normF) || normF.includes(normIt))) {
                  return true;
                }
                return false;
              });

              if (match && match.budget69 > 0) {
                matched++;
                matchedResultKeys.add(match.id || match.activity);
                return {
                  ...it,
                  budget69: match.budget69,
                  parentName:
                    it.parentName && it.parentName !== 'หมวดหมู่ทั่วไป'
                      ? it.parentName
                      : match.anuName || it.parentName,
                };
              }
              return it;
            });

            // 2. Add unmatched 69 requests as historical activities
            const unmatched = result.items.filter(
              (f) => !matchedResultKeys.has(f.id || f.activity) && f.budget69 > 0
            );

            const newHistorical: BudgetItem[] = unmatched.map((f, idx) => ({
              id: f.id || `REQ69-HIST-${idx + 1}`,
              activity: f.activity,
              budget: 0,
              isMain: false,
              parentName: f.anuName || 'สภาการสาธารณสุขชุมชน (ส่วนกลาง)',
              budget69: f.budget69,
            }));

            return [...updated, ...newHistorical];
          });

          const historicalCount = result.items.length - matched;
          showToast(
            `นำเข้าคำของบประมาณปี 2569 ครบถ้วน: ทั้งหมด ${result.items.length} รายการ (เชื่อมโยงกับคำขอปี 70 ได้ ${matched} รายการ, คำขอเดิมปี 69 เพิ่มเติม ${Math.max(0, historicalCount)} รายการ, ยอดคำขอ 69 รวม ฿${formatMoney(
              result.totalReq69
            )})`
          );
        } catch (err: any) {
          console.error(err);
          alert(`เกิดข้อผิดพลาดในการอ่านไฟล์คำขอ 2569: ${err.message || err}`);
        } finally {
          setIsLoading(false);
        }
      };
      reader.readAsArrayBuffer(file);
    },
    [formatMoney]
  );

  // Drag and drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (!isAdmin) {
      handleAdminLoginRequest('นำเข้าไฟล์ Excel ผ่านการลากวาง', () => {
        showToast('กรุณาลากไฟล์มาวางอีกครั้งหรือกดปุ่มนำเข้าไฟล์');
      });
      return;
    }
    const file = e.dataTransfer.files?.[0];
    if (file) {
      if (
        file.name.endsWith('.xlsx') ||
        file.name.endsWith('.xls') ||
        file.name.endsWith('.csv')
      ) {
        const lowerName = file.name.toLowerCase();
        if (lowerName.includes('รายได้') || lowerName.includes('income') || lowerName.includes('rev')) {
          handleUploadRevenueFile(file);
        } else if (lowerName.includes('จ่ายจริง') || lowerName.includes('actual') || lowerName.includes('act69')) {
          handleUploadActual69File(file);
        } else if (lowerName.includes('คำขอ') && (lowerName.includes('69') || lowerName.includes('2569'))) {
          handleUploadReq69File(file);
        } else if (lowerName.includes('69') || lowerName.includes('2569')) {
          handleUploadFY69File(file);
        } else {
          processFile(file);
        }
      } else {
        alert('กรุณาอัปโหลดไฟล์ Excel (.xlsx, .xls) หรือ CSV เท่านั้น');
      }
    }
  };

  const handleClearData = () => {
    if (!isAdmin) {
      handleAdminLoginRequest('ล้างข้อมูลในแดชบอร์ด');
      return;
    }
    if (confirm('คุณต้องการล้างข้อมูลในแดชบอร์ดทั้งหมดใช่หรือไม่?')) {
      setItems([]);
      setRevenueItems([]);
      setIncome(0);
      setDataSourceName('ไม่มีข้อมูล');
      setWarnings([]);
      setIsSampleData(false);
      setAuditReports({});
      showToast('ล้างข้อมูลเรียบร้อยแล้ว');
    }
  };

  const handleLoadSample = () => {
    if (!isAdmin) {
      handleAdminLoginRequest('โหลดข้อมูลตัวอย่าง');
      return;
    }
    setItems(INITIAL_SAMPLE_DATA);
    setRevenueItems(INITIAL_SAMPLE_REVENUE);
    setIncome(25000000);
    setDataSourceName('ข้อมูลตัวอย่าง (สภาการสาธารณสุขชุมชน)');
    setWarnings([]);
    setIsSampleData(true);
    setAuditReports({});
    showToast('โหลดข้อมูลตัวอย่างเรียบร้อยแล้ว');
  };

  const handleExportExcel = () => {
    if (items.length === 0) {
      alert('ไม่มีข้อมูลสำหรับส่งออก');
      return;
    }
    exportCurrentDataToExcel(items, totalExpense, totalRevenueCalculated);
    showToast('ส่งออกไฟล์ Excel สำเร็จ');
  };

  const handleDeleteItem = (index: number) => {
    if (!isAdmin) {
      handleAdminLoginRequest('ลบรายการกิจกรรม');
      return;
    }
    setItems((prev) => {
      const next = [...prev];
      next.splice(index, 1);
      return next;
    });
    showToast('ลบรายการเรียบร้อยแล้ว');
  };

  const handleUpdateActivity = (index: number, newActivity: string) => {
    if (!isAdmin) {
      handleAdminLoginRequest('แก้ไขชื่อรายการกิจกรรม');
      return;
    }
    setItems((prev) => {
      const next = [...prev];
      if (next[index]) {
        next[index] = {
          ...next[index],
          activity: newActivity,
        };
      }
      return next;
    });
    showToast('อัปเดตชื่อรายการกิจกรรมเรียบร้อยแล้ว');
  };

  const handleAddItem = (newItem: BudgetItem) => {
    if (!isAdmin) {
      handleAdminLoginRequest('เพิ่มรายการกิจกรรม');
      return;
    }
    setItems((prev) => {
      const targetCatIndex = prev.findIndex(
        (it) => it.isMain && it.activity === newItem.parentName
      );

      if (targetCatIndex !== -1) {
        let insertIndex = targetCatIndex + 1;
        while (insertIndex < prev.length && !prev[insertIndex].isMain) {
          insertIndex++;
        }
        const updated = [...prev];
        updated.splice(insertIndex, 0, newItem);
        return updated;
      }
      return [...prev, newItem];
    });
    showToast(`เพิ่มกิจกรรม "${newItem.activity}" เรียบร้อยแล้ว`);
  };

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`min-h-screen bg-slate-50 text-slate-800 flex flex-col relative transition-all ${
        isLargeFont
          ? 'text-base sm:text-lg [&_p]:text-base [&_span]:text-sm sm:[&_span]:text-base [&_th]:text-sm sm:[&_th]:text-base [&_td]:text-sm sm:[&_td]:text-base [&_button]:text-sm sm:[&_button]:text-base font-medium'
          : ''
      }`}
    >
      {/* Drag & Drop Visual Overlay */}
      {isDragOver && (
        <div className="fixed inset-0 z-50 bg-blue-900/80 backdrop-blur-xs flex flex-col items-center justify-center p-6 text-white border-4 border-dashed border-blue-400">
          <UploadCloud className="w-20 h-20 text-blue-200 animate-bounce mb-4" />
          <h2 className="text-2xl font-bold mb-2">ปล่อยไฟล์ Excel เพื่อนำเข้าข้อมูล</h2>
          <p className="text-blue-200 text-sm">รองรับไฟล์รายได้ 70, ข้อมูลปี 69 หรือคำของบ 70 (.xlsx, .xls, .csv)</p>
        </div>
      )}

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-4 py-3 rounded-xl shadow-xl border border-slate-800 flex items-center gap-3 animate-in fade-in slide-in-from-bottom-4 duration-200 max-w-md">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
          <span className="text-xs sm:text-sm font-medium">{toastMessage}</span>
          <button
            onClick={() => setToastMessage(null)}
            className="text-slate-400 hover:text-white ml-auto p-1 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Top Navbar */}
      <Navbar
        onFileUpload={processFile}
        onClearData={handleClearData}
        onLoadSample={handleLoadSample}
        onDownloadTemplate={downloadExcelTemplate}
        isLoading={isLoading}
        hasData={items.length > 0}
        onOpenHelp={() => setIsGuideOpen(true)}
        onOpenDataHub={() => setIsDataHubOpen(true)}
        onOpenRevenueModal={() => setIsRevenueModalOpen(true)}
        onOpenAudit={handleOpenAudit}
        isLargeFont={isLargeFont}
        onToggleLargeFont={() => setIsLargeFont((prev) => !prev)}
        isAdmin={isAdmin}
        onAdminLoginRequest={handleAdminLoginRequest}
        onAdminLogout={handleAdminLogout}
      />

      {/* Main Body Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 w-full space-y-8 flex-1">
        {/* Quick Data Hub Banner */}
        <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white rounded-2xl p-5 shadow-sm border border-blue-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-400 text-slate-950">
                ระบบจัดการ 4 ด้าน
              </span>
              <span className="text-xs text-blue-200">
                ปีงบประมาณ 2569 - 2570
              </span>
              {isAdmin ? (
                <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-400/40 flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3 text-emerald-400" /> สิทธิ์ Admin: CCPHDB
                </span>
              ) : (
                <span className="px-2 py-0.5 rounded-full text-[11px] font-medium bg-slate-800/80 text-slate-300 border border-slate-700 flex items-center gap-1">
                  <Lock className="w-3 h-3 text-amber-300" /> โหมดดูข้อมูลทั่วไป
                </span>
              )}
            </div>
            <h2 className="text-lg sm:text-xl font-black text-white">
              เปรียบเทียบงบประมาณ: คำขอ 69 · จ่ายจริง 69 · คำขอ 70 & ประมาณการรายได้
            </h2>
            <p className="text-xs sm:text-sm text-slate-300">
              ท่านสามารถคลิกขยายดูรายกิจกรรมย่อย ตรวจสอบที่มาของตัวเลขรายแถวจากไฟล์ Excel และอัปโหลดไฟล์ได้อย่างโปร่งใส
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2.5 flex-shrink-0">
            <button
              onClick={() => handleOpenAudit('revenue70')}
              className="px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-1.5 bg-indigo-700/90 hover:bg-indigo-600 text-white border border-indigo-400/60 shadow-sm transition-all cursor-pointer"
              title="ตรวจสอบรายละเอียดแถวข้อมูลจริงจากไฟล์ Excel และสาเหตุที่มาของตัวเลข"
            >
              <FileSpreadsheet className="w-4 h-4 text-indigo-200" />
              <span>ตรวจสอบที่มาตัวเลข (Audit)</span>
            </button>

            <button
              onClick={() => {
                if (!isAdmin) {
                  handleAdminLoginRequest('เข้าสู่ระบบผู้ดูแลระบบ (Admin) เพื่อจัดการข้อมูลและไฟล์', () => setIsDataHubOpen(true));
                  return;
                }
                setIsDataHubOpen(true);
              }}
              className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 shadow-sm transition-all cursor-pointer ${
                isAdmin
                  ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                  : 'bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold'
              }`}
              title={isAdmin ? 'เปิดระบบจัดการข้อมูลหลังบ้าน (สิทธิ์ Admin: CCPHDB)' : 'เข้าสู่ระบบ Admin เพื่อจัดการไฟล์และข้อมูล (ID: CCPHDB)'}
            >
              {isAdmin ? (
                <ShieldCheck className="w-4 h-4 text-emerald-100" />
              ) : (
                <Lock className="w-4 h-4 text-slate-950" />
              )}
              <span>{isAdmin ? 'จัดการข้อมูลหลังบ้าน (Admin)' : 'Admin login'}</span>
              {isAdmin && (
                <span className="w-2 h-2 rounded-full bg-emerald-300 animate-pulse ml-0.5" />
              )}
            </button>
          </div>
        </div>

        {/* Warnings / Diagnostics if any */}
        {warnings.length > 0 && (
          <div className="bg-amber-50 border-l-4 border-amber-500 p-4 rounded-r-xl shadow-2xs">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div className="text-xs text-amber-800 space-y-1">
                <p className="font-semibold text-amber-900">แจ้งเตือนการประมวลผลไฟล์ Excel:</p>
                {warnings.map((warn, i) => (
                  <p key={i}>{warn}</p>
                ))}
              </div>
              <button
                onClick={() => setWarnings([])}
                className="ml-auto text-amber-600 hover:text-amber-800 p-1 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Section 1: Executive Summary */}
        <ExecutiveSummary
          income={totalRevenueCalculated}
          onUpdateIncome={setIncome}
          totalExpense={totalExpense}
          itemCount={itemCount}
          categoryCount={categorySummaries.length}
          dataSourceName={dataSourceName}
          totalReq69={totalReq69}
          totalActual69={totalActual69}
          onOpenDataHub={() => setIsDataHubOpen(true)}
          onOpenRevenueModal={() => setIsRevenueModalOpen(true)}
          onOpenAudit={handleOpenAudit}
          isAdmin={isAdmin}
          onAdminLoginRequest={handleAdminLoginRequest}
        />

        {/* Section 2: Core Dashboards (2 Key User Comparison Views) */}
        <CoreDashboardViews
          items={items}
          categories={categorySummaries}
          revenueItems={revenueItems}
          totalExpense={totalExpense}
          totalIncome={totalRevenueCalculated}
          onOpenRevenueModal={() => setIsRevenueModalOpen(true)}
          onOpenDataHub={() => setIsDataHubOpen(true)}
          onOpenAudit={handleOpenAudit}
          isAdmin={isAdmin}
        />

        {/* Section 3: Charts with 3-Pillar & Activity Drill-Down */}
        <BudgetCharts
          categories={categorySummaries}
          totalExpense={totalExpense}
          onOpenDataHub={() => setIsDataHubOpen(true)}
        />

        {/* Section 4: Data Table */}
        <ProjectTable
          items={items}
          totalExpense={totalExpense}
          totalIncome={totalRevenueCalculated}
          onExportExcel={handleExportExcel}
          onDeleteItem={handleDeleteItem}
          onAddItem={handleAddItem}
          onUpdateActivity={handleUpdateActivity}
          isAdmin={isAdmin}
          onAdminLoginRequest={handleAdminLoginRequest}
        />
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-6 mt-12 text-slate-500 text-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-blue-600" />
            <span className="font-bold text-slate-700">สภาการสาธารณสุขชุมชน</span>
            <span className="text-slate-300">·</span>
            <span>ระบบวิเคราะห์งบประมาณ 4 มิติ (คำขอ 69 · จ่ายจริง 69 · รายได้ 70 · คำขอ 70)</span>
          </div>
          <div className="text-slate-400 text-xs flex items-center gap-3">
            <span>รายได้ 70: ฿{formatMoney(totalRevenueCalculated)}</span>
            <span>·</span>
            <span>รายจ่าย 70: ฿{formatMoney(totalExpense)}</span>
            <span>·</span>
            <span>รองรับข้อมูล 4 ด้าน</span>
          </div>
        </div>
      </footer>

      {/* Guide Modal */}
      <ExcelGuideModal
        isOpen={isGuideOpen}
        onClose={() => setIsGuideOpen(false)}
        onDownloadTemplate={downloadExcelTemplate}
      />

      {/* Revenue 70 Detail & Upload Modal */}
      <RevenueModal
        isOpen={isRevenueModalOpen}
        onClose={() => setIsRevenueModalOpen(false)}
        revenueItems={revenueItems}
        onUpdateItems={setRevenueItems}
        onUploadRevenueFile={handleUploadRevenueFile}
        onOpenAudit={() => handleOpenAudit('revenue70')}
        isAdmin={isAdmin}
        onAdminLoginRequest={handleAdminLoginRequest}
      />

      {/* Data Hub (ระบบจัดการข้อมูลหลังบ้าน Admin) Modal */}
      <DataHubModal
        isOpen={isDataHubOpen}
        onClose={() => setIsDataHubOpen(false)}
        onUploadBudget70={processFile}
        onUploadRevenue70={handleUploadRevenueFile}
        onUploadFY69={handleUploadFY69File}
        onUploadReq69={handleUploadReq69File}
        onUploadActual69={handleUploadActual69File}
        onOpenAudit={handleOpenAudit}
        totalExpense70={totalExpense}
        totalIncome70={totalRevenueCalculated}
        totalReq69={totalReq69}
        totalActual69={totalActual69}
        itemCount70={itemCount}
        revenueItemCount={revenueItems.length}
        isLoading={isLoading}
        onOpenRevenueModal={() => setIsRevenueModalOpen(true)}
        onOpenStructureGuide={() => {
          setIsDataHubOpen(false);
          setIsGuideOpen(true);
        }}
        isAdmin={isAdmin}
        onAdminLoginRequest={handleAdminLoginRequest}
      />

      {/* File Audit & Breakdown Modal (ตรวจสอบที่มาตัวเลขรายแถว) */}
      <FileAuditModal
        isOpen={isFileAuditOpen}
        onClose={() => setIsFileAuditOpen(false)}
        reports={auditReports}
        initialTab={fileAuditTab}
      />

      {/* Admin Login Modal (ID: CCPHDB, pass: ccph234) */}
      <AdminLoginModal
        isOpen={isAdminLoginOpen}
        onClose={() => {
          setIsAdminLoginOpen(false);
          setPendingAdminAction(null);
        }}
        onSuccess={handleAdminLoginSuccess}
        actionTitle={adminActionTitle}
      />
    </div>
  );
}
