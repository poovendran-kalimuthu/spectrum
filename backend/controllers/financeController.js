import Finance from '../models/Finance.js';
import { logAudit } from '../utils/auditLogger.js';

// @desc    Get finance details (allotted, spent, available, and expenses list)
// @route   GET /api/finance
// @access  Protected (Admin / Coordinators)
export const getFinanceDetails = async (req, res) => {
  try {
    let finance = await Finance.findOne();
    if (!finance) {
      finance = await Finance.create({ allottedBudget: 100000, expenses: [] });
    }

    const totalSpent = finance.expenses.reduce((acc, curr) => acc + curr.amount, 0);
    const available = finance.allottedBudget - totalSpent;

    res.status(200).json({
      success: true,
      finance: {
        _id: finance._id,
        allottedBudget: finance.allottedBudget,
        expenses: finance.expenses,
        totalSpent,
        available
      }
    });
  } catch (error) {
    console.error('Error fetching finance details:', error);
    res.status(500).json({ success: false, message: 'Server error fetching finance data' });
  }
};

// @desc    Update allotted budget
// @route   PUT /api/finance/budget
// @access  Protected (Super Admin only)
export const updateAllottedBudget = async (req, res) => {
  try {
    const { allottedBudget } = req.body;

    if (allottedBudget === undefined || allottedBudget < 0) {
      return res.status(400).json({ success: false, message: 'Invalid allotted budget amount' });
    }

    let finance = await Finance.findOne();
    if (!finance) {
      finance = await Finance.create({ allottedBudget: 100000, expenses: [] });
    }

    const oldBudget = finance.allottedBudget;
    finance.allottedBudget = allottedBudget;
    await finance.save();

    const totalSpent = finance.expenses.reduce((acc, curr) => acc + curr.amount, 0);
    const available = finance.allottedBudget - totalSpent;

    // Log this action to the Audit Trail
    await logAudit(
      'UPDATE_BUDGET',
      `Updated allotted budget from ₹${oldBudget} to ₹${allottedBudget}`,
      req.user._id,
      'Finance',
      finance._id,
      { oldBudget, newBudget: allottedBudget },
      req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress,
      'Global Budget'
    );

    res.status(200).json({
      success: true,
      message: 'Allotted budget updated successfully',
      finance: {
        _id: finance._id,
        allottedBudget: finance.allottedBudget,
        expenses: finance.expenses,
        totalSpent,
        available
      }
    });
  } catch (error) {
    console.error('Error updating allotted budget:', error);
    res.status(500).json({ success: false, message: 'Server error updating budget' });
  }
};

// @desc    Add a spent expense
// @route   POST /api/finance/expense
// @access  Protected (Admin / Coordinators)
export const addExpense = async (req, res) => {
  try {
    const { title, amount, category, date, description } = req.body;

    if (!title || amount === undefined || amount < 0 || !category) {
      return res.status(400).json({ success: false, message: 'Please provide title, positive amount, and category' });
    }

    let finance = await Finance.findOne();
    if (!finance) {
      finance = await Finance.create({ allottedBudget: 100000, expenses: [] });
    }

    finance.expenses.push({
      title,
      amount,
      category,
      date: date || new Date(),
      description
    });

    await finance.save();

    const addedExpense = finance.expenses[finance.expenses.length - 1];
    const totalSpent = finance.expenses.reduce((acc, curr) => acc + curr.amount, 0);
    const available = finance.allottedBudget - totalSpent;

    // Log this action to the Audit Trail
    await logAudit(
      'ADD_EXPENSE',
      `Added expense: ${title} of ₹${amount} under ${category}`,
      req.user._id,
      'Finance',
      finance._id,
      { expense: addedExpense },
      req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress,
      title
    );

    res.status(201).json({
      success: true,
      message: 'Expense added successfully',
      finance: {
        _id: finance._id,
        allottedBudget: finance.allottedBudget,
        expenses: finance.expenses,
        totalSpent,
        available
      }
    });
  } catch (error) {
    console.error('Error adding expense:', error);
    res.status(500).json({ success: false, message: 'Server error adding expense' });
  }
};

// @desc    Update a specific expense
// @route   PUT /api/finance/expense/:expenseId
// @access  Protected (Admin / Coordinators)
export const updateExpense = async (req, res) => {
  try {
    const { expenseId } = req.params;
    const { title, amount, category, date, description } = req.body;

    if (!title || amount === undefined || amount < 0 || !category) {
      return res.status(400).json({ success: false, message: 'Please provide title, positive amount, and category' });
    }

    const finance = await Finance.findOne();
    if (!finance) {
      return res.status(404).json({ success: false, message: 'Finance document not found' });
    }

    const expense = finance.expenses.id(expenseId);
    if (!expense) {
      return res.status(404).json({ success: false, message: 'Expense not found' });
    }

    const oldExpenseDetails = {
      title: expense.title,
      amount: expense.amount,
      category: expense.category,
      date: expense.date,
      description: expense.description
    };

    // Update fields
    expense.title = title;
    expense.amount = amount;
    expense.category = category;
    if (date) expense.date = date;
    expense.description = description;

    await finance.save();

    const totalSpent = finance.expenses.reduce((acc, curr) => acc + curr.amount, 0);
    const available = finance.allottedBudget - totalSpent;

    // Log this action to the Audit Trail
    await logAudit(
      'UPDATE_EXPENSE',
      `Updated expense: "${title}" (₹${amount})`,
      req.user._id,
      'Finance',
      finance._id,
      { oldExpenseDetails, updatedExpenseDetails: expense },
      req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress,
      title
    );

    res.status(200).json({
      success: true,
      message: 'Expense updated successfully',
      finance: {
        _id: finance._id,
        allottedBudget: finance.allottedBudget,
        expenses: finance.expenses,
        totalSpent,
        available
      }
    });
  } catch (error) {
    console.error('Error updating expense:', error);
    res.status(500).json({ success: false, message: 'Server error updating expense' });
  }
};

// @desc    Delete a specific expense
// @route   DELETE /api/finance/expense/:expenseId
// @access  Protected (Admin / Coordinators)
export const deleteExpense = async (req, res) => {
  try {
    const { expenseId } = req.params;

    const finance = await Finance.findOne();
    if (!finance) {
      return res.status(404).json({ success: false, message: 'Finance document not found' });
    }

    const expense = finance.expenses.id(expenseId);
    if (!expense) {
      return res.status(404).json({ success: false, message: 'Expense not found' });
    }

    const title = expense.title;
    const amount = expense.amount;

    finance.expenses.pull(expenseId);
    await finance.save();

    const totalSpent = finance.expenses.reduce((acc, curr) => acc + curr.amount, 0);
    const available = finance.allottedBudget - totalSpent;

    // Log this action to the Audit Trail
    await logAudit(
      'DELETE_EXPENSE',
      `Deleted expense: "${title}" (₹${amount})`,
      req.user._id,
      'Finance',
      finance._id,
      { deletedExpenseId: expenseId, title, amount },
      req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress,
      title
    );

    res.status(200).json({
      success: true,
      message: 'Expense deleted successfully',
      finance: {
        _id: finance._id,
        allottedBudget: finance.allottedBudget,
        expenses: finance.expenses,
        totalSpent,
        available
      }
    });
  } catch (error) {
    console.error('Error deleting expense:', error);
    res.status(500).json({ success: false, message: 'Server error deleting expense' });
  }
};
