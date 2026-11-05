import {
  OrderDelivery,
  ProductReturn,
  PaymentToComplete,
  DeliveryStatus,
  CourierType,
  DeliveryPriority,
  ReturnReason,
  ReturnStatus,
  PaymentMethodType,
  PaymentStatus
} from '../types';

export interface ParseResult<T> {
  success: boolean;
  data: T[];
  errors: string[];
  totalRows: number;
  validCount: number;
  detectedDelimiter?: string;
  detectedFormat?: 'csv' | 'tsv' | 'semicolon' | 'pipe' | 'json';
}

// -------------------------------------------------------------
// Helper: Clean currency and numbers with commas or symbols
// Handles: "$1,249.50", "1.249,50 €", "250.00", "  $ 99 ", "1250,00"
// -------------------------------------------------------------
export function parseCleanNumber(val: any, fallback = 0): number {
  if (typeof val === 'number') return isNaN(val) ? fallback : val;
  if (!val) return fallback;

  let str = String(val).trim();
  // Remove explicit currency words like Rs., Rs, INR first
  str = str.replace(/(?:rs\.?|inr)/gi, '').trim();
  // Remove currency symbols, letters, spaces
  str = str.replace(/[$€£¥₹\sA-Za-z]/g, '');

  if (!str) return fallback;

  // If contains '.' as decimal (like 1,25,000.50 or 1,250.00)
  if (str.includes('.') && str.includes(',')) {
    const lastDot = str.lastIndexOf('.');
    const lastComma = str.lastIndexOf(',');
    if (lastComma > lastDot) {
      // European format: 1.250,50 -> 1250.50
      str = str.replace(/\./g, '').replace(',', '.');
    } else {
      // US or Indian format with multiple commas: 1,25,000.50 -> 125000.50
      str = str.replace(/,/g, '');
    }
  } else if (str.includes(',')) {
    // Only comma: check if European decimal or Indian/US integer grouping
    const commaIndex = str.lastIndexOf(',');
    // If there are multiple commas, it's definitely integer grouping (e.g. 1,25,000)
    if (str.indexOf(',') !== commaIndex) {
      str = str.replace(/,/g, '');
    } else if (str.length - commaIndex === 3 && parseInt(str.substring(commaIndex + 1), 10) < 100) {
      // Like 12,50 or 125,50 -> European decimal
      str = str.replace(',', '.');
    } else {
      str = str.replace(/,/g, '');
    }
  }

  const num = parseFloat(str);
  return isNaN(num) ? fallback : num;
}

// -------------------------------------------------------------
// Helper: Normalize date strings to standard ISO YYYY-MM-DD
// Handles: "2026-11-05", "11/05/2026", "05-11-2026", "2026/11/05", "Nov 5, 2026"
// -------------------------------------------------------------
export function normalizeDateToIso(dateStr?: any, fallbackDate?: string): string {
  const fallback = fallbackDate || new Date().toISOString().substring(0, 10);
  if (!dateStr || typeof dateStr !== 'string') return fallback;

  const trimmed = dateStr.trim();
  if (!trimmed) return fallback;

  // Already YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    return trimmed;
  }

  // YYYY/MM/DD
  if (/^\d{4}\/\d{1,2}\/\d{1,2}$/.test(trimmed)) {
    const parts = trimmed.split('/');
    return `${parts[0]}-${parts[1].padStart(2, '0')}-${parts[2].padStart(2, '0')}`;
  }

  // MM/DD/YYYY or DD/MM/YYYY
  if (/^\d{1,2}[/-]\d{1,2}[/-]\d{2,4}$/.test(trimmed)) {
    const separator = trimmed.includes('/') ? '/' : '-';
    const parts = trimmed.split(separator);
    let year = parts[2];
    if (year.length === 2) year = `20${year}`;
    const part1 = parseInt(parts[0], 10);
    const part2 = parseInt(parts[1], 10);

    // If first part > 12, it must be DD/MM/YYYY
    if (part1 > 12) {
      return `${year}-${String(part2).padStart(2, '0')}-${String(part1).padStart(2, '0')}`;
    }
    // Default to MM/DD/YYYY
    return `${year}-${String(part1).padStart(2, '0')}-${String(part2).padStart(2, '0')}`;
  }

  // Native Date fallback
  const parsed = new Date(trimmed);
  if (!isNaN(parsed.getTime())) {
    return parsed.toISOString().substring(0, 10);
  }

  return fallback;
}

// -------------------------------------------------------------
// Helper: Auto-detect CSV delimiter (comma, semicolon, tab, pipe)
// -------------------------------------------------------------
export function detectDelimiter(text: string): { delimiter: string; format: 'csv' | 'tsv' | 'semicolon' | 'pipe' } {
  // Strip BOM
  const clean = text.replace(/^\uFEFF/, '');
  const lines = clean.split(/\r?\n/).filter(line => line.trim().length > 0).slice(0, 5);

  if (lines.length === 0) {
    return { delimiter: ',', format: 'csv' };
  }

  const delimiters = [
    { char: '\t', format: 'tsv' as const },
    { char: ';', format: 'semicolon' as const },
    { char: ',', format: 'csv' as const },
    { char: '|', format: 'pipe' as const }
  ];

  let bestDelim = ',';
  let bestFormat: 'csv' | 'tsv' | 'semicolon' | 'pipe' = 'csv';
  let maxScore = -1;

  for (const { char, format } of delimiters) {
    let countInFirstLine = 0;
    let insideQuotes = false;
    for (let i = 0; i < lines[0].length; i++) {
      if (lines[0][i] === '"') insideQuotes = !insideQuotes;
      else if (lines[0][i] === char && !insideQuotes) countInFirstLine++;
    }

    if (countInFirstLine > 0) {
      // Check consistency across next lines
      let consistent = true;
      let total = countInFirstLine;

      for (let j = 1; j < lines.length; j++) {
        let count = 0;
        let quotes = false;
        for (let k = 0; k < lines[j].length; k++) {
          if (lines[j][k] === '"') quotes = !quotes;
          else if (lines[j][k] === char && !quotes) count++;
        }
        if (count === 0 && lines[j].length > 10) consistent = false;
        total += count;
      }

      const score = total * (consistent ? 2 : 1);
      if (score > maxScore) {
        maxScore = score;
        bestDelim = char;
        bestFormat = format;
      }
    }
  }

  return { delimiter: bestDelim, format: bestFormat };
}

// -------------------------------------------------------------
// Helper: Robust CSV line parser with quotes and multi-delimiter support
// -------------------------------------------------------------
export function parseCsvRows(text: string, forceDelimiter?: string): string[][] {
  const cleanText = text.replace(/^\uFEFF/, '');
  const delimiter = forceDelimiter || detectDelimiter(cleanText).delimiter;

  const lines: string[][] = [];
  let currentRow: string[] = [];
  let currentField = '';
  let insideQuotes = false;

  for (let i = 0; i < cleanText.length; i++) {
    const char = cleanText[i];
    const nextChar = cleanText[i + 1];

    if (char === '"') {
      if (insideQuotes && nextChar === '"') {
        currentField += '"';
        i++; // skip escaped quote
      } else {
        insideQuotes = !insideQuotes;
      }
    } else if (char === delimiter && !insideQuotes) {
      currentRow.push(currentField.trim());
      currentField = '';
    } else if ((char === '\r' || char === '\n') && !insideQuotes) {
      if (char === '\r' && nextChar === '\n') {
        i++; // skip \n
      }
      currentRow.push(currentField.trim());
      if (currentRow.some(field => field.length > 0)) {
        lines.push(currentRow);
      }
      currentRow = [];
      currentField = '';
    } else {
      currentField += char;
    }
  }

  if (currentField.length > 0 || currentRow.length > 0) {
    currentRow.push(currentField.trim());
    if (currentRow.some(field => field.length > 0)) {
      lines.push(currentRow);
    }
  }

  return lines;
}

// -------------------------------------------------------------
// Helper: Check and parse JSON content (objects or array)
// -------------------------------------------------------------
export function tryParseJson<T>(text: string): T[] | null {
  const trimmed = text.replace(/^\uFEFF/, '').trim();
  if (!trimmed.startsWith('[') && !trimmed.startsWith('{')) {
    return null;
  }

  try {
    const parsed = JSON.parse(trimmed);
    if (Array.isArray(parsed)) {
      return parsed;
    }
    if (typeof parsed === 'object' && parsed !== null) {
      // Look for common array wrappers
      for (const key of ['orders', 'deliveries', 'returns', 'payments', 'data', 'items', 'rows']) {
        if (Array.isArray(parsed[key])) {
          return parsed[key];
        }
      }
    }
  } catch {
    return null;
  }
  return null;
}

// -------------------------------------------------------------
// Helper: Identify Header Row index (supports files with titles on row 0)
// -------------------------------------------------------------
function findHeaderRowIndex(rows: string[][], keywords: string[]): number {
  if (rows.length === 0) return -1;
  const maxCheck = Math.min(rows.length, 5);

  let bestIndex = 0;
  let maxMatches = -1;

  for (let i = 0; i < maxCheck; i++) {
    const row = rows[i];
    let matches = 0;
    const cleanCells = row.map(cell => cell.toLowerCase().replace(/[^a-z0-9]/g, ''));

    for (const cell of cleanCells) {
      if (keywords.some(kw => cell.includes(kw) || kw.includes(cell))) {
        matches++;
      }
    }

    if (matches > maxMatches && matches >= 1) {
      maxMatches = matches;
      bestIndex = i;
    }
  }

  return maxMatches >= 1 ? bestIndex : 0;
}

// -------------------------------------------------------------
// 1. Robust Orders / Deliveries Parser
// -------------------------------------------------------------
export function parseOrdersCsv(rawText: string): ParseResult<Partial<OrderDelivery>> {
  // Check JSON format first
  const jsonData = tryParseJson<any>(rawText);
  if (jsonData && jsonData.length > 0) {
    const results: Partial<OrderDelivery>[] = [];
    jsonData.forEach((item, idx) => {
      const id = String(item.id || item.orderId || item.order_id || item.orderNumber || `ORD-IMP-${idx + 1}`);
      const customerName = String(item.customerName || item.customer || item.name || item.client || 'Customer');
      const totalAmount = parseCleanNumber(item.totalAmount ?? item.total ?? item.amount ?? 50);
      const courier = (item.courier || item.carrier || 'FedEx Ground') as CourierType;
      const trackingNumber = String(item.trackingNumber || item.tracking || `TRK-${Math.floor(10000000 + Math.random() * 90000000)}`);
      const statusRaw = String(item.status || item.deliveryStatus || 'awaiting_dispatch').toLowerCase().replace(/[\s-]/g, '_');
      
      let status: DeliveryStatus = 'awaiting_dispatch';
      if (['in_transit', 'intransit', 'shipped', 'dispatched'].includes(statusRaw)) status = 'in_transit';
      else if (['out_for_delivery', 'outfordelivery'].includes(statusRaw)) status = 'out_for_delivery';
      else if (['delivered', 'fulfilled', 'completed'].includes(statusRaw)) status = 'delivered';
      else if (['delayed', 'failed', 'hold'].includes(statusRaw)) status = 'delayed';

      results.push({
        id,
        customerName,
        customerEmail: String(item.customerEmail || item.email || 'customer@store.com'),
        destination: {
          city: String(item.destination?.city || item.city || 'New York'),
          state: String(item.destination?.state || item.state || 'NY'),
          address: String(item.destination?.address || item.address || '100 Central Way'),
          postalCode: String(item.destination?.postalCode || item.zip || '10001')
        },
        orderDate: normalizeDateToIso(item.orderDate || item.date),
        deliveryDueDate: normalizeDateToIso(item.deliveryDueDate || item.dueDate || item.sla, new Date(Date.now() + 3 * 86400000).toISOString().substring(0, 10)),
        items: Array.isArray(item.items) && item.items.length > 0 ? item.items : [
          {
            sku: String(item.sku || 'APX-EL-001'),
            name: String(item.productName || item.product || 'E-Commerce Retail Item'),
            quantity: parseInt(String(item.quantity || 1), 10) || 1,
            unitPrice: totalAmount
          }
        ],
        totalAmount,
        courier,
        trackingNumber,
        status,
        priority: 'standard',
        paymentStatus: 'paid'
      });
    });

    return {
      success: results.length > 0,
      data: results,
      errors: [],
      totalRows: jsonData.length,
      validCount: results.length,
      detectedFormat: 'json'
    };
  }

  // Parse CSV / TSV / Semicolon
  const { delimiter, format } = detectDelimiter(rawText);
  const rows = parseCsvRows(rawText, delimiter);

  if (rows.length === 0) {
    return {
      success: false,
      data: [],
      errors: ['File is empty. Please upload a file containing order rows.'],
      totalRows: 0,
      validCount: 0,
      detectedDelimiter: delimiter,
      detectedFormat: format
    };
  }

  const orderKeywords = ['order', 'id', 'customer', 'name', 'courier', 'carrier', 'tracking', 'status', 'total', 'amount', 'date'];
  const headerRowIdx = findHeaderRowIndex(rows, orderKeywords);
  const headerRow = rows[headerRowIdx];

  const rawHeaders = headerRow.map(h => h.toLowerCase().replace(/[^a-z0-9]/g, ''));
  const headerMap: Record<string, number> = {};
  rawHeaders.forEach((h, idx) => {
    headerMap[h] = idx;
  });

  const getCol = (row: string[], ...aliases: string[]): string => {
    for (const alias of aliases) {
      const clean = alias.toLowerCase().replace(/[^a-z0-9]/g, '');
      if (headerMap[clean] !== undefined && row[headerMap[clean]] !== undefined) {
        return row[headerMap[clean]].trim();
      }
    }
    // Partial substring match fallback if no exact clean header
    for (const alias of aliases) {
      const clean = alias.toLowerCase().replace(/[^a-z0-9]/g, '');
      for (const [key, idx] of Object.entries(headerMap)) {
        if ((key.includes(clean) || clean.includes(key)) && row[idx] !== undefined) {
          return row[idx].trim();
        }
      }
    }
    return '';
  };

  const results: Partial<OrderDelivery>[] = [];
  const errors: string[] = [];

  const startRow = headerRowIdx + 1;
  const dataRows = rows.slice(startRow);

  for (let i = 0; i < dataRows.length; i++) {
    const row = dataRows[i];
    const lineNum = startRow + i + 1;

    // Check if entire row is empty
    if (!row.some(cell => cell.trim().length > 0)) {
      continue;
    }

    // 1. Order ID resolution
    let id = getCol(
      row,
      'orderid', 'order_id', 'order', 'id', 'orderno', 'order_no', 'ordernumber',
      'order_number', 'ponumber', 'po', 'invoiceno', 'invoice_no', 'invoice', 'ref', 'reference'
    );

    // If ID is missing, check if column 0 looks like an order id or identifier
    if (!id && row[0] && row[0].trim().length > 0) {
      id = row[0].trim();
    }
    if (!id) {
      id = `ORD-${Date.now().toString().slice(-4)}-${i + 1}`;
    }

    // 2. Customer Name resolution
    let customerName = getCol(
      row,
      'customername', 'customer_name', 'customer', 'name', 'client', 'clientname',
      'buyer', 'recipient', 'fullname', 'full_name', 'contact', 'shipto', 'billto'
    );

    // Fallback: look for a string that is not the ID or status
    if (!customerName) {
      for (let c = 0; c < row.length; c++) {
        const val = row[c].trim();
        if (c !== headerMap[id.toLowerCase().replace(/[^a-z0-9]/g, '')] &&
            val.length > 2 &&
            !/^\d+$/.test(val) &&
            !/^[\d.,$]+$/.test(val) &&
            val !== id) {
          customerName = val;
          break;
        }
      }
    }
    if (!customerName) {
      customerName = `Retail Customer #${i + 1}`;
    }

    // 3. Customer Email
    const customerEmail = getCol(row, 'customeremail', 'customer_email', 'email', 'mail', 'contact_email') || 'customer@store.com';

    // 4. Destination Address & City
    const city = getCol(row, 'city', 'destinationcity', 'shipcity', 'shippingcity', 'town') || 'New York';
    const state = getCol(row, 'state', 'destinationstate', 'shipstate', 'shippingstate', 'province', 'region') || 'NY';
    const address = getCol(row, 'address', 'street', 'streetaddress', 'destinationaddress', 'shippingaddress') || '100 Central Way';
    const postalCode = getCol(row, 'postalcode', 'zip', 'zipcode', 'postcode') || '10001';

    // 5. Amount & Quantity
    const totalRaw = getCol(row, 'totalamount', 'total_amount', 'total', 'amount', 'ordertotal', 'price', 'grandtotal', 'subtotal', 'value');
    const totalAmount = parseCleanNumber(totalRaw, 50.00);

    const qtyRaw = getCol(row, 'quantity', 'qty', 'count', 'units', 'pieces', 'pcs');
    const quantity = parseInt(qtyRaw, 10) || 1;

    // 6. Courier & Tracking
    let courierRaw = getCol(row, 'courier', 'carrier', 'shippingmethod', 'shipvia', 'logistics', 'deliveryprovider');
    let courier: CourierType = 'FedEx Ground';
    if (/ups/i.test(courierRaw)) courier = 'UPS Next Day';
    else if (/dhl/i.test(courierRaw)) courier = 'DHL Express';
    else if (/usps/i.test(courierRaw)) courier = 'USPS Priority';
    else if (/fedex/i.test(courierRaw)) courier = 'FedEx Ground';

    let trackingNumber = getCol(row, 'trackingnumber', 'tracking_number', 'tracking', 'trackingcode', 'tracking_no', 'awb', 'waybill');
    if (!trackingNumber) {
      trackingNumber = `TRK-${Math.floor(10000000 + Math.random() * 90000000)}`;
    }

    // 7. Status mapping
    const statusRaw = getCol(row, 'status', 'orderstatus', 'deliverystatus', 'shippingstatus', 'state').toLowerCase().replace(/[\s-]/g, '_');
    let status: DeliveryStatus = 'awaiting_dispatch';
    if (['in_transit', 'intransit', 'transit', 'shipped', 'dispatched'].some(s => statusRaw.includes(s))) {
      status = 'in_transit';
    } else if (['out_for_delivery', 'outfordelivery', 'out_for_shipment'].some(s => statusRaw.includes(s))) {
      status = 'out_for_delivery';
    } else if (['delivered', 'fulfilled', 'completed', 'received', 'signed'].some(s => statusRaw.includes(s))) {
      status = 'delivered';
    } else if (['delayed', 'failed', 'hold', 'exception', 'cancelled', 'canceled'].some(s => statusRaw.includes(s))) {
      status = 'delayed';
    }

    // 8. Dates with ISO normalization
    const orderDateRaw = getCol(row, 'orderdate', 'order_date', 'date', 'created_at', 'purchasedate');
    const orderDate = normalizeDateToIso(orderDateRaw);

    const dueDateRaw = getCol(row, 'deliveryduedate', 'delivery_due_date', 'duedate', 'due_date', 'sla', 'estimated_delivery', 'due');
    const deliveryDueDate = normalizeDateToIso(dueDateRaw, new Date(Date.now() + 3 * 86400000).toISOString().substring(0, 10));

    // 9. Item Details
    const sku = getCol(row, 'sku', 'itemsku', 'productsku', 'itemcode', 'code') || 'APX-EL-001';
    const productName = getCol(row, 'productname', 'product_name', 'product', 'itemname', 'item_name', 'item', 'description') || 'E-Commerce Retail Item';

    results.push({
      id,
      customerName,
      customerEmail,
      destination: {
        city,
        state,
        address,
        postalCode
      },
      orderDate,
      deliveryDueDate,
      items: [
        {
          sku,
          name: productName,
          quantity,
          unitPrice: quantity > 0 ? (totalAmount > 0 ? totalAmount / quantity : 50) : 50
        }
      ],
      totalAmount: totalAmount > 0 ? totalAmount : 50 * quantity,
      courier,
      trackingNumber,
      status,
      priority: 'standard',
      paymentStatus: 'paid'
    });
  }

  return {
    success: results.length > 0,
    data: results,
    errors,
    totalRows: dataRows.length,
    validCount: results.length,
    detectedDelimiter: delimiter,
    detectedFormat: format
  };
}

// -------------------------------------------------------------
// 2. Robust Returns (RMA) Parser
// -------------------------------------------------------------
export function parseReturnsCsv(rawText: string): ParseResult<Partial<ProductReturn>> {
  // Check JSON format
  const jsonData = tryParseJson<any>(rawText);
  if (jsonData && jsonData.length > 0) {
    const results: Partial<ProductReturn>[] = [];
    jsonData.forEach((item, idx) => {
      const id = String(item.id || item.rmaId || item.rma || `RMA-IMP-${idx + 1}`);
      const orderId = String(item.orderId || item.orderRef || item.order || 'ORD-EXT');
      const customerName = String(item.customerName || item.customer || 'Retail Customer');
      const refundAmount = parseCleanNumber(item.refundAmount ?? item.amount ?? item.refund ?? 50);

      const statusRaw = String(item.status || 'pending_inspection').toLowerCase();
      let status: ReturnStatus = 'pending_inspection';
      if (statusRaw.includes('restock')) status = 'restocked';
      else if (statusRaw.includes('approv')) status = 'approved';
      else if (statusRaw.includes('scrap') || statusRaw.includes('damage')) status = 'scrapped';
      else if (statusRaw.includes('reject')) status = 'rejected';

      results.push({
        id,
        orderId,
        customerName,
        sku: String(item.sku || 'APX-EL-001'),
        productName: String(item.productName || item.product || 'Returned Product Item'),
        quantity: parseInt(String(item.quantity || 1), 10) || 1,
        returnDate: normalizeDateToIso(item.returnDate || item.date),
        reason: (item.reason || 'defective') as ReturnReason,
        status,
        refundAmount,
        refundStatus: status === 'restocked' || status === 'scrapped' ? 'processed' : 'pending',
        inspectionNotes: String(item.inspectionNotes || item.notes || 'Imported via JSON upload'),
        restockedToInventory: status === 'restocked'
      });
    });

    return {
      success: results.length > 0,
      data: results,
      errors: [],
      totalRows: jsonData.length,
      validCount: results.length,
      detectedFormat: 'json'
    };
  }

  const { delimiter, format } = detectDelimiter(rawText);
  const rows = parseCsvRows(rawText, delimiter);

  if (rows.length === 0) {
    return {
      success: false,
      data: [],
      errors: ['File is empty. Please upload return records.'],
      totalRows: 0,
      validCount: 0,
      detectedDelimiter: delimiter,
      detectedFormat: format
    };
  }

  const rmaKeywords = ['rma', 'return', 'order', 'customer', 'sku', 'product', 'refund', 'reason', 'status', 'date'];
  const headerRowIdx = findHeaderRowIndex(rows, rmaKeywords);
  const headerRow = rows[headerRowIdx];

  const rawHeaders = headerRow.map(h => h.toLowerCase().replace(/[^a-z0-9]/g, ''));
  const headerMap: Record<string, number> = {};
  rawHeaders.forEach((h, idx) => {
    headerMap[h] = idx;
  });

  const getCol = (row: string[], ...aliases: string[]): string => {
    for (const alias of aliases) {
      const clean = alias.toLowerCase().replace(/[^a-z0-9]/g, '');
      if (headerMap[clean] !== undefined && row[headerMap[clean]] !== undefined) {
        return row[headerMap[clean]].trim();
      }
    }
    for (const alias of aliases) {
      const clean = alias.toLowerCase().replace(/[^a-z0-9]/g, '');
      for (const [key, idx] of Object.entries(headerMap)) {
        if ((key.includes(clean) || clean.includes(key)) && row[idx] !== undefined) {
          return row[idx].trim();
        }
      }
    }
    return '';
  };

  const results: Partial<ProductReturn>[] = [];
  const errors: string[] = [];

  const startRow = headerRowIdx + 1;
  const dataRows = rows.slice(startRow);

  for (let i = 0; i < dataRows.length; i++) {
    const row = dataRows[i];
    if (!row.some(cell => cell.trim().length > 0)) continue;

    let id = getCol(row, 'rmaid', 'returnid', 'rma', 'id', 'return_id', 'rmanumber');
    if (!id && row[0] && row[0].trim().length > 0) id = row[0].trim();
    if (!id) id = `RMA-${Date.now().toString().slice(-4)}-${i + 1}`;

    const orderId = getCol(row, 'orderid', 'orderref', 'order_id', 'order', 'orderno') || 'ORD-EXT';
    let customerName = getCol(row, 'customername', 'customer_name', 'customer', 'name', 'buyer') || `Customer #${i + 1}`;
    const sku = getCol(row, 'sku', 'itemsku', 'productsku', 'itemcode') || 'APX-EL-001';
    const productName = getCol(row, 'productname', 'product_name', 'product', 'item', 'itemname') || 'Returned Product Item';
    const quantity = parseInt(getCol(row, 'quantity', 'qty', 'count'), 10) || 1;
    const returnDate = normalizeDateToIso(getCol(row, 'returndate', 'return_date', 'date', 'created_at'));
    const refundAmount = parseCleanNumber(getCol(row, 'refundamount', 'refund_amount', 'refund', 'amount', 'total'), 50);

    const reasonRaw = getCol(row, 'reason', 'returnreason', 'return_reason', 'issue').toLowerCase().replace(/[\s-]/g, '_');
    let reason: ReturnReason = 'defective';
    if (['wrong_size', 'size', 'sizing'].some(s => reasonRaw.includes(s))) reason = 'wrong_size';
    else if (['not_as_described', 'description', 'not_described'].some(s => reasonRaw.includes(s))) reason = 'not_as_described';
    else if (['changed_mind', 'mind', 'remorse'].some(s => reasonRaw.includes(s))) reason = 'changed_mind';
    else if (['late_delivery', 'late', 'delayed'].some(s => reasonRaw.includes(s))) reason = 'late_delivery';

    const statusRaw = getCol(row, 'status', 'returnstatus', 'return_status', 'disposition').toLowerCase().replace(/[\s-]/g, '_');
    let status: ReturnStatus = 'pending_inspection';
    if (statusRaw.includes('restock')) status = 'restocked';
    else if (statusRaw.includes('approv')) status = 'approved';
    else if (statusRaw.includes('scrap') || statusRaw.includes('damage')) status = 'scrapped';
    else if (statusRaw.includes('reject')) status = 'rejected';

    const notes = getCol(row, 'notes', 'inspectionnotes', 'comment', 'memo') || 'Imported via file upload';

    results.push({
      id,
      orderId,
      customerName,
      sku,
      productName,
      quantity,
      returnDate,
      reason,
      status,
      refundAmount,
      refundStatus: status === 'restocked' || status === 'scrapped' ? 'processed' : 'pending',
      inspectionNotes: notes,
      restockedToInventory: status === 'restocked'
    });
  }

  return {
    success: results.length > 0,
    data: results,
    errors,
    totalRows: dataRows.length,
    validCount: results.length,
    detectedDelimiter: delimiter,
    detectedFormat: format
  };
}

// -------------------------------------------------------------
// 3. Robust Payments & Receivables Parser
// -------------------------------------------------------------
export function parsePaymentsCsv(rawText: string): ParseResult<Partial<PaymentToComplete>> {
  // Check JSON format
  const jsonData = tryParseJson<any>(rawText);
  if (jsonData && jsonData.length > 0) {
    const results: Partial<PaymentToComplete>[] = [];
    jsonData.forEach((item, idx) => {
      const id = String(item.id || item.paymentId || item.invoiceId || item.payment_id || `PAY-IMP-${idx + 1}`);
      const orderId = String(item.orderId || item.orderRef || item.order || 'ORD-EXT');
      const customerName = String(item.customerName || item.customer || item.name || 'Client / Customer');
      const amount = parseCleanNumber(item.amount ?? item.totalAmount ?? item.total ?? 100);
      const amountPaid = parseCleanNumber(item.amountPaid ?? item.paid ?? 0);
      const dueDate = normalizeDateToIso(item.dueDate || item.date || item.due);

      const typeRaw = String(item.paymentType || item.method || item.type || 'net30').toLowerCase();
      let paymentType: PaymentMethodType = 'net30';
      if (typeRaw.includes('cod') || typeRaw.includes('delivery')) paymentType = 'cod';
      else if (typeRaw.includes('upi') || typeRaw.includes('gpay') || typeRaw.includes('phonepe') || typeRaw.includes('paytm') || typeRaw.includes('qr')) paymentType = 'upi';
      else if (typeRaw.includes('card') || typeRaw.includes('stripe') || typeRaw.includes('razorpay')) paymentType = 'credit_card_authorized';
      else if (typeRaw.includes('wire') || typeRaw.includes('ach') || typeRaw.includes('bank') || typeRaw.includes('neft') || typeRaw.includes('imps')) paymentType = 'bank_wire';

      let status: PaymentStatus = 'pending';
      if (amountPaid >= amount && amount > 0) status = 'completed';
      else if (amountPaid > 0) status = 'partially_paid';

      results.push({
        id,
        orderId,
        customerName,
        customerEmail: String(item.customerEmail || item.email || 'billing@client.com'),
        amount,
        amountPaid,
        paymentType,
        dueDate,
        status,
        courierCollected: paymentType === 'cod' && status === 'completed',
        referenceNotes: String(item.referenceNotes || item.notes || 'Imported via JSON upload')
      });
    });

    return {
      success: results.length > 0,
      data: results,
      errors: [],
      totalRows: jsonData.length,
      validCount: results.length,
      detectedFormat: 'json'
    };
  }

  const { delimiter, format } = detectDelimiter(rawText);
  const rows = parseCsvRows(rawText, delimiter);

  if (rows.length === 0) {
    return {
      success: false,
      data: [],
      errors: ['File is empty. Please upload payment records.'],
      totalRows: 0,
      validCount: 0,
      detectedDelimiter: delimiter,
      detectedFormat: format
    };
  }

  const payKeywords = ['payment', 'invoice', 'order', 'amount', 'paid', 'due', 'status', 'method', 'type', 'customer'];
  const headerRowIdx = findHeaderRowIndex(rows, payKeywords);
  const headerRow = rows[headerRowIdx];

  const rawHeaders = headerRow.map(h => h.toLowerCase().replace(/[^a-z0-9]/g, ''));
  const headerMap: Record<string, number> = {};
  rawHeaders.forEach((h, idx) => {
    headerMap[h] = idx;
  });

  const getCol = (row: string[], ...aliases: string[]): string => {
    for (const alias of aliases) {
      const clean = alias.toLowerCase().replace(/[^a-z0-9]/g, '');
      if (headerMap[clean] !== undefined && row[headerMap[clean]] !== undefined) {
        return row[headerMap[clean]].trim();
      }
    }
    for (const alias of aliases) {
      const clean = alias.toLowerCase().replace(/[^a-z0-9]/g, '');
      for (const [key, idx] of Object.entries(headerMap)) {
        if ((key.includes(clean) || clean.includes(key)) && row[idx] !== undefined) {
          return row[idx].trim();
        }
      }
    }
    return '';
  };

  const results: Partial<PaymentToComplete>[] = [];
  const errors: string[] = [];

  const startRow = headerRowIdx + 1;
  const dataRows = rows.slice(startRow);

  for (let i = 0; i < dataRows.length; i++) {
    const row = dataRows[i];
    if (!row.some(cell => cell.trim().length > 0)) continue;

    let id = getCol(row, 'paymentid', 'payment_id', 'payment', 'id', 'invoiceid', 'invoice_id', 'invoiceno', 'invoice');
    if (!id && row[0] && row[0].trim().length > 0) id = row[0].trim();
    if (!id) id = `PAY-${Date.now().toString().slice(-4)}-${i + 1}`;

    const orderId = getCol(row, 'orderid', 'order_id', 'order', 'orderref', 'orderno') || 'ORD-EXT';
    let customerName = getCol(row, 'customername', 'customer_name', 'customer', 'name', 'client', 'billto') || `Client #${i + 1}`;
    const customerEmail = getCol(row, 'customeremail', 'customer_email', 'email', 'mail') || 'billing@client.com';

    const amountRaw = getCol(row, 'amount', 'totalamount', 'total_amount', 'total', 'invoice_amount', 'balance');
    const amount = parseCleanNumber(amountRaw, 100.00);

    const paidRaw = getCol(row, 'amountpaid', 'amount_paid', 'paid', 'received', 'collected');
    const amountPaid = parseCleanNumber(paidRaw, 0);

    const dueDateRaw = getCol(row, 'duedate', 'due_date', 'date', 'due', 'expiry', 'payment_date');
    const dueDate = normalizeDateToIso(dueDateRaw);

    const typeRaw = getCol(row, 'paymenttype', 'payment_type', 'type', 'method', 'channel').toLowerCase().replace(/[\s-]/g, '_');
    let paymentType: PaymentMethodType = 'net30';
    if (['cod', 'cash_on_delivery', 'cashondelivery'].some(s => typeRaw.includes(s))) paymentType = 'cod';
    else if (['upi', 'gpay', 'phonepe', 'paytm', 'bhim', 'qr'].some(s => typeRaw.includes(s))) paymentType = 'upi';
    else if (['credit_card', 'creditcard', 'card', 'stripe', 'razorpay', 'debit'].some(s => typeRaw.includes(s))) paymentType = 'credit_card_authorized';
    else if (['bank_wire', 'wire', 'ach', 'bank', 'neft', 'imps', 'rtgs', 'netbanking'].some(s => typeRaw.includes(s))) paymentType = 'bank_wire';

    let status: PaymentStatus = 'pending';
    if (amountPaid >= amount && amount > 0) status = 'completed';
    else if (amountPaid > 0) status = 'partially_paid';

    const statusCol = getCol(row, 'status', 'paymentstatus', 'state').toLowerCase();
    if (statusCol.includes('completed') || statusCol.includes('paid')) status = 'completed';
    else if (statusCol.includes('partial')) status = 'partially_paid';
    else if (statusCol.includes('overdue')) status = 'overdue';

    const notes = getCol(row, 'notes', 'reference', 'referencenotes', 'memo') || 'Imported via file upload';

    results.push({
      id,
      orderId,
      customerName,
      customerEmail,
      amount,
      amountPaid,
      paymentType,
      dueDate,
      status,
      courierCollected: paymentType === 'cod' && status === 'completed',
      referenceNotes: notes
    });
  }

  return {
    success: results.length > 0,
    data: results,
    errors,
    totalRows: dataRows.length,
    validCount: results.length,
    detectedDelimiter: delimiter,
    detectedFormat: format
  };
}

// -------------------------------------------------------------
// Sample Templates
// -------------------------------------------------------------
export function generateSampleCsv(type: 'orders' | 'returns' | 'payments'): string {
  if (type === 'orders') {
    return `Order ID,Customer Name,Customer Email,City,State,Address,Total Amount,Courier,Tracking Number,Status,Order Date,Delivery Due Date,Product Name,SKU,Quantity
ORD-2026-9050,Victoria Sterling,victoria@sterling.com,Denver,CO,1200 Peak View Way,249.00,FedEx Ground,FX-9901827361,in_transit,2026-11-04,2026-11-07,AcousticPro Wireless ANC Headphones,APX-EL-001,1
ORD-2026-9051,Liam Gallagher,liam.g@oasiscrafts.io,Austin,TX,444 River Street,119.00,UPS Next Day,1Z882AA0192837465,awaiting_dispatch,2026-11-05,2026-11-08,Precision Barista Electric Gooseneck Kettle,APX-HK-201,1
ORD-2026-9043,Aria Sterling,aria.sterling@designhub.co,San Francisco,CA,488 Brannan St,275.00,DHL Express,DHL-9034827101,delivered,2026-11-05,2026-11-08,Merino Wool Crewneck Sweater,APX-AP-101,2`;
  }

  if (type === 'returns') {
    return `RMA ID,Order ID,Customer Name,SKU,Product Name,Quantity,Return Date,Return Reason,Status,Refund Amount,Inspection Notes
RMA-2026-0520,ORD-2026-9041,Marcus Vance,APX-EL-001,AcousticPro Wireless ANC Headphones,1,2026-11-05,wrong_size,pending_inspection,189.00,Customer ordered standard instead of travel edition
RMA-2026-0521,ORD-2026-9044,Derrick Henderson,APX-SP-401,ProGrip Insulated Stainless Steel Flask,1,2026-11-04,defective,approved,32.00,Minor dent on outer vacuum seal rim`;
  }

  return `Payment ID,Order ID,Customer Name,Customer Email,Total Amount,Amount Paid,Payment Type,Due Date,Notes
PAY-2026-1110,ORD-2026-9050,Aarav Sharma,aarav.sharma@techcorp.in,2499.00,2499.00,upi,2026-11-04,UPI payment ref #99482910 via Google Pay
PAY-2026-1111,ORD-2026-9051,Pooja Patel,pooja.patel@craftindia.org,1199.00,0.00,cod,2026-11-08,Cash-on-Delivery (COD) awaiting courier collection
PAY-2026-1112,ORD-2026-8991,OmniTrade India Pvt Ltd,finance@omnitrade.in,14500.00,14500.00,bank_wire,2026-11-02,NEFT / IMPS B2B wire settlement`;
}
