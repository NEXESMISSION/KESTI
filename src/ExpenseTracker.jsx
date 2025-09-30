import { useEffect, useState } from 'react';
import { supabase } from './supabaseClient';
import './ExpenseTracker.css';

function ExpenseTracker() {
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingExpense, setEditingExpense] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    amount: '',
    expense_date: new Date().toISOString().split('T')[0],
    frequency: 'one_time'
  });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    getExpenses();
  }, []);

  async function getExpenses() {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('expenses')
        .select('*')
        .order('expense_date', { ascending: false });

      if (error) throw error;
      if (data) setExpenses(data);
    } catch (error) {
      console.error('Error fetching expenses:', error);
      setError('Failed to load expenses: ' + error.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setSaving(true);

    try {
      if (editingExpense) {
        // Update existing expense
        const { error } = await supabase
          .from('expenses')
          .update({
            name: formData.name,
            amount: parseFloat(formData.amount),
            expense_date: formData.expense_date,
            frequency: formData.frequency
          })
          .eq('id', editingExpense.id);

        if (error) throw error;
        alert('Expense updated successfully!');
      } else {
        // Create new expense
        const { error } = await supabase
          .from('expenses')
          .insert([{
            name: formData.name,
            amount: parseFloat(formData.amount),
            expense_date: formData.expense_date,
            frequency: formData.frequency
          }]);

        if (error) throw error;
        alert('Expense created successfully!');
      }
      
      setShowModal(false);
      setEditingExpense(null);
      setFormData({
        name: '',
        amount: '',
        expense_date: new Date().toISOString().split('T')[0],
        frequency: 'one_time'
      });
      getExpenses();
    } catch (error) {
      setError('Error saving expense: ' + error.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id) {
    if (!confirm('Are you sure you want to delete this expense?')) return;

    try {
      const { error } = await supabase
        .from('expenses')
        .delete()
        .eq('id', id);

      if (error) throw error;
      alert('Expense deleted successfully!');
      getExpenses();
    } catch (error) {
      alert('Error deleting expense: ' + error.message);
    }
  }

  function openEditModal(expense) {
    setEditingExpense(expense);
    setFormData({
      name: expense.name,
      amount: expense.amount.toString(),
      expense_date: expense.expense_date,
      frequency: expense.frequency
    });
    setShowModal(true);
  }

  function openCreateModal() {
    setEditingExpense(null);
    setFormData({
      name: '',
      amount: '',
      expense_date: new Date().toISOString().split('T')[0],
      frequency: 'one_time'
    });
    setShowModal(true);
  }

  function closeModal() {
    setShowModal(false);
    setEditingExpense(null);
    setFormData({
      name: '',
      amount: '',
      expense_date: new Date().toISOString().split('T')[0],
      frequency: 'one_time'
    });
    setError('');
  }

  const getFrequencyLabel = (frequency) => {
    const labels = {
      one_time: 'One-Time',
      daily: 'Daily',
      weekly: 'Weekly',
      monthly: 'Monthly'
    };
    return labels[frequency] || frequency;
  };

  const getFrequencyColor = (frequency) => {
    const colors = {
      one_time: '#3182ce',
      daily: '#38a169',
      weekly: '#d69e2e',
      monthly: '#805ad5'
    };
    return colors[frequency] || '#718096';
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  const calculateTotalExpenses = () => {
    return expenses.reduce((sum, exp) => sum + parseFloat(exp.amount), 0).toFixed(2);
  };

  const getExpensesByFrequency = (frequency) => {
    return expenses.filter(exp => exp.frequency === frequency);
  };

  if (loading) {
    return <div className="loading">Loading expenses...</div>;
  }

  return (
    <div className="expense-tracker">
      <div className="header">
        <div>
          <h2>Expense Tracker</h2>
          <p className="total-expenses">Total: ${calculateTotalExpenses()}</p>
        </div>
        <button className="btn-primary" onClick={openCreateModal}>
          + Add New Expense
        </button>
      </div>

      {error && <div className="error-message">{error}</div>}

      <div className="expense-stats">
        <div className="stat-card">
          <div className="stat-label">One-Time</div>
          <div className="stat-value">{getExpensesByFrequency('one_time').length}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Daily</div>
          <div className="stat-value">{getExpensesByFrequency('daily').length}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Weekly</div>
          <div className="stat-value">{getExpensesByFrequency('weekly').length}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Monthly</div>
          <div className="stat-value">{getExpensesByFrequency('monthly').length}</div>
        </div>
      </div>

      <div className="expenses-list">
        {expenses.length === 0 ? (
          <div className="empty-state">
            <p>No expenses yet. Track your first expense!</p>
          </div>
        ) : (
          expenses.map(expense => (
            <div key={expense.id} className="expense-item">
              <div className="expense-main">
                <div className="expense-info">
                  <h3>{expense.name}</h3>
                  <span className="expense-date">{formatDate(expense.expense_date)}</span>
                </div>
                <div className="expense-details">
                  <span 
                    className="expense-frequency" 
                    style={{ backgroundColor: getFrequencyColor(expense.frequency) }}
                  >
                    {getFrequencyLabel(expense.frequency)}
                  </span>
                  <span className="expense-amount">${parseFloat(expense.amount).toFixed(2)}</span>
                </div>
              </div>
              <div className="expense-actions">
                <button 
                  className="btn-edit" 
                  onClick={() => openEditModal(expense)}
                  title="Edit"
                >
                  ✏️
                </button>
                <button 
                  className="btn-delete" 
                  onClick={() => handleDelete(expense.id)}
                  title="Delete"
                >
                  🗑️
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editingExpense ? 'Edit Expense' : 'Create New Expense'}</h3>
              <button className="modal-close" onClick={closeModal}>×</button>
            </div>
            
            <form onSubmit={handleSubmit}>
              {error && <div className="error-message">{error}</div>}
              
              <div className="form-group">
                <label>Expense Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  placeholder="e.g., Rent, Utilities, Supplies"
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Amount ($) *</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    required
                    placeholder="0.00"
                  />
                </div>

                <div className="form-group">
                  <label>Date *</label>
                  <input
                    type="date"
                    value={formData.expense_date}
                    onChange={(e) => setFormData({ ...formData, expense_date: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Frequency *</label>
                <select
                  value={formData.frequency}
                  onChange={(e) => setFormData({ ...formData, frequency: e.target.value })}
                  required
                >
                  <option value="one_time">One-Time</option>
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                </select>
              </div>

              <div className="form-actions">
                <button type="button" className="btn-secondary" onClick={closeModal}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary" disabled={saving}>
                  {saving ? 'Saving...' : (editingExpense ? 'Update Expense' : 'Create Expense')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default ExpenseTracker;
