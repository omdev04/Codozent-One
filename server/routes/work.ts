import { Router, Request, Response, NextFunction } from 'express';
import { db } from '../db/store';
import { WorkProject, WorkTask } from '../../src/types/erp';

const router = Router({ mergeParams: true });

// GET /api/companies/:company_id/work/projects
router.get('/projects', (req: Request, res: Response, next: NextFunction) => {
  try {
    const { company_id } = req.params;
    const projects = db.getProjects(company_id);
    res.status(200).json({ success: true, data: projects });
  } catch (err) {
    next(err);
  }
});

// POST /api/companies/:company_id/work/projects
router.post('/projects', (req: Request, res: Response, next: NextFunction) => {
  try {
    const { company_id } = req.params;
    const { name, clientName, status, budget, startDate, targetEndDate, managerName, milestones } = req.body;

    if (!name) {
      return res.status(400).json({ success: false, error: 'Project name is required' });
    }

    const newProject: WorkProject = {
      id: `proj-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      companyId: company_id,
      name,
      clientName: clientName || 'Internal',
      status: status || 'active',
      budget: Number(budget) || 0,
      progressPercentage: 0,
      startDate: startDate || new Date().toISOString().split('T')[0],
      targetEndDate: targetEndDate || new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
      managerName: managerName || 'Project Lead',
      milestones: milestones || []
    };

    const created = db.createProject(newProject);
    res.status(201).json({ success: true, data: created });
  } catch (err) {
    next(err);
  }
});

// GET /api/companies/:company_id/work/tasks
router.get('/tasks', (req: Request, res: Response, next: NextFunction) => {
  try {
    const { company_id } = req.params;
    const tasks = db.getTasks(company_id);
    res.status(200).json({ success: true, data: tasks });
  } catch (err) {
    next(err);
  }
});

// POST /api/companies/:company_id/work/tasks
router.post('/tasks', (req: Request, res: Response, next: NextFunction) => {
  try {
    const { company_id } = req.params;
    const { title, projectId, projectName, description, assignedTo, status, priority, estimatedHours, dueDate } = req.body;

    if (!title) {
      return res.status(400).json({ success: false, error: 'Task title is required' });
    }

    const newTask: WorkTask = {
      id: `task-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      companyId: company_id,
      projectId,
      projectName,
      title,
      description: description || '',
      assignedTo: assignedTo || 'Unassigned',
      status: status || 'todo',
      priority: priority || 'medium',
      estimatedHours: Number(estimatedHours) || 4,
      loggedHours: 0,
      dueDate: dueDate || new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0]
    };

    const created = db.createTask(newTask);
    res.status(201).json({ success: true, data: created });
  } catch (err) {
    next(err);
  }
});

// PATCH /api/companies/:company_id/work/tasks/:id
router.patch('/tasks/:id', (req: Request, res: Response, next: NextFunction) => {
  try {
    const { company_id, id } = req.params;
    const updated = db.updateTask(company_id, id, req.body);
    if (!updated) {
      return res.status(404).json({ success: false, error: 'Task not found' });
    }
    res.status(200).json({ success: true, data: updated });
  } catch (err) {
    next(err);
  }
});

export default router;

