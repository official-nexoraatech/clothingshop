# Phase 2 — System and interface design

Companion: [Requirements baseline](phase1-requirements.md) and [wireframe sheet](phase2-wireframes.svg). Wireframes are design artifacts, not screenshots or evidence of a test run.

## Architecture
```mermaid
flowchart LR
  P[Public storefront] --> R[React Router + Auth/Shop Context]
  C[Customer portal] --> R
  A[Admin portal] --> R
  E[Employee portal] --> R
  R --> API[Express API]
  API --> AUTH[JWT + role/ownership checks]
  AUTH --> DB[(MongoDB replica set)]
  API --> IMG[Validated uploads / Cloudinary]
  API --> MAIL[Nodemailer password reset]
```

## Navigation and screen specifications
| Screen | Main regions | Main actions | Empty/error behavior |
|---|---|---|---|
| Catalog | Navigation, search/filter sidebar, sort/paging, cards | Filter by base price/colour/size/category/brand/availability; view product | No products message; request error and retry |
| Product detail | Image, price, variant selector, cart/wishlist, reviews | Select size/colour; add; review delivered purchase | Disable unavailable variants; surface validation |
| Wishlist | Saved product cards, variant selector | Move selected variant to cart; remove | Failed move retains saved item |
| Cart/checkout | Items, quantity, summary, address, coupon and COD | Update quantity; review current total; place order | Stock/coupon/address errors shown before commit |
| Customer account | Profile form/avatar; addresses; orders; notifications; support | Save profile/image; view order; create ticket/reply | Loading, validation and retry states |
| Admin/employee | Sidebar, KPIs, filters, tables and edit panels | Role-permitted management and operations | API rejects forbidden actions; tables can scroll |
| Information/contact | Page title, readable sections, working contact link | Contact shop or open own support ticket | No newsletter subscription is advertised |

Desktop uses side-by-side catalog regions. At small widths, filters precede product cards and navigation scrolls with the page. Forms fit the viewport and tables may scroll within their container.

## Transaction and ownership boundaries
```mermaid
sequenceDiagram
  actor Customer
  participant UI as React
  participant API as Express
  participant DB as MongoDB transaction
  Customer->>UI: Choose wishlist variant / Move to cart
  UI->>API: Authenticated request
  API->>DB: Read owned wishlist, active product/variant, cart
  API->>DB: Validate current stock and server price
  API->>DB: Save cart and remove wishlist item
  DB-->>API: Commit or rollback both
  API-->>UI: Updated cart or safe error
```

Checkout commits order, items, payment, inventory log/alerts, coupon usage and cart clearing together. Stock transitions generate staff notifications within the same transaction. Profile image upload authenticates the current user, validates the file, saves the owned avatar and cleans replaced/staging assets.

## Database relationships
```mermaid
erDiagram
  USER ||--o{ ORDER : places
  USER ||--o| CART : owns
  USER ||--o| WISHLIST : owns
  USER ||--o{ ADDRESS : saves
  PRODUCT }o--|| CATEGORY : classified
  PRODUCT }o--|| BRAND : branded
  PRODUCT ||--o{ PRODUCT_VARIANT : offers
  ORDER ||--|{ ORDER_ITEM : contains
  ORDER ||--|| PAYMENT : records
  PRODUCT_VARIANT ||--o{ INVENTORY_LOG : audits
  USER ||--o{ NOTIFICATION : receives
  USER ||--o{ SUPPORT_TICKET : opens
  SUPPORT_TICKET ||--o{ SUPPORT_MESSAGE : contains
  PRODUCT ||--o{ REVIEW : receives
```

Actual schemas under backend/src/models are authoritative for field names, references, unique constraints and indexes. The built-in system-design, database-plan, page-flow and user-journeys pages remain available as design references.

## Deployment boundary
Development uses Vite API/upload proxies. Hosting, HTTPS and deployed CORS verification are Phase 11. No deployment or native Safari success is implied by this design.
