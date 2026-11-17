import React, { useState } from 'react';
import { 
  Users, 
  Calendar, 
  DollarSign, 
  Plus, 
  CheckCircle2, 
  Clock, 
  Printer, 
  Building2, 
  FileText,
  Search,
  Check,
  X,
  CreditCard
} from 'lucide-react';
import { useERP } from '../../context/ERPContext';
import { HrmsEmployee, HrmsPayrollItem } from '../../types/erp';

export const HrmsModule: React.FC = () => {
  const { 
    employees, 
    createEmployee, 
    attendance, 
    recordAttendance, 
    payrolls, 
    runPayroll,
    activeCompany 
  } = useERP();

  const [activeTab, setActiveTab] = useState<'employees' | 'attendance' | 'payroll'>('employees');
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddEmployeeOpen, setIsAddEmployeeOpen] = useState(false);
  const [selectedPayslip, setSelectedPayslip] = useState<HrmsPayrollItem | null>(null);
  const [selectedMonth, setSelectedMonth] = useState('March 2026');
  const [isRunningPayroll, setIsRunningPayroll] = useState(false);

  // New Employee Form
  const [empName, setEmpName] = useState('');
  const [empRole, setEmpRole] = useState('CNC Machinist');
  const [empDept, setEmpDept] = useState('Production');
  const [empPhone, setEmpPhone] = useState('');
  const [empEmail, setEmpEmail] = useState('');
  const [empPan, setEmpPan] = useState('');
  const [empSalary, setEmpSalary] = useState<number | ''>(25000);
  const [isSubmittingEmp, setIsSubmittingEmp] = useState(false);

  const handleAddEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!empName.trim() || !empSalary) return;
    setIsSubmittingEmp(true);
    const basic = Math.round(Number(empSalary) * 0.5);
    const hra = Math.round(Number(empSalary) * 0.3);
    const allowance = Number(empSalary) - basic - hra;
    try {
      await createEmployee({
        name: empName.trim(),
        designation: empRole,
        department: empDept,
        phone: empPhone.trim(),
        email: empEmail.trim() || `${empName.toLowerCase().replace(/\s+/g, '')}@factory.local`,
        pan: empPan.trim() || 'ABCDE1234F',
        uanPf: `1009${Math.floor(10000000 + Math.random() * 90000000)}`,
        esiNo: `31${Math.floor(1000000000 + Math.random() * 9000000000)}`,
        bankAccount: '918237192837',
        bankIfsc: 'HDFC0001234',
        shift: 'General (9am-6pm)',
        monthlyGrossSalary: Number(empSalary),
        basicPay: basic,
        hra: hra,
        specialAllowance: allowance
      });
      setIsAddEmployeeOpen(false);
      setEmpName('');
      setEmpPhone('');
      setEmpEmail('');
      setEmpPan('');
    } catch (err: any) {
      alert(`Failed to add employee: ${err.message}`);
    } finally {
      setIsSubmittingEmp(false);
    }
  };

  const handleMarkAttendance = async (empId: string, status: 'present' | 'absent' | 'half_day' | 'paid_leave') => {
    const emp = employees.find(e => e.id === empId);
    try {
      await recordAttendance({
        employeeId: empId,
        employeeName: emp?.name || 'Employee',
        date: todayStr,
        status,
        inTime: '08:00'
      });
    } catch (err: any) {
      alert(`Attendance error: ${err.message}`);
    }
  };

  const handleRunPayroll = async () => {
    if (!confirm(`Execute statutory Indian payroll run for ${selectedMonth} for all ${employees.length} active employees?`)) return;
    setIsRunningPayroll(true);
    try {
      await runPayroll(selectedMonth);
      alert(`Payroll run complete for ${selectedMonth}! Payslips generated with statutory PF, ESI & PT deductions.`);
    } catch (err: any) {
      alert(`Payroll run failed: ${err.message}`);
    } finally {
      setIsRunningPayroll(false);
    }
  };

  const filteredEmployees = employees.filter(e =>
    e.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    e.employeeCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
    e.department.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const todayStr = new Date().toISOString().split('T')[0];
  const totalSalaries = employees.reduce((sum, e) => sum + (e.monthlyGrossSalary || e.basicPay || 0), 0);

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-canvas border-b border-hairline pb-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-ink-nav mb-1">
            <span>Human Capital</span>
            <span>/</span>
            <span className="text-primary font-medium">HRMS & Labor Compliance</span>
          </div>
          <h1 className="text-2xl font-bold text-ink tracking-tight">HRMS & Statutory Indian Payroll</h1>
          <p className="text-xs text-ink-body mt-0.5">
            Employee master records, daily shopfloor shift attendance, and statutory PF (12%), ESI (0.75%), & PT payroll automation.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsAddEmployeeOpen(true)}
            className="btn-primary text-xs py-1.5 px-3 inline-flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Employee</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-hairline space-x-6 text-xs">
        <button
          onClick={() => setActiveTab('employees')}
          className={`pb-2.5 font-medium border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'employees'
              ? 'border-primary text-primary'
              : 'border-transparent text-ink-nav hover:text-ink'
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          <span>Employee Master ({employees.length})</span>
        </button>
        <button
          onClick={() => setActiveTab('attendance')}
          className={`pb-2.5 font-medium border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'attendance'
              ? 'border-primary text-primary'
              : 'border-transparent text-ink-nav hover:text-ink'
          }`}
        >
          <Calendar className="w-3.5 h-3.5" />
          <span>Daily Shift Punch Desk</span>
        </button>
        <button
          onClick={() => setActiveTab('payroll')}
          className={`pb-2.5 font-medium border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'payroll'
              ? 'border-primary text-primary'
              : 'border-transparent text-ink-nav hover:text-ink'
          }`}
        >
          <DollarSign className="w-3.5 h-3.5" />
          <span>Statutory Indian Payroll Run</span>
        </button>
      </div>

      {/* Tab 1: Employee Directory */}
      {activeTab === 'employees' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-canvas p-3 border border-hairline rounded-md">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 text-ink-nav absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search by code, name, department..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-chrome border border-hairline rounded-md text-ink"
              />
            </div>
            <div className="text-xs text-ink-nav">
              Total Monthly Gross Base: <strong className="text-ink font-mono">₹{totalSalaries.toLocaleString('en-IN')}</strong>
            </div>
          </div>

          <div className="bg-canvas border border-hairline rounded-md overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-chrome text-ink-nav">
                <tr className="border-b border-hairline">
                  <th className="py-2.5 px-3">Emp Code</th>
                  <th className="py-2.5 px-3">Employee Name</th>
                  <th className="py-2.5 px-3">Designation</th>
                  <th className="py-2.5 px-3">Department</th>
                  <th className="py-2.5 px-3">PAN</th>
                  <th className="py-2.5 px-3">Phone</th>
                  <th className="py-2.5 px-3 text-right">Gross Salary (₹)</th>
                  <th className="py-2.5 px-3 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-hairline text-ink-body">
                {filteredEmployees.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-ink-meta">
                      No employees registered. Click "Add Employee" to build directory.
                    </td>
                  </tr>
                ) : (
                  filteredEmployees.map((emp) => (
                    <tr key={emp.id} className="hover:bg-chrome/50">
                      <td className="py-3 px-3 font-mono font-medium text-primary">{emp.employeeCode}</td>
                      <td className="py-3 px-3 font-semibold text-ink">{emp.name}</td>
                      <td className="py-3 px-3 text-ink-body">{emp.designation}</td>
                      <td className="py-3 px-3">
                        <span className="px-2 py-0.5 bg-chrome border border-hairline rounded text-[10px]">
                          {emp.department}
                        </span>
                      </td>
                      <td className="py-3 px-3 font-mono text-ink-meta text-[11px]">
                        {emp.pan || '—'}
                      </td>
                      <td className="py-3 px-3 font-mono text-ink-nav">{emp.phone || '—'}</td>
                      <td className="py-3 px-3 text-right font-mono font-medium text-ink">
                        ₹{(emp.monthlyGrossSalary || emp.basicPay || 0).toLocaleString('en-IN')}
                      </td>
                      <td className="py-3 px-3 text-center">
                        <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded text-[10px] font-medium">
                          Active
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 2: Attendance Punch Desk */}
      {activeTab === 'attendance' && (
        <div className="space-y-4">
          <div className="p-3 bg-chrome border border-hairline rounded-md flex items-center justify-between text-xs">
            <span className="font-semibold text-ink">Date: {todayStr} (Shift A - Plant Floor)</span>
            <span className="text-ink-nav">Mark shift presence for automated monthly wage accrual.</span>
          </div>

          <div className="bg-canvas border border-hairline rounded-md overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-chrome text-ink-nav">
                <tr className="border-b border-hairline">
                  <th className="py-2.5 px-3">Emp Code</th>
                  <th className="py-2.5 px-3">Employee Name</th>
                  <th className="py-2.5 px-3">Department</th>
                  <th className="py-2.5 px-3">Today's Status</th>
                  <th className="py-2.5 px-3 text-center">Quick Attendance Punch</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-hairline text-ink-body">
                {employees.map((emp) => {
                  const todayRec = attendance.find(a => a.employeeId === emp.id && a.date === todayStr);
                  const status = todayRec ? todayRec.status : 'unmarked';

                  return (
                    <tr key={emp.id} className="hover:bg-chrome/50">
                      <td className="py-3 px-3 font-mono text-primary">{emp.employeeCode}</td>
                      <td className="py-3 px-3 font-semibold text-ink">{emp.name}</td>
                      <td className="py-3 px-3 text-ink-nav">{emp.department}</td>
                      <td className="py-3 px-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          status === 'present'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : status === 'half_day'
                            ? 'bg-amber-50 text-amber-700 border border-amber-200'
                            : status === 'absent'
                            ? 'bg-red-50 text-red-700 border border-red-200'
                            : status === 'paid_leave'
                            ? 'bg-blue-50 text-blue-700 border border-blue-200'
                            : 'bg-chrome text-ink-meta border border-hairline'
                        }`}>
                          {status.toUpperCase()}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => handleMarkAttendance(emp.id, 'present')}
                            className={`px-2 py-1 rounded text-[10px] font-medium border cursor-pointer ${
                              status === 'present' ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-canvas text-emerald-700 border-emerald-300 hover:bg-emerald-50'
                            }`}
                          >
                            Present
                          </button>
                          <button
                            onClick={() => handleMarkAttendance(emp.id, 'half_day')}
                            className={`px-2 py-1 rounded text-[10px] font-medium border cursor-pointer ${
                              status === 'half_day' ? 'bg-amber-500 text-white border-amber-500' : 'bg-canvas text-amber-700 border-amber-300 hover:bg-amber-50'
                            }`}
                          >
                            Half Day
                          </button>
                          <button
                            onClick={() => handleMarkAttendance(emp.id, 'paid_leave')}
                            className={`px-2 py-1 rounded text-[10px] font-medium border cursor-pointer ${
                              status === 'paid_leave' ? 'bg-blue-600 text-white border-blue-600' : 'bg-canvas text-blue-700 border-blue-300 hover:bg-blue-50'
                            }`}
                          >
                            Paid Leave
                          </button>
                          <button
                            onClick={() => handleMarkAttendance(emp.id, 'absent')}
                            className={`px-2 py-1 rounded text-[10px] font-medium border cursor-pointer ${
                              status === 'absent' ? 'bg-red-600 text-white border-red-600' : 'bg-canvas text-red-700 border-red-300 hover:bg-red-50'
                            }`}
                          >
                            Absent
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 3: Statutory Indian Payroll */}
      {activeTab === 'payroll' && (
        <div className="space-y-4">
          <div className="p-4 bg-band-blue border border-primary/20 rounded-md flex flex-col md:flex-row md:items-center justify-between gap-4 text-xs">
            <div>
              <div className="font-bold text-ink text-sm">Indian Statutory Payroll Engine</div>
              <p className="text-ink-body mt-0.5">
                Calculates Basic + HRA, Employee PF (12%), ESI (0.75%), and Professional Tax (PT ₹200).
              </p>
            </div>
            <div className="flex items-center gap-3">
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="text-xs px-3 py-1.5 bg-canvas border border-hairline rounded text-ink"
              >
                <option value="March 2026">March 2026</option>
                <option value="February 2026">February 2026</option>
                <option value="January 2026">January 2026</option>
              </select>
              <button
                onClick={handleRunPayroll}
                disabled={isRunningPayroll}
                className="btn-primary text-xs py-1.5 px-3.5 inline-flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <DollarSign className="w-3.5 h-3.5" />
                <span>{isRunningPayroll ? 'Calculating...' : 'Run Monthly Payroll'}</span>
              </button>
            </div>
          </div>

          <div className="bg-canvas border border-hairline rounded-md overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-chrome text-ink-nav">
                <tr className="border-b border-hairline">
                  <th className="py-2.5 px-3">Emp Name</th>
                  <th className="py-2.5 px-3">Month</th>
                  <th className="py-2.5 px-3 text-right">Basic (₹)</th>
                  <th className="py-2.5 px-3 text-right">HRA (₹)</th>
                  <th className="py-2.5 px-3 text-right">Gross (₹)</th>
                  <th className="py-2.5 px-3 text-right">PF 12% (₹)</th>
                  <th className="py-2.5 px-3 text-right">ESI 0.75% (₹)</th>
                  <th className="py-2.5 px-3 text-right">PT (₹)</th>
                  <th className="py-2.5 px-3 text-right">Net Take-Home (₹)</th>
                  <th className="py-2.5 px-3 text-center">Payslip</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-hairline text-ink-body">
                {payrolls.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="py-8 text-center text-ink-meta">
                      No payroll records processed for this month. Click "Run Monthly Payroll" to compute.
                    </td>
                  </tr>
                ) : (
                  payrolls.map((p) => (
                    <tr key={p.id} className="hover:bg-chrome/50">
                      <td className="py-3 px-3 font-semibold text-ink">{p.employeeName}</td>
                      <td className="py-3 px-3 text-ink-nav">{p.month}</td>
                      <td className="py-3 px-3 text-right font-mono">₹{p.basic.toFixed(2)}</td>
                      <td className="py-3 px-3 text-right font-mono">₹{p.hra.toFixed(2)}</td>
                      <td className="py-3 px-3 text-right font-mono font-medium">₹{p.grossSalary.toFixed(2)}</td>
                      <td className="py-3 px-3 text-right font-mono text-red-600">-₹{p.pfDeduction.toFixed(2)}</td>
                      <td className="py-3 px-3 text-right font-mono text-red-600">-₹{p.esiDeduction.toFixed(2)}</td>
                      <td className="py-3 px-3 text-right font-mono text-red-600">-₹{p.professionalTax.toFixed(2)}</td>
                      <td className="py-3 px-3 text-right font-mono font-bold text-primary">
                        ₹{p.netPayable.toFixed(2)}
                      </td>
                      <td className="py-3 px-3 text-center">
                        <button
                          onClick={() => setSelectedPayslip(p)}
                          className="btn-outline text-[11px] py-0.5 px-2 cursor-pointer inline-flex items-center gap-1"
                        >
                          <Printer className="w-3 h-3" />
                          <span>Slip</span>
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add Employee Modal */}
      {isAddEmployeeOpen && (
        <div className="fixed inset-0 bg-ink/30 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-canvas border border-hairline rounded-md max-w-md w-full shadow-lg">
            <div className="p-4 border-b border-hairline flex items-center justify-between bg-chrome">
              <h3 className="text-base font-bold text-ink">Register Factory Employee</h3>
              <button onClick={() => setIsAddEmployeeOpen(false)} className="text-ink-nav hover:text-ink cursor-pointer">
                ✕
              </button>
            </div>
            <form onSubmit={handleAddEmployee} className="p-4 space-y-3">
              <div>
                <label className="block text-xs font-medium text-ink-nav mb-1">Full Name *</label>
                <input
                  type="text"
                  placeholder="e.g. Ramesh Kadam"
                  value={empName}
                  onChange={(e) => setEmpName(e.target.value)}
                  required
                  className="w-full text-xs px-3 py-2 bg-chrome border border-hairline rounded-md text-ink"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-ink-nav mb-1">Designation</label>
                  <input
                    type="text"
                    value={empRole}
                    onChange={(e) => setEmpRole(e.target.value)}
                    className="w-full text-xs px-3 py-2 bg-chrome border border-hairline rounded-md text-ink"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-ink-nav mb-1">Department</label>
                  <select
                    value={empDept}
                    onChange={(e) => setEmpDept(e.target.value)}
                    className="w-full text-xs px-3 py-2 bg-chrome border border-hairline rounded-md text-ink"
                  >
                    <option value="Production">Production</option>
                    <option value="Quality">Quality</option>
                    <option value="Stores / Inventory">Stores / Inventory</option>
                    <option value="Maintenance">Maintenance</option>
                    <option value="Accounts">Accounts</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-ink-nav mb-1">Monthly Gross (₹) *</label>
                  <input
                    type="number"
                    min="5000"
                    value={empSalary}
                    onChange={(e) => setEmpSalary(e.target.value === '' ? '' : Number(e.target.value))}
                    required
                    className="w-full text-xs px-3 py-2 bg-chrome border border-hairline rounded-md text-ink font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-ink-nav mb-1">Phone Number</label>
                  <input
                    type="tel"
                    placeholder="9876543210"
                    value={empPhone}
                    onChange={(e) => setEmpPhone(e.target.value)}
                    className="w-full text-xs px-3 py-2 bg-chrome border border-hairline rounded-md text-ink"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-ink-nav mb-1">Income Tax PAN</label>
                <input
                  type="text"
                  placeholder="ABCDE1234F"
                  value={empPan}
                  onChange={(e) => setEmpPan(e.target.value.toUpperCase())}
                  className="w-full text-xs px-3 py-2 bg-chrome border border-hairline rounded-md text-ink font-mono"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-hairline">
                <button type="button" onClick={() => setIsAddEmployeeOpen(false)} className="btn-outline text-xs px-3 py-1.5 cursor-pointer">
                  Cancel
                </button>
                <button type="submit" disabled={isSubmittingEmp} className="btn-primary text-xs px-4 py-1.5 cursor-pointer">
                  {isSubmittingEmp ? 'Adding...' : 'Register Employee'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Payslip Modal */}
      {selectedPayslip && (
        <div className="fixed inset-0 bg-ink/30 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-canvas border border-hairline rounded-md max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex justify-between border-b border-hairline pb-3">
              <div>
                <h3 className="text-base font-bold text-ink">{activeCompany?.name || 'FactoryFlow ERP'}</h3>
                <span className="text-xs text-ink-meta">Statutory Salary Slip - {selectedPayslip.month}</span>
              </div>
              <button onClick={() => setSelectedPayslip(null)} className="text-ink-nav hover:text-ink cursor-pointer">✕</button>
            </div>

            <div className="p-3 bg-chrome rounded text-xs space-y-1">
              <div className="flex justify-between"><span className="text-ink-nav">Employee Name:</span> <strong className="text-ink">{selectedPayslip.employeeName}</strong></div>
              <div className="flex justify-between"><span className="text-ink-nav">Company PAN:</span> <span className="font-mono">{activeCompany?.pan || 'AAACP0123M'}</span></div>
            </div>

            <div className="grid grid-cols-2 gap-4 text-xs border border-hairline rounded p-3">
              <div className="space-y-1 border-r border-hairline pr-2">
                <span className="font-bold text-ink text-[11px] block border-b border-hairline pb-1">EARNINGS</span>
                <div className="flex justify-between"><span>Basic:</span> <span className="font-mono">₹{selectedPayslip.basic.toFixed(2)}</span></div>
                <div className="flex justify-between"><span>HRA:</span> <span className="font-mono">₹{selectedPayslip.hra.toFixed(2)}</span></div>
                <div className="flex justify-between font-bold pt-1 border-t border-hairline"><span>Gross:</span> <span className="font-mono">₹{selectedPayslip.grossSalary.toFixed(2)}</span></div>
              </div>

              <div className="space-y-1 pl-2">
                <span className="font-bold text-ink text-[11px] block border-b border-hairline pb-1">DEDUCTIONS</span>
                <div className="flex justify-between"><span>PF (12%):</span> <span className="font-mono">₹{selectedPayslip.pfDeduction.toFixed(2)}</span></div>
                <div className="flex justify-between"><span>ESI (0.75%):</span> <span className="font-mono">₹{selectedPayslip.esiDeduction.toFixed(2)}</span></div>
                <div className="flex justify-between"><span>PT (State):</span> <span className="font-mono">₹{selectedPayslip.professionalTax.toFixed(2)}</span></div>
                <div className="flex justify-between font-bold pt-1 border-t border-hairline text-red-600"><span>Total Ded:</span> <span className="font-mono">₹{(selectedPayslip.pfDeduction + selectedPayslip.esiDeduction + selectedPayslip.professionalTax).toFixed(2)}</span></div>
              </div>
            </div>

            <div className="p-3 bg-band-blue rounded border border-primary/20 flex justify-between items-center text-sm">
              <span className="font-bold text-ink">Net Take-Home Salary:</span>
              <span className="font-mono font-extrabold text-primary text-base">₹{selectedPayslip.netPayable.toFixed(2)}</span>
            </div>

            <div className="flex justify-end gap-2">
              <button onClick={() => window.print()} className="btn-outline text-xs py-1.5 px-3 flex items-center gap-1.5 cursor-pointer">
                <Printer className="w-3.5 h-3.5" />
                <span>Print Slip</span>
              </button>
              <button onClick={() => setSelectedPayslip(null)} className="btn-primary text-xs py-1.5 px-4 cursor-pointer">
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
