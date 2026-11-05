import React, { useState } from 'react';
import {
  Truck,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Plus,
  Send,
  Printer,
  ChevronRight,
  X,
  ExternalLink,
  Upload
} from 'lucide-react';
import {
  OrderDelivery,
  DeliveryStatus,
  CourierType,
  DeliveryPriority,
  InventoryItem
} from '../types';
import { formatCurrency } from '../utils/currency';

interface DeliveryManagerProps {
  orders: OrderDelivery[];
  inventory: InventoryItem[];
  onUpdateOrderStatus: (orderId: string, status: DeliveryStatus, deliveredAt?: string) => void;
  onDispatchOrder: (orderId: string, courier: CourierType, trackingNumber: string) => void;
  onAddNewOrder: (newOrder: OrderDelivery) => void;
  onInitiateReturn?: (order: OrderDelivery) => void;
  onOpenUploadModal: (category?: 'orders') => void;
}

export const DeliveryManager: React.FC<DeliveryManagerProps> = ({
  orders,
  inventory,
  onUpdateOrderStatus,
  onDispatchOrder,
  onAddNewOrder,
  onInitiateReturn,
  onOpenUploadModal
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [courierFilter, setCourierFilter] = useState<string>('all');
  const [selectedOrderIds, setSelectedOrderIds] = useState<string[]>([]);
  
  // Modals state
  const [activeDispatchOrder, setActiveDispatchOrder] = useState<OrderDelivery | null>(null);
  const [dispatchCourier, setDispatchCourier] = useState<CourierType>('FedEx Ground');
  const [dispatchTracking, setDispatchTracking] = useState('');

  const [activeDetailOrder, setActiveDetailOrder] = useState<OrderDelivery | null>(null);
  const [isNewOrderModalOpen, setIsNewOrderModalOpen] = useState(false);

  // New Order Form State
  const [newCustomerName, setNewCustomerName] = useState('');
  const [newCustomerEmail, setNewCustomerEmail] = useState('');
  const [newAddress, setNewAddress] = useState('');
  const [newCity, setNewCity] = useState('');
  const [newState, setNewState] = useState('');
  const [newPostalCode, setNewPostalCode] = useState('');
  const [newPriority, setNewPriority] = useState<DeliveryPriority>('standard');
  const [newCourier, setNewCourier] = useState<CourierType>('FedEx Ground');
  const [selectedSku, setSelectedSku] = useState(inventory[0]?.sku || '');
  const [itemQuantity, setItemQuantity] = useState(1);
  const [formError, setFormError] = useState('');

  // Filtering
  const filteredOrders = orders.filter(order => {
    const matchesSearch = 
      order.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.destination.city.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.trackingNumber.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
    const matchesCourier = courierFilter === 'all' || order.courier === courierFilter;

    return matchesSearch && matchesStatus && matchesCourier;
  });

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedOrderIds(filteredOrders.map(o => o.id));
    } else {
      setSelectedOrderIds([]);
    }
  };

  const handleToggleSelect = (orderId: string) => {
    setSelectedOrderIds(prev =>
      prev.includes(orderId) ? prev.filter(id => id !== orderId) : [...prev, orderId]
    );
  };

  const handleBulkMarkDelivered = () => {
    const now = new Date().toISOString().replace('T', ' ').substring(0, 16);
    selectedOrderIds.forEach(id => {
      onUpdateOrderStatus(id, 'delivered', now);
    });
    setSelectedOrderIds([]);
  };

  const handleOpenDispatchModal = (order: OrderDelivery) => {
    setActiveDispatchOrder(order);
    setDispatchCourier(order.courier);
    setDispatchTracking(order.trackingNumber || `TRK-${Math.floor(10000000 + Math.random() * 90000000)}`);
  };

  const handleConfirmDispatch = () => {
    if (!activeDispatchOrder) return;
    onDispatchOrder(activeDispatchOrder.id, dispatchCourier, dispatchTracking);
    setActiveDispatchOrder(null);
  };

  const handleCreateOrderSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCustomerName || !newCustomerEmail || !newAddress || !newCity || !newState || !newPostalCode) {
      setFormError('Please fill in all required customer and delivery address fields.');
      return;
    }

    const inventoryItem = inventory.find(i => i.sku === selectedSku);
    const unitPrice = inventoryItem ? inventoryItem.sellingPrice : 50;
    const total = unitPrice * itemQuantity;

    const newOrder: OrderDelivery = {
      id: `ORD-2026-${Math.floor(9100 + Math.random() * 800)}`,
      customerName: newCustomerName,
      customerEmail: newCustomerEmail,
      destination: {
        address: newAddress,
        city: newCity,
        state: newState,
        postalCode: newPostalCode
      },
      orderDate: new Date().toISOString().substring(0, 10),
      deliveryDueDate: new Date(Date.now() + 3 * 86400000).toISOString().substring(0, 10),
      items: [
        {
          sku: selectedSku,
          name: inventoryItem?.name || 'Assorted E-commerce Item',
          quantity: itemQuantity,
          unitPrice
        }
      ],
      totalAmount: total,
      courier: newCourier,
      trackingNumber: `EXP-${Math.floor(1000000000 + Math.random() * 9000000000)}`,
      status: 'awaiting_dispatch',
      priority: newPriority,
      paymentStatus: 'paid'
    };

    onAddNewOrder(newOrder);
    setIsNewOrderModalOpen(false);
    // Reset form
    setNewCustomerName('');
    setNewCustomerEmail('');
    setNewAddress('');
    setNewCity('');
    setNewState('');
    setNewPostalCode('');
    setFormError('');
  };

  const getStatusBadge = (status: DeliveryStatus) => {
    switch (status) {
      case 'awaiting_dispatch':
        return <span className="text-amber-700 bg-amber-50 px-2 py-0.5 rounded text-xs font-semibold">Awaiting Dispatch</span>;
      case 'in_transit':
        return <span className="text-sky-700 bg-sky-50 px-2 py-0.5 rounded text-xs font-semibold">In Transit</span>;
      case 'out_for_delivery':
        return <span className="text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded text-xs font-semibold">Out for Delivery</span>;
      case 'delivered':
        return <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded text-xs font-semibold">Delivered</span>;
      case 'delayed':
        return <span className="text-rose-700 bg-rose-50 px-2 py-0.5 rounded text-xs font-semibold">Delayed</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Title & Action Strip */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            Orders to Deliver
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Dispatch queue, courier tracking assignments, delivery SLAs &amp; final-mile handoffs.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {selectedOrderIds.length > 0 && (
            <button
              onClick={handleBulkMarkDelivered}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition-colors border border-emerald-200"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Mark {selectedOrderIds.length} Delivered</span>
            </button>
          )}
          <button
            onClick={() => onOpenUploadModal('orders')}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
            title="Upload CSV to batch create or change existing orders"
          >
            <Upload className="w-3.5 h-3.5 text-slate-600" />
            <span>Upload / Change Orders</span>
          </button>
          <button
            onClick={() => setIsNewOrderModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Create Delivery Order</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by Order ID, customer, city, or tracking #..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
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
            <option value="all">All Statuses ({orders.length})</option>
            <option value="awaiting_dispatch">Awaiting Dispatch</option>
            <option value="in_transit">In Transit</option>
            <option value="out_for_delivery">Out for Delivery</option>
            <option value="delivered">Delivered</option>
            <option value="delayed">Delayed</option>
          </select>

          <span className="text-slate-500 ml-2">Courier:</span>
          <select
            value={courierFilter}
            onChange={(e) => setCourierFilter(e.target.value)}
            className="bg-slate-50 border border-slate-200 text-slate-700 py-1.5 px-2 rounded-lg font-medium"
          >
            <option value="all">All Couriers</option>
            <option value="FedEx Ground">FedEx Ground</option>
            <option value="DHL Express">DHL Express</option>
            <option value="UPS Next Day">UPS Next Day</option>
            <option value="Local Fleet">Local Fleet</option>
          </select>
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider">
                <th className="py-3 px-4 w-10">
                  <input
                    type="checkbox"
                    checked={selectedOrderIds.length > 0 && selectedOrderIds.length === filteredOrders.length}
                    onChange={handleSelectAll}
                    className="rounded text-indigo-600 focus:ring-indigo-500"
                    aria-label="Select all orders"
                  />
                </th>
                <th className="py-3 px-4">Order ID &amp; Customer</th>
                <th className="py-3 px-4">Destination</th>
                <th className="py-3 px-4">Courier &amp; Tracking</th>
                <th className="py-3 px-4">Order Date / SLA</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Total</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-500">
                    <Truck className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    No orders matching your criteria found.
                  </td>
                </tr>
              ) : (
                filteredOrders.map(order => (
                  <tr key={order.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3 px-4">
                      <input
                        type="checkbox"
                        checked={selectedOrderIds.includes(order.id)}
                        onChange={() => handleToggleSelect(order.id)}
                        className="rounded text-indigo-600 focus:ring-indigo-500"
                        aria-label={`Select ${order.id}`}
                      />
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-900 flex items-center gap-1.5">
                        <button
                          onClick={() => setActiveDetailOrder(order)}
                          className="hover:text-indigo-600 underline font-mono text-xs"
                        >
                          {order.id}
                        </button>
                        {order.priority === 'overnight' && (
                          <span className="text-2xs bg-rose-100 text-rose-700 px-1.5 py-0.2 rounded font-semibold uppercase">
                            Overnight
                          </span>
                        )}
                      </div>
                      <div className="text-slate-500 mt-0.5 truncate max-w-44">
                        {order.customerName}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-slate-700">
                      <div>{order.destination.city}, {order.destination.state}</div>
                      <div className="text-slate-400 text-2xs truncate max-w-48">{order.destination.address}</div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-medium text-slate-800">{order.courier}</div>
                      <div className="font-mono text-2xs text-slate-500 mt-0.5 truncate max-w-44">
                        {order.trackingNumber || 'Pending Assignment'}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="text-slate-600">{order.orderDate}</div>
                      <div className="text-2xs font-medium text-slate-500 mt-0.5">
                        Due: <span className="text-slate-800 font-semibold">{order.deliveryDueDate}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      {getStatusBadge(order.status)}
                    </td>
                    <td className="py-3 px-4 text-right font-semibold text-slate-900 tabular-nums">
                      {formatCurrency(order.totalAmount)}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {order.status === 'awaiting_dispatch' && (
                          <button
                            onClick={() => handleOpenDispatchModal(order)}
                            className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 text-white font-medium rounded text-xs transition-colors"
                          >
                            Dispatch
                          </button>
                        )}
                        {order.status === 'in_transit' && (
                          <button
                            onClick={() => onUpdateOrderStatus(order.id, 'out_for_delivery')}
                            className="px-2.5 py-1 bg-sky-600 hover:bg-sky-700 text-white font-medium rounded text-xs transition-colors"
                          >
                            Out for Del.
                          </button>
                        )}
                        {order.status === 'out_for_delivery' && (
                          <button
                            onClick={() => onUpdateOrderStatus(order.id, 'delivered', new Date().toISOString().substring(0, 16))}
                            className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded text-xs transition-colors"
                          >
                            Delivered
                          </button>
                        )}
                        {order.status === 'delivered' && (
                          <span className="text-xs text-emerald-600 font-medium inline-flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Fulfilled
                          </span>
                        )}
                        <button
                          onClick={() => setActiveDetailOrder(order)}
                          className="p-1 text-slate-400 hover:text-slate-700 rounded"
                          title="View Order Details"
                        >
                          <ChevronRight className="w-4 h-4" />
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

      {/* Dispatch Modal */}
      {activeDispatchOrder && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">
                Dispatch Order {activeDispatchOrder.id}
              </h3>
              <button
                onClick={() => setActiveDispatchOrder(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="mt-4 space-y-4 text-xs">
              <div>
                <label className="block font-medium text-slate-700 mb-1">Assigned Carrier</label>
                <select
                  value={dispatchCourier}
                  onChange={(e) => setDispatchCourier(e.target.value as CourierType)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 font-medium"
                >
                  <option value="FedEx Ground">FedEx Ground</option>
                  <option value="DHL Express">DHL Express</option>
                  <option value="UPS Next Day">UPS Next Day</option>
                  <option value="Local Fleet">Local Fleet</option>
                </select>
              </div>
              <div>
                <label className="block font-medium text-slate-700 mb-1">Tracking Code / Air Waybill</label>
                <input
                  type="text"
                  value={dispatchTracking}
                  onChange={(e) => setDispatchTracking(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 font-mono"
                  placeholder="Enter tracking number"
                />
              </div>
              <div className="p-3 bg-slate-50 rounded-lg text-slate-600">
                <div className="font-semibold text-slate-800">Destination:</div>
                <div>{activeDispatchOrder.customerName}</div>
                <div>{activeDispatchOrder.destination.address}, {activeDispatchOrder.destination.city}, {activeDispatchOrder.destination.state}</div>
              </div>
            </div>
            <div className="mt-6 flex items-center justify-end gap-2">
              <button
                onClick={() => setActiveDispatchOrder(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDispatch}
                className="px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg"
              >
                Confirm Dispatch
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Order Details Slide-over / Modal */}
      {activeDetailOrder && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-lg w-full p-6 shadow-xl border border-slate-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  {activeDetailOrder.id}
                </h3>
                <p className="text-xs text-slate-500">
                  Placed on {activeDetailOrder.orderDate} · Priority: <span className="font-semibold uppercase">{activeDetailOrder.priority}</span>
                </p>
              </div>
              <button
                onClick={() => setActiveDetailOrder(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mt-4 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-4 p-3 bg-slate-50 rounded-lg">
                <div>
                  <div className="text-slate-500 font-medium">Customer Details</div>
                  <div className="font-semibold text-slate-900 mt-1">{activeDetailOrder.customerName}</div>
                  <div className="text-slate-600">{activeDetailOrder.customerEmail}</div>
                  {activeDetailOrder.customerPhone && (
                    <div className="text-slate-600">{activeDetailOrder.customerPhone}</div>
                  )}
                </div>
                <div>
                  <div className="text-slate-500 font-medium">Shipping Address</div>
                  <div className="text-slate-800 mt-1">{activeDetailOrder.destination.address}</div>
                  <div className="text-slate-800">{activeDetailOrder.destination.city}, {activeDetailOrder.destination.state} {activeDetailOrder.destination.postalCode}</div>
                </div>
              </div>

              <div>
                <h4 className="font-semibold text-slate-800 mb-2">Order Line Items</h4>
                <div className="border border-slate-200 rounded-lg overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-500">
                      <tr>
                        <th className="py-2 px-3">Item / SKU</th>
                        <th className="py-2 px-3 text-center">Qty</th>
                        <th className="py-2 px-3 text-right">Price</th>
                        <th className="py-2 px-3 text-right">Subtotal</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {activeDetailOrder.items.map((item, idx) => (
                        <tr key={idx}>
                          <td className="py-2 px-3">
                            <div className="font-medium text-slate-900">{item.name}</div>
                            <div className="text-slate-400 font-mono text-2xs">{item.sku}</div>
                          </td>
                          <td className="py-2 px-3 text-center tabular-nums">{item.quantity}</td>
                          <td className="py-2 px-3 text-right tabular-nums">{formatCurrency(item.unitPrice)}</td>
                          <td className="py-2 px-3 text-right font-semibold tabular-nums">
                            {formatCurrency(item.unitPrice * item.quantity)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="bg-slate-50 font-semibold border-t border-slate-200">
                      <tr>
                        <td colSpan={3} className="py-2 px-3 text-right text-slate-700">Total:</td>
                        <td className="py-2 px-3 text-right text-slate-900 tabular-nums">
                          {formatCurrency(activeDetailOrder.totalAmount)}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>

              <div className="p-3 bg-slate-50 rounded-lg flex items-center justify-between">
                <div>
                  <div className="font-semibold text-slate-800">Tracking Info</div>
                  <div className="text-slate-500 mt-0.5">Carrier: {activeDetailOrder.courier}</div>
                  <div className="font-mono text-slate-700">{activeDetailOrder.trackingNumber}</div>
                </div>
                <div>
                  {getStatusBadge(activeDetailOrder.status)}
                </div>
              </div>

              {activeDetailOrder.notes && (
                <div className="p-3 border border-amber-200 bg-amber-50/50 rounded-lg text-amber-900">
                  <span className="font-semibold">Special Delivery Instructions:</span> {activeDetailOrder.notes}
                </div>
              )}
            </div>

            <div className="mt-6 pt-3 border-t border-slate-100 flex items-center justify-between">
              <button
                onClick={() => window.print()}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print Packing Slip</span>
              </button>
              <button
                onClick={() => setActiveDetailOrder(null)}
                className="px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* New Order Modal */}
      {isNewOrderModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-lg w-full p-6 shadow-xl border border-slate-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">
                Create New Delivery Order
              </h3>
              <button
                onClick={() => setIsNewOrderModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateOrderSubmit} className="mt-4 space-y-4 text-xs">
              {formError && (
                <div className="p-3 bg-rose-50 text-rose-700 rounded-lg border border-rose-200">
                  {formError}
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Customer Full Name *</label>
                  <input
                    type="text"
                    required
                    value={newCustomerName}
                    onChange={(e) => setNewCustomerName(e.target.value)}
                    placeholder="e.g. Julian Hayes"
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2"
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Customer Email *</label>
                  <input
                    type="email"
                    required
                    value={newCustomerEmail}
                    onChange={(e) => setNewCustomerEmail(e.target.value)}
                    placeholder="julian@example.com"
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2"
                  />
                </div>
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">Street Address *</label>
                <input
                  type="text"
                  required
                  value={newAddress}
                  onChange={(e) => setNewAddress(e.target.value)}
                  placeholder="Street address and suite/apt"
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">City *</label>
                  <input
                    type="text"
                    required
                    value={newCity}
                    onChange={(e) => setNewCity(e.target.value)}
                    placeholder="City"
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2"
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-700 mb-1">State / Prov *</label>
                  <input
                    type="text"
                    required
                    value={newState}
                    onChange={(e) => setNewState(e.target.value)}
                    placeholder="State"
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2"
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Postal Code *</label>
                  <input
                    type="text"
                    required
                    value={newPostalCode}
                    onChange={(e) => setNewPostalCode(e.target.value)}
                    placeholder="Postal Code"
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2"
                  />
                </div>
              </div>

              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-3">
                <div className="font-semibold text-slate-800">Order Items</div>
                <div className="grid grid-cols-3 gap-3">
                  <div className="col-span-2">
                    <label className="block font-medium text-slate-700 mb-1">Catalog Item</label>
                    <select
                      value={selectedSku}
                      onChange={(e) => setSelectedSku(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-lg p-2"
                    >
                      {inventory.map(item => (
                        <option key={item.sku} value={item.sku}>
                          {item.name} ({formatCurrency(item.sellingPrice)})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block font-medium text-slate-700 mb-1">Quantity</label>
                    <input
                      type="number"
                      min="1"
                      value={itemQuantity}
                      onChange={(e) => setItemQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                      className="w-full bg-white border border-slate-200 rounded-lg p-2"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Courier Carrier</label>
                  <select
                    value={newCourier}
                    onChange={(e) => setNewCourier(e.target.value as CourierType)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 font-medium"
                  >
                    <option value="FedEx Ground">FedEx Ground</option>
                    <option value="DHL Express">DHL Express</option>
                    <option value="UPS Next Day">UPS Next Day</option>
                    <option value="Local Fleet">Local Fleet</option>
                  </select>
                </div>
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Delivery Priority</label>
                  <select
                    value={newPriority}
                    onChange={(e) => setNewPriority(e.target.value as DeliveryPriority)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 font-medium"
                  >
                    <option value="standard">Standard (3-5 days)</option>
                    <option value="express">Express (2 days)</option>
                    <option value="overnight">Overnight Priority</option>
                  </select>
                </div>
              </div>

              <div className="mt-6 flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsNewOrderModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg"
                >
                  Save &amp; Queue for Dispatch
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
