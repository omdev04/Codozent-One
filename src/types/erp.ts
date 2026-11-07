// ==============================================================================
// FACTORYFLOW ERP - DOMAIN TYPES & DATA CONTRACTS
// Multi-tenant, SME Manufacturing (Chakan-Pune Industrial Belt)
// ==============================================================================

export type ERPRole = 
  | 'owner'
  | 'admin'
  | 'production_manager'
  | 'purchase_user'
  | 'storekeeper'
  | 'supervisor'
  | 'worker'
  | 'qc_inspector'
  | 'accountant'
  | 'viewer';

export interface Company {
  id: string;
  name: string;
  code: string;
  gstin: string;
  pan: string;
  address: string;
  city: string;
  state: string;
  stateCode: string;
  pincode: string;
  phone: string;
  email: string;
  currency: string;
  logoUrl?: string;
  industry: string;
}

export interface CompanyUser {
  id: string;
  companyId: string;
  name: string;
  email: string;
  role: ERPRole;
  department: string;
  isActive: boolean;
}

export type ItemCategory = 'raw_material' | 'wip' | 'finished_goods' | 'consumable';
export type UnitOfMeasure = 'nos' | 'kg' | 'mtr' | 'litres' | 'pcs' | 'sets';

export interface Item {
  id: string;
  companyId: string;
  itemCode: string;
  name: string;
  description: string;
  category: ItemCategory;
  uom: UnitOfMeasure;
  hsnSacCode: string;
  gstRate: number; // e.g. 18.0
  standardCost: number;
  sellingPrice: number;
  reorderLevel: number;
  reorderQuantity: number;
  currentStock: number;
  allocatedStock: number;
  warehouseId: string;
}

export interface Warehouse {
  id: string;
  companyId: string;
  code: string;
  name: string;
  warehouseType: 'raw_materials' | 'wip_floor' | 'finished_goods' | 'scrap_quarantine';
  location: string;
}

export interface Customer {
  id: string;
  companyId: string;
  customerCode: string;
  name: string;
  contactPerson: string;
  email: string;
  phone: string;
  gstin: string;
  pan: string;
  city?: string;
  billingAddress: string;
  shippingAddress: string;
  creditLimit: number;
  creditDays: number;
  outstandingBalance: number;
}

export interface Supplier {
  id: string;
  companyId: string;
  supplierCode: string;
  name: string;
  contactPerson: string;
  email: string;
  phone: string;
  gstin: string;
  address: string;
  paymentTerms: string;
  rating: number; // 1-5
  outstandingPayable: number;
}

export interface BOMItem {
  id: string;
  bomId: string;
  itemId: string;
  itemName?: string;
  itemCode?: string;
  quantityRequired: number;
  uom: UnitOfMeasure;
  scrapPercentage: number;
  operationStation: string;
  notes?: string;
}

export interface BillOfMaterials {
  id: string;
  companyId: string;
  productId: string;
  productName?: string;
  productCode?: string;
  bomNumber: string;
  revision: string; // 'Rev 1.0', 'Rev 1.1'
  description: string;
  outputQuantity: number;
  isActive: boolean;
  approvedBy: string;
  items: BOMItem[];
  createdAt: string;
}

export type QuotationStatus = 'draft' | 'sent' | 'approved' | 'rejected' | 'converted_to_order';

export interface QuotationItem {
  id: string;
  itemId: string;
  itemCode: string;
  itemName: string;
  quantity: number;
  unitPrice: number;
  gstRate: number;
  taxAmount: number;
  totalAmount: number;
}

export interface Quotation {
  id: string;
  companyId: string;
  quotationNumber: string;
  revision: string; // 'Rev A', 'Rev B'
  customerId: string;
  customerName: string;
  quoteDate: string;
  validUntil: string;
  status: QuotationStatus;
  subtotal: number;
  cgstAmount: number;
  sgstAmount: number;
  igstAmount: number;
  grandTotal: number;
  items: QuotationItem[];
  notes?: string;
  createdBy: string;
}

export type SalesOrderStatus = 
  | 'draft'
  | 'confirmed'
  | 'in_production'
  | 'ready_for_dispatch'
  | 'partially_shipped'
  | 'completed'
  | 'cancelled';

export interface SalesOrderItem {
  id: string;
  itemId: string;
  itemCode: string;
  itemName: string;
  quantity: number;
  unitPrice: number;
  gstRate: number;
  taxAmount: number;
  totalAmount: number;
  shippedQuantity: number;
}

export interface SalesOrder {
  id: string;
  companyId: string;
  soNumber: string;
  customerId: string;
  customerName: string;
  customerPoNumber: string;
  orderDate: string;
  deliveryDate: string;
  status: SalesOrderStatus;
  subtotal: number;
  cgstAmount: number;
  sgstAmount: number;
  igstAmount: number;
  grandTotal: number;
  items: SalesOrderItem[];
  notes?: string;
  createdBy: string;
}

export interface DeliveryChallan {
  id: string;
  companyId: string;
  challanNumber: string;
  salesOrderId: string;
  soNumber: string;
  customerId: string;
  customerName: string;
  dispatchDate: string;
  transporterName: string;
  vehicleNumber: string;
  eWayBillNumber: string;
  items: {
    itemId: string;
    itemName: string;
    itemCode: string;
    quantity: number;
    uom: string;
  }[];
  status: 'dispatched' | 'delivered';
}

export type PurchaseOrderStatus = 
  | 'draft'
  | 'ordered'
  | 'partially_received'
  | 'received'
  | 'cancelled';

export interface PurchaseOrderItem {
  id: string;
  itemId: string;
  itemCode: string;
  itemName: string;
  quantity: number;
  unitPrice: number;
  gstRate: number;
  taxAmount: number;
  totalAmount: number;
  receivedQuantity: number;
}

export interface PurchaseOrder {
  id: string;
  companyId: string;
  poNumber: string;
  supplierId: string;
  supplierName: string;
  orderDate: string;
  expectedDate: string;
  status: PurchaseOrderStatus;
  subtotal: number;
  cgstAmount: number;
  sgstAmount: number;
  igstAmount: number;
  grandTotal: number;
  items: PurchaseOrderItem[];
  notes?: string;
}

export interface GoodsReceiptNote {
  id: string;
  companyId: string;
  grnNumber: string;
  purchaseOrderId: string;
  poNumber: string;
  supplierId: string;
  supplierName: string;
  warehouseId: string;
  warehouseName: string;
  receiptDate: string;
  supplierInvoiceNo: string;
  qcStatus: 'pending_inspection' | 'inspected_passed' | 'quarantine_failed';
  items: {
    itemId: string;
    itemCode: string;
    itemName: string;
    receivedQuantity: number;
    acceptedQuantity: number;
    rejectedQuantity: number;
    batchNumber: string;
  }[];
  notes?: string;
}

export type WorkOrderStatus = 
  | 'draft'
  | 'scheduled'
  | 'in_progress'
  | 'qc_pending'
  | 'completed'
  | 'cancelled';

export interface WorkOrder {
  id: string;
  companyId: string;
  woNumber: string;
  salesOrderId?: string;
  soNumber?: string;
  productId: string;
  productCode: string;
  productName: string;
  bomId: string;
  bomRevision: string;
  plannedQuantity: number;
  producedQuantity: number;
  rejectedQuantity: number;
  reworkQuantity: number;
  status: WorkOrderStatus;
  priority: 'low' | 'normal' | 'urgent';
  assignedSupervisor: string;
  assignedWorker: string;
  startDate: string;
  dueDate: string;
  completedAt?: string;
  notes?: string;
}

export interface ProductionEntry {
  id: string;
  companyId: string;
  workOrderId: string;
  woNumber: string;
  operatorName: string;
  operationStation: string;
  timestamp: string;
  goodQuantity: number;
  rejectedQuantity: number;
  reworkQuantity: number;
  rejectionReason?: string;
  notes?: string;
}

export interface QualityInspection {
  id: string;
  companyId: string;
  inspectionNumber: string;
  referenceType: 'grn' | 'work_order' | 'final_dispatch';
  referenceId: string;
  referenceNumber: string;
  itemId: string;
  itemName: string;
  inspectorName: string;
  inspectionDate: string;
  sampleSize: number;
  status: 'passed' | 'failed' | 'conditional_pass';
  defectsFound: number;
  rootCauseAnalysis?: string;
  correctiveAction?: string;
  checkpoints: {
    parameterName: string;
    specification: string;
    tolerance: string;
    observedValue: string;
    result: 'pass' | 'fail';
  }[];
}

export interface StockTransaction {
  id: string;
  companyId: string;
  transactionNumber: string;
  itemId: string;
  itemCode: string;
  itemName: string;
  warehouseId: string;
  warehouseName: string;
  transactionType: 
    | 'receipt_grn' 
    | 'issue_production' 
    | 'production_finish' 
    | 'sales_dispatch' 
    | 'adjustment' 
    | 'rejection_scrap';
  quantity: number; // positive for receipt/production finish, negative for issue/dispatch
  unitCost: number;
  runningBalance: number;
  batchNumber?: string;
  referenceType: 'grn' | 'work_order' | 'challan' | 'manual';
  referenceNumber: string;
  notes?: string;
  createdBy: string;
  createdAt: string;
}

export interface Invoice {
  id: string;
  companyId: string;
  invoiceNumber: string;
  invoiceType: 'sales_tax_invoice' | 'purchase_bill';
  partnerType: 'customer' | 'supplier';
  partnerId: string;
  partnerName: string;
  partnerGstin: string;
  orderNumber?: string;
  invoiceDate: string;
  dueDate: string;
  status: 'draft' | 'unpaid' | 'partially_paid' | 'paid' | 'cancelled';
  subtotal: number;
  cgstAmount: number;
  sgstAmount: number;
  igstAmount: number;
  totalAmount: number;
  paidAmount: number;
  gstIrn?: string; // Indian E-Invoice IRN
  gstAckNumber?: string;
  items: {
    itemId: string;
    itemName: string;
    hsnSac: string;
    quantity: number;
    unitPrice: number;
    gstRate: number;
    taxAmount: number;
    totalAmount: number;
  }[];
}

export interface Payment {
  id: string;
  companyId: string;
  paymentNumber: string;
  paymentType: 'customer_receipt' | 'supplier_payment';
  partnerId: string;
  partnerName: string;
  invoiceId?: string;
  invoiceNumber?: string;
  paymentDate: string;
  amount: number;
  paymentMode: 'bank_transfer_neft_rtgs' | 'upi' | 'cheque' | 'cash';
  referenceNumber: string;
  status: 'completed' | 'reconciled';
}

export interface ChartOfAccount {
  id: string;
  companyId: string;
  accountCode: string;
  accountName: string;
  accountType: 'asset' | 'liability' | 'equity' | 'revenue' | 'expense';
  balance: number;
}

export interface AuditLog {
  id: string;
  companyId: string;
  userName: string;
  action: 'CREATE' | 'UPDATE' | 'DELETE' | 'STATUS_CHANGE' | 'STOCK_MOVE';
  entityName: string;
  entityId: string;
  details: string;
  timestamp: string;
}

export interface MRPRequirement {
  itemId: string;
  itemCode: string;
  itemName: string;
  uom: UnitOfMeasure;
  grossRequired: number;
  currentStock: number;
  pendingPOQuantity: number;
  netShortage: number;
  recommendedOrderQuantity: number;
  suggestedSupplierId?: string;
  suggestedSupplierName?: string;
  estimatedCost: number;
}

