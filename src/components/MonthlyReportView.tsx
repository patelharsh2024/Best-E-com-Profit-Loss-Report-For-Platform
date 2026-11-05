import React, { useState } from 'react';
import {
  FileBarChart2,
  Download,
  Printer,
  Copy,
  Check,
  Truck,
  RotateCcw,
  CreditCard,
  Layers,
  Calendar,
  ArrowUpRight,
  ShieldCheck,
  TrendingUp,
  AlertCircle,
  Upload
} from 'lucide-react';
import {
  MonthlyReportSummary,
  OrderDelivery,
  ProductReturn,
  PaymentToComplete,
  InventoryItem
} from '../types';
import { exportToCsv } from '../utils/metrics';

interface MonthlyReportViewProps {
  reportSummary: MonthlyReportSummary;
  selectedMonth: string;
  onSelectMonth: (month: string) => void;
  availableMonths: Array<{ key: string; label: string }>;
  monthOrders: OrderDelivery[];
  monthReturns: ProductReturn[];
  monthPayments: PaymentToComplete[];
  inventory: InventoryItem[];
  onOpenUploadModal: (category?: 'orders' | 'returns' | 'payments') => void;
}

export const MonthlyReportView: React.FC<MonthlyReportViewProps> = ({
  reportSummary,
  selectedMonth,
  onSelectMonth,
  availableMonths,
  monthOrders,
  monthReturns,
  monthPayments,
  inventory,
  onOpenUploadModal
}) => {
  const [copiedSummary, setCopiedSummary] = useState(false);
  const { deliveries, returns: retMetrics, payments: payMetrics, inventory: invMetrics } = reportSummary;

  const handlePrint = () => {
    window.print();
  };

  const handleCopySummaryText = () => {
    const text = `
=== APEX COMMERCE OPERATIONS MONTHLY EXECUTIVE REPORT: ${reportSummary.monthLabel.toUpperCase()} ===

1. ORDERS & DELIVERY FULFILLMENT:
- Total Orders: ${deliveries.totalOrders}
- Delivered Orders: ${deliveries.deliveredCount}
- Active / In-Transit: ${deliveries.inTransitCount}
- Awaiting Dispatch: ${deliveries.awaitingDispatchCount}
- Delayed Shipments: ${deliveries.delayedCount}
- On-Time Delivery Rate: ${deliveries.onTimeDeliveryRate}%

2. RETURNED PRODUCTS & QUALITY RMA:
- Total Returns: ${retMetrics.totalReturns}
- Monthly Return Rate: ${retMetrics.returnRate}%
- Total Refund Value: $${retMetrics.totalRefundValue.toFixed(2)}
- Restocked into Stock: ${retMetrics.restockedCount}
- Scrapped / Damaged: ${retMetrics.scrappedCount}
- Pending Inspection: ${retMetrics.pendingInspectionCount}

3. CASH FLOW & PAYMENTS TO COMPLETE:
- Total Receivables: $${payMetrics.totalReceivable.toFixed(2)}
- Collected Revenue: $${payMetrics.collectedAmount.toFixed(2)}
- Outstanding Pending: $${payMetrics.pendingAmount.toFixed(2)}
- Collection Rate: ${payMetrics.collectionRate}%
- COD in Courier Transit: $${payMetrics.codPendingAmount.toFixed(2)}
- Overdue Receivables: $${payMetrics.overdueAmount.toFixed(2)}

4. INVENTORY HEALTH & VALUATION:
- Total Inventory Value: $${invMetrics.totalValuation.toFixed(2)}
- Tracked SKUs: ${invMetrics.totalSkus}
- Out-of-Stock SKUs: ${invMetrics.outOfStockCount}
- Low-Stock Alerts: ${invMetrics.lowStockCount}
- Reorder Trigger Recommendations: ${invMetrics.reorderRecommendations.length}
    `.trim();

    navigator.clipboard.writeText(text);
    setCopiedSummary(true);
    setTimeout(() => setCopiedSummary(false), 2000);
  };

  const handleExportOrdersCsv = () => {
    const rows = monthOrders.map(o => ({
      'Order ID': o.id,
      'Customer Name': o.customerName,
      'Customer Email': o.customerEmail,
      'City': o.destination.city,
      'State': o.destination.state,
      'Order Date': o.orderDate,
      'Due Date': o.deliveryDueDate,
      'Total Amount': o.totalAmount,
      'Courier': o.courier,
      'Tracking Number': o.trackingNumber,
      'Status': o.status,
      'Priority': o.priority
    }));
    exportToCsv(rows, `Orders_Report_${reportSummary.monthKey}`);
  };

  const handleExportReturnsCsv = () => {
    const rows = monthReturns.map(r => ({
      'RMA ID': r.id,
      'Order Ref': r.orderId,
      'Customer Name': r.customerName,
      'SKU': r.sku,
      'Product Name': r.productName,
      'Quantity': r.quantity,
      'Return Date': r.returnDate,
      'Reason': r.reason,
      'Status': r.status,
      'Refund Amount': r.refundAmount,
      'Refund Status': r.refundStatus,
      'Restocked': r.restockedToInventory ? 'Yes' : 'No'
    }));
    exportToCsv(rows, `Returns_Report_${reportSummary.monthKey}`);
  };

  const handleExportPaymentsCsv = () => {
    const rows = monthPayments.map(p => ({
      'Payment ID': p.id,
      'Order ID': p.orderId,
      'Customer Name': p.customerName,
      'Total Amount': p.amount,
      'Amount Paid': p.amountPaid,
      'Pending Balance': p.amount - p.amountPaid,
      'Payment Type': p.paymentType,
      'Due Date': p.dueDate,
      'Status': p.status,
      'Courier COD Collected': p.courierCollected ? 'Yes' : 'No'
    }));
    exportToCsv(rows, `Payments_Report_${reportSummary.monthKey}`);
  };

  const handleExportInventoryCsv = () => {
    const rows = inventory.map(i => ({
      'SKU': i.sku,
      'Product Name': i.name,
      'Category': i.category,
      'Available Stock': i.stockLevel,
      'Safety Stock Reorder': i.safetyStock,
      'Unit Cost': i.unitCost,
      'Selling Price': i.sellingPrice,
      'Total Valuation': i.stockLevel * i.unitCost,
      'Stock Status': i.status,
      'Warehouse Bin': i.locationBin
    }));
    exportToCsv(rows, `Inventory_Valuation_${reportSummary.monthKey}`);
  };

  return (
    <div className="space-y-6">
      {/* Header & Controls Strip (hidden during print) */}
      <div className="no-print flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              Monthly Operations Report &amp; Statements
            </h1>
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700">
              Audit Ready
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Consolidated monthly report for order fulfillment, product returns, pending collections &amp; inventory valuation.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-lg">
            <Calendar className="w-3.5 h-3.5 text-slate-500 ml-1.5" />
            <select
              value={selectedMonth}
              onChange={(e) => onSelectMonth(e.target.value)}
              className="text-xs font-semibold bg-transparent border-0 text-slate-800 pr-3 py-1 cursor-pointer focus:ring-0"
              aria-label="Select report month"
            >
              {availableMonths.map(m => (
                <option key={m.key} value={m.key}>{m.label}</option>
              ))}
            </select>
          </div>

          <button
            onClick={() => onOpenUploadModal('orders')}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
            title="Upload CSV files to update or regenerate reports"
          >
            <Upload className="w-3.5 h-3.5 text-slate-600" />
            <span>Upload Data Files</span>
          </button>

          <button
            onClick={handleCopySummaryText}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
          >
            {copiedSummary ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copiedSummary ? 'Copied' : 'Copy Brief'}</span>
          </button>

          <button
            onClick={handlePrint}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print / PDF Report</span>
          </button>
        </div>
      </div>

      {/* CSV Export Bar (hidden during print) */}
      <div className="no-print bg-slate-900 text-white rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Data Ledger Export Center
          </div>
          <div className="text-xs text-slate-300 mt-0.5">
            Export structured raw data for {reportSummary.monthLabel} into spreadsheet format.
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <button
            onClick={handleExportOrdersCsv}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg font-medium transition-colors"
          >
            <Download className="w-3 h-3 text-indigo-400" />
            <span>Orders CSV</span>
          </button>
          <button
            onClick={handleExportReturnsCsv}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg font-medium transition-colors"
          >
            <Download className="w-3 h-3 text-amber-400" />
            <span>Returns CSV</span>
          </button>
          <button
            onClick={handleExportPaymentsCsv}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg font-medium transition-colors"
          >
            <Download className="w-3 h-3 text-emerald-400" />
            <span>Payments CSV</span>
          </button>
          <button
            onClick={handleExportInventoryCsv}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg font-medium transition-colors"
          >
            <Download className="w-3 h-3 text-purple-400" />
            <span>Inventory CSV</span>
          </button>
        </div>
      </div>

      {/* Printable Executive Report Sheet */}
      <div className="bg-white rounded-xl border border-slate-200 p-8 shadow-xs space-y-8">
        {/* Report Document Header */}
        <div className="border-b border-slate-200 pb-6 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <div className="text-xs font-bold tracking-widest uppercase text-slate-400">
              Executive Statement of Operations
            </div>
            <h2 className="text-2xl font-bold text-slate-900 mt-1">
              Apex Commerce Operations Monthly Report
            </h2>
            <div className="text-xs text-slate-600 mt-1 flex items-center gap-3">
              <span>Period: <strong className="text-slate-900">{reportSummary.monthLabel}</strong></span>
              <span>·</span>
              <span>Generated: <strong>2026-11-05</strong></span>
              <span>·</span>
              <span>Status: <strong>Finalized Ledger</strong></span>
            </div>
          </div>
          <div className="text-right text-xs text-slate-500">
            <div className="font-semibold text-slate-900">Apex Global Logistics &amp; Retail</div>
            <div>Central Fulfillment Hub #04</div>
          </div>
        </div>

        {/* 1. Fulfillment & Orders Section */}
        <div className="space-y-4 print-break-inside-avoid">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <div className="flex items-center gap-2">
              <Truck className="w-5 h-5 text-indigo-600" />
              <h3 className="text-base font-bold text-slate-900">
                1. Order Fulfillment &amp; Delivery SLA Performance
              </h3>
            </div>
            <span className="text-xs text-slate-500 font-medium">
              {deliveries.totalOrders} total shipments in period
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="p-3 bg-slate-50 rounded-lg">
              <div className="text-xs text-slate-500">Delivered Orders</div>
              <div className="text-xl font-bold text-slate-900 tabular-nums mt-1">
                {deliveries.deliveredCount}
              </div>
            </div>
            <div className="p-3 bg-slate-50 rounded-lg">
              <div className="text-xs text-slate-500">Active / In Transit</div>
              <div className="text-xl font-bold text-indigo-600 tabular-nums mt-1">
                {deliveries.inTransitCount}
              </div>
            </div>
            <div className="p-3 bg-slate-50 rounded-lg">
              <div className="text-xs text-slate-500">Awaiting Dispatch</div>
              <div className="text-xl font-bold text-amber-600 tabular-nums mt-1">
                {deliveries.awaitingDispatchCount}
              </div>
            </div>
            <div className="p-3 bg-slate-50 rounded-lg">
              <div className="text-xs text-slate-500">On-Time Delivery SLA</div>
              <div className="text-xl font-bold text-emerald-600 tabular-nums mt-1">
                {deliveries.onTimeDeliveryRate}%
              </div>
            </div>
          </div>

          {/* Courier breakdown table */}
          <div className="border border-slate-200 rounded-lg overflow-hidden text-xs">
            <table className="w-full text-left">
              <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-3">Carrier Partner</th>
                  <th className="py-2.5 px-3 text-center">Assigned Volume</th>
                  <th className="py-2.5 px-3 text-center">Delivered</th>
                  <th className="py-2.5 px-3 text-center">Delayed</th>
                  <th className="py-2.5 px-3 text-right">Completion Rate</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {Object.entries(deliveries.courierPerformance).map(([courier, perf]) => (
                  <tr key={courier}>
                    <td className="py-2.5 px-3 font-medium text-slate-900">{courier}</td>
                    <td className="py-2.5 px-3 text-center tabular-nums">{perf.total}</td>
                    <td className="py-2.5 px-3 text-center tabular-nums text-emerald-600 font-semibold">{perf.delivered}</td>
                    <td className="py-2.5 px-3 text-center tabular-nums text-rose-600">{perf.delayed}</td>
                    <td className="py-2.5 px-3 text-right font-semibold tabular-nums text-slate-900">
                      {perf.total > 0 ? Math.round((perf.delivered / perf.total) * 100) : 100}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* 2. Returned Products Section */}
        <div className="space-y-4 print-break-inside-avoid">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <div className="flex items-center gap-2">
              <RotateCcw className="w-5 h-5 text-amber-600" />
              <h3 className="text-base font-bold text-slate-900">
                2. Returned Products &amp; RMA Quality Audit
              </h3>
            </div>
            <span className="text-xs text-slate-500 font-medium">
              Return Rate: <strong className="text-slate-900">{retMetrics.returnRate}%</strong> of delivered orders
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="p-3 bg-slate-50 rounded-lg">
              <div className="text-xs text-slate-500">Total Returned RMAs</div>
              <div className="text-xl font-bold text-slate-900 tabular-nums mt-1">
                {retMetrics.totalReturns}
              </div>
            </div>
            <div className="p-3 bg-slate-50 rounded-lg">
              <div className="text-xs text-slate-500">Restocked to Inventory</div>
              <div className="text-xl font-bold text-emerald-600 tabular-nums mt-1">
                {retMetrics.restockedCount}
              </div>
            </div>
            <div className="p-3 bg-slate-50 rounded-lg">
              <div className="text-xs text-slate-500">Scrapped / Damaged</div>
              <div className="text-xl font-bold text-rose-600 tabular-nums mt-1">
                {retMetrics.scrappedCount}
              </div>
            </div>
            <div className="p-3 bg-slate-50 rounded-lg">
              <div className="text-xs text-slate-500">Total Refund Expenditure</div>
              <div className="text-xl font-bold text-slate-900 tabular-nums mt-1">
                ${retMetrics.totalRefundValue.toFixed(2)}
              </div>
            </div>
          </div>

          {/* Return reasons summary */}
          <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
            <div className="text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
              Primary RMA Causes Breakdown
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-xs">
              {Object.entries(retMetrics.reasonBreakdown).map(([reason, count]) => (
                <div key={reason} className="p-2.5 bg-white rounded border border-slate-200 text-center">
                  <div className="font-semibold text-slate-900 tabular-nums text-sm">{count}</div>
                  <div className="text-2xs text-slate-500 capitalize mt-0.5">{reason.replace('_', ' ')}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 3. Payments & Receivables Section */}
        <div className="space-y-4 print-break-inside-avoid">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <div className="flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-emerald-600" />
              <h3 className="text-base font-bold text-slate-900">
                3. Cash Flow, Receivables &amp; Settlements
              </h3>
            </div>
            <span className="text-xs text-slate-500 font-medium">
              Collection Efficiency: <strong className="text-emerald-700">{payMetrics.collectionRate}%</strong>
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="p-3 bg-slate-50 rounded-lg">
              <div className="text-xs text-slate-500">Total Billed Receivables</div>
              <div className="text-xl font-bold text-slate-900 tabular-nums mt-1">
                ${payMetrics.totalReceivable.toFixed(2)}
              </div>
            </div>
            <div className="p-3 bg-slate-50 rounded-lg">
              <div className="text-xs text-slate-500">Settled &amp; Collected</div>
              <div className="text-xl font-bold text-emerald-600 tabular-nums mt-1">
                ${payMetrics.collectedAmount.toFixed(2)}
              </div>
            </div>
            <div className="p-3 bg-slate-50 rounded-lg">
              <div className="text-xs text-slate-500">COD In Courier Custody</div>
              <div className="text-xl font-bold text-amber-600 tabular-nums mt-1">
                ${payMetrics.codPendingAmount.toFixed(2)}
              </div>
            </div>
            <div className="p-3 bg-slate-50 rounded-lg">
              <div className="text-xs text-slate-500">Overdue Unpaid Balance</div>
              <div className={`text-xl font-bold tabular-nums mt-1 ${payMetrics.overdueAmount > 0 ? 'text-rose-600' : 'text-slate-900'}`}>
                ${payMetrics.overdueAmount.toFixed(2)}
              </div>
            </div>
          </div>
        </div>

        {/* 4. Inventory Valuation & Replenishment Section */}
        <div className="space-y-4 print-break-inside-avoid">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <div className="flex items-center gap-2">
              <Layers className="w-5 h-5 text-purple-600" />
              <h3 className="text-base font-bold text-slate-900">
                4. Inventory Health &amp; Stock Valuation
              </h3>
            </div>
            <span className="text-xs text-slate-500 font-medium">
              Closing Asset Value: <strong className="text-slate-900">${invMetrics.totalValuation.toFixed(2)}</strong>
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="p-3 bg-slate-50 rounded-lg">
              <div className="text-xs text-slate-500">Catalog SKUs</div>
              <div className="text-xl font-bold text-slate-900 tabular-nums mt-1">
                {invMetrics.totalSkus}
              </div>
            </div>
            <div className="p-3 bg-slate-50 rounded-lg">
              <div className="text-xs text-slate-500">Healthy Stock SKUs</div>
              <div className="text-xl font-bold text-emerald-600 tabular-nums mt-1">
                {invMetrics.inStockCount}
              </div>
            </div>
            <div className="p-3 bg-slate-50 rounded-lg">
              <div className="text-xs text-slate-500">Low Stock Reorder Alerts</div>
              <div className="text-xl font-bold text-amber-600 tabular-nums mt-1">
                {invMetrics.lowStockCount}
              </div>
            </div>
            <div className="p-3 bg-slate-50 rounded-lg">
              <div className="text-xs text-slate-500">Stockouts (Zero Units)</div>
              <div className="text-xl font-bold text-rose-600 tabular-nums mt-1">
                {invMetrics.outOfStockCount}
              </div>
            </div>
          </div>

          {/* Reorder Recommendations */}
          {invMetrics.reorderRecommendations.length > 0 && (
            <div className="p-4 bg-amber-50/50 rounded-lg border border-amber-200">
              <div className="text-xs font-semibold text-amber-900 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
                <span>Recommended Restock Purchase Orders</span>
              </div>
              <div className="space-y-1.5 text-xs">
                {invMetrics.reorderRecommendations.map(rec => (
                  <div key={rec.sku} className="flex items-center justify-between py-1 border-b border-amber-100 last:border-0">
                    <span className="font-medium text-slate-800">{rec.name} ({rec.sku})</span>
                    <span className="text-slate-600">
                      On Hand: <strong className="text-rose-600">{rec.current}</strong> / Safety: {rec.safety} &rarr; Suggested Order: <strong className="text-emerald-700">+{rec.suggestedOrder} units</strong>
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Sign-off & Audit Stamp */}
        <div className="border-t border-slate-200 pt-6 flex flex-col sm:flex-row items-center justify-between text-2xs text-slate-400 gap-2">
          <div>Apex Commerce Hub · Automated Reporting Engine v4.2</div>
          <div>Report Hash: 5a65-6024-ecomm-ops-report · Signed by Store Operations</div>
        </div>
      </div>
    </div>
  );
};
