import React, { useState } from 'react';
import {
  Layers,
  Search,
  Filter,
  AlertTriangle,
  Plus,
  ArrowUpDown,
  History,
  Boxes,
  FileSpreadsheet,
  Check,
  X,
  PackagePlus,
  RefreshCw
} from 'lucide-react';
import {
  InventoryItem,
  InventoryAuditLog,
  ProductCategory,
  StockStatus
} from '../types';
import { getStockStatus } from '../utils/metrics';

interface InventoryManagerProps {
  inventory: InventoryItem[];
  auditLogs: InventoryAuditLog[];
  onAdjustStock: (sku: string, change: number, reason: 'restock' | 'cycle_count_adjustment' | 'damaged_writeoff') => void;
  onAddNewProduct: (newItem: InventoryItem) => void;
  onReorderStock: (sku: string, quantity: number) => void;
}

export const InventoryManager: React.FC<InventoryManagerProps> = ({
  inventory,
  auditLogs,
  onAdjustStock,
  onAddNewProduct,
  onReorderStock
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [isAuditModalOpen, setIsAuditModalOpen] = useState(false);

  // Quick Adjust Modal
  const [activeAdjustItem, setActiveAdjustItem] = useState<InventoryItem | null>(null);
  const [adjustAmount, setAdjustAmount] = useState<number>(10);
  const [adjustType, setAdjustType] = useState<'add' | 'subtract'>('add');
  const [adjustReason, setAdjustReason] = useState<'restock' | 'cycle_count_adjustment' | 'damaged_writeoff'>('restock');

  // Add Product Modal
  const [isAddProductModalOpen, setIsAddProductModalOpen] = useState(false);
  const [newSku, setNewSku] = useState('');
  const [newName, setNewName] = useState('');
  const [newCategory, setNewCategory] = useState<ProductCategory>('Electronics');
  const [newStockLevel, setNewStockLevel] = useState<number>(25);
  const [newSafetyStock, setNewSafetyStock] = useState<number>(15);
  const [newUnitCost, setNewUnitCost] = useState<number>(20);
  const [newSellingPrice, setNewSellingPrice] = useState<number>(49.99);
  const [newLocationBin, setNewLocationBin] = useState('BIN-A01');

  // Low Stock Reorder Banner
  const lowStockItems = inventory.filter(i => i.status === 'low_stock' || i.status === 'out_of_stock');

  const filteredInventory = inventory.filter(item => {
    const matchesSearch =
      item.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.locationBin.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory = categoryFilter === 'all' || item.category === categoryFilter;
    const matchesStatus = statusFilter === 'all' || item.status === statusFilter;

    return matchesSearch && matchesCategory && matchesStatus;
  });

  const handleOpenAdjustModal = (item: InventoryItem) => {
    setActiveAdjustItem(item);
    setAdjustAmount(10);
    setAdjustType('add');
    setAdjustReason('restock');
  };

  const handleConfirmAdjust = () => {
    if (!activeAdjustItem) return;
    const delta = adjustType === 'add' ? adjustAmount : -adjustAmount;
    onAdjustStock(activeAdjustItem.sku, delta, adjustReason);
    setActiveAdjustItem(null);
  };

  const handleCreateProductSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const status = getStockStatus(newStockLevel, newSafetyStock);

    const newItem: InventoryItem = {
      sku: newSku.toUpperCase() || `SKU-${Math.floor(100 + Math.random() * 900)}`,
      name: newName,
      category: newCategory,
      stockLevel: newStockLevel,
      safetyStock: newSafetyStock,
      unitCost: newUnitCost,
      sellingPrice: newSellingPrice,
      status,
      lastRestocked: new Date().toISOString().substring(0, 10),
      pendingInbound: 0,
      locationBin: newLocationBin.toUpperCase()
    };

    onAddNewProduct(newItem);
    setIsAddProductModalOpen(false);
    // Reset
    setNewSku('');
    setNewName('');
    setNewStockLevel(25);
    setNewSafetyStock(15);
  };

  const getStatusBadge = (status: StockStatus) => {
    switch (status) {
      case 'in_stock':
        return <span className="text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded text-xs font-semibold">In Stock</span>;
      case 'low_stock':
        return <span className="text-amber-800 bg-amber-50 px-2 py-0.5 rounded text-xs font-semibold">Low Stock Alert</span>;
      case 'out_of_stock':
        return <span className="text-rose-800 bg-rose-50 px-2 py-0.5 rounded text-xs font-semibold">Out of Stock</span>;
      case 'overstocked':
        return <span className="text-blue-800 bg-blue-50 px-2 py-0.5 rounded text-xs font-semibold">Overstocked</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Title & Action Strip */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            Inventory Management &amp; Stock Levels
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Real-time multi-SKU balances, safety reorder thresholds, inventory valuation &amp; audit trails.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsAuditModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
          >
            <History className="w-3.5 h-3.5" />
            <span>Audit Trail ({auditLogs.length})</span>
          </button>
          <button
            onClick={() => setIsAddProductModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add New SKU</span>
          </button>
        </div>
      </div>

      {/* Low Stock Replenishment Banner if items need attention */}
      {lowStockItems.length > 0 && (
        <div className="bg-amber-50/80 border border-amber-200 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-amber-900">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
            <span>
              <strong className="font-semibold">{lowStockItems.length} SKU(s)</strong> are currently at or below their safety stock levels. Immediate purchase reorder recommended.
            </span>
          </div>
          <button
            onClick={() => {
              lowStockItems.forEach(item => {
                const qty = item.safetyStock * 2 - item.stockLevel;
                onReorderStock(item.sku, Math.max(10, qty));
              });
            }}
            className="px-3 py-1.5 bg-amber-700 hover:bg-amber-800 text-white font-semibold rounded-lg shrink-0 transition-colors"
          >
            Auto-Reorder All Critical ({lowStockItems.length})
          </button>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by SKU, item name, or bin location..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:bg-white"
          />
        </div>
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className="text-slate-500 flex items-center gap-1">
            <Filter className="w-3.5 h-3.5" /> Category:
          </span>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="bg-slate-50 border border-slate-200 text-slate-700 py-1.5 px-2 rounded-lg font-medium"
          >
            <option value="all">All Categories</option>
            <option value="Electronics">Electronics</option>
            <option value="Apparel">Apparel</option>
            <option value="Home & Kitchen">Home &amp; Kitchen</option>
            <option value="Health & Beauty">Health &amp; Beauty</option>
            <option value="Sports & Outdoors">Sports &amp; Outdoors</option>
          </select>

          <span className="text-slate-500 ml-2">Stock Level:</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-slate-50 border border-slate-200 text-slate-700 py-1.5 px-2 rounded-lg font-medium"
          >
            <option value="all">All Stock Statuses ({inventory.length})</option>
            <option value="in_stock">In Stock</option>
            <option value="low_stock">Low Stock</option>
            <option value="out_of_stock">Out of Stock</option>
            <option value="overstocked">Overstocked</option>
          </select>
        </div>
      </div>

      {/* Inventory Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider">
                <th className="py-3 px-4">SKU &amp; Product</th>
                <th className="py-3 px-4">Category &amp; Bin</th>
                <th className="py-3 px-4 text-center">Available Stock</th>
                <th className="py-3 px-4 text-center">Safety Reorder Point</th>
                <th className="py-3 px-4">Stock Status</th>
                <th className="py-3 px-4 text-right">Unit Cost / Price</th>
                <th className="py-3 px-4 text-right">Stock Valuation</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredInventory.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-500">
                    <Boxes className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    No inventory catalog items found.
                  </td>
                </tr>
              ) : (
                filteredInventory.map(item => {
                  const valuation = item.stockLevel * item.unitCost;
                  const isLow = item.stockLevel <= item.safetyStock;

                  return (
                    <tr key={item.sku} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-900 truncate max-w-56">
                          {item.name}
                        </div>
                        <div className="text-slate-400 font-mono text-2xs mt-0.5">
                          {item.sku}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="text-slate-700">{item.category}</div>
                        <div className="text-slate-400 font-mono text-2xs mt-0.5">
                          Bin: {item.locationBin}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className={`font-bold tabular-nums text-sm ${isLow ? 'text-rose-600' : 'text-slate-900'}`}>
                          {item.stockLevel}
                        </span>
                        {item.pendingInbound > 0 && (
                          <div className="text-2xs text-indigo-600 font-medium">
                            +{item.pendingInbound} inbound
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-4 text-center text-slate-500 tabular-nums">
                        {item.safetyStock} units
                      </td>
                      <td className="py-3 px-4">
                        {getStatusBadge(item.status)}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="text-slate-900 font-medium tabular-nums">
                          ${item.sellingPrice.toFixed(2)}
                        </div>
                        <div className="text-slate-400 text-2xs tabular-nums">
                          Cost: ${item.unitCost.toFixed(2)}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-right font-semibold text-slate-900 tabular-nums">
                        ${valuation.toFixed(2)}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleOpenAdjustModal(item)}
                            className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 text-white font-medium rounded text-xs transition-colors"
                          >
                            Adjust
                          </button>
                          {isLow && (
                            <button
                              onClick={() => onReorderStock(item.sku, item.safetyStock * 2)}
                              className="px-2 py-1 bg-amber-600 hover:bg-amber-700 text-white font-medium rounded text-xs transition-colors flex items-center gap-1"
                              title="Trigger Purchase Reorder"
                            >
                              <RefreshCw className="w-3 h-3" />
                              <span>Reorder</span>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Adjust Stock Modal */}
      {activeAdjustItem && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">
                Adjust Stock: {activeAdjustItem.sku}
              </h3>
              <button
                onClick={() => setActiveAdjustItem(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="mt-4 space-y-4 text-xs">
              <div className="p-3 bg-slate-50 rounded-lg">
                <div className="font-semibold text-slate-900">{activeAdjustItem.name}</div>
                <div className="text-slate-500 mt-1">
                  Current On-Hand Stock: <span className="font-bold text-slate-900">{activeAdjustItem.stockLevel} units</span>
                </div>
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">Adjustment Type</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setAdjustType('add')}
                    className={`py-2 text-center rounded-lg font-semibold transition-colors ${
                      adjustType === 'add'
                        ? 'bg-emerald-600 text-white'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    + Add Units (Restock)
                  </button>
                  <button
                    type="button"
                    onClick={() => setAdjustType('subtract')}
                    className={`py-2 text-center rounded-lg font-semibold transition-colors ${
                      adjustType === 'subtract'
                        ? 'bg-rose-600 text-white'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    - Deduct Units (Write-off)
                  </button>
                </div>
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">Quantity</label>
                <input
                  type="number"
                  min="1"
                  value={adjustAmount}
                  onChange={(e) => setAdjustAmount(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 font-semibold text-sm tabular-nums"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">Adjustment Reason / Audit Code</label>
                <select
                  value={adjustReason}
                  onChange={(e) => setAdjustReason(e.target.value as any)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 font-medium"
                >
                  <option value="restock">Supplier Inbound Restock</option>
                  <option value="cycle_count_adjustment">Physical Cycle Count Correction</option>
                  <option value="damaged_writeoff">Damaged / Expired Write-off</option>
                </select>
              </div>

              <div className="p-3 bg-slate-100 rounded-lg text-slate-700">
                <span>Resulting Stock Level: </span>
                <span className="font-bold text-slate-900 tabular-nums">
                  {adjustType === 'add' ? activeAdjustItem.stockLevel + adjustAmount : Math.max(0, activeAdjustItem.stockLevel - adjustAmount)} units
                </span>
              </div>
            </div>
            <div className="mt-6 flex items-center justify-end gap-2">
              <button
                onClick={() => setActiveAdjustItem(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmAdjust}
                className="px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg"
              >
                Apply Stock Update
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add New SKU Modal */}
      {isAddProductModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-lg w-full p-6 shadow-xl border border-slate-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">
                Register New SKU in Catalog
              </h3>
              <button
                onClick={() => setIsAddProductModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateProductSubmit} className="mt-4 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Unique SKU Code *</label>
                  <input
                    type="text"
                    required
                    value={newSku}
                    onChange={(e) => setNewSku(e.target.value)}
                    placeholder="e.g. APX-EL-099"
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 font-mono uppercase"
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Category *</label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value as ProductCategory)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 font-medium"
                  >
                    <option value="Electronics">Electronics</option>
                    <option value="Apparel">Apparel</option>
                    <option value="Home & Kitchen">Home &amp; Kitchen</option>
                    <option value="Health & Beauty">Health &amp; Beauty</option>
                    <option value="Sports & Outdoors">Sports &amp; Outdoors</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">Product Title *</label>
                <input
                  type="text"
                  required
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="e.g. Wireless Ergonomic Mechanical Keyboard"
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Initial Stock *</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={newStockLevel}
                    onChange={(e) => setNewStockLevel(parseInt(e.target.value) || 0)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 font-semibold tabular-nums"
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Safety Stock Reorder Point</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={newSafetyStock}
                    onChange={(e) => setNewSafetyStock(parseInt(e.target.value) || 1)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 font-semibold tabular-nums"
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Warehouse Bin</label>
                  <input
                    type="text"
                    value={newLocationBin}
                    onChange={(e) => setNewLocationBin(e.target.value)}
                    placeholder="BIN-A01"
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 font-mono uppercase"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Unit Cost ($) *</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={newUnitCost}
                    onChange={(e) => setNewUnitCost(parseFloat(e.target.value) || 0)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 font-semibold tabular-nums"
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Retail Selling Price ($) *</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={newSellingPrice}
                    onChange={(e) => setNewSellingPrice(parseFloat(e.target.value) || 0)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 font-semibold tabular-nums"
                  />
                </div>
              </div>

              <div className="mt-6 flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddProductModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg"
                >
                  Save to Inventory Catalog
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Audit Trail Drawer / Modal */}
      {isAuditModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-lg w-full p-6 shadow-xl border border-slate-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Inventory Stock Audit Log
                </h3>
                <p className="text-xs text-slate-500">
                  Immutable record of restocks, sale fulfillment &amp; RMA return restocks.
                </p>
              </div>
              <button
                onClick={() => setIsAuditModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mt-4 space-y-3 text-xs">
              {auditLogs.length === 0 ? (
                <div className="py-8 text-center text-slate-500">
                  No adjustments recorded yet.
                </div>
              ) : (
                auditLogs.map(log => (
                  <div key={log.id} className="p-3 bg-slate-50 rounded-lg border border-slate-100 flex items-center justify-between">
                    <div>
                      <div className="font-semibold text-slate-900">{log.productName}</div>
                      <div className="text-slate-500 font-mono text-2xs mt-0.5">
                        {log.sku} · {log.timestamp}
                      </div>
                      <div className="text-slate-600 mt-1 capitalize text-2xs">
                        Reason: <span className="font-medium text-slate-800">{log.reason.replace(/_/g, ' ')}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className={`font-bold tabular-nums text-sm ${log.change > 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                        {log.change > 0 ? `+${log.change}` : log.change}
                      </span>
                      <div className="text-slate-400 text-2xs">
                        {log.previousStock} &rarr; {log.newStock}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="mt-6 pt-3 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setIsAuditModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg"
              >
                Close Audit Log
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
