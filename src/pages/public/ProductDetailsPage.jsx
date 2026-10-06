import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Breadcrumb, Badge } from '../../components/Common';
import { useAuth } from '../../context/authState';
import { useAdminData } from '../../hooks/useAdminData';
export default function ProductDetailsPage() {
  const { id } = useParams();
  return <ProductDetails key={id} id={id} />;
}
function ProductDetails({ id }) {
  const { request, user } = useAuth(), productResult = useAdminData('/products/' + id);
  const [page, setPage] = useState(1), [revision, setRevision] = useState(0);
  const reviewResult = useAdminData('/products/' + id + '/reviews?' + new URLSearchParams({ page, revision }));
  const [selection, setSelection] = useState({}), [image, setImage] = useState(0), [notice, setNotice] = useState(''), [busy, setBusy] = useState(false);
  const [review, setReview] = useState({ rating: 5, text: '' }), [editing, setEditing] = useState(null);
  const refreshReviews = () => { setRevision(x => x + 1); };
  const mutate = async (path, method, body, success, after) => {
    if (!user) { setNotice('Please log in to continue.'); return; }
    if (busy) return;
    setBusy(true); setNotice('');
    try { await request(path, { method, ...(body === undefined ? {} : { body: JSON.stringify(body) }) }); setNotice(success); after?.(); }
    catch (error) { setNotice(error.message); }
    finally { setBusy(false); }
  };
  if (productResult.loading) return <div className="container section-block" role="status">Loading product…</div>;
  if (productResult.error) return <div className="container section-block" role="alert"><p className="form-error">{productResult.error}</p><button onClick={productResult.retry}>Retry</button></div>;
  const product = productResult.data.product, variants = product.variants || [];
  const sizes = [...new Set(variants.map(v => v.size))], size = selection.size || sizes[0];
  const colors = [...new Set(variants.filter(v => v.size === size).map(v => v.color))], color = selection.color || colors[0];
  const available = variants.find(v => v.size === size && v.color === color);
  const images = product.images?.length ? product.images : [{ url: '/product-placeholder.svg' }];
  const summary = reviewResult.data?.summary;
  const submit = event => { event.preventDefault(); mutate(editing ? '/reviews/' + editing : '/reviews', editing ? 'PATCH' : 'POST', { productId: id, rating: Number(review.rating), text: review.text }, editing ? 'Review updated.' : 'Review submitted.', () => { setEditing(null); setReview({ rating: 5, text: '' }); refreshReviews(); }); };
  return <div className="container section-block"><Breadcrumb items={['Home','Products',product.name]} /><div className="product-detail-layout">
    <div className="gallery-panel"><div className="main-gallery-image"><img src={(images[image] || images[0]).url} alt={product.name} onError={e => { e.currentTarget.onerror = null; e.currentTarget.src = '/product-placeholder.svg'; }} /></div><div className="thumb-row">{images.map((x,i) => <button key={x.url} aria-label={'View image ' + (i+1)} onClick={() => setImage(i)}><img src={x.url} alt={x.alt || product.name} /></button>)}</div></div>
    <div className="product-meta-panel"><p className="eyebrow">{product.brand?.name}</p><h1>{product.name}</h1><p className="rating">★ {summary?.average || 0} ({summary?.count || 0} reviews)</p><div className="price-row big"><strong>₹{available?.price ?? product.effectivePrice}</strong></div><Badge tone="primary">{available?.stock > 0 ? 'In stock' : 'Out of stock'}</Badge>
    <div className="selection-block"><h4>Size</h4><div className="chip-row">{sizes.map(x => <button key={x} className={size===x?'selected':''} onClick={() => setSelection({ size: x })}>{x}</button>)}</div></div>
    <div className="selection-block"><h4>Color</h4><div className="chip-row">{colors.map(x => <button key={x} className={color===x?'selected':''} onClick={() => setSelection({ size, color: x })}>{x}</button>)}</div></div>
    <div className="cta-row detail-actions"><button className="primary-button" disabled={!available?.stock || busy} onClick={() => mutate('/cart/items','POST',{ productId: id, variantId: available._id, quantity: 1 },'Added to your bag.')}>Add to Bag</button><button className="secondary-button" disabled={busy} onClick={() => mutate('/wishlist','POST',{ productId: id },'Saved to your wishlist.')}>Save to wishlist</button><Link className="secondary-button" to="/products">Back to products</Link></div>
    {notice && <p className="toast" role="status">{notice}{!user && <Link to="/login"> Login</Link>}</p>}<div className="info-card"><h4>Description</h4><p>{product.description}</p></div></div></div>
    <section className="section-block"><h2>Customer reviews</h2><p>{summary?.distribution?.map(x => x.rating + '★ ' + x.count).join(' · ')}</p>
      {reviewResult.error && <div role="alert"><p className="form-error">{reviewResult.error}</p><button onClick={reviewResult.retry}>Retry reviews</button></div>}
      {reviewResult.loading ? <p role="status">Loading reviews…</p> : reviewResult.data?.reviews.length ? reviewResult.data.reviews.map(r => <article className="panel-card" key={r._id}><strong>{r.reviewer} · {'★'.repeat(r.rating)}</strong><p>{r.text}</p><small>{r.verifiedPurchase ? 'Verified purchase · ' : ''}{new Date(r.createdAt).toLocaleDateString()}</small>{r.isOwner && <div className="row-actions"><button disabled={busy} onClick={() => { setEditing(r._id); setReview({ rating:r.rating, text:r.text }); }}>Edit review</button><button disabled={busy} onClick={() => mutate('/reviews/' + r._id,'DELETE',undefined,'Review deleted.', () => { setEditing(null); setReview({rating:5,text:''}); refreshReviews(); })}>Delete review</button></div>}</article>) : reviewResult.data && <p>No reviews yet.</p>}
      <div className="row-between"><button disabled={page===1 || reviewResult.loading} onClick={() => setPage(page-1)}>Previous reviews</button><span>Page {page}</span><button disabled={reviewResult.loading || page >= (reviewResult.data?.pagination.totalPages || 1)} onClick={() => setPage(page+1)}>Next reviews</button></div>
      {user?.role==='customer' && <form className="panel-card form-grid" onSubmit={submit}><h3>{editing ? 'Edit your review' : 'Write a review'}</h3><label>Rating<select value={review.rating} onChange={e => setReview({...review,rating:e.target.value})}>{[5,4,3,2,1].map(x => <option key={x} value={x}>{x} stars</option>)}</select></label><label>Review<textarea required maxLength={3000} value={review.text} placeholder="Share your experience" onChange={e => setReview({...review,text:e.target.value})} /></label><button className="primary-button" disabled={busy}>{editing ? 'Save review' : 'Submit review'}</button>{editing && <button type="button" onClick={() => { setEditing(null); setReview({rating:5,text:''}); }}>Cancel edit</button>}</form>}
    </section>
  </div>;
}

