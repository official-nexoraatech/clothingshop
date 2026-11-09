import { useState } from 'react';
import { useAdminData } from '../../hooks/useAdminData';
import { useAdminMutation } from '../../hooks/useAdminMutation';
import { DataState } from '../../components/Analytics';
import { Pagination } from '../../components/Orders';
import { currency } from '../../utils/format';
const empty = () => ({code:'',description:'',discountType:'percentage',discountValue:'',minimumOrderValue:'0',maximumDiscount:'',startDate:new Date().toISOString().slice(0,16),expiryDate:'',usageLimit:'',status:'active'});
export default function AdminCouponsPage() {
  const [page,setPage]=useState(1),[search,setSearch]=useState(''),[query,setQuery]=useState(''),[status,setStatus]=useState('');
  const [form,setForm]=useState(empty),[editing,setEditing]=useState(null),[deleting,setDeleting]=useState(null);
  const result=useAdminData(`/admin/coupons?${new URLSearchParams({page,limit:20,search:query,status})}`), mutation=useAdminMutation();
  const reset=()=>{setEditing(null);setForm(empty());};
  const change=(key,value)=>setForm(x=>({...x,[key]:value}));
  const select=c=>{setEditing(c);mutation.clear();setForm({code:c.code,description:c.description||'',discountType:c.discountType,discountValue:String(c.discountValue),minimumOrderValue:String(c.minimumOrderValue),maximumDiscount:c.maximumDiscount==null?'':String(c.maximumDiscount),startDate:c.startDate.slice(0,16),expiryDate:c.expiryDate.slice(0,16),usageLimit:c.usageLimit==null?'':String(c.usageLimit),status:c.status});};
  const save=e=>{
    e.preventDefault();
    const body={...form,discountValue:Number(form.discountValue),minimumOrderValue:Number(form.minimumOrderValue),maximumDiscount:form.maximumDiscount===''?null:Number(form.maximumDiscount),usageLimit:form.usageLimit===''?null:Number(form.usageLimit),startDate:new Date(form.startDate+'Z').toISOString(),expiryDate:new Date(form.expiryDate+'Z').toISOString()};
    mutation.run(editing?`/admin/coupons/${editing._id}`:'/admin/coupons',{method:editing?'PATCH':'POST',body:JSON.stringify(body)},editing?'Coupon updated.':'Coupon created.',()=>{reset();setPage(1);result.retry();});
  };
  const toggle=c=>mutation.run(`/admin/coupons/${c._id}`,{method:'PATCH',body:JSON.stringify({status:c.status==='active'?'inactive':'active'})},'Coupon status updated.',()=>{if(editing?._id===c._id)reset();result.retry();});
  const remove=()=>mutation.run(`/admin/coupons/${deleting._id}`,{method:'DELETE'},'Coupon deleted.',()=>{if(editing?._id===deleting._id)reset();setDeleting(null);setPage(1);result.retry();});
  return <div className="page-content container-inner analytics-page coupon-page">
    {mutation.error&&<p className="form-error" role="alert">{mutation.error}</p>}{mutation.notice&&<p className="catalog-success" role="status">{mutation.notice}</p>}
    <form className="catalog-editor" onSubmit={save}><h3>{editing?'Edit coupon':'Add coupon'}</h3><p>Dates use UTC. Blank maximum discount or usage limit means no limit. Usage is updated by completed order placement.</p><fieldset disabled={mutation.busy||Boolean(deleting)}><div className="product-form-grid">
      <label>Code *<input name="code" required maxLength={40} pattern="[A-Za-z0-9][A-Za-z0-9_&\-]{0,39}" disabled={Boolean(editing?.usageCount)} value={form.code} onChange={e=>change('code',e.target.value)} placeholder="e.g. FASHION10"/></label>
      <label>Discount type<select name="discountType" value={form.discountType} onChange={e=>change('discountType',e.target.value)}><option value="percentage">Percentage</option><option value="fixed">Fixed amount (INR)</option></select></label>
      <label>Discount value *<input name="discountValue" type="number" min="0.01" max={form.discountType==='percentage'?100:1000000000} step="0.01" required value={form.discountValue} onChange={e=>change('discountValue',e.target.value)}/></label>
      <label>Minimum order value<input name="minimumOrderValue" type="number" min="0" max="1000000000" step="0.01" required value={form.minimumOrderValue} onChange={e=>change('minimumOrderValue',e.target.value)}/></label>
      <label>Maximum discount (optional)<input name="maximumDiscount" type="number" min="0" max="1000000000" step="0.01" value={form.maximumDiscount} onChange={e=>change('maximumDiscount',e.target.value)}/></label>
      <label>Usage limit (optional)<input name="usageLimit" type="number" min={Math.max(1,editing?.usageCount||0)} max="1000000000" step="1" value={form.usageLimit} onChange={e=>change('usageLimit',e.target.value)}/></label>
      <label>Starts (UTC) *<input name="startDate" type="datetime-local" required value={form.startDate} onChange={e=>change('startDate',e.target.value)}/></label>
      <label>Expires (UTC) *<input name="expiryDate" type="datetime-local" min={form.startDate} required value={form.expiryDate} onChange={e=>change('expiryDate',e.target.value)}/></label>
      <label>Status<select name="couponStatus" value={form.status} onChange={e=>change('status',e.target.value)}><option value="active">Active</option><option value="inactive">Inactive</option></select></label>
      <label className="wide-field">Description<textarea name="description" maxLength={1000} value={form.description} onChange={e=>change('description',e.target.value)}/></label>
    </div><div className="editor-actions"><button className="primary-button">{mutation.busy?'Saving...':editing?'Save coupon':'Create coupon'}</button>{editing&&<button type="button" className="secondary-button" onClick={reset}>Cancel editing</button>}</div></fieldset></form>
    {deleting&&<section className="panel-card" aria-label="Confirm coupon deletion"><h3>Delete {deleting.code}?</h3><p>Used coupons cannot be deleted. Deactivate them to preserve order history.</p><div className="editor-actions"><button className="primary-button" disabled={mutation.busy} onClick={remove}>Confirm delete</button><button className="secondary-button" disabled={mutation.busy} onClick={()=>setDeleting(null)}>Keep coupon</button></div></section>}
    <form className="analytics-filters" onSubmit={e=>{e.preventDefault();setQuery(search.trim());setPage(1);result.retry();}}><label>Search code<input name="search" value={search} onChange={e=>setSearch(e.target.value)}/></label><label>Status filter<select value={status} onChange={e=>{setStatus(e.target.value);setPage(1);}}><option value="">All</option><option value="active">Active</option><option value="inactive">Inactive</option></select></label><button className="secondary-button">Search coupons</button></form>
    <DataState {...result}/>{result.data&&<><div className="table-wrap"><table><thead><tr><th>Code</th><th>Discount</th><th>Dates (UTC)</th><th>Usage</th><th>Availability</th><th>Actions</th></tr></thead><tbody>{result.data.rows.map(c=><tr key={c._id}><td>{c.code}<br/>{c.description}</td><td>{c.discountType==='percentage'?`${c.discountValue}%`:currency(c.discountValue)}<br/>Minimum {currency(c.minimumOrderValue)}{c.maximumDiscount!=null&&<><br/>Cap {currency(c.maximumDiscount)}</>}</td><td>{c.startDate.slice(0,16).replace('T',' ')}<br/>{c.expiryDate.slice(0,16).replace('T',' ')}</td><td>{c.usageCount} / {c.usageLimit??'Unlimited'}</td><td><span className={`badge ${c.availability==='Available'?'success':'warning'}`}>{c.availability}</span></td><td><div className="brand-actions"><button disabled={mutation.busy||Boolean(deleting)} onClick={()=>select(c)}>Edit</button><button disabled={mutation.busy||Boolean(deleting)} onClick={()=>toggle(c)}>{c.status==='active'?'Deactivate':'Activate'}</button><button disabled={mutation.busy||Boolean(deleting)||c.usageCount>0} title={c.usageCount?'Used coupons must be deactivated':undefined} onClick={()=>{setDeleting(c);mutation.clear();}}>Delete</button></div></td></tr>)}</tbody></table></div>{!result.data.rows.length&&<p>No matching coupons.</p>}<Pagination pagination={result.data.pagination} onPage={setPage}/></>}
  </div>;
}
