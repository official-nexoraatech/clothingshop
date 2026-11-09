import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAdminData } from '../../hooks/useAdminData';
import { useAdminMutation } from '../../hooks/useAdminMutation';
import { DataState, DataTable } from '../../components/Analytics';
import { Pagination } from '../../components/Orders';
import { currency } from '../../utils/format';
export default function AdminCustomersPage() {
  const [search,setSearch]=useState(''),[query,setQuery]=useState(''),[page,setPage]=useState(1),[status,setStatus]=useState(''),[selected,setSelected]=useState(null),[confirm,setConfirm]=useState(null);
  const result=useAdminData(`/admin/customers?${new URLSearchParams({search:query,page,limit:20,status})}`), mutation=useAdminMutation();
  const update=()=>mutation.run(`/admin/customers/${confirm._id}/status`,{method:'PATCH',body:JSON.stringify({status:confirm.status==='blocked'?'active':'blocked'})},'Customer status updated.',()=>{setConfirm(null);setSelected(null);result.retry();});
  return <div className="page-content container-inner analytics-page">
    <p>Customer accounts only. Blocking prevents login and authenticated requests, including existing sessions.</p>
    {mutation.error&&<p className="form-error" role="alert">{mutation.error}</p>}{mutation.notice&&<p className="catalog-success" role="status">{mutation.notice}</p>}
    <form className="analytics-filters panel-card" onSubmit={e=>{e.preventDefault();setQuery(search.trim());setPage(1);result.retry();}}><label>Search customers<input name="customerSearch" value={search} onChange={e=>setSearch(e.target.value)} placeholder="Name, email or phone"/></label><label>Status<select value={status} onChange={e=>{setStatus(e.target.value);setPage(1);}}><option value="">All</option>{['active','blocked','inactive'].map(s=><option key={s}>{s}</option>)}</select></label><button className="secondary-button">Search customers</button></form>
    {confirm&&<section className="panel-card"><h3>{confirm.status==='blocked'?'Unblock':'Block'} {confirm.name}?</h3><p>The customer's order history will be preserved.</p><div className="editor-actions"><button className="primary-button" disabled={mutation.busy} onClick={update}>Confirm status change</button><button className="secondary-button" disabled={mutation.busy} onClick={()=>setConfirm(null)}>Cancel status change</button></div></section>}
    <DataState {...result}/>{result.data&&<><DataTable empty="No matching customers." rows={result.data.rows} columns={[{key:'name',label:'Name'},{key:'email',label:'Email'},{key:'phone',label:'Phone'},{key:'orders',label:'Orders'},{key:'status',label:'Status'},{key:'_id',label:'Actions',render:(_id,row)=><div className="brand-actions"><button disabled={mutation.busy} onClick={()=>setSelected(row._id)}>View customer</button><button disabled={mutation.busy||Boolean(confirm)} onClick={()=>{setConfirm(row);mutation.clear();}}>{row.status==='blocked'?'Unblock':'Block'}</button></div>}]}/><Pagination pagination={result.data.pagination} onPage={setPage}/></>}
    {selected&&<CustomerDetails key={selected} id={selected} onClose={()=>setSelected(null)}/>}
  </div>;
}
function CustomerDetails({id,onClose}) {
  const [page,setPage]=useState(1), result=useAdminData(`/admin/customers/${id}?page=${page}&limit=10`), c=result.data?.customer;
  return <section className="panel-card"><button className="secondary-button" onClick={onClose}>Close customer</button><DataState {...result}/>{c&&<><h3>{c.name}</h3><p>{c.email} {c.phone} · {c.status}</p><p>Registered: {c.createdAt.slice(0,10)}</p><h4>Order history</h4><DataTable empty="This customer has no orders." rows={result.data.rows} columns={[{key:'orderNumber',label:'Order',render:(value,row)=><Link to={`/admin/orders?order=${row._id}`}>{value}</Link>},{key:'createdAt',label:'Date',render:v=>v.slice(0,10)},{key:'grandTotal',label:'Total',render:currency},{key:'status',label:'Status'},{key:'paymentStatus',label:'Payment'}]}/><Pagination pagination={result.data.pagination} onPage={setPage}/></>}</section>;
}
