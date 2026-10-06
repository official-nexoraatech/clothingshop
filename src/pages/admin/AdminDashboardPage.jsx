import { currency } from '../../utils/format';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAdminData } from '../../hooks/useAdminData';
import { DateFilters, DataState, DataTable, BarChart, SalesChart } from '../../components/Analytics';
const salesColumns = [{ key: 'name', label: 'Product' }, { key: 'units', label: 'Units sold' }, { key: 'revenue', label: 'Merchandise revenue', render: currency }];
export default function AdminDashboardPage() {
  const [filters, setFilters] = useState({ range: '30', interval: 'day' });
  const { data, loading, error, retry } = useAdminData(`/admin/dashboard/summary?${new URLSearchParams(filters)}`);
  const summary = data?.summary;
  return <div className="page-content container-inner analytics-page">
    <div className="row-between"><p>Live business overview</p><Link className="secondary-button" to="/admin/reports">Open reports</Link><button className="secondary-button" onClick={retry}>Refresh dashboard</button></div>
    <DateFilters value={filters} onChange={setFilters}/>
    <p>Dates use UTC. Sales use payment collection dates; orders and new customers use creation dates. Inventory and account totals show the current state.</p>
    <DataState loading={loading} error={error} retry={retry}/>
    {data && <>
      <div className="stats-grid">{[['Collected revenue, all time', currency(summary.totalRevenue)], ['Total orders, all time', summary.totalOrders], ['Total customers', summary.totalCustomers], ['Total products', summary.totalProducts], ['Revenue in period', currency(summary.periodRevenue)], ['Orders placed in period', summary.periodOrders], ['New customers in period', summary.newCustomers], ['Active customer accounts', summary.activeCustomers]].map(([label, value]) => <section className="panel-card" key={label}><p>{label}</p><h3>{value}</h3></section>)}</div>
      <p>Revenue counts paid, delivered orders including shipping. Cancelled, returned, failed and pending orders are excluded. Product/category/brand revenue excludes shipping and allocates coupon discounts proportionally. Category and brand groupings use current catalog relationships.</p>
      <div className="panel-grid two-col"><section className="panel-card"><h3>Sales trend</h3><SalesChart rows={data.sales}/></section><section className="panel-card"><h3>Order status in period</h3><BarChart rows={data.orderStatuses} labelKey="status" valueKey="count" money={false}/></section></div>
      <div className="panel-grid two-col"><section className="panel-card"><h3>Top products in period</h3><DataTable columns={salesColumns} rows={data.products}/></section><section className="panel-card"><h3>New customers over time</h3><BarChart rows={data.customerTrend} labelKey="date" valueKey="count" money={false}/></section></div>
      <div className="panel-grid two-col"><section className="panel-card"><h3>Sales by category (top 10)</h3><BarChart rows={data.categories}/></section><section className="panel-card"><h3>Sales by brand (top 10)</h3><BarChart rows={data.brands}/></section></div>
      <section className="panel-card"><h3>Recent orders in period</h3><DataTable rows={data.recentOrders} columns={[{ key: 'orderNumber', label: 'Order', render: (value, row) => <Link to={`/admin/orders?order=${row._id}`}>{value}</Link> }, { key: 'customer', label: 'Customer' }, { key: 'createdAt', label: 'Date (UTC)', render: v => v.slice(0, 10) }, { key: 'grandTotal', label: 'Total', render: currency }, { key: 'paymentStatus', label: 'Payment' }, { key: 'status', label: 'Status' }]}/></section>
      <section className="panel-card"><h3>Inventory overview</h3><div className="stats-grid">{[['Total stock units', data.inventory.totalStock], ['Available units (active products/variants)', data.inventory.availableStock], ['Low-stock variants', data.inventory.lowStockVariants], ['Out-of-stock variants', data.inventory.outOfStockVariants]].map(([label, value]) => <div key={label}><p>{label}</p><strong>{value}</strong></div>)}</div><p>Stock counts are per variant. Reserved stock is not tracked by this system.</p><Link to="/admin/inventory">Manage inventory</Link><h4>Stock alerts (first 10)</h4><DataTable empty="No low-stock or out-of-stock variants." rows={data.inventory.alerts} columns={[{ key: 'product', label: 'Product' }, { key: 'sku', label: 'SKU' }, { key: 'size', label: 'Size' }, { key: 'color', label: 'Colour' }, { key: 'stock', label: 'Stock' }, { key: 'lowStockThreshold', label: 'Threshold' }]}/></section>
      <section className="panel-card"><h3>Recent customers in period</h3><DataTable rows={data.recentCustomers} columns={[{ key: 'name', label: 'Name' }, { key: 'email', label: 'Email' }, { key: 'createdAt', label: 'Registered (UTC)', render: v => v.slice(0, 10) }, { key: 'status', label: 'Status' }]}/></section>
    </>}
  </div>;
}
