import React, { useState, useEffect, useMemo } from 'react';
import {
  Header,
  ActiveTab
} from './components/Header';
import { OverviewDashboard } from './components/OverviewDashboard';
import { DeliveryManager } from './components/DeliveryManager';
import { ReturnsManager } from './components/ReturnsManager';
import { PaymentManager } from './components/PaymentManager';
import { InventoryManager } from './components/InventoryManager';
import { MonthlyReportView } from './components/MonthlyReportView';
import { FileUploadHub, UploadCategory } from './components/FileUploadHub';
import {
  INITIAL_ORDERS,
  INITIAL_RETURNS,
  INITIAL_PAYMENTS,
  INITIAL_INVENTORY,
  INITIAL_AUDIT_LOGS
} from './data/mockData';
import {
  OrderDelivery,
  ProductReturn,
  PaymentToComplete,
  InventoryItem,
  InventoryAuditLog,
  DeliveryStatus,
  CourierType,
  ReturnStatus
} from './types';
import {
  generateMonthlyReport,
  getStockStatus
} from './utils/metrics';

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('overview');
  const [selectedMonth, setSelectedMonth] = useState<string>('2026-11');
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [uploadCategory, setUploadCategory] = useState<UploadCategory>('orders');

  // Core State with localStorage persistence
  const [orders, setOrders] = useState<OrderDelivery[]>(() => {
    try {
      const saved = localStorage.getItem('apex_ecomm_orders');
      return saved ? JSON.parse(saved) : INITIAL_ORDERS;
    } catch {
      return INITIAL_ORDERS;
    }
  });

  const [returns, setReturns] = useState<ProductReturn[]>(() => {
    try {
      const saved = localStorage.getItem('apex_ecomm_returns');
      return saved ? JSON.parse(saved) : INITIAL_RETURNS;
    } catch {
      return INITIAL_RETURNS;
    }
  });

  const [payments, setPayments] = useState<PaymentToComplete[]>(() => {
    try {
      const saved = localStorage.getItem('apex_ecomm_payments');
      return saved ? JSON.parse(saved) : INITIAL_PAYMENTS;
    } catch {
      return INITIAL_PAYMENTS;
    }
  });

  const [inventory, setInventory] = useState<InventoryItem[]>(() => {
    try {
      const saved = localStorage.getItem('apex_ecomm_inventory');
      return saved ? JSON.parse(saved) : INITIAL_INVENTORY;
    } catch {
      return INITIAL_INVENTORY;
    }
  });

  const [auditLogs, setAuditLogs] = useState<InventoryAuditLog[]>(() => {
    try {
      const saved = localStorage.getItem('apex_ecomm_audit_logs');
      return saved ? JSON.parse(saved) : INITIAL_AUDIT_LOGS;
    } catch {
      return INITIAL_AUDIT_LOGS;
    }
  });

  // Sync to localStorage
  useEffect(() => {
    localStorage.setItem('apex_ecomm_orders', JSON.stringify(orders));
  }, [orders]);

  useEffect(() => {
    localStorage.setItem('apex_ecomm_returns', JSON.stringify(returns));
  }, [returns]);

  useEffect(() => {
    localStorage.setItem('apex_ecomm_payments', JSON.stringify(payments));
  }, [payments]);

  useEffect(() => {
    localStorage.setItem('apex_ecomm_inventory', JSON.stringify(inventory));
  }, [inventory]);

  useEffect(() => {
    localStorage.setItem('apex_ecomm_audit_logs', JSON.stringify(auditLogs));
  }, [auditLogs]);

  // Dynamic Available Months derived from orders, returns, and payments
  const availableMonths = useMemo(() => {
    const monthSet = new Set<string>(['2026-11', '2026-10', '2026-09']);
    orders.forEach(o => {
      if (o.orderDate && o.orderDate.length >= 7) {
        monthSet.add(o.orderDate.substring(0, 7));
      }
    });
    payments.forEach(p => {
      if (p.dueDate && p.dueDate.length >= 7) {
        monthSet.add(p.dueDate.substring(0, 7));
      }
    });
    returns.forEach(r => {
      if (r.returnDate && r.returnDate.length >= 7) {
        monthSet.add(r.returnDate.substring(0, 7));
      }
    });

    const sorted = Array.from(monthSet).sort().reverse();
    return sorted.map(key => {
      const [yearStr, monthStr] = key.split('-');
      const y = parseInt(yearStr, 10);
      const m = parseInt(monthStr, 10);
      const d = new Date(y, m - 1, 1);
      const monthName = !isNaN(d.getTime()) ? d.toLocaleString('en-US', { month: 'long', year: 'numeric' }) : key;
      return {
        key,
        label: key === '2026-11' ? `${monthName} (Current)` : monthName
      };
    });
  }, [orders, payments, returns]);

  // Derived Monthly Report
  const currentMonthLabel = useMemo(() => {
    const found = availableMonths.find(m => m.key === selectedMonth);
    return found ? found.label : selectedMonth;
  }, [selectedMonth, availableMonths]);

  const reportSummary = useMemo(() => {
    return generateMonthlyReport(
      selectedMonth,
      currentMonthLabel,
      orders,
      returns,
      payments,
      inventory
    );
  }, [selectedMonth, currentMonthLabel, orders, returns, payments, inventory]);

  // Filtered lists for the active month view
  const monthOrders = useMemo(() => {
    return orders.filter(o => o.orderDate.startsWith(selectedMonth));
  }, [orders, selectedMonth]);

  const monthReturns = useMemo(() => {
    return returns.filter(r => r.returnDate.startsWith(selectedMonth));
  }, [returns, selectedMonth]);

  const monthPayments = useMemo(() => {
    return payments.filter(p => p.dueDate.startsWith(selectedMonth));
  }, [payments, selectedMonth]);

  // ===================== Interconnected Operations =====================

  // 1. Order Status Updates
  const handleUpdateOrderStatus = (orderId: string, status: DeliveryStatus, deliveredAt?: string) => {
    setOrders(prev =>
      prev.map(order => {
        if (order.id !== orderId) return order;
        return {
          ...order,
          status,
          deliveredAt: deliveredAt || order.deliveredAt
        };
      })
    );

    // If marked delivered and payment is COD, prompt settlement
    if (status === 'delivered') {
      const order = orders.find(o => o.id === orderId);
      if (order && order.paymentStatus === 'pending_cod') {
        setPayments(prev =>
          prev.map(pay => {
            if (pay.orderId === orderId && pay.paymentType === 'cod') {
              return {
                ...pay,
                courierCollected: true,
                amountPaid: pay.amount,
                status: 'completed'
              };
            }
            return pay;
          })
        );
      }
    }
  };

  const handleDispatchOrder = (orderId: string, courier: CourierType, trackingNumber: string) => {
    setOrders(prev =>
      prev.map(order => {
        if (order.id !== orderId) return order;
        return {
          ...order,
          courier,
          trackingNumber,
          status: 'in_transit'
        };
      })
    );
  };

  const handleAddNewOrder = (newOrder: OrderDelivery) => {
    setOrders(prev => [newOrder, ...prev]);

    // Deduct inventory items
    newOrder.items.forEach(item => {
      handleAdjustStock(item.sku, -item.quantity, 'sale_fulfillment' as any);
    });

    // If order is awaiting invoice or COD, create matching payment record
    if (newOrder.paymentStatus === 'pending_invoice' || newOrder.paymentStatus === 'pending_cod') {
      const newPay: PaymentToComplete = {
        id: `PAY-2026-${Math.floor(1300 + Math.random() * 800)}`,
        orderId: newOrder.id,
        customerName: newOrder.customerName,
        customerEmail: newOrder.customerEmail,
        amount: newOrder.totalAmount,
        amountPaid: 0,
        paymentType: newOrder.paymentStatus === 'pending_cod' ? 'cod' : 'net30',
        dueDate: newOrder.deliveryDueDate,
        status: 'pending',
        courierCollected: false,
        referenceNotes: `Created from order ${newOrder.id}`
      };
      setPayments(prev => [newPay, ...prev]);
    }
  };

  // 2. Returns Operations
  const handleUpdateReturnStatus = (returnId: string, status: ReturnStatus, notes?: string) => {
    setReturns(prev =>
      prev.map(ret => {
        if (ret.id !== returnId) return ret;
        return {
          ...ret,
          status,
          inspectionNotes: notes !== undefined ? notes : ret.inspectionNotes
        };
      })
    );
  };

  const handleRestockReturn = (returnId: string) => {
    const ret = returns.find(r => r.id === returnId);
    if (!ret || ret.restockedToInventory) return;

    // Mark as restocked in returns
    setReturns(prev =>
      prev.map(r => (r.id === returnId ? { ...r, status: 'restocked', restockedToInventory: true } : r))
    );

    // Increase stock in inventory
    const targetItem = inventory.find(i => i.sku === ret.sku);
    if (targetItem) {
      const newStock = targetItem.stockLevel + ret.quantity;
      const newStatus = getStockStatus(newStock, targetItem.safetyStock);

      setInventory(prev =>
        prev.map(i =>
          i.sku === ret.sku
            ? { ...i, stockLevel: newStock, status: newStatus }
            : i
        )
      );

      // Add audit log
      const newLog: InventoryAuditLog = {
        id: `LOG-${Math.floor(100 + Math.random() * 900)}`,
        sku: ret.sku,
        productName: targetItem.name,
        timestamp: new Date().toISOString().replace('T', ' ').substring(0, 16),
        change: +ret.quantity,
        reason: 'return_restock',
        previousStock: targetItem.stockLevel,
        newStock
      };
      setAuditLogs(prev => [newLog, ...prev]);
    }
  };

  const handleProcessRefund = (returnId: string, refundType: 'processed' | 'store_credit') => {
    setReturns(prev =>
      prev.map(r => (r.id === returnId ? { ...r, refundStatus: refundType } : r))
    );
  };

  const handleAddNewReturn = (newReturn: ProductReturn) => {
    setReturns(prev => [newReturn, ...prev]);
  };

  // 3. Payment Operations
  const handleRecordPayment = (paymentId: string, amountPaid: number, referenceNotes?: string) => {
    setPayments(prev =>
      prev.map(pay => {
        if (pay.id !== paymentId) return pay;
        const totalPaid = Math.min(pay.amount, pay.amountPaid + amountPaid);
        const status = totalPaid >= pay.amount ? 'completed' : 'partially_paid';
        return {
          ...pay,
          amountPaid: totalPaid,
          status,
          referenceNotes: referenceNotes ? `${pay.referenceNotes || ''} [Paid: $${amountPaid} ref: ${referenceNotes}]` : pay.referenceNotes
        };
      })
    );
  };

  const handleConfirmCOD = (paymentId: string) => {
    setPayments(prev =>
      prev.map(pay => {
        if (pay.id !== paymentId) return pay;
        return {
          ...pay,
          courierCollected: true,
          amountPaid: pay.amount,
          status: 'completed'
        };
      })
    );
  };

  const handleSendReminder = (paymentId: string) => {
    setPayments(prev =>
      prev.map(pay => {
        if (pay.id !== paymentId) return pay;
        return {
          ...pay,
          lastReminderSent: new Date().toISOString().substring(0, 10)
        };
      })
    );
  };

  const handleAddNewPayment = (newPayment: PaymentToComplete) => {
    setPayments(prev => [newPayment, ...prev]);
  };

  const openUploadModal = (category: UploadCategory = 'orders') => {
    setUploadCategory(category);
    setIsUploadModalOpen(true);
  };

  // 4. Bulk File Upload & Order Change Handlers
  const handleImportOrders = (
    importedOrders: Partial<OrderDelivery>[],
    mode: 'merge' | 'append' | 'update'
  ) => {
    setOrders(prev => {
      const existingMap = new Map(prev.map(o => [o.id, o]));
      const newOrders: OrderDelivery[] = [];

      importedOrders.forEach(imp => {
        const id = imp.id || `ORD-${Date.now().toString().slice(-4)}`;
        if (existingMap.has(id)) {
          if (mode === 'merge' || mode === 'update') {
            const current = existingMap.get(id)!;
            const updated: OrderDelivery = {
              ...current,
              ...imp,
              destination: imp.destination ? { ...current.destination, ...imp.destination } : current.destination,
              items: imp.items && imp.items.length > 0 ? imp.items : current.items,
              status: imp.status || current.status,
              courier: imp.courier || current.courier,
              trackingNumber: imp.trackingNumber || current.trackingNumber
            };
            existingMap.set(id, updated);

            // If order was changed to delivered and COD, settle payment
            if (updated.status === 'delivered' && updated.paymentStatus === 'pending_cod') {
              setPayments(currPay =>
                currPay.map(p =>
                  p.orderId === id ? { ...p, courierCollected: true, amountPaid: p.amount, status: 'completed' } : p
                )
              );
            }
          }
        } else if (mode === 'merge' || mode === 'append') {
          const completeOrder: OrderDelivery = {
            id,
            customerName: imp.customerName || 'Retail Customer',
            customerEmail: imp.customerEmail || 'customer@store.com',
            destination: imp.destination || { city: 'New York', state: 'NY', address: '100 Central Way', postalCode: '10001' },
            orderDate: imp.orderDate || new Date().toISOString().substring(0, 10),
            deliveryDueDate: imp.deliveryDueDate || new Date(Date.now() + 3 * 86400000).toISOString().substring(0, 10),
            items: imp.items || [{ sku: 'APX-EL-001', name: 'Imported Retail Item', quantity: 1, unitPrice: imp.totalAmount || 50 }],
            totalAmount: imp.totalAmount || 50,
            courier: imp.courier || 'FedEx Ground',
            trackingNumber: imp.trackingNumber || `TRK-${Math.floor(10000000 + Math.random() * 90000000)}`,
            status: imp.status || 'awaiting_dispatch',
            priority: imp.priority || 'standard',
            paymentStatus: imp.paymentStatus || 'paid'
          };
          newOrders.push(completeOrder);
        }
      });

      // Auto-select detected month
      const detectedMonth = importedOrders.find(o => o.orderDate && o.orderDate.length >= 7)?.orderDate?.substring(0, 7);
      if (detectedMonth) {
        setSelectedMonth(detectedMonth);
      }

      return [...newOrders, ...Array.from(existingMap.values())];
    });
  };

  const handleImportReturns = (
    importedReturns: Partial<ProductReturn>[],
    mode: 'merge' | 'append'
  ) => {
    // Auto-select detected month
    const detectedMonth = importedReturns.find(r => r.returnDate && r.returnDate.length >= 7)?.returnDate?.substring(0, 7);
    if (detectedMonth) {
      setSelectedMonth(detectedMonth);
    }

    setReturns(prev => {
      const existingMap = new Map(prev.map(r => [r.id, r]));
      const newItems: ProductReturn[] = [];

      importedReturns.forEach(imp => {
        const id = imp.id || `RMA-${Date.now().toString().slice(-4)}`;
        if (existingMap.has(id) && mode === 'merge') {
          const current = existingMap.get(id)!;
          existingMap.set(id, { ...current, ...imp } as ProductReturn);
        } else {
          newItems.push({
            id,
            orderId: imp.orderId || 'ORD-EXT',
            customerName: imp.customerName || 'Retail Customer',
            sku: imp.sku || 'APX-EL-001',
            productName: imp.productName || 'Imported Product',
            quantity: imp.quantity || 1,
            returnDate: imp.returnDate || new Date().toISOString().substring(0, 10),
            reason: imp.reason || 'defective',
            status: imp.status || 'pending_inspection',
            refundAmount: imp.refundAmount || 50,
            refundStatus: imp.refundStatus || 'pending',
            inspectionNotes: imp.inspectionNotes || 'Imported via CSV file upload',
            restockedToInventory: imp.restockedToInventory || false
          });
        }
      });

      return [...newItems, ...Array.from(existingMap.values())];
    });
  };

  const handleImportPayments = (
    importedPayments: Partial<PaymentToComplete>[],
    mode: 'merge' | 'append'
  ) => {
    setPayments(prev => {
      const existingMap = new Map(prev.map(p => [p.id, p]));
      const newItems: PaymentToComplete[] = [];

      importedPayments.forEach(imp => {
        const id = imp.id || `PAY-${Date.now().toString().slice(-4)}`;
        if (existingMap.has(id) && mode === 'merge') {
          const current = existingMap.get(id)!;
          existingMap.set(id, { ...current, ...imp } as PaymentToComplete);
        } else {
          newItems.push({
            id,
            orderId: imp.orderId || 'ORD-EXT',
            customerName: imp.customerName || 'Corporate Client',
            customerEmail: imp.customerEmail || 'billing@client.com',
            amount: imp.amount || 100,
            amountPaid: imp.amountPaid || 0,
            paymentType: imp.paymentType || 'net30',
            dueDate: imp.dueDate || new Date().toISOString().substring(0, 10),
            status: imp.status || 'pending',
            courierCollected: imp.courierCollected || false,
            referenceNotes: imp.referenceNotes || 'Imported via CSV file upload'
          });
        }
      });

      // Auto-select detected month
      const detectedMonth = importedPayments.find(p => p.dueDate && p.dueDate.length >= 7)?.dueDate?.substring(0, 7);
      if (detectedMonth) {
        setSelectedMonth(detectedMonth);
      }

      return [...newItems, ...Array.from(existingMap.values())];
    });
  };

  // 4. Inventory Operations
  const handleAdjustStock = (
    sku: string,
    change: number,
    reason: 'restock' | 'cycle_count_adjustment' | 'damaged_writeoff' | 'sale_fulfillment'
  ) => {
    const item = inventory.find(i => i.sku === sku);
    if (!item) return;

    const previousStock = item.stockLevel;
    const newStock = Math.max(0, previousStock + change);
    const newStatus = getStockStatus(newStock, item.safetyStock);

    setInventory(prev =>
      prev.map(i => (i.sku === sku ? { ...i, stockLevel: newStock, status: newStatus } : i))
    );

    const newLog: InventoryAuditLog = {
      id: `LOG-${Math.floor(100 + Math.random() * 900)}`,
      sku,
      productName: item.name,
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 16),
      change,
      reason: reason as any,
      previousStock,
      newStock
    };
    setAuditLogs(prev => [newLog, ...prev]);
  };

  const handleAddNewProduct = (newItem: InventoryItem) => {
    setInventory(prev => [newItem, ...prev]);

    const newLog: InventoryAuditLog = {
      id: `LOG-${Math.floor(100 + Math.random() * 900)}`,
      sku: newItem.sku,
      productName: newItem.name,
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 16),
      change: newItem.stockLevel,
      reason: 'restock',
      previousStock: 0,
      newStock: newItem.stockLevel
    };
    setAuditLogs(prev => [newLog, ...prev]);
  };

  const handleReorderStock = (sku: string, quantity: number) => {
    setInventory(prev =>
      prev.map(i => (i.sku === sku ? { ...i, pendingInbound: (i.pendingInbound || 0) + quantity } : i))
    );
  };

  const handleResetData = () => {
    if (window.confirm('Reset all dataset to original factory demo data?')) {
      setOrders(INITIAL_ORDERS);
      setReturns(INITIAL_RETURNS);
      setPayments(INITIAL_PAYMENTS);
      setInventory(INITIAL_INVENTORY);
      setAuditLogs(INITIAL_AUDIT_LOGS);
      localStorage.clear();
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Navigation Top Bar */}
      <Header
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        onOpenNewOrderModal={() => setActiveTab('deliveries')}
        onOpenUploadModal={() => openUploadModal('orders')}
        selectedMonth={selectedMonth}
        onSelectMonth={setSelectedMonth}
        availableMonths={availableMonths}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeTab === 'overview' && (
          <OverviewDashboard
            reportSummary={reportSummary}
            orders={orders}
            returns={returns}
            payments={payments}
            inventory={inventory}
            selectedMonth={selectedMonth}
            onNavigateTab={setActiveTab}
            onOpenOrderModal={() => setActiveTab('deliveries')}
            onDispatchOrder={(orderId) => {
              setActiveTab('deliveries');
            }}
            onInspectReturn={(returnId) => {
              setActiveTab('returns');
            }}
            onRecordPayment={(paymentId) => {
              setActiveTab('payments');
            }}
            onRestockItem={(sku) => {
              setActiveTab('inventory');
            }}
          />
        )}

        {activeTab === 'deliveries' && (
          <DeliveryManager
            orders={orders}
            inventory={inventory}
            onUpdateOrderStatus={handleUpdateOrderStatus}
            onDispatchOrder={handleDispatchOrder}
            onAddNewOrder={handleAddNewOrder}
            onOpenUploadModal={(category) => openUploadModal(category || 'orders')}
          />
        )}

        {activeTab === 'returns' && (
          <ReturnsManager
            returns={returns}
            orders={orders}
            inventory={inventory}
            onUpdateReturnStatus={handleUpdateReturnStatus}
            onRestockReturn={handleRestockReturn}
            onProcessRefund={handleProcessRefund}
            onAddNewReturn={handleAddNewReturn}
            onOpenUploadModal={(category) => openUploadModal(category || 'returns')}
          />
        )}

        {activeTab === 'payments' && (
          <PaymentManager
            payments={payments}
            orders={orders}
            onRecordPayment={handleRecordPayment}
            onConfirmCOD={handleConfirmCOD}
            onSendReminder={handleSendReminder}
            onAddNewPayment={handleAddNewPayment}
            onOpenUploadModal={(category) => openUploadModal(category || 'payments')}
          />
        )}

        {activeTab === 'inventory' && (
          <InventoryManager
            inventory={inventory}
            auditLogs={auditLogs}
            onAdjustStock={handleAdjustStock}
            onAddNewProduct={handleAddNewProduct}
            onReorderStock={handleReorderStock}
          />
        )}

        {activeTab === 'reports' && (
          <MonthlyReportView
            reportSummary={reportSummary}
            selectedMonth={selectedMonth}
            onSelectMonth={setSelectedMonth}
            availableMonths={availableMonths}
            monthOrders={monthOrders}
            monthReturns={monthReturns}
            monthPayments={monthPayments}
            inventory={inventory}
            onOpenUploadModal={(category) => openUploadModal(category || 'orders')}
          />
        )}
      </main>

      {/* Global File Upload & Batch Update Modal */}
      {isUploadModalOpen && (
        <FileUploadHub
          initialCategory={uploadCategory}
          existingOrders={orders}
          existingReturns={returns}
          existingPayments={payments}
          onImportOrders={handleImportOrders}
          onImportReturns={handleImportReturns}
          onImportPayments={handleImportPayments}
          onClose={() => setIsUploadModalOpen(false)}
          onNavigateToReports={() => setActiveTab('reports')}
        />
      )}

      {/* Quiet Footer (hidden in print) */}
      <footer className="no-print mt-auto border-t border-slate-200 bg-white py-4 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div>
            Apex Commerce Operations Hub · Monthly Reports &amp; Management Suite
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={handleResetData}
              className="text-slate-400 hover:text-slate-700 transition-colors"
            >
              Reset Demo Data
            </button>
            <span aria-hidden="true">·</span>
            <span>Local Time: November 2026</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
