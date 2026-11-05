import React, { useState } from 'react';
import {
  CreditCard,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Send,
  DollarSign,
  Plus,
  Mail,
  Copy,
  Check,
  X,
  Upload
} from 'lucide-react';
import {
  PaymentToComplete,
  PaymentStatus,
  PaymentMethodType,
  OrderDelivery
} from '../types';
import { formatCurrency } from '../utils/currency';

interface PaymentManagerProps {
  payments: PaymentToComplete[];
  orders: OrderDelivery[];
  onRecordPayment: (paymentId: string, amountPaid: number, referenceNotes?: string) => void;
  onConfirmCOD: (paymentId: string) => void;
  onSendReminder: (paymentId: string) => void;
  onAddNewPayment: (newPayment: PaymentToComplete) => void;
  onOpenUploadModal: (category?: 'payments') => void;
}

export const PaymentManager: React.FC<PaymentManagerProps> = ({
  payments,
  orders,
  onRecordPayment,
  onConfirmCOD,
  onSendReminder,
  onAddNewPayment,
  onOpenUploadModal
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [methodFilter, setMethodFilter] = useState<string>('all');

  // Record Payment Modal
  const [activePaymentModal, setActivePaymentModal] = useState<PaymentToComplete | null>(null);
  const [paymentAmountInput, setPaymentAmountInput] = useState<number>(0);
  const [paymentRefInput, setPaymentRefInput] = useState('');

  // Reminder Preview Modal
  const [activeReminderPayment, setActiveReminderPayment] = useState<PaymentToComplete | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);

  // New Invoice Modal
  const [isNewInvoiceModalOpen, setIsNewInvoiceModalOpen] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState(orders[0]?.id || '');
  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [invoiceAmount, setInvoiceAmount] = useState<number>(250);
  const [paymentType, setPaymentType] = useState<PaymentMethodType>('net30');
  const [dueDate, setDueDate] = useState<string>(new Date(Date.now() + 30 * 86400000).toISOString().substring(0, 10));
  const [invoiceNotes, setInvoiceNotes] = useState('');

  const filteredPayments = payments.filter(pay => {
    const matchesSearch =
      pay.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      pay.orderId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      pay.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      pay.customerEmail.toLowerCase().includes(searchQuery.toLowerCase());

    const isOverdue = pay.status !== 'completed' && new Date(pay.dueDate).getTime() < new Date('2026-11-05').getTime();
    
    let matchesStatus = true;
    if (statusFilter === 'all') matchesStatus = true;
    else if (statusFilter === 'overdue') matchesStatus = isOverdue || pay.status === 'overdue';
    else matchesStatus = pay.status === statusFilter;

    const matchesMethod = methodFilter === 'all' || pay.paymentType === methodFilter;

    return matchesSearch && matchesStatus && matchesMethod;
  });

  const handleOpenRecordModal = (pay: PaymentToComplete) => {
    setActivePaymentModal(pay);
    const balance = Math.max(0, pay.amount - pay.amountPaid);
    setPaymentAmountInput(balance);
    setPaymentRefInput('');
  };

  const handleConfirmRecord = () => {
    if (!activePaymentModal) return;
    onRecordPayment(activePaymentModal.id, paymentAmountInput, paymentRefInput);
    setActivePaymentModal(null);
  };

  const handleOpenReminderModal = (pay: PaymentToComplete) => {
    setActiveReminderPayment(pay);
    setCopiedLink(false);
  };

  const handleSendReminderConfirm = () => {
    if (!activeReminderPayment) return;
    onSendReminder(activeReminderPayment.id);
    setActiveReminderPayment(null);
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(`https://pay.apexcommerce.store/invoice/${activeReminderPayment?.id}`);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleCreateInvoiceSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newPayment: PaymentToComplete = {
      id: `PAY-2026-${Math.floor(1200 + Math.random() * 800)}`,
      orderId: selectedOrderId || `ORD-${Math.floor(9000 + Math.random() * 900)}`,
      customerName: customerName || 'Corporate Client',
      customerEmail: customerEmail || 'billing@client.com',
      amount: invoiceAmount,
      amountPaid: 0,
      paymentType,
      dueDate,
      status: 'pending',
      referenceNotes: invoiceNotes
    };

    onAddNewPayment(newPayment);
    setIsNewInvoiceModalOpen(false);
    setInvoiceNotes('');
  };

  const getMethodBadge = (type: PaymentMethodType) => {
    switch (type) {
      case 'upi':
        return <span className="text-teal-800 bg-teal-50 px-2 py-0.5 rounded text-2xs font-semibold">UPI / QR (Instant)</span>;
      case 'cod':
        return <span className="text-amber-800 bg-amber-50 px-2 py-0.5 rounded text-2xs font-semibold">COD (Cash on Delivery)</span>;
      case 'net30':
        return <span className="text-blue-800 bg-blue-50 px-2 py-0.5 rounded text-2xs font-semibold">Net-30 Invoice</span>;
      case 'credit_card_authorized':
        return <span className="text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded text-2xs font-semibold">Credit / Debit Card</span>;
      case 'bank_wire':
        return <span className="text-purple-800 bg-purple-50 px-2 py-0.5 rounded text-2xs font-semibold">NEFT / IMPS / NetBanking</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Title & Action Strip */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            Payments to Complete &amp; Receivables
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Pending checkout authorizations, courier Cash-on-Delivery (COD) collections, Net-30 B2B terms &amp; aging accounts.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => onOpenUploadModal('payments')}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
            title="Upload CSV to import payments or settlements"
          >
            <Upload className="w-3.5 h-3.5 text-slate-600" />
            <span>Upload Payments File</span>
          </button>
          <button
            onClick={() => setIsNewInvoiceModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Create B2B Invoice</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by Payment ID, Order #, customer name, or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white"
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
            <option value="all">All Receivables ({payments.length})</option>
            <option value="pending">Pending</option>
            <option value="partially_paid">Partially Paid</option>
            <option value="overdue">Overdue Alerts</option>
            <option value="completed">Completed / Settled</option>
          </select>

          <span className="text-slate-500 ml-2">Method:</span>
          <select
            value={methodFilter}
            onChange={(e) => setMethodFilter(e.target.value)}
            className="bg-slate-50 border border-slate-200 text-slate-700 py-1.5 px-2 rounded-lg font-medium"
          >
            <option value="all">All Methods</option>
            <option value="upi">UPI / QR (Instant)</option>
            <option value="cod">Cash on Delivery (COD)</option>
            <option value="bank_wire">NEFT / IMPS / NetBanking</option>
            <option value="credit_card_authorized">Credit / Debit Card</option>
            <option value="net30">Net-30 Invoice</option>
          </select>
        </div>
      </div>

      {/* Payments Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider">
                <th className="py-3 px-4">Payment ID &amp; Order Ref</th>
                <th className="py-3 px-4">Customer Details</th>
                <th className="py-3 px-4">Payment Channel</th>
                <th className="py-3 px-4">Due Date</th>
                <th className="py-3 px-4">Progress / Status</th>
                <th className="py-3 px-4 text-right">Pending Balance</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredPayments.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500">
                    <CreditCard className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    No payments found matching your search.
                  </td>
                </tr>
              ) : (
                filteredPayments.map(pay => {
                  const balance = Math.max(0, pay.amount - pay.amountPaid);
                  const isOverdue = balance > 0 && (pay.status === 'overdue' || new Date(pay.dueDate).getTime() < new Date('2026-11-05').getTime());

                  return (
                    <tr key={pay.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-900 font-mono">
                          {pay.id}
                        </div>
                        <div className="text-slate-400 font-mono text-2xs mt-0.5">
                          Order: {pay.orderId}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-medium text-slate-800">
                          {pay.customerName}
                        </div>
                        <div className="text-slate-500 text-2xs truncate max-w-44">
                          {pay.customerEmail}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        {getMethodBadge(pay.paymentType)}
                        {pay.paymentType === 'cod' && (
                          <div className="text-2xs text-slate-500 mt-1">
                            {pay.courierCollected ? 'Collected by Courier' : 'Awaiting Courier Handover'}
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <div className={`font-medium ${isOverdue ? 'text-rose-600 font-semibold' : 'text-slate-700'}`}>
                          {pay.dueDate}
                        </div>
                        {isOverdue && (
                          <div className="text-2xs font-semibold text-rose-600 flex items-center gap-1 mt-0.5">
                            <AlertTriangle className="w-3 h-3" /> Overdue
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <div className="w-20 bg-slate-200 h-1.5 rounded-full overflow-hidden">
                            <div
                              className="bg-emerald-600 h-full"
                              style={{ width: `${pay.amount > 0 ? (pay.amountPaid / pay.amount) * 100 : 100}%` }}
                            />
                          </div>
                          <span className="tabular-nums font-semibold text-slate-700 text-2xs">
                            {formatCurrency(pay.amountPaid)} / {formatCurrency(pay.amount)}
                          </span>
                        </div>
                        <div className="text-2xs text-slate-500 mt-0.5">
                          {pay.status === 'completed' ? (
                            <span className="text-emerald-700 font-semibold">Fully Settled</span>
                          ) : pay.status === 'partially_paid' ? (
                            <span>Partially Paid</span>
                          ) : (
                            <span>Payment Pending</span>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="font-bold text-slate-900 tabular-nums">
                          {formatCurrency(balance)}
                        </div>
                        <div className="text-2xs text-slate-400">
                          Total: {formatCurrency(pay.amount)}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {balance > 0 && (
                            <>
                              <button
                                onClick={() => handleOpenRecordModal(pay)}
                                className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded text-xs transition-colors"
                              >
                                Record
                              </button>
                              <button
                                onClick={() => handleOpenReminderModal(pay)}
                                className="p-1 text-slate-500 hover:text-slate-800 rounded bg-slate-100 hover:bg-slate-200"
                                title="Send Payment Link / Reminder"
                              >
                                <Mail className="w-3.5 h-3.5" />
                              </button>
                            </>
                          )}
                          {pay.paymentType === 'cod' && !pay.courierCollected && balance > 0 && (
                            <button
                              onClick={() => onConfirmCOD(pay.id)}
                              className="px-2 py-1 bg-amber-600 hover:bg-amber-700 text-white font-medium rounded text-2xs transition-colors"
                            >
                              Confirm COD
                            </button>
                          )}
                          {balance === 0 && (
                            <span className="text-emerald-600 text-xs font-medium inline-flex items-center gap-1">
                              <CheckCircle2 className="w-3.5 h-3.5" /> Settled
                            </span>
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

      {/* Record Payment Modal */}
      {activePaymentModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">
                Record Payment for {activePaymentModal.id}
              </h3>
              <button
                onClick={() => setActivePaymentModal(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="mt-4 space-y-4 text-xs">
              <div className="p-3 bg-slate-50 rounded-lg">
                <div className="flex justify-between text-slate-600">
                  <span>Customer:</span>
                  <span className="font-semibold text-slate-900">{activePaymentModal.customerName}</span>
                </div>
                <div className="flex justify-between text-slate-600 mt-1">
                  <span>Total Amount:</span>
                  <span className="font-semibold">{formatCurrency(activePaymentModal.amount)}</span>
                </div>
                <div className="flex justify-between text-slate-600 mt-1">
                  <span>Already Paid:</span>
                  <span className="text-emerald-600 font-semibold">{formatCurrency(activePaymentModal.amountPaid)}</span>
                </div>
                <div className="flex justify-between text-slate-800 font-bold border-t border-slate-200 pt-2 mt-2">
                  <span>Outstanding Balance:</span>
                  <span className="text-rose-600">
                    {formatCurrency(activePaymentModal.amount - activePaymentModal.amountPaid)}
                  </span>
                </div>
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">Amount to Record (₹) *</label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  max={activePaymentModal.amount - activePaymentModal.amountPaid}
                  value={paymentAmountInput}
                  onChange={(e) => setPaymentAmountInput(parseFloat(e.target.value) || 0)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 font-semibold text-sm tabular-nums"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">Transaction Ref / Cheque # / Notes</label>
                <input
                  type="text"
                  value={paymentRefInput}
                  onChange={(e) => setPaymentRefInput(e.target.value)}
                  placeholder="e.g. Wire confirmation WT-99120, Cheque #1042..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 font-mono"
                />
              </div>
            </div>
            <div className="mt-6 flex items-center justify-end gap-2">
              <button
                onClick={() => setActivePaymentModal(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmRecord}
                className="px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg"
              >
                Confirm Payment Receipt
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reminder / Pay Link Modal */}
      {activeReminderPayment && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">
                Payment Reminder &amp; Link
              </h3>
              <button
                onClick={() => setActiveReminderPayment(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="mt-4 space-y-4 text-xs">
              <div className="p-3 bg-slate-50 rounded-lg">
                <div className="text-slate-500">Recipient:</div>
                <div className="font-semibold text-slate-900">{activeReminderPayment.customerName} ({activeReminderPayment.customerEmail})</div>
                <div className="text-slate-600 mt-1">
                  Pending Amount: <span className="font-bold text-slate-900">{formatCurrency(activeReminderPayment.amount - activeReminderPayment.amountPaid)}</span>
                </div>
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">Generated Direct Payment Link</label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={`https://pay.apexcommerce.store/invoice/${activeReminderPayment.id}`}
                    className="flex-1 bg-slate-50 border border-slate-200 rounded-lg p-2 font-mono text-2xs text-slate-600"
                  />
                  <button
                    onClick={handleCopyLink}
                    className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg flex items-center gap-1 font-medium"
                  >
                    {copiedLink ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="p-3 border border-indigo-100 bg-indigo-50/50 rounded-lg text-indigo-900">
                <div className="font-semibold mb-1">Email Notice Preview:</div>
                <p className="text-2xs text-indigo-800 leading-relaxed">
                  &quot;Dear {activeReminderPayment.customerName}, this is a friendly reminder that payment of {formatCurrency(activeReminderPayment.amount - activeReminderPayment.amountPaid)} for Order {activeReminderPayment.orderId} was scheduled for {activeReminderPayment.dueDate}. Please click the secure link above to complete your transaction via UPI, Cards, or Net Banking.&quot;
                </p>
              </div>
            </div>
            <div className="mt-6 flex items-center justify-end gap-2">
              <button
                onClick={() => setActiveReminderPayment(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                Close
              </button>
              <button
                onClick={handleSendReminderConfirm}
                className="px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg flex items-center gap-1.5"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Send Reminder Now</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* New Invoice Modal */}
      {isNewInvoiceModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-lg w-full p-6 shadow-xl border border-slate-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">
                Create Receivable / B2B Invoice
              </h3>
              <button
                onClick={() => setIsNewInvoiceModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateInvoiceSubmit} className="mt-4 space-y-4 text-xs">
              <div>
                <label className="block font-medium text-slate-700 mb-1">Associated Order ID</label>
                <input
                  type="text"
                  value={selectedOrderId}
                  onChange={(e) => setSelectedOrderId(e.target.value)}
                  placeholder="e.g. ORD-2026-9043"
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Company / Customer Name *</label>
                  <input
                    type="text"
                    required
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="Customer or Business name"
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2"
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Billing Email *</label>
                  <input
                    type="email"
                    required
                    value={customerEmail}
                    onChange={(e) => setCustomerEmail(e.target.value)}
                    placeholder="billing@company.com"
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Invoice Total (₹) *</label>
                  <input
                    type="number"
                    step="0.01"
                    min="1"
                    required
                    value={invoiceAmount}
                    onChange={(e) => setInvoiceAmount(parseFloat(e.target.value) || 0)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 font-semibold"
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Payment Method</label>
                  <select
                    value={paymentType}
                    onChange={(e) => setPaymentType(e.target.value as PaymentMethodType)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 font-medium"
                  >
                    <option value="upi">UPI / QR (Instant)</option>
                    <option value="cod">Cash on Delivery (COD)</option>
                    <option value="bank_wire">NEFT / IMPS / NetBanking</option>
                    <option value="credit_card_authorized">Credit / Debit Card</option>
                    <option value="net30">Net-30 Invoice</option>
                  </select>
                </div>
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Due Date *</label>
                  <input
                    type="date"
                    required
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2"
                  />
                </div>
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">Billing Notes / Terms</label>
                <textarea
                  rows={2}
                  value={invoiceNotes}
                  onChange={(e) => setInvoiceNotes(e.target.value)}
                  placeholder="PO reference number, payment wire routing, or terms..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2"
                />
              </div>

              <div className="mt-6 flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsNewInvoiceModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg"
                >
                  Issue Invoice
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
