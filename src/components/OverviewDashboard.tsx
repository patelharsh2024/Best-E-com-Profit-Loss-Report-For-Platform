import React from 'react';
import {
  Truck,
  RotateCcw,
  CreditCard,
  AlertTriangle,
  ArrowRight,
  TrendingUp,
  Clock,
  ShieldCheck,
  Building,
  CheckCircle2
} from 'lucide-react';
import {
  OrderDelivery,
  ProductReturn,
  PaymentToComplete,
  InventoryItem,
  MonthlyReportSummary
} from '../types';
import { ActiveTab } from './Header';
import { formatCurrency } from '../utils/currency';

interface OverviewDashboardProps {
  reportSummary: MonthlyReportSummary;
  orders: OrderDelivery[];
  returns: ProductReturn[];
  payments: PaymentToComplete[];
  inventory: InventoryItem[];
  selectedMonth: string;
  onNavigateTab: (tab: ActiveTab) => void;
  onOpenOrderModal: () => void;
  onDispatchOrder: (orderId: string) => void;
  onInspectReturn: (returnId: string) => void;
  onRecordPayment: (paymentId: string) => void;
  onRestockItem: (sku: string) => void;
}

export const OverviewDashboard: React.FC<OverviewDashboardProps> = ({
  reportSummary,
  orders,
  returns,
  payments,
  inventory,
  selectedMonth,
  onNavigateTab,
  onDispatchOrder,
  onInspectReturn,
  onRecordPayment,
  onRestockItem
}) => {
  const { deliveries, returns: retMetrics, payments: payMetrics, inventory: invMetrics } = reportSummary;

  // Urgent Queues
  const urgentAwaitingDispatch = orders.filter(o => o.status === 'awaiting_dispatch').slice(0, 3);
  const urgentPendingReturns = returns.filter(r => r.status === 'pending_inspection').slice(0, 3);
  const urgentOverduePayments = payments.filter(p => p.status === 'overdue' || (p.status !== 'completed' && new Date(p.dueDate).getTime() < new Date('2026-11-05').getTime())).slice(0, 3);
  const urgentLowStock = inventory.filter(i => i.status === 'out_of_stock' || i.status === 'low_stock').slice(0, 3);

  return (
    <div className="space-y-6">
      {/* Welcome & Context Strip */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            E-Commerce Operations Center
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Active reporting period: <span className="font-semibold text-slate-800">{reportSummary.monthLabel}</span> · Live order fulfillment, return RMA processing, payment settlements &amp; stock control.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => onNavigateTab('reports')}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
          >
            <TrendingUp className="w-3.5 h-3.5 text-slate-600" />
            <span>Generate Full Monthly Report</span>
          </button>
        </div>
      </div>

      {/* 4 Core Monthly KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Deliveries KPI */}
        <div 
          onClick={() => onNavigateTab('deliveries')}
          className="bg-white p-5 rounded-xl border border-slate-200 hover:border-slate-300 transition-all cursor-pointer group shadow-2xs"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Orders To Deliver</span>
            <span className="p-2 bg-indigo-50 text-indigo-600 rounded-lg group-hover:bg-indigo-100 transition-colors">
              <Truck className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-slate-900 tabular-nums">
              {deliveries.awaitingDispatchCount + deliveries.inTransitCount}
              <span className="text-xs font-normal text-slate-500 ml-1.5">active</span>
            </div>
            <div className="mt-2 text-xs text-slate-600 flex items-center justify-between">
              <span>{deliveries.awaitingDispatchCount} unfulfilled</span>
              <span>{deliveries.inTransitCount} in transit</span>
            </div>
            <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
              <span className="text-slate-500">On-Time Rate</span>
              <span className="font-semibold text-emerald-600 tabular-nums">{deliveries.onTimeDeliveryRate}%</span>
            </div>
          </div>
        </div>

        {/* Returns KPI */}
        <div 
          onClick={() => onNavigateTab('returns')}
          className="bg-white p-5 rounded-xl border border-slate-200 hover:border-slate-300 transition-all cursor-pointer group shadow-2xs"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Returned Products</span>
            <span className="p-2 bg-amber-50 text-amber-600 rounded-lg group-hover:bg-amber-100 transition-colors">
              <RotateCcw className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-slate-900 tabular-nums">
              {retMetrics.totalReturns}
              <span className="text-xs font-normal text-slate-500 ml-1.5">RMAs</span>
            </div>
            <div className="mt-2 text-xs text-slate-600 flex items-center justify-between">
              <span>{retMetrics.pendingInspectionCount} inspection pending</span>
              <span>{retMetrics.restockedCount} restocked</span>
            </div>
            <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
              <span className="text-slate-500">Monthly Return Rate</span>
              <span className={`font-semibold tabular-nums ${retMetrics.returnRate > 10 ? 'text-amber-600' : 'text-slate-700'}`}>
                {retMetrics.returnRate}%
              </span>
            </div>
          </div>
        </div>

        {/* Payments KPI */}
        <div 
          onClick={() => onNavigateTab('payments')}
          className="bg-white p-5 rounded-xl border border-slate-200 hover:border-slate-300 transition-all cursor-pointer group shadow-2xs"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Payment To Complete</span>
            <span className="p-2 bg-emerald-50 text-emerald-600 rounded-lg group-hover:bg-emerald-100 transition-colors">
              <CreditCard className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-slate-900 tabular-nums">
              {formatCurrency(payMetrics.pendingAmount)}
            </div>
            <div className="mt-2 text-xs text-slate-600 flex items-center justify-between">
              <span>COD: {formatCurrency(payMetrics.codPendingAmount)}</span>
              <span>Net-30: {formatCurrency(payMetrics.net30PendingAmount)}</span>
            </div>
            <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
              <span className="text-slate-500">Overdue Uncollected</span>
              <span className={`font-semibold tabular-nums ${payMetrics.overdueAmount > 0 ? 'text-rose-600' : 'text-slate-700'}`}>
                {formatCurrency(payMetrics.overdueAmount)}
              </span>
            </div>
          </div>
        </div>

        {/* Inventory KPI */}
        <div 
          onClick={() => onNavigateTab('inventory')}
          className="bg-white p-5 rounded-xl border border-slate-200 hover:border-slate-300 transition-all cursor-pointer group shadow-2xs"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Inventory Health</span>
            <span className="p-2 bg-purple-50 text-purple-600 rounded-lg group-hover:bg-purple-100 transition-colors">
              <Building className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-slate-900 tabular-nums">
              {formatCurrency(invMetrics.totalValuation)}
            </div>
            <div className="mt-2 text-xs text-slate-600 flex items-center justify-between">
              <span>{invMetrics.lowStockCount} low stock alerts</span>
              <span>{invMetrics.outOfStockCount} out of stock</span>
            </div>
            <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
              <span className="text-slate-500">Total Tracked SKUs</span>
              <span className="font-semibold text-slate-800 tabular-nums">{invMetrics.totalSkus} SKUs</span>
            </div>
          </div>
        </div>
      </div>

      {/* Urgent Operational Queues & Immediate Actions Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Delivery Dispatch Queue */}
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <Truck className="w-4 h-4 text-indigo-600" />
              <h2 className="text-sm font-bold text-slate-900">Awaiting Dispatch ({urgentAwaitingDispatch.length})</h2>
            </div>
            <button
              onClick={() => onNavigateTab('deliveries')}
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
            >
              <span>View all</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>
          <div className="mt-3 space-y-2.5">
            {urgentAwaitingDispatch.length === 0 ? (
              <div className="py-6 text-center text-xs text-slate-500">
                <CheckCircle2 className="w-6 h-6 text-emerald-500 mx-auto mb-1.5" />
                All current orders dispatched!
              </div>
            ) : (
              urgentAwaitingDispatch.map(order => (
                <div key={order.id} className="p-3 bg-slate-50 rounded-lg flex items-center justify-between gap-3 text-xs">
                  <div>
                    <div className="font-semibold text-slate-900 flex items-center gap-2">
                      <span>{order.id}</span>
                      <span className="font-normal text-slate-500">· {order.customerName}</span>
                    </div>
                    <div className="text-slate-500 mt-0.5">
                      {order.destination.city}, {order.destination.state} · Due: {order.deliveryDueDate}
                    </div>
                  </div>
                  <button
                    onClick={() => onDispatchOrder(order.id)}
                    className="px-2.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white font-medium rounded-md whitespace-nowrap transition-colors"
                  >
                    Dispatch Now
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Returns Pending Inspection */}
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <RotateCcw className="w-4 h-4 text-amber-600" />
              <h2 className="text-sm font-bold text-slate-900">Returns Pending Inspection ({urgentPendingReturns.length})</h2>
            </div>
            <button
              onClick={() => onNavigateTab('returns')}
              className="text-xs font-semibold text-amber-600 hover:text-amber-800 flex items-center gap-1"
            >
              <span>View all</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>
          <div className="mt-3 space-y-2.5">
            {urgentPendingReturns.length === 0 ? (
              <div className="py-6 text-center text-xs text-slate-500">
                <ShieldCheck className="w-6 h-6 text-emerald-500 mx-auto mb-1.5" />
                No pending return inspections in queue.
              </div>
            ) : (
              urgentPendingReturns.map(ret => (
                <div key={ret.id} className="p-3 bg-slate-50 rounded-lg flex items-center justify-between gap-3 text-xs">
                  <div className="truncate pr-2">
                    <div className="font-semibold text-slate-900 flex items-center gap-2">
                      <span>{ret.id}</span>
                      <span className="font-normal text-slate-500 truncate">· {ret.productName}</span>
                    </div>
                    <div className="text-slate-500 mt-0.5">
                      Reason: <span className="font-medium text-slate-700 capitalize">{ret.reason.replace('_', ' ')}</span> · Refund: {formatCurrency(ret.refundAmount)}
                    </div>
                  </div>
                  <button
                    onClick={() => onInspectReturn(ret.id)}
                    className="px-2.5 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-medium rounded-md whitespace-nowrap transition-colors"
                  >
                    Inspect RMA
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Payments Due & Overdue */}
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-emerald-600" />
              <h2 className="text-sm font-bold text-slate-900">Pending Receivables &amp; Invoices</h2>
            </div>
            <button
              onClick={() => onNavigateTab('payments')}
              className="text-xs font-semibold text-emerald-600 hover:text-emerald-800 flex items-center gap-1"
            >
              <span>View all</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>
          <div className="mt-3 space-y-2.5">
            {urgentOverduePayments.length === 0 ? (
              <div className="py-6 text-center text-xs text-slate-500">
                <CheckCircle2 className="w-6 h-6 text-emerald-500 mx-auto mb-1.5" />
                All pending payments are in good standing!
              </div>
            ) : (
              urgentOverduePayments.map(pay => (
                <div key={pay.id} className="p-3 bg-slate-50 rounded-lg flex items-center justify-between gap-3 text-xs">
                  <div>
                    <div className="font-semibold text-slate-900 flex items-center gap-2">
                      <span>{pay.id}</span>
                      <span className="font-normal text-slate-500">· {pay.customerName}</span>
                    </div>
                    <div className="text-slate-500 mt-0.5">
                      Due: <span className="text-rose-600 font-semibold">{pay.dueDate}</span> · Type: <span className="uppercase font-mono">{pay.paymentType}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-slate-900 tabular-nums">
                      {formatCurrency(pay.amount - pay.amountPaid)}
                    </span>
                    <button
                      onClick={() => onRecordPayment(pay.id)}
                      className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-md whitespace-nowrap transition-colors"
                    >
                      Record
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Low Stock Replenishment Alerts */}
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-purple-600" />
              <h2 className="text-sm font-bold text-slate-900">Inventory Reorder Triggers</h2>
            </div>
            <button
              onClick={() => onNavigateTab('inventory')}
              className="text-xs font-semibold text-purple-600 hover:text-purple-800 flex items-center gap-1"
            >
              <span>Manage catalog</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>
          <div className="mt-3 space-y-2.5">
            {urgentLowStock.length === 0 ? (
              <div className="py-6 text-center text-xs text-slate-500">
                <CheckCircle2 className="w-6 h-6 text-emerald-500 mx-auto mb-1.5" />
                All SKU levels are comfortably above safety thresholds.
              </div>
            ) : (
              urgentLowStock.map(item => (
                <div key={item.sku} className="p-3 bg-slate-50 rounded-lg flex items-center justify-between gap-3 text-xs">
                  <div className="truncate pr-2">
                    <div className="font-semibold text-slate-900 truncate">
                      {item.name}
                    </div>
                    <div className="text-slate-500 mt-0.5">
                      SKU: <span className="font-mono text-slate-700">{item.sku}</span> · Stock: <span className="font-semibold text-rose-600 tabular-nums">{item.stockLevel}</span> / Safety: {item.safetyStock}
                    </div>
                  </div>
                  <button
                    onClick={() => onRestockItem(item.sku)}
                    className="px-2.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white font-medium rounded-md whitespace-nowrap transition-colors"
                  >
                    Restock
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Monthly Operations Performance Breakdown Strip */}
      <div className="bg-white rounded-xl border border-slate-200 p-5">
        <h2 className="text-sm font-bold text-slate-900 mb-4">
          Monthly Fulfillment &amp; Operations Distribution ({reportSummary.monthLabel})
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Courier performance */}
          <div className="p-4 bg-slate-50 rounded-lg">
            <div className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
              Courier Delivery Volume
            </div>
            <div className="space-y-2 text-xs">
              {Object.entries(deliveries.courierPerformance).map(([courier, perf]) => (
                <div key={courier} className="flex items-center justify-between">
                  <span className="text-slate-700">{courier}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-slate-500 tabular-nums">{perf.total} shipments</span>
                    <span className="font-semibold text-emerald-700 tabular-nums">
                      {perf.total > 0 ? Math.round((perf.delivered / perf.total) * 100) : 100}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Return reasons breakdown */}
          <div className="p-4 bg-slate-50 rounded-lg">
            <div className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
              Return RMA Root Causes
            </div>
            <div className="space-y-2 text-xs">
              {Object.entries(retMetrics.reasonBreakdown).map(([reason, count]) => (
                <div key={reason} className="flex items-center justify-between">
                  <span className="text-slate-700 capitalize">{reason.replace('_', ' ')}</span>
                  <span className="font-semibold text-slate-900 tabular-nums">{count} cases</span>
                </div>
              ))}
            </div>
          </div>

          {/* Payment Collection Progress */}
          <div className="p-4 bg-slate-50 rounded-lg">
            <div className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
              Cash Collection Efficiency
            </div>
            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-600">Total Billed</span>
                <span className="font-semibold text-slate-900 tabular-nums">{formatCurrency(payMetrics.totalReceivable)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-600">Collected</span>
                <span className="font-semibold text-emerald-600 tabular-nums">{formatCurrency(payMetrics.collectedAmount)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-600">Collection Rate</span>
                <span className="font-semibold text-slate-900 tabular-nums">{payMetrics.collectionRate}%</span>
              </div>
              <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden mt-2">
                <div 
                  className="bg-emerald-600 h-full transition-all duration-300" 
                  style={{ width: `${Math.min(100, payMetrics.collectionRate)}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
