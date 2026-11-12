import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Breadcrumb, ProductCard } from '../../components/Common';
import { useAuth } from '../../context/authState';
import { useAdminData } from '../../hooks/useAdminData';

const money = (value) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(Number(value || 0));

export default function ProductDetailsPage() {
  const { id } = useParams();
  return <ProductDetails key={id} id={id} />;
}

function ProductDetails({ id }) {
  const { request, user } = useAuth();
  const productResult = useAdminData(`/products/${id}`);
  const product = productResult.data?.product;
  const relatedResult = useAdminData(product?.category?._id ? `/products?category=${product.category._id}&limit=5` : '/products?limit=5');
  const [page, setPage] = useState(1);
  const [revision, setRevision] = useState(0);
  const reviewResult = useAdminData(`/products/${id}/reviews?${new URLSearchParams({ page, revision })}`);
  const [selection, setSelection] = useState({});
  const [imageIndex, setImageIndex] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);
  const [review, setReview] = useState({ rating: 5, text: '' });
  const [editing, setEditing] = useState(null);

  const refreshReviews = () => setRevision((value) => value + 1);
  const mutate = async (path, method, body, success, after) => {
    if (!user) { setNotice('Sign in to continue.'); return; }
    if (busy) return;
    setBusy(true); setNotice('');
    try {
      await request(path, { method, ...(body === undefined ? {} : { body: JSON.stringify(body) }) });
      setNotice(success);
      if (path === '/cart/items') window.dispatchEvent(new Event('cart-updated'));
      after?.();
    } catch (error) { setNotice(error.message); }
    finally { setBusy(false); }
  };

  if (productResult.loading) return <div className="container section-block" role="status">Loading product...</div>;
  if (productResult.error) return <div className="container section-block" role="alert"><p className="form-error">{productResult.error}</p><button className="secondary-button" onClick={productResult.retry}>Retry</button></div>;

  const variants = product.variants || [];
  const firstAvailable = variants.find((variant) => variant.stock > 0);
  const sizes = [...new Set(variants.map((variant) => variant.size))];
  const size = selection.size || firstAvailable?.size || sizes[0];
  const colors = [...new Set(variants.filter((variant) => variant.size === size).map((variant) => variant.color))];
  const color = selection.color && colors.includes(selection.color) ? selection.color : (colors.find((value) => variants.some((variant) => variant.size === size && variant.color === value && variant.stock > 0)) || colors[0]);
  const chosenVariant = variants.find((variant) => variant.size === size && variant.color === color);
  const images = product.images?.length ? product.images : [{ url: '/product-placeholder.svg', alt: product.name }];
  const summary = reviewResult.data?.summary;
  const related = (relatedResult.data?.products || []).filter((item) => item._id !== id).slice(0, 4);
  const submitReview = (event) => {
    event.preventDefault();
    mutate(editing ? `/reviews/${editing}` : '/reviews', editing ? 'PATCH' : 'POST', { productId: id, rating: Number(review.rating), text: review.text }, editing ? 'Review updated.' : 'Review submitted.', () => { setEditing(null); setReview({ rating: 5, text: '' }); refreshReviews(); });
  };
  const updateSize = (nextSize) => { setSelection({ size: nextSize }); setQuantity(1); };
  const updateColor = (nextColor) => { setSelection({ size, color: nextColor }); setQuantity(1); };

  return (
    <div className="container section-block product-detail-page">
      <Breadcrumb items={['Home', 'Products', product.name]} />
      <div className="product-detail-layout">
        <div className="product-gallery">
          <div className="main-gallery-image"><img src={images[imageIndex]?.url || images[0].url} alt={images[imageIndex]?.alt || product.name} onError={(event) => { event.currentTarget.onerror = null; event.currentTarget.src = '/product-placeholder.svg'; }} /></div>
          {images.length > 1 && <div className="thumb-row" aria-label="Product images">{images.map((item, index) => <button type="button" className={index === imageIndex ? 'selected' : ''} key={`${item.url}-${index}`} aria-label={`View product image ${index + 1}`} aria-pressed={index === imageIndex} onClick={() => setImageIndex(index)}><img src={item.url} alt="" loading="lazy" /></button>)}</div>}
        </div>
        <div className="product-meta-panel">
          <p className="eyebrow">{product.brand?.name || product.category?.name || 'Collection'}</p>
          <h1>{product.name}</h1>
          <p className="product-detail-rating">{summary?.count ? <><span aria-hidden="true">&#9733;</span> {summary.average} <a href="#customer-reviews">({summary.count} reviews)</a></> : 'No reviews yet'}</p>
          <div className="product-detail-price"><strong>{money(chosenVariant?.price ?? product.effectivePrice ?? product.price)}</strong>{Number(product.discount) > 0 && <><del>{money(product.price)}</del><span>{product.discount}% off</span></>}</div>
          <p className={`stock-status ${chosenVariant?.stock > 0 ? 'is-available' : 'is-unavailable'}`} aria-live="polite">{chosenVariant?.stock > 0 ? `${chosenVariant.stock} available` : 'Out of stock'}</p>

          <div className="selection-block"><div className="selection-heading"><h2>Size</h2>{product.sizeGuide && <span>{product.sizeGuide}</span>}</div><div className="size-options">{sizes.map((value) => { const inStock = variants.some((variant) => variant.size === value && variant.stock > 0); return <button type="button" key={value} className={`${size === value ? 'selected' : ''} ${inStock ? '' : 'unavailable'}`} disabled={!inStock} aria-pressed={size === value} onClick={() => updateSize(value)}>{value}</button>; })}</div></div>
          {colors.length > 0 && <div className="selection-block"><div className="selection-heading"><h2>Colour</h2><span>{color}</span></div><div className="color-options">{colors.map((value) => { const inStock = variants.some((variant) => variant.size === size && variant.color === value && variant.stock > 0); return <button type="button" key={value} className={`${color === value ? 'selected' : ''} ${inStock ? '' : 'unavailable'}`} disabled={!inStock} aria-pressed={color === value} onClick={() => updateColor(value)}>{value}</button>; })}</div></div>}

          <div className="purchase-row"><div className="quantity-control" aria-label="Quantity"><button type="button" aria-label="Decrease quantity" disabled={quantity <= 1} onClick={() => setQuantity((value) => value - 1)}>&minus;</button><span aria-live="polite">{quantity}</span><button type="button" aria-label="Increase quantity" disabled={!chosenVariant?.stock || quantity >= chosenVariant.stock} onClick={() => setQuantity((value) => Math.min(value + 1, chosenVariant.stock))}>+</button></div><button type="button" className="primary-button" disabled={!chosenVariant?.stock || busy} onClick={() => mutate('/cart/items', 'POST', { productId: id, variantId: chosenVariant._id, quantity }, 'Added to your bag.')}>{busy ? 'Adding...' : 'Add to Bag'}</button></div>
          <button type="button" className="detail-wishlist" disabled={busy} onClick={() => mutate('/wishlist', 'POST', { productId: id }, 'Saved to your wishlist.')}>&#9825; Add to wishlist</button>
          {notice && <p className="toast" role="status">{notice}{!user && <> <Link to="/login">Sign in</Link></>}</p>}
          <div className="product-description"><h2>About this piece</h2><p>{product.description}</p></div>
        </div>
      </div>

      <section id="customer-reviews" className="product-reviews section-block"><div className="section-head"><p className="eyebrow">Customer notes</p><h2>Reviews {summary?.count ? `(${summary.count})` : ''}</h2></div>
        {summary?.distribution && <div className="review-distribution">{summary.distribution.map((item) => <span key={item.rating}>{item.rating} &#9733; <b>{item.count}</b></span>)}</div>}
        {reviewResult.error && <div role="alert"><p className="form-error">{reviewResult.error}</p><button className="secondary-button" onClick={reviewResult.retry}>Retry reviews</button></div>}
        {reviewResult.loading ? <p role="status">Loading reviews...</p> : reviewResult.data?.reviews.length ? <div className="review-list">{reviewResult.data.reviews.map((item) => <article className="review-entry" key={item._id}><div className="review-entry-head"><strong>{item.reviewer}</strong><span aria-label={`${item.rating} out of 5 stars`}>{'★'.repeat(item.rating)}</span></div><p>{item.text}</p><small>{item.verifiedPurchase ? 'Verified purchase · ' : ''}{new Date(item.createdAt).toLocaleDateString()}</small>{item.isOwner && <div className="row-actions"><button type="button" onClick={() => { setEditing(item._id); setReview({ rating: item.rating, text: item.text }); }}>Edit review</button><button type="button" disabled={busy} onClick={() => mutate(`/reviews/${item._id}`, 'DELETE', undefined, 'Review deleted.', () => { setEditing(null); setReview({ rating: 5, text: '' }); refreshReviews(); })}>Delete review</button></div>}</article>)}</div> : reviewResult.data && <p>No reviews have been shared yet.</p>}
        <div className="pagination-row"><button className="secondary-button" disabled={page === 1 || reviewResult.loading} onClick={() => setPage((value) => value - 1)}>Previous reviews</button><span>Page {page}</span><button className="secondary-button" disabled={reviewResult.loading || page >= (reviewResult.data?.pagination.totalPages || 1)} onClick={() => setPage((value) => value + 1)}>Next reviews</button></div>
        {user?.role === 'customer' && <form className="review-form form-grid" onSubmit={submitReview}><h3>{editing ? 'Edit your review' : 'Write a review'}</h3><label>Rating<select value={review.rating} onChange={(event) => setReview({ ...review, rating: event.target.value })}>{[5, 4, 3, 2, 1].map((value) => <option key={value} value={value}>{value} stars</option>)}</select></label><label>Your review<textarea required maxLength={3000} value={review.text} placeholder="Share your experience" onChange={(event) => setReview({ ...review, text: event.target.value })} /></label><button className="primary-button" disabled={busy}>{editing ? 'Save review' : 'Submit review'}</button>{editing && <button type="button" onClick={() => { setEditing(null); setReview({ rating: 5, text: '' }); }}>Cancel edit</button>}</form>}
      </section>
      {related.length > 0 && <section className="related-products section-block"><div className="section-head"><p className="eyebrow">More to discover</p><h2>From the same collection</h2></div><div className="product-grid">{related.map((item) => <ProductCard key={item._id} product={item} />)}</div></section>}
    </div>
  );
}
