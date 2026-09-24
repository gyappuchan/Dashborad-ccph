import * as XLSX from 'xlsx';
import {
  BudgetItem,
  ParseResult,
  RevenueItem,
  RevenueParseResult,
  FY69Item,
  FY69ParseResult,
  RawRowAudit,
  ParseAuditReport,
} from '../types/budget';

/**
 * Universal number cleaner:
 * Handles commas, baht symbols, non-breaking spaces (\u00A0), negative in parentheses,
 * trailing text like "บาท", dashes, and empty strings.
 */
export function cleanNumber(val: any): number {
  if (typeof val === 'number') return isNaN(val) ? 0 : val;
  if (val === null || val === undefined) return 0;

  let str = String(val)
    .replace(/\u00A0/g, ' ')
    .replace(/฿/g, '')
    .replace(/,/g, '')
    .trim();

  if (!str || str === '-' || str === '–' || str === '—' || str === 'N/A' || str === 'null') {
    return 0;
  }

  // Handle accounting parentheses: (500,000) -> -500000
  if (str.startsWith('(') && str.endsWith(')')) {
    str = '-' + str.slice(1, -1).trim();
  }

  // Remove trailing "บาท" or other text words
  str = str.replace(/[^\d.-]/g, '');

  const parsed = parseFloat(str);
  return isNaN(parsed) ? 0 : parsed;
}

/**
 * Finds the best sheet containing data in a workbook
 */
function getBestSheet(
  workbook: XLSX.WorkBook,
  preferredKeywords: string[] = []
): { sheetName: string; rawJson: any[][] } {
  if (!workbook.SheetNames || workbook.SheetNames.length === 0) {
    throw new Error('ไม่พบแผ่นงาน (Sheet) ในไฟล์ Excel ที่อัปโหลด');
  }

  let bestSheetName = workbook.SheetNames[0];
  if (preferredKeywords.length > 0) {
    const match = workbook.SheetNames.find((s) => {
      const lower = s.toLowerCase();
      return preferredKeywords.some((k) => lower.includes(k.toLowerCase()));
    });
    if (match) bestSheetName = match;
  }

  let worksheet = workbook.Sheets[bestSheetName];
  let rawJson: any[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' });

  // If first sheet is empty, scan other sheets
  if (!rawJson || rawJson.length < 2) {
    for (const name of workbook.SheetNames) {
      const ws = workbook.Sheets[name];
      const json: any[][] = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });
      if (json && json.length >= 2) {
        bestSheetName = name;
        worksheet = ws;
        rawJson = json;
        break;
      }
    }
  }

  return { sheetName: bestSheetName, rawJson: rawJson || [] };
}

/**
 * Finds the true table header row (skips title banners at top)
 */
function findTableHeader(
  rawJson: any[][],
  primaryTextKw: string[],
  primaryNumKw: string[]
): { headerIdx: number; headers: string[] } {
  let headerIdx = -1;

  for (let i = 0; i < Math.min(25, rawJson.length); i++) {
    const row = rawJson[i];
    if (!row || row.length === 0) continue;

    const nonEmptyCells = row.filter((c) => String(c).trim().length > 0);
    if (nonEmptyCells.length < 2) continue; // Skip single-cell banner titles

    const rowStr = row.map((c) => String(c)).join(' ').toLowerCase();

    const hasText = primaryTextKw.some((k) => rowStr.includes(k.toLowerCase()));
    const hasNum = primaryNumKw.some((k) => rowStr.includes(k.toLowerCase()));

    if (hasText && hasNum) {
      headerIdx = i;
      break;
    }
  }

  if (headerIdx === -1) {
    for (let i = 0; i < Math.min(25, rawJson.length); i++) {
      const row = rawJson[i];
      if (!row || row.length < 2) continue;
      const nonEmptyCells = row.filter((c) => String(c).trim().length > 0);
      if (nonEmptyCells.length < 2) continue;

      const rowStr = row.map((c) => String(c)).join(' ').toLowerCase();
      if (
        rowStr.includes('รายการ') ||
        rowStr.includes('กิจกรรม') ||
        rowStr.includes('โครงการ') ||
        rowStr.includes('งบประมาณ') ||
        rowStr.includes('จ่ายจริง') ||
        rowStr.includes('รายได้') ||
        rowStr.includes('รหัส')
      ) {
        headerIdx = i;
        break;
      }
    }
  }

  if (headerIdx === -1) headerIdx = 0;

  const headers = rawJson[headerIdx].map((h) => String(h).trim().toLowerCase());
  return { headerIdx, headers };
}

/**
 * Helper to identify if a row is a Grand Total row
 */
function isGrandTotalRow(text: string): boolean {
  const norm = text.replace(/[\s\-_:]/g, '').toLowerCase();
  return (
    norm === 'รวมทั้งหมด' ||
    norm === 'รวมทั้งสิ้น' ||
    norm === 'ยอดรวมทั้งหมด' ||
    norm === 'ยอดรวมทั้งสิ้น' ||
    norm === 'รวม' ||
    norm === 'total' ||
    norm === 'grandtotal' ||
    norm === 'รวมรายรับทั้งหมด' ||
    norm === 'รวมรายรับทั้งสิ้น' ||
    norm === 'รวมงบประมาณทั้งสิ้น' ||
    norm === 'รวมจ่ายจริงทั้งสิ้น' ||
    norm.startsWith('รวมทั้งสิ้น') ||
    norm.startsWith('ยอดรวมทั้งสิ้น')
  );
}

/**
 * Helper to identify if a row is an Overview / Committee Sub-total row
 */
function isCommitteeOverviewRow(text: string): boolean {
  const norm = text.trim();
  // Section headers like "1. อนุสภาด้าน...", "อนุสภาด้าน...", "หมวด 1 ...", "กลุ่มงาน..."
  if (norm.startsWith('หมวด') || norm.startsWith('ส่วนที่') || norm.startsWith('กลุ่มงาน')) {
    return true;
  }
  if (
    norm.includes('อนุสภา') ||
    norm.includes('อนุกรรมการ')
  ) {
    // Distinguish a committee header row from an activity like "ค่าเบี้ยประชุมคณะอนุกรรมการ"
    if (
      norm.startsWith('1.') ||
      norm.startsWith('2.') ||
      norm.startsWith('3.') ||
      norm.startsWith('4.') ||
      norm.startsWith('5.') ||
      norm.startsWith('6.') ||
      norm.startsWith('7.') ||
      norm.startsWith('8.') ||
      norm.startsWith('9.') ||
      norm.startsWith('อนุสภา') ||
      norm.startsWith('คณะอนุสภา') ||
      norm.startsWith('รวมอนุสภา') ||
      norm.startsWith('ยอดรวมอนุสภา') ||
      norm.startsWith('ช่องรวม') ||
      norm.includes('ด้านวิชาการ') ||
      norm.includes('ด้านจรรยาบรรณ') ||
      norm.includes('ด้านการประเมิน') ||
      norm.includes('ด้านการบริหาร')
    ) {
      return true;
    }
  }

  // Row like "รวมอนุสภา..." or "รวมด้าน..."
  if (norm.startsWith('รวมอนุ') || norm.startsWith('รวมด้าน') || norm.startsWith('ยอดรวมของอนุ')) {
    return true;
  }

  return false;
}

// ------------------------------------------------------------------------------------
// 1. REVENUE 2570 PARSER (ประมาณการรายได้ 2570)
// ------------------------------------------------------------------------------------
export function parseRevenueExcel(fileBuffer: ArrayBuffer, fileName: string): RevenueParseResult {
  const warnings: string[] = [];
  const workbook = XLSX.read(fileBuffer, { type: 'array' });

  const { sheetName, rawJson } = getBestSheet(workbook, ['รายได้', 'รายรับ', 'income', 'revenue', '2570', '70']);

  if (!rawJson || rawJson.length < 1) {
    throw new Error('ไฟล์ประมาณการรายได้ว่างเปล่า');
  }

  const { headerIdx, headers } = findTableHeader(
    rawJson,
    ['รายการ', 'ที่มา', 'แหล่ง', 'ประเภท', 'ชื่อรายการ', 'revenue', 'source', 'title', 'name', 'กิจกรรม'],
    ['งบประมาณ', 'ประมาณการ', 'จำนวนเงิน', 'ยอดเงิน', 'บาท', '2570', '70', 'amount', 'income', 'budget']
  );

  // Exact priority-based column selection for Revenue 70
  // PRIORITY 1: Column with explicit 2570 / 70 revenue keywords
  let amountCol = headers.findIndex((h) =>
    ['ประมาณการ 70', 'ประมาณการ 2570', 'ปี 70', 'ปี 2570', 'รายรับ 70', 'รายรับ 2570', 'รายได้ 70', 'รายได้ 2570', '2570', 'ปี70', 'ปี2570'].some(
      (k) => h.includes(k)
    )
  );

  // PRIORITY 2: General revenue / estimate keywords (EXCLUDING previous years 68, 69, 2568, 2569)
  if (amountCol === -1) {
    amountCol = headers.findIndex((h) => {
      const isPastYear = h.includes('68') || h.includes('69') || h.includes('2568') || h.includes('2569');
      if (isPastYear) return false;
      return ['ประมาณการรายรับ', 'ประมาณการรายได้', 'ประมาณการ', 'ยอดเงิน', 'จำนวนเงิน', 'งบประมาณ', 'บาท', 'income', 'revenue', 'amount'].some(
        (k) => h.includes(k)
      );
    });
  }

  let sourceCol = headers.findIndex((h) =>
    ['รายการ', 'ที่มา', 'แหล่ง', 'ประเภท', 'ชื่อรายการ', 'ชื่อ', 'revenue', 'source', 'title', 'name', 'กิจกรรม'].some(
      (k) => h.includes(k)
    )
  );
  let idCol = headers.findIndex((h) => ['รหัส', 'code', 'id', 'ลำดับ', 'no'].some((k) => h.includes(k)));
  let anuCol = headers.findIndex((h) =>
    ['ภาพรวมของอนุ', 'อนุที่ได้รับ', 'อนุสภา', 'อนุกรรมการ', 'หน่วยงาน', 'สังกัด', 'ฝ่าย', 'กลุ่ม', 'committee'].some(
      (k) => h.includes(k)
    )
  );

  const startRow = headerIdx >= 0 ? headerIdx + 1 : 0;

  // Fallback heuristic if columns were not found
  if (sourceCol === -1 || amountCol === -1) {
    const sampleRows = rawJson.slice(startRow, Math.min(startRow + 15, rawJson.length));
    const maxCols = Math.max(...sampleRows.map((r) => r.length), 3);

    let bestTextCol = -1;
    let maxAvgLength = 0;
    for (let c = 0; c < maxCols; c++) {
      let totalLength = 0;
      let textCount = 0;
      for (const r of sampleRows) {
        const val = r[c];
        if (val !== undefined && val !== null) {
          const str = String(val).trim();
          if (/[a-zA-Z\u0E00-\u0E7F]/.test(str) && isNaN(Number(str.replace(/,/g, '')))) {
            totalLength += str.length;
            textCount++;
          }
        }
      }
      const avgLen = textCount > 0 ? totalLength / textCount : 0;
      if (avgLen > maxAvgLength) {
        maxAvgLength = avgLen;
        bestTextCol = c;
      }
    }
    sourceCol = bestTextCol !== -1 ? bestTextCol : 1;

    let bestNumCol = -1;
    let maxNumTotal = 0;
    for (let c = 0; c < maxCols; c++) {
      if (c === sourceCol || c === idCol) continue;
      let sum = 0;
      for (const r of sampleRows) {
        const num = cleanNumber(r[c]);
        if (num > 0) sum += num;
      }
      if (sum > maxNumTotal) {
        maxNumTotal = sum;
        bestNumCol = c;
      }
    }
    amountCol = bestNumCol !== -1 ? bestNumCol : (sourceCol === 1 ? 2 : 1);
  }

  // Row-by-row parsing and audit collection
  interface TempRow {
    rowNumber: number;
    rawText: string;
    extractedName: string;
    extractedAmount: number;
    extractedAnu: string;
    isOverview: boolean;
    isGrandTotal: boolean;
  }

  const rawRows: TempRow[] = [];
  let currentAnu = 'สภาการสาธารณสุขชุมชน (ส่วนกลาง)';
  let fileGrandTotal = 0;

  for (let r = startRow; r < rawJson.length; r++) {
    const row = rawJson[r];
    if (!row || row.length === 0) continue;

    let sourceVal = sourceCol >= 0 && row[sourceCol] !== undefined ? String(row[sourceCol]).trim() : '';
    let amountVal = amountCol >= 0 ? cleanNumber(row[amountCol]) : 0;
    let rowAnu = anuCol >= 0 && row[anuCol] ? String(row[anuCol]).trim() : '';

    // If sourceVal is empty, find text in another column
    if (!sourceVal) {
      for (let c = 0; c < row.length; c++) {
        if (c === amountCol) continue;
        const val = row[c];
        if (val !== undefined && val !== null) {
          const str = String(val).trim();
          if (str && /[a-zA-Z\u0E00-\u0E7F]/.test(str) && isNaN(Number(str.replace(/,/g, '')))) {
            sourceVal = str;
            break;
          }
        }
      }
    }

    // If amountVal is 0, check other columns (excluding ID col)
    if (amountVal === 0) {
      for (let c = 0; c < row.length; c++) {
        if (c === sourceCol || c === idCol) continue;
        const num = cleanNumber(row[c]);
        if (num > 0) {
          amountVal = num;
          break;
        }
      }
    }

    const rawJoined = row.map((c) => String(c)).join(' | ');

    if (!sourceVal && amountVal === 0) {
      continue; // Skip truly blank rows
    }

    const isGrand = isGrandTotalRow(sourceVal);
    if (isGrand) {
      if (amountVal > 0) fileGrandTotal = amountVal;
    }

    const isOverview = !isGrand && isCommitteeOverviewRow(sourceVal);
    if (isOverview) {
      currentAnu = sourceVal;
    } else if (rowAnu) {
      currentAnu = rowAnu;
    }

    rawRows.push({
      rowNumber: r + 1,
      rawText: rawJoined,
      extractedName: sourceVal,
      extractedAmount: amountVal,
      extractedAnu: rowAnu || currentAnu,
      isOverview,
      isGrandTotal: isGrand,
    });
  }

  // Section-based reconciliation:
  // Decide whether to count the overview row or the sub-items for each section!
  const auditRows: RawRowAudit[] = [];
  const items: RevenueItem[] = [];

  for (let i = 0; i < rawRows.length; i++) {
    const row = rawRows[i];

    if (row.isGrandTotal) {
      auditRows.push({
        rowNumber: row.rowNumber,
        rawText: row.rawText,
        extractedName: row.extractedName,
        extractedAmount: row.extractedAmount,
        extractedAnu: row.extractedAnu,
        rowRole: 'grand_total',
        isCounted: false,
        statusMessage: 'แถวรวมทั้งหมดท้ายตารางในไฟล์ (ใช้ตรวจสอบยอดสุทธิ ไม่บวกซ้ำ)',
      });
      continue;
    }

    if (row.isOverview) {
      // Look ahead to check if there are sub-items under this committee overview row
      let subItemsCount = 0;
      let subItemsTotal = 0;

      for (let j = i + 1; j < rawRows.length; j++) {
        const next = rawRows[j];
        if (next.isOverview || next.isGrandTotal) break;
        if (next.extractedAmount > 0) {
          subItemsCount++;
          subItemsTotal += next.extractedAmount;
        }
      }

      if (subItemsCount > 0) {
        // Detailed sub-items exist under this overview row!
        // We will count the sub-items and SKIP the overview row to prevent doubling!
        auditRows.push({
          rowNumber: row.rowNumber,
          rawText: row.rawText,
          extractedName: row.extractedName,
          extractedAmount: row.extractedAmount,
          extractedAnu: row.extractedAnu,
          rowRole: 'overview',
          isCounted: false,
          statusMessage: `แถวภาพรวมอนุสภา (มีรายการย่อย ${subItemsCount} รายการ รวม ฿${subItemsTotal.toLocaleString('th-TH')} อยู่ด้านล่าง) — ไม่บวกซ้ำ`,
        });
      } else if (row.extractedAmount > 0) {
        // No sub-items exist! The overview row holds the entire budget for this committee!
        items.push({
          id: `REV-${items.length + 1}`,
          source: row.extractedName,
          amount: row.extractedAmount,
          anuName: row.extractedAnu,
          rowNumber: row.rowNumber,
        });
        auditRows.push({
          rowNumber: row.rowNumber,
          rawText: row.rawText,
          extractedName: row.extractedName,
          extractedAmount: row.extractedAmount,
          extractedAnu: row.extractedAnu,
          rowRole: 'detail',
          isCounted: true,
          statusMessage: 'นำเข้ายอดเงินจากแถวภาพรวมอนุสภา (เนื่องจากไม่มีรายการย่อยแตกรายละเอียด)',
        });
      } else {
        // Overview row with 0 amount (just a section header)
        auditRows.push({
          rowNumber: row.rowNumber,
          rawText: row.rawText,
          extractedName: row.extractedName,
          extractedAmount: 0,
          extractedAnu: row.extractedAnu,
          rowRole: 'overview',
          isCounted: false,
          statusMessage: 'แถวหัวข้อภาพรวมอนุสภา (ไม่มีระบุยอดเงิน)',
        });
      }
    } else {
      // Normal detail row
      if (row.extractedAmount > 0) {
        items.push({
          id: `REV-${items.length + 1}`,
          source: row.extractedName,
          amount: row.extractedAmount,
          anuName: row.extractedAnu,
          rowNumber: row.rowNumber,
        });
        auditRows.push({
          rowNumber: row.rowNumber,
          rawText: row.rawText,
          extractedName: row.extractedName,
          extractedAmount: row.extractedAmount,
          extractedAnu: row.extractedAnu,
          rowRole: 'detail',
          isCounted: true,
          statusMessage: 'นำเข้าเป็นรายการรายรับย่อยปกติ',
        });
      } else {
        auditRows.push({
          rowNumber: row.rowNumber,
          rawText: row.rawText,
          extractedName: row.extractedName,
          extractedAmount: 0,
          extractedAnu: row.extractedAnu,
          rowRole: 'skipped',
          isCounted: false,
          statusMessage: 'ข้ามเนื่องจากยอดเงินเป็น 0',
        });
      }
    }
  }

  const parsedSum = items.reduce((sum, item) => sum + item.amount, 0);

  // If no items were parsed but fileGrandTotal exists
  if (parsedSum === 0 && fileGrandTotal > 0) {
    items.push({
      id: 'REV-01',
      source: 'ประมาณการรายรับรวมปี 2570 (ตามไฟล์)',
      amount: fileGrandTotal,
      anuName: 'สภาการสาธารณสุขชุมชน (ส่วนกลาง)',
    });
  }

  const finalTotal = items.reduce((sum, item) => sum + item.amount, 0);

  const auditReport: ParseAuditReport = {
    dataType: 'revenue70',
    filename: fileName,
    sheetName,
    totalRowsScanned: rawJson.length,
    detectedColumns: {
      'รายการรายรับ': sourceCol >= 0 ? `คอลัมน์ ${sourceCol + 1} (${headers[sourceCol] || 'ตรวจจับอัตโนมัติ'})` : 'ไม่พบ',
      'งบประมาณรายรับ': amountCol >= 0 ? `คอลัมน์ ${amountCol + 1} (${headers[amountCol] || 'ตรวจจับอัตโนมัติ'})` : 'ไม่พบ',
      'ภาพรวมอนุสภา': anuCol >= 0 ? `คอลัมน์ ${anuCol + 1} (${headers[anuCol] || 'ตรวจจับอัตโนมัติ'})` : 'ตรวจจับจากแถวสีฟ้า/หัวหมวด',
    },
    fileGrandTotal,
    parsedSum: finalTotal,
    itemsCount: items.length,
    overviewCount: auditRows.filter((r) => r.rowRole === 'overview').length,
    reconciliationDiff: fileGrandTotal > 0 ? finalTotal - fileGrandTotal : 0,
    rows: auditRows,
  };

  return {
    totalIncome: finalTotal,
    totalRevenue: finalTotal,
    items,
    warnings,
    filename: fileName,
    sheetName,
    audit: auditReport,
  };
}

// ------------------------------------------------------------------------------------
// 2. ACTUAL 2569 PARSER (ผลการจ่ายจริงปี 2569)
// ------------------------------------------------------------------------------------
export function parseFY69Excel(fileBuffer: ArrayBuffer, fileName: string): FY69ParseResult {
  const warnings: string[] = [];
  const workbook = XLSX.read(fileBuffer, { type: 'array' });

  const { sheetName, rawJson } = getBestSheet(workbook, ['จ่ายจริง', '69', '2569', 'actual', 'ผลการเบิกจ่าย']);

  if (!rawJson || rawJson.length < 1) {
    throw new Error('ไฟล์ข้อมูลปี 2569 ว่างเปล่า');
  }

  const { headerIdx, headers } = findTableHeader(
    rawJson,
    ['กิจกรรม', 'โครงการ', 'รายการ', 'รายละเอียด', 'ชื่อรายการ', 'activity', 'project', 'title', 'ลำดับ'],
    ['งบประมาณ', 'จ่ายจริง', 'คำขอ', 'จำนวนเงิน', 'ยอดเงิน', 'บาท', 'amount', 'budget', 'actual', '69', '2569']
  );

  // Exact priority-based column selection for จ่ายจริง 69
  // MUST match actual/disbursed keywords and strictly EXCLUDE request/คำขอ!
  let act69Col = headers.findIndex((h) => {
    const isReq = h.includes('คำขอ') || h.includes('request') || h.includes('เสนอขอ');
    if (isReq) return false;
    return ['จ่ายจริง 2569', 'จ่ายจริง 69', 'จ่ายจริงปี 69', 'จ่ายจริงปี 2569', 'จ่ายจริง', 'เบิกจ่าย 2569', 'เบิกจ่าย 69', 'เบิกจ่ายจริง', 'เบิกจ่าย', 'ใช้จริง 2569', 'ใช้จริง 69', 'ใช้จริง', 'actual 69', 'actual 2569', 'actual'].some(
      (k) => h.includes(k)
    );
  });

  // Column for คำขอ 69 (if combined file)
  let req69Col = headers.findIndex((h) => {
    const isAct = h.includes('จ่ายจริง') || h.includes('actual') || h.includes('เบิกจ่าย') || h.includes('ใช้จริง');
    if (isAct) return false;
    return ['คำขอ 2569', 'คำขอ 69', 'คำขอปี 69', 'คำขอปี 2569', 'งบ 69', 'งบประมาณ 69', 'งบประมาณ 2569', 'budget 69', 'คำของบประมาณ'].some(
      (k) => h.includes(k)
    );
  });

  // If this is a standalone actual file and act69Col wasn't found, check generic budget column
  const isActualFile = fileName.toLowerCase().includes('จ่ายจริง') || fileName.toLowerCase().includes('actual');
  if (act69Col === -1 && isActualFile) {
    act69Col = headers.findIndex((h) =>
      ['งบประมาณ', 'จำนวนเงิน', 'ยอดเงิน', 'บาท', 'amount', 'budget'].some((k) => h.includes(k))
    );
  } else if (req69Col === -1 && !isActualFile && fileName.toLowerCase().includes('คำขอ')) {
    req69Col = headers.findIndex((h) =>
      ['งบประมาณ', 'จำนวนเงิน', 'ยอดเงิน', 'บาท', 'amount', 'budget'].some((k) => h.includes(k))
    );
  }

  let actCol = headers.findIndex((h) =>
    ['รายละเอียดกิจกรรม', 'รายกิจกรรม', 'กิจกรรม', 'โครงการ', 'รายการ', 'ชื่อรายการ', 'activity', 'project', 'title', 'name'].some(
      (k) => h.includes(k)
    )
  );
  let idCol = headers.findIndex((h) => ['รหัสโครงการ', 'รหัส', 'code', 'id', 'ลำดับ'].some((k) => h.includes(k)));
  let anuCol = headers.findIndex((h) =>
    ['ช่องรวมของอนุนั้นๆ', 'ช่องรวมของอนุ', 'อนุสภา', 'อนุกรรมการ', 'หน่วยงาน', 'สังกัด', 'หมวด', 'department', 'committee'].some(
      (k) => h.includes(k)
    )
  );

  const startRow = headerIdx >= 0 ? headerIdx + 1 : 0;

  // Fallback dynamic column detection
  if (actCol === -1 || (act69Col === -1 && req69Col === -1)) {
    const sampleRows = rawJson.slice(startRow, Math.min(startRow + 15, rawJson.length));
    const maxCols = Math.max(...sampleRows.map((r) => r.length), 3);

    let bestTextCol = -1;
    let maxAvgLength = 0;
    for (let c = 0; c < maxCols; c++) {
      let totalLength = 0;
      let textCount = 0;
      for (const r of sampleRows) {
        const val = r[c];
        if (val !== undefined && val !== null) {
          const str = String(val).trim();
          if (/[a-zA-Z\u0E00-\u0E7F]/.test(str) && isNaN(Number(str.replace(/,/g, '')))) {
            totalLength += str.length;
            textCount++;
          }
        }
      }
      const avgLen = textCount > 0 ? totalLength / textCount : 0;
      if (avgLen > maxAvgLength) {
        maxAvgLength = avgLen;
        bestTextCol = c;
      }
    }
    actCol = bestTextCol !== -1 ? bestTextCol : 1;

    let bestNumCol = -1;
    let maxNumTotal = 0;
    for (let c = 0; c < maxCols; c++) {
      if (c === actCol || c === idCol) continue;
      let sum = 0;
      for (const r of sampleRows) {
        const num = cleanNumber(r[c]);
        if (num > 0) sum += num;
      }
      if (sum > maxNumTotal) {
        maxNumTotal = sum;
        bestNumCol = c;
      }
    }

    if (isActualFile || act69Col !== -1) {
      act69Col = bestNumCol !== -1 ? bestNumCol : (actCol === 1 ? 2 : 1);
    } else {
      req69Col = bestNumCol !== -1 ? bestNumCol : (actCol === 1 ? 2 : 1);
    }
  }

  interface TempFYRow {
    rowNumber: number;
    rawText: string;
    idVal: string;
    actVal: string;
    req69Val: number;
    act69Val: number;
    anuVal: string;
    isOverview: boolean;
    isGrandTotal: boolean;
  }

  const rawRows: TempFYRow[] = [];
  let currentAnu = 'สภาการสาธารณสุขชุมชน (ส่วนกลาง)';
  let fileGrandTotal = 0;

  for (let r = startRow; r < rawJson.length; r++) {
    const row = rawJson[r];
    if (!row || row.length === 0) continue;

    let idVal = idCol >= 0 && row[idCol] !== undefined ? String(row[idCol]).trim() : '';
    let actVal = actCol >= 0 && row[actCol] !== undefined ? String(row[actCol]).trim() : '';
    let req69Val = req69Col >= 0 ? cleanNumber(row[req69Col]) : 0;
    let act69Val = act69Col >= 0 ? cleanNumber(row[act69Col]) : 0;
    let explicitAnu = anuCol >= 0 && row[anuCol] ? String(row[anuCol]).trim() : '';

    // Search other columns if actVal is empty
    if (!actVal) {
      for (let c = 0; c < row.length; c++) {
        if (c === req69Col || c === act69Col) continue;
        const val = row[c];
        if (val !== undefined && val !== null) {
          const str = String(val).trim();
          if (str && /[a-zA-Z\u0E00-\u0E7F]/.test(str) && isNaN(Number(str.replace(/,/g, '')))) {
            actVal = str;
            break;
          }
        }
      }
    }

    if (!actVal && req69Val === 0 && act69Val === 0) continue;

    const isGrand = isGrandTotalRow(actVal);
    if (isGrand) {
      const gTotal = act69Val > 0 ? act69Val : req69Val;
      if (gTotal > 0) fileGrandTotal = gTotal;
    }

    const isOverview = !isGrand && isCommitteeOverviewRow(actVal);
    if (isOverview) {
      currentAnu = actVal;
    } else if (explicitAnu) {
      currentAnu = explicitAnu;
    }

    const rawJoined = row.map((c) => String(c)).join(' | ');

    rawRows.push({
      rowNumber: r + 1,
      rawText: rawJoined,
      idVal,
      actVal,
      req69Val,
      act69Val,
      anuVal: explicitAnu || currentAnu,
      isOverview,
      isGrandTotal: isGrand,
    });
  }

  // Section-based reconciliation to prevent double counting of "ช่องรวมของอนุนั้นๆ"
  const auditRows: RawRowAudit[] = [];
  const items: FY69Item[] = [];

  for (let i = 0; i < rawRows.length; i++) {
    const row = rawRows[i];

    if (row.isGrandTotal) {
      auditRows.push({
        rowNumber: row.rowNumber,
        rawText: row.rawText,
        extractedName: row.actVal,
        extractedAmount: row.act69Val > 0 ? row.act69Val : row.req69Val,
        extractedAnu: row.anuVal,
        rowRole: 'grand_total',
        isCounted: false,
        statusMessage: 'แถวรวมทั้งหมดท้ายตาราง (ใช้ตรวจสอบยอดสุทธิ ไม่นำไปบวกซ้ำ)',
      });
      continue;
    }

    if (row.isOverview) {
      // Look ahead for sub-items under this committee overview row
      let subItemsCount = 0;
      let subItemsActualTotal = 0;

      for (let j = i + 1; j < rawRows.length; j++) {
        const next = rawRows[j];
        if (next.isOverview || next.isGrandTotal) break;
        if (next.act69Val > 0 || next.req69Val > 0 || next.actVal) {
          subItemsCount++;
          subItemsActualTotal += next.act69Val;
        }
      }

      if (subItemsCount > 0) {
        // Detailed sub-items exist under this committee! Skip the subtotal row to avoid doubling!
        auditRows.push({
          rowNumber: row.rowNumber,
          rawText: row.rawText,
          extractedName: row.actVal,
          extractedAmount: row.act69Val > 0 ? row.act69Val : row.req69Val,
          extractedAnu: row.anuVal,
          rowRole: 'overview',
          isCounted: false,
          statusMessage: `ช่องรวมของอนุนั้นๆ (มีรายการย่อย ${subItemsCount} รายการ รวมจ่ายจริง ฿${subItemsActualTotal.toLocaleString('th-TH')}) — ไม่บวกซ้ำ`,
        });
      } else if (row.act69Val > 0 || row.req69Val > 0) {
        // No sub-items under this committee! Keep the overview row as the item!
        items.push({
          id: row.idVal || '',
          activity: row.actVal,
          budget69: row.req69Val,
          actual69: row.act69Val,
          anuName: row.anuVal,
          rowNumber: row.rowNumber,
        });
        auditRows.push({
          rowNumber: row.rowNumber,
          rawText: row.rawText,
          extractedName: row.actVal,
          extractedAmount: row.act69Val > 0 ? row.act69Val : row.req69Val,
          extractedAnu: row.anuVal,
          rowRole: 'detail',
          isCounted: true,
          statusMessage: 'นำเข้ายอดจากช่องรวมของอนุ (เนื่องจากไม่มีรายการย่อย)',
        });
      } else {
        auditRows.push({
          rowNumber: row.rowNumber,
          rawText: row.rawText,
          extractedName: row.actVal,
          extractedAmount: 0,
          extractedAnu: row.anuVal,
          rowRole: 'overview',
          isCounted: false,
          statusMessage: 'แถวหัวข้ออนุสภา (ไม่มีระบุยอดเงิน)',
        });
      }
    } else {
      // Normal detail row
      if (row.actVal || row.act69Val > 0 || row.req69Val > 0) {
        items.push({
          id: row.idVal,
          activity: row.actVal || (row.idVal ? `โครงการรหัส ${row.idVal}` : `รายการที่ ${items.length + 1}`),
          budget69: row.req69Val,
          actual69: row.act69Val,
          anuName: row.anuVal,
          rowNumber: row.rowNumber,
        });
        auditRows.push({
          rowNumber: row.rowNumber,
          rawText: row.rawText,
          extractedName: row.actVal,
          extractedAmount: row.act69Val > 0 ? row.act69Val : row.req69Val,
          extractedAnu: row.anuVal,
          rowRole: 'detail',
          isCounted: true,
          statusMessage: 'นำเข้าเป็นรายการกิจกรรมย่อยปกติ',
        });
      } else {
        auditRows.push({
          rowNumber: row.rowNumber,
          rawText: row.rawText,
          extractedName: row.actVal,
          extractedAmount: 0,
          extractedAnu: row.anuVal,
          rowRole: 'skipped',
          isCounted: false,
          statusMessage: 'ข้ามแถวว่าง',
        });
      }
    }
  }

  const totalBudget69 = items.reduce((sum, item) => sum + item.budget69, 0);
  const totalActual69 = items.reduce((sum, item) => sum + item.actual69, 0);
  const parsedSum = totalActual69 > 0 ? totalActual69 : totalBudget69;

  const auditReport: ParseAuditReport = {
    dataType: isActualFile ? 'actual69' : 'req69',
    filename: fileName,
    sheetName,
    totalRowsScanned: rawJson.length,
    detectedColumns: {
      'รายกิจกรรม': actCol >= 0 ? `คอลัมน์ ${actCol + 1} (${headers[actCol] || 'ตรวจจับอัตโนมัติ'})` : 'ไม่พบ',
      'จ่ายจริง 69': act69Col >= 0 ? `คอลัมน์ ${act69Col + 1} (${headers[act69Col] || 'ตรวจจับอัตโนมัติ'})` : 'ไม่พบ',
      'คำขอ 69': req69Col >= 0 ? `คอลัมน์ ${req69Col + 1} (${headers[req69Col] || 'ตรวจจับอัตโนมัติ'})` : 'ไม่พบ',
      'ช่องรวมของอนุ': anuCol >= 0 ? `คอลัมน์ ${anuCol + 1} (${headers[anuCol] || 'ตรวจจับอัตโนมัติ'})` : 'ตรวจจับจากแถวหัวข้อ/ช่องรวม',
    },
    fileGrandTotal,
    parsedSum,
    itemsCount: items.length,
    overviewCount: auditRows.filter((r) => r.rowRole === 'overview').length,
    reconciliationDiff: fileGrandTotal > 0 ? parsedSum - fileGrandTotal : 0,
    rows: auditRows,
  };

  return {
    items,
    totalBudget69,
    totalReq69: totalBudget69,
    totalActual69,
    warnings,
    filename: fileName,
    sheetName,
    audit: auditReport,
  };
}

export function parseActual69Excel(fileBuffer: ArrayBuffer, fileName: string): FY69ParseResult {
  return parseFY69Excel(fileBuffer, fileName.includes('จ่ายจริง') ? fileName : `จ่ายจริง_${fileName}`);
}

export function parseReq69Excel(fileBuffer: ArrayBuffer, fileName: string): FY69ParseResult {
  return parseFY69Excel(fileBuffer, fileName.includes('คำขอ') ? fileName : `คำขอ_${fileName}`);
}

// ------------------------------------------------------------------------------------
// 3. MAIN BUDGET 2570 PARSER (คำของบประมาณปี 2570)
// ------------------------------------------------------------------------------------
export function parseExcelData(fileBuffer: ArrayBuffer, fileName: string): ParseResult {
  const warnings: string[] = [];
  const workbook = XLSX.read(fileBuffer, { type: 'array' });

  const { sheetName, rawJson } = getBestSheet(workbook, ['คำขอ', '2570', '70', 'budget']);

  if (!rawJson || rawJson.length < 2) {
    throw new Error('ไฟล์ว่างเปล่าหรือมีข้อมูลไม่เพียงพอสำหรับการวิเคราะห์');
  }

  const { headerIdx, headers } = findTableHeader(
    rawJson,
    ['รหัส', 'กิจกรรม', 'โครงการ', 'รายการ', 'ชื่อรายการ', 'activity', 'project'],
    ['งบ', 'บาท', '2570', '70', 'คำขอ', 'budget', 'amount']
  );

  const findCol = (keywords: string[]) => headers.findIndex((h) => keywords.some((k) => h.includes(k)));

  let idCol = findCol(['รหัสโครงการ', 'รหัส', 'code', 'ลำดับรหัส', 'id']);
  let actCol = findCol(['รายละเอียดกิจกรรม', 'รายการกิจกรรม', 'กิจกรรม', 'โครงการ', 'ชื่อโครงการ', 'รายการ', 'ชื่อรายการ', 'activity', 'project', 'title', 'name']);
  let budgetCol = findCol(['คำขอปี 70', 'คำขอ 2570', 'คำขอ 70', 'คำของบประมาณปี 2570', 'คำของบประมาณ 2570', 'งบประมาณปี 70', 'งบประมาณ (บาท)', 'งบประมาณปี2570', 'งบประมาณ', 'ปี 70', 'ปี2570', '2570', '70', 'จำนวนเงิน', 'ยอดเงิน', 'budget', 'amount', 'บาท']);
  let budget69Col = -1;
  let actual69Col = -1;
  // Dynamic fallback
  if (actCol === -1 || actCol === idCol || budgetCol === -1) {
    const sampleRows = rawJson.slice(headerIdx + 1, Math.min(headerIdx + 15, rawJson.length));
    const maxCols = Math.max(...sampleRows.map((r) => r.length), 3);

    let bestTextCol = -1;
    let maxAvgLength = 0;
    for (let c = 0; c < maxCols; c++) {
      let totalLength = 0;
      let textCount = 0;
      for (const r of sampleRows) {
        const val = r[c];
        if (val !== undefined && val !== null) {
          const str = String(val).trim();
          if (/[a-zA-Z\u0E00-\u0E7F]/.test(str) && isNaN(Number(str.replace(/,/g, '')))) {
            totalLength += str.length;
            textCount++;
          }
        }
      }
      const avgLen = textCount > 0 ? totalLength / textCount : 0;
      if (avgLen > maxAvgLength) {
        maxAvgLength = avgLen;
        bestTextCol = c;
      }
    }
    actCol = bestTextCol !== -1 ? bestTextCol : 1;

    let bestNumCol = -1;
    let maxNumTotal = 0;
    for (let c = 0; c < maxCols; c++) {
      if (c === actCol || c === idCol) continue;
      let sum = 0;
      for (const r of sampleRows) {
        const num = cleanNumber(r[c]);
        if (num > 0) sum += num;
      }
      if (sum > maxNumTotal) {
        maxNumTotal = sum;
        bestNumCol = c;
      }
    }
    budgetCol = bestNumCol !== -1 ? bestNumCol : (actCol === 1 ? 2 : 1);
    if (idCol === -1 || idCol === actCol || idCol === budgetCol) {
      idCol = [0, 1, 2, 3].find((c) => c !== actCol && c !== budgetCol) ?? 0;
    }
  }

  let currentMainName = 'สภาการสาธารณสุขชุมชน (ส่วนกลาง)';
  let currentMainId = '';
  const parsedItems: BudgetItem[] = [];
  const auditRows: RawRowAudit[] = [];
  let fileGrandTotal = 0;

  for (let i = headerIdx + 1; i < rawJson.length; i++) {
    const row = rawJson[i];
    if (!row || row.length === 0) continue;

    let idStr = idCol !== -1 && row[idCol] !== undefined ? String(row[idCol]).trim() : '';
    let actStr = actCol !== -1 && row[actCol] !== undefined ? String(row[actCol]).trim() : '';

    if (!actStr) {
      for (let c = 0; c < row.length; c++) {
        if (c === budgetCol || c === budget69Col) continue;
        const cellVal = row[c];
        if (cellVal !== undefined && cellVal !== null) {
          const str = String(cellVal).trim();
          if (str && /[a-zA-Z\u0E00-\u0E7F]/.test(str) && isNaN(Number(str.replace(/,/g, '')))) {
            actStr = str;
            break;
          }
        }
      }
    }

    const budgetVal = budgetCol !== -1 ? cleanNumber(row[budgetCol]) : 0;
    const budget69Val = budget69Col !== -1 ? cleanNumber(row[budget69Col]) : 0;
    const actual69Val = actual69Col !== -1 ? cleanNumber(row[actual69Col]) : 0;

    if (!idStr && !actStr && budgetVal === 0 && budget69Val === 0 && actual69Val === 0) continue;

    const rawJoined = row.map((c) => String(c)).join(' | ');

    if (isGrandTotalRow(actStr)) {
      if (budgetVal > 0) fileGrandTotal = budgetVal;
      auditRows.push({
        rowNumber: i + 1,
        rawText: rawJoined,
        extractedName: actStr,
        extractedAmount: budgetVal,
        extractedAnu: currentMainName,
        rowRole: 'grand_total',
        isCounted: false,
        statusMessage: 'แถวรวมทั้งหมดท้ายตารางในไฟล์ (ไม่บวกซ้ำ)',
      });
      continue;
    }

    const isMainById = idStr.length > 0 && idStr.length <= 2;
    const isMainByText = !idStr && isCommitteeOverviewRow(actStr);
    const isMain = isMainById || isMainByText;

    if (isMain) {
      currentMainName = actStr || `รหัส ${idStr}`;
      currentMainId = idStr;
      auditRows.push({
        rowNumber: i + 1,
        rawText: rawJoined,
        extractedName: actStr,
        extractedAmount: budgetVal,
        extractedAnu: currentMainName,
        rowRole: 'overview',
        isCounted: false,
        statusMessage: 'แถวหัวข้อหมวดหมู่/อนุสภา',
      });
    } else {
      auditRows.push({
        rowNumber: i + 1,
        rawText: rawJoined,
        extractedName: actStr,
        extractedAmount: budgetVal,
        extractedAnu: currentMainName,
        rowRole: 'detail',
        isCounted: true,
        statusMessage: 'นำเข้าเป็นโครงการ/กิจกรรมคำขอปี 2570',
      });
    }

    parsedItems.push({
      id: idStr || (isMain ? currentMainId : '-'),
      activity: actStr || '(ไม่มีชื่อกิจกรรม)',
      budget: budgetVal,
      isMain: isMain,
      parentName: currentMainName,
      parentId: currentMainId,
      budget69: budget69Val > 0 ? budget69Val : undefined,
      actual69: actual69Val > 0 ? actual69Val : undefined,
    });
  }

  // Adjust parent totals
  const subItemsByParent = new Map<string, { budget70: number; budget69: number; actual69: number }>();
  for (const item of parsedItems) {
    if (!item.isMain) {
      const prev = subItemsByParent.get(item.parentName) || { budget70: 0, budget69: 0, actual69: 0 };
      prev.budget70 += item.budget;
      prev.budget69 += item.budget69 || 0;
      prev.actual69 += item.actual69 || 0;
      subItemsByParent.set(item.parentName, prev);
    }
  }

  for (const item of parsedItems) {
    if (item.isMain) {
      const subTotals = subItemsByParent.get(item.activity) || subItemsByParent.get(item.parentName);
      if (subTotals) {
        if (item.budget === 0) item.budget = subTotals.budget70;
        if (!item.budget69 || item.budget69 === 0) item.budget69 = subTotals.budget69 > 0 ? subTotals.budget69 : undefined;
        if (!item.actual69 || item.actual69 === 0) item.actual69 = subTotals.actual69 > 0 ? subTotals.actual69 : undefined;
      }
    }
  }

  const parsedSum = parsedItems.reduce((sum, item) => (!item.isMain ? sum + item.budget : sum), 0);

  const auditReport: ParseAuditReport = {
    dataType: 'budget70',
    filename: fileName,
    sheetName,
    totalRowsScanned: rawJson.length,
    detectedColumns: {
      'รหัสโครงการ': idCol >= 0 ? `คอลัมน์ ${idCol + 1}` : 'ไม่พบ',
      'รายละเอียดกิจกรรม': actCol >= 0 ? `คอลัมน์ ${actCol + 1}` : 'ไม่พบ',
      'คำขอปี 70': budgetCol >= 0 ? `คอลัมน์ ${budgetCol + 1}` : 'ไม่พบ',
    },
    fileGrandTotal,
    parsedSum,
    itemsCount: parsedItems.filter((it) => !it.isMain).length,
    overviewCount: parsedItems.filter((it) => it.isMain).length,
    reconciliationDiff: fileGrandTotal > 0 ? parsedSum - fileGrandTotal : 0,
    rows: auditRows,
  };

  return {
    data: parsedItems,
    warnings,
    filename: fileName,
    sheetName,
    audit: auditReport,
  };
}
