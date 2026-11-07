import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  Company,
  CompanyUser,
  Item,
  Warehouse,
  Customer,
  Supplier,
  BillOfMaterials,
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
  ERPRole,
  MRPRequirement,
  AuditLog
} from '../types/erp';
import {
  INITIAL_COMPANIES,
  INITIAL_USERS,
  INITIAL_WAREHOUSES,
  INITIAL_ITEMS,
  INITIAL_BOMS,
  INITIAL_CUSTOMERS,
  INITIAL_SUPPLIERS,
  INITIAL_SALES_ORDERS,
  INITIAL_PURCHASE_ORDERS,
  INITIAL_GRNS,
  INITIAL_WORK_ORDERS,
  INITIAL_PRODUCTION_ENTRIES,
  INITIAL_QC_INSPECTIONS,
  INITIAL_STOCK_TRANSACTIONS,
  INITIAL_INVOICES,
  INITIAL_PAYMENTS,
  INITIAL_DELIVERY_CHALLANS,
  INITIAL_CHART_OF_ACCOUNTS
} from '../data/initialData';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

interface ERPContextType {
  // Tenancy & RBAC
  companies: Company[];
  activeCompany: Company;
  setActiveCompanyId: (id: string) => void;
  currentUser: CompanyUser;
  currentRole: ERPRole;
  setCurrentRole: (role: ERPRole) => void;
  canAccess: (module: string) => boolean;

  // Master Data
  items: Item[];
  warehouses: Warehouse[];
  customers: Customer[];
  suppliers: Supplier[];
  boms: BillOfMaterials[];

  // Transactional Data
  salesOrders: SalesOrder[];
  purchaseOrders: PurchaseOrder[];
  grns: GoodsReceiptNote[];
  workOrders: WorkOrder[];
  productionEntries: ProductionEntry[];
  qualityInspections: QualityInspection[];
  stockTransactions: StockTransaction[];
  invoices: Invoice[];
  payments: Payment[];
  deliveryChallans: DeliveryChallan[];
  chartOfAccounts: ChartOfAccount[];
  auditLogs: AuditLog[];

  // Business Action Methods
  createSalesOrder: (so: Omit<SalesOrder, 'id' | 'soNumber' | 'companyId' | 'status' | 'cgstAmount' | 'sgstAmount' | 'igstAmount' | 'grandTotal' | 'createdBy'>) => SalesOrder;
  updateSalesOrderStatus: (id: string, status: SalesOrder['status']) => void;
  createDeliveryChallan: (salesOrderId: string, transporter: string, vehicleNo: string, eWayBill: string) => DeliveryChallan;
  createSalesInvoiceFromOrder: (salesOrderId: string) => Invoice;

  createPurchaseOrder: (po: Omit<PurchaseOrder, 'id' | 'poNumber' | 'companyId' | 'status' | 'cgstAmount' | 'sgstAmount' | 'igstAmount' | 'grandTotal'>) => PurchaseOrder;
  createGRN: (poId: string, supplierInvoiceNo: string, warehouseId: string, items: { itemId: string; receivedQty: number; batchNo: string }[]) => GoodsReceiptNote;
  
  createWorkOrder: (productId: string, bomId: string, quantity: number, priority: 'low' | 'normal' | 'urgent', dueDate: string, salesOrderId?: string) => WorkOrder;
  startWorkOrder: (workOrderId: string) => { success: boolean; message: string };
  recordProductionOutput: (workOrderId: string, station: string, goodQty: number, rejectedQty: number, reworkQty: number, rejectionReason?: string) => void;
  
  createQualityInspection: (refType: 'work_order' | 'grn', refId: string, itemId: string, status: 'passed' | 'failed' | 'conditional_pass', sampleSize: number, checkpoints: any[], rootCause?: string) => QualityInspection;
  
  adjustStock: (itemId: string, warehouseId: string, quantityChange: number, reason: string) => void;
  recordPayment: (type: 'customer_receipt' | 'supplier_payment', partnerId: string, partnerName: string, amount: number, mode: string, refNo: string, invoiceId?: string) => Payment;
  
  // MRP Engine
  calculateMRP: () => MRPRequirement[];
  generatePOsFromMRP: (shortages: MRPRequirement[]) => number;

  // Supabase State
  isCloudConnected: boolean;
  syncWithSupabase: () => Promise<void>;
  resetToDemoData: () => void;
}

const ERPContext = createContext<ERPContextType | undefined>(undefined);

export const ERPProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Multi-Company State
  const [companies] = useState<Company[]>(INITIAL_COMPANIES);
  const [activeCompanyId, setActiveCompanyId] = useState<string>(() => {
    return localStorage.getItem('ff_active_comp') || 'comp-apex-01';
  });

  const activeCompany = companies.find(c => c.id === activeCompanyId) || companies[0];

  useEffect(() => {
    localStorage.setItem('ff_active_comp', activeCompanyId);
  }, [activeCompanyId]);

  // Current Role & User State
  const [currentRole, setCurrentRole] = useState<ERPRole>('owner');
  const currentUser: CompanyUser = {
    id: 'usr-current',
    companyId: activeCompany.id,
    name: 'Rajesh Kulkarni',
    email: 'rajesh.k@apexprecision.in',
    role: currentRole,
    department: 'Operations',
    isActive: true
  };

  // Main Collections State
  const [items, setItems] = useState<Item[]>(() => {
    const saved = localStorage.getItem(`ff_items_${activeCompanyId}`);
    return saved ? JSON.parse(saved) : INITIAL_ITEMS.filter(i => i.companyId === activeCompanyId);
  });

  const [warehouses] = useState<Warehouse[]>(INITIAL_WAREHOUSES.filter(w => w.companyId === activeCompanyId));
  const [customers, setCustomers] = useState<Customer[]>(INITIAL_CUSTOMERS.filter(c => c.companyId === activeCompanyId));
  const [suppliers] = useState<Supplier[]>(INITIAL_SUPPLIERS.filter(s => s.companyId === activeCompanyId));
  const [boms] = useState<BillOfMaterials[]>(INITIAL_BOMS.filter(b => b.companyId === activeCompanyId));

  const [salesOrders, setSalesOrders] = useState<SalesOrder[]>(() => {
    const saved = localStorage.getItem(`ff_so_${activeCompanyId}`);
    return saved ? JSON.parse(saved) : INITIAL_SALES_ORDERS.filter(s => s.companyId === activeCompanyId);
  });

  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>(() => {
    const saved = localStorage.getItem(`ff_po_${activeCompanyId}`);
    return saved ? JSON.parse(saved) : INITIAL_PURCHASE_ORDERS.filter(p => p.companyId === activeCompanyId);
  });

  const [grns, setGrns] = useState<GoodsReceiptNote[]>(INITIAL_GRNS.filter(g => g.companyId === activeCompanyId));
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>(() => {
    const saved = localStorage.getItem(`ff_wo_${activeCompanyId}`);
    return saved ? JSON.parse(saved) : INITIAL_WORK_ORDERS.filter(w => w.companyId === activeCompanyId);
  });

  const [productionEntries, setProductionEntries] = useState<ProductionEntry[]>(INITIAL_PRODUCTION_ENTRIES.filter(p => p.companyId === activeCompanyId));
  const [qualityInspections, setQualityInspections] = useState<QualityInspection[]>(INITIAL_QC_INSPECTIONS.filter(q => q.companyId === activeCompanyId));
  
  const [stockTransactions, setStockTransactions] = useState<StockTransaction[]>(() => {
    const saved = localStorage.getItem(`ff_stock_trans_${activeCompanyId}`);
    return saved ? JSON.parse(saved) : INITIAL_STOCK_TRANSACTIONS.filter(s => s.companyId === activeCompanyId);
  });

  const [invoices, setInvoices] = useState<Invoice[]>(INITIAL_INVOICES.filter(i => i.companyId === activeCompanyId));
  const [payments, setPayments] = useState<Payment[]>(INITIAL_PAYMENTS.filter(p => p.companyId === activeCompanyId));
  const [deliveryChallans, setDeliveryChallans] = useState<DeliveryChallan[]>(INITIAL_DELIVERY_CHALLANS.filter(d => d.companyId === activeCompanyId));
  const [chartOfAccounts, setChartOfAccounts] = useState<ChartOfAccount[]>(INITIAL_CHART_OF_ACCOUNTS.filter(c => c.companyId === activeCompanyId));
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);

  // Cloud status
  const [isCloudConnected] = useState<boolean>(isSupabaseConfigured);

  // Sync to local storage on change
  useEffect(() => {
    localStorage.setItem(`ff_items_${activeCompanyId}`, JSON.stringify(items));
  }, [items, activeCompanyId]);

  useEffect(() => {
    localStorage.setItem(`ff_so_${activeCompanyId}`, JSON.stringify(salesOrders));
  }, [salesOrders, activeCompanyId]);

  useEffect(() => {
    localStorage.setItem(`ff_po_${activeCompanyId}`, JSON.stringify(purchaseOrders));
  }, [purchaseOrders, activeCompanyId]);

  useEffect(() => {
    localStorage.setItem(`ff_wo_${activeCompanyId}`, JSON.stringify(workOrders));
  }, [workOrders, activeCompanyId]);

  useEffect(() => {
    localStorage.setItem(`ff_stock_trans_${activeCompanyId}`, JSON.stringify(stockTransactions));
  }, [stockTransactions, activeCompanyId]);

  // Document Number Generator Helper
  const getNextNumber = (prefix: string, list: { id: string }[]): string => {
    const year = new Date().getFullYear();
    const count = list.length + 1;
    return `${prefix}-${year}-${String(count).padStart(5, '0')}`;
  };

  const addAuditLog = (action: AuditLog['action'], entityName: string, entityId: string, details: string) => {
    const log: AuditLog = {
      id: `audit-${Date.now()}`,
      companyId: activeCompany.id,
      userName: currentUser.name,
      action,
      entityName,
      entityId,
      details,
      timestamp: new Date().toISOString()
    };
    setAuditLogs(prev => [log, ...prev]);
  };

  // RBAC Permission Check
  const canAccess = (module: string): boolean => {
    if (currentRole === 'owner' || currentRole === 'admin') return true;

    switch (module) {
      case 'dashboard':
        return currentRole !== 'worker';
      case 'sales':
        return ['production_manager', 'accountant', 'viewer'].includes(currentRole);
      case 'purchase':
        return ['purchase_user', 'storekeeper', 'accountant', 'viewer'].includes(currentRole);
      case 'inventory':
        return ['storekeeper', 'production_manager', 'purchase_user', 'supervisor', 'viewer'].includes(currentRole);
      case 'manufacturing':
      case 'shopfloor':
        return ['production_manager', 'supervisor', 'worker', 'qc_inspector', 'viewer'].includes(currentRole);
      case 'quality':
        return ['qc_inspector', 'production_manager', 'supervisor', 'viewer'].includes(currentRole);
      case 'finance':
        return ['accountant', 'viewer'].includes(currentRole);
      case 'reports':
        return currentRole !== 'worker';
      default:
        return true;
    }
  };

  // 1. ORDER-TO-CASH: Create Sales Order
  const createSalesOrder = (soData: Omit<SalesOrder, 'id' | 'soNumber' | 'companyId' | 'status' | 'cgstAmount' | 'sgstAmount' | 'igstAmount' | 'grandTotal' | 'createdBy'>): SalesOrder => {
    const subtotal = soData.items.reduce((acc, itm) => acc + (itm.quantity * itm.unitPrice), 0);
    // Indian GST: standard 18% (9% CGST + 9% SGST for intra-state Maharashtra)
    const cgst = subtotal * 0.09;
    const sgst = subtotal * 0.09;
    const grandTotal = subtotal + cgst + sgst;

    const soNumber = getNextNumber('SO', salesOrders);
    const newSO: SalesOrder = {
      ...soData,
      id: `so-${Date.now()}`,
      companyId: activeCompany.id,
      soNumber,
      status: 'confirmed',
      subtotal,
      cgstAmount: cgst,
      sgstAmount: sgst,
      igstAmount: 0,
      grandTotal,
      createdBy: currentUser.name
    };

    setSalesOrders(prev => [newSO, ...prev]);
    addAuditLog('CREATE', 'SalesOrder', newSO.id, `Created sales order ${soNumber} for ${soData.customerName} amount ₹${grandTotal.toLocaleString('en-IN')}`);

    return newSO;
  };

  const updateSalesOrderStatus = (id: string, status: SalesOrder['status']) => {
    setSalesOrders(prev => prev.map(so => so.id === id ? { ...so, status } : so));
    addAuditLog('STATUS_CHANGE', 'SalesOrder', id, `Updated sales order status to ${status}`);
  };

  // 2. DISPATCH & CHALLAN
  const createDeliveryChallan = (salesOrderId: string, transporter: string, vehicleNo: string, eWayBill: string): DeliveryChallan => {
    const so = salesOrders.find(s => s.id === salesOrderId);
    if (!so) throw new Error('Sales order not found');

    const challanNumber = getNextNumber('DC', deliveryChallans);
    const challanItems = so.items.map(itm => {
      const itmMaster = items.find(i => i.id === itm.itemId);
      return {
        itemId: itm.itemId,
        itemName: itm.itemName,
        itemCode: itm.itemCode,
        quantity: itm.quantity,
        uom: itmMaster?.uom || 'nos'
      };
    });

    const newChallan: DeliveryChallan = {
      id: `dc-${Date.now()}`,
      companyId: activeCompany.id,
      challanNumber,
      salesOrderId: so.id,
      soNumber: so.soNumber,
      customerId: so.customerId,
      customerName: so.customerName,
      dispatchDate: new Date().toISOString().split('T')[0],
      transporterName: transporter,
      vehicleNumber: vehicleNo,
      eWayBillNumber: eWayBill,
      items: challanItems,
      status: 'dispatched'
    };

    setDeliveryChallans(prev => [newChallan, ...prev]);

    // Decrement finished goods inventory via stock transactions
    challanItems.forEach(ci => {
      const itm = items.find(i => i.id === ci.itemId);
      if (itm) {
        const trans: StockTransaction = {
          id: `st-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          companyId: activeCompany.id,
          transactionNumber: getNextNumber('ST', stockTransactions),
          itemId: ci.itemId,
          itemCode: ci.itemCode,
          itemName: ci.itemName,
          warehouseId: itm.warehouseId,
          warehouseName: 'Finished Goods Dispatch Bay',
          transactionType: 'sales_dispatch',
          quantity: -ci.quantity,
          unitCost: itm.standardCost,
          runningBalance: itm.currentStock - ci.quantity,
          referenceType: 'challan',
          referenceNumber: challanNumber,
          notes: `Dispatched on Vehicle ${vehicleNo} to ${so.customerName}`,
          createdBy: currentUser.name,
          createdAt: new Date().toISOString()
        };
        setStockTransactions(prev => [trans, ...prev]);

        // Update item stock
        setItems(prev => prev.map(i => i.id === ci.itemId ? { ...i, currentStock: i.currentStock - ci.quantity } : i));
      }
    });

    // Mark sales order as shipped/completed
    updateSalesOrderStatus(so.id, 'completed');
    addAuditLog('CREATE', 'DeliveryChallan', newChallan.id, `Dispatched Challan ${challanNumber} for ${so.soNumber}`);

    return newChallan;
  };

  // 3. GST TAX INVOICE
  const createSalesInvoiceFromOrder = (salesOrderId: string): Invoice => {
    const so = salesOrders.find(s => s.id === salesOrderId);
    if (!so) throw new Error('Sales order not found');

    const invNumber = getNextNumber('INV', invoices);
    const invoiceItems = so.items.map(itm => {
      const itmMaster = items.find(i => i.id === itm.itemId);
      return {
        itemId: itm.itemId,
        itemName: itm.itemName,
        hsnSac: itmMaster?.hsnSacCode || '8483',
        quantity: itm.quantity,
        unitPrice: itm.unitPrice,
        gstRate: itm.gstRate,
        taxAmount: itm.taxAmount,
        totalAmount: itm.totalAmount
      };
    });

    const newInvoice: Invoice = {
      id: `inv-${Date.now()}`,
      companyId: activeCompany.id,
      invoiceNumber: invNumber,
      invoiceType: 'sales_tax_invoice',
      partnerType: 'customer',
      partnerId: so.customerId,
      partnerName: so.customerName,
      partnerGstin: '27AAACT2727Q1ZT',
      orderNumber: so.soNumber,
      invoiceDate: new Date().toISOString().split('T')[0],
      dueDate: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
      status: 'unpaid',
      subtotal: so.subtotal,
      cgstAmount: so.cgstAmount,
      sgstAmount: so.sgstAmount,
      igstAmount: so.igstAmount,
      totalAmount: so.grandTotal,
      paidAmount: 0,
      gstIrn: `98d3c${Math.random().toString(16).substring(2, 10)}${Date.now()}`,
      gstAckNumber: `1126${Math.floor(100000000 + Math.random() * 900000000)}`,
      items: invoiceItems
    };

    setInvoices(prev => [newInvoice, ...prev]);

    // Update customer outstanding balance
    setCustomers(prev => prev.map(c => c.id === so.customerId ? { ...c, outstandingBalance: c.outstandingBalance + so.grandTotal } : c));

    // Post to General Ledger (Debtors Dr. / Sales & GST Cr.)
    setChartOfAccounts(prev => prev.map(coa => {
      if (coa.accountCode === '1030') return { ...coa, balance: coa.balance + so.grandTotal }; // Debtors
      if (coa.accountCode === '3010') return { ...coa, balance: coa.balance + so.subtotal }; // Sales
      if (coa.accountCode === '2020') return { ...coa, balance: coa.balance + (so.cgstAmount + so.sgstAmount) }; // GST
      return coa;
    }));

    addAuditLog('CREATE', 'Invoice', newInvoice.id, `Generated GST Tax Invoice ${invNumber} for ${so.customerName} amount ₹${so.grandTotal}`);

    return newInvoice;
  };

  // 4. PROCURE-TO-PAY: Create Purchase Order
  const createPurchaseOrder = (poData: Omit<PurchaseOrder, 'id' | 'poNumber' | 'companyId' | 'status' | 'cgstAmount' | 'sgstAmount' | 'igstAmount' | 'grandTotal'>): PurchaseOrder => {
    const subtotal = poData.items.reduce((acc, itm) => acc + (itm.quantity * itm.unitPrice), 0);
    const cgst = subtotal * 0.09;
    const sgst = subtotal * 0.09;
    const grandTotal = subtotal + cgst + sgst;

    const poNumber = getNextNumber('PO', purchaseOrders);
    const newPO: PurchaseOrder = {
      ...poData,
      id: `po-${Date.now()}`,
      companyId: activeCompany.id,
      poNumber,
      status: 'ordered',
      subtotal,
      cgstAmount: cgst,
      sgstAmount: sgst,
      igstAmount: 0,
      grandTotal
    };

    setPurchaseOrders(prev => [newPO, ...prev]);
    addAuditLog('CREATE', 'PurchaseOrder', newPO.id, `Issued purchase order ${poNumber} to ${poData.supplierName} amount ₹${grandTotal.toLocaleString('en-IN')}`);

    return newPO;
  };

  // 5. GOODS RECEIPT NOTE (GRN)
  const createGRN = (poId: string, supplierInvoiceNo: string, warehouseId: string, itemsList: { itemId: string; receivedQty: number; batchNo: string }[]): GoodsReceiptNote => {
    const po = purchaseOrders.find(p => p.id === poId);
    if (!po) throw new Error('Purchase order not found');

    const grnNumber = getNextNumber('GRN', grns);
    const wh = warehouses.find(w => w.id === warehouseId) || warehouses[0];

    const grnItems = itemsList.map(il => {
      const itm = items.find(i => i.id === il.itemId);
      return {
        itemId: il.itemId,
        itemCode: itm?.itemCode || 'UNKNOWN',
        itemName: itm?.name || 'Raw Material',
        receivedQuantity: il.receivedQty,
        acceptedQuantity: il.receivedQty,
        rejectedQuantity: 0,
        batchNumber: il.batchNo || `BATCH-${Date.now()}`
      };
    });

    const newGRN: GoodsReceiptNote = {
      id: `grn-${Date.now()}`,
      companyId: activeCompany.id,
      grnNumber,
      purchaseOrderId: po.id,
      poNumber: po.poNumber,
      supplierId: po.supplierId,
      supplierName: po.supplierName,
      warehouseId: wh.id,
      warehouseName: wh.name,
      receiptDate: new Date().toISOString().split('T')[0],
      supplierInvoiceNo,
      qcStatus: 'pending_inspection',
      items: grnItems,
      notes: `Received at dock under Challan ${supplierInvoiceNo}`
    };

    setGrns(prev => [newGRN, ...prev]);

    // Update stock transactions & item quantities
    grnItems.forEach(gi => {
      const itm = items.find(i => i.id === gi.itemId);
      if (itm) {
        const trans: StockTransaction = {
          id: `st-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          companyId: activeCompany.id,
          transactionNumber: getNextNumber('ST', stockTransactions),
          itemId: gi.itemId,
          itemCode: gi.itemCode,
          itemName: gi.itemName,
          warehouseId: wh.id,
          warehouseName: wh.name,
          transactionType: 'receipt_grn',
          quantity: gi.receivedQuantity,
          unitCost: itm.standardCost,
          runningBalance: itm.currentStock + gi.receivedQuantity,
          batchNumber: gi.batchNumber,
          referenceType: 'grn',
          referenceNumber: grnNumber,
          notes: `Material receipt against PO ${po.poNumber}`,
          createdBy: currentUser.name,
          createdAt: new Date().toISOString()
        };
        setStockTransactions(prev => [trans, ...prev]);

        setItems(prev => prev.map(i => i.id === gi.itemId ? { ...i, currentStock: i.currentStock + gi.receivedQuantity } : i));
      }
    });

    // Update PO received quantity
    setPurchaseOrders(prev => prev.map(p => {
      if (p.id === poId) {
        const updatedItems = p.items.map(pi => {
          const matched = grnItems.find(gi => gi.itemId === pi.itemId);
          return matched ? { ...pi, receivedQuantity: pi.receivedQuantity + matched.receivedQuantity } : pi;
        });
        const isAllReceived = updatedItems.every(pi => pi.receivedQuantity >= pi.quantity);
        return {
          ...p,
          items: updatedItems,
          status: isAllReceived ? 'received' : 'partially_received'
        };
      }
      return p;
    }));

    addAuditLog('CREATE', 'GoodsReceiptNote', newGRN.id, `Recorded GRN ${grnNumber} for PO ${po.poNumber}`);

    return newGRN;
  };

  // 6. MANUFACTURING: Work Orders & Material Issue
  const createWorkOrder = (productId: string, bomId: string, quantity: number, priority: 'low' | 'normal' | 'urgent', dueDate: string, salesOrderId?: string): WorkOrder => {
    const prod = items.find(i => i.id === productId);
    const bom = boms.find(b => b.id === bomId);
    if (!prod || !bom) throw new Error('Invalid product or BOM');

    const woNumber = getNextNumber('WO', workOrders);
    const so = salesOrders.find(s => s.id === salesOrderId);

    const newWO: WorkOrder = {
      id: `wo-${Date.now()}`,
      companyId: activeCompany.id,
      woNumber,
      salesOrderId,
      soNumber: so?.soNumber,
      productId: prod.id,
      productCode: prod.itemCode,
      productName: prod.name,
      bomId: bom.id,
      bomRevision: bom.revision,
      plannedQuantity: quantity,
      producedQuantity: 0,
      rejectedQuantity: 0,
      reworkQuantity: 0,
      status: 'scheduled',
      priority,
      assignedSupervisor: 'Anil Deshmukh',
      assignedWorker: 'Vikram Jadhav',
      startDate: new Date().toISOString().split('T')[0],
      dueDate,
      notes: `Production lot for ${prod.name}`
    };

    setWorkOrders(prev => [newWO, ...prev]);
    addAuditLog('CREATE', 'WorkOrder', newWO.id, `Created Work Order ${woNumber} for ${quantity} ${prod.uom}`);

    return newWO;
  };

  // Start Job / Issue Raw Materials
  const startWorkOrder = (workOrderId: string): { success: boolean; message: string } => {
    const wo = workOrders.find(w => w.id === workOrderId);
    if (!wo) return { success: false, message: 'Work order not found' };

    const bom = boms.find(b => b.id === wo.bomId);
    if (!bom) return { success: false, message: 'BOM not found' };

    // Check material availability
    for (const bItem of bom.items) {
      const requiredQty = bItem.quantityRequired * wo.plannedQuantity * (1 + bItem.scrapPercentage / 100);
      const stockItem = items.find(i => i.id === bItem.itemId);
      if (!stockItem || stockItem.currentStock < requiredQty) {
        return {
          success: false,
          message: `Material Shortage: ${stockItem?.name || 'Raw Material'} has only ${stockItem?.currentStock || 0} ${stockItem?.uom || ''} in stock, but ${requiredQty.toFixed(1)} is required for this job.`
        };
      }
    }

    // Deduct raw materials and log stock transaction
    bom.items.forEach(bItem => {
      const requiredQty = bItem.quantityRequired * wo.plannedQuantity * (1 + bItem.scrapPercentage / 100);
      const stockItem = items.find(i => i.id === bItem.itemId);
      if (stockItem) {
        const trans: StockTransaction = {
          id: `st-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          companyId: activeCompany.id,
          transactionNumber: getNextNumber('ST', stockTransactions),
          itemId: stockItem.id,
          itemCode: stockItem.itemCode,
          itemName: stockItem.name,
          warehouseId: stockItem.warehouseId,
          warehouseName: 'Raw Materials Main Store',
          transactionType: 'issue_production',
          quantity: -requiredQty,
          unitCost: stockItem.standardCost,
          runningBalance: stockItem.currentStock - requiredQty,
          referenceType: 'work_order',
          referenceNumber: wo.woNumber,
          notes: `Issued to shop floor for Work Order ${wo.woNumber}`,
          createdBy: currentUser.name,
          createdAt: new Date().toISOString()
        };
        setStockTransactions(prev => [trans, ...prev]);

        setItems(prev => prev.map(i => i.id === stockItem.id ? { ...i, currentStock: i.currentStock - requiredQty } : i));
      }
    });

    // Update Work Order to in_progress
    setWorkOrders(prev => prev.map(w => w.id === workOrderId ? { ...w, status: 'in_progress' } : w));
    addAuditLog('STATUS_CHANGE', 'WorkOrder', workOrderId, `Started Work Order ${wo.woNumber} and issued raw materials`);

    return { success: true, message: `Work Order ${wo.woNumber} started successfully. Raw materials issued to shop floor.` };
  };

  // Record Operator Output
  const recordProductionOutput = (workOrderId: string, station: string, goodQty: number, rejectedQty: number, reworkQty: number, rejectionReason?: string) => {
    const wo = workOrders.find(w => w.id === workOrderId);
    if (!wo) return;

    const entry: ProductionEntry = {
      id: `pe-${Date.now()}`,
      companyId: activeCompany.id,
      workOrderId,
      woNumber: wo.woNumber,
      operatorName: currentUser.name,
      operationStation: station,
      timestamp: new Date().toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' }),
      goodQuantity: goodQty,
      rejectedQuantity: rejectedQty,
      reworkQuantity: reworkQty,
      rejectionReason,
      notes: `Recorded at ${station}`
    };

    setProductionEntries(prev => [entry, ...prev]);

    // Update Work Order cumulative outputs
    setWorkOrders(prev => prev.map(w => {
      if (w.id === workOrderId) {
        const newGood = w.producedQuantity + goodQty;
        const newRej = w.rejectedQuantity + rejectedQty;
        const newRework = w.reworkQuantity + reworkQty;
        const isComplete = (newGood + newRej) >= w.plannedQuantity;

        return {
          ...w,
          producedQuantity: newGood,
          rejectedQuantity: newRej,
          reworkQuantity: newRework,
          status: isComplete ? 'qc_pending' : 'in_progress'
        };
      }
      return w;
    }));

    addAuditLog('UPDATE', 'WorkOrder', workOrderId, `Logged output for ${wo.woNumber}: ${goodQty} Good, ${rejectedQty} Rejects`);
  };

  // 7. QUALITY INSPECTION
  const createQualityInspection = (
    refType: 'work_order' | 'grn',
    refId: string,
    itemId: string,
    status: 'passed' | 'failed' | 'conditional_pass',
    sampleSize: number,
    checkpoints: any[],
    rootCause?: string
  ): QualityInspection => {
    const itm = items.find(i => i.id === itemId);
    const inspNumber = getNextNumber('QC', qualityInspections);

    let refNumber = 'REF-00';
    if (refType === 'work_order') {
      const wo = workOrders.find(w => w.id === refId);
      refNumber = wo?.woNumber || 'WO';
    } else {
      const grn = grns.find(g => g.id === refId);
      refNumber = grn?.grnNumber || 'GRN';
    }

    const newQI: QualityInspection = {
      id: `qc-${Date.now()}`,
      companyId: activeCompany.id,
      inspectionNumber: inspNumber,
      referenceType: refType,
      referenceId: refId,
      referenceNumber: refNumber,
      itemId,
      itemName: itm?.name || 'Item',
      inspectorName: currentUser.name,
      inspectionDate: new Date().toISOString().split('T')[0],
      sampleSize,
      status,
      defectsFound: status === 'failed' ? 2 : 0,
      rootCauseAnalysis: rootCause,
      correctiveAction: status === 'passed' ? 'Approved for warehouse transfer' : 'Quarantine inspection lock engaged',
      checkpoints
    };

    setQualityInspections(prev => [newQI, ...prev]);

    // If passed on a work order, transfer to finished goods warehouse!
    if (refType === 'work_order' && status === 'passed') {
      const wo = workOrders.find(w => w.id === refId);
      if (wo && itm) {
        const trans: StockTransaction = {
          id: `st-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          companyId: activeCompany.id,
          transactionNumber: getNextNumber('ST', stockTransactions),
          itemId: itm.id,
          itemCode: itm.itemCode,
          itemName: itm.name,
          warehouseId: itm.warehouseId,
          warehouseName: 'Finished Goods Dispatch Bay',
          transactionType: 'production_finish',
          quantity: wo.producedQuantity,
          unitCost: itm.standardCost,
          runningBalance: itm.currentStock + wo.producedQuantity,
          referenceType: 'work_order',
          referenceNumber: wo.woNumber,
          notes: `QC Passed lot transferred to finished stock`,
          createdBy: currentUser.name,
          createdAt: new Date().toISOString()
        };
        setStockTransactions(prev => [trans, ...prev]);
        setItems(prev => prev.map(i => i.id === itm.id ? { ...i, currentStock: i.currentStock + wo.producedQuantity } : i));
        setWorkOrders(prev => prev.map(w => w.id === refId ? { ...w, status: 'completed', completedAt: new Date().toISOString() } : w));
      }
    }

    addAuditLog('CREATE', 'QualityInspection', newQI.id, `Recorded Inspection ${inspNumber} (${status.toUpperCase()}) for ${refNumber}`);

    return newQI;
  };

  // 8. STOCK ADJUSTMENT (Physical counts)
  const adjustStock = (itemId: string, warehouseId: string, quantityChange: number, reason: string) => {
    const itm = items.find(i => i.id === itemId);
    const wh = warehouses.find(w => w.id === warehouseId) || warehouses[0];
    if (!itm) return;

    const trans: StockTransaction = {
      id: `st-${Date.now()}`,
      companyId: activeCompany.id,
      transactionNumber: getNextNumber('ST', stockTransactions),
      itemId: itm.id,
      itemCode: itm.itemCode,
      itemName: itm.name,
      warehouseId: wh.id,
      warehouseName: wh.name,
      transactionType: 'adjustment',
      quantity: quantityChange,
      unitCost: itm.standardCost,
      runningBalance: itm.currentStock + quantityChange,
      referenceType: 'manual',
      referenceNumber: 'PHYSICAL-AUDIT',
      notes: reason,
      createdBy: currentUser.name,
      createdAt: new Date().toISOString()
    };

    setStockTransactions(prev => [trans, ...prev]);
    setItems(prev => prev.map(i => i.id === itemId ? { ...i, currentStock: i.currentStock + quantityChange } : i));
    addAuditLog('STOCK_MOVE', 'Item', itemId, `Adjusted stock by ${quantityChange} ${itm.uom}: ${reason}`);
  };

  // 9. PAYMENTS (Customer receipts & vendor payments)
  const recordPayment = (type: 'customer_receipt' | 'supplier_payment', partnerId: string, partnerName: string, amount: number, mode: string, refNo: string, invoiceId?: string): Payment => {
    const payNumber = getNextNumber('PAY', payments);
    const newPay: Payment = {
      id: `pay-${Date.now()}`,
      companyId: activeCompany.id,
      paymentNumber: payNumber,
      paymentType: type,
      partnerId,
      partnerName,
      invoiceId,
      invoiceNumber: invoices.find(i => i.id === invoiceId)?.invoiceNumber,
      paymentDate: new Date().toISOString().split('T')[0],
      amount,
      paymentMode: mode as any,
      referenceNumber: refNo,
      status: 'completed'
    };

    setPayments(prev => [newPay, ...prev]);

    // Update invoice paid status
    if (invoiceId) {
      setInvoices(prev => prev.map(inv => {
        if (inv.id === invoiceId) {
          const newPaid = inv.paidAmount + amount;
          return {
            ...inv,
            paidAmount: newPaid,
            status: newPaid >= inv.totalAmount ? 'paid' : 'partially_paid'
          };
        }
        return inv;
      }));
    }

    // Update customer / supplier outstanding balances
    if (type === 'customer_receipt') {
      setCustomers(prev => prev.map(c => c.id === partnerId ? { ...c, outstandingBalance: Math.max(0, c.outstandingBalance - amount) } : c));
      // Increase bank balance
      setChartOfAccounts(prev => prev.map(coa => coa.accountCode === '1010' ? { ...coa, balance: coa.balance + amount } : coa));
    } else {
      // Decrease bank balance
      setChartOfAccounts(prev => prev.map(coa => coa.accountCode === '1010' ? { ...coa, balance: coa.balance - amount } : coa));
    }

    addAuditLog('CREATE', 'Payment', newPay.id, `Recorded ${type} ${payNumber} of ₹${amount.toLocaleString('en-IN')}`);

    return newPay;
  };

  // 10. MRP ENGINE (Rule-based material requirement planning)
  const calculateMRP = (): MRPRequirement[] => {
    const requirementsMap: Record<string, { grossRequired: number; uom: Item['uom'] }> = {};

    // Explode confirmed sales orders using BOM
    salesOrders
      .filter(so => ['confirmed', 'in_production'].includes(so.status))
      .forEach(so => {
        so.items.forEach(soItem => {
          const bom = boms.find(b => b.productId === soItem.itemId && b.isActive);
          if (bom) {
            bom.items.forEach(bItem => {
              const reqQty = bItem.quantityRequired * soItem.quantity * (1 + bItem.scrapPercentage / 100);
              if (!requirementsMap[bItem.itemId]) {
                requirementsMap[bItem.itemId] = { grossRequired: 0, uom: bItem.uom };
              }
              requirementsMap[bItem.itemId].grossRequired += reqQty;
            });
          }
        });
      });

    // Compute pending PO quantity
    const pendingPOMap: Record<string, number> = {};
    purchaseOrders
      .filter(po => ['ordered', 'partially_received'].includes(po.status))
      .forEach(po => {
        po.items.forEach(pItem => {
          const remaining = pItem.quantity - pItem.receivedQuantity;
          pendingPOMap[pItem.itemId] = (pendingPOMap[pItem.itemId] || 0) + remaining;
        });
      });

    const results: MRPRequirement[] = [];

    // Check all raw materials
    items.filter(itm => itm.category === 'raw_material').forEach(itm => {
      const grossReq = requirementsMap[itm.id]?.grossRequired || 0;
      const pendingPO = pendingPOMap[itm.id] || 0;
      const effectiveStock = itm.currentStock + pendingPO;
      const netShortage = Math.max(0, grossReq - effectiveStock);

      if (netShortage > 0 || itm.currentStock <= itm.reorderLevel) {
        const orderQty = Math.max(netShortage, itm.reorderQuantity);
        const supplier = suppliers[0]; // Primary preferred vendor

        results.push({
          itemId: itm.id,
          itemCode: itm.itemCode,
          itemName: itm.name,
          uom: itm.uom,
          grossRequired: grossReq,
          currentStock: itm.currentStock,
          pendingPOQuantity: pendingPO,
          netShortage,
          recommendedOrderQuantity: orderQty,
          suggestedSupplierId: supplier?.id,
          suggestedSupplierName: supplier?.name,
          estimatedCost: orderQty * itm.standardCost
        });
      }
    });

    return results;
  };

  // Convert MRP Shortages into Purchase Orders in 1-Click
  const generatePOsFromMRP = (shortages: MRPRequirement[]): number => {
    let createdCount = 0;
    shortages.forEach(sh => {
      if (sh.recommendedOrderQuantity > 0) {
        createPurchaseOrder({
          supplierId: sh.suggestedSupplierId || suppliers[0].id,
          supplierName: sh.suggestedSupplierName || suppliers[0].name,
          orderDate: new Date().toISOString().split('T')[0],
          expectedDate: new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
          subtotal: sh.estimatedCost,
          notes: `Automated Purchase Order generated via FactoryFlow MRP Engine for shortage of ${sh.netShortage.toFixed(1)} ${sh.uom}`,
          items: [
            {
              id: `po-itm-${Date.now()}`,
              itemId: sh.itemId,
              itemCode: sh.itemCode,
              itemName: sh.itemName,
              quantity: sh.recommendedOrderQuantity,
              unitPrice: sh.estimatedCost / sh.recommendedOrderQuantity,
              gstRate: 18,
              taxAmount: sh.estimatedCost * 0.18,
              totalAmount: sh.estimatedCost * 1.18,
              receivedQuantity: 0
            }
          ]
        });
        createdCount++;
      }
    });
    return createdCount;
  };

  // Sync state with Supabase
  const syncWithSupabase = async () => {
    if (!supabase) return;
    try {
      // Upsert companies and items into live Supabase
      await supabase.from('companies').upsert({
        id: activeCompany.id,
        name: activeCompany.name,
        code: activeCompany.code,
        gstin: activeCompany.gstin,
        pan: activeCompany.pan,
        address: activeCompany.address
      });
      addAuditLog('UPDATE', 'SupabaseSync', activeCompany.id, 'Synced active company state to Supabase PostgreSQL');
    } catch (err) {
      console.error('Supabase sync error', err);
    }
  };

  const resetToDemoData = () => {
    localStorage.clear();
    window.location.reload();
  };

  return (
    <ERPContext.Provider
      value={{
        companies,
        activeCompany,
        setActiveCompanyId,
        currentUser,
        currentRole,
        setCurrentRole,
        canAccess,
        items,
        warehouses,
        customers,
        suppliers,
        boms,
        salesOrders,
        purchaseOrders,
        grns,
        workOrders,
        productionEntries,
        qualityInspections,
        stockTransactions,
        invoices,
        payments,
        deliveryChallans,
        chartOfAccounts,
        auditLogs,
        createSalesOrder,
        updateSalesOrderStatus,
        createDeliveryChallan,
        createSalesInvoiceFromOrder,
        createPurchaseOrder,
        createGRN,
        createWorkOrder,
        startWorkOrder,
        recordProductionOutput,
        createQualityInspection,
        adjustStock,
        recordPayment,
        calculateMRP,
        generatePOsFromMRP,
        isCloudConnected,
        syncWithSupabase,
        resetToDemoData
      }}
    >
      {children}
    </ERPContext.Provider>
  );
};

export const useERP = () => {
  const context = useContext(ERPContext);
  if (!context) throw new Error('useERP must be used within an ERPProvider');
  return context;
};
