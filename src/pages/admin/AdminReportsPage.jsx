import { currency } from '../../utils/format';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/authState';
import { useAdminData } from '../../hooks/useAdminData';
import { Pagination } from '../../components/Orders';
import { DateFilters, DataState, DataTable } from '../../components/Analytics';
const labels = { date: 'Date / period begins (UTC)', orders: 'Paid orders', units: 'Units sold', revenue: 'Revenue', orderNumber: 'Order', customer: 'Customer', status: 'Order status', paymentStatus: 'Payment', total: 'Total', name: 'Product', sku: 'SKU', size: 'Size', color: 'Colour', stock: 'Stock', stockStatus: 'Stock status', variantStatus: 'Variant status', productStatus: 'Product status' };
export default function AdminReportsPage() {
  const { request } = useAuth();
  const [type, setType] = useState('sales'), [filters, setFilters] = useState({ range: '30', interval: 'day' }), [page, setPage] = useState(1);
  const [extra, setExtra] = useState({}), [exporting, setExporting] = useState(false), [exportError, setExportError] = useState('');
  const query = new URLSearchParams({ ...(type === 'inventory' ? {} : filters), ...extra, page, limit: 20 }).toString();
  const { data, loading, error, retry } = useAdminData(`/admin/reports/${type}?${query}`);
  const masters = useAdminData('/admin/reports/filters');
  const change = (key, value) => { setExtra(x => ({ ...x, [key]: value })); setPage(1); setExportError(''); };
  const download = async () => {
    setExporting(true); setExportError('');
    try {
      const blob = await request(`/admin/reports/${type}/export?${query}`, { responseType: 'blob' });
      const url = URL.createObjectURL(blob), anchor = document.createElement('a'); anchor.href = url; anchor.download = `${type}-report.csv`; anchor.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (e) { setExportError(e.message); } finally { setExporting(false); }
  };
  const columns = data?.columns.map(key => ({ key, label: labels[key], ...(['revenue', 'total'].includes(key) ? { render: currency } : key === 'orderNumber' ? { render: (value, row) => <Link to={`/admin/orders?order=${row._id}`}>{value}</Link> } : {}) })) || [];
  return <div className="page-content container-inner analytics-page">
    <div className="analytics-filters panel-card"><label>Report<select name="report" value={type} disabled={exporting} onChange={e => { setType(e.target.value); setExtra({}); setPage(1); setExportError(''); }}><option value="sales">Sales</option><option value="orders">Orders</option><option value="products">Product sales</option><option value="inventory">Inventory</option></select></label><button className="secondary-button" onClick={retry}>Refresh report</button><button className="primary-button" disabled={loading || Boolean(error) || exporting} onClick={download}>{exporting ? 'Exporting...' : 'Export CSV'}</button></div>
    {type !== 'inventory' && <DateFilters value={filters} onChange={value => { setFilters(value); setPage(1); setExportError(''); }}/>} 
    <div className="analytics-filters">
      {type === 'orders' && <><label>Order status<select value={extra.status || ''} onChange={e => change('status', e.target.value)}><option value="">All statuses</option>{['Pending', 'Confirmed', 'Processing', 'Shipped', 'Out for Delivery', 'Delivered', 'Cancelled', 'Returned'].map(s => <option key={s}>{s}</option>)}</select></label><label>Payment status<select value={extra.paymentStatus || ''} onChange={e => change('paymentStatus', e.target.value)}><option value="">All payments</option>{['Pending', 'Paid', 'Failed', 'Refunded'].map(s => <option key={s}>{s}</option>)}</select></label></>}
      {['products', 'inventory'].includes(type) && <>{masters.error && <p role="alert">{masters.error} <button onClick={masters.retry}>Retry filters</button></p>}{['category', 'brand'].map(key => <label key={key}>{key === 'category' ? 'Category' : 'Brand'}<select disabled={masters.loading || Boolean(masters.error)} value={extra[key] || ''} onChange={e => change(key, e.target.value)}><option value="">All</option>{masters.data?.[key === 'category' ? 'categories' : 'brands'].map(item => <option key={item._id} value={item._id}>{item.name}</option>)}</select></label>)}</>}
      {type === 'inventory' && <label>Stock status<select value={extra.stock || ''} onChange={e => change('stock', e.target.value)}><option value="">All stock</option><option value="low">Low stock</option><option value="out">Out of stock</option></select></label>}
    </div>
    <p>{type === 'inventory' ? 'Current stock snapshot, not historical inventory.' : type === 'orders' ? 'Orders filtered by creation date, including unpaid and cancelled orders. Totals are order values, not collected revenue.' : type === 'products' ? 'Paid, delivered merchandise sales by payment date, after proportional coupon discounts and excluding shipping. Category/brand filters use current catalog relationships.' : 'Collected payments for delivered orders, including shipping. Returned, refunded, cancelled, failed and pending orders are excluded. Only periods containing sales appear.'} Dates use UTC. CSV exports include all matching rows up to 10,000; narrow filters for larger reports.</p>
    {exportError && <p role="alert" className="form-error">{exportError}</p>}
    <DataState loading={loading} error={error} retry={retry}/>
    {data && <section className="panel-card"><DataTable rows={data.rows} columns={columns} empty="No matching report records."/><Pagination pagination={data.pagination} onPage={setPage}/></section>}
  </div>;
}
