export const categories = [
  {
    name: 'Men',
    items: ['T-Shirts', 'Shirts', 'Jeans', 'Trousers', 'Jackets', 'Ethnic Wear', 'Activewear', 'Footwear', 'Accessories'],
  },
  {
    name: 'Women',
    items: ['Tops', 'Dresses', 'Kurtis', 'Sarees', 'Jeans', 'Trousers', 'Ethnic Wear', 'Western Wear', 'Footwear', 'Accessories'],
  },
  {
    name: 'Kids',
    items: ['Boys', 'Girls', 'Baby Clothing', 'Footwear', 'Accessories'],
  },
  {
    name: 'General',
    items: ['New Arrivals', 'Trending', 'Casual Wear', 'Formal Wear', 'Ethnic Wear', 'Sportswear', 'Party Wear', 'Winter Wear'],
  },
];

export const products = [
  {
    id: 1,
    brand: 'Veloura',
    name: 'Oversized Cotton T-Shirt',
    category: 'T-Shirts',
    price: 1299,
    originalPrice: 1999,
    discount: 35,
    rating: 4.5,
    reviewCount: 1234,
    tags: ['New', 'Popular'],
    sizes: ['S', 'M', 'L', 'XL'],
    colors: ['Black', 'White', 'Olive'],
    image:
      'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=900&q=80',
    stock: 18,
    availability: 'In Stock',
  },
  {
    id: 2,
    brand: 'Crest & Co.',
    name: 'Slim Fit Casual Shirt',
    category: 'Shirts',
    price: 1899,
    originalPrice: 2799,
    discount: 32,
    rating: 4.4,
    reviewCount: 944,
    tags: ['Premium'],
    sizes: ['M', 'L', 'XL'],
    colors: ['Sky Blue', 'White', 'Sand'],
    image:
      'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=900&q=80',
    stock: 9,
    availability: 'Low Stock',
  },
  {
    id: 3,
    brand: 'Aster',
    name: 'Relaxed Fit Jeans',
    category: 'Jeans',
    price: 2199,
    originalPrice: 3499,
    discount: 37,
    rating: 4.6,
    reviewCount: 871,
    tags: ['Bestseller'],
    sizes: ['30', '32', '34', '36'],
    colors: ['Indigo', 'Stone'],
    image:
      'https://images.unsplash.com/photo-1542272604-787c3835535d?auto=format&fit=crop&w=900&q=80',
    stock: 22,
    availability: 'In Stock',
  },
  {
    id: 4,
    brand: 'Mira Mode',
    name: 'Floral Summer Dress',
    category: 'Dresses',
    price: 2599,
    originalPrice: 3999,
    discount: 35,
    rating: 4.7,
    reviewCount: 548,
    tags: ['Trending'],
    sizes: ['XS', 'S', 'M', 'L'],
    colors: ['Rose', 'Peach', 'Sunflower'],
    image:
      'https://images.unsplash.com/photo-1496747611176-843222e1e57c?auto=format&fit=crop&w=900&q=80',
    stock: 16,
    availability: 'In Stock',
  },
  {
    id: 5,
    brand: 'Rangriti',
    name: 'Embroidered Kurta',
    category: 'Kurtis',
    price: 2899,
    originalPrice: 4299,
    discount: 33,
    rating: 4.8,
    reviewCount: 693,
    tags: ['Festive'],
    sizes: ['S', 'M', 'L', 'XL'],
    colors: ['Ivory', 'Mustard', 'Maroon'],
    image:
      'https://images.unsplash.com/photo-1529139574466-a303027c1d8b?auto=format&fit=crop&w=900&q=80',
    stock: 12,
    availability: 'In Stock',
  },
  {
    id: 6,
    brand: 'Nexa',
    name: "Women's Straight Pants",
    category: 'Trousers',
    price: 1699,
    originalPrice: 2499,
    discount: 32,
    rating: 4.3,
    reviewCount: 403,
    tags: ['Daily Wear'],
    sizes: ['S', 'M', 'L'],
    colors: ['Charcoal', 'Taupe', 'Beige'],
    image:
      'https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=900&q=80',
    stock: 28,
    availability: 'In Stock',
  },
  {
    id: 7,
    brand: 'Northline',
    name: "Men's Formal Blazer",
    category: 'Jackets',
    price: 4299,
    originalPrice: 5999,
    discount: 28,
    rating: 4.7,
    reviewCount: 365,
    tags: ['Formal'],
    sizes: ['S', 'M', 'L', 'XL'],
    colors: ['Charcoal', 'Navy'],
    image:
      'https://images.unsplash.com/photo-1529139574466-a303027c1d8b?auto=format&fit=crop&w=900&q=80',
    stock: 6,
    availability: 'Low Stock',
  },
  {
    id: 8,
    brand: 'Mini Mint',
    name: 'Kids Printed T-Shirt',
    category: 'Boys',
    price: 899,
    originalPrice: 1299,
    discount: 31,
    rating: 4.4,
    reviewCount: 257,
    tags: ['Kids'],
    sizes: ['4Y', '6Y', '8Y', '10Y'],
    colors: ['Blue', 'Yellow', 'Coral'],
    image:
      'https://images.unsplash.com/photo-1519345182560-3f2917c472ef?auto=format&fit=crop&w=900&q=80',
    stock: 35,
    availability: 'In Stock',
  },
];

export const customers = [
  { id: 1, name: 'Riya Sharma', email: 'riya@example.com', phone: '9876543210', orders: 12, status: 'Active' },
  { id: 2, name: 'Aman Verma', email: 'aman@example.com', phone: '9123456780', orders: 7, status: 'Active' },
  { id: 3, name: 'Nisha Patel', email: 'nisha@example.com', phone: '9988776655', orders: 9, status: 'Pending' },
  { id: 4, name: 'Karan Sethi', email: 'karan@example.com', phone: '9765432109', orders: 5, status: 'Inactive' },
];

export const recentOrders = [
  { id: 'ORD-1024', customer: 'Riya', date: '2026-09-08', amount: 4599, status: 'Processing', payment: 'Paid' },
  { id: 'ORD-1025', customer: 'Aman', date: '2026-09-07', amount: 2899, status: 'Shipped', payment: 'Paid' },
  { id: 'ORD-1026', customer: 'Nisha', date: '2026-09-06', amount: 1899, status: 'Pending', payment: 'Pending' },
  { id: 'ORD-1027', customer: 'Karan', date: '2026-09-05', amount: 3299, status: 'Delivered', payment: 'Paid' },
];

export const coupons = [
  { code: 'FASHION10', discount: '10% Off', expiry: '2026-10-30', usage: 320, status: 'Active' },
  { code: 'NEWUSER20', discount: '20% Off', expiry: '2026-09-25', usage: 120, status: 'Active' },
  { code: 'BUNDLE50', discount: '₹500', expiry: '2026-10-15', usage: 90, status: 'Inactive' },
];

export const reviews = [
  { product: 'Oversized Cotton T-Shirt', customer: 'Riya S.', rating: 5, review: 'Very comfortable and premium feel.', date: '2026-08-15', status: 'Approved' },
  { product: 'Floral Summer Dress', customer: 'Nisha P.', rating: 4, review: 'Beautiful color and perfect fit.', date: '2026-08-12', status: 'Pending' },
  { product: 'Men’s Formal Blazer', customer: 'Aman V.', rating: 5, review: 'Looks sharp and worth the price.', date: '2026-08-05', status: 'Approved' },
];

export const notifications = [
  { type: 'Order', message: 'Order ORD-1024 has moved to processing stage.', date: '2026-09-08', read: false },
  { type: 'Inventory', message: 'Low stock alert for Men’s Formal Blazer.', date: '2026-09-07', read: false },
  { type: 'Review', message: 'A new customer review has been submitted.', date: '2026-09-06', read: true },
];

export const reports = [
  { label: 'Daily Sales', value: '₹1,24,580', change: '+12.4%' },
  { label: 'Weekly Sales', value: '₹6,94,870', change: '+9.1%' },
  { label: 'Monthly Sales', value: '₹28,34,920', change: '+15.2%' },
  { label: 'Orders', value: '1,482', change: '+8.6%' },
];

export const contactMessages = [
  { customer: 'Anu R.', email: 'anu@gmail.com', subject: 'Return issue', message: 'Need help with a size exchange.', date: '2026-09-05', status: 'Open' },
  { customer: 'Rahul P.', email: 'rahul@gmail.com', subject: 'Shipping delay', message: 'Tracking details have not updated for my order.', date: '2026-09-04', status: 'Resolved' },
];

export const addresses = [
  { id: 1, name: 'Home', street: '19 Lotus Avenue, HSR Layout', city: 'Bengaluru', state: 'Karnataka', zip: '560102', default: true },
  { id: 2, name: 'Office', street: 'E-22 Electronic City', city: 'Bengaluru', state: 'Karnataka', zip: '560100', default: false },
];

export const cartItems = [
  { id: 1, name: 'Oversized Cotton T-Shirt', size: 'M', color: 'Black', qty: 1, price: 1299, image: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=500&q=80' },
  { id: 2, name: 'Relaxed Fit Jeans', size: '32', color: 'Indigo', qty: 1, price: 2199, image: 'https://images.unsplash.com/photo-1542272604-787c3835535d?auto=format&fit=crop&w=500&q=80' },
];

export const wishlistItems = [
  { id: 1, name: 'Floral Summer Dress', price: 2599, image: 'https://images.unsplash.com/photo-1496747611176-843222e1e57c?auto=format&fit=crop&w=500&q=80' },
  { id: 2, name: "Women's Straight Pants", price: 1699, image: 'https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=500&q=80' },
];

export const orderTimeline = ['Pending', 'Confirmed', 'Processing', 'Shipped', 'Out for Delivery', 'Delivered'];

export const roleSections = [
  {
    title: 'Customer',
    responsibilities: ['Browse products', 'Search', 'Filter', 'Manage cart', 'Manage wishlist', 'Checkout', 'Place orders', 'Track orders', 'Manage profile'],
  },
  {
    title: 'Admin',
    responsibilities: ['Products', 'Categories', 'Brands', 'Inventory', 'Orders', 'Customers', 'Coupons', 'Reviews', 'Reports', 'Notifications', 'Settings'],
  },
  {
    title: 'Employee',
    responsibilities: ['Assigned orders', 'Inventory operations', 'Notifications'],
    limited: true,
  },
];

export const systemModules = [
  'Authentication',
  'Users/Roles',
  'Products',
  'Categories',
  'Brands',
  'Product Variants',
  'Inventory',
  'Cart',
  'Wishlist',
  'Addresses',
  'Checkout',
  'Payments',
  'Orders',
  'Order Tracking',
  'Coupons',
  'Reviews',
  'Notifications',
  'Contact/Support',
  'Dashboard',
  'Reports',
];

export const databaseCollections = [
  {
    name: 'users',
    purpose: 'Stores customer, admin, and employee account details.',
    fields: ['_id', 'name', 'email', 'phone', 'passwordHash', 'role', 'status', 'createdAt'],
    related: ['carts', 'wishlists', 'addresses', 'orders'],
  },
  {
    name: 'products',
    purpose: 'Contains catalog details and merchandising metadata.',
    fields: ['_id', 'name', 'slug', 'brandId', 'categoryId', 'description', 'price', 'discount', 'status'],
    related: ['categories', 'brands', 'productVariants', 'reviews'],
  },
  {
    name: 'categories',
    purpose: 'Defines product groupings and navigation.',
    fields: ['_id', 'name', 'description', 'parentId', 'status'],
    related: ['products'],
  },
  {
    name: 'brands',
    purpose: 'Tracks brand profiles and product associations.',
    fields: ['_id', 'name', 'logo', 'description', 'status'],
    related: ['products'],
  },
  {
    name: 'productVariants',
    purpose: 'Stores sizes, colors, SKUs, and stock by variant.',
    fields: ['_id', 'productId', 'sku', 'size', 'color', 'price', 'stock', 'status'],
    related: ['products', 'inventoryLogs'],
  },
  {
    name: 'carts',
    purpose: 'Stores a customer cart and item quantities.',
    fields: ['_id', 'userId', 'items', 'couponCode', 'updatedAt'],
    related: ['users', 'products'],
  },
  {
    name: 'wishlists',
    purpose: 'Tracks saved product preferences for customers.',
    fields: ['_id', 'userId', 'productIds', 'createdAt'],
    related: ['users', 'products'],
  },
  {
    name: 'addresses',
    purpose: 'Stores shipping and billing addresses.',
    fields: ['_id', 'userId', 'label', 'fullName', 'street', 'city', 'state', 'zip', 'isDefault'],
    related: ['users', 'orders'],
  },
  {
    name: 'orders',
    purpose: 'Stores checkout order data and state transitions.',
    fields: ['_id', 'userId', 'addressId', 'status', 'total', 'shippingFee', 'paymentStatus', 'createdAt'],
    related: ['users', 'orderItems', 'payments', 'coupons'],
  },
  {
    name: 'orderItems',
    purpose: 'Tracks each product included in an order.',
    fields: ['_id', 'orderId', 'productId', 'variantId', 'quantity', 'price'],
    related: ['orders', 'products'],
  },
  {
    name: 'payments',
    purpose: 'Stores transaction details for each order.',
    fields: ['_id', 'orderId', 'method', 'status', 'amount', 'transactionId'],
    related: ['orders'],
  },
  {
    name: 'coupons',
    purpose: 'Tracks promotional campaigns and usage rules.',
    fields: ['_id', 'code', 'discountType', 'discountValue', 'expiry', 'usageLimit', 'status'],
    related: ['orders'],
  },
  {
    name: 'reviews',
    purpose: 'Captures customer feedback on sold products.',
    fields: ['_id', 'productId', 'userId', 'rating', 'title', 'comment', 'status'],
    related: ['products', 'users'],
  },
  {
    name: 'inventoryLogs',
    purpose: 'Records historical stock updates and adjustments.',
    fields: ['_id', 'variantId', 'oldStock', 'newStock', 'reason', 'updatedBy', 'updatedAt'],
    related: ['productVariants'],
  },
  {
    name: 'notifications',
    purpose: 'Stores system, order, and alert notifications.',
    fields: ['_id', 'userId', 'type', 'message', 'read', 'createdAt'],
    related: ['users'],
  },
  {
    name: 'contactMessages',
    purpose: 'Collects user support and contact requests.',
    fields: ['_id', 'customerName', 'email', 'subject', 'message', 'status'],
    related: ['users'],
  },
  {
    name: 'passwordResetTokens',
    purpose: 'Tracks secure password reset requests.',
    fields: ['_id', 'userId', 'token', 'expiresAt', 'used'],
    related: ['users'],
  },
];

export const customerJourneys = [
  'Customer Registration',
  'Login',
  'Browse Products',
  'Search',
  'Filter',
  'View Product',
  'Select Size/Color',
  'Add to Cart',
  'Wishlist if required',
  'Apply Coupon',
  'Checkout',
  'Select Address',
  'Select Payment',
  'Place Order',
  'Track Order',
  'Receive Delivery',
  'Submit Review',
];

export const adminJourneys = [
  'Admin Login',
  'Dashboard',
  'Products',
  'Categories',
  'Brands',
  'Inventory',
  'Orders',
  'Customers',
  'Coupons',
  'Reviews',
  'Notifications',
  'Reports',
  'Contact Messages',
  'Settings',
];

export const employeeJourneys = [
  'Employee Login',
  'Dashboard',
  'Assigned Orders',
  'Order Operations',
  'Inventory',
  'Notifications',
];

export const orderStatusFlow = ['Pending', 'Confirmed', 'Processing', 'Shipped', 'Out for Delivery', 'Delivered'];
export const inventoryFlow = ['In Stock', 'Low Stock', 'Out of Stock', 'Restocked'];
export const paymentFlow = ['Payment Pending', 'Paid', 'Payment Failed', 'Refunded'];
export const reviewFlow = ['Submitted', 'Approved', 'Hidden', 'Rejected'];
