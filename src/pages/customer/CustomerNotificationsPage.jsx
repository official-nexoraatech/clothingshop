import { useState } from 'react';
import { useAuth } from '../../context/authState';
import { useAdminData } from '../../hooks/useAdminData';
export default function CustomerNotificationsPage() {
  const { request } = useAuth(), [page, setPage] = useState(1), [error, setError] = useState(''), [busy, setBusy] = useState(false);
  const listing = useAdminData('/notifications?page=' + page), unread = useAdminData('/notifications/unread-count');
  const read = async id => {
    if (busy) return;
    setBusy(true); setError('');
    try { await request(id ? '/notifications/' + id + '/read' : '/notifications/read-all', { method: 'PATCH' }); listing.retry(); unread.retry(); }
    catch (failure) { setError(failure.message); }
    finally { setBusy(false); }
  };
  return <div className="page-content container-inner"><div className="row-between"><h3>Notifications {unread.data && '(' + unread.data.count + ' unread)'}</h3><button className="secondary-button" disabled={busy || listing.loading} onClick={() => read()}>Mark all read</button></div>
    {(error || listing.error || unread.error) && <div role="alert"><p className="form-error">{error || listing.error || unread.error}</p><button onClick={() => { setError(''); listing.retry(); unread.retry(); }}>Retry</button></div>}
    {listing.loading ? <p role="status">Loading notifications…</p> : <div className="list-stack">{listing.data?.notifications.length ? listing.data.notifications.map(n => <button className="panel-card notification-item" key={n._id} disabled={busy} onClick={() => !n.isRead && read(n._id)}><div className="row-between"><strong>{n.title}</strong><small>{new Date(n.createdAt).toLocaleString()}</small></div><p>{n.message}</p><small>{n.isRead ? 'Read' : 'Unread'}</small></button>) : listing.data && <p>No new notifications.</p>}</div>}
    <div className="row-between"><button disabled={page === 1 || listing.loading} onClick={() => setPage(page - 1)}>Previous</button><span>Page {page}</span><button disabled={listing.loading || page >= (listing.data?.pagination.totalPages || 1)} onClick={() => setPage(page + 1)}>Next</button></div>
  </div>;
}

