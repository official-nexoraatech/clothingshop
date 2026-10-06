import { useState } from 'react';
import { useAuth } from '../context/authState';
import { useAdminData } from '../hooks/useAdminData';
const categories = ['Order', 'Payment', 'Product', 'Delivery', 'Return', 'Account', 'Other'];
const priorities = ['Low', 'Medium', 'High', 'Urgent'];
const statuses = ['Open', 'In Progress', 'Waiting for Customer', 'Resolved', 'Closed'];
const initial = { subject: '', description: '', category: 'Order', priority: 'Medium' };
export default function Support() {
  const { user, request } = useAuth(), staff = user.role !== 'customer';
  const [page, setPage] = useState(1), [filter, setFilter] = useState({ status: '', priority: '', category: '' });
  const [selected, setSelected] = useState(null), [form, setForm] = useState(initial), [reply, setReply] = useState('');
  const [error, setError] = useState(''), [busy, setBusy] = useState(false), [opening, setOpening] = useState(false);
  const list = useAdminData('/support/tickets?' + new URLSearchParams({ ...filter, page }));
  const open = async id => {
    setOpening(true); setError('');
    try { setSelected(await request('/support/tickets/' + id)); setReply(''); }
    catch (failure) { setError(failure.message); }
    finally { setOpening(false); }
  };
  const mutate = async (path, method, body, after) => {
    if (busy) return;
    setBusy(true); setError('');
    try { const data = await request(path, { method, body: JSON.stringify(body) }); await after?.(data); list.retry(); }
    catch (failure) { setError(failure.message); }
    finally { setBusy(false); }
  };
  const create = event => { event.preventDefault(); mutate('/support/tickets', 'POST', form, async data => { setForm(initial); setPage(1); await open(data.ticket._id); }); };
  const send = event => { event.preventDefault(); mutate('/support/tickets/' + selected.ticket._id + '/messages', 'POST', { message: reply }, () => open(selected.ticket._id)); };
  const update = status => mutate('/support/tickets/' + selected.ticket._id, 'PATCH', { status }, () => open(selected.ticket._id));
  return <div className="page-content container-inner">
    {(error || list.error) && <div role="alert"><p className="form-error">{error || list.error}</p><button onClick={() => { setError(''); list.retry(); }}>Retry</button></div>}
    <div className="grid-2">
      {!staff && <form className="panel-card form-grid" onSubmit={create}><h3>Create support ticket</h3>
        <label>Subject<input value={form.subject} maxLength={200} required onChange={e => setForm({ ...form, subject: e.target.value })} /></label>
        <label>Description<textarea value={form.description} maxLength={4000} required onChange={e => setForm({ ...form, description: e.target.value })} /></label>
        <label>Category<select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}>{categories.map(x => <option key={x}>{x}</option>)}</select></label>
        <label>Priority<select value={form.priority} onChange={e => setForm({ ...form, priority: e.target.value })}>{priorities.map(x => <option key={x}>{x}</option>)}</select></label>
        <button className="primary-button" disabled={busy}>{busy ? 'Saving…' : 'Open ticket'}</button></form>}
      <section className="panel-card"><h3>{staff ? 'Support management' : 'My tickets'}</h3>
        <div className="form-grid">{Object.entries({ status: statuses, priority: priorities, category: categories }).map(([key, values]) => <label key={key}>Filter {key}<select value={filter[key]} onChange={e => { setFilter({ ...filter, [key]: e.target.value }); setPage(1); }}><option value="">All</option>{values.map(x => <option key={x}>{x}</option>)}</select></label>)}</div>
        {list.loading ? <p role="status">Loading tickets…</p> : list.data?.tickets.length ? list.data.tickets.map(ticket => <button className="list-row" disabled={opening || busy} key={ticket._id} onClick={() => open(ticket._id)}><strong>{ticket.ticketNumber}</strong><span>{ticket.subject}</span><small>{ticket.status} · {ticket.priority}</small></button>) : list.data && <p>No tickets found.</p>}
        <div className="row-between"><button disabled={page === 1 || list.loading} onClick={() => setPage(page - 1)}>Previous</button><span>Page {page}</span><button disabled={list.loading || page >= (list.data?.pagination.totalPages || 1)} onClick={() => setPage(page + 1)}>Next</button></div>
      </section>
    </div>
    {opening && <p role="status">Loading conversation…</p>}
    {selected && <section className="panel-card"><h3>{selected.ticket.ticketNumber}: {selected.ticket.subject}</h3><p>{selected.ticket.description}</p>
      {staff ? <label>Ticket status<select value={selected.ticket.status} disabled={busy || opening} onChange={e => update(e.target.value)}>{statuses.map(x => <option key={x}>{x}</option>)}</select></label> : <p>{selected.ticket.status}</p>}
      <div className="list-stack">{selected.messages.map(message => <div className="notification-item" key={message._id}><strong>{message.sender?.name || message.senderRole}</strong><p>{message.message}</p></div>)}</div>
      {selected.ticket.status !== 'Closed' && <form className="form-grid" onSubmit={send}><label>Reply<textarea value={reply} onChange={e => setReply(e.target.value)} required maxLength={4000} /></label><button className="primary-button" disabled={busy || opening}>{busy ? 'Sending…' : 'Send reply'}</button></form>}
    </section>}
  </div>;
}

