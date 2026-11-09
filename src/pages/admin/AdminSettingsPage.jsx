import { useState } from 'react';
import { useAdminData } from '../../hooks/useAdminData';
import { useAdminMutation } from '../../hooks/useAdminMutation';
import { useShop } from '../../context/shopState';
import { DataState } from '../../components/Analytics';
export default function AdminSettingsPage() {
  const result = useAdminData('/admin/settings');
  return <div className="page-content container-inner analytics-page"><DataState {...result}/>{result.data && <SettingsForm key={JSON.stringify(result.data.settings)} initial={result.data.settings}/>}</div>;
}
function SettingsForm({ initial }) {
  const [form, setForm] = useState(initial), mutation = useAdminMutation(), { setSettings } = useShop();
  const save = e => { e.preventDefault(); mutation.run('/admin/settings', { method:'PUT',body:JSON.stringify(form) }, 'Shop settings saved.', data => setSettings(data.settings)); };
  return <form className="catalog-editor" onSubmit={save}><h3>Shop information</h3><p>These details appear in the storefront navigation, footer and contact information.</p>
    {mutation.error && <p className="form-error" role="alert">{mutation.error}</p>}{mutation.notice && <p className="catalog-success" role="status">{mutation.notice}</p>}
    <fieldset disabled={mutation.busy}><div className="product-form-grid">
      {[['name','Shop name',100,true],['location','Shop location / address',300,true],['email','Contact email',254,false],['phone','Contact phone',25,false]].map(([key,label,max,required]) => <label key={key}>{label}{required?' *':''}<input name={key} type={key==='email'?'email':key==='phone'?'tel':'text'} maxLength={max} required={required} value={form[key] || ''} onChange={e=>setForm({...form,[key]:e.target.value})}/></label>)}
    </div><div className="editor-actions"><button className="primary-button">{mutation.busy?'Saving...':'Save settings'}</button></div></fieldset>
  </form>;
}
