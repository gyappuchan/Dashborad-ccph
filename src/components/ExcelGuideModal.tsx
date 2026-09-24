import React from 'react';
import { X, Download, CheckCircle2, FileSpreadsheet, ArrowRight } from 'lucide-react';

interface ExcelGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDownloadTemplate: () => void;
}

export const ExcelGuideModal: React.FC<ExcelGuideModalProps> = ({
  isOpen,
  onClose,
  onDownloadTemplate,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50">
          <div className="flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-blue-700" />
            <h3 className="font-bold text-slate-800 text-base">คำแนะนำโครงสร้างไฟล์ Excel (เปรียบเทียบ 3 มิติ)</h3>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-200/60 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4 text-xs sm:text-sm text-slate-600 max-h-[75vh] overflow-y-auto">
          <div>
            <h4 className="font-bold text-slate-800 text-sm mb-1 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              1. โครงสร้างเปรียบเทียบงบประมาณ 3 ด้าน (2569 vs 2570)
            </h4>
            <p className="text-slate-600 leading-relaxed mb-2">
              ระบบรองรับการเปรียบเทียบครบถ้วน 3 มิติสำคัญ:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
              <div className="p-2.5 bg-slate-100 rounded-lg border border-slate-200">
                <strong className="text-slate-800 block">1. คำขอ 2569</strong>
                <span className="text-slate-500">กรอบคำขอเดิมปี 69</span>
              </div>
              <div className="p-2.5 bg-amber-50 rounded-lg border border-amber-200">
                <strong className="text-amber-900 block">2. จ่ายจริง 2569</strong>
                <span className="text-amber-800">ผลการเบิกจ่ายจริงปี 69</span>
              </div>
              <div className="p-2.5 bg-blue-50 rounded-lg border border-blue-200">
                <strong className="text-blue-900 block">3. คำขอ 2570</strong>
                <span className="text-blue-800">คำของบประมาณปี 70</span>
              </div>
            </div>
          </div>

          <div>
            <h4 className="font-bold text-slate-800 text-sm mb-1 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              2. กฎการจำแนก &quot;หมวดหมู่หลัก&quot; และ &quot;รายการย่อย&quot;
            </h4>
            <ul className="list-disc list-inside space-y-1 pl-2 text-slate-600 text-xs">
              <li>
                <strong className="text-slate-800">หมวดหมู่หลัก (อนุสภา/ส่วนงาน):</strong> ใช้รหัสความยาว <strong>1-2 ตัวอักษร</strong> (เช่น <code className="bg-slate-100 px-1 py-0.5 rounded text-blue-800 font-mono">01</code>, <code className="bg-slate-100 px-1 py-0.5 rounded text-blue-800 font-mono">02</code>, <code className="bg-slate-100 px-1 py-0.5 rounded text-blue-800 font-mono">1</code>)
              </li>
              <li>
                <strong className="text-slate-800">รายการกิจกรรมย่อย:</strong> ใช้รหัสความยาว <strong>มากกว่า 2 ตัวอักษร</strong> (เช่น <code className="bg-slate-100 px-1 py-0.5 rounded text-blue-800 font-mono">700101</code>, <code className="bg-slate-100 px-1 py-0.5 rounded text-blue-800 font-mono">1.1</code>)
              </li>
              <li>
                <span className="text-emerald-700 font-semibold">ข้อดี:</span> ระบบจะนำเฉพาะ <em>&quot;รายการกิจกรรมย่อย&quot;</em> มาคำนวณรวมยอดรายจ่าย เพื่อป้องกันยอดงบประมาณซ้ำซ้อน 100%
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold text-slate-800 text-sm mb-1 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              3. ตัวอย่างตารางคำของบประมาณรายจ่ายใน Excel
            </h4>
            <div className="border border-slate-200 rounded-xl overflow-hidden">
              <table className="w-full text-left border-collapse text-[11px]">
                <thead className="bg-slate-100 font-bold text-slate-700">
                  <tr>
                    <th className="p-2 border-r border-slate-200">รหัส</th>
                    <th className="p-2 border-r border-slate-200">รายการกิจกรรม</th>
                    <th className="p-2 text-right border-r border-slate-200 bg-slate-200/50">คำขอ 69</th>
                    <th className="p-2 text-right border-r border-slate-200 bg-amber-100/60">จ่ายจริง 69</th>
                    <th className="p-2 text-right bg-blue-100/60">คำขอ 70</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono">
                  <tr className="bg-blue-50/60 font-semibold text-blue-900">
                    <td className="p-2 border-r border-slate-200">01</td>
                    <td className="p-2 border-r border-slate-200 font-sans">อนุสภาด้านวิชาการฯ</td>
                    <td className="p-2 text-right border-r border-slate-200">6,850,000</td>
                    <td className="p-2 text-right border-r border-slate-200">6,320,000</td>
                    <td className="p-2 text-right font-bold text-blue-900">7,400,000</td>
                  </tr>
                  <tr>
                    <td className="p-2 border-r border-slate-200 pl-4 text-slate-500">700101</td>
                    <td className="p-2 border-r border-slate-200 font-sans">โครงการพัฒนาเกณฑ์มาตรฐานฯ</td>
                    <td className="p-2 text-right border-r border-slate-200">1,300,000</td>
                    <td className="p-2 text-right border-r border-slate-200 text-amber-900">1,220,000</td>
                    <td className="p-2 text-right font-bold text-blue-950">1,450,000</td>
                  </tr>
                  <tr>
                    <td className="p-2 border-r border-slate-200 pl-4 text-slate-500">700102</td>
                    <td className="p-2 border-r border-slate-200 font-sans">โครงการจัดทำคลังข้อสอบฯ</td>
                    <td className="p-2 text-right border-r border-slate-200">2,050,000</td>
                    <td className="p-2 text-right border-r border-slate-200 text-amber-900">1,940,000</td>
                    <td className="p-2 text-right font-bold text-blue-950">2,200,000</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <div>
            <h4 className="font-bold text-slate-800 text-sm mb-1 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              4. โครงสร้างไฟล์ประมาณการรายรับ ปี 2570
            </h4>
            <p className="text-slate-600 text-xs mb-2">
              ประกอบด้วยช่อง <strong>อนุที่ได้รับรายได้</strong> (แสดงเป็นแทบสีฟ้าภาพรวม), <strong>รายการ (ชื่อตามไฟล์)</strong>, <strong>งบประมาณ</strong> และช่องสุดท้าย <strong>รวมทั้งหมด</strong>:
            </p>
            <div className="border border-slate-200 rounded-xl overflow-hidden">
              <table className="w-full text-left border-collapse text-[11px]">
                <thead className="bg-slate-100 font-bold text-slate-700">
                  <tr>
                    <th className="p-2 border-r border-slate-200">รายการ (ชื่อตามไฟล์)</th>
                    <th className="p-2 text-right">งบประมาณ (บาท)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono">
                  <tr className="bg-sky-600 text-white font-bold font-sans">
                    <td className="p-2">ภาพรวม: อนุสภาด้านวิชาการและการพัฒนามาตรฐานวิชาชีพ</td>
                    <td className="p-2 text-right text-amber-200 font-mono">18,500,000</td>
                  </tr>
                  <tr>
                    <td className="p-2 pl-4 text-slate-700 font-sans">ค่าธรรมเนียมการขึ้นทะเบียนและรับใบอนุญาต...</td>
                    <td className="p-2 text-right text-slate-900">12,000,000</td>
                  </tr>
                  <tr>
                    <td className="p-2 pl-4 text-slate-700 font-sans">ค่าธรรมเนียมต่ออายุใบอนุญาต...</td>
                    <td className="p-2 text-right text-slate-900">6,500,000</td>
                  </tr>
                  <tr className="bg-slate-900 text-white font-bold font-sans">
                    <td className="p-2 font-bold">รวมทั้งหมด</td>
                    <td className="p-2 text-right text-amber-300 font-mono font-bold">25,000,000</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
          <button
            onClick={() => {
              onDownloadTemplate();
              onClose();
            }}
            className="text-xs sm:text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg transition-colors flex items-center gap-1.5 shadow-2xs cursor-pointer"
          >
            <Download className="w-4 h-4" />
            ดาวน์โหลดไฟล์ตัวอย่าง (.xlsx)
          </button>
          <button
            onClick={onClose}
            className="text-xs sm:text-sm font-medium text-slate-600 hover:text-slate-800 px-4 py-2 rounded-lg transition-colors cursor-pointer"
          >
            ปิดหน้าต่าง
          </button>
        </div>
      </div>
    </div>
  );
};
