import test from 'node:test';
import assert from 'node:assert/strict';
import {
  getStockStatus,
  isPaymentOverdue,
  calculateDeliveryMetrics,
  calculateReturnMetrics,
  calculatePaymentMetrics,
  calculateInventoryMetrics
} from './metrics';
import { OrderDelivery, ProductReturn, PaymentToComplete, InventoryItem } from '../types';

test('getStockStatus classifies stock levels accurately', () => {
  assert.equal(getStockStatus(0, 15), 'out_of_stock');
  assert.equal(getStockStatus(-2, 10), 'out_of_stock');
  assert.equal(getStockStatus(10, 15), 'low_stock');
  assert.equal(getStockStatus(15, 15), 'low_stock');
  assert.equal(getStockStatus(25, 15), 'in_stock');
  assert.equal(getStockStatus(60, 15), 'overstocked');
});

test('isPaymentOverdue handles past due dates vs reference date correctly', () => {
  const refDate = '2026-11-05';
  assert.equal(isPaymentOverdue('2026-10-30', 'pending', refDate), true);
  assert.equal(isPaymentOverdue('2026-11-10', 'pending', refDate), false);
  assert.equal(isPaymentOverdue('2026-10-30', 'completed', refDate), false);
});

test('calculateDeliveryMetrics computes delivery rates and courier splits', () => {
  const mockOrders: OrderDelivery[] = [
    {
      id: 'ORD-1',
      customerName: 'Sarah Jenkins',
      customerEmail: 'sarah@example.com',
      destination: { city: 'Chicago', state: 'IL', address: '123 Main St', postalCode: '60601' },
      orderDate: '2026-11-01',
      deliveryDueDate: '2026-11-04',
      items: [{ sku: 'SKU-001', name: 'Wireless Headphones', quantity: 1, unitPrice: 120 }],
      totalAmount: 120,
      courier: 'FedEx Ground',
      trackingNumber: 'FX123456',
      status: 'delivered',
      priority: 'standard',
      paymentStatus: 'paid'
    },
    {
      id: 'ORD-2',
      customerName: 'Marcus Vance',
      customerEmail: 'marcus@example.com',
      destination: { city: 'Austin', state: 'TX', address: '456 Oak Rd', postalCode: '78701' },
      orderDate: '2026-11-02',
      deliveryDueDate: '2026-11-05',
      items: [{ sku: 'SKU-002', name: 'Smart Fitness Band', quantity: 2, unitPrice: 65 }],
      totalAmount: 130,
      courier: 'DHL Express',
      trackingNumber: 'DH987654',
      status: 'in_transit',
      priority: 'express',
      paymentStatus: 'paid'
    },
    {
      id: 'ORD-3',
      customerName: 'Elena Rostova',
      customerEmail: 'elena@example.com',
      destination: { city: 'Seattle', state: 'WA', address: '789 Pine Ave', postalCode: '98101' },
      orderDate: '2026-11-03',
      deliveryDueDate: '2026-11-06',
      items: [{ sku: 'SKU-003', name: 'Ergonomic Desk Mat', quantity: 1, unitPrice: 45 }],
      totalAmount: 45,
      courier: 'UPS Next Day',
      trackingNumber: 'UP554433',
      status: 'awaiting_dispatch',
      priority: 'overnight',
      paymentStatus: 'paid'
    }
  ];

  const metrics = calculateDeliveryMetrics(mockOrders);
  assert.equal(metrics.totalOrders, 3);
  assert.equal(metrics.deliveredCount, 1);
  assert.equal(metrics.inTransitCount, 1);
  assert.equal(metrics.awaitingDispatchCount, 1);
  assert.equal(metrics.courierPerformance['FedEx Ground'].delivered, 1);
});

test('calculateReturnMetrics computes return rate and reason distribution', () => {
  const mockReturns: ProductReturn[] = [
    {
      id: 'RMA-1',
      orderId: 'ORD-101',
      customerName: 'Alex Moore',
      sku: 'SKU-001',
      productName: 'Wireless Headphones',
      quantity: 1,
      returnDate: '2026-11-02',
      reason: 'defective',
      status: 'pending_inspection',
      refundAmount: 120,
      refundStatus: 'pending',
      restockedToInventory: false
    },
    {
      id: 'RMA-2',
      orderId: 'ORD-102',
      customerName: 'David Lee',
      sku: 'SKU-004',
      productName: 'Linen Shirt',
      quantity: 1,
      returnDate: '2026-11-03',
      reason: 'wrong_size',
      status: 'restocked',
      refundAmount: 55,
      refundStatus: 'processed',
      restockedToInventory: true
    }
  ];

  const metrics = calculateReturnMetrics(mockReturns, 20);
  assert.equal(metrics.totalReturns, 2);
  assert.equal(metrics.returnRate, 10); // 2/20 = 10%
  assert.equal(metrics.totalRefundValue, 175);
  assert.equal(metrics.pendingInspectionCount, 1);
  assert.equal(metrics.restockedCount, 1);
  assert.equal(metrics.reasonBreakdown.defective, 1);
  assert.equal(metrics.reasonBreakdown.wrong_size, 1);
});

test('calculatePaymentMetrics tracks collected vs pending balances and COD receivables', () => {
  const mockPayments: PaymentToComplete[] = [
    {
      id: 'PAY-1',
      orderId: 'ORD-201',
      customerName: 'James Chen',
      customerEmail: 'james@example.com',
      amount: 250,
      amountPaid: 250,
      paymentType: 'credit_card_authorized',
      dueDate: '2026-11-04',
      status: 'completed'
    },
    {
      id: 'PAY-2',
      orderId: 'ORD-202',
      customerName: 'Apex Studio B2B',
      customerEmail: 'billing@apexstudio.com',
      amount: 800,
      amountPaid: 300,
      paymentType: 'net30',
      dueDate: '2026-10-25', // Overdue
      status: 'partially_paid'
    },
    {
      id: 'PAY-3',
      orderId: 'ORD-203',
      customerName: 'Chloe Bennett',
      customerEmail: 'chloe@example.com',
      amount: 150,
      amountPaid: 0,
      paymentType: 'cod',
      dueDate: '2026-11-08',
      status: 'pending'
    }
  ];

  const metrics = calculatePaymentMetrics(mockPayments, '2026-11-05');
  assert.equal(metrics.totalReceivable, 1200);
  assert.equal(metrics.collectedAmount, 550);
  assert.equal(metrics.pendingAmount, 650); // (800-300) + 150
  assert.equal(metrics.overdueAmount, 500); // PAY-2 is overdue
  assert.equal(metrics.overdueCount, 1);
  assert.equal(metrics.codPendingAmount, 150);
  assert.equal(metrics.net30PendingAmount, 500);
});

test('calculateInventoryMetrics totals inventory valuation and reorder suggestions', () => {
  const mockItems: InventoryItem[] = [
    {
      sku: 'SKU-001',
      name: 'Wireless Headphones',
      category: 'Electronics',
      stockLevel: 4,
      safetyStock: 10,
      unitCost: 60,
      sellingPrice: 120,
      status: 'low_stock',
      lastRestocked: '2026-10-15',
      pendingInbound: 0,
      locationBin: 'A-12'
    },
    {
      sku: 'SKU-002',
      name: 'Smart Watch Pro',
      category: 'Electronics',
      stockLevel: 0,
      safetyStock: 8,
      unitCost: 90,
      sellingPrice: 199,
      status: 'out_of_stock',
      lastRestocked: '2026-10-01',
      pendingInbound: 25,
      locationBin: 'A-14'
    },
    {
      sku: 'SKU-003',
      name: 'Stainless Steel Water Bottle',
      category: 'Home & Kitchen',
      stockLevel: 45,
      safetyStock: 15,
      unitCost: 10,
      sellingPrice: 28,
      status: 'in_stock',
      lastRestocked: '2026-10-28',
      pendingInbound: 0,
      locationBin: 'B-03'
    }
  ];

  const metrics = calculateInventoryMetrics(mockItems);
  assert.equal(metrics.totalSkus, 3);
  assert.equal(metrics.totalValuation, (4 * 60) + (0 * 90) + (45 * 10)); // 240 + 0 + 450 = 690
  assert.equal(metrics.lowStockCount, 1);
  assert.equal(metrics.outOfStockCount, 1);
  assert.equal(metrics.inStockCount, 1);
  assert.equal(metrics.reorderRecommendations.length, 2);
});
