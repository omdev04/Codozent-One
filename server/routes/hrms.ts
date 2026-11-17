import { Router, Request, Response, NextFunction } from 'express';
import { db } from '../db/store';
import { HrmsEmployee, HrmsAttendanceRecord } from '../../src/types/erp';

const router = Router({ mergeParams: true });

// GET /api/companies/:company_id/hrms/employees
router.get('/employees', (req: Request, res: Response, next: NextFunction) => {
  try {
    const { company_id } = req.params;
    const emps = db.getEmployees(company_id);
    res.status(200).json({ success: true, data: emps });
  } catch (err) {
    next(err);
  }
});

// POST /api/companies/:company_id/hrms/employees
router.post('/employees', (req: Request, res: Response, next: NextFunction) => {
  try {
    const { company_id } = req.params;
    const { name, designation, department, phone, email, pan, uanPf, esiNo, bankAccount, bankIfsc, shift, monthlyGrossSalary } = req.body;

    if (!name || !designation) {
      return res.status(400).json({ success: false, error: 'Name and Designation are required' });
    }

    const employeeCode = `EMP-${String(db.getEmployees(company_id).length + 1).padStart(4, '0')}`;
    const gross = Number(monthlyGrossSalary) || 25000;
    const basic = Math.round(gross * 0.5);
    const hra = Math.round(gross * 0.3);
    const specialAllowance = Math.max(0, gross - basic - hra);

    const newEmp: HrmsEmployee = {
      id: `emp-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      companyId: company_id,
      employeeCode,
      name,
      designation,
      department: department || 'Operations',
      phone: phone || '',
      email: email || '',
      pan: pan || '',
      uanPf: uanPf || '',
      esiNo: esiNo || '',
      bankAccount: bankAccount || '',
      bankIfsc: bankIfsc || '',
      joiningDate: new Date().toISOString().split('T')[0],
      status: 'active',
      shift: shift || 'General (9am-6pm)',
      monthlyGrossSalary: gross,
      basicPay: basic,
      hra,
      specialAllowance
    };

    const created = db.createEmployee(newEmp);
    res.status(201).json({ success: true, data: created });
  } catch (err) {
    next(err);
  }
});

// GET /api/companies/:company_id/hrms/attendance
router.get('/attendance', (req: Request, res: Response, next: NextFunction) => {
  try {
    const { company_id } = req.params;
    const { date } = req.query;
    const records = db.getAttendance(company_id, date as string);
    res.status(200).json({ success: true, data: records });
  } catch (err) {
    next(err);
  }
});

// POST /api/companies/:company_id/hrms/attendance
router.post('/attendance', (req: Request, res: Response, next: NextFunction) => {
  try {
    const { company_id } = req.params;
    const { employeeId, employeeName, date, status, inTime, outTime, overtimeHours } = req.body;

    if (!employeeId || !date || !status) {
      return res.status(400).json({ success: false, error: 'Employee ID, date, and status are required' });
    }

    const newRecord: HrmsAttendanceRecord = {
      id: `att-${Date.now()}-${employeeId}`,
      companyId: company_id,
      employeeId,
      employeeName: employeeName || 'Staff',
      date,
      status,
      inTime: inTime || '09:00',
      outTime: outTime || '18:00',
      overtimeHours: Number(overtimeHours) || 0
    };

    const recorded = db.recordAttendance(newRecord);
    res.status(200).json({ success: true, data: recorded });
  } catch (err) {
    next(err);
  }
});

// GET /api/companies/:company_id/hrms/payroll
router.get('/payroll', (req: Request, res: Response, next: NextFunction) => {
  try {
    const { company_id } = req.params;
    const { month } = req.query;
    const payrolls = db.getPayrolls(company_id, month as string);
    res.status(200).json({ success: true, data: payrolls });
  } catch (err) {
    next(err);
  }
});

// POST /api/companies/:company_id/hrms/payroll/run
router.post('/payroll/run', (req: Request, res: Response, next: NextFunction) => {
  try {
    const { company_id } = req.params;
    const { month } = req.body;
    const runMonth = month || 'March 2026';
    const payrollItems = db.generatePayrollRun(company_id, runMonth);
    res.status(200).json({ 
      success: true, 
      message: `Indian statutory payroll processed for ${runMonth}`, 
      data: payrollItems 
    });
  } catch (err) {
    next(err);
  }
});

export default router;

