# Supabase Database Setup for Atelier Ākāra

## Required Tables & Schema

### 1. Users Table (extends auth.users)

```sql
-- Create profiles table
CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  member_id TEXT UNIQUE NOT NULL,
  email TEXT UNIQUE NOT NULL,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  phone TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_admin BOOLEAN DEFAULT FALSE,
  email_verified BOOLEAN DEFAULT FALSE
);

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create policy: Users can read their own profile
CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

-- Create policy: Users can update their own profile
CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

-- Create policy: Admins can view all profiles
CREATE POLICY "Admins can view all profiles"
  ON public.profiles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND is_admin = TRUE
    )
  );
```

### 2. Addresses Table

```sql
CREATE TABLE public.addresses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT NOT NULL,
  address_line1 TEXT NOT NULL,
  address_line2 TEXT,
  city TEXT NOT NULL,
  state TEXT NOT NULL,
  pincode TEXT NOT NULL,
  is_default BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.addresses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own addresses"
  ON public.addresses FOR ALL
  USING (auth.uid() = user_id);
```

### 3. Products Table

```sql
CREATE TABLE public.products (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('Planter', 'Vase', 'Lighting')),
  price DECIMAL(10,2) NOT NULL,
  trade_price DECIMAL(10,2),
  description TEXT,
  dimensions TEXT,
  weight TEXT,
  colors TEXT[],
  image_url TEXT,
  amazon_url TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active products"
  ON public.products FOR SELECT
  USING (is_active = TRUE);

CREATE POLICY "Admins can manage products"
  ON public.products FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND is_admin = TRUE
    )
  );
```

### 4. Inquiries/Acquisition History Table

```sql
CREATE TABLE public.inquiries (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
  product_name TEXT NOT NULL,
  message TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'contacted', 'converted', 'archived')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.inquiries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own inquiries"
  ON public.inquiries FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create inquiries"
  ON public.inquiries FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can manage all inquiries"
  ON public.inquiries FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND is_admin = TRUE
    )
  );
```

### 5. Orders Table

```sql
CREATE TABLE public.orders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  order_number TEXT UNIQUE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  address_id UUID REFERENCES public.addresses(id) ON DELETE SET NULL,
  items JSONB NOT NULL,
  subtotal DECIMAL(10,2) NOT NULL,
  shipping DECIMAL(10,2) DEFAULT 0,
  total DECIMAL(10,2) NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'shipped', 'delivered', 'cancelled')),
  payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'failed')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own orders"
  ON public.orders FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all orders"
  ON public.orders FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND is_admin = TRUE
    )
  );
```

### 6. Product Views Analytics

```sql
CREATE TABLE public.product_views (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  viewed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.product_views ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can log views"
  ON public.product_views FOR INSERT
  WITH CHECK (TRUE);

CREATE POLICY "Admins can view analytics"
  ON public.product_views FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND is_admin = TRUE
    )
  );
```

## Functions

### Generate Unique Member ID

```sql
CREATE OR REPLACE FUNCTION generate_member_id()
RETURNS TEXT AS $$
DECLARE
  new_id TEXT;
  id_exists BOOLEAN;
BEGIN
  LOOP
    -- Generate format: AK-YYYY-XXXX (e.g., AK-2024-A7B3)
    new_id := 'AK-' || 
              EXTRACT(YEAR FROM NOW())::TEXT || '-' ||
              UPPER(SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 4));
    
    -- Check if ID already exists
    SELECT EXISTS(SELECT 1 FROM public.profiles WHERE member_id = new_id) INTO id_exists;
    
    EXIT WHEN NOT id_exists;
  END LOOP;
  
  RETURN new_id;
END;
$$ LANGUAGE plpgsql;
```

### Auto-create profile on signup

```sql
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, member_id, email, first_name, last_name, email_verified)
  VALUES (
    NEW.id,
    generate_member_id(),
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'first_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'last_name', ''),
    FALSE
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger on auth.users
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

### Auto-update timestamps

```sql
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_products_updated_at
  BEFORE UPDATE ON public.products
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_orders_updated_at
  BEFORE UPDATE ON public.orders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
```

## Environment Variables

Create `.env` file:

```env
SUPABASE_URL=your-project-url.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
ADMIN_UUID=your-admin-uuid
```

## Email Templates

### OTP Verification Email

Go to Supabase Dashboard → Authentication → Email Templates → Confirm signup

```html
<h2>Welcome to Atelier Ākāra</h2>
<p>Verify your email to activate your account:</p>
<p><a href="{{ .ConfirmationURL }}">Verify Email</a></p>
<p>Your unique Member ID will be assigned upon verification.</p>
```

### Password Reset Email

```html
<h2>Reset Your Password</h2>
<p>Click below to reset your Atelier Ākāra password:</p>
<p><a href="{{ .ConfirmationURL }}">Reset Password</a></p>
<p>This link expires in 1 hour.</p>
```

## Security Settings

In Supabase Dashboard → Authentication → Settings:

- ✅ Enable Email Confirmations
- ✅ Secure email change (confirm old + new email)
- ✅ Enable password strength requirements
- ✅ Session timeout: 7 days
- ✅ Enable MFA (optional but recommended)

## Admin Setup

After creating your account, manually set admin status:

```sql
UPDATE public.profiles
SET is_admin = TRUE
WHERE email = 'your-admin-email@example.com';
```

## Initial Product Data

```sql
INSERT INTO public.products (name, category, price, trade_price, description, dimensions, weight, colors, image_url)
VALUES
  ('Vetra', 'Planter', 649, 455, 'Vertical ribbed oval planter', '23 × 13 × 8 cm', '300g', ARRAY['Beige'], NULL),
  ('Vāyu', 'Planter', 699, 489, 'Diagonal lattice spherical planter', '13 × 13 × 10 cm', '250g', ARRAY['Beige', 'Black'], NULL),
  ('Sway', 'Planter', 699, 489, 'Horizontal wave spherical planter', '13 × 13 × 10 cm', '210g', ARRAY['Grey', 'Black'], NULL),
  ('Reva', 'Vase', 899, 629, 'Diagonal lattice statement vase', '24cm H × 16.4cm base', NULL, ARRAY['Beige'], NULL),
  ('Tattva', 'Vase', 999, 699, 'Diamond lattice statement vase', '22cm H × 12cm base', '200g', ARRAY['Matte Black'], NULL);
```

## Done!

Your Supabase backend is now configured for:
- ✅ User authentication with email verification
- ✅ Unique Member IDs
- ✅ Admin dashboard access control
- ✅ Product management
- ✅ Order processing
- ✅ Analytics tracking
- ✅ Secure RLS policies
