import { useEffect, useState } from 'react';
import { supabase } from './supabaseClient';
import './FinancialSummary.css';

function FinancialSummary() {
  const [summary, setSummary] = useState({
    totalRevenue: 0,
    totalCost: 0,
    totalExpenses: 0,
    grossProfit: 0,
    netProfit: 0,
    profitMargin: 0,
    totalSales: 0,
    totalProducts: 0,
    lowStockCount: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [dateRange, setDateRange] = useState('all'); // all, today, week, month

  useEffect(() => {
    calculateSummary();
  }, [dateRange]);

  async function calculateSummary() {
    try {
      setLoading(true);
      setError('');

      // Get date filter
      const dateFilter = getDateFilter();

      // Fetch sales with items
      let salesQuery = supabase
        .from('sales')
        .select('id, total_amount, created_at');
      
      if (dateFilter) {
        salesQuery = salesQuery.gte('created_at', dateFilter);
      }

      const { data: salesData, error: salesError } = await salesQuery;
      if (salesError) throw salesError;

      // Fetch sale items with product details
      const saleIds = salesData.map(sale => sale.id);
      let saleItemsData = [];
      
      if (saleIds.length > 0) {
        const { data, error: itemsError } = await supabase
          .from('sale_items')
          .select('quantity, price_at_sale, product_id, products(buying_price)')
          .in('sale_id', saleIds);
        
        if (itemsError) throw itemsError;
        saleItemsData = data || [];
      }

      // Fetch expenses
      let expensesQuery = supabase
        .from('expenses')
        .select('amount');
      
      if (dateFilter) {
        expensesQuery = expensesQuery.gte('expense_date', dateFilter);
      }

      const { data: expensesData, error: expensesError } = await expensesQuery;
      if (expensesError) throw expensesError;

      // Fetch products for inventory stats
      const { data: productsData, error: productsError } = await supabase
        .from('products')
        .select('stock_quantity');
      
      if (productsError) throw productsError;

      // Calculate metrics
      const totalRevenue = salesData.reduce((sum, sale) => sum + parseFloat(sale.total_amount), 0);
      
      const totalCost = saleItemsData.reduce((sum, item) => {
        const buyingPrice = item.products?.buying_price || 0;
        return sum + (parseFloat(buyingPrice) * item.quantity);
      }, 0);

      const totalExpenses = expensesData.reduce((sum, expense) => sum + parseFloat(expense.amount), 0);
      
      const grossProfit = totalRevenue - totalCost;
      const netProfit = grossProfit - totalExpenses;
      const profitMargin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;

      const lowStockCount = productsData.filter(p => p.stock_quantity < 10).length;

      setSummary({
        totalRevenue: totalRevenue.toFixed(2),
        totalCost: totalCost.toFixed(2),
        totalExpenses: totalExpenses.toFixed(2),
        grossProfit: grossProfit.toFixed(2),
        netProfit: netProfit.toFixed(2),
        profitMargin: profitMargin.toFixed(2),
        totalSales: salesData.length,
        totalProducts: productsData.length,
        lowStockCount: lowStockCount
      });

    } catch (error) {
      console.error('Error calculating summary:', error);
      setError('Failed to load financial summary: ' + error.message);
    } finally {
      setLoading(false);
    }
  }

  function getDateFilter() {
    const now = new Date();
    switch (dateRange) {
      case 'today':
        return new Date(now.setHours(0, 0, 0, 0)).toISOString();
      case 'week':
        const weekAgo = new Date(now.setDate(now.getDate() - 7));
        return weekAgo.toISOString();
      case 'month':
        const monthAgo = new Date(now.setMonth(now.getMonth() - 1));
        return monthAgo.toISOString();
      default:
        return null;
    }
  }

  if (loading) {
    return <div className="loading">Loading financial summary...</div>;
  }

  return (
    <div className="financial-summary">
      <div className="header">
        <h2>Financial Summary</h2>
        <div className="date-filter">
          <button 
            className={dateRange === 'all' ? 'active' : ''} 
            onClick={() => setDateRange('all')}
          >
            All Time
          </button>
          <button 
            className={dateRange === 'month' ? 'active' : ''} 
            onClick={() => setDateRange('month')}
          >
            Last 30 Days
          </button>
          <button 
            className={dateRange === 'week' ? 'active' : ''} 
            onClick={() => setDateRange('week')}
          >
            Last 7 Days
          </button>
          <button 
            className={dateRange === 'today' ? 'active' : ''} 
            onClick={() => setDateRange('today')}
          >
            Today
          </button>
        </div>
      </div>

      {error && <div className="error-message">{error}</div>}

      <div className="metrics-grid">
        <div className="metric-card revenue">
          <div className="metric-icon">💰</div>
          <div className="metric-content">
            <div className="metric-label">Total Revenue</div>
            <div className="metric-value">${summary.totalRevenue}</div>
          </div>
        </div>

        <div className="metric-card cost">
          <div className="metric-icon">📦</div>
          <div className="metric-content">
            <div className="metric-label">Cost of Goods Sold</div>
            <div className="metric-value">${summary.totalCost}</div>
          </div>
        </div>

        <div className="metric-card expenses">
          <div className="metric-icon">💸</div>
          <div className="metric-content">
            <div className="metric-label">Total Expenses</div>
            <div className="metric-value">${summary.totalExpenses}</div>
          </div>
        </div>

        <div className="metric-card gross-profit">
          <div className="metric-icon">📈</div>
          <div className="metric-content">
            <div className="metric-label">Gross Profit</div>
            <div className="metric-value">${summary.grossProfit}</div>
            <div className="metric-subtext">Revenue - COGS</div>
          </div>
        </div>

        <div className={`metric-card net-profit ${parseFloat(summary.netProfit) < 0 ? 'negative' : ''}`}>
          <div className="metric-icon">{parseFloat(summary.netProfit) >= 0 ? '✅' : '⚠️'}</div>
          <div className="metric-content">
            <div className="metric-label">Net Profit</div>
            <div className="metric-value">${summary.netProfit}</div>
            <div className="metric-subtext">Gross Profit - Expenses</div>
          </div>
        </div>

        <div className="metric-card margin">
          <div className="metric-icon">📊</div>
          <div className="metric-content">
            <div className="metric-label">Profit Margin</div>
            <div className="metric-value">{summary.profitMargin}%</div>
            <div className="metric-subtext">Net Profit / Revenue</div>
          </div>
        </div>
      </div>

      <div className="stats-row">
        <div className="stat-box">
          <div className="stat-icon">🛒</div>
          <div className="stat-content">
            <div className="stat-value">{summary.totalSales}</div>
            <div className="stat-label">Total Sales</div>
          </div>
        </div>

        <div className="stat-box">
          <div className="stat-icon">📦</div>
          <div className="stat-content">
            <div className="stat-value">{summary.totalProducts}</div>
            <div className="stat-label">Products</div>
          </div>
        </div>

        <div className="stat-box warning">
          <div className="stat-icon">⚠️</div>
          <div className="stat-content">
            <div className="stat-value">{summary.lowStockCount}</div>
            <div className="stat-label">Low Stock Items</div>
          </div>
        </div>
      </div>

      <div className="info-box">
        <h3>💡 Financial Insights</h3>
        <ul>
          <li>
            <strong>Revenue:</strong> Total income from all sales
          </li>
          <li>
            <strong>COGS:</strong> Cost of Goods Sold - the buying price of products sold
          </li>
          <li>
            <strong>Gross Profit:</strong> Revenue minus COGS
          </li>
          <li>
            <strong>Net Profit:</strong> Gross profit minus all operating expenses
          </li>
          <li>
            <strong>Profit Margin:</strong> Percentage of revenue that becomes profit
          </li>
        </ul>
      </div>
    </div>
  );
}

export default FinancialSummary;
