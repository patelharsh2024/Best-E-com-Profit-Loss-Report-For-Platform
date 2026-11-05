import {
  OrderDelivery,
  ProductReturn,
  PaymentToComplete,
  InventoryItem,
  InventoryAuditLog
} from '../types';

export const INITIAL_INVENTORY: InventoryItem[] = [
  {
    sku: 'APX-EL-001',
    name: 'AcousticPro Wireless ANC Headphones',
    category: 'Electronics',
    stockLevel: 14,
    safetyStock: 25,
    unitCost: 78.50,
    sellingPrice: 189.00,
    status: 'low_stock',
    lastRestocked: '2026-10-18',
    pendingInbound: 50,
    locationBin: 'BIN-E01'
  },
  {
    sku: 'APX-EL-002',
    name: 'PulseTrack GPS Smart Fitness Watch',
    category: 'Electronics',
    stockLevel: 0,
    safetyStock: 20,
    unitCost: 65.00,
    sellingPrice: 149.00,
    status: 'out_of_stock',
    lastRestocked: '2026-10-02',
    pendingInbound: 100,
    locationBin: 'BIN-E04'
  },
  {
    sku: 'APX-EL-003',
    name: 'UltraFast 65W GaN Dual USB-C Charger',
    category: 'Electronics',
    stockLevel: 142,
    safetyStock: 30,
    unitCost: 14.20,
    sellingPrice: 38.00,
    status: 'in_stock',
    lastRestocked: '2026-11-01',
    pendingInbound: 0,
    locationBin: 'BIN-E09'
  },
  {
    sku: 'APX-AP-101',
    name: 'Merino Wool Minimalist Crewneck Sweater (Charcoal)',
    category: 'Apparel',
    stockLevel: 18,
    safetyStock: 20,
    unitCost: 32.00,
    sellingPrice: 95.00,
    status: 'low_stock',
    lastRestocked: '2026-10-24',
    pendingInbound: 40,
    locationBin: 'BIN-A12'
  },
  {
    sku: 'APX-AP-102',
    name: 'Everyday Tech Chino Trousers (Navy)',
    category: 'Apparel',
    stockLevel: 68,
    safetyStock: 25,
    unitCost: 28.00,
    sellingPrice: 85.00,
    status: 'in_stock',
    lastRestocked: '2026-10-29',
    pendingInbound: 0,
    locationBin: 'BIN-A15'
  },
  {
    sku: 'APX-HK-201',
    name: 'Precision Barista Electric Gooseneck Kettle',
    category: 'Home & Kitchen',
    stockLevel: 32,
    safetyStock: 15,
    unitCost: 45.00,
    sellingPrice: 119.00,
    status: 'in_stock',
    lastRestocked: '2026-10-15',
    pendingInbound: 0,
    locationBin: 'BIN-K03'
  },
  {
    sku: 'APX-HK-202',
    name: 'Cast Iron Double-Enamelled Dutch Oven 5.5 Qt',
    category: 'Home & Kitchen',
    stockLevel: 8,
    safetyStock: 12,
    unitCost: 55.00,
    sellingPrice: 139.00,
    status: 'low_stock',
    lastRestocked: '2026-10-10',
    pendingInbound: 30,
    locationBin: 'BIN-K08'
  },
  {
    sku: 'APX-HB-301',
    name: 'Botanical Hydrating Facial Oil Serum 50ml',
    category: 'Health & Beauty',
    stockLevel: 95,
    safetyStock: 30,
    unitCost: 11.00,
    sellingPrice: 42.00,
    status: 'in_stock',
    lastRestocked: '2026-10-28',
    pendingInbound: 0,
    locationBin: 'BIN-B02'
  },
  {
    sku: 'APX-SP-401',
    name: 'ProGrip Insulated Stainless Steel Hydration Flask 32oz',
    category: 'Sports & Outdoors',
    stockLevel: 115,
    safetyStock: 35,
    unitCost: 9.50,
    sellingPrice: 32.00,
    status: 'in_stock',
    lastRestocked: '2026-10-20',
    pendingInbound: 0,
    locationBin: 'BIN-S05'
  },
  {
    sku: 'APX-SP-402',
    name: 'Ultralight Ripstop Trail Daypack 24L',
    category: 'Sports & Outdoors',
    stockLevel: 5,
    safetyStock: 15,
    unitCost: 24.00,
    sellingPrice: 79.00,
    status: 'low_stock',
    lastRestocked: '2026-09-22',
    pendingInbound: 25,
    locationBin: 'BIN-S11'
  }
];

export const INITIAL_ORDERS: OrderDelivery[] = [
  // Current Month: November 2026
  {
    id: 'ORD-2026-9041',
    customerName: 'Marcus Vance',
    customerEmail: 'm.vance@techcorp.io',
    customerPhone: '+1 (555) 234-8901',
    destination: {
      address: '742 Evergreen Terrace',
      city: 'Portland',
      state: 'OR',
      postalCode: '97201'
    },
    orderDate: '2026-11-04',
    deliveryDueDate: '2026-11-07',
    items: [
      { sku: 'APX-EL-001', name: 'AcousticPro Wireless ANC Headphones', quantity: 1, unitPrice: 189.00 },
      { sku: 'APX-EL-003', name: 'UltraFast 65W GaN Dual USB-C Charger', quantity: 2, unitPrice: 38.00 }
    ],
    totalAmount: 265.00,
    courier: 'FedEx Ground',
    trackingNumber: 'FX-88921049281',
    status: 'in_transit',
    priority: 'standard',
    paymentStatus: 'paid',
    notes: 'Gate code #4412. Leave at front porch.'
  },
  {
    id: 'ORD-2026-9042',
    customerName: 'Elena Rostova',
    customerEmail: 'elena.rostova@gmail.com',
    customerPhone: '+1 (555) 345-6712',
    destination: {
      address: '1200 Lake Shore Drive, Apt 14B',
      city: 'Chicago',
      state: 'IL',
      postalCode: '60611'
    },
    orderDate: '2026-11-04',
    deliveryDueDate: '2026-11-06',
    items: [
      { sku: 'APX-HK-201', name: 'Precision Barista Electric Gooseneck Kettle', quantity: 1, unitPrice: 119.00 }
    ],
    totalAmount: 119.00,
    courier: 'UPS Next Day',
    trackingNumber: '1Z999AA10123456784',
    status: 'out_for_delivery',
    priority: 'express',
    paymentStatus: 'paid'
  },
  {
    id: 'ORD-2026-9043',
    customerName: 'Aria Sterling',
    customerEmail: 'aria.sterling@designhub.co',
    customerPhone: '+1 (555) 789-0123',
    destination: {
      address: '488 Brannan St, Suite 300',
      city: 'San Francisco',
      state: 'CA',
      postalCode: '94107'
    },
    orderDate: '2026-11-05',
    deliveryDueDate: '2026-11-08',
    items: [
      { sku: 'APX-AP-101', name: 'Merino Wool Minimalist Crewneck Sweater', quantity: 2, unitPrice: 95.00 },
      { sku: 'APX-AP-102', name: 'Everyday Tech Chino Trousers', quantity: 1, unitPrice: 85.00 }
    ],
    totalAmount: 275.00,
    courier: 'DHL Express',
    trackingNumber: 'DHL-9034827101',
    status: 'awaiting_dispatch',
    priority: 'express',
    paymentStatus: 'pending_invoice',
    notes: 'Requires signature on delivery.'
  },
  {
    id: 'ORD-2026-9044',
    customerName: 'Derrick Henderson',
    customerEmail: 'dhenderson44@yahoo.com',
    customerPhone: '+1 (555) 890-4412',
    destination: {
      address: '320 South Congress Ave',
      city: 'Austin',
      state: 'TX',
      postalCode: '78704'
    },
    orderDate: '2026-11-02',
    deliveryDueDate: '2026-11-04',
    items: [
      { sku: 'APX-SP-401', name: 'ProGrip Insulated Stainless Steel Hydration Flask', quantity: 2, unitPrice: 32.00 },
      { sku: 'APX-SP-402', name: 'Ultralight Ripstop Trail Daypack 24L', quantity: 1, unitPrice: 79.00 }
    ],
    totalAmount: 143.00,
    courier: 'Local Fleet',
    trackingNumber: 'LOC-TX-55019',
    status: 'delivered',
    priority: 'standard',
    deliveredAt: '2026-11-04 14:22',
    paymentStatus: 'paid'
  },
  {
    id: 'ORD-2026-9045',
    customerName: 'Sophia Lin',
    customerEmail: 'sophia.lin@gmail.com',
    customerPhone: '+1 (555) 678-2234',
    destination: {
      address: '155 Commonwealth Ave',
      city: 'Boston',
      state: 'MA',
      postalCode: '02116'
    },
    orderDate: '2026-11-01',
    deliveryDueDate: '2026-11-03',
    items: [
      { sku: 'APX-HK-202', name: 'Cast Iron Double-Enamelled Dutch Oven 5.5 Qt', quantity: 1, unitPrice: 139.00 }
    ],
    totalAmount: 139.00,
    courier: 'FedEx Ground',
    trackingNumber: 'FX-88921049900',
    status: 'delayed',
    priority: 'standard',
    paymentStatus: 'pending_cod',
    notes: 'Severe weather delay in regional sorting hub.'
  },
  {
    id: 'ORD-2026-9046',
    customerName: 'Lucas Morales',
    customerEmail: 'lmorales@apexstudio.net',
    customerPhone: '+1 (555) 912-3841',
    destination: {
      address: '88 Ocean Boulevard',
      city: 'Miami',
      state: 'FL',
      postalCode: '33139'
    },
    orderDate: '2026-11-03',
    deliveryDueDate: '2026-11-05',
    items: [
      { sku: 'APX-HB-301', name: 'Botanical Hydrating Facial Oil Serum 50ml', quantity: 3, unitPrice: 42.00 }
    ],
    totalAmount: 126.00,
    courier: 'UPS Next Day',
    trackingNumber: '1Z999AA10998877665',
    status: 'delivered',
    priority: 'overnight',
    deliveredAt: '2026-11-05 10:15',
    paymentStatus: 'paid'
  },

  // Past Month: October 2026
  {
    id: 'ORD-2026-8801',
    customerName: 'Claire Beaumont',
    customerEmail: 'cbeaumont@luxuryhome.com',
    destination: { address: '500 Park Avenue', city: 'New York', state: 'NY', postalCode: '10022' },
    orderDate: '2026-10-12',
    deliveryDueDate: '2026-10-15',
    items: [{ sku: 'APX-HK-202', name: 'Cast Iron Dutch Oven', quantity: 2, unitPrice: 139.00 }],
    totalAmount: 278.00,
    courier: 'FedEx Ground',
    trackingNumber: 'FX-7712399120',
    status: 'delivered',
    priority: 'standard',
    deliveredAt: '2026-10-14 16:30',
    paymentStatus: 'paid'
  },
  {
    id: 'ORD-2026-8802',
    customerName: 'Robert Vance',
    customerEmail: 'rvance@refrigeration.com',
    destination: { address: '333 Scranton Rd', city: 'Scranton', state: 'PA', postalCode: '18503' },
    orderDate: '2026-10-18',
    deliveryDueDate: '2026-10-21',
    items: [{ sku: 'APX-EL-001', name: 'AcousticPro Headphones', quantity: 1, unitPrice: 189.00 }],
    totalAmount: 189.00,
    courier: 'UPS Next Day',
    trackingNumber: '1Z888BB20987654321',
    status: 'delivered',
    priority: 'express',
    deliveredAt: '2026-10-20 11:45',
    paymentStatus: 'paid'
  },
  {
    id: 'ORD-2026-8803',
    customerName: 'Nadia Thorne',
    customerEmail: 'nadia.thorne@outlook.com',
    destination: { address: '445 Seattle Harbor View', city: 'Seattle', state: 'WA', postalCode: '98104' },
    orderDate: '2026-10-22',
    deliveryDueDate: '2026-10-25',
    items: [{ sku: 'APX-AP-101', name: 'Merino Wool Crewneck', quantity: 1, unitPrice: 95.00 }],
    totalAmount: 95.00,
    courier: 'DHL Express',
    trackingNumber: 'DHL-887123441',
    status: 'delivered',
    priority: 'standard',
    deliveredAt: '2026-10-25 15:10',
    paymentStatus: 'paid'
  },
  {
    id: 'ORD-2026-8804',
    customerName: 'Tariq Al-Mansoor',
    customerEmail: 'tariq@almansoor.ae',
    destination: { address: '12 Peachtree St NW', city: 'Atlanta', state: 'GA', postalCode: '30303' },
    orderDate: '2026-10-27',
    deliveryDueDate: '2026-10-30',
    items: [{ sku: 'APX-EL-003', name: 'UltraFast 65W GaN Charger', quantity: 5, unitPrice: 38.00 }],
    totalAmount: 190.00,
    courier: 'Local Fleet',
    trackingNumber: 'LOC-GA-99120',
    status: 'delivered',
    priority: 'standard',
    deliveredAt: '2026-10-29 13:00',
    paymentStatus: 'paid'
  },

  // Past Month: September 2026
  {
    id: 'ORD-2026-8610',
    customerName: 'Hannah Abbott',
    customerEmail: 'h.abbott@ukmail.co.uk',
    destination: { address: '77 North Michigan Ave', city: 'Chicago', state: 'IL', postalCode: '60601' },
    orderDate: '2026-09-14',
    deliveryDueDate: '2026-09-17',
    items: [{ sku: 'APX-HK-201', name: 'Precision Barista Kettle', quantity: 1, unitPrice: 119.00 }],
    totalAmount: 119.00,
    courier: 'FedEx Ground',
    trackingNumber: 'FX-6600991283',
    status: 'delivered',
    priority: 'standard',
    deliveredAt: '2026-09-16 14:15',
    paymentStatus: 'paid'
  },
  {
    id: 'ORD-2026-8611',
    customerName: 'Kenji Sato',
    customerEmail: 'kenji.sato@globalventures.jp',
    destination: { address: '2040 Century Park East', city: 'Los Angeles', state: 'CA', postalCode: '90067' },
    orderDate: '2026-09-20',
    deliveryDueDate: '2026-09-22',
    items: [{ sku: 'APX-EL-001', name: 'AcousticPro Headphones', quantity: 2, unitPrice: 189.00 }],
    totalAmount: 378.00,
    courier: 'DHL Express',
    trackingNumber: 'DHL-771829031',
    status: 'delivered',
    priority: 'express',
    deliveredAt: '2026-09-22 09:30',
    paymentStatus: 'paid'
  }
];

export const INITIAL_RETURNS: ProductReturn[] = [
  // November 2026
  {
    id: 'RMA-2026-0511',
    orderId: 'ORD-2026-9045',
    customerName: 'Sophia Lin',
    sku: 'APX-HK-202',
    productName: 'Cast Iron Double-Enamelled Dutch Oven 5.5 Qt',
    quantity: 1,
    returnDate: '2026-11-04',
    reason: 'late_delivery',
    status: 'pending_inspection',
    refundAmount: 139.00,
    refundStatus: 'pending',
    inspectionNotes: 'Customer rejected package due to delayed arrival for event.',
    restockedToInventory: false
  },
  {
    id: 'RMA-2026-0512',
    orderId: 'ORD-2026-9041',
    customerName: 'Marcus Vance',
    sku: 'APX-EL-003',
    productName: 'UltraFast 65W GaN Dual USB-C Charger',
    quantity: 1,
    returnDate: '2026-11-05',
    reason: 'defective',
    status: 'approved',
    refundAmount: 38.00,
    refundStatus: 'processed',
    inspectionNotes: 'Port 2 does not negotiate 65W power delivery. Verified hardware fault.',
    restockedToInventory: false
  },
  {
    id: 'RMA-2026-0513',
    orderId: 'ORD-2026-9043',
    customerName: 'Aria Sterling',
    sku: 'APX-AP-101',
    productName: 'Merino Wool Minimalist Crewneck Sweater (Charcoal)',
    quantity: 1,
    returnDate: '2026-11-03',
    reason: 'wrong_size',
    status: 'restocked',
    refundAmount: 95.00,
    refundStatus: 'store_credit',
    inspectionNotes: 'Unworn with original tags attached. Sanitized and returned to Bin A12.',
    restockedToInventory: true
  },

  // October 2026
  {
    id: 'RMA-2026-0482',
    orderId: 'ORD-2026-8802',
    customerName: 'Robert Vance',
    sku: 'APX-EL-001',
    productName: 'AcousticPro Wireless ANC Headphones',
    quantity: 1,
    returnDate: '2026-10-23',
    reason: 'changed_mind',
    status: 'restocked',
    refundAmount: 189.00,
    refundStatus: 'processed',
    inspectionNotes: 'Box opened, immaculate condition. Restocked to primary inventory.',
    restockedToInventory: true
  },
  {
    id: 'RMA-2026-0483',
    orderId: 'ORD-2026-8803',
    customerName: 'Nadia Thorne',
    sku: 'APX-AP-101',
    productName: 'Merino Wool Minimalist Crewneck Sweater',
    quantity: 1,
    returnDate: '2026-10-28',
    reason: 'not_as_described',
    status: 'scrapped',
    refundAmount: 95.00,
    refundStatus: 'processed',
    inspectionNotes: 'Color shade variance from monitor display. Minor fabric pull detected.',
    restockedToInventory: false
  },

  // September 2026
  {
    id: 'RMA-2026-0410',
    orderId: 'ORD-2026-8610',
    customerName: 'Hannah Abbott',
    sku: 'APX-HK-201',
    productName: 'Precision Barista Electric Gooseneck Kettle',
    quantity: 1,
    returnDate: '2026-09-22',
    reason: 'defective',
    status: 'scrapped',
    refundAmount: 119.00,
    refundStatus: 'processed',
    inspectionNotes: 'Heating base thermistor trip error E03. Scrapped for vendor warranty rebate.',
    restockedToInventory: false
  }
];

export const INITIAL_PAYMENTS: PaymentToComplete[] = [
  // November 2026
  {
    id: 'PAY-2026-1101',
    orderId: 'ORD-2026-9043',
    customerName: 'Aria Sterling',
    customerEmail: 'aria.sterling@designhub.co',
    amount: 275.00,
    amountPaid: 0,
    paymentType: 'net30',
    dueDate: '2026-11-25',
    status: 'pending',
    referenceNotes: 'Corporate PO #DH-88192 - Net 30 corporate billing term.'
  },
  {
    id: 'PAY-2026-1102',
    orderId: 'ORD-2026-9045',
    customerName: 'Sophia Lin',
    customerEmail: 'sophia.lin@gmail.com',
    amount: 139.00,
    amountPaid: 0,
    paymentType: 'cod',
    dueDate: '2026-11-06',
    status: 'pending',
    courierCollected: false,
    referenceNotes: 'Cash-on-Delivery with FedEx driver collection receipt.'
  },
  {
    id: 'PAY-2026-1103',
    orderId: 'ORD-2026-8991',
    customerName: 'OmniTrade Retail Group',
    customerEmail: 'accounts@omnitrade.com',
    amount: 1450.00,
    amountPaid: 500.00,
    paymentType: 'bank_wire',
    dueDate: '2026-11-02', // Overdue
    status: 'partially_paid',
    lastReminderSent: '2026-11-03',
    referenceNotes: 'First tranche of $500 received via ACH. Remaining $950 pending.'
  },
  {
    id: 'PAY-2026-1104',
    orderId: 'ORD-2026-9044',
    customerName: 'Derrick Henderson',
    customerEmail: 'dhenderson44@yahoo.com',
    amount: 143.00,
    amountPaid: 143.00,
    paymentType: 'credit_card_authorized',
    dueDate: '2026-11-04',
    status: 'completed',
    referenceNotes: 'Stripe transaction auth #ch_3M491902 settled.'
  },

  // October 2026
  {
    id: 'PAY-2026-1081',
    orderId: 'ORD-2026-8790',
    customerName: 'Horizon Hospitality LLC',
    customerEmail: 'billing@horizonhospitality.com',
    amount: 2400.00,
    amountPaid: 2400.00,
    paymentType: 'net30',
    dueDate: '2026-10-31',
    status: 'completed',
    referenceNotes: 'Wire transfer WT-99021 confirmed by Treasury.'
  },
  {
    id: 'PAY-2026-1082',
    orderId: 'ORD-2026-8801',
    customerName: 'Claire Beaumont',
    customerEmail: 'cbeaumont@luxuryhome.com',
    amount: 278.00,
    amountPaid: 278.00,
    paymentType: 'credit_card_authorized',
    dueDate: '2026-10-15',
    status: 'completed',
    referenceNotes: 'Apple Pay transaction settled.'
  },

  // September 2026
  {
    id: 'PAY-2026-0951',
    orderId: 'ORD-2026-8611',
    customerName: 'Kenji Sato',
    customerEmail: 'kenji.sato@globalventures.jp',
    amount: 378.00,
    amountPaid: 378.00,
    paymentType: 'credit_card_authorized',
    dueDate: '2026-09-22',
    status: 'completed',
    referenceNotes: 'International Visa transaction cleared.'
  }
];

export const INITIAL_AUDIT_LOGS: InventoryAuditLog[] = [
  {
    id: 'LOG-001',
    sku: 'APX-AP-101',
    productName: 'Merino Wool Minimalist Crewneck Sweater',
    timestamp: '2026-11-03 16:40',
    change: +1,
    reason: 'return_restock',
    previousStock: 17,
    newStock: 18
  },
  {
    id: 'LOG-002',
    sku: 'APX-EL-003',
    productName: 'UltraFast 65W GaN Dual USB-C Charger',
    timestamp: '2026-11-01 09:15',
    change: +100,
    reason: 'restock',
    previousStock: 42,
    newStock: 142
  },
  {
    id: 'LOG-003',
    sku: 'APX-SP-402',
    productName: 'Ultralight Ripstop Trail Daypack 24L',
    timestamp: '2026-11-02 11:20',
    change: -1,
    reason: 'sale_fulfillment',
    previousStock: 6,
    newStock: 5
  }
];
