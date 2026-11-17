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
  Quotation,
  GeneralLedgerEntry
} from '../types/erp';

// Clean production constants - All data strictly populated from live Backend / Supabase
export const INITIAL_COMPANIES: Company[] = [];
export const INITIAL_USERS: CompanyUser[] = [];
export const INITIAL_WAREHOUSES: Warehouse[] = [];
export const INITIAL_CHART_OF_ACCOUNTS: ChartOfAccount[] = [];
export const INITIAL_ITEMS: Item[] = [];
export const INITIAL_BOMS: BillOfMaterials[] = [];
export const INITIAL_CUSTOMERS: Customer[] = [];
export const INITIAL_SUPPLIERS: Supplier[] = [];
export const INITIAL_SALES_ORDERS: SalesOrder[] = [];
export const INITIAL_PURCHASE_ORDERS: PurchaseOrder[] = [];
export const INITIAL_GRNS: GoodsReceiptNote[] = [];
export const INITIAL_WORK_ORDERS: WorkOrder[] = [];
export const INITIAL_PRODUCTION_ENTRIES: ProductionEntry[] = [];
export const INITIAL_QC_INSPECTIONS: QualityInspection[] = [];
export const INITIAL_STOCK_TRANSACTIONS: StockTransaction[] = [];
export const INITIAL_INVOICES: Invoice[] = [];
export const INITIAL_PAYMENTS: Payment[] = [];
export const INITIAL_DELIVERY_CHALLANS: DeliveryChallan[] = [];
export const INITIAL_QUOTATIONS: Quotation[] = [];
export const INITIAL_LEDGER_ENTRIES: GeneralLedgerEntry[] = [];
