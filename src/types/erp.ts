// ==============================================================================
// FACTORYFLOW ERP - DOMAIN TYPES & DATA CONTRACTS
// Multi-tenant, SME Manufacturing (Chakan-Pune Industrial Belt)
// ==============================================================================

export type ERPRole =
  | 'super_admin'
  | 'owner'
  | 'admin'
  | 'finance_manager'
  | 'sales_manager'
  | 'sales_executive'
  | 'purchase_manager'
  | 'inventory_manager'
  | 'hr_manager'
  | 'production_manager'
  | 'purchase_user'
  | 'storekeeper'
  | 'supervisor'
  | 'worker'
  | 'qc_inspector'
  | 'accountant'
  | 'viewer';

export interface CompanyBranchRef {
  id: string;
  name: string;
  code: string;
  city: string;
  state: string;
  isMain?: boolean;
}

export interface Company {
  id: string;
  tenantId?: string;
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
  branches?: CompanyBranchRef[];
}

export interface CompanyUser {
  id: string;
  companyId: string;
  tenantId?: string;
  companyIds?: string[];
  branchId?: string;
  branchName?: string;
  name: string;
  email: string;
  phone?: string;
  isEmailVerified?: boolean;
  isPhoneVerified?: boolean;
  verificationStatus?: 'pending_verification' | 'email_verified_only' | 'phone_verified_only' | 'active' | 'suspended';
  role: ERPRole;
  department: string;
  isActive: boolean;
  passwordHash?: string;
  avatarUrl?: string;
  isTestAccount?: boolean;
}

export interface ERPModuleMeta {
  id: string;
  name: string;
  category: string;
  description: string;
  features: string[];
  icon: string;
  badge: string;
  isCore?: boolean;
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
  unitCost?: number;
  totalCost?: number;
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
  directLabourCost?: number; // e.g. ₹500/unit
  overheadCost?: number;     // e.g. ₹300/unit
  totalPlannedUnitCost?: number;
  drawingUrl?: string;
  drawingName?: string;
  createdAt: string;
}

export interface WorkCenter {
  id: string;
  companyId: string;
  code: string;
  name: string; // e.g. Cutting, Welding, Painting
  hourlyRate: number; // e.g. 1200, 600, 800
  capacityHoursPerDay: number;
  location: string;
  status: 'active' | 'maintenance' | 'inactive';
  qrCode?: string;
}

export interface RoutingStage {
  stageNumber: number;
  stageName: string;
  workCenterId?: string;
  workCenterName?: string;
  isQcCompulsory: boolean;
  status: 'pending' | 'in_progress' | 'qc_pending' | 'completed';
  operatorName?: string;
  goodQuantity?: number;
  scrapQuantity?: number;
  qcPassed?: boolean;
  qcNotes?: string;
}

export interface RFQQuote {
  id: string;
  supplierId: string;
  supplierName: string;
  unitRate: number;
  gstRate: number;
  freightAmount: number;
  deliveryDays: number;
  totalLandedCost: number;
  basicRate?: number;
  gstPercentage?: number;
  leadTimeDays?: number;
  paymentTerms?: string;
  isWinningQuote?: boolean;
  notes?: string;
  receivedAt?: string;
}

export interface RFQ {
  id: string;
  companyId: string;
  rfqNumber: string;
  title?: string;
  date?: string;
  dueDate?: string;
  targetDeliveryDate?: string;
  status: 'draft' | 'open' | 'sent' | 'quotes_received' | 'awarded' | 'closed';
  items: {
    itemId: string;
    itemCode: string;
    itemName: string;
    quantity: number;
    uom: string;
    targetRate?: number;
  }[];
  supplierIds?: string[];
  quotes: RFQQuote[];
  awardedPoId?: string;
  awardedQuoteId?: string;
  notes?: string;
  createdAt?: string;
}

export type QuotationStatus =
  | 'draft'
  | 'pending_approval'
  | 'approved'
  | 'sent'
  | 'viewed'
  | 'under_negotiation'
  | 'revision_requested'
  | 'accepted'
  | 'rejected'
  | 'expired'
  | 'cancelled'
  | 'converted_to_order'
  | 'superseded';

export interface QuotationItem {
  id: string;
  quotationId?: string;
  itemId?: string; // Optional for custom made-to-order manufacturing items
  itemCode: string;
  itemName: string;
  description?: string;
  technicalSpecifications?: string;
  dimensions?: string;
  materialGrade?: string;
  drawingReference?: string;
  toleranceDetails?: string;
  manufacturingNotes?: string;
  hsnSacCode?: string;
  uom: string; // 'Nos' | 'Kg' | 'Meter' | 'Set' | 'Hours' | 'Lot'
  quantity: number;
  unitPrice: number;
  discountType?: 'percentage' | 'fixed';
  discountValue?: number;
  discountAmount?: number;
  taxableAmount?: number;
  gstRate: number; // 0, 5, 12, 18, 28
  cgstRate?: number;
  sgstRate?: number;
  igstRate?: number;
  cgstAmount?: number;
  sgstAmount?: number;
  igstAmount?: number;
  taxAmount: number;
  totalAmount: number; // Final line total = taxableAmount + taxAmount
  sortOrder?: number;
}

export interface QuotationAddress {
  street?: string;
  city?: string;
  state?: string;
  stateCode?: string; // e.g. "27" for Maharashtra
  pincode?: string;
  country?: string;
}

export interface QuotationRevision {
  id: string;
  quotationFamilyId: string;
  quotationId: string;
  revisionNumber: number;
  previousQuotationId?: string;
  revisionReason: string;
  changedFieldsSummary?: string;
  snapshotData?: any;
  createdBy: string;
  createdAt: string;
}

export interface QuotationActivity {
  id: string;
  quotationId: string;
  type:
  | 'created'
  | 'updated'
  | 'sent'
  | 'viewed'
  | 'status_change'
  | 'approval_requested'
  | 'approved'
  | 'rejected'
  | 'revision_created'
  | 'accepted'
  | 'customer_rejected'
  | 'cancelled'
  | 'sales_order_converted';
  title: string;
  description?: string;
  performedBy: string;
  performedAt: string;
  metadata?: Record<string, any>;
}

export interface QuotationAttachment {
  id: string;
  quotationId: string;
  fileName: string;
  fileUrl: string;
  fileType: string;
  fileSize: number;
  category: 'drawing' | 'spec_sheet' | 'po' | 'other';
  uploadedBy: string;
  uploadedAt: string;
}

export interface QuotationApproval {
  id: string;
  quotationId: string;
  requestedBy: string;
  approverName?: string;
  status: 'pending' | 'approved' | 'rejected';
  comments?: string;
  reviewedAt?: string;
  createdAt: string;
}

export interface Quotation {
  id: string;
  companyId: string;
  quotationNumber: string; // e.g. "QT-2026-00001"
  quotationFamilyId?: string; // Groups all revisions of the same quotation
  revisionNumber?: number; // 0, 1, 2...
  revision: string; // 'Rev 0', 'Rev 1' / 'Rev A', 'Rev B'

  // Customer & Lead association
  customerId: string;
  customerName: string;
  contactPerson?: string;
  phone?: string;
  email?: string;
  gstin?: string;
  leadId?: string;
  leadNumber?: string;

  // Basic Details
  quoteDate: string;
  validUntil: string;
  subject?: string;
  referenceNumber?: string;
  salespersonId?: string;
  salespersonName?: string;
  placeOfSupply?: string; // State / State Code
  billingAddress?: QuotationAddress | string;
  shippingAddress?: QuotationAddress | string;

  // Commercial & Indian GST
  subtotal: number; // Gross amount
  discountType?: 'percentage' | 'fixed';
  discountValue?: number;
  discountAmount?: number;
  taxableAmount?: number;
  cgstAmount: number;
  sgstAmount: number;
  igstAmount: number;
  freightAmount?: number;
  packingAmount?: number;
  otherCharges?: number;
  roundOff?: number;
  grandTotal: number;
  amountInWords?: string; // Indian words format
  currency?: string; // 'INR'

  // Items
  items: QuotationItem[];

  // Terms & Conditions
  paymentTerms?: string;
  deliveryPeriod?: string;
  deliveryLocation?: string;
  transportationTerms?: string;
  packingTerms?: string;
  warrantyTerms?: string;
  validityTerms?: string;
  taxesAndDuties?: string;
  terms?: string;
  customTerms?: string;

  // Notes
  notes?: string;
  internalNotes?: string; // Strictly confidential, NEVER printed on customer PDF
  customerNotes?: string;

  // Status, Approval & Workflow
  status: QuotationStatus;
  approvalStatus?: 'not_required' | 'pending' | 'approved' | 'rejected';
  approvedBy?: string;
  approvedAt?: string;
  approvalComments?: string;
  sentAt?: string;
  sentVia?: 'email' | 'whatsapp' | 'manual';
  acceptedAt?: string;
  rejectedAt?: string;
  rejectionReason?: string;
  supersededBy?: string; // ID of next revision

  // Future Sales Order reference
  convertedSalesOrderId?: string;
  convertedSalesOrderNumber?: string;

  // Audit & Metadata
  createdBy: string;
  updatedBy?: string;
  createdAt?: string;
  updatedAt?: string;

  // Sub-entities
  revisions?: QuotationRevision[];
  activities?: QuotationActivity[];
  attachments?: QuotationAttachment[];
  approvals?: QuotationApproval[];
}

export type SalesOrderStatus =
  | 'draft'
  | 'pending_approval'
  | 'confirmed'
  | 'on_hold'
  | 'in_production'
  | 'partially_completed'
  | 'ready_for_dispatch'
  | 'dispatched'
  | 'partially_dispatched'
  | 'partially_shipped'
  | 'completed'
  | 'cancelled';

export interface SalesOrderStatusHistory {
  id: string;
  fromStatus: SalesOrderStatus;
  toStatus: SalesOrderStatus;
  changedBy: string;
  changedAt: string;
  reason?: string;
}

export interface SalesOrderItem {
  id: string;
  itemId: string;
  itemCode: string;
  itemName: string;
  description?: string;
  technicalSpecs?: string;
  drawingRef?: string;
  materialGrade?: string;
  dimensions?: string;
  tolerance?: string;
  uom?: string;
  quantity: number;
  unitPrice: number;
  discountPercent?: number;
  discountAmount?: number;
  taxableAmount?: number;
  hsnSacCode?: string;
  gstRate: number;
  taxAmount: number;
  totalAmount: number;
  shippedQuantity: number;
  subtotal?: number;
}

export interface SalesOrder {
  id: string;
  companyId: string;
  soNumber: string;
  customerId: string;
  customerName: string;
  customerPoNumber: string;
  customerPoDate?: string;
  quotationId?: string;
  quotationNumber?: string;
  quotationRevision?: string;
  salespersonName?: string;
  orderDate: string;
  deliveryDate: string;
  expectedDeliveryDate?: string;
  priority?: 'low' | 'normal' | 'urgent';
  status: SalesOrderStatus;
  subtotal: number;
  taxableAmount?: number;
  cgstAmount: number;
  sgstAmount: number;
  igstAmount: number;
  grandTotal: number;
  items: SalesOrderItem[];
  advancePercentage?: number; // e.g. 20% Advance per Master SOP
  advanceAmount?: number;     // e.g. ₹11,800 on ₹59,000 order
  advancePaid?: boolean;
  advanceUtrRef?: string;
  proformaNumber?: string;
  workReleased?: boolean;
  paymentTerms?: string;
  deliveryTerms?: string;
  freightTerms?: string;
  packingTerms?: string;
  billingAddress?: string;
  shippingAddress?: string;
  customerGstin?: string;
  state?: string;
  pincode?: string;
  contactPerson?: string;
  phone?: string;
  email?: string;
  cancellationReason?: string;
  statusHistory?: SalesOrderStatusHistory[];
  notes?: string;
  createdBy: string;
  createdAt?: string;
  updatedAt?: string;
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

export type PurchaseRequisitionStatus =
  | 'draft'
  | 'submitted'
  | 'pending_approval'
  | 'approved'
  | 'rejected'
  | 'converted_to_rfq'
  | 'converted_to_po'
  | 'cancelled';

export interface PurchaseRequisitionItem {
  id: string;
  itemId?: string;
  itemCode: string;
  itemName: string;
  description?: string;
  specifications?: string;
  quantity: number;
  uom: string;
  estimatedUnitRate?: number;
  estimatedTotal?: number;
  notes?: string;
}

export interface PurchaseRequisition {
  id: string;
  companyId: string;
  prNumber: string; // PR-2026-00001
  requisitionDate: string;
  requiredByDate: string;
  requestedBy: string;
  department: string;
  priority: 'low' | 'normal' | 'urgent';
  purpose: string;
  items: PurchaseRequisitionItem[];
  totalEstimatedAmount: number;
  status: PurchaseRequisitionStatus;
  preferredVendorId?: string;
  preferredVendorName?: string;
  approvalRemarks?: string;
  approvedBy?: string;
  approvedAt?: string;
  rejectedBy?: string;
  rejectedAt?: string;
  rejectionReason?: string;
  convertedRfqId?: string;
  convertedPoId?: string;
  notes?: string;
  createdBy: string;
  createdAt: string;
  updatedAt?: string;
}

export interface VendorQuoteItem {
  id: string;
  itemId: string;
  itemCode: string;
  itemName: string;
  quantity: number;
  unitRate: number;
  discountPercent?: number;
  taxableAmount: number;
  gstRate: number;
  gstAmount: number;
  totalAmount: number;
  leadTimeDays?: number;
}

export interface VendorQuotation {
  id: string;
  companyId: string;
  rfqId: string;
  rfqNumber: string;
  quoteNumber: string; // VQ-2026-00001
  supplierId: string;
  supplierName: string;
  supplierQuoteRef: string;
  quoteDate: string;
  validUntil: string;
  deliveryDays: number;
  paymentTerms?: string;
  subtotal: number;
  taxableAmount: number;
  gstAmount: number;
  freightAmount: number;
  otherCharges: number;
  grandTotal: number;
  isWinningQuote?: boolean;
  selectionReason?: string;
  notes?: string;
  items: VendorQuoteItem[];
  createdAt: string;
}

export type PurchaseOrderStatus =
  | 'draft'
  | 'pending_approval'
  | 'approved'
  | 'ordered'
  | 'sent_to_vendor'
  | 'confirmed_by_vendor'
  | 'partially_received'
  | 'fully_received'
  | 'received'
  | 'closed'
  | 'cancelled';

export interface PurchaseOrderItem {
  id: string;
  itemId: string;
  itemCode: string;
  itemName: string;
  description?: string;
  specs?: string;
  hsnSac?: string;
  quantity: number;
  unitPrice: number;
  discountPercent?: number;
  taxableAmount?: number;
  gstRate: number;
  taxAmount: number;
  totalAmount: number;
  receivedQuantity: number;
  tolerancePercentage?: number; // e.g. 5% tolerance for sheet metal / bulk
}

export interface PurchaseOrder {
  id: string;
  companyId: string;
  poNumber: string;
  supplierId: string;
  supplierName: string;
  supplierReference?: string;
  requisitionId?: string;
  requisitionNumber?: string;
  rfqId?: string;
  rfqNumber?: string;
  vendorQuoteId?: string;
  vendorQuoteRef?: string;
  orderDate: string;
  expectedDate: string;
  deliveryLocation?: string;
  assignedBuyer?: string;
  priority?: 'low' | 'normal' | 'urgent';
  status: PurchaseOrderStatus;
  subtotal: number;
  taxableAmount?: number;
  cgstAmount: number;
  sgstAmount: number;
  igstAmount: number;
  grandTotal: number;
  items: PurchaseOrderItem[];
  tolerancePercentage?: number; // e.g. 5% overall order tolerance
  deliveryGodown?: string;
  paymentTerms?: string;
  deliveryTerms?: string;
  freightTerms?: string;
  packingTerms?: string;
  cancellationReason?: string;
  notes?: string;
  createdBy?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface GoodsReceiptNoteItem {
  itemId: string;
  itemCode: string;
  itemName: string;
  uom?: string;
  orderedQuantity?: number;
  previouslyReceivedQuantity?: number;
  currentReceivedQuantity?: number;
  receivedQuantity?: number;
  acceptedQuantity?: number;
  rejectedQuantity?: number;
  rejectionReason?: string;
  batchNumber: string;
  qcStatus?: string;
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
  deliveryChallanNo?: string;
  vehicleNumber?: string;
  receivedBy?: string;
  qcStatus: 'pending_inspection' | 'inspected_passed' | 'quarantine_failed';
  toleranceAccepted?: boolean;
  isStockPosted?: boolean;
  items: GoodsReceiptNoteItem[];
  notes?: string;
  createdAt?: string;
}

export interface PurchaseBill {
  id: string;
  companyId: string;
  billNumber: string; // PB-2026-00001
  supplierInvoiceNumber: string;
  invoiceDate: string;
  supplierId: string;
  supplierName: string;
  purchaseOrderId?: string;
  poNumber?: string;
  grnId?: string;
  grnNumber?: string;
  taxableAmount: number;
  cgstAmount: number;
  sgstAmount: number;
  igstAmount: number;
  totalAmount: number;
  dueDate: string;
  paymentStatus: 'unpaid' | 'partially_paid' | 'paid';
  matchStatus: 'matched' | 'variance_detected' | 'pending_match';
  notes?: string;
  createdAt: string;
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
  createdAt?: string;
  materialsIssued?: boolean;
  masterQrCode?: string;
  routingStages?: RoutingStage[];
  directLabourCost?: number;
  overheadCost?: number;
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
  grandTotal?: number;
  balanceDue?: number;
  customerName?: string;
  advanceDeducted?: number; // e.g. ₹11,800 advance auto-credited on final invoice
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

export interface GeneralLedgerEntry {
  id: string;
  companyId: string;
  entryDate: string;
  accountCode: string;
  accountName: string;
  debitAmount: number;
  creditAmount: number;
  narration: string;
  referenceType?: string;
  referenceId?: string;
}

export interface AuditLog {
  id: string;
  companyId: string;
  userName: string;
  action: 'CREATE' | 'UPDATE' | 'DELETE' | 'STATUS_CHANGE' | 'STOCK_MOVE' | 'AWARD' | 'PROFORMA' | 'PAYMENT';
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

// ==============================================================================
// Codozent One (HOLISTIC) DOMAIN TYPES
// Multi-Tenant Modular ERP Modules
// ==============================================================================

// --- 1. CRM & Lead Management ---
export type CrmLeadStatus =
  | 'new'
  | 'contacted'
  | 'qualified'
  | 'requirement_understanding'
  | 'quotation_preparation'
  | 'quotation_sent'
  | 'negotiation'
  | 'won'
  | 'lost'
  | 'on_hold'
  | 'proposal'; // Backwards compatibility for legacy records

export type CrmLeadPriority = 'low' | 'medium' | 'high' | 'urgent';

export type CrmLeadSource =
  | 'indiamart'
  | 'justdial'
  | 'trade_fair'
  | 'website'
  | 'referral'
  | 'phone'
  | 'email'
  | 'meta_ads'
  | 'google'
  | 'direct'
  | 'whatsapp'
  | 'other';

export interface CrmScoreFactor {
  factor: string;
  points: number;
  maxPoints: number;
  reason: string;
}

export interface CrmLead {
  id: string;
  companyId: string;
  leadNumber?: string; // e.g. LEAD-2026-0001
  title: string;
  contactName: string;
  designation?: string;
  companyName: string;
  email?: string;
  phone: string;
  alternatePhone?: string;
  preferredContactMethod?: 'phone' | 'email' | 'whatsapp' | 'visit';
  website?: string;
  industry?: string;
  companyType?: string;
  companySize?: string;
  gstin?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  pincode?: string;
  source: CrmLeadSource;
  sourceDetails?: string;
  productInterest?: string;
  requirementDescription?: string;
  targetQuantity?: number;
  targetDeliveryDate?: string;
  dealValue: number; // Estimated deal value
  estimatedValue?: number; // Alias for dealValue
  winProbability: number;
  expectedClosingDate?: string;
  priority: CrmLeadPriority;
  status: CrmLeadStatus;
  assignedTo: string;
  assignedToName?: string;
  lostReason?: string;
  lostNotes?: string;
  onHoldReason?: string;
  score?: number; // 0 - 100
  scoreBreakdown?: CrmScoreFactor[];
  convertedCustomerId?: string;
  convertedCustomerName?: string;
  convertedQuotationId?: string;
  convertedQuotationNumber?: string;
  nextFollowupDate?: string;
  nextFollowupTime?: string;
  nextFollowupType?: 'call' | 'meeting' | 'email' | 'whatsapp' | 'other';
  nextFollowupNotes?: string;
  notes?: string;
  internalNotes?: string;
  tags?: string[];
  consentGranted: boolean; // DPDP statutory compliance
  isArchived?: boolean;
  createdBy?: string;
  updatedBy?: string;
  createdAt: string;
  updatedAt?: string;
  lastContactDate?: string;
}

export type CrmActivityType =
  | 'note'
  | 'call'
  | 'email'
  | 'meeting'
  | 'whatsapp'
  | 'stage_change'
  | 'assignment'
  | 'quotation_created'
  | 'followup_created'
  | 'followup_completed'
  | 'lead_created'
  | 'document_uploaded';

export interface CrmLeadActivity {
  id: string;
  leadId: string;
  companyId: string;
  type: CrmActivityType;
  title: string;
  description?: string;
  performedBy: string;
  performedAt: string;
  metadata?: Record<string, any>;
}

export type CrmFollowupOutcome =
  | 'pending'
  | 'connected'
  | 'no_answer'
  | 'interested'
  | 'not_interested'
  | 'meeting_scheduled'
  | 'requirement_received'
  | 'call_back_later'
  | 'rescheduled';

export interface CrmLeadFollowup {
  id: string;
  leadId: string;
  companyId: string;
  scheduledDate: string; // YYYY-MM-DD
  scheduledTime?: string; // HH:mm
  type: 'call' | 'meeting' | 'email' | 'whatsapp' | 'other';
  assignedTo: string;
  assignedToName?: string;
  title: string;
  notes?: string;
  isCompleted: boolean;
  completedAt?: string;
  completedBy?: string;
  outcome?: CrmFollowupOutcome;
  outcomeNotes?: string;
  reminderMinutesBefore?: number;
  createdAt: string;
  updatedAt?: string;
}

export interface CrmLeadDocument {
  id: string;
  leadId: string;
  companyId: string;
  fileName: string;
  fileSize: number;
  fileType: string;
  storagePath: string;
  fileUrl?: string;
  uploadedBy: string;
  uploadedAt: string;
  notes?: string;
}

// --- 2. Work & Project Management ---
export interface WorkProject {
  id: string;
  companyId: string;
  name: string;
  clientName: string;
  status: 'planning' | 'active' | 'on_hold' | 'completed';
  budget: number;
  progressPercentage: number;
  startDate: string;
  targetEndDate: string;
  managerName: string;
  milestones: { id: string; title: string; completed: boolean; dueDate: string }[];
}

export interface WorkTask {
  id: string;
  companyId: string;
  projectId?: string;
  projectName?: string;
  title: string;
  description?: string;
  assignedTo: string;
  status: 'todo' | 'in_progress' | 'review' | 'done';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  estimatedHours: number;
  loggedHours: number;
  dueDate: string;
}

// --- 3. Khatabook (Jama / Udhar & Daily Daybook) ---
export interface KhataEntry {
  id: string;
  companyId: string;
  entryDate: string;
  partyType: 'customer' | 'supplier' | 'other';
  partyId?: string;
  partyName: string;
  phone?: string;
  type: 'jama' | 'udhar'; // jama = received/credit in, udhar = given/credit out
  amount: number;
  description: string;
  billNumber?: string;
  paymentMode?: 'cash' | 'upi' | 'bank' | 'cheque';
  whatsappSent?: boolean;
  runningBalance?: number;
}

// --- 4. GST Returns & 2B Compliance ---
export interface GstSummary {
  financialYear: string;
  returnPeriod: string;
  grossB2BSales: number;
  b2bCount: number;
  outwardTaxableValue: number;
  outputCgst: number;
  outputSgst: number;
  outputIgst: number;
  totalOutputTax: number;
  inwardTaxableValue: number;
  itcEligibleCgst: number;
  itcEligibleSgst: number;
  itcEligibleIgst: number;
  totalItc: number;
  itcReversal180Days: number;
  netTaxPayable: number;
  challanStatus: 'pending' | 'generated' | 'paid';
}

export interface Gst2BMatchRecord {
  id: string;
  companyId: string;
  supplierName: string;
  supplierGstin: string;
  invoiceNumber: string;
  invoiceDate: string;
  portalTaxableValue: number;
  portalTaxAmount: number;
  booksTaxableValue: number;
  booksTaxAmount: number;
  matchStatus: 'matched' | 'mismatched' | 'missing_in_books' | 'missing_on_portal';
  itcAction: 'claim' | 'hold' | 'reverse';
}

// --- 5. CA Desk (Auditor & Statutory Collaboration) ---
export interface CADeskQuery {
  id: string;
  companyId: string;
  caName: string;
  category: 'depreciation' | 'stock_valuation' | 'msme_45day' | 'gst_reconciliation' | 'bank_confirmation';
  subject: string;
  details: string;
  status: 'open' | 'answered' | 'resolved';
  clientResponse?: string;
  resolvedAt?: string;
  createdAt: string;
}

export interface MsmeVendorScrutiny {
  id: string;
  supplierName: string;
  gstin: string;
  msmeRegistrationNo: string;
  invoiceNumber: string;
  invoiceDate: string;
  billAmount: number;
  dueDate: string;
  overdueDays: number;
  isSection43BhBreach: boolean;
  riskLevel: 'safe' | 'warning' | 'breach';
}

// --- 6. Counter / Point of Sale ---
export interface CounterSale {
  id: string;
  companyId: string;
  receiptNumber: string;
  timestamp: string;
  cashierName: string;
  customerPhone?: string;
  paymentMode: 'cash' | 'upi' | 'card' | 'split';
  subtotal: number;
  discountAmount: number;
  gstAmount: number;
  totalAmount: number;
  cashTendered?: number;
  changeReturned?: number;
  items: {
    itemId: string;
    itemCode: string;
    itemName: string;
    quantity: number;
    unitPrice: number;
    taxRate: number;
    total: number;
  }[];
}

// --- 7. HRMS & Payroll (Indian Statutory) ---
export interface HrmsEmployee {
  id: string;
  companyId: string;
  employeeCode: string;
  name: string;
  designation: string;
  department: string;
  phone: string;
  email: string;
  pan: string;
  uanPf: string;
  esiNo: string;
  bankAccount: string;
  bankIfsc: string;
  joiningDate: string;
  status: 'active' | 'on_leave' | 'terminated';
  shift: 'General (9am-6pm)' | 'Shift A (6am-2pm)' | 'Shift B (2pm-10pm)' | 'Shift C (10pm-6am)';
  monthlyGrossSalary: number;
  basicPay: number;
  hra: number;
  specialAllowance: number;
}

export interface HrmsAttendanceRecord {
  id: string;
  companyId: string;
  employeeId: string;
  employeeName: string;
  date: string;
  status: 'present' | 'late' | 'absent' | 'half_day' | 'paid_leave';
  inTime?: string;
  outTime?: string;
  overtimeHours?: number;
}

export interface HrmsPayrollItem {
  id: string;
  employeeId: string;
  employeeName: string;
  employeeCode: string;
  month: string;
  workingDays: number;
  daysPresent: number;
  grossSalary: number;
  basic: number;
  hra: number;
  pfDeduction: number;
  esiDeduction: number;
  professionalTax: number;
  salaryAdvanceDeduction: number;
  netPayable: number;
  status: 'draft' | 'processed' | 'disbursed';
}

// --- 8. Customer Support Desk ---
export interface SupportTicket {
  id: string;
  companyId: string;
  ticketNumber: string;
  customerId?: string;
  customerName: string;
  customerEmail?: string;
  customerPhone: string;
  subject: string;
  category: 'quality_issue' | 'delivery_delay' | 'billing_discrepancy' | 'order_inquiry' | 'general';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'open' | 'in_progress' | 'waiting_on_client' | 'resolved';
  assignedTo: string;
  createdAt: string;
  slaHoursRemaining: number;
  messages: {
    id: string;
    sender: string;
    senderType: 'staff' | 'customer';
    message: string;
    timestamp: string;
  }[];
}

// --- 9. AI Assistant & WhatsApp Copilot ---
export interface AiAssistantMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
  actionSuggested?: {
    title: string;
    module: string;
    actionPayload?: any;
  };
}


