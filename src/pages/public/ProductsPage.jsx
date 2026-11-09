import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ProductCard } from '../../components/Common';
import { useAdminData } from '../../hooks/useAdminData';

const filterLabels = { search: 'Search', category: 'Category', brand: 'Brand', size: 'Size', color: 'Colour', minPrice: 'Min price', maxPrice: 'Max price', availability: 'Availability' };

export default function ProductsPage() {
  const [params, setParams] = useSearchParams();
  const [draft, setDraft] = useState(() => new URLSearchParams(params));
  const [filtersOpen, setFiltersOpen] = useState(false);
  const query = params.toString();
  const requestedSort = params.get('sort') || 'recommended';
  const apiParams = new URLSearchParams(params);
  if (requestedSort === 'recommended') apiParams.delete('sort');
  const apiQuery = apiParams.toString();
  const products = useAdminData(`/products${apiQuery ? `?${apiQuery}` : ''}`);
  const facetProducts = useAdminData('/products?limit=50');
  const categories = useAdminData('/categories');
  const brands = useAdminData('/brands');
  const items = [...(products.data?.products || [])];
  if (requestedSort === 'recommended') items.sort((a, b) => Number(Boolean(b.isFeatured)) - Number(Boolean(a.isFeatured)) || Number(Boolean(b.isTrending)) - Number(Boolean(a.isTrending)) || Number(Boolean(b.isNewArrival)) - Number(Boolean(a.isNewArrival)) || Number(b.ratingSummary?.average || 0) - Number(a.ratingSummary?.average || 0));
  const meta = products.data?.pagination || {};
  const categoryList = categories.data?.categories || [];
  const brandList = brands.data?.brands || [];
  const facetItems = facetProducts.data?.products || [];
  const sizes = [...new Set(facetItems.flatMap((product) => product.variants || []).map((variant) => variant.size).filter(Boolean))].sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
  const colors = [...new Set(facetItems.flatMap((product) => product.variants || []).map((variant) => variant.color).filter(Boolean))].sort((a, b) => a.localeCompare(b));
  const selectedCategory = categoryList.find((item) => item._id === params.get('category'));
  const state = { loading: products.loading || facetProducts.loading || categories.loading || brands.loading, error: products.error || facetProducts.error || categories.error || brands.error };

  useEffect(() => setDraft(new URLSearchParams(query)), [query]);
  useEffect(() => {
    if (!filtersOpen) return undefined;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const closeOnEscape = (event) => { if (event.key === 'Escape') setFiltersOpen(false); };
    window.addEventListener('keydown', closeOnEscape);
    return () => { document.body.style.overflow = previousOverflow; window.removeEventListener('keydown', closeOnEscape); };
  }, [filtersOpen]);

  const change = (key, value) => {
    setDraft((current) => {
      const next = new URLSearchParams(current);
      if (value) next.set(key, value); else next.delete(key);
      next.delete('page');
      return next;
    });
  };
  const apply = () => {
    const next = new URLSearchParams(draft);
    next.delete('page');
    setParams(next);
    setFiltersOpen(false);
  };
  const clear = () => { setDraft(new URLSearchParams()); setParams({}); };
  const setPage = (page) => { const next = new URLSearchParams(params); next.set('page', page); setParams(next); };
  const activeFilters = [...params.entries()].filter(([key]) => key in filterLabels).map(([key, value]) => {
    if (key === 'category') value = categoryList.find((item) => item._id === value)?.name || value;
    if (key === 'brand') value = brandList.find((item) => item._id === value)?.name || value;
    if (key === 'availability') value = 'In stock';
    return { key, label: `${filterLabels[key]}: ${value}` };
  });
  const retry = () => { products.retry(); facetProducts.retry(); categories.retry(); brands.retry(); };

  const filterPanel = (
      <div className="filters-panel-inner">
      <div className="filter-drawer-heading"><div><span className="filter-kicker">Refine your edit</span><h2>Filters</h2></div><button type="button" className="filter-close" onClick={() => setFiltersOpen(false)} aria-label="Close filters">Close</button></div>
      <div className="filter-block filter-search-block"><label><span className="filter-label">Search</span><span className="filter-search-wrap"><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="10.8" cy="10.8" r="6.8"/><path d="m16 16 4.2 4.2"/></svg><input placeholder="Search products" value={draft.get('search') || ''} onChange={(event) => change('search', event.target.value)} /></span></label></div>
      <div className="filter-block"><label><span className="filter-label">Category</span><select value={draft.get('category') || ''} onChange={(event) => change('category', event.target.value)}><option value="">All categories</option>{categoryList.map((item) => <option key={item._id} value={item._id}>{item.name}</option>)}</select></label></div>
      <div className="filter-block"><label><span className="filter-label">Brand</span><select value={draft.get('brand') || ''} onChange={(event) => change('brand', event.target.value)}><option value="">All brands</option>{brandList.map((item) => <option key={item._id} value={item._id}>{item.name}</option>)}</select></label></div>
      {sizes.length > 0 && <div className="filter-block"><span className="filter-label">Size</span><div className="chip-row">{sizes.map((size) => <button type="button" key={size} className={draft.get('size') === size ? 'selected' : ''} aria-pressed={draft.get('size') === size} onClick={() => change('size', draft.get('size') === size ? '' : size)}>{size}</button>)}</div></div>}
      {colors.length > 0 && <div className="filter-block"><label>Colour<select value={draft.get('color') || ''} onChange={(event) => change('color', event.target.value)}><option value="">All colours</option>{colors.map((color) => <option value={color} key={color}>{color}</option>)}</select></label></div>}
      <div className="filter-block price-filter"><span className="filter-label">Price range</span><div className="price-filter-fields"><label><span>Min</span><input aria-label="Minimum price" type="number" min="0" step="1" value={draft.get('minPrice') || ''} onChange={(event) => change('minPrice', event.target.value)} /></label><span aria-hidden="true">—</span><label><span>Max</span><input aria-label="Maximum price" type="number" min="0" step="1" value={draft.get('maxPrice') || ''} onChange={(event) => change('maxPrice', event.target.value)} /></label></div><small>Prices use the product base price before discounts.</small></div>
      <label className="check-line"><input type="checkbox" checked={draft.get('availability') === 'in_stock'} onChange={(event) => change('availability', event.target.checked ? 'in_stock' : '')} /> In stock</label>
      <div className="filter-actions"><button type="button" className="filter-clear" onClick={clear}>Clear all filters</button><button type="button" className="primary-button" onClick={apply}>View {meta.totalItems || 0} pieces</button></div>
    </div>
  );

  return (
    <div className="container section-block catalog-page">
      <nav className="breadcrumb catalog-breadcrumb" aria-label="Breadcrumb"><Link to="/">Home</Link><span className="separator" aria-hidden="true">/</span><span aria-current="page">Products</span></nav>
      <div className="page-top row-between"><div><p className="eyebrow">The collection</p><h1>{params.get('search') ? `Results for “${params.get('search')}”` : selectedCategory?.name || 'Shop all'}</h1><p className="catalog-intro">{selectedCategory ? `Explore ${selectedCategory.name} from our current collection.` : 'Find your next favourite from the current collection.'}</p></div><span className="count-pill">{meta.totalItems || 0} pieces</span></div>
      <div className="category-chips" aria-label="Shop categories"><button type="button" className={!params.get('category') ? 'selected' : ''} onClick={() => { const next = new URLSearchParams(params); next.delete('category'); next.delete('page'); setParams(next); }}>All</button>{categoryList.map((item) => <button type="button" key={item._id} className={params.get('category') === item._id ? 'selected' : ''} onClick={() => { const next = new URLSearchParams(params); if (params.get('category') === item._id) next.delete('category'); else next.set('category', item._id); next.delete('page'); setParams(next); }}>{item.name}</button>)}</div>
      <div className="catalog-toolbar"><button type="button" className="secondary-button mobile-filter-trigger" onClick={() => setFiltersOpen(true)}>Filter{activeFilters.length > 0 ? ` (${activeFilters.length})` : ''}</button><span>{meta.totalItems || 0} results</span><label>Sort by <select value={requestedSort} onChange={(event) => { const next = new URLSearchParams(params); if (event.target.value === 'recommended') next.delete('sort'); else next.set('sort', event.target.value); next.delete('page'); setParams(next); }}><option value="recommended">Recommended</option><option value="newest">Newest</option><option value="price_asc">Price: low to high</option><option value="price_desc">Price: high to low</option></select></label></div>
      {activeFilters.length > 0 && <div className="selected-filter-chips" aria-label="Selected filters">{activeFilters.map((item) => <button type="button" key={item.key} onClick={() => { const next = new URLSearchParams(params); next.delete(item.key); next.delete('page'); setParams(next); }}>{item.label} <span aria-hidden="true">×</span></button>)}</div>}
      <div className="catalog-layout">
        <aside className="filters-panel desktop-filters">{filterPanel}</aside>
        {filtersOpen && <div className="filter-drawer-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setFiltersOpen(false); }}><aside className="filters-panel filter-drawer" role="dialog" aria-modal="true" aria-label="Filter and sort products">{filterPanel}</aside></div>}
        <div className="catalog-main">
          {state.error && <div role="alert"><p className="form-error">{state.error}</p><button className="secondary-button" onClick={retry}>Retry</button></div>}
          {state.loading ? <p role="status">Loading the collection...</p> : state.error ? null : <div className="product-grid product-grid-compact">{items.map((product) => <ProductCard key={product._id} product={{ ...product, id: product._id, image: product.images?.[0]?.url || '/product-placeholder.svg', brand: product.brand?.name || '', rating: product.ratingSummary?.average || 0, reviewCount: product.ratingSummary?.count || 0, originalPrice: product.price, price: product.effectivePrice ?? product.price }} />)}{!items.length && <div className="panel-card empty-state"><h3>No pieces match these filters</h3><button type="button" className="secondary-button" onClick={clear}>Clear filters</button></div>}</div>}
          <div className="pagination-row"><button className="secondary-button" disabled={!meta.page || meta.page <= 1} onClick={() => setPage(meta.page - 1)}>Previous</button><span>Page {meta.page || 1} of {meta.totalPages || 1}</span><button className="secondary-button" disabled={!meta.totalPages || meta.page >= meta.totalPages} onClick={() => setPage(meta.page + 1)}>Next</button></div>
        </div>
      </div>
    </div>
  );
}
