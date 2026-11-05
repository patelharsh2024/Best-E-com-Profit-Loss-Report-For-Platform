export type DeliveryStatus = 
  | 'awaiting_dispatch'
  | 'in_transit'
  | 'out_for_delivery'
  | 'delivered'
  | 'delayed';

export type DeliveryPriority = 'standard' | 'express' | 'overnight';

export type CourierType = 'FedEx Ground' | 'DHL Express' | 'UPS Next Day' | 'Local Fleet' | 'USPS Priority';

export type PaymentMethodType = 'cod' | 'net30' | 'credit_card_authorized' | 'bank_wire' | 'upi';

export type PaymentStatus = 'pending' | 'partially_paid' | 'completed' | 'overdue';

export type ReturnReason = 
  | 'defective'
  | 'wrong_size'
  | 'not_as_described'
  | 'changed_mind'
  | 'late_delivery';

export type ReturnStatus = 
  | 'pending_inspection'
  | 'approved'
  | 'restocked'
  | 'scrapped'
  | 'rejected';

export type ProductCategory = 
  | 'Electronics'
  | 'Apparel'
  | 'Home & Kitchen'
  | 'Health & Beauty'
  | 'Sports & Outdoors';

export type StockStatus = 'in_stock' | 'low_stock' | 'out_of_stock' | 'overstocked';

export interface OrderItem {
  sku: string;
  name: string;
  quantity: number;
  unitPrice: number;
}

export interface OrderDelivery {
  id: string; // e.g. "ORD-2026-8812"
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  destination: {
    city: string;
    state: string;
    address: string;
    postalCode: string;
  };
  orderDate: string; // YYYY-MM-DD
  deliveryDueDate: string; // YYYY-MM-DD
  items: OrderItem[];
  totalAmount: number;
  courier: CourierType;
  trackingNumber: string;
  status: DeliveryStatus;
  priority: DeliveryPriority;
  deliveredAt?: string;
  notes?: string;
  paymentStatus: 'paid' | 'pending_cod' | 'pending_invoice';
}

export interface ProductReturn {
  id: string; // e.g. "RMA-2026-0419"
  orderId: string;
  customerName: string;
  sku: string;
  productName: string;
  quantity: number;
  returnDate: string; // YYYY-MM-DD
  reason: ReturnReason;
  status: ReturnStatus;
  refundAmount: number;
  refundStatus: 'pending' | 'processed' | 'store_credit';
  inspectionNotes?: string;
  restockedToInventory: boolean;
}

export interface PaymentToComplete {
  id: string; // e.g. "PAY-2026-1044"
  orderId: string;
  customerName: string;
  customerEmail: string;
  amount: number;
  amountPaid: number;
  paymentType: PaymentMethodType;
  dueDate: string; // YYYY-MM-DD
  status: PaymentStatus;
  courierCollected?: boolean;
  lastReminderSent?: string;
  referenceNotes?: string;
}

export interface InventoryItem {
  sku: string;
  name: string;
  category: ProductCategory;
  stockLevel: number;
  safetyStock: number; // reorder point
  unitCost: number;
  sellingPrice: number;
  status: StockStatus;
  lastRestocked: string;
  pendingInbound: number;
  locationBin: string;
}

export interface InventoryAuditLog {
  id: string;
  sku: string;
  productName: string;
  timestamp: string;
  change: number; // e.g. +10, -2
  reason: 'restock' | 'sale_fulfillment' | 'return_restock' | 'cycle_count_adjustment' | 'damaged_writeoff';
  previousStock: number;
  newStock: number;
}

export interface MonthlyDeliveryMetrics {
  totalOrders: number;
  deliveredCount: number;
  awaitingDispatchCount: number;
  inTransitCount: number;
  delayedCount: number;
  onTimeDeliveryRate: number; // percentage
  courierPerformance: Record<CourierType, { total: number; delivered: number; delayed: number }>;
}

export interface MonthlyReturnMetrics {
  totalReturns: number;
  returnRate: number; // % returns vs total delivered orders
  totalRefundValue: number;
  pendingInspectionCount: number;
  restockedCount: number;
  scrappedCount: number;
  reasonBreakdown: Record<ReturnReason, number>;
}

export interface MonthlyPaymentMetrics {
  totalReceivable: number;
  collectedAmount: number;
  pendingAmount: number;
  overdueAmount: number;
  collectionRate: number; // %
  codPendingAmount: number;
  net30PendingAmount: number;
  overdueCount: number;
}

export interface MonthlyInventoryMetrics {
  totalValuation: number;
  totalSkus: number;
  inStockCount: number;
  lowStockCount: number;
  outOfStockCount: number;
  overstockedCount: number;
  reorderRecommendations: Array<{ sku: string; name: string; current: number; safety: number; suggestedOrder: number }>;
}

export interface MonthlyReportSummary {
  monthKey: string; // e.g. "2026-11"
  monthLabel: string; // e.g. "November 2026"
  deliveries: MonthlyDeliveryMetrics;
  returns: MonthlyReturnMetrics;
  payments: MonthlyPaymentMetrics;
  inventory: MonthlyInventoryMetrics;
}
