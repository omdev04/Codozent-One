# FactoryFlow ERP - Integrated Manufacturing Solution (Small Factories)

A modern, cloud-native ERP platform built for small manufacturing units (10–100 employees) in the Chakan–Pune industrial belt (CNC machining, auto components, stamping, sheet metal, and light assembly).

Built following the **FactoryFlow PRD specification** and styled according to the design system in [DESIGN.md](file:///d:/maketoO/DESIGN.md).

---

## 🏭 Core Modules & Features

1. **Multi-Company Tenancy & Role-Based Access Control (RBAC)**
   - Strict `company_id` isolation across all transactions and masters.
   - Pre-configured realistic industrial units:
     - `Apex Precision Auto Components Ltd.` (Chakan MIDC Phase II, Pune)
     - `Chakan Sheet Metal & Fabrication Works` (Bhosari Industrial Estate, Pune)
   - Dynamic company switcher in top navigation bar.
   - RBAC simulation: Owner, Admin, Production Manager, Storekeeper, Supervisor, Shop-Floor Worker, QC Inspector, Accountant, Viewer.

2. **Executive Dashboard**
   - Live plant OEE and output tracking against daily plan.
   - Pending sales lots and revenue metrics.
   - Immediate critical material shortages alerts with 1-click MRP trigger.
   - Financial ledger balances: Bank, Sundry Debtors, Sundry Creditors & GSTR-3B tax liability.

3. **Sales & Order-to-Cash (O2C)**
   - Master list of B2B customers (e.g. Tata Motors CVBU, Mahindra & Mahindra Auto, Bajaj Auto).
   - Sales Orders with line items, delivery commitments, and HSN/SAC codes.
   - 1-click **Release to Production** (creates scheduled Work Orders using active BOM).
   - **Delivery Challan Dispatch**: captures transporter, vehicle number (`MH 12...`), e-Way bill number, decrements finished goods stock, and generates printable delivery challans.
   - **GST Tax Invoices**: auto-calculates CGST (9%) + SGST (9%) or IGST (18%), posts receivables to General Ledger, and generates e-Invoice IRN.

4. **Procure-to-Pay (P2P) & MRP Engine**
   - Master list of suppliers (Jindal Steel, Chakan Fasteners, Maharashtra Bright Bar).
   - **Rule-Based MRP Engine**: Explodes confirmed sales orders against multi-level BOMs minus free stock and pipeline POs.
   - **1-Click PO Generation**: Converts net material shortages into vendor purchase orders instantly.
   - **Goods Receipt Notes (GRN)**: Receiving dock logging with heat/batch numbers and warehouse assignment.
   - **Quarantine Lock**: Material is placed in quarantine pending QC inspection before it can be issued to the shop floor.

5. **Inventory & Stores Control**
   - Master catalog: Raw materials (`EN8 Round Rod 25mm`, `SS304 Hex Bar`), WIP blanks, and Finished Goods (`Transmission Gear Shaft`, `Hydraulic Swivel Adaptor`).
   - Multiple warehouses: Raw Materials Store (`RMS-01`), Shop-Floor WIP Buffer (`WIP-SHOP-01`), Finished Goods Bay (`FGW-01`), and Quarantine (`QR-01`).
   - Perpetual, chronological stock ledger with tamper-proof transaction entries.
   - Low stock reorder threshold alerts.
   - Physical count stock adjustment with audit reconciliation notes.

6. **Manufacturing & Shop-Floor Execution**
   - Multi-level Bills of Materials (BOM) with revision control (`Rev 1.0`, `Rev 1.2`), scrap allowances, and station routing.
   - Work Orders with routing stations (CNC Turning Lathes, Spline Milling, Heat Treatment, Deburring).
   - **Material Issue Lock**: Starting a work order automatically verifies stock availability and decrements raw materials.
   - **Dedicated Shop-Floor Terminal**:
     - Tailored for touchscreens, tablets, and mobile devices on the factory floor.
     - Large tactile buttons (≥48px tap targets) for high-speed operation.
     - Real-time logging of Good Quantity, Rejections (with mandatory defect cause), and Rework.
     - Stripped of all sensitive financial and pricing data.

7. **Quality Assurance & Quality Lock**
   - Incoming vendor receipt inspection & finished goods work order inspection.
   - Micrometer/gauge parameter checkpoints (OD tolerance, concentricity, surface roughness Ra, hardness HRC).
   - **Quality Lock**: Blocks finished goods dispatch and raw material issuance until QC passes.
   - Automated routing of rejected parts to Scrap Quarantine or Rework.

8. **Finance & GST Accounting**
   - Double-entry General Ledger and Chart of Accounts (Assets, Liabilities, Equity, Revenue, Expense).
   - GSTR-1 outward taxable supplies register (with B2B JSON export format).
   - GSTR-3B tax liability calculation with Input Tax Credit (ITC) reconciliation.
   - Customer payment receipts (NEFT/RTGS, UPI, Cheque) and supplier vouchers.
   - Printable GST Tax Invoice view compliant with Indian e-Invoicing format.

9. **Reports & Audit Trail**
   - Daily production output report.
   - Stock valuation and inventory ageing report (FIFO / Weighted Average).
   - Sales & dispatch register.
   - 1-click **Export to CSV / Excel** on all reports.
   - Tamper-proof audit trail of all changes.

---

## 🛠️ Technology Stack & Architecture

- **Frontend**: Vite + React 18 + TypeScript + Tailwind CSS
- **Design Tokens**: Warm cream canvas (`#f5f1ec`), pure white surface lift (`#ffffff`), hairline dividers (`#d3cec6`), charcoal ink (`#111111`), Fin Orange product accent (`#ff5600`), and report analytics palette (as specified in [DESIGN.md](file:///d:/maketoO/DESIGN.md)).
- **Icons**: Lucide React
- **Backend / Database**: Supabase PostgreSQL with Row Level Security (RLS) policies, concurrency-safe stored procedures, and triggers.
- **Dual Architecture**: Runs with an ultra-fast local reactive storage engine with zero latency, and provides direct 1-click sync with any Supabase project via Project URL & Anon Key.

---

## 🚀 Running the Project

### 1. Development Server
```bash
npm run dev
```
Open `http://localhost:5173` in your browser.

### 2. Production Build
```bash
npm run build
npm run preview
```

### 3. Supabase Database Setup
1. The complete PostgreSQL schema is in [supabase/schema.sql](file:///d:/maketoO/supabase/schema.sql).
2. Open your Supabase Project dashboard -> **SQL Editor**.
3. Paste the contents of `supabase/schema.sql` and run it.
4. In the FactoryFlow app, click the **Supabase** badge in the top navigation bar, enter your Project URL and Anon Key, and click **Save & Test Connection**.
