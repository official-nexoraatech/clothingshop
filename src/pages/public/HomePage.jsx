import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { ProductCard } from '../../components/Common';
import { useAuth } from '../../context/authState';

const toCard = (product) => ({
  ...product,
  id: product._id,
  image: product.images?.[0]?.url || '/product-placeholder.svg',
  brand: product.brand?.name || '',
  rating: product.ratingSummary?.average || 0,
  reviewCount: product.ratingSummary?.count || 0,
  originalPrice: product.price,
  price: product.effectivePrice ?? product.price,
});

const genderPattern = /\b(men|women|kids|boys|girls|unisex)\b/i;

export default function HomePage() {
  const { request } = useAuth();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [errors, setErrors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [revision, setRevision] = useState(0);

  useEffect(() => {
    let active = true;
    setLoading(true);
    Promise.allSettled([
      request('/products?limit=24&sort=newest'),
      request('/categories'),
      request('/brands'),
    ]).then(async ([productResult, categoryResult, brandResult]) => {
      if (!active) return;
      const failed = [];
      const catalog = productResult.status === 'fulfilled' ? productResult.value.products || [] : [];
      const categoryList = categoryResult.status === 'fulfilled' ? categoryResult.value.categories || [] : [];
      const brandList = brandResult.status === 'fulfilled' ? brandResult.value.brands || [] : [];
      if (productResult.status === 'rejected') failed.push(productResult.reason.message);
      if (categoryResult.status === 'rejected') failed.push(categoryResult.reason.message);
      if (brandResult.status === 'rejected') failed.push(brandResult.reason.message);
      setErrors(failed);
      setProducts(catalog);
      setBrands(brandList);
      setCategories(categoryList.map((category) => ({ ...category, editorialImage: category.image || '' })));

      // Resolve a photo for every category. Limiting this to the first eight
      // left later gender/category tiles with the empty background treatment.
      const categoriesWithoutImages = categoryList.filter((category) => !category.image);
      const categoryImages = await Promise.allSettled(categoriesWithoutImages.map((category) => request(`/products?category=${category._id}&limit=1`)));
      if (!active) return;
      const imageById = new Map(categoriesWithoutImages.map((category, index) => [
        category._id,
        categoryImages[index].status === 'fulfilled' ? categoryImages[index].value.products?.[0]?.images?.[0]?.url || '' : '',
      ]));
      setCategories(categoryList.map((category) => ({ ...category, editorialImage: category.image || imageById.get(category._id) || '' })));

      const reviewedProducts = catalog.filter((product) => Number(product.ratingSummary?.count || 0) > 0).slice(0, 3);
      const reviewResults = await Promise.allSettled(reviewedProducts.map((product) => request(`/products/${product._id}/reviews?page=1`)));
      if (!active) return;
      setReviews(reviewResults.flatMap((result) => result.status === 'fulfilled' ? result.value.reviews || [] : []).slice(0, 3));
    }).catch((failure) => { if (active) setErrors([failure.message]); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [request, revision]);

  const featured = products.filter((product) => product.isFeatured).slice(0, 8);
  const trending = products.filter((product) => product.isTrending).slice(0, 8);
  const newArrivals = products.filter((product) => product.isNewArrival).slice(0, 8);
  const genderCategories = categories.filter((category) => genderPattern.test(category.name)).slice(0, 3);
  const shopCategories = categories.filter((category) => !genderPattern.test(category.name)).slice(0, 8);

  return (
    <div className="storefront-home">
      <section className="home-campaign" aria-label="Latest collection">
        <div className="home-campaign-image" role="img" aria-label="Fashion campaign featuring contemporary everyday style" />
        <div className="home-campaign-shade" />
        <div className="container home-campaign-copy">
          <span className="campaign-kicker">The latest collection</span>
          <h1>Made for<br />your everyday.</h1>
          <p>Fresh fits, easy layers and the pieces you’ll reach for on repeat.</p>
          <Link to="/products" className="campaign-button">Shop the collection <span aria-hidden="true">→</span></Link>
          <span className="campaign-index">01 / NEW SEASON</span>
        </div>
      </section>

      {errors.length > 0 && <div className="container home-error" role="alert"><p>{errors.join(' ')}</p><button className="secondary-button" onClick={() => setRevision((value) => value + 1)}>Retry</button></div>}

      <div className="container home-benefit-row" aria-label="Store highlights">
        <span>Made to move with you</span><span aria-hidden="true">·</span><span>Find your next favourite</span><span aria-hidden="true">·</span><span>Everyday style, your way</span>
      </div>

      {genderCategories.length > 0 && <section className="container home-section home-gender-section">
        <SectionHeading eyebrow="Shop your way" title="Pick your side" />
        <div className="home-gender-grid">{genderCategories.map((category) => <CategoryTile category={category} key={category._id} variant="gender" />)}</div>
      </section>}

      {shopCategories.length > 0 && <section className="container home-section home-shop-categories">
        <SectionHeading eyebrow="Browse the collection" title="Shop by category" link="/products" linkText="View all categories" />
        {loading && <p role="status">Loading categories…</p>}
        {!loading && <div className="home-category-grid">{shopCategories.map((category, index) => <CategoryTile category={category} key={category._id} index={index} />)}</div>}
        {!loading && categories.length === 0 && <p className="home-empty">Categories will appear here when the catalog is available.</p>}
      </section>}

      {featured.length > 0 && <ProductSection id="featured" eyebrow="Picked for you" title="Featured pieces" items={featured} link="/products" linkText="Shop all" />}

      {trending.length > 0 && <ProductSection id="trending" eyebrow="Making the rounds" title="Trending now" items={trending} link="/products" linkText="Explore the edit" tone="soft" />}

      {newArrivals.length > 0 && <ProductSection id="new-arrivals" eyebrow="Just landed" title="New arrivals" items={newArrivals} link="/products?sort=newest" linkText="View all" />}

      <section className="container home-campaign-pair" aria-label="Shop the edit">
        <Link className="home-promo-card home-promo-card-one" to={genderCategories[0] ? `/products?category=${genderCategories[0]._id}` : '/products'}>
          <span className="home-promo-image" aria-hidden="true" /><span className="home-promo-copy"><small>Everyday favourites</small><strong>Find your<br />new uniform</strong><span>Shop the edit <b aria-hidden="true">→</b></span></span>
        </Link>
        <Link className="home-promo-card home-promo-card-two" to={genderCategories[1] ? `/products?category=${genderCategories[1]._id}` : '/products'}>
          <span className="home-promo-image" aria-hidden="true" /><span className="home-promo-copy"><small>Easy does it</small><strong>Comfort looks<br />good on you</strong><span>Explore styles <b aria-hidden="true">→</b></span></span>
        </Link>
      </section>

      {brands.length > 0 && <section className="home-brands-section">
        <div className="container"><SectionHeading eyebrow="The labels we love" title="Shop by brand" link="/products" linkText="Browse brands" /><div className="home-brand-list">{brands.slice(0, 8).map((brand) => <Link to={`/products?brand=${brand._id}`} key={brand._id}>{brand.name}</Link>)}</div></div>
      </section>}

      {reviews.length > 0 && <section className="container home-review-section"><SectionHeading eyebrow="Real love, real looks" title="Worn and loved" /><div className="home-review-grid">{reviews.map((review) => <article className="home-review-card" key={review._id}><p className="home-review-stars" aria-label={`${review.rating} out of 5 stars`}>{'★'.repeat(review.rating)}</p><blockquote>{review.text}</blockquote><p className="home-review-author">{review.reviewer || 'Customer'} <span>· {review.verifiedPurchase ? 'Verified purchase' : 'Customer review'}</span></p></article>)}</div></section>}
    </div>
  );
}

function SectionHeading({ eyebrow, title, link, linkText }) {
  return <div className="home-section-heading"><div><p className="home-eyebrow">{eyebrow}</p><h2>{title}</h2></div>{link && <Link to={link} className="home-view-all">{linkText}<span aria-hidden="true">→</span></Link>}</div>;
}

function CategoryTile({ category, index = 0, variant = '' }) {
  return <Link to={`/products?category=${category._id}`} className={`home-category-tile ${variant ? `home-category-${variant}` : ''} ${!category.editorialImage ? 'is-no-image' : ''}`}>
    {category.editorialImage && <img src={category.editorialImage} alt="" loading="lazy" onError={(event) => { event.currentTarget.style.display = 'none'; }} />}
    <span className="home-category-count">{String(index + 1).padStart(2, '0')}</span><strong>{category.name}</strong><span className="home-category-arrow" aria-hidden="true">↗</span>
  </Link>;
}

function ProductSection({ id, eyebrow, title, items, link, linkText, tone = '' }) {
  return <section id={id} className={`home-product-section ${tone ? `home-product-section-${tone}` : ''}`}>
    <div className="container"><SectionHeading eyebrow={eyebrow} title={title} link={link} linkText={linkText} /><div className="product-grid home-product-grid">{items.map((product) => <ProductCard key={product._id} product={toCard(product)} />)}</div></div>
  </section>;
}
