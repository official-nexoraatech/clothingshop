import { Link } from 'react-router-dom';
export default function PolicyPage({ kind }) {
  const privacy = kind === 'privacy';
  return <main className="container section-block"><h1>{privacy ? 'Privacy information' : 'Shopping terms'}</h1>
    {privacy ? <>
      <h2>Information used by this shop</h2>
      <p>Your account name, email, phone, delivery addresses, cart, wishlist and order records support your shopping account and order fulfilment. Reviews, contact messages and support conversations are stored when you submit them.</p>
      <h2>Account access and images</h2>
      <p>A sign-in token is stored in your browser's local storage. Logging out removes it from that browser. Uploaded images may be stored with Cloudinary; image URLs should not be treated as private. Do not upload identity documents or other sensitive images.</p>
      <h2>Contact preferences</h2>
      <p>Email and SMS preferences record your choices. They do not activate an automated marketing subscription. In-app notifications remain available, and password-reset emails are sent when requested.</p>
      <h2>Questions about your data</h2>
      <p>Use the contact page or your support tickets to request help with account data. Requests require review by the shop; submitting one does not automatically delete order records.</p>
    </> : <>
      <h2>Ordering and payment</h2>
      <p>Choose a size and colour before adding an item to your cart. Prices, coupon eligibility, delivery charges and available stock are checked at checkout. This application currently supports Cash on Delivery only.</p>
      <h2>Order changes</h2>
      <p>Eligible orders can be cancelled from your order details before shipping. For return enquiries, contact the shop through support. Returns and cash refunds require administrator approval and recording.</p>
      <h2>Reviews and account use</h2>
      <p>Reviews are available for delivered purchases and may be moderated. Keep account credentials private and submit accurate delivery and contact details.</p>
    </>}
    <p><Link to="/contact">Contact the shop</Link> · <Link to="/customer/support">Open a support ticket</Link></p>
  </main>;
}
