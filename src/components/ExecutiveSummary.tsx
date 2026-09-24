import React, { useState } from 'react';
import {
  TrendingUp,
  Receipt,
  Scale,
  Edit3,
  Check,
  X,
  AlertCircle,
  Sparkles,
  Layers,
  FileSpreadsheet,
  ShieldCheck,
  Lock,
} from 'lucide-react';

interface ExecutiveSummaryProps {
  income: number;
  onUpdateIncome: (newIncome: number) => void;
  totalExpense: number;
  itemCount: number;
  categoryCount: number;
  dataSourceName: string;
  totalReq69?: number;
  totalActual69?: number;
  onOpenDataHub?: () => void;
  onOpenRevenueModal?: () => void;
  onOpenAudit?: (tab?: 'revenue70' | 'actual69' | 'req69' | 'budget70') => void;
  isAdmin?: boolean;
  onAdminLoginRequest?: (actionTitle?: string) => void;
}

export const ExecutiveSummary: React.FC<ExecutiveSummaryProps> = ({
  income,
  onUpdateIncome,
  totalExpense,
  itemCount,
  categoryCount,
  dataSourceName,
  totalReq69 = 0,
  totalActual69 = 0,
  onOpenDataHub,
  onOpenRevenueModal,
  onOpenAudit,
  isAdmin = false,
  onAdminLoginRequest,
}) => {
  const [isEditingIncome, setIsEditingIncome] = useState(false);
  const [tempIncome, setTempIncome] = useState(income.toString());

  const formatMoney = (num: number) =>
    new Intl.NumberFormat('th-TH', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(num || 0);

  const netBalance = income - totalExpense;
  const isSurplus = netBalance >= 0;
  const utilizationPercent = income > 0 ? (totalExpense / income) * 100 : 0;
  const averagePerProject = itemCount > 0 ? totalExpense / itemCount : 0;

  const handleSaveIncome = () => {
    const val = parseFloat(tempIncome.replace(/,/g, ''));
    if (!isNaN(val) && val >= 0) {
      onUpdateIncome(val);
      setIsEditingIncome(false);
    }
  };

  const setIncomePreset = (val: number) => {
    setTempIncome(val.toString());
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <h2 className="text-xl font-extrabold text-slate-900 flex items-center gap-2.5">
          <Scale className="w-6 h-6 text-blue-700 flex-shrink-0" />
          1. ภาพรวมกระแสเงิน (รายรับ vs รายจ่าย ประจำปีงบประมาณ 2570)
        </h2>
        <div className="flex flex-wrap items-center gap-2">
          {onOpenDataHub && isAdmin && (
            <button
              onClick={onOpenDataHub}
              className="text-xs sm:text-sm font-bold text-blue-700 hover:text-white bg-blue-50 hover:bg-blue-700 border border-blue-300 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
              title="ระบบจัดการข้อมูลหลังบ้าน: ประมาณการรายได้ 70 · ข้อมูลปี 69 · คำขอ 70"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>จัดการข้อมูลหลังบ้าน (Admin)</span>
            </button>
          )}
          <span className="text-xs sm:text-sm text-slate-600 font-medium flex items-center gap-1.5 bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200">
            <FileSpreadsheet className="w-4 h-4 text-slate-500" />
            แหล่งข้อมูล: <span className="font-bold text-slate-900">{dataSourceName}</span>
          </span>
        </div>
      </div>

      {/* Main 3 Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Card 1: Estimated Income */}
        <div className="bg-white rounded-2xl p-6 border-l-4 border-l-emerald-600 border border-slate-200/90 relative overflow-hidden shadow-xs hover:shadow-sm transition-shadow">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs sm:text-sm font-bold text-slate-600 tracking-wide uppercase">
                ประมาณการรายรับรวม (ปี 70)
              </p>
              {isEditingIncome ? (
                <div className="mt-2 space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-slate-600 font-bold text-lg">฿</span>
                    <input
                      type="text"
                      value={tempIncome}
                      onChange={(e) => setTempIncome(e.target.value)}
                      className="px-3 py-1.5 text-xl font-bold font-mono border-2 border-emerald-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 w-52 tabular-nums bg-white"
                      autoFocus
                    />
                    <button
                      onClick={handleSaveIncome}
                      className="p-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors cursor-pointer"
                      title="บันทึก"
                    >
                      <Check className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => setIsEditingIncome(false)}
                      className="p-2 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-lg transition-colors cursor-pointer"
                      title="ยกเลิก"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                  <div className="flex items-center gap-2 text-xs font-semibold text-slate-600">
                    <span>ตั้งค่าด่วน:</span>
                    <button
                      type="button"
                      onClick={() => setIncomePreset(20000000)}
                      className="hover:underline text-blue-700 font-bold px-1.5 py-0.5 bg-blue-50 rounded"
                    >
                      20M
                    </button>
                    <button
                      type="button"
                      onClick={() => setIncomePreset(25000000)}
                      className="hover:underline text-blue-700 font-bold px-1.5 py-0.5 bg-blue-50 rounded"
                    >
                      25M
                    </button>
                    <button
                      type="button"
                      onClick={() => setIncomePreset(30000000)}
                      className="hover:underline text-blue-700 font-bold px-1.5 py-0.5 bg-blue-50 rounded"
                    >
                      30M
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-baseline gap-2 mt-2">
                  <h3 className="text-3xl sm:text-4xl font-black text-slate-900 font-mono tabular-nums tracking-tight">
                    ฿ {formatMoney(income)}
                  </h3>
                  {isAdmin && (
                    <button
                      onClick={() => {
                        setTempIncome(income.toString());
                        setIsEditingIncome(true);
                      }}
                      className="text-slate-400 hover:text-emerald-700 p-1.5 rounded-lg hover:bg-emerald-50 transition-colors cursor-pointer"
                      title="แก้ไขประมาณการรายรับ"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              )}
            </div>
            <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center flex-shrink-0">
              <TrendingUp className="w-6 h-6" />
            </div>
          </div>
          <div className="mt-3 flex flex-wrap items-center justify-between text-xs text-slate-500 gap-1.5">
            <span>{isAdmin ? '* คลิกไอคอนดินสอ เพื่อปรับยอดตัวเลข' : 'ประมาณการรายรับรวมปี 2570'}</span>
            <div className="flex items-center gap-1.5">
              {onOpenAudit && (
                <button
                  onClick={() => onOpenAudit('revenue70')}
                  className="font-bold text-indigo-700 hover:text-indigo-900 bg-indigo-50 hover:bg-indigo-100 px-2 py-0.5 rounded border border-indigo-200 transition-colors cursor-pointer flex items-center gap-1"
                  title="ตรวจสอบรายละเอียดย่อยแถวรายรับจากไฟล์ Excel"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5 text-indigo-600" />
                  <span>ตรวจสอบที่มาตัวเลข ↗</span>
                </button>
              )}
              {onOpenRevenueModal && isAdmin && (
                <button
                  onClick={onOpenRevenueModal}
                  className="font-bold text-emerald-800 hover:text-emerald-950 bg-emerald-50 hover:bg-emerald-100 px-2 py-0.5 rounded border border-emerald-200 transition-colors cursor-pointer flex items-center gap-1"
                  title="จัดการรายได้ 70 / อัปโหลดไฟล์"
                >
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-700" />
                  <span>จัดการรายได้ 70</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Card 2: Estimated Expense */}
        <div className="bg-white rounded-2xl p-6 border-l-4 border-l-rose-600 border border-slate-200/90 relative overflow-hidden shadow-xs hover:shadow-sm transition-shadow">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs sm:text-sm font-bold text-slate-600 tracking-wide uppercase">
                ประมาณการรายจ่ายรวม (ปี 70)
              </p>
              <div className="flex items-baseline gap-2 mt-2">
                <h3 className="text-3xl sm:text-4xl font-black text-slate-900 font-mono tabular-nums tracking-tight">
                  ฿ {formatMoney(totalExpense)}
                </h3>
              </div>
            </div>
            <div className="w-12 h-12 rounded-xl bg-rose-100 text-rose-800 flex items-center justify-center flex-shrink-0">
              <Receipt className="w-6 h-6" />
            </div>
          </div>
          <div className="mt-3 flex items-center justify-between text-xs text-slate-500">
            <span>* คำนวณจากยอดรวมรายการย่อยในระบบ</span>
            <span className="font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded">
              {utilizationPercent.toFixed(1)}% ของรายรับ
            </span>
          </div>
        </div>

        {/* Card 3: Net Balance */}
        <div
          className={`bg-white rounded-2xl p-6 border-l-4 border border-slate-200/90 relative overflow-hidden shadow-xs hover:shadow-sm transition-shadow ${
            isSurplus ? 'border-l-blue-600' : 'border-l-rose-600'
          }`}
        >
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs sm:text-sm font-bold text-slate-600 tracking-wide uppercase">
                {isSurplus ? 'สถานะงบประมาณคงเหลือ' : 'สถานะงบประมาณขาดดุล'}
              </p>
              <div className="flex items-baseline gap-2 mt-2">
                <h3
                  className={`text-3xl sm:text-4xl font-black font-mono tabular-nums tracking-tight ${
                    isSurplus ? 'text-emerald-700' : 'text-rose-700'
                  }`}
                >
                  {isSurplus ? '' : '- '}฿ {formatMoney(Math.abs(netBalance))}
                </h3>
              </div>
            </div>
            <div
              className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${
                isSurplus ? 'bg-blue-100 text-blue-800' : 'bg-rose-100 text-rose-800'
              }`}
            >
              <Scale className="w-6 h-6" />
            </div>
          </div>
          <div className="mt-3 flex items-center gap-1.5 text-xs">
            {isSurplus ? (
              <span className="text-emerald-800 font-semibold flex items-center gap-1.5 bg-emerald-50 px-2 py-0.5 rounded-md">
                <span className="w-2 h-2 rounded-full bg-emerald-600 inline-block" />
                งบประมาณเพียงพอต่อแผนงาน มีสภาพคล่องพร้อมจัดสรร
              </span>
            ) : (
              <span className="text-rose-800 font-semibold flex items-center gap-1.5 bg-rose-50 px-2 py-0.5 rounded-md">
                <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-600" />
                รายจ่ายเกินประมาณการรายรับ {(Math.abs(netBalance) / 1000000).toFixed(2)} ล้านบาท
              </span>
            )}
          </div>
        </div>
      </div>

      {/* 3-Pillar Budget Comparison Strip: คำขอ 2569 | จ่ายจริง 2569 | คำขอ 2570 */}
      {totalReq69 > 0 && (
        <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 gap-2 mb-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-blue-700" />
              <h3 className="font-extrabold text-slate-900 text-sm sm:text-base">
                สรุปเปรียบเทียบงบประมาณ 3 มิติ (2569 vs 2570)
              </h3>
            </div>
            <div className="flex items-center gap-2">
              {onOpenAudit && (
                <button
                  onClick={() => onOpenAudit('actual69')}
                  className="text-xs font-bold text-indigo-700 hover:text-indigo-900 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 px-2.5 py-1 rounded-lg flex items-center gap-1 transition-colors cursor-pointer"
                  title="ตรวจสอบรายละเอียดย่อยแถวจ่ายจริง 69 จากไฟล์ Excel"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5 text-indigo-600" />
                  <span>ตรวจสอบที่มาจ่ายจริง 69 ↗</span>
                </button>
              )}
              <span className="text-xs font-semibold text-slate-500 hidden md:inline">
                วิเคราะห์ความต่อเนื่องและประสิทธิภาพการใช้จ่าย
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* 1. คำขอ 2569 */}
            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
              <span className="text-xs font-bold text-slate-600 block mb-1">
                1. คำของบประมาณ 2569
              </span>
              <div className="text-2xl font-black text-slate-900 font-mono tabular-nums">
                ฿ {formatMoney(totalReq69)}
              </div>
              <span className="text-xs text-slate-500 font-medium mt-1 block">
                กรอบคำขอเดิมปีงบ 2569
              </span>
            </div>

            {/* 2. จ่ายจริง 2569 */}
            <div className="p-3.5 bg-amber-50/70 rounded-xl border border-amber-200">
              <span className="text-xs font-bold text-amber-900 block mb-1">
                2. ผลการใช้จ่ายจริง 2569
              </span>
              <div className="text-2xl font-black text-amber-950 font-mono tabular-nums">
                ฿ {formatMoney(totalActual69)}
              </div>
              <div className="flex items-center gap-1.5 text-xs font-bold text-amber-800 mt-1">
                <Check className="w-3.5 h-3.5" />
                เบิกจ่ายจริง {totalReq69 > 0 ? ((totalActual69 / totalReq69) * 100).toFixed(1) : 0}% ของคำขอ 69
              </div>
            </div>

            {/* 3. คำขอ 2570 */}
            <div className="p-3.5 bg-blue-50/70 rounded-xl border border-blue-200">
              <span className="text-xs font-bold text-blue-900 block mb-1">
                3. คำของบประมาณ 2570
              </span>
              <div className="text-2xl font-black text-blue-950 font-mono tabular-nums">
                ฿ {formatMoney(totalExpense)}
              </div>
              <div className="text-xs font-extrabold text-blue-800 mt-1">
                {totalExpense >= totalActual69 ? '+' : ''}
                {formatMoney(totalExpense - totalActual69)} ({totalActual69 > 0 ? (((totalExpense - totalActual69) / totalActual69) * 100).toFixed(1) : 0}% เทียบจ่ายจริง 69)
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Sub-metrics bar: Clean scannable metrics */}
      <div className="bg-slate-100/90 rounded-xl p-4 sm:p-5 border border-slate-200 grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs sm:text-sm">
        <div>
          <span className="text-slate-600 font-medium block mb-1">จำนวนอนุสภา / หมวดหมู่</span>
          <span className="text-lg sm:text-xl font-extrabold text-slate-900 font-mono tabular-nums">
            {categoryCount}
          </span>
          <span className="text-slate-500 font-medium text-xs ml-1.5">หมวดหลัก</span>
        </div>
        <div>
          <span className="text-slate-600 font-medium block mb-1">จำนวนกิจกรรม / โครงการ</span>
          <span className="text-lg sm:text-xl font-extrabold text-slate-900 font-mono tabular-nums">
            {itemCount}
          </span>
          <span className="text-slate-500 font-medium text-xs ml-1.5">รายการย่อย</span>
        </div>
        <div>
          <span className="text-slate-600 font-medium block mb-1">เฉลี่ยต่องานโครงการ</span>
          <span className="text-lg sm:text-xl font-extrabold text-slate-900 font-mono tabular-nums">
            ฿ {formatMoney(averagePerProject)}
          </span>
        </div>
        <div>
          <span className="text-slate-600 font-medium block mb-1">สัดส่วนการใช้งบ</span>
          <div className="flex items-center gap-2 mt-1">
            <div className="w-full bg-slate-200 rounded-full h-3 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  utilizationPercent > 100
                    ? 'bg-rose-600'
                    : utilizationPercent > 90
                    ? 'bg-amber-600'
                    : 'bg-emerald-600'
                }`}
                style={{ width: `${Math.min(utilizationPercent, 100)}%` }}
              />
            </div>
            <span className="font-extrabold text-slate-900 font-mono tabular-nums text-sm">
              {utilizationPercent.toFixed(1)}%
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
