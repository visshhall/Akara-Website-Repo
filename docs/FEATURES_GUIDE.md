# FEATURES GUIDE - ATELIER ĀKĀRA

## User Features

### 1. Product Browsing
- Category filters (Planters, Vases, Lighting)
- Search functionality
- Product grid with images
- Sort by price, popularity
- Responsive design

### 2. Shopping Cart
- Add/remove products
- Update quantities
- Variant selection (size, color)
- Real-time total calculation
- Persistent cart (localStorage)

### 3. Checkout
- Guest or registered checkout
- Address management
- Payment gateway (Razorpay)
- Order summary
- GST calculation

### 4. User Account
- Profile management
- Order history
- Wishlist
- Reward points
- Address book
- Email preferences

### 5. Wishlist
- Save products for later
- Price drop alerts (email)
- Stock alerts
- Quick add to cart
- Share wishlist

### 6. Reward Points
- Earn: 10 points per ₹100 spent
- Earn: 50 points per review
- Earn: 100 points per referral
- Minimum 2,000 points to redeem
- Premium rewards catalog

### 7. Order Tracking
- Real-time status updates
- Email notifications
- Tracking number
- Delivery estimates
- Order cancellation (24hr window)

### 8. Reviews
- Star ratings (1-5)
- Text reviews (max 500 chars)
- Image uploads
- Verified purchase badge
- Helpful votes

## Admin Features

### 1. Dashboard
- Revenue analytics
- Order statistics
- Customer insights
- Low stock alerts
- Sales charts

### 2. Product Management
- Add/edit/delete products
- Manage variants
- Image upload
- Stock management
- Price updates

### 3. Order Management
- View all orders
- Update status
- Process refunds
- Print invoices
- Export data

### 4. Inventory
- Real-time stock levels
- Low stock alerts
- Stock movement history
- Bulk updates
- SKU management

### 5. Customer Management
- View customer list
- Order history per customer
- Customer insights
- VIP customers
- Export customer data

### 6. Reports
- Sales reports (daily/weekly/monthly)
- Product performance
- Revenue analytics
- Customer analytics
- Export to PDF/Excel

### 7. Support Tickets
- Customer inquiries
- Priority management
- Response tracking
- Resolution metrics
- Email integration

## Security Features

### 1. Authentication
- Email verification required
- Strong password enforcement
- Password reset via email
- Session timeout (30 min)
- Device tracking

### 2. Brute Force Protection
- 5 login attempts = 1hr lockout
- 10 attempts = 24hr lockout
- 20 attempts = permanent lock
- IP blocking
- Fingerprint tracking

### 3. Input Validation
- Length limits on all inputs
- XSS prevention
- SQL injection prevention
- File type validation
- Image metadata removal

### 4. Data Protection
- DPDP Act 2023 compliant
- Right to access (data export)
- Right to deletion
- 7-year invoice retention
- Encrypted storage

## Premium Features

### 1. Bundle Builder
- Select 3+ products
- 15% automatic discount
- Bundle recommendations
- Save bundles

### 2. Style Quiz
- 5-question quiz
- Personalized recommendations
- Shareable results
- Product matching algorithm

### 3. Limited Edition Drops
- Monthly exclusive releases
- Countdown timer
- Stock counter
- Premium pricing
- FOMO marketing

## Email Notifications

**Transactional:**
- Order confirmation
- Shipping updates
- Delivery confirmation
- Password reset
- Email verification

**Marketing (opt-in):**
- New product launches
- Sale announcements
- Cart abandonment (1hr, 24hr)
- Price drop alerts
- Wishlist back-in-stock

## Payment Integration

**Razorpay Features:**
- UPI payments
- Credit/Debit cards
- Wallets (Paytm, PhonePe)
- Net banking
- COD (future)

**Security:**
- PCI-DSS compliant
- 3D Secure
- Webhook verification
- Refund processing

## Mobile Features

**Responsive Design:**
- Touch-friendly buttons (48px min)
- Mobile navigation
- Swipe gestures
- Fast loading
- PWA-ready

## SEO Features

- Meta tags (title, description)
- Open Graph tags
- Schema markup
- XML sitemap
- robots.txt
- Fast page speed
- Mobile-first

## Performance

**Optimizations:**
- Image lazy loading
- Code splitting
- CDN delivery (Netlify)
- Gzip compression
- Browser caching
- Minimal dependencies

**Targets:**
- Page load: < 2 seconds
- Time to interactive: < 3 seconds
- Lighthouse score: 90+
