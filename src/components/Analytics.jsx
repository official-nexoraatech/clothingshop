import { useState } from 'react';
import { currency } from '../utils/format';
export function DateFilters({ value, onChange, children }) {
  const [draft, setDraft] = useState(value);
  return <form className="analytics-filters panel-card" onSubmit={e => { e.preventDefault(); onChange(draft); }}>
    <label>Period<select name="range" value={draft.range} onChange={e => setDraft({ ...draft, range: e.target.value })}>
      <option value="today">Today</option><option value="7">Last 7 days</option><option value="30">Last 30 days</option><option value="90">Last 90 days</option><option value="365">Last year</option><option value="year">This year</option><option value="custom">Custom range</option>
    </select></label>
    {draft.range === 'custom' && <><label>Start date<input required type="date" name="start" value={draft.start || ''} onChange={e => setDraft({ ...draft, start: e.target.value })}/></label><label>End date<input required type="date" name="end" min={draft.start} value={draft.end || ''} onChange={e => setDraft({ ...draft, end: e.target.value })}/></label></>}
    <label>Group by<select name="interval" value={draft.interval} onChange={e => setDraft({ ...draft, interval: e.target.value })}><option value="day">Day</option><option value="week">Week</option><option value="month">Month</option></select></label>
    {children}<button className="primary-button">Apply dates</button>
  </form>;
}
export function DataState({ loading, error, retry }) {
  if (loading) return <div className="panel-card analytics-loading" role="status">Loading current data...</div>;
  if (error) return <div className="panel-card"><p className="form-error" role="alert">{error}</p><button className="secondary-button" onClick={retry}>Retry</button></div>;
  return null;
}
export function DataTable({ columns, rows, empty = 'No data available for this period.' }) {
  if (!rows.length) return <p>{empty}</p>;
  return <div className="table-wrap"><table><thead><tr>{columns.map(c => <th key={c.key}>{c.label}</th>)}</tr></thead><tbody>{rows.map((row, index) => <tr key={row._id || index}>{columns.map(c => <td key={c.key}>{c.render ? c.render(row[c.key], row) : row[c.key]}</td>)}</tr>)}</tbody></table></div>;
}
export function BarChart({ rows, labelKey = 'name', valueKey = 'revenue', money = true }) {
  if (!rows.some(row => row[valueKey] > 0)) return <p>No data available for this period.</p>;
  const max = Math.max(...rows.map(row => row[valueKey]), 1);
  return <div className="analytics-bars">{rows.map((row, i) => <div className="analytics-bar" key={row[labelKey] || i}><div><span>{row[labelKey]}</span><strong>{money ? currency(row[valueKey]) : row[valueKey]}</strong></div><div className="analytics-track"><span style={{ width: `${row[valueKey] / max * 100}%` }}/></div></div>)}</div>;
}
export function SalesChart({ rows }) {
  const [metric, setMetric] = useState('revenue');
  const max = Math.max(...rows.map(row => row[metric]), 1);
  const points = rows.map((row, i) => `${40 + i / Math.max(rows.length - 1, 1) * 680},${180 - row[metric] / max * 150}`).join(' ');
  return <><label>Chart metric<select value={metric} onChange={e => setMetric(e.target.value)}><option value="revenue">Revenue</option><option value="orders">Paid orders</option></select></label>
    {!rows.some(row => row[metric] > 0) ? <p>No sales data available for this period.</p> : <svg className="sales-chart" viewBox="0 0 760 220" role="img" aria-label={`${metric} trend. Exact values in the table below.`}>
      <title>{metric === 'revenue' ? 'Collected revenue' : 'Paid orders'} by period</title><line x1="40" y1="180" x2="720" y2="180" stroke="#bbb"/><polyline points={points} fill="none" stroke="#806243" strokeWidth="3"/>
      {rows.map((row, i) => <circle key={row.date} cx={40 + i / Math.max(rows.length - 1, 1) * 680} cy={180 - row[metric] / max * 150} r="3" fill="#806243"><title>{row.date}: {metric === 'revenue' ? currency(row[metric]) : row[metric]}</title></circle>)}
      <text x="40" y="205">{rows[0]?.date}</text><text x="720" y="205" textAnchor="end">{rows.at(-1)?.date}</text><text x="40" y="18">{metric === 'revenue' ? currency(max) : max}</text>
    </svg>}
    <details><summary>View exact sales figures</summary><DataTable columns={[{ key: 'date', label: 'Period begins (UTC)' }, { key: 'orders', label: 'Paid orders' }, { key: 'units', label: 'Units' }, { key: 'revenue', label: 'Revenue', render: currency }]} rows={rows}/></details>
  </>;
}
