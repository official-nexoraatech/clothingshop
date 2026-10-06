import { Link } from 'react-router-dom';
export default function AboutPage() {
  return (
    <div className="container section-block about-page">
      <p className="eyebrow">Our story</p>
      <h1>Designed for everyday expression.</h1>
      <div className="about-grid">
        <div className="info-card">
          <h3>Brand story</h3>
          <p>Lavella Studio blends premium basics with modern silhouettes so every wardrobe feels confident, expressive, and effortless.</p>
        </div>
        <div className="info-card">
          <h3>Mission</h3>
          <p>To create accessible fashion that supports modern lifestyles while prioritizing comfort, quality, and lasting value.</p>
        </div>
        <div className="info-card">
          <h3>Values</h3>
          <p>Craftsmanship, inclusivity, transparency, and thoughtful customer experience.</p>
        </div>
        <div className="info-card">
          <h3>Quality</h3>
          <p>Every collection is curated with premium materials, durable finishing, and tested fit principles.</p>
        </div>
      </div>
      <div className="cta-banner">
        <h2>Style that works for your day.</h2>
        <Link className="primary-button" to="/products">Shop collection</Link>
      </div>
    </div>
  );
}
