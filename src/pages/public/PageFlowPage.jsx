import { orderTimeline } from '../../data/mockData';

export default function PageFlowPage() {
  const steps = [
    'Registration/Login',
    'Home',
    'Browse Products',
    'Search/Filter',
    'Product Details',
    'Select Size/Color',
    'Add to Cart',
    'Apply Coupon',
    'Checkout',
    'Address',
    'Payment',
    'Order Placement',
    'Order Confirmation',
    'Admin Processing',
    'Shipping',
    'Delivery',
    'Customer Review',
  ];

  return (
    <div className="container section-block">
      <p className="eyebrow">Page flow</p>
      <h1>Customer journey flow</h1>
      <div className="stepper">
        {steps.map((step, index) => (
          <div key={step} className="step-node">
            <span>{index + 1}</span>
            <strong>{step}</strong>
            {index < steps.length - 1 && <small>↓</small>}
          </div>
        ))}
      </div>

      <div className="flow-status-grid">
        {orderTimeline.map((status) => (
          <div key={status} className="status-card">{status}</div>
        ))}
      </div>
    </div>
  );
}
