import React, { useRef } from 'react';
import {
  FileUp,
  Trash2,
  Download,
  RotateCcw,
  Sparkles,
  Layers,
  HelpCircle,
  FileSpreadsheet,
  Receipt,
  Eye,
  Type,
  ShieldCheck,
  Lock,
  LogOut,
} from 'lucide-react';

interface NavbarProps {
  onFileUpload: (file: File) => void;
  onClearData: () => void;
  onLoadSample: () => void;
  onDownloadTemplate: () => void;
  isLoading: boolean;
  hasData: boolean;
  onOpenHelp: () => void;
  onOpenDataHub?: () => void;
  onOpenRevenueModal?: () => void;
  onOpenAudit?: (tab?: 'revenue70' | 'actual69' | 'req69' | 'budget70') => void;
  isLargeFont?: boolean;
  onToggleLargeFont?: () => void;
  isAdmin?: boolean;
  onAdminLoginRequest?: (actionTitle?: string) => void;
  onAdminLogout?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  onFileUpload,
  onClearData,
  onLoadSample,
  onDownloadTemplate,
  isLoading,
  hasData,
  onOpenHelp,
  onOpenDataHub,
  onOpenRevenueModal,
  onOpenAudit,
  isLargeFont = false,
  onToggleLargeFont,
  isAdmin = false,
  onAdminLoginRequest,
  onAdminLogout,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onFileUpload(file);
      e.target.value = '';
    }
  };

  const handleImportClick = () => {
    if (!isAdmin && onAdminLoginRequest) {
      onAdminLoginRequest('การนำเข้าไฟล์ข้อมูลงบประมาณ Excel');
    } else {
      fileInputRef.current?.click();
    }
  };

  const handleDataHubClick = () => {
    if (!isAdmin && onAdminLoginRequest) {
      onAdminLoginRequest('เปิดศูนย์จัดการข้อมูลหลังบ้าน (Admin)');
    } else if (onOpenDataHub) {
      onOpenDataHub();
    }
  };

  const handleRevenueClick = () => {
    if (!isAdmin && onAdminLoginRequest) {
      onAdminLoginRequest('ดูและจัดการไฟล์ประมาณการรายได้ 2570');
    } else if (onOpenRevenueModal) {
      onOpenRevenueModal();
    }
  };

  const handleLoadSampleClick = () => {
    if (!isAdmin && onAdminLoginRequest) {
      onAdminLoginRequest('การโหลดข้อมูลตัวอย่างเพื่อจัดการ');
    } else {
      onLoadSample();
    }
  };

  const handleClearDataClick = () => {
    if (!isAdmin && onAdminLoginRequest) {
      onAdminLoginRequest('การล้างข้อมูลในแดชบอร์ด');
    } else {
      onClearData();
    }
  };

  return (
    <header className="bg-slate-900 text-white shadow-md sticky top-0 z-40 border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex flex-col lg:flex-row items-center justify-between gap-3">
        {/* Brand / Logo */}
        <div className="flex items-center gap-3.5 w-full lg:w-auto justify-between lg:justify-start">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-blue-600 flex items-center justify-center shadow-inner text-white font-bold text-xl flex-shrink-0">
              <svg
                className="w-7 h-7"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                />
              </svg>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg sm:text-xl font-extrabold text-white tracking-tight leading-tight">
                  ระบบแดชบอร์ดงบประมาณ
                </h1>
                <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-blue-500/25 text-blue-200 border border-blue-400/40">
                  ปี 2570
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-300 font-medium">สภาการสาธารณสุขชุมชน</p>
            </div>
          </div>

          {/* Elderly / High Legibility toggle on mobile */}
          {onToggleLargeFont && (
            <button
              onClick={onToggleLargeFont}
              className={`lg:hidden px-2.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 transition-colors border ${
                isLargeFont
                  ? 'bg-amber-400 text-slate-900 border-amber-300 font-extrabold'
                  : 'bg-slate-800 text-slate-200 border-slate-700'
              }`}
              title="สลับโหมดตัวอักษรขนาดใหญ่สำหรับผู้สูงอายุ"
            >
              <Type className="w-3.5 h-3.5" />
              <span>{isLargeFont ? 'ขนาดใหญ่' : 'ขยายตัวอักษร'}</span>
            </button>
          )}
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2 justify-end w-full lg:w-auto">
          {/* Elderly / High Legibility Mode Toggle */}
          {onToggleLargeFont && (
            <button
              onClick={onToggleLargeFont}
              className={`hidden lg:flex px-3 py-1.5 rounded-lg text-xs sm:text-sm font-bold items-center gap-1.5 transition-colors cursor-pointer border ${
                isLargeFont
                  ? 'bg-amber-400 text-slate-950 border-amber-300 shadow-sm'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
              }`}
              title="สลับโหมดตัวอักษรขนาดใหญ่พิเศษเพื่อความสะดวกในการอ่านของผู้สูงอายุ"
            >
              <Type className="w-4 h-4 text-amber-400" />
              <span>{isLargeFont ? 'ตัวอักษรใหญ่ (เปิดอยู่)' : 'ขยายตัวหนังสือใหญ่'}</span>
            </button>
          )}

          {/* Audit / Diagnostics Modal - Available for everyone to inspect numbers */}
          {onOpenAudit && (
            <button
              onClick={() => onOpenAudit('revenue70')}
              className="text-xs sm:text-sm font-bold text-indigo-200 hover:text-white bg-indigo-950/70 hover:bg-indigo-900 border border-indigo-500/70 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
              title="ตรวจสอบรายละเอียดแถวข้อมูลจริงจากไฟล์ Excel และสาเหตุที่มาของตัวเลข"
            >
              <FileSpreadsheet className="w-4 h-4 text-indigo-400" />
              <span>ตรวจสอบที่มาตัวเลข</span>
            </button>
          )}

          {/* Data Hub (ศูนย์จัดการข้อมูลหลังบ้าน) - เฉพาะ Admin */}
          {onOpenDataHub && isAdmin && (
            <button
              onClick={handleDataHubClick}
              className="text-xs sm:text-sm font-bold text-emerald-200 hover:text-white bg-emerald-950/70 hover:bg-emerald-900 border border-emerald-600/70 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
              title="ระบบจัดการข้อมูลหลังบ้าน: ประมาณการรายได้ 70 · ข้อมูลปี 69 · คำขอ 70"
            >
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>จัดการข้อมูลหลังบ้าน</span>
            </button>
          )}

          {/* Revenue 70 Modal - เฉพาะ Admin */}
          {onOpenRevenueModal && isAdmin && (
            <button
              onClick={handleRevenueClick}
              className="text-xs sm:text-sm font-semibold text-slate-200 hover:text-white hover:bg-slate-800 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer border border-slate-700/60"
              title="ดูและจัดการไฟล์ประมาณการรายได้ 2570"
            >
              <Receipt className="w-4 h-4 text-emerald-400" />
              <span className="hidden md:inline">รายได้ 70</span>
            </button>
          )}

          <button
            onClick={onOpenHelp}
            className="text-xs sm:text-sm font-semibold text-slate-200 hover:text-white hover:bg-slate-800 px-2.5 py-1.5 rounded-lg transition-colors flex items-center gap-1 cursor-pointer border border-slate-700/60"
            title="วิธีเตรียมไฟล์ Excel"
          >
            <HelpCircle className="w-4 h-4 text-blue-300" />
            <span className="hidden xl:inline">วิธีเตรียมไฟล์</span>
          </button>

          <button
            onClick={onDownloadTemplate}
            className="text-xs sm:text-sm font-semibold text-slate-200 hover:text-white hover:bg-slate-800 px-2.5 py-1.5 rounded-lg transition-colors flex items-center gap-1 cursor-pointer border border-slate-700/60"
            title="ดาวน์โหลดแบบฟอร์มไฟล์ Excel เปล่า"
          >
            <Download className="w-4 h-4 text-blue-400" />
            <span className="hidden xl:inline">แบบฟอร์ม</span>
          </button>

          {isAdmin && (
            <button
              onClick={handleLoadSampleClick}
              className="text-xs sm:text-sm font-semibold text-slate-200 hover:text-white hover:bg-slate-800 px-2.5 py-1.5 rounded-lg transition-colors flex items-center gap-1 cursor-pointer border border-slate-700/60"
              title="โหลดตัวอย่างข้อมูลสภาการสาธารณสุขชุมชน"
            >
              <RotateCcw className="w-4 h-4 text-amber-400" />
              <span className="hidden sm:inline">ตัวอย่าง</span>
            </button>
          )}

          {hasData && isAdmin && (
            <button
              onClick={handleClearDataClick}
              className="bg-slate-800 hover:bg-slate-700 text-rose-300 hover:text-rose-100 px-2.5 py-1.5 rounded-lg text-xs sm:text-sm font-semibold transition-colors flex items-center gap-1 border border-slate-700 shadow-2xs cursor-pointer"
              title="ล้างข้อมูลทั้งหมด"
            >
              <Trash2 className="w-4 h-4" />
              <span className="hidden sm:inline">ล้าง</span>
            </button>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx, .xls, .csv"
            onChange={handleFileChange}
            className="hidden"
          />

          {isAdmin && (
            <button
              onClick={handleImportClick}
              disabled={isLoading}
              className="px-3.5 py-1.5 rounded-lg text-xs sm:text-sm font-bold transition-all flex items-center gap-2 shadow-sm cursor-pointer bg-blue-600 hover:bg-blue-500 disabled:bg-blue-800 text-white"
              title="คลิกเพื่อเลือกไฟล์ Excel"
            >
              {isLoading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <FileUp className="w-4 h-4" />
              )}
              <span>นำเข้าไฟล์</span>
            </button>
          )}

          {/* Admin Status / Login Button */}
          {isAdmin ? (
            <div className="flex items-center gap-1.5 bg-emerald-950/80 border border-emerald-500/70 text-emerald-200 px-2.5 py-1.5 rounded-lg text-xs font-bold shadow-2xs">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse flex-shrink-0" />
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
              <span className="hidden sm:inline">Admin: CCPHDB</span>
              <button
                onClick={onAdminLogout}
                className="ml-1 text-slate-300 hover:text-rose-300 hover:bg-emerald-900/60 p-1 rounded transition-colors cursor-pointer"
                title="ออกจากระบบ Admin"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <button
              onClick={() =>
                onAdminLoginRequest && onAdminLoginRequest('เข้าสู่ระบบผู้ดูแลระบบหลังบ้าน')
              }
              className="bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 border border-amber-400/50 hover:border-amber-300 px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs"
              title="เข้าสู่ระบบ Admin เพื่อนำเข้าหรือแก้ไขข้อมูล (ID: CCPHDB pass: ccph234)"
            >
              <Lock className="w-3.5 h-3.5 text-amber-400" />
              <span>Admin หลังบ้าน</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};

