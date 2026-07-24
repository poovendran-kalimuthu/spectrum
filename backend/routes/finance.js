import express from 'express';
import {
  getFinanceDetails,
  updateAllottedBudget,
  addExpense,
  updateExpense,
  deleteExpense
} from '../controllers/financeController.js';
import { protect, adminProtect, coordinatorProtect } from '../middleware/authMiddleware.js';

const router = express.Router();

// Get financial status (allotted, spent, available) and expenses
router.get('/', protect, coordinatorProtect, getFinanceDetails);

// Update global allotted budget (Super Admin only)
router.put('/budget', protect, adminProtect, updateAllottedBudget);

// Add new expense (Coordinators/Admins)
router.post('/expense', protect, coordinatorProtect, addExpense);

// Update/Edit existing expense (Coordinators/Admins)
router.put('/expense/:expenseId', protect, coordinatorProtect, updateExpense);

// Delete an expense (Coordinators/Admins)
router.delete('/expense/:expenseId', protect, coordinatorProtect, deleteExpense);

export default router;
