import React, { useState, useRef, useEffect } from 'react';
import {
  Upload,
  FileSpreadsheet,
  Download,
  CheckCircle2,
  AlertCircle,
  FileText,
  RotateCcw,
  CreditCard,
  Truck,
  ArrowRight,
  TrendingUp,
  X,
  FileCode2,
  RefreshCw,
  Info,
  ChevronDown,
  ChevronUp,
  Sparkles
} from 'lucide-react';
import {
  OrderDelivery,
  ProductReturn,
  PaymentToComplete
} from '../types';
import {
  parseOrdersCsv,
  parseReturnsCsv,
  parsePaymentsCsv,
  generateSampleCsv,
  ParseResult
} from '../utils/csvParser';

export type UploadCategory = 'orders' | 'returns' | 'payments';

interface FileUploadHubProps {
  initialCategory?: UploadCategory;
  existingOrders: OrderDelivery[];
  existingReturns: ProductReturn[];
  existingPayments: PaymentToComplete[];
  onImportOrders: (importedOrders: Partial<OrderDelivery>[], mode: 'merge' | 'append' | 'update') => void;
  onImportReturns: (importedReturns: Partial<ProductReturn>[], mode: 'merge' | 'append') => void;
  onImportPayments: (importedPayments: Partial<PaymentToComplete>[], mode: 'merge' | 'append') => void;
  onClose: () => void;
  onNavigateToReports: () => void;
}

export const FileUploadHub: React.FC<FileUploadHubProps> = ({
  initialCategory = 'orders',
  existingOrders,
  existingReturns,
  existingPayments,
  onImportOrders,
  onImportReturns,
  onImportPayments,
  onClose,
  onNavigateToReports
}) => {
  const [activeCategory, setActiveCategory] = useState<UploadCategory>(initialCategory);
  const [dragOver, setDragOver] = useState(false);
  const [fileName, setFileName] = useState<string>('');
  const [rawText, setRawText] = useState<string>('');
  const [isPastingText, setIsPastingText] = useState(false);
  const [importMode, setImportMode] = useState<'merge' | 'append' | 'update'>('merge');
  const [showErrorDetails, setShowErrorDetails] = useState(false);

  // Parse state
  const [parsedOrders, setParsedOrders] = useState<ParseResult<Partial<OrderDelivery>> | null>(null);
  const [parsedReturns, setParsedReturns] = useState<ParseResult<Partial<ProductReturn>> | null>(null);
  const [parsedPayments, setParsedPayments] = useState<ParseResult<Partial<PaymentToComplete>> | null>(null);

  const [importSuccessMessage, setImportSuccessMessage] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDownloadSample = () => {
    const csvContent = generateSampleCsv(activeCategory);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Sample_${activeCategory}_template.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const processContent = (content: string, name: string, category: UploadCategory = activeCategory) => {
    setFileName(name);
    setRawText(content);
    setImportSuccessMessage('');

    if (category === 'orders') {
      const result = parseOrdersCsv(content);
      setParsedOrders(result);
    } else if (category === 'returns') {
      const result = parseReturnsCsv(content);
      setParsedReturns(result);
    } else if (category === 'payments') {
      const result = parsePaymentsCsv(content);
      setParsedPayments(result);
    }
  };

  const handleSwitchCategory = (newCat: UploadCategory) => {
    setActiveCategory(newCat);
    setImportSuccessMessage('');
    if (rawText) {
      processContent(rawText, fileName || 'uploaded_data', newCat);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      processContent(text, file.name);
    };
    reader.readAsText(file);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      processContent(text, file.name);
    };
    reader.readAsText(file);
  };

  const handleApplyRawText = () => {
    if (!rawText.trim()) return;
    processContent(rawText, 'pasted_data.csv');
  };

  const handleLoadSampleDemo = () => {
    const sample = generateSampleCsv(activeCategory);
    processContent(sample, `demo_${activeCategory}.csv`);
  };

  const handleConfirmImport = () => {
    if (activeCategory === 'orders' && parsedOrders?.data.length) {
      onImportOrders(parsedOrders.data, importMode);
      setImportSuccessMessage(`Successfully imported and updated ${parsedOrders.data.length} delivery order record(s).`);
    } else if (activeCategory === 'returns' && parsedReturns?.data.length) {
      onImportReturns(parsedReturns.data, importMode === 'update' ? 'merge' : importMode);
      setImportSuccessMessage(`Successfully imported ${parsedReturns.data.length} return RMA record(s).`);
    } else if (activeCategory === 'payments' && parsedPayments?.data.length) {
      onImportPayments(parsedPayments.data, importMode === 'update' ? 'merge' : importMode);
      setImportSuccessMessage(`Successfully imported ${parsedPayments.data.length} payment record(s).`);
    }

    setTimeout(() => {
      onNavigateToReports();
      onClose();
    }, 1200);
  };

  const existingOrderIds = new Set(existingOrders.map(o => o.id));
  const existingReturnIds = new Set(existingReturns.map(r => r.id));
  const existingPaymentIds = new Set(existingPayments.map(p => p.id));

  // Active result inspection
  const activeResult = activeCategory === 'orders'
    ? parsedOrders
    : activeCategory === 'returns'
    ? parsedReturns
    : parsedPayments;

  const validCount = activeResult?.validCount ?? 0;
  const hasErrors = activeResult && activeResult.errors.length > 0;
  const detectedFormat = activeResult?.detectedFormat;
  const detectedDelimiter = activeResult?.detectedDelimiter;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-xl max-w-3xl w-full p-6 shadow-2xl border border-slate-200 max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 shrink-0">
          <div>
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Upload className="w-5 h-5 text-indigo-600" />
              <span>Data File Upload &amp; Batch Update Hub</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Upload files to create new entries or apply bulk status changes to existing orders, returns, and payments.
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Category Tabs */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-4 shrink-0">
          <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-lg">
            <button
              onClick={() => handleSwitchCategory('orders')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
                activeCategory === 'orders'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Truck className="w-3.5 h-3.5" />
              <span>Orders &amp; Deliveries</span>
            </button>
            <button
              onClick={() => handleSwitchCategory('returns')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
                activeCategory === 'returns'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Returns (RMA)</span>
            </button>
            <button
              onClick={() => handleSwitchCategory('payments')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
                activeCategory === 'payments'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <CreditCard className="w-3.5 h-3.5" />
              <span>Payments &amp; Receivables</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleLoadSampleDemo}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
              title="Fill with valid sample data for quick preview"
            >
              <Sparkles className="w-3 h-3 text-amber-500" />
              <span>Load Demo Data</span>
            </button>
            <button
              onClick={handleDownloadSample}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors shrink-0"
            >
              <Download className="w-3.5 h-3.5 text-slate-500" />
              <span>Download Template</span>
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto py-4 space-y-4">
          {importSuccessMessage && (
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-900 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span className="font-semibold">{importSuccessMessage}</span>
              </div>
              <button
                onClick={() => {
                  onNavigateToReports();
                  onClose();
                }}
                className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded font-medium flex items-center gap-1"
              >
                <span>View Reports</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>
          )}

          {/* Mode Selector for Orders */}
          {activeCategory === 'orders' && (
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <div>
                <span className="font-semibold text-slate-800">Import &amp; Change Strategy:</span>
                <span className="text-slate-500 ml-1">How matching Order IDs should be processed</span>
              </div>
              <div className="flex items-center gap-2">
                <select
                  value={importMode}
                  onChange={(e) => setImportMode(e.target.value as any)}
                  className="bg-white border border-slate-200 rounded-lg py-1 px-2.5 font-semibold text-slate-800 text-xs"
                >
                  <option value="merge">Smart Sync (Update existing &amp; add new)</option>
                  <option value="update">Update Matching Orders Only (Status / Carrier / Tracking)</option>
                  <option value="append">Append All as New Orders</option>
                </select>
              </div>
            </div>
          )}

          {/* Drag & Drop Upload Zone */}
          {!isPastingText ? (
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setDragOver(true);
              }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors ${
                dragOver
                  ? 'border-indigo-500 bg-indigo-50/50'
                  : 'border-slate-300 hover:border-slate-400 bg-slate-50/50'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,.txt,.json,.tsv"
                onChange={handleFileChange}
                className="hidden"
              />
              <FileSpreadsheet className="w-9 h-9 text-slate-400 mx-auto mb-2" />
              <div className="text-xs font-bold text-slate-800">
                {fileName ? fileName : `Drop your ${activeCategory} CSV, TSV, or JSON file here`}
              </div>
              <div className="text-2xs text-slate-500 mt-1">
                Auto-detects comma (,), semicolon (;), tab (TSV), and pipe (|) delimiters
              </div>
              <div className="mt-3 flex items-center justify-center gap-2">
                <button
                  type="button"
                  className="px-3 py-1.5 text-xs font-semibold text-white bg-slate-900 rounded-lg hover:bg-slate-800"
                >
                  Browse Files
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsPastingText(true);
                  }}
                  className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50"
                >
                  Paste Raw Text
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-800">Paste CSV, TSV, or JSON Content</span>
                <button
                  type="button"
                  onClick={() => setIsPastingText(false)}
                  className="text-slate-500 hover:text-slate-800 font-medium"
                >
                  Back to File Drop
                </button>
              </div>
              <textarea
                rows={5}
                value={rawText}
                onChange={(e) => setRawText(e.target.value)}
                placeholder="Paste CSV rows here (with or without header row)..."
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 font-mono text-xs"
              />
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleApplyRawText}
                  className="px-3 py-1.5 text-xs font-semibold text-white bg-slate-900 rounded-lg hover:bg-slate-800"
                >
                  Parse &amp; Preview
                </button>
                <button
                  type="button"
                  onClick={handleLoadSampleDemo}
                  className="px-3 py-1.5 text-xs font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg"
                >
                  Insert Sample Text
                </button>
              </div>
            </div>
          )}

          {/* Detected Format & Warnings Banner */}
          {activeResult && (
            <div className="flex flex-wrap items-center justify-between gap-2 px-3 py-2 bg-slate-100/70 border border-slate-200 rounded-lg text-2xs text-slate-600">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-slate-800">Format:</span>
                <span className="bg-white px-2 py-0.5 rounded border border-slate-200 font-mono text-slate-700">
                  {detectedFormat === 'json'
                    ? 'JSON Array'
                    : detectedFormat === 'semicolon'
                    ? 'CSV (Semicolon ;)'
                    : detectedFormat === 'tsv'
                    ? 'TSV (Tab-delimited)'
                    : 'Standard CSV (,)'}
                </span>
                <span className="text-slate-400">·</span>
                <span>
                  Parsed <strong className="text-slate-900 font-semibold">{validCount}</strong> valid row(s) out of {activeResult.totalRows}
                </span>
              </div>

              {hasErrors && (
                <button
                  type="button"
                  onClick={() => setShowErrorDetails(!showErrorDetails)}
                  className="text-amber-700 hover:text-amber-800 font-medium flex items-center gap-1"
                >
                  <span>{activeResult.errors.length} notice(s)</span>
                  {showErrorDetails ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                </button>
              )}
            </div>
          )}

          {/* Collapsible Error/Warning details */}
          {showErrorDetails && activeResult && activeResult.errors.length > 0 && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs space-y-1 text-amber-900">
              <div className="font-semibold flex items-center gap-1.5 text-amber-800">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>Parser Details &amp; Fallbacks Applied:</span>
              </div>
              <ul className="list-disc pl-5 space-y-0.5 text-2xs text-amber-800 max-h-24 overflow-y-auto">
                {activeResult.errors.map((err, i) => (
                  <li key={i}>{err}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Parsed Orders Preview */}
          {activeCategory === 'orders' && parsedOrders && (
            <div className="border border-slate-200 rounded-xl overflow-hidden text-xs">
              <div className="bg-slate-50 p-3 border-b border-slate-200 flex items-center justify-between">
                <div className="font-semibold text-slate-800 flex items-center gap-2">
                  <span>Parsed Orders Preview:</span>
                  <span className="font-bold text-slate-900 tabular-nums">{parsedOrders.validCount} valid rows</span>
                </div>
              </div>
              <div className="max-h-56 overflow-y-auto">
                <table className="w-full text-left">
                  <thead className="bg-slate-100/70 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-2xs">
                    <tr>
                      <th className="py-2 px-3">Order ID</th>
                      <th className="py-2 px-3">Customer</th>
                      <th className="py-2 px-3">Courier</th>
                      <th className="py-2 px-3">Status</th>
                      <th className="py-2 px-3 text-right">Amount</th>
                      <th className="py-2 px-3 text-center">Action Preview</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {parsedOrders.data.map((order, idx) => {
                      const exists = order.id ? existingOrderIds.has(order.id) : false;
                      return (
                        <tr key={idx} className="hover:bg-slate-50">
                          <td className="py-2 px-3 font-mono font-medium text-slate-900">{order.id}</td>
                          <td className="py-2 px-3 text-slate-700">{order.customerName}</td>
                          <td className="py-2 px-3 text-slate-600">{order.courier}</td>
                          <td className="py-2 px-3 font-semibold capitalize text-slate-800">
                            {order.status?.replace('_', ' ')}
                          </td>
                          <td className="py-2 px-3 text-right tabular-nums font-semibold text-slate-900">
                            ${order.totalAmount?.toFixed(2)}
                          </td>
                          <td className="py-2 px-3 text-center">
                            {exists ? (
                              <span className="text-2xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded font-semibold">
                                Update Existing
                              </span>
                            ) : (
                              <span className="text-2xs bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded font-semibold">
                                New Order
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Parsed Returns Preview */}
          {activeCategory === 'returns' && parsedReturns && (
            <div className="border border-slate-200 rounded-xl overflow-hidden text-xs">
              <div className="bg-slate-50 p-3 border-b border-slate-200 flex items-center justify-between">
                <div className="font-semibold text-slate-800 flex items-center gap-2">
                  <span>Parsed Returns Preview:</span>
                  <span className="font-bold text-slate-900 tabular-nums">{parsedReturns.validCount} valid entries</span>
                </div>
              </div>
              <div className="max-h-56 overflow-y-auto">
                <table className="w-full text-left">
                  <thead className="bg-slate-100/70 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-2xs">
                    <tr>
                      <th className="py-2 px-3">RMA ID</th>
                      <th className="py-2 px-3">Order Ref</th>
                      <th className="py-2 px-3">Customer</th>
                      <th className="py-2 px-3">Reason</th>
                      <th className="py-2 px-3">Status</th>
                      <th className="py-2 px-3 text-right">Refund</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {parsedReturns.data.map((ret, idx) => (
                      <tr key={idx} className="hover:bg-slate-50">
                        <td className="py-2 px-3 font-mono font-medium text-slate-900">{ret.id}</td>
                        <td className="py-2 px-3 font-mono text-slate-500">{ret.orderId}</td>
                        <td className="py-2 px-3 text-slate-700">{ret.customerName}</td>
                        <td className="py-2 px-3 capitalize text-slate-800">{ret.reason?.replace('_', ' ')}</td>
                        <td className="py-2 px-3 font-medium capitalize text-slate-800">{ret.status}</td>
                        <td className="py-2 px-3 text-right tabular-nums font-semibold text-slate-900">
                          ${ret.refundAmount?.toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Parsed Payments Preview */}
          {activeCategory === 'payments' && parsedPayments && (
            <div className="border border-slate-200 rounded-xl overflow-hidden text-xs">
              <div className="bg-slate-50 p-3 border-b border-slate-200 flex items-center justify-between">
                <div className="font-semibold text-slate-800 flex items-center gap-2">
                  <span>Parsed Payments Preview:</span>
                  <span className="font-bold text-slate-900 tabular-nums">{parsedPayments.validCount} valid entries</span>
                </div>
              </div>
              <div className="max-h-56 overflow-y-auto">
                <table className="w-full text-left">
                  <thead className="bg-slate-100/70 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-2xs">
                    <tr>
                      <th className="py-2 px-3">Payment ID</th>
                      <th className="py-2 px-3">Order Ref</th>
                      <th className="py-2 px-3">Customer</th>
                      <th className="py-2 px-3">Channel</th>
                      <th className="py-2 px-3 text-right">Amount</th>
                      <th className="py-2 px-3 text-right">Paid</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {parsedPayments.data.map((pay, idx) => (
                      <tr key={idx} className="hover:bg-slate-50">
                        <td className="py-2 px-3 font-mono font-medium text-slate-900">{pay.id}</td>
                        <td className="py-2 px-3 font-mono text-slate-500">{pay.orderId}</td>
                        <td className="py-2 px-3 text-slate-700">{pay.customerName}</td>
                        <td className="py-2 px-3 uppercase text-2xs font-mono text-slate-800">{pay.paymentType}</td>
                        <td className="py-2 px-3 text-right tabular-nums font-semibold text-slate-900">
                          ${pay.amount?.toFixed(2)}
                        </td>
                        <td className="py-2 px-3 text-right tabular-nums text-emerald-600 font-semibold">
                          ${pay.amountPaid?.toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="pt-4 border-t border-slate-100 flex items-center justify-between shrink-0">
          <div className="text-2xs text-slate-500">
            Reports will dynamically regenerate instantly upon import.
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
            >
              Cancel
            </button>
            <button
              disabled={validCount === 0}
              onClick={handleConfirmImport}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed rounded-lg transition-colors shadow-xs"
            >
              <TrendingUp className="w-3.5 h-3.5 text-indigo-400" />
              <span>Import &amp; Generate Monthly Reports</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
