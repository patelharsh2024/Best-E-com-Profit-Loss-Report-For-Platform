import test from 'node:test';
import assert from 'node:assert/strict';
import {
  parseCsvRows,
  parseOrdersCsv,
  parseReturnsCsv,
  parsePaymentsCsv,
  generateSampleCsv,
  parseCleanNumber,
  normalizeDateToIso,
  detectDelimiter
} from './csvParser';

test('detectDelimiter correctly identifies comma, semicolon, and tab delimiters', () => {
  assert.equal(detectDelimiter('Order ID,Customer,Total\n1,Alice,100').delimiter, ',');
  assert.equal(detectDelimiter('Order ID;Customer;Total\n1;Bob;200').delimiter, ';');
  assert.equal(detectDelimiter('Order ID\tCustomer\tTotal\n1\tCharlie\t300').delimiter, '\t');
});

test('parseCleanNumber handles currency symbols and formatting formats', () => {
  assert.equal(parseCleanNumber('$1,249.50'), 1249.50);
  assert.equal(parseCleanNumber('250.00 €'), 250.00);
  assert.equal(parseCleanNumber('1.450,00'), 1450.00);
  assert.equal(parseCleanNumber('$ 99'), 99.00);
  assert.equal(parseCleanNumber('invalid', 50), 50.00);
});

test('normalizeDateToIso standardizes multiple date formats', () => {
  assert.equal(normalizeDateToIso('2026-11-05'), '2026-11-05');
  assert.equal(normalizeDateToIso('11/05/2026'), '2026-11-05');
  assert.equal(normalizeDateToIso('2026/11/05'), '2026-11-05');
});

test('parseOrdersCsv extracts orders from standard comma CSV', () => {
  const csv = generateSampleCsv('orders');
  const result = parseOrdersCsv(csv);
  assert.equal(result.success, true);
  assert.equal(result.data.length, 3);

  const order1 = result.data[0];
  assert.equal(order1.id, 'ORD-2026-9050');
  assert.equal(order1.customerName, 'Victoria Sterling');
  assert.equal(order1.status, 'in_transit');
  assert.equal(order1.courier, 'FedEx Ground');
  assert.equal(order1.totalAmount, 249.00);
});

test('parseOrdersCsv handles semicolon-separated CSV files (e.g. order1.csv in screenshot)', () => {
  const semicolonCsv = `Order ID;Customer Name;Courier;Status;Total Amount
ORD-9001;Sarah Connor;FedEx Ground;in_transit;$1,200.00
ORD-9002;John Wick;UPS Next Day;delivered;$450.00
ORD-9003;Ellen Ripley;DHL Express;awaiting_dispatch;$320.00`;

  const result = parseOrdersCsv(semicolonCsv);
  assert.equal(result.success, true);
  assert.equal(result.validCount, 3);
  assert.equal(result.data[0].id, 'ORD-9001');
  assert.equal(result.data[0].customerName, 'Sarah Connor');
  assert.equal(result.data[0].totalAmount, 1200.00);
  assert.equal(result.data[1].status, 'delivered');
});

test('parseOrdersCsv parses JSON order array directly', () => {
  const jsonText = JSON.stringify([
    { orderId: 'ORD-J1', customerName: 'Cyberdyne Corp', totalAmount: 850, status: 'in_transit' },
    { orderId: 'ORD-J2', customerName: 'Weyland Yutani', totalAmount: 1450, status: 'delivered' }
  ]);

  const result = parseOrdersCsv(jsonText);
  assert.equal(result.success, true);
  assert.equal(result.validCount, 2);
  assert.equal(result.data[0].id, 'ORD-J1');
  assert.equal(result.data[1].customerName, 'Weyland Yutani');
});

test('parseReturnsCsv parses RMA records with robust statuses', () => {
  const csv = generateSampleCsv('returns');
  const result = parseReturnsCsv(csv);
  assert.equal(result.success, true);
  assert.equal(result.data.length, 2);

  const rma1 = result.data[0];
  assert.equal(rma1.id, 'RMA-2026-0520');
  assert.equal(rma1.reason, 'wrong_size');
  assert.equal(rma1.status, 'pending_inspection');
  assert.equal(rma1.refundAmount, 189.00);
});

test('parsePaymentsCsv computes payment progress, currency, and types for comma and semicolon', () => {
  const semiPayments = `Invoice #;Client;Payment Method;Amount;Paid;Due Date
INV-401;Acme Global;credit_card;$500.00;$500.00;2026-11-05
INV-402;Beta Labs;cod;$1,200.00;$0.00;2026-11-08`;

  const result = parsePaymentsCsv(semiPayments);
  assert.equal(result.success, true);
  assert.equal(result.validCount, 2);
  assert.equal(result.data[0].id, 'INV-401');
  assert.equal(result.data[0].customerName, 'Acme Global');
  assert.equal(result.data[0].amount, 500.00);
  assert.equal(result.data[0].amountPaid, 500.00);
  assert.equal(result.data[0].status, 'completed');
  assert.equal(result.data[1].paymentType, 'cod');
  assert.equal(result.data[1].amount, 1200.00);
  assert.equal(result.data[1].status, 'pending');
});
