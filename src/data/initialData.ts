import {
  Company,
  CompanyUser,
  Warehouse,
  Item,
  BillOfMaterials,
  Customer,
  Supplier,
  SalesOrder,
  PurchaseOrder,
  GoodsReceiptNote,
  WorkOrder,
  ProductionEntry,
  QualityInspection,
  StockTransaction,
  Invoice,
  Payment,
  ChartOfAccount,
  DeliveryChallan,
  Quotation
} from '../types/erp';

export const INITIAL_COMPANIES: Company[] = [
  {
    id: 'comp-apex-01',
    name: 'Apex Precision Auto Components Ltd.',
    code: 'APAC',
    gstin: '27AAACA1234A1Z5',
    pan: 'AAACA1234A',
    address: 'Plot A-14, Phase II, Chakan MIDC, Khed',
    city: 'Pune',
    state: 'Maharashtra',
    stateCode: '27',
    pincode: '410501',
    phone: '+91 2135 667800',
    email: 'info@apexprecision.in',
    currency: 'INR',
    industry: 'CNC Machining & Automotive Powertrain Components'
  },
  {
    id: 'comp-chakan-02',
    name: 'Chakan Sheet Metal & Fabrication Works',
    code: 'CSMF',
    gstin: '27AABCS9876C1Z2',
    pan: 'AABCS9876C',
    address: 'Sector 10, PCMC Industrial Area, Bhosari',
    city: 'Pune',
    state: 'Maharashtra',
    stateCode: '27',
    pincode: '411026',
    phone: '+91 20 2712 3456',
    email: 'operations@chakansheetmetal.com',
    currency: 'INR',
    industry: 'Sheet Metal Pressing, Laser Cutting & Robotic Welding'
  }
];

export const INITIAL_USERS: CompanyUser[] = [
  {
    id: 'usr-01',
    companyId: 'comp-apex-01',
    name: 'Rajesh Kulkarni',
    email: 'rajesh.k@apexprecision.in',
    role: 'owner',
    department: 'Management',
    isActive: true
  },
  {
    id: 'usr-02',
    companyId: 'comp-apex-01',
    name: 'Anil Deshmukh',
    email: 'anil.d@apexprecision.in',
    role: 'production_manager',
    department: 'Manufacturing',
    isActive: true
  },
  {
    id: 'usr-03',
    companyId: 'comp-apex-01',
    name: 'Sunil Shinde',
    email: 'sunil.s@apexprecision.in',
    role: 'storekeeper',
    department: 'Stores & Inventory',
    isActive: true
  },
  {
    id: 'usr-04',
    companyId: 'comp-apex-01',
    name: 'Pooja Joshi',
    email: 'pooja.j@apexprecision.in',
    role: 'qc_inspector',
    department: 'Quality Assurance',
    isActive: true
  },
  {
    id: 'usr-05',
    companyId: 'comp-apex-01',
    name: 'Vikram Jadhav',
    email: 'vikram.j@apexprecision.in',
    role: 'worker',
    department: 'Shop Floor - CNC Cell 1',
    isActive: true
  },
  {
    id: 'usr-06',
    companyId: 'comp-apex-01',
    name: 'Sneha Patil',
    email: 'sneha.p@apexprecision.in',
    role: 'accountant',
    department: 'Accounts & GST',
    isActive: true
  }
];

export const INITIAL_WAREHOUSES: Warehouse[] = [
  {
    id: 'wh-rms-01',
    companyId: 'comp-apex-01',
    code: 'RMS-01',
    name: 'Raw Materials Main Store',
    warehouseType: 'raw_materials',
    location: 'Bay A, Gate 2, Chakan Unit'
  },
  {
    id: 'wh-wip-01',
    companyId: 'comp-apex-01',
    code: 'WIP-SHOP-01',
    name: 'Shop-Floor In-Process Buffer',
    warehouseType: 'wip_floor',
    location: 'CNC Cell Line 1 & Line 2'
  },
  {
    id: 'wh-fgw-01',
    companyId: 'comp-apex-01',
    code: 'FGW-01',
    name: 'Finished Goods Dispatch Bay',
    warehouseType: 'finished_goods',
    location: 'Warehouse Dock 4'
  },
  {
    id: 'wh-qr-01',
    companyId: 'comp-apex-01',
    code: 'QR-01',
    name: 'QC Hold & Rejection Quarantine',
    warehouseType: 'scrap_quarantine',
    location: 'Quality Lab Cage'
  }
];

export const INITIAL_ITEMS: Item[] = [
  // Raw Materials
  {
    id: 'itm-rm-01',
    companyId: 'comp-apex-01',
    itemCode: 'RM-EN8-ROD-25',
    name: 'EN8 Carbon Steel Round Bar Dia 25mm',
    description: 'Medium carbon steel bar for shaft machining, normalized condition',
    category: 'raw_material',
    uom: 'kg',
    hsnSacCode: '7228',
    gstRate: 18.0,
    standardCost: 85.00,
    sellingPrice: 0,
    reorderLevel: 250,
    reorderQuantity: 1000,
    currentStock: 1450,
    allocatedStock: 350,
    warehouseId: 'wh-rms-01'
  },
  {
    id: 'itm-rm-02',
    companyId: 'comp-apex-01',
    itemCode: 'RM-SS304-HEX-17',
    name: 'SS304 Stainless Steel Hex Bar 17mm A/F',
    description: 'Cold finished stainless hex rod for hydraulic adaptors',
    category: 'raw_material',
    uom: 'kg',
    hsnSacCode: '7222',
    gstRate: 18.0,
    standardCost: 260.00,
    sellingPrice: 0,
    reorderLevel: 150,
    reorderQuantity: 500,
    currentStock: 120, // Low stock trigger!
    allocatedStock: 80,
    warehouseId: 'wh-rms-01'
  },
  {
    id: 'itm-rm-03',
    companyId: 'comp-apex-01',
    itemCode: 'CS-FAST-M8X25',
    name: 'M8 x 25mm High Tensile Hex Flange Bolts',
    description: 'Grade 10.9 Geomet coated fasteners for sub-assembly',
    category: 'raw_material',
    uom: 'nos',
    hsnSacCode: '7318',
    gstRate: 18.0,
    standardCost: 6.50,
    sellingPrice: 0,
    reorderLevel: 1000,
    reorderQuantity: 5000,
    currentStock: 4200,
    allocatedStock: 800,
    warehouseId: 'wh-rms-01'
  },

  // WIP Items
  {
    id: 'itm-wip-01',
    companyId: 'comp-apex-01',
    itemCode: 'WIP-SFT-TRN-01',
    name: 'Turned Shaft Blank (Rough CNC Turn)',
    description: 'Semi-finished shaft turned on CNC lathe, awaiting spline milling',
    category: 'wip',
    uom: 'nos',
    hsnSacCode: '8483',
    gstRate: 18.0,
    standardCost: 195.00,
    sellingPrice: 0,
    reorderLevel: 50,
    reorderQuantity: 200,
    currentStock: 180,
    allocatedStock: 0,
    warehouseId: 'wh-wip-01'
  },

  // Finished Goods
  {
    id: 'itm-fg-01',
    companyId: 'comp-apex-01',
    itemCode: 'FG-TRN-SFT-104',
    name: 'Automotive Transmission Gear Shaft (Splined)',
    description: 'Precision induction-hardened splined shaft for commercial gearboxes',
    category: 'finished_goods',
    uom: 'nos',
    hsnSacCode: '8483',
    gstRate: 18.0,
    standardCost: 480.00,
    sellingPrice: 780.00,
    reorderLevel: 100,
    reorderQuantity: 400,
    currentStock: 320,
    allocatedStock: 250,
    warehouseId: 'wh-fgw-01'
  },
  {
    id: 'itm-fg-02',
    companyId: 'comp-apex-01',
    itemCode: 'FG-HYD-ADPT-08',
    name: 'High Pressure Hydraulic Swivel Adaptor M16',
    description: 'Electroless nickel-plated hydraulic fitting with Viton O-ring',
    category: 'finished_goods',
    uom: 'nos',
    hsnSacCode: '7307',
    gstRate: 18.0,
    standardCost: 310.00,
    sellingPrice: 520.00,
    reorderLevel: 80,
    reorderQuantity: 300,
    currentStock: 65, // Below reorder level!
    allocatedStock: 50,
    warehouseId: 'wh-fgw-01'
  }
];

export const INITIAL_BOMS: BillOfMaterials[] = [
  {
    id: 'bom-01',
    companyId: 'comp-apex-01',
    productId: 'itm-fg-01',
    productName: 'Automotive Transmission Gear Shaft (Splined)',
    productCode: 'FG-TRN-SFT-104',
    bomNumber: 'BOM-SFT-104',
    revision: 'Rev 1.2',
    description: 'Standard 6-spline induction-hardened shaft production BOM',
    outputQuantity: 1,
    isActive: true,
    approvedBy: 'Anil Deshmukh (Production Head)',
    createdAt: '2026-01-15',
    items: [
      {
        id: 'bom-item-01',
        bomId: 'bom-01',
        itemId: 'itm-rm-01',
        itemName: 'EN8 Carbon Steel Round Bar Dia 25mm',
        itemCode: 'RM-EN8-ROD-25',
        quantityRequired: 1.85, // 1.85 kg per shaft
        uom: 'kg',
        scrapPercentage: 4.5,
        operationStation: 'CNC Turning Lathe 01',
        notes: 'Include 12mm parting-off allowance'
      },
      {
        id: 'bom-item-02',
        bomId: 'bom-01',
        itemId: 'itm-rm-03',
        itemName: 'M8 x 25mm High Tensile Hex Flange Bolts',
        itemCode: 'CS-FAST-M8X25',
        quantityRequired: 2,
        uom: 'nos',
        scrapPercentage: 0,
        operationStation: 'Sub-Assembly & Torque Station',
        notes: 'Torque to 28 Nm ± 2'
      }
    ]
  },
  {
    id: 'bom-02',
    companyId: 'comp-apex-01',
    productId: 'itm-fg-02',
    productName: 'High Pressure Hydraulic Swivel Adaptor M16',
    productCode: 'FG-HYD-ADPT-08',
    bomNumber: 'BOM-ADPT-08',
    revision: 'Rev 1.0',
    description: 'Stainless 304 machined body with Viton seal cavity',
    outputQuantity: 1,
    isActive: true,
    approvedBy: 'Anil Deshmukh (Production Head)',
    createdAt: '2026-02-01',
    items: [
      {
        id: 'bom-item-03',
        bomId: 'bom-02',
        itemId: 'itm-rm-02',
        itemName: 'SS304 Stainless Steel Hex Bar 17mm A/F',
        itemCode: 'RM-SS304-HEX-17',
        quantityRequired: 0.65, // 0.65 kg per adaptor
        uom: 'kg',
        scrapPercentage: 6.0,
        operationStation: 'Swiss-Type Sliding Headstock CNC',
        notes: 'Coolant oil filtration mandatory'
      }
    ]
  }
];

export const INITIAL_CUSTOMERS: Customer[] = [
  {
    id: 'cust-01',
    companyId: 'comp-apex-01',
    customerCode: 'CUST-TATA-01',
    name: 'Tata Motors Limited - CVBU Pune',
    contactPerson: 'Sanjay Shrivastav (VP SCM)',
    email: 'sanjay.s@tatamotors.com',
    phone: '+91 20 6613 1111',
    gstin: '27AAACT2727Q1ZT',
    pan: 'AAACT2727Q',
    billingAddress: 'Commercial Vehicle Business Unit, Sector 15, Pimpri, Pune 411018',
    shippingAddress: 'Plant Gate 3, CVBU Assembly Line 2, Pimpri, Pune 411018',
    creditLimit: 5000000,
    creditDays: 45,
    outstandingBalance: 1245000
  },
  {
    id: 'cust-02',
    companyId: 'comp-apex-01',
    customerCode: 'CUST-MAH-02',
    name: 'Mahindra & Mahindra Ltd. (Auto Sector)',
    contactPerson: 'Mahesh Gaikwad (Vendor Dev)',
    email: 'gaikwad.mahesh@mahindra.com',
    phone: '+91 2135 664000',
    gstin: '27AAACM1587P1ZQ',
    pan: 'AAACM1587P',
    billingAddress: 'Gateway Building, Apollo Bunder, Mumbai 400001',
    shippingAddress: 'Chakan Plant 1, Plot A-1, Phase II Chakan MIDC, Pune 410501',
    creditLimit: 4000000,
    creditDays: 60,
    outstandingBalance: 820000
  },
  {
    id: 'cust-03',
    companyId: 'comp-apex-01',
    customerCode: 'CUST-BAJAJ-03',
    name: 'Bajaj Auto Limited (Akurdi)',
    contactPerson: 'Prashant Nair (Purchase)',
    email: 'pnair@bajajauto.co.in',
    phone: '+91 20 2747 2851',
    gstin: '27AAACB0505J1Z3',
    pan: 'AAACB0505J',
    billingAddress: 'Mumbai-Pune Road, Akurdi, Pune 411035',
    shippingAddress: 'Stores Inward Bay 1, Waluj / Chakan Plant',
    creditLimit: 3000000,
    creditDays: 45,
    outstandingBalance: 460000
  }
];

export const INITIAL_SUPPLIERS: Supplier[] = [
  {
    id: 'supp-01',
    companyId: 'comp-apex-01',
    supplierCode: 'SUPP-JINDAL-01',
    name: 'Jindal Steel & Power Ltd. (Western Depot)',
    contactPerson: 'Karan Mehra',
    email: 'karan.m@jindalsteel.com',
    phone: '+91 22 6123 4500',
    gstin: '27AAACJ2288M1ZL',
    address: 'Steel Stockyard, Kalamboli, Navi Mumbai 410218',
    paymentTerms: '30 Days Net',
    rating: 4.8,
    outstandingPayable: 425000
  },
  {
    id: 'supp-02',
    companyId: 'comp-apex-01',
    supplierCode: 'SUPP-CHAKAN-FAST',
    name: 'Chakan Precision Fasteners Pvt Ltd',
    contactPerson: 'Dinesh Pawar',
    email: 'sales@chakanfasteners.com',
    phone: '+91 2135 258900',
    gstin: '27AABCC3344K1ZF',
    address: 'Gat No 312, Mahalunge, Chakan, Pune 410501',
    paymentTerms: '15 Days Net',
    rating: 4.6,
    outstandingPayable: 68000
  },
  {
    id: 'supp-03',
    companyId: 'comp-apex-01',
    supplierCode: 'SUPP-MAH-METALS',
    name: 'Maharashtra Bright Bar & Special Steels',
    contactPerson: 'Sachin Oswal',
    email: 'sachin@mahbrightbar.com',
    phone: '+91 20 2748 9911',
    gstin: '27AABFM4455H1ZP',
    address: 'Plot 78, General Block, MIDC Bhosari, Pune 411026',
    paymentTerms: '45 Days Net',
    rating: 4.5,
    outstandingPayable: 180000
  }
];

export const INITIAL_SALES_ORDERS: SalesOrder[] = [
  {
    id: 'so-01',
    companyId: 'comp-apex-01',
    soNumber: 'SO-2026-00042',
    customerId: 'cust-01',
    customerName: 'Tata Motors Limited - CVBU Pune',
    customerPoNumber: 'TML/CVBU/PO/9921',
    orderDate: '2026-11-01',
    deliveryDate: '2026-11-15',
    status: 'in_production',
    subtotal: 195000,
    cgstAmount: 17550,
    sgstAmount: 17550,
    igstAmount: 0,
    grandTotal: 230100,
    createdBy: 'Rajesh Kulkarni',
    notes: 'Urgent production lot for Tata Prima heavy haulage line',
    items: [
      {
        id: 'so-item-01',
        itemId: 'itm-fg-01',
        itemCode: 'FG-TRN-SFT-104',
        itemName: 'Automotive Transmission Gear Shaft (Splined)',
        quantity: 250,
        unitPrice: 780,
        gstRate: 18,
        taxAmount: 35100,
        totalAmount: 230100,
        shippedQuantity: 0
      }
    ]
  },
  {
    id: 'so-02',
    companyId: 'comp-apex-01',
    soNumber: 'SO-2026-00043',
    customerId: 'cust-02',
    customerName: 'Mahindra & Mahindra Ltd. (Auto Sector)',
    customerPoNumber: 'M&M/CHK/2026/883',
    orderDate: '2026-11-03',
    deliveryDate: '2026-11-20',
    status: 'confirmed',
    subtotal: 104000,
    cgstAmount: 9360,
    sgstAmount: 9360,
    igstAmount: 0,
    grandTotal: 122720,
    createdBy: 'Rajesh Kulkarni',
    notes: 'Standard quality packaging with VCI anti-rust paper',
    items: [
      {
        id: 'so-item-02',
        itemId: 'itm-fg-02',
        itemCode: 'FG-HYD-ADPT-08',
        itemName: 'High Pressure Hydraulic Swivel Adaptor M16',
        quantity: 200,
        unitPrice: 520,
        gstRate: 18,
        taxAmount: 18720,
        totalAmount: 122720,
        shippedQuantity: 0
      }
    ]
  }
];

export const INITIAL_PURCHASE_ORDERS: PurchaseOrder[] = [
  {
    id: 'po-01',
    companyId: 'comp-apex-01',
    poNumber: 'PO-2026-00088',
    supplierId: 'supp-01',
    supplierName: 'Jindal Steel & Power Ltd. (Western Depot)',
    orderDate: '2026-10-25',
    expectedDate: '2026-11-05',
    status: 'partially_received',
    subtotal: 85000,
    cgstAmount: 7650,
    sgstAmount: 7650,
    igstAmount: 0,
    grandTotal: 100300,
    notes: 'Test certificate EN 10204 3.1 required with delivery',
    items: [
      {
        id: 'po-item-01',
        itemId: 'itm-rm-01',
        itemCode: 'RM-EN8-ROD-25',
        itemName: 'EN8 Carbon Steel Round Bar Dia 25mm',
        quantity: 1000,
        unitPrice: 85,
        gstRate: 18,
        taxAmount: 15300,
        totalAmount: 100300,
        receivedQuantity: 650
      }
    ]
  },
  {
    id: 'po-02',
    companyId: 'comp-apex-01',
    poNumber: 'PO-2026-00089',
    supplierId: 'supp-02',
    supplierName: 'Chakan Precision Fasteners Pvt Ltd',
    orderDate: '2026-11-02',
    expectedDate: '2026-11-09',
    status: 'ordered',
    subtotal: 16250,
    cgstAmount: 1462.5,
    sgstAmount: 1462.5,
    igstAmount: 0,
    grandTotal: 19175,
    notes: 'Hydrogen embrittlement relief bake certificate needed',
    items: [
      {
        id: 'po-item-02',
        itemId: 'itm-rm-03',
        itemCode: 'CS-FAST-M8X25',
        itemName: 'M8 x 25mm High Tensile Hex Flange Bolts',
        quantity: 2500,
        unitPrice: 6.50,
        gstRate: 18,
        taxAmount: 2925,
        totalAmount: 19175,
        receivedQuantity: 0
      }
    ]
  }
];

export const INITIAL_GRNS: GoodsReceiptNote[] = [
  {
    id: 'grn-01',
    companyId: 'comp-apex-01',
    grnNumber: 'GRN-2026-00031',
    purchaseOrderId: 'po-01',
    poNumber: 'PO-2026-00088',
    supplierId: 'supp-01',
    supplierName: 'Jindal Steel & Power Ltd.',
    warehouseId: 'wh-rms-01',
    warehouseName: 'Raw Materials Main Store',
    receiptDate: '2026-11-04',
    supplierInvoiceNo: 'JSPL/INV/44120',
    qcStatus: 'inspected_passed',
    notes: 'Received 650 kg out of 1000 kg order, chemical spectro test verified',
    items: [
      {
        itemId: 'itm-rm-01',
        itemCode: 'RM-EN8-ROD-25',
        itemName: 'EN8 Carbon Steel Round Bar Dia 25mm',
        receivedQuantity: 650,
        acceptedQuantity: 650,
        rejectedQuantity: 0,
        batchNumber: 'HEAT-EN8-8832'
      }
    ]
  }
];

export const INITIAL_WORK_ORDERS: WorkOrder[] = [
  {
    id: 'wo-01',
    companyId: 'comp-apex-01',
    woNumber: 'WO-2026-00015',
    salesOrderId: 'so-01',
    soNumber: 'SO-2026-00042',
    productId: 'itm-fg-01',
    productCode: 'FG-TRN-SFT-104',
    productName: 'Automotive Transmission Gear Shaft (Splined)',
    bomId: 'bom-01',
    bomRevision: 'Rev 1.2',
    plannedQuantity: 250,
    producedQuantity: 180,
    rejectedQuantity: 4,
    reworkQuantity: 2,
    status: 'in_progress',
    priority: 'urgent',
    assignedSupervisor: 'Anil Deshmukh',
    assignedWorker: 'Vikram Jadhav',
    startDate: '2026-11-05',
    dueDate: '2026-11-12',
    notes: 'Strict runout limit < 15 microns after heat treatment'
  },
  {
    id: 'wo-02',
    companyId: 'comp-apex-01',
    woNumber: 'WO-2026-00016',
    salesOrderId: 'so-02',
    soNumber: 'SO-2026-00043',
    productId: 'itm-fg-02',
    productCode: 'FG-HYD-ADPT-08',
    productName: 'High Pressure Hydraulic Swivel Adaptor M16',
    bomId: 'bom-02',
    bomRevision: 'Rev 1.0',
    plannedQuantity: 200,
    producedQuantity: 0,
    rejectedQuantity: 0,
    reworkQuantity: 0,
    status: 'scheduled',
    priority: 'normal',
    assignedSupervisor: 'Anil Deshmukh',
    assignedWorker: 'Suresh More',
    startDate: '2026-11-10',
    dueDate: '2026-11-18',
    notes: 'Pending raw material bar stock arrival'
  }
];

export const INITIAL_PRODUCTION_ENTRIES: ProductionEntry[] = [
  {
    id: 'pe-01',
    companyId: 'comp-apex-01',
    workOrderId: 'wo-01',
    woNumber: 'WO-2026-00015',
    operatorName: 'Vikram Jadhav',
    operationStation: 'CNC Turning Lathe 01',
    timestamp: '2026-11-07 14:30',
    goodQuantity: 100,
    rejectedQuantity: 2,
    reworkQuantity: 1,
    rejectionReason: 'Tool insert chipped leading to oversize outer diameter',
    notes: 'Insert changed to Sandvik WNMG 080408'
  },
  {
    id: 'pe-02',
    companyId: 'comp-apex-01',
    workOrderId: 'wo-01',
    woNumber: 'WO-2026-00015',
    operatorName: 'Vikram Jadhav',
    operationStation: 'CNC Spline Milling Station 02',
    timestamp: '2026-11-07 18:15',
    goodQuantity: 80,
    rejectedQuantity: 2,
    reworkQuantity: 1,
    rejectionReason: 'Burr on lead chamfer requiring deburring touch-up',
    notes: 'Sent 1 part to rework bench'
  }
];

export const INITIAL_QC_INSPECTIONS: QualityInspection[] = [
  {
    id: 'qc-01',
    companyId: 'comp-apex-01',
    inspectionNumber: 'QC-2026-00054',
    referenceType: 'work_order',
    referenceId: 'wo-01',
    referenceNumber: 'WO-2026-00015',
    itemId: 'itm-fg-01',
    itemName: 'Automotive Transmission Gear Shaft (Splined)',
    inspectorName: 'Pooja Joshi',
    inspectionDate: '2026-11-07',
    sampleSize: 15,
    status: 'passed',
    defectsFound: 0,
    rootCauseAnalysis: 'All parameters conform to customer drawing Rev E',
    correctiveAction: 'Authorized for finished goods stock transfer',
    checkpoints: [
      {
        parameterName: 'Outer Bearing Diameter (OD)',
        specification: '25.000 mm',
        tolerance: '+0.015 / -0.005 mm',
        observedValue: '25.008 mm',
        result: 'pass'
      },
      {
        parameterName: 'Spline Pitch Circle Diameter (PCD)',
        specification: '32.50 mm',
        tolerance: '± 0.02 mm',
        observedValue: '32.51 mm',
        result: 'pass'
      },
      {
        parameterName: 'Surface Roughness Ra',
        specification: '0.80 µm',
        tolerance: 'Max 0.80 µm',
        observedValue: '0.62 µm',
        result: 'pass'
      },
      {
        parameterName: 'Induction Hardness',
        specification: '52 - 56 HRC',
        tolerance: '± 2 HRC',
        observedValue: '54 HRC',
        result: 'pass'
      }
    ]
  }
];

export const INITIAL_STOCK_TRANSACTIONS: StockTransaction[] = [
  {
    id: 'st-01',
    companyId: 'comp-apex-01',
    transactionNumber: 'ST-2026-00101',
    itemId: 'itm-rm-01',
    itemCode: 'RM-EN8-ROD-25',
    itemName: 'EN8 Carbon Steel Round Bar Dia 25mm',
    warehouseId: 'wh-rms-01',
    warehouseName: 'Raw Materials Main Store',
    transactionType: 'receipt_grn',
    quantity: 650,
    unitCost: 85,
    runningBalance: 1450,
    batchNumber: 'HEAT-EN8-8832',
    referenceType: 'grn',
    referenceNumber: 'GRN-2026-00031',
    notes: 'Inward receipt against PO-2026-00088 from Jindal Steel',
    createdBy: 'Sunil Shinde',
    createdAt: '2026-11-04 11:20'
  },
  {
    id: 'st-02',
    companyId: 'comp-apex-01',
    transactionNumber: 'ST-2026-00102',
    itemId: 'itm-rm-01',
    itemCode: 'RM-EN8-ROD-25',
    itemName: 'EN8 Carbon Steel Round Bar Dia 25mm',
    warehouseId: 'wh-wip-01',
    warehouseName: 'Shop-Floor In-Process Buffer',
    transactionType: 'issue_production',
    quantity: -462.5, // 250 planned * 1.85 kg
    unitCost: 85,
    runningBalance: 987.5,
    referenceType: 'work_order',
    referenceNumber: 'WO-2026-00015',
    notes: 'Material issued to CNC Cell 1 for Work Order 15',
    createdBy: 'Sunil Shinde',
    createdAt: '2026-11-05 08:30'
  },
  {
    id: 'st-03',
    companyId: 'comp-apex-01',
    transactionNumber: 'ST-2026-00103',
    itemId: 'itm-fg-01',
    itemCode: 'FG-TRN-SFT-104',
    itemName: 'Automotive Transmission Gear Shaft (Splined)',
    warehouseId: 'wh-fgw-01',
    warehouseName: 'Finished Goods Dispatch Bay',
    transactionType: 'production_finish',
    quantity: 180,
    unitCost: 480,
    runningBalance: 320,
    referenceType: 'work_order',
    referenceNumber: 'WO-2026-00015',
    notes: 'Transfer from QC passed inspection lot #54',
    createdBy: 'Pooja Joshi',
    createdAt: '2026-11-07 18:45'
  }
];

export const INITIAL_INVOICES: Invoice[] = [
  {
    id: 'inv-01',
    companyId: 'comp-apex-01',
    invoiceNumber: 'INV-2026-00088',
    invoiceType: 'sales_tax_invoice',
    partnerType: 'customer',
    partnerId: 'cust-01',
    partnerName: 'Tata Motors Limited - CVBU Pune',
    partnerGstin: '27AAACT2727Q1ZT',
    orderNumber: 'SO-2026-00038',
    invoiceDate: '2026-10-28',
    dueDate: '2026-12-12',
    status: 'unpaid',
    subtotal: 390000,
    cgstAmount: 35100,
    sgstAmount: 35100,
    igstAmount: 0,
    totalAmount: 460200,
    paidAmount: 0,
    gstIrn: '98d3c11f45778844ba9c8789312384a1e7b233a4112344dd99881122334455aa',
    gstAckNumber: '112610283344991',
    items: [
      {
        itemId: 'itm-fg-01',
        itemName: 'Automotive Transmission Gear Shaft (Splined)',
        hsnSac: '8483',
        quantity: 500,
        unitPrice: 780,
        gstRate: 18,
        taxAmount: 70200,
        totalAmount: 460200
      }
    ]
  }
];

export const INITIAL_PAYMENTS: Payment[] = [
  {
    id: 'pay-01',
    companyId: 'comp-apex-01',
    paymentNumber: 'PAY-2026-00022',
    paymentType: 'customer_receipt',
    partnerId: 'cust-01',
    partnerName: 'Tata Motors Limited - CVBU Pune',
    invoiceId: 'inv-01',
    invoiceNumber: 'INV-2026-00088',
    paymentDate: '2026-11-02',
    amount: 150000,
    paymentMode: 'bank_transfer_neft_rtgs',
    referenceNumber: 'HDFC26110299881',
    status: 'completed'
  }
];

export const INITIAL_DELIVERY_CHALLANS: DeliveryChallan[] = [
  {
    id: 'dc-01',
    companyId: 'comp-apex-01',
    challanNumber: 'DC-2026-00019',
    salesOrderId: 'so-01',
    soNumber: 'SO-2026-00042',
    customerId: 'cust-01',
    customerName: 'Tata Motors Limited - CVBU Pune',
    dispatchDate: '2026-11-06',
    transporterName: 'VRL Logistics Logistics Ltd.',
    vehicleNumber: 'MH 12 RN 8845',
    eWayBillNumber: '241188339901',
    status: 'dispatched',
    items: [
      {
        itemId: 'itm-fg-01',
        itemName: 'Automotive Transmission Gear Shaft (Splined)',
        itemCode: 'FG-TRN-SFT-104',
        quantity: 150,
        uom: 'nos'
      }
    ]
  }
];

export const INITIAL_CHART_OF_ACCOUNTS: ChartOfAccount[] = [
  { id: 'coa-01', companyId: 'comp-apex-01', accountCode: '1010', accountName: 'State Bank of India - Current A/c', accountType: 'asset', balance: 3450000 },
  { id: 'coa-02', companyId: 'comp-apex-01', accountCode: '1020', accountName: 'HDFC Bank - Working Capital CC', accountType: 'asset', balance: 1280000 },
  { id: 'coa-03', companyId: 'comp-apex-01', accountCode: '1030', accountName: 'Trade Receivables (Sundry Debtors)', accountType: 'asset', balance: 2525000 },
  { id: 'coa-04', companyId: 'comp-apex-01', accountCode: '1040', accountName: 'Inventory (Raw Materials & FG)', accountType: 'asset', balance: 1845000 },
  { id: 'coa-05', companyId: 'comp-apex-01', accountCode: '2010', accountName: 'Trade Payables (Sundry Creditors)', accountType: 'liability', balance: 673000 },
  { id: 'coa-06', companyId: 'comp-apex-01', accountCode: '2020', accountName: 'GST Output Liability (CGST + SGST)', accountType: 'liability', balance: 142000 },
  { id: 'coa-07', companyId: 'comp-apex-01', accountCode: '3010', accountName: 'Sales Revenue - Finished Components', accountType: 'revenue', balance: 18450000 },
  { id: 'coa-08', companyId: 'comp-apex-01', accountCode: '4010', accountName: 'Direct Raw Material Consumption', accountType: 'expense', balance: 8940000 },
  { id: 'coa-09', companyId: 'comp-apex-01', accountCode: '4020', accountName: 'Power & Fuel (MSEDCL High Tension)', accountType: 'expense', balance: 680000 },
  { id: 'coa-10', companyId: 'comp-apex-01', accountCode: '4030', accountName: 'Tooling & Consumables', accountType: 'expense', balance: 410000 }
];
