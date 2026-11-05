import {
  OrderDelivery,
  ProductReturn,
  PaymentToComplete,
  InventoryItem,
  CourierType,
  ReturnReason,
  MonthlyDeliveryMetrics,
  MonthlyReturnMetrics,
  MonthlyPaymentMetrics,
  MonthlyInventoryMetrics,
  MonthlyReportSummary,
  StockStatus
} from '../types';

export const COURIERS: CourierType[] = [
  'FedEx Ground',
  'DHL Express',
  'UPS Next Day',
  'Local Fleet'
];

export const RETURN_REASONS: ReturnReason[] = [
  'defective',
  'wrong_size',
  'not_as_described',
  'changed_mind',
  'late_delivery'
];

export function getStockStatus(stockLevel: number, safetyStock: number): StockStatus {
  if (stockLevel <= 0) return 'out_of_stock';
  if (stockLevel <= safetyStock) return 'low_stock';
  if (stockLevel > safetyStock * 3) return 'overstocked';
  return 'in_stock';
}

export function isPaymentOverdue(dueDate: string, status: string, referenceDateStr = '2026-11-05'): boolean {
  if (status === 'completed') return false;
  const due = new Date(dueDate).getTime();
  const ref = new Date(referenceDateStr).getTime();
  return due < ref;
}

export function filterOrdersByMonth(orders: OrderDelivery[], monthKey: string): OrderDelivery[] {
  return orders.filter(order => order.orderDate.startsWith(monthKey));
}

export function filterReturnsByMonth(returns: ProductReturn[], monthKey: string): ProductReturn[] {
  return returns.filter(ret => ret.returnDate.startsWith(monthKey));
}

export function filterPaymentsByMonth(payments: PaymentToComplete[], monthKey: string): PaymentToComplete[] {
  return payments.filter(pay => pay.dueDate.startsWith(monthKey));
}

export function calculateDeliveryMetrics(orders: OrderDelivery[]): MonthlyDeliveryMetrics {
  const totalOrders = orders.length;
  let deliveredCount = 0;
  let awaitingDispatchCount = 0;
  let inTransitCount = 0;
  let delayedCount = 0;

  const courierPerformance: Record<CourierType, { total: number; delivered: number; delayed: number }> = {
    'FedEx Ground': { total: 0, delivered: 0, delayed: 0 },
    'DHL Express': { total: 0, delivered: 0, delayed: 0 },
    'UPS Next Day': { total: 0, delivered: 0, delayed: 0 },
    'Local Fleet': { total: 0, delivered: 0, delayed: 0 },
    'USPS Priority': { total: 0, delivered: 0, delayed: 0 }
  };

  orders.forEach(order => {
    const courier = order.courier;
    if (courierPerformance[courier]) {
      courierPerformance[courier].total += 1;
    }

    if (order.status === 'delivered') {
      deliveredCount += 1;
      if (courierPerformance[courier]) {
        courierPerformance[courier].delivered += 1;
      }
    } else if (order.status === 'awaiting_dispatch') {
      awaitingDispatchCount += 1;
    } else if (order.status === 'in_transit' || order.status === 'out_for_delivery') {
      inTransitCount += 1;
    } else if (order.status === 'delayed') {
      delayedCount += 1;
      if (courierPerformance[courier]) {
        courierPerformance[courier].delayed += 1;
      }
    }
  });

  const onTimeDeliveryRate = totalOrders > 0 
    ? Math.round(((deliveredCount) / (totalOrders - awaitingDispatchCount || 1)) * 100) 
    : 100;

  return {
    totalOrders,
    deliveredCount,
    awaitingDispatchCount,
    inTransitCount,
    delayedCount,
    onTimeDeliveryRate: Math.min(100, Math.max(0, onTimeDeliveryRate)),
    courierPerformance
  };
}

export function calculateReturnMetrics(returns: ProductReturn[], totalOrders = 1): MonthlyReturnMetrics {
  const totalReturns = returns.length;
  let totalRefundValue = 0;
  let pendingInspectionCount = 0;
  let restockedCount = 0;
  let scrappedCount = 0;

  const reasonBreakdown: Record<ReturnReason, number> = {
    defective: 0,
    wrong_size: 0,
    not_as_described: 0,
    changed_mind: 0,
    late_delivery: 0
  };

  returns.forEach(item => {
    totalRefundValue += item.refundAmount;
    if (item.status === 'pending_inspection') pendingInspectionCount += 1;
    if (item.status === 'restocked') restockedCount += 1;
    if (item.status === 'scrapped') scrappedCount += 1;

    if (reasonBreakdown[item.reason] !== undefined) {
      reasonBreakdown[item.reason] += 1;
    }
  });

  const safeTotalOrders = Math.max(1, totalOrders);
  const returnRate = Number(((totalReturns / safeTotalOrders) * 100).toFixed(1));

  return {
    totalReturns,
    returnRate,
    totalRefundValue,
    pendingInspectionCount,
    restockedCount,
    scrappedCount,
    reasonBreakdown
  };
}

export function calculatePaymentMetrics(
  payments: PaymentToComplete[],
  referenceDateStr = '2026-11-05'
): MonthlyPaymentMetrics {
  let totalReceivable = 0;
  let collectedAmount = 0;
  let pendingAmount = 0;
  let overdueAmount = 0;
  let codPendingAmount = 0;
  let net30PendingAmount = 0;
  let overdueCount = 0;

  payments.forEach(pay => {
    totalReceivable += pay.amount;
    collectedAmount += pay.amountPaid;
    const remaining = Math.max(0, pay.amount - pay.amountPaid);
    
    if (remaining > 0) {
      pendingAmount += remaining;
      const isOverdue = isPaymentOverdue(pay.dueDate, pay.status, referenceDateStr);
      if (isOverdue || pay.status === 'overdue') {
        overdueAmount += remaining;
        overdueCount += 1;
      }
      if (pay.paymentType === 'cod') {
        codPendingAmount += remaining;
      } else if (pay.paymentType === 'net30') {
        net30PendingAmount += remaining;
      }
    }
  });

  const collectionRate = totalReceivable > 0
    ? Number(((collectedAmount / totalReceivable) * 100).toFixed(1))
    : 100;

  return {
    totalReceivable,
    collectedAmount,
    pendingAmount,
    overdueAmount,
    collectionRate,
    codPendingAmount,
    net30PendingAmount,
    overdueCount
  };
}

export function calculateInventoryMetrics(items: InventoryItem[]): MonthlyInventoryMetrics {
  let totalValuation = 0;
  let inStockCount = 0;
  let lowStockCount = 0;
  let outOfStockCount = 0;
  let overstockedCount = 0;

  const reorderRecommendations: Array<{
    sku: string;
    name: string;
    current: number;
    safety: number;
    suggestedOrder: number;
  }> = [];

  items.forEach(item => {
    totalValuation += item.stockLevel * item.unitCost;
    const status = getStockStatus(item.stockLevel, item.safetyStock);

    if (status === 'out_of_stock') {
      outOfStockCount += 1;
      reorderRecommendations.push({
        sku: item.sku,
        name: item.name,
        current: item.stockLevel,
        safety: item.safetyStock,
        suggestedOrder: item.safetyStock * 2
      });
    } else if (status === 'low_stock') {
      lowStockCount += 1;
      reorderRecommendations.push({
        sku: item.sku,
        name: item.name,
        current: item.stockLevel,
        safety: item.safetyStock,
        suggestedOrder: (item.safetyStock * 2) - item.stockLevel
      });
    } else if (status === 'overstocked') {
      overstockedCount += 1;
    } else {
      inStockCount += 1;
    }
  });

  return {
    totalValuation,
    totalSkus: items.length,
    inStockCount,
    lowStockCount,
    outOfStockCount,
    overstockedCount,
    reorderRecommendations
  };
}

export function generateMonthlyReport(
  monthKey: string,
  monthLabel: string,
  orders: OrderDelivery[],
  returns: ProductReturn[],
  payments: PaymentToComplete[],
  inventory: InventoryItem[],
  referenceDateStr = '2026-11-05'
): MonthlyReportSummary {
  const monthOrders = filterOrdersByMonth(orders, monthKey);
  const monthReturns = filterReturnsByMonth(returns, monthKey);
  const monthPayments = filterPaymentsByMonth(payments, monthKey);

  return {
    monthKey,
    monthLabel,
    deliveries: calculateDeliveryMetrics(monthOrders),
    returns: calculateReturnMetrics(monthReturns, monthOrders.length),
    payments: calculatePaymentMetrics(monthPayments, referenceDateStr),
    inventory: calculateInventoryMetrics(inventory)
  };
}

export function exportToCsv(data: Record<string, unknown>[], filename: string): void {
  if (!data || data.length === 0) return;
  const headers = Object.keys(data[0]);
  const rows = data.map(row =>
    headers
      .map(fieldName => {
        const val = row[fieldName];
        const stringified = typeof val === 'object' ? JSON.stringify(val) : String(val ?? '');
        return `"${stringified.replace(/"/g, '""')}"`;
      })
      .join(',')
  );

  const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows].join('\n');
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement('a');
  link.setAttribute('href', encodedUri);
  link.setAttribute('download', `${filename}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
