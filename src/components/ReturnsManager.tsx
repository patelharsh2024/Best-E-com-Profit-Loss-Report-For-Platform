import React, { useState } from 'react';
import {
  RotateCcw,
  Search,
  Filter,
  CheckCircle2,
  AlertCircle,
  Plus,
  ArrowRight,
  ShieldAlert,
  Boxes,
  DollarSign,
  X,
  Upload
} from 'lucide-react';
import {
  ProductReturn,
  ReturnReason,
  ReturnStatus,
  OrderDelivery,
  InventoryItem
} from '../types';
import { formatCurrency } from '../utils/currency';

interface ReturnsManagerProps {
  returns: ProductReturn[];
  orders: OrderDelivery[];
  inventory: InventoryItem[];
  onUpdateReturnStatus: (returnId: string, status: ReturnStatus, notes?: string) => void;
  onRestockReturn: (returnId: string) => void;
  onProcessRefund: (returnId: string, refundType: 'processed' | 'store_credit') => void;
  onAddNewReturn: (newReturn: ProductReturn) => void;
  onOpenUploadModal: (category?: 'returns') => void;
}

export const ReturnsManager: React.FC<ReturnsManagerProps> = ({
  returns,
  orders,
  inventory,
  onUpdateReturnStatus,
  onRestockReturn,
  onProcessRefund,
  onAddNewReturn,
  onOpenUploadModal
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [reasonFilter, setReasonFilter] = useState<string>('all');
  const [isNewReturnModalOpen, setIsNewReturnModalOpen] = useState(false);

  // Inspect Modal
  const [activeInspectReturn, setActiveInspectReturn] = useState<ProductReturn | null>(null);
  const [inspectionDisposition, setInspectionDisposition] = useState<'approved' | 'restocked' | 'scrapped' | 'rejected'>('approved');
  const [inspectionNotes, setInspectionNotes] = useState('');

  // New Return Form
  const [selectedOrderId, setSelectedOrderId] = useState(orders[0]?.id || '');
  const [customerName, setCustomerName] = useState('');
  const [selectedSku, setSelectedSku] = useState(inventory[0]?.sku || '');
  const [returnQuantity, setReturnQuantity] = useState(1);
  const [returnReason, setReturnReason] = useState<ReturnReason>('defective');
  const [refundAmount, setRefundAmount] = useState(100);
  const [returnNotes, setReturnNotes] = useState('');

  // Auto-fill customer when selecting order
  const handleOrderChange = (orderId: string) => {
    setSelectedOrderId(orderId);
    const order = orders.find(o => o.id === orderId);
    if (order) {
      setCustomerName(order.customerName);
      if (order.items.length > 0) {
        setSelectedSku(order.items[0].sku);
        setRefundAmount(order.items[0].unitPrice * order.items[0].quantity);
      }
    }
  };

  const filteredReturns = returns.filter(ret => {
    const matchesSearch =
      ret.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ret.orderId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ret.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ret.productName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ret.sku.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === 'all' || ret.status === statusFilter;
    const matchesReason = reasonFilter === 'all' || ret.reason === reasonFilter;

    return matchesSearch && matchesStatus && matchesReason;
  });

  const handleOpenInspectModal = (ret: ProductReturn) => {
    setActiveInspectReturn(ret);
    setInspectionDisposition(ret.status === 'pending_inspection' ? 'approved' : (ret.status as any));
    setInspectionNotes(ret.inspectionNotes || '');
  };

  const handleSaveInspection = () => {
    if (!activeInspectReturn) return;
    onUpdateReturnStatus(activeInspectReturn.id, inspectionDisposition, inspectionNotes);
    
    if (inspectionDisposition === 'restocked' && !activeInspectReturn.restockedToInventory) {
      onRestockReturn(activeInspectReturn.id);
    }
    
    setActiveInspectReturn(null);
  };

  const handleCreateReturnSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const inventoryItem = inventory.find(i => i.sku === selectedSku);
    const newReturn: ProductReturn = {
      id: `RMA-2026-${Math.floor(5200 + Math.random() * 800)}`,
      orderId: selectedOrderId || 'ORD-DIRECT',
      customerName: customerName || 'Retail Customer',
      sku: selectedSku,
      productName: inventoryItem?.name || 'Returned Product Item',
      quantity: returnQuantity,
      returnDate: new Date().toISOString().substring(0, 10),
      reason: returnReason,
      status: 'pending_inspection',
      refundAmount: refundAmount,
      refundStatus: 'pending',
      inspectionNotes: returnNotes,
      restockedToInventory: false
    };

    onAddNewReturn(newReturn);
    setIsNewReturnModalOpen(false);
    setReturnNotes('');
  };

  const getReasonLabel = (reason: ReturnReason) => {
    switch (reason) {
      case 'defective':
        return <span className="text-rose-700 bg-rose-50 px-2 py-0.5 rounded text-2xs font-semibold">Defective / Damaged</span>;
      case 'wrong_size':
        return <span className="text-amber-700 bg-amber-50 px-2 py-0.5 rounded text-2xs font-semibold">Wrong Size / Fit</span>;
      case 'not_as_described':
        return <span className="text-purple-700 bg-purple-50 px-2 py-0.5 rounded text-2xs font-semibold">Not As Described</span>;
      case 'changed_mind':
        return <span className="text-slate-700 bg-slate-100 px-2 py-0.5 rounded text-2xs font-semibold">Changed Mind</span>;
      case 'late_delivery':
        return <span className="text-blue-700 bg-blue-50 px-2 py-0.5 rounded text-2xs font-semibold">Late Delivery</span>;
    }
  };

  const getStatusBadge = (status: ReturnStatus) => {
    switch (status) {
      case 'pending_inspection':
        return <span className="text-amber-800 bg-amber-100/80 px-2 py-0.5 rounded text-xs font-semibold">Pending Inspection</span>;
      case 'approved':
        return <span className="text-blue-800 bg-blue-100/80 px-2 py-0.5 rounded text-xs font-semibold">Approved</span>;
      case 'restocked':
        return <span className="text-emerald-800 bg-emerald-100/80 px-2 py-0.5 rounded text-xs font-semibold">Restocked</span>;
      case 'scrapped':
        return <span className="text-slate-800 bg-slate-200 px-2 py-0.5 rounded text-xs font-semibold">Scrapped / Write-off</span>;
      case 'rejected':
        return <span className="text-rose-800 bg-rose-100/80 px-2 py-0.5 rounded text-xs font-semibold">Rejected</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Title & Action Strip */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            Returned Products &amp; RMA Management
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Inbound returns, quality inspection, automated restock sync &amp; customer refund dispositions.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => onOpenUploadModal('returns')}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
            title="Upload CSV to import customer returns"
          >
            <Upload className="w-3.5 h-3.5 text-slate-600" />
            <span>Upload Returns File</span>
          </button>
          <button
            onClick={() => setIsNewReturnModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Initiate Return (RMA)</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by RMA ID, Order #, customer, product, or SKU..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white"
          />
        </div>
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className="text-slate-500 flex items-center gap-1">
            <Filter className="w-3.5 h-3.5" /> Status:
          </span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-slate-50 border border-slate-200 text-slate-700 py-1.5 px-2 rounded-lg font-medium"
          >
            <option value="all">All RMA Statuses ({returns.length})</option>
            <option value="pending_inspection">Pending Inspection</option>
            <option value="approved">Approved</option>
            <option value="restocked">Restocked</option>
            <option value="scrapped">Scrapped</option>
            <option value="rejected">Rejected</option>
          </select>

          <span className="text-slate-500 ml-2">Reason:</span>
          <select
            value={reasonFilter}
            onChange={(e) => setReasonFilter(e.target.value)}
            className="bg-slate-50 border border-slate-200 text-slate-700 py-1.5 px-2 rounded-lg font-medium"
          >
            <option value="all">All Reasons</option>
            <option value="defective">Defective / Damaged</option>
            <option value="wrong_size">Wrong Size / Fit</option>
            <option value="not_as_described">Not As Described</option>
            <option value="changed_mind">Changed Mind</option>
            <option value="late_delivery">Late Delivery</option>
          </select>
        </div>
      </div>

      {/* Returns Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider">
                <th className="py-3 px-4">RMA ID &amp; Date</th>
                <th className="py-3 px-4">Order Ref &amp; Customer</th>
                <th className="py-3 px-4">Returned Item</th>
                <th className="py-3 px-4">Return Reason</th>
                <th className="py-3 px-4">Inspection Status</th>
                <th className="py-3 px-4">Refund Amount</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredReturns.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500">
                    <RotateCcw className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    No returns matching your search criteria.
                  </td>
                </tr>
              ) : (
                filteredReturns.map(ret => (
                  <tr key={ret.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-900 font-mono">
                        {ret.id}
                      </div>
                      <div className="text-slate-500 text-2xs mt-0.5">
                        {ret.returnDate}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-medium text-slate-800">
                        {ret.customerName}
                      </div>
                      <div className="text-slate-400 font-mono text-2xs mt-0.5">
                        Ref: {ret.orderId}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-medium text-slate-900 max-w-56 truncate">
                        {ret.productName}
                      </div>
                      <div className="text-slate-500 font-mono text-2xs mt-0.5">
                        SKU: {ret.sku} · Qty: {ret.quantity}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      {getReasonLabel(ret.reason)}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1.5">
                        {getStatusBadge(ret.status)}
                        {ret.restockedToInventory && (
                          <span className="text-emerald-600 inline-flex items-center" title="Stock incremented in catalog">
                            <Boxes className="w-3.5 h-3.5" />
                          </span>
                        )}
                      </div>
                      {ret.inspectionNotes && (
                        <div className="text-slate-500 text-2xs mt-1 max-w-48 truncate" title={ret.inspectionNotes}>
                          {ret.inspectionNotes}
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-900 tabular-nums">
                      {formatCurrency(ret.refundAmount)}
                      <div className="text-2xs font-normal text-slate-500">
                        {ret.refundStatus === 'processed' ? 'Refunded' : ret.refundStatus === 'store_credit' ? 'Store Credit' : 'Pending'}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {ret.status === 'pending_inspection' ? (
                          <button
                            onClick={() => handleOpenInspectModal(ret)}
                            className="px-2.5 py-1 bg-amber-600 hover:bg-amber-700 text-white font-medium rounded text-xs transition-colors"
                          >
                            Inspect
                          </button>
                        ) : ret.status === 'approved' && !ret.restockedToInventory ? (
                          <button
                            onClick={() => onRestockReturn(ret.id)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded text-xs transition-colors"
                          >
                            <Boxes className="w-3 h-3" />
                            <span>Restock</span>
                          </button>
                        ) : null}

                        {ret.refundStatus === 'pending' && (
                          <button
                            onClick={() => onProcessRefund(ret.id, 'processed')}
                            className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-900 hover:bg-slate-800 text-white font-medium rounded text-xs transition-colors"
                          >
                            <DollarSign className="w-3 h-3" />
                            <span>Refund</span>
                          </button>
                        )}

                        <button
                          onClick={() => handleOpenInspectModal(ret)}
                          className="px-2 py-1 text-slate-500 hover:text-slate-900 text-xs font-medium"
                        >
                          Details
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Inspect & Disposition Modal */}
      {activeInspectReturn && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">
                Inspect Return {activeInspectReturn.id}
              </h3>
              <button
                onClick={() => setActiveInspectReturn(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="mt-4 space-y-4 text-xs">
              <div className="p-3 bg-slate-50 rounded-lg">
                <div className="font-semibold text-slate-900">{activeInspectReturn.productName}</div>
                <div className="text-slate-500">SKU: {activeInspectReturn.sku} · Qty: {activeInspectReturn.quantity}</div>
                <div className="text-slate-600 mt-1">Claimed Reason: <span className="font-semibold capitalize">{activeInspectReturn.reason.replace('_', ' ')}</span></div>
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">Inspection Disposition Decision</label>
                <select
                  value={inspectionDisposition}
                  onChange={(e) => setInspectionDisposition(e.target.value as any)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 font-medium"
                >
                  <option value="approved">Approve Return (Ready for Restock/Refund)</option>
                  <option value="restocked">Approve &amp; Return Directly to Stock (+{activeInspectReturn.quantity})</option>
                  <option value="scrapped">Scrap / Liquidate (Damaged/Defective)</option>
                  <option value="rejected">Reject Return (Violates Return Policy)</option>
                </select>
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">Quality Inspector Notes</label>
                <textarea
                  rows={3}
                  value={inspectionNotes}
                  onChange={(e) => setInspectionNotes(e.target.value)}
                  placeholder="Record condition of packaging, cosmetic marks, hardware diagnostic result..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2"
                />
              </div>
            </div>
            <div className="mt-6 flex items-center justify-end gap-2">
              <button
                onClick={() => setActiveInspectReturn(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveInspection}
                className="px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg"
              >
                Save Disposition
              </button>
            </div>
          </div>
        </div>
      )}

      {/* New Return Modal */}
      {isNewReturnModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-lg w-full p-6 shadow-xl border border-slate-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">
                Initiate Customer Return (RMA)
              </h3>
              <button
                onClick={() => setIsNewReturnModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateReturnSubmit} className="mt-4 space-y-4 text-xs">
              <div>
                <label className="block font-medium text-slate-700 mb-1">Associated Order Reference</label>
                <select
                  value={selectedOrderId}
                  onChange={(e) => handleOrderChange(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 font-mono"
                >
                  <option value="">-- Standalone or External Return --</option>
                  {orders.map(o => (
                    <option key={o.id} value={o.id}>
                      {o.id} - {o.customerName} (${o.totalAmount.toFixed(2)})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">Customer Name *</label>
                <input
                  type="text"
                  required
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="Customer name"
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2">
                  <label className="block font-medium text-slate-700 mb-1">Returned Product SKU</label>
                  <select
                    value={selectedSku}
                    onChange={(e) => setSelectedSku(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 font-mono"
                  >
                    {inventory.map(item => (
                      <option key={item.sku} value={item.sku}>
                        {item.name} ({item.sku})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Qty</label>
                  <input
                    type="number"
                    min="1"
                    value={returnQuantity}
                    onChange={(e) => setReturnQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Primary Return Reason</label>
                  <select
                    value={returnReason}
                    onChange={(e) => setReturnReason(e.target.value as ReturnReason)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 font-medium"
                  >
                    <option value="defective">Defective / Damaged</option>
                    <option value="wrong_size">Wrong Size / Fit</option>
                    <option value="not_as_described">Not As Described</option>
                    <option value="changed_mind">Changed Mind</option>
                    <option value="late_delivery">Late Delivery</option>
                  </select>
                </div>
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Refund Amount ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={refundAmount}
                    onChange={(e) => setRefundAmount(parseFloat(e.target.value) || 0)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2"
                  />
                </div>
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">Customer / Return Notes</label>
                <textarea
                  rows={2}
                  value={returnNotes}
                  onChange={(e) => setReturnNotes(e.target.value)}
                  placeholder="Notes from customer support ticket or courier RMA slip..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2"
                />
              </div>

              <div className="mt-6 flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsNewReturnModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg"
                >
                  Register RMA
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
