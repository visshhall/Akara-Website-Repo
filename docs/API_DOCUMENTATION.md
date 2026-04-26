# API DOCUMENTATION - ATELIER ĀKĀRA

## Supabase Configuration

### Base URL
```
https://YOUR_PROJECT_URL.supabase.co
```

### Authentication
All API calls require authentication header:
```javascript
headers: {
    'apikey': 'YOUR_ANON_KEY',
    'Authorization': 'Bearer USER_JWT_TOKEN'
}
```

## Database Tables

### 1. profiles
User account information

**Columns:**
- id (UUID, primary key)
- user_id (TEXT, unique) - Format: AK-XXXX-XXXX
- email (TEXT, unique)
- first_name (TEXT)
- last_name (TEXT)
- phone (TEXT)
- is_admin (BOOLEAN)
- created_at (TIMESTAMP)

**RLS Policies:**
- Users can read/update own profile
- Only admins can set is_admin flag

### 2. products
Product catalog

**Columns:**
- id (UUID)
- product_id (TEXT, unique) - Format: PFL-AKR-XXXXX
- name (TEXT)
- category (TEXT)
- base_price (DECIMAL)
- description (TEXT)
- images (JSONB array)
- is_active (BOOLEAN)
- created_at (TIMESTAMP)

### 3. product_variants
Product size/color variations

**Columns:**
- id (UUID)
- product_id (UUID, FK)
- size (TEXT)
- color (TEXT)
- stock_quantity (INTEGER)
- price_modifier (DECIMAL)
- sku (TEXT, unique)

### 4. orders
Customer orders

**Columns:**
- id (UUID)
- order_number (TEXT, unique)
- user_id (UUID, FK)
- status (TEXT) - pending, shipped, delivered, cancelled
- payment_status (TEXT) - pending, paid, refunded
- subtotal (DECIMAL)
- tax (DECIMAL)
- total (DECIMAL)
- created_at (TIMESTAMP)

### 5. wishlists
User wishlist items

**Columns:**
- id (UUID)
- user_id (UUID, FK)
- product_id (UUID, FK)
- variant_id (UUID, FK)
- price_at_add (DECIMAL)
- created_at (TIMESTAMP)

### 6. loyalty_points
Reward points tracking

**Columns:**
- id (UUID)
- user_id (UUID, FK)
- points (INTEGER)
- total_earned (INTEGER)
- total_redeemed (INTEGER)
- updated_at (TIMESTAMP)

## API Endpoints

### Authentication

**Sign Up:**
```javascript
const { data, error } = await supabase.auth.signUp({
    email: 'user@example.com',
    password: 'password123'
});
```

**Sign In:**
```javascript
const { data, error } = await supabase.auth.signInWithPassword({
    email: 'user@example.com',
    password: 'password123'
});
```

**Sign Out:**
```javascript
const { error } = await supabase.auth.signOut();
```

### Products

**Get All Products:**
```javascript
const { data, error } = await supabase
    .from('products')
    .select('*, product_variants(*)')
    .eq('is_active', true);
```

**Get Single Product:**
```javascript
const { data, error } = await supabase
    .from('products')
    .select('*, product_variants(*)')
    .eq('product_id', 'PFL-AKR-00001')
    .single();
```

**Search Products:**
```javascript
const { data, error } = await supabase
    .from('products')
    .select('*')
    .ilike('name', '%planter%');
```

### Orders

**Create Order:**
```javascript
const { data, error } = await supabase
    .from('orders')
    .insert({
        user_id: userId,
        subtotal: 1000,
        tax: 180,
        total: 1180,
        status: 'pending'
    })
    .select()
    .single();
```

**Get User Orders:**
```javascript
const { data, error } = await supabase
    .from('orders')
    .select('*, order_items(*)')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
```

### Wishlist

**Add to Wishlist:**
```javascript
const { data, error } = await supabase
    .from('wishlists')
    .insert({
        user_id: userId,
        product_id: productId,
        variant_id: variantId,
        price_at_add: price
    });
```

**Get Wishlist:**
```javascript
const { data, error } = await supabase
    .from('wishlists')
    .select('*, products(*), product_variants(*)')
    .eq('user_id', userId);
```

## Storage Buckets

### product-images (Public)
Store product photos

**Upload:**
```javascript
const { data, error } = await supabase.storage
    .from('product-images')
    .upload('product_123.jpg', file);
```

**Get Public URL:**
```javascript
const { data } = supabase.storage
    .from('product-images')
    .getPublicUrl('product_123.jpg');
```

### invoices (Private)
Store GST invoices

**Upload:**
```javascript
const { data, error } = await supabase.storage
    .from('invoices')
    .upload('invoice_PFL_2024_001.pdf', pdfBlob);
```

## Rate Limits

**Free Tier:**
- 50,000 monthly active users
- 500MB database storage
- 1GB file storage
- 2GB bandwidth
- Unlimited API requests

## Error Handling

```javascript
try {
    const { data, error } = await supabase
        .from('products')
        .select('*');
    
    if (error) throw error;
    
    // Handle data
} catch (error) {
    console.error('Error:', error.message);
}
```

## Security

**Row Level Security (RLS):**
- All tables have RLS enabled
- Users can only access their own data
- Admins have elevated permissions

**API Key Security:**
- Never expose service_role key client-side
- Use anon key for public operations
- User JWT for authenticated operations
