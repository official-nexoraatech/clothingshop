# Phase 1 — Requirements baseline

This baseline reconciles the supplied Clothing Shop Management System Project Documentation with the implemented internship application. It is a requirements deliverable, not a production release or user-acceptance sign-off.

## Purpose and scope
Provide a single-shop clothing storefront and administration system for customer purchases, catalog maintenance, stock control and support. React/Vite calls an Express API; Mongoose stores records in MongoDB. Transactional workflows require a replica set. Multi-vendor selling, courier integration, ERP and online-payment gateways are outside the required baseline.

## Actors and permissions
- Public visitor: browse active products, search/filter, contact the shop, register or reset a password.
- Customer: manage only their own profile/avatar, preferences, addresses, wishlist, cart, orders, delivered-purchase reviews, notifications and tickets.
- Administrator: catalog/master-data management, customer blocking, coupons, settings, order operations, cancellations/returns/refunds, stock, reports, moderation and support.
- Employee: operational order transitions, inventory, notifications and permitted support; no admin management, report, cancellation, return or refund permissions.
- Inactive/blocked accounts cannot use authenticated APIs. New registration cannot choose a staff role.

## Functional requirements and acceptance
| ID | Requirement | Acceptance evidence |
|---|---|---|
| AUTH-01 | Registration/login/logout, hashed passwords, signed JWT and expiry handling | verify-auth, verify-rbac, test-phase10, browser session tests |
| AUTH-02 | One-time expiring password reset; no development token with configured SMTP | test-services, test-phase10; live email receipt recorded |
| CAT-01 | Admin product/category/brand CRUD and active/draft visibility | test-catalog, test-catalog-ui |
| CAT-02 | Size/colour variants; price/colour/category/brand/size/stock filters, sorting/pagination | test-catalog, test-audit, test-audit-ui |
| IMG-01 | Validated product and own-profile uploads, 5 MB maximum, supported raster types | test-phase10, test-services, test-audit |
| SHOP-01 | Persistent own cart/wishlist; select variant and atomically move saved item to cart | test-orders, test-audit, test-audit-ui |
| SHOP-02 | Saved addresses, one default per customer, coupon/shipping totals recalculated on server | test-orders, test-phase10 |
| ORD-01 | COD order creation with atomic inventory/coupon/cart changes and purchase snapshots | test-orders; order browser tests |
| ORD-02 | Valid status transitions, customer cancellation before shipping, admin returns/cash refunds | test-orders, test-orders-ui |
| INV-01 | Variant stock, low/out indicators, stock movement history and guarded updates | test-orders, test-orders-ui |
| INV-02 | Notify active staff when stock crosses low/out/available states; transaction rollback includes alerts | test-audit |
| ADM-01 | Customer blocking, coupons, shop settings and accurate dashboard/report aggregates | test-admin-management, test-analytics and corresponding UI suites |
| REV-01 | Reviews only for delivered purchases, own edit/delete and admin moderation | test-phase9, test-phase10 and browser tests |
| COM-01 | Private paginated notifications/read counts and customer/staff ticket conversations | test-phase9, test-phase10 and browser tests |
| COM-02 | Persist public contact messages and administrator resolution | test-phase10 and browser tests |
| UI-01 | Useful loading/error/retry states, working navigation and responsive screens | browser suites at mobile/tablet/desktop widths |

Acceptance evidence names refer to executable files under backend. An assertion passes only after the corresponding suite is executed; the current run report lives in test-results.

## Business rules
- Supported payment is Cash on Delivery; online gateways and PDF export are optional.
- Stock belongs to variants, not just products. Cart additions do not reserve stock.
- Checkout uses current server prices. Product-filter prices refer to the base price before discounts and variant price overrides.
- Order states: Pending → Confirmed → Processing → Shipped → Out for Delivery → Delivered. Eligible cancellations and administrator-approved returns restore stock once.
- COD becomes Paid when delivery/cash collection is recorded. A returned paid order can have a recorded cash refund.
- Inventory alerts go to active admins/employees when the stock band changes, not on every decrement.
- Contact preferences record consent; they do not enable an automated email/SMS marketing service.
- Product and profile images are publicly retrievable assets, not a place for confidential documents.

## Non-functional requirements
- Authorization and validation are enforced by the API, not only hidden UI controls.
- Uploads use MIME/signature checks, bounded sizes and generated filenames.
- Error responses must omit secrets and stack traces; private data is scoped by account.
- Transactions prevent partial orders, overselling and duplicate stock restoration.
- Accessible labels/status messages and keyboard-operable native controls support the tested workflows.
- Responsive checks cover 390, 768 and 1440 px, with additional existing dashboard widths.
- Automated checks establish functional reliability, not an enterprise capacity or complete accessibility/security certification. Formal load testing and an accessibility conformance audit are not claimed.
- Production HTTPS, managed database access, hosting credentials and post-deployment tests belong to Phase 11.

## Completion gates
Run build, lint and regression suites; retain actual outcomes. Chrome, Firefox and WebKit are tested; native Safari is deferred by the owner. Customer/admin/employee hands-on acceptance and final commercial policy approval require the owner and are not signed off by automation.

## Source and change control
Source: supplied Clothing_Shop_Management_System_Project_Documentation.docx, sections 1–16, and the Phase 10 instructions.
The price/colour controls, direct wishlist move, inventory notifications and profile avatar close the gaps found in the Phases 1–10 audit. The unused newsletter form is removed in favour of working contact preferences. Dedicated information pages replace misleading About links. Future additions should be explicitly scoped before implementation.
