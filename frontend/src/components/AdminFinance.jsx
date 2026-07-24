import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Chart from 'react-apexcharts';
import { 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  Plus, 
  Edit3, 
  Trash2, 
  Search, 
  Filter, 
  Calendar, 
  Layers, 
  X, 
  Activity, 
  FileText,
  AlertCircle,
  CheckCircle,
  HelpCircle
} from 'lucide-react';
import { API_URL } from '../config';

const AdminFinance = () => {
  const [currentUser, setCurrentUser] = useState(null);
  const [financeData, setFinanceData] = useState({
    allottedBudget: 0,
    totalSpent: 0,
    available: 0,
    expenses: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filter & Search states
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');

  // Modals state
  const [showBudgetModal, setShowBudgetModal] = useState(false);
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [editingExpense, setEditingExpense] = useState(null);

  // Form states
  const [newBudget, setNewBudget] = useState('');
  const [expenseForm, setExpenseForm] = useState({
    title: '',
    amount: '',
    category: 'Miscellaneous',
    date: new Date().toISOString().split('T')[0],
    description: ''
  });

  // Custom Toast State
  const [toast, setToast] = useState(null);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 4000);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Fetch current logged in user to check roles
      const userRes = await axios.get(`${API_URL}/api/auth/login/success`, { withCredentials: true });
      if (userRes.data?.user) {
        setCurrentUser(userRes.data.user);
      }

      // Fetch finance details
      const financeRes = await axios.get(`${API_URL}/api/finance`, { withCredentials: true });
      if (financeRes.data?.success) {
        setFinanceData(financeRes.data.finance);
        setNewBudget(financeRes.data.finance.allottedBudget.toString());
      } else {
        setError('Failed to fetch finance records');
      }
    } catch (err) {
      console.error('Error fetching finance details:', err);
      setError(err.response?.data?.message || 'Error connecting to the finance service');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateBudget = async (e) => {
    e.preventDefault();
    const budgetVal = parseFloat(newBudget);
    if (isNaN(budgetVal) || budgetVal < 0) {
      showToast('Please enter a valid non-negative number for the budget', 'error');
      return;
    }

    try {
      const res = await axios.put(`${API_URL}/api/finance/budget`, { allottedBudget: budgetVal }, { withCredentials: true });
      if (res.data?.success) {
        setFinanceData(res.data.finance);
        setShowBudgetModal(false);
        showToast('Allotted budget updated successfully!');
      }
    } catch (err) {
      console.error(err);
      showToast(err.response?.data?.message || 'Failed to update budget', 'error');
    }
  };

  const handleSaveExpense = async (e) => {
    e.preventDefault();
    const { title, amount, category, date, description } = expenseForm;
    const amountVal = parseFloat(amount);

    if (!title || isNaN(amountVal) || amountVal <= 0) {
      showToast('Please provide a valid title and positive amount', 'error');
      return;
    }

    try {
      let res;
      if (editingExpense) {
        // Edit mode
        res = await axios.put(
          `${API_URL}/api/finance/expense/${editingExpense._id}`,
          { title, amount: amountVal, category, date, description },
          { withCredentials: true }
        );
      } else {
        // Add mode
        res = await axios.post(
          `${API_URL}/api/finance/expense`,
          { title, amount: amountVal, category, date, description },
          { withCredentials: true }
        );
      }

      if (res.data?.success) {
        setFinanceData(res.data.finance);
        setShowExpenseModal(false);
        setEditingExpense(null);
        resetExpenseForm();
        showToast(editingExpense ? 'Expense updated successfully!' : 'Expense recorded successfully!');
      }
    } catch (err) {
      console.error(err);
      showToast(err.response?.data?.message || 'Failed to save expense', 'error');
    }
  };

  const handleDeleteExpense = async (expenseId) => {
    if (!window.confirm('Are you sure you want to delete this expense? This action will update your available budget.')) {
      return;
    }

    try {
      const res = await axios.delete(`${API_URL}/api/finance/expense/${expenseId}`, { withCredentials: true });
      if (res.data?.success) {
        setFinanceData(res.data.finance);
        showToast('Expense deleted successfully!');
      }
    } catch (err) {
      console.error(err);
      showToast(err.response?.data?.message || 'Failed to delete expense', 'error');
    }
  };

  const resetExpenseForm = () => {
    setExpenseForm({
      title: '',
      amount: '',
      category: 'Miscellaneous',
      date: new Date().toISOString().split('T')[0],
      description: ''
    });
  };

  const openAddExpense = () => {
    setEditingExpense(null);
    resetExpenseForm();
    setShowExpenseModal(true);
  };

  const openEditExpense = (expense) => {
    setEditingExpense(expense);
    setExpenseForm({
      title: expense.title,
      amount: expense.amount.toString(),
      category: expense.category,
      date: expense.date ? new Date(expense.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
      description: expense.description || ''
    });
    setShowExpenseModal(true);
  };

  // Helper formatting functions
  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(value);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Filter logic
  const filteredExpenses = financeData.expenses.filter(exp => {
    const matchesSearch = 
      exp.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (exp.description && exp.description.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesCategory = categoryFilter === 'All' || exp.category === categoryFilter;
    return matchesSearch && matchesCategory;
  }).sort((a, b) => new Date(b.date) - new Date(a.date));

  // Category Colors Map
  const categoryColors = {
    Marketing: '#3b82f6',
    Logistics: '#8b5cf6',
    Catering: '#f59e0b',
    Prizes: '#10b981',
    Operations: '#6366f1',
    Miscellaneous: '#6b7280',
    Events: '#ec4899'
  };

  // Calculate percentages
  const spentPercent = financeData.allottedBudget > 0 
    ? Math.round((financeData.totalSpent / financeData.allottedBudget) * 100)
    : 0;
  
  const availablePercent = Math.max(0, 100 - spentPercent);

  // Group expenses by category for chart
  const categoryData = financeData.expenses.reduce((acc, curr) => {
    acc[curr.category] = (acc[curr.category] || 0) + curr.amount;
    return acc;
  }, {});

  const categories = Object.keys(categoryData);
  const categoryAmounts = Object.values(categoryData);
  const chartColors = categories.map(cat => categoryColors[cat] || '#3b82f6');

  // Chart configuration: Donut of spent categories
  const donutOptions = {
    chart: {
      type: 'donut',
      background: 'transparent',
      foreColor: '#94a3b8'
    },
    labels: categories.length > 0 ? categories : ['No Expenses Yet'],
    colors: chartColors.length > 0 ? chartColors : ['#e2e8f0'],
    stroke: { show: false },
    dataLabels: { enabled: true, formatter: (val) => `${Math.round(val)}%` },
    legend: {
      position: 'bottom',
      horizontalAlign: 'center',
      labels: { colors: '#3d3d50' }
    },
    tooltip: {
      theme: 'light',
      y: {
        formatter: (value) => formatCurrency(value)
      }
    },
    plotOptions: {
      pie: {
        donut: {
          size: '65%',
          labels: {
            show: true,
            total: {
              show: true,
              label: 'Total Spent',
              color: '#3d3d50',
              formatter: () => formatCurrency(financeData.totalSpent)
            }
          }
        }
      }
    }
  };

  const donutSeries = categoryAmounts.length > 0 ? categoryAmounts : [1];

  // Budget status indicator
  const getBudgetStatusClass = () => {
    if (spentPercent >= 90) return 'text-red-500 bg-red-50 border-red-200';
    if (spentPercent >= 75) return 'text-amber-500 bg-amber-50 border-amber-200';
    return 'text-green-500 bg-green-50 border-green-200';
  };

  const getBudgetProgressColor = () => {
    if (spentPercent >= 90) return 'bg-red-500';
    if (spentPercent >= 75) return 'bg-amber-500';
    return 'bg-indigo-500';
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-[70vh] gap-4 text-[var(--clr-text-muted)]">
        <div className="loader-spinner"></div>
        <p className="font-medium animate-pulse">Loading Financial Dashboard...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 max-w-lg mx-auto text-center glass rounded-2xl mt-12 border border-red-200">
        <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
        <h3 className="text-xl font-bold text-[var(--clr-text-heading)] mb-2">Finance Access Error</h3>
        <p className="text-red-600 mb-6">{error}</p>
        <button onClick={fetchData} className="btn btn-primary">Try Again</button>
      </div>
    );
  }

  const isSuperAdmin = currentUser?.role === 'superadmin';

  return (
    <div className="w-full p-6 animate-[fadeIn_0.4s_ease-out]">
      {/* Toast Alert */}
      {toast && (
        <div className={`fixed bottom-6 right-6 z-[99999] flex items-center gap-3 px-5 py-3.5 rounded-xl border shadow-xl transition-all duration-300 animate-[slideInRight_0.25s_ease-out] bg-white ${
          toast.type === 'error' 
            ? 'border-red-200 text-red-700 bg-red-50/90' 
            : 'border-green-200 text-green-700 bg-green-50/90'
        }`}>
          {toast.type === 'error' ? <AlertCircle size={20} /> : <CheckCircle size={20} />}
          <span className="font-semibold text-sm">{toast.message}</span>
        </div>
      )}

      {/* Header Section */}
      <div className="flex justify-between items-center mb-8 border-b border-[var(--clr-border)] pb-5 flex-wrap gap-4">
        <div>
          <h2 className="text-[1.75rem] font-bold text-[var(--clr-text-heading)] m-0 mb-1 tracking-[-0.02em]">Finance Dashboard</h2>
          <p className="text-[var(--clr-text-muted)] text-[0.95rem] m-0">Monitor budgeted allocations, tract expenditure, and log organizational costs.</p>
        </div>
        <div className="flex items-center gap-3">
          {isSuperAdmin && (
            <button 
              onClick={() => setShowBudgetModal(true)} 
              className="btn btn-secondary border-dashed flex items-center gap-2 hover:border-indigo-500 hover:text-indigo-600"
            >
              <Edit3 size={15} /> Edit Budget Allocation
            </button>
          )}
          <button 
            onClick={openAddExpense} 
            className="btn btn-primary bg-indigo-600 border-indigo-600 hover:bg-indigo-700 flex items-center gap-2"
          >
            <Plus size={16} /> Record Expense
          </button>
        </div>
      </div>

      {/* Stats Cards Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {/* Card 1: Allotted Budget */}
        <div className="group relative bg-gradient-to-br from-white to-slate-50 border border-slate-200/80 rounded-[var(--radius-xl)] p-6 shadow-sm hover:shadow-md transition-all duration-300">
          <div className="absolute top-4 right-4 w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600">
            <DollarSign size={20} />
          </div>
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Total Allotted Budget</p>
          <h3 className="text-3xl font-black text-slate-800 tracking-tight mb-3">
            {formatCurrency(financeData.allottedBudget)}
          </h3>
          <div className="flex items-center gap-1.5 text-xs text-indigo-500 font-semibold bg-indigo-50/50 w-fit px-2.5 py-1 rounded-full">
            <TrendingUp size={12} /> Global Platform Limit
          </div>
        </div>

        {/* Card 2: Spent Budget */}
        <div className="group relative bg-gradient-to-br from-white to-slate-50 border border-slate-200/80 rounded-[var(--radius-xl)] p-6 shadow-sm hover:shadow-md transition-all duration-300">
          <div className="absolute top-4 right-4 w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600">
            <TrendingDown size={20} />
          </div>
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Spent Budget</p>
          <h3 className="text-3xl font-black text-slate-800 tracking-tight mb-3">
            {formatCurrency(financeData.totalSpent)}
          </h3>
          <div className="flex items-center gap-1 text-xs text-amber-600 font-semibold bg-amber-50/60 w-fit px-2.5 py-1 rounded-full">
            {spentPercent}% of total allotted
          </div>
        </div>

        {/* Card 3: Available Budget */}
        <div className="group relative bg-gradient-to-br from-white to-slate-50 border border-slate-200/80 rounded-[var(--radius-xl)] p-6 shadow-sm hover:shadow-md transition-all duration-300">
          <div className="absolute top-4 right-4 w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center text-green-600">
            <Activity size={20} />
          </div>
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Available Budget</p>
          <h3 className="text-3xl font-black text-slate-800 tracking-tight mb-3">
            {formatCurrency(financeData.available)}
          </h3>
          <div className="flex items-center gap-1.5 text-xs text-green-600 font-semibold bg-green-50/60 w-fit px-2.5 py-1 rounded-full">
            {availablePercent}% remains unspent
          </div>
        </div>
      </div>

      {/* Progress Bar of Budget Utilization */}
      <div className="bg-white border border-slate-100 rounded-2xl p-5 mb-8 shadow-sm">
        <div className="flex justify-between items-center mb-3">
          <span className="text-sm font-semibold text-slate-700">Allotted Budget Utilization</span>
          <span className={`text-xs font-bold px-2 py-1 rounded-full border ${getBudgetStatusClass()}`}>
            {spentPercent}% Used
          </span>
        </div>
        <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
          <div 
            className={`h-full rounded-full transition-all duration-1000 ${getBudgetProgressColor()}`}
            style={{ width: `${Math.min(100, spentPercent)}%` }}
          />
        </div>
        <div className="flex justify-between text-xs text-slate-400 mt-2 font-medium">
          <span>₹0 Spent</span>
          <span>Budget Capacity Limit ({formatCurrency(financeData.allottedBudget)})</span>
        </div>
      </div>

      {/* Analytics & Table Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: Expenses table */}
        <div className="lg:col-span-2 flex flex-col gap-5">
          <div className="bg-white border border-slate-200/80 rounded-[var(--radius-xl)] shadow-sm p-6">
            <div className="flex justify-between items-center mb-6 flex-wrap gap-3">
              <h3 className="text-lg font-bold text-[var(--clr-text-heading)] m-0">Recent Expenditures</h3>
              
              {/* Search & Filters */}
              <div className="flex gap-3 items-center w-full sm:w-auto flex-wrap">
                <div className="relative flex-1 sm:flex-initial">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input 
                    type="text" 
                    placeholder="Search expenses..." 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full sm:w-[220px] bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-3 py-1.5 text-xs text-[var(--clr-text-heading)] focus:outline-none focus:border-indigo-500 focus:bg-white"
                  />
                </div>
                <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5">
                  <Filter className="w-3.5 h-3.5 text-slate-400" />
                  <select 
                    value={categoryFilter}
                    onChange={(e) => setCategoryFilter(e.target.value)}
                    className="bg-transparent border-none text-xs text-slate-600 focus:outline-none cursor-pointer font-medium"
                  >
                    <option value="All">All Categories</option>
                    <option value="Marketing">Marketing</option>
                    <option value="Logistics">Logistics</option>
                    <option value="Catering">Catering</option>
                    <option value="Prizes">Prizes</option>
                    <option value="Operations">Operations</option>
                    <option value="Events">Events</option>
                    <option value="Miscellaneous">Miscellaneous</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto rounded-xl border border-slate-100">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100 text-slate-500 font-bold uppercase tracking-wider">
                    <th className="py-3.5 px-4">Title / Description</th>
                    <th className="py-3.5 px-4">Category</th>
                    <th className="py-3.5 px-4">Date</th>
                    <th className="py-3.5 px-4 text-right">Amount</th>
                    <th className="py-3.5 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredExpenses.length > 0 ? (
                    filteredExpenses.map((exp) => (
                      <tr key={exp._id} className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors">
                        <td className="py-3.5 px-4">
                          <div className="font-semibold text-slate-800 text-[0.825rem]">{exp.title}</div>
                          {exp.description && (
                            <div className="text-slate-400 text-[0.75rem] font-normal mt-0.5 max-w-[250px] truncate" title={exp.description}>
                              {exp.description}
                            </div>
                          )}
                        </td>
                        <td className="py-3.5 px-4">
                          <span 
                            className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold text-white"
                            style={{ backgroundColor: categoryColors[exp.category] || '#3b82f6' }}
                          >
                            {exp.category}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-slate-500 font-medium">
                          <span className="flex items-center gap-1">
                            <Calendar size={12} />
                            {formatDate(exp.date)}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-right font-bold text-slate-800 text-[0.825rem]">
                          {formatCurrency(exp.amount)}
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex gap-1.5 justify-end">
                            <button 
                              onClick={() => openEditExpense(exp)}
                              className="w-7 h-7 rounded-lg bg-slate-50 hover:bg-indigo-50 hover:text-indigo-600 flex items-center justify-center text-slate-400 border border-slate-100 transition-colors"
                              title="Edit Expense"
                            >
                              <Edit3 size={12} />
                            </button>
                            <button 
                              onClick={() => handleDeleteExpense(exp._id)}
                              className="w-7 h-7 rounded-lg bg-slate-50 hover:bg-red-50 hover:text-red-600 flex items-center justify-center text-slate-400 border border-slate-100 transition-colors"
                              title="Delete Expense"
                            >
                              <Trash2 size={12} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="5" className="py-12 text-center text-slate-400 font-medium">
                        <FileText className="w-12 h-12 mx-auto mb-2 text-slate-200" />
                        No matching expenses found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            
            <div className="flex justify-between items-center text-xs text-slate-400 font-medium mt-4">
              <span>Showing {filteredExpenses.length} of {financeData.expenses.length} records</span>
              {filteredExpenses.length > 0 && (
                <span>Total Filtered: <b className="text-slate-600">{formatCurrency(filteredExpenses.reduce((acc, c) => acc + c.amount, 0))}</b></span>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Analytics Chart */}
        <div className="bg-white border border-slate-200/80 rounded-[var(--radius-xl)] shadow-sm p-6 flex flex-col min-h-[380px]">
          <h3 className="text-lg font-bold text-[var(--clr-text-heading)] m-0 mb-1">Expense Breakdown</h3>
          <p className="text-xs text-[var(--clr-text-muted)] mb-6">Percentage allocation and spending metrics by category.</p>

          <div className="flex-1 flex flex-col justify-center items-center relative min-h-[220px]">
            {financeData.expenses.length > 0 ? (
              <Chart 
                options={donutOptions} 
                series={donutSeries} 
                type="donut" 
                width="100%" 
                height={300} 
              />
            ) : (
              <div className="text-center text-slate-400 font-medium py-8">
                <HelpCircle className="w-12 h-12 mx-auto mb-2 text-slate-200" />
                No expenses logged yet.<br />
                <span className="text-xs text-slate-300">Data will populate charts once recorded.</span>
              </div>
            )}
          </div>
        </div>

      </div>

      {/* Edit Budget Modal (Super Admin only) */}
      {showBudgetModal && isSuperAdmin && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4" onClick={() => setShowBudgetModal(false)}>
          <div className="bg-white w-full max-w-md rounded-[var(--radius-xl)] p-6 shadow-2xl relative animate-[slideUp_0.3s_ease-out]" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-6 pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="bg-indigo-50 text-indigo-600 p-2 rounded-lg">
                  <Layers size={18} />
                </div>
                <h3 className="m-0 text-lg font-bold text-[var(--clr-text-heading)]">Adjust Budget Allocation</h3>
              </div>
              <button 
                className="w-8 h-8 rounded-full border-none bg-slate-50 text-slate-400 flex items-center justify-center cursor-pointer transition-colors hover:bg-slate-100 hover:text-slate-700" 
                onClick={() => setShowBudgetModal(false)}
              >
                <X size={16} />
              </button>
            </div>
            
            <form onSubmit={handleUpdateBudget} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-slate-600">Total Allotted Budget (INR)</label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">₹</span>
                  <input 
                    type="number" 
                    required 
                    min="0"
                    placeholder="Enter new budget limit" 
                    value={newBudget} 
                    onChange={e => setNewBudget(e.target.value)} 
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-8 pr-4 py-3 text-sm text-[var(--clr-text-heading)] transition-colors focus:outline-none focus:border-indigo-500 focus:bg-white"
                  />
                </div>
                <p className="text-[10px] text-slate-400 leading-normal mt-1">
                  Adjusting this limit will alter the "Available Budget" instantly. Existing expense records will remain unchanged.
                </p>
              </div>

              <div className="flex gap-3 mt-4">
                <button type="button" className="btn btn-secondary flex-1" onClick={() => setShowBudgetModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary flex-1 bg-indigo-600 border-indigo-600 hover:bg-indigo-700">Save Allocation</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Record/Edit Expense Modal */}
      {showExpenseModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4" onClick={() => setShowExpenseModal(false)}>
          <div className="bg-white w-full max-w-lg rounded-[var(--radius-xl)] p-6 shadow-2xl relative animate-[slideUp_0.3s_ease-out]" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-6 pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="bg-indigo-50 text-indigo-600 p-2 rounded-lg">
                  <DollarSign size={18} />
                </div>
                <h3 className="m-0 text-lg font-bold text-[var(--clr-text-heading)]">
                  {editingExpense ? 'Edit Expense Entry' : 'Record New Expense'}
                </h3>
              </div>
              <button 
                className="w-8 h-8 rounded-full border-none bg-slate-50 text-slate-400 flex items-center justify-center cursor-pointer transition-colors hover:bg-slate-100 hover:text-slate-700" 
                onClick={() => setShowExpenseModal(false)}
              >
                <X size={16} />
              </button>
            </div>
            
            <form onSubmit={handleSaveExpense} className="flex flex-col gap-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Title */}
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-slate-600">Expense Title</label>
                  <input 
                    type="text" 
                    required 
                    placeholder="e.g. Venue Catering"
                    value={expenseForm.title} 
                    onChange={e => setExpenseForm({...expenseForm, title: e.target.value})}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3.5 py-2 text-xs text-[var(--clr-text-heading)] transition-colors focus:outline-none focus:border-indigo-500 focus:bg-white"
                  />
                </div>

                {/* Amount */}
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-slate-600">Amount (INR)</label>
                  <input 
                    type="number" 
                    required 
                    min="0.01"
                    step="0.01"
                    placeholder="Enter cost value"
                    value={expenseForm.amount} 
                    onChange={e => setExpenseForm({...expenseForm, amount: e.target.value})}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3.5 py-2 text-xs text-[var(--clr-text-heading)] transition-colors focus:outline-none focus:border-indigo-500 focus:bg-white"
                  />
                </div>

                {/* Category */}
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-slate-600">Category</label>
                  <select 
                    value={expenseForm.category} 
                    onChange={e => setExpenseForm({...expenseForm, category: e.target.value})}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3.5 py-2 text-xs text-slate-600 focus:outline-none cursor-pointer focus:bg-white focus:border-indigo-500"
                  >
                    <option value="Marketing">Marketing</option>
                    <option value="Logistics">Logistics</option>
                    <option value="Catering">Catering</option>
                    <option value="Prizes">Prizes</option>
                    <option value="Operations">Operations</option>
                    <option value="Events">Events</option>
                    <option value="Miscellaneous">Miscellaneous</option>
                  </select>
                </div>

                {/* Date */}
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-slate-600">Expense Date</label>
                  <input 
                    type="date" 
                    required 
                    value={expenseForm.date} 
                    onChange={e => setExpenseForm({...expenseForm, date: e.target.value})}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3.5 py-2 text-xs text-[var(--clr-text-heading)] transition-colors focus:outline-none focus:border-indigo-500 focus:bg-white"
                  />
                </div>
              </div>

              {/* Description */}
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-slate-600">Description (Optional)</label>
                <textarea 
                  placeholder="Record vendor name, invoicing details, or comments..."
                  value={expenseForm.description} 
                  onChange={e => setExpenseForm({...expenseForm, description: e.target.value})}
                  rows="3"
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3.5 py-2 text-xs text-[var(--clr-text-heading)] transition-colors focus:outline-none focus:border-indigo-500 focus:bg-white resize-none"
                />
              </div>

              <div className="flex gap-3 mt-4">
                <button type="button" className="btn btn-secondary flex-1" onClick={() => setShowExpenseModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary flex-1 bg-indigo-600 border-indigo-600 hover:bg-indigo-700">
                  {editingExpense ? 'Update Log' : 'Record Cost'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default AdminFinance;
