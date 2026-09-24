export interface BudgetItem {
  id: string;
  activity: string;
  budget: number; // คำของบประมาณ 2570
  isMain: boolean;
  parentName: string;
  parentId?: string;
  budget69?: number; // คำของบประมาณ 2569
  actual69?: number; // จ่ายจริง 2569
  note?: string;
  isHistorical?: boolean; // กิจกรรมเก่าปี 69 ที่ไม่มีคำขอปี 70
}

export interface CategorySummary {
  id: string;
  name: string;
  totalBudget: number; // คำของบประมาณ 2570
  itemCount: number;
  items: BudgetItem[];
  budget69: number;    // คำของบประมาณ 2569
  actual69: number;    // จ่ายจริง 2569
  color: string;
  percentage: number;
  revenue70?: number;  // ประมาณการรายได้ปี 2570 ของอนุนี้
  revenueItems?: RevenueItem[]; // รายการรายรับที่สังกัดอนุนี้
}

export interface RawRowAudit {
  rowNumber: number;
  rawText: string;
  extractedName: string;
  extractedAmount: number;
  extractedAnu: string;
  rowRole: 'detail' | 'overview' | 'grand_total' | 'header' | 'empty' | 'skipped';
  isCounted: boolean;
  statusMessage: string;
}

export interface ParseAuditReport {
  dataType: 'revenue70' | 'actual69' | 'req69' | 'budget70';
  filename: string;
  sheetName: string;
  totalRowsScanned: number;
  detectedColumns: { [key: string]: string };
  fileGrandTotal: number;
  parsedSum: number;
  itemsCount: number;
  overviewCount: number;
  reconciliationDiff: number; // parsedSum - fileGrandTotal
  rows: RawRowAudit[];
}

export interface ParseResult {
  data: BudgetItem[];
  warnings: string[];
  filename?: string;
  sheetName?: string;
  audit?: ParseAuditReport;
}

export interface RevenueItem {
  id?: string;
  source: string; // ช่องรายการใส่ชื่อตามไฟล์
  amount: number; // ช่องงบประมาณ
  anuName?: string; // ภาพรวมของอนุที่ได้รับรายได้
  note?: string;
  rowNumber?: number;
}

export interface RevenueParseResult {
  totalIncome: number;
  totalRevenue: number;
  items: RevenueItem[];
  warnings: string[];
  filename?: string;
  sheetName?: string;
  audit?: ParseAuditReport;
}

export interface FY69Item {
  id: string;
  activity: string;
  budget69: number;
  actual69: number;
  anuName?: string;
  rowNumber?: number;
}

export interface FY69ParseResult {
  items: FY69Item[];
  totalBudget69: number;
  totalReq69: number;
  totalActual69: number;
  warnings: string[];
  filename?: string;
  sheetName?: string;
  audit?: ParseAuditReport;
}
