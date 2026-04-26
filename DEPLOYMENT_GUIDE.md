# Deployment Guide - Atelier Ākāra

## Complete Step-by-Step Deployment

---

## Phase 1: Supabase Backend Setup

### Step 1: Create Supabase Project

1. Go to [supabase.com](https://supabase.com)
2. Click "New Project"
3. Choose organization (or create one)
4. Set project name: `atelier-akara`
5. Set database password (save this!)
6. Choose region (closest to your users)
7. Click "Create Project" (takes ~2 minutes)

### Step 2: Run Database Schema

1. Once project is ready, click "SQL Editor" in left sidebar
2. Click "New Query"
3. Open `SUPABASE_SETUP.md` from your files
4. Copy ALL the SQL code
5. Paste into Supabase SQL editor
6. Click "Run" (bottom right)
7. Wait for "Success" message
8. Verify tables created: Click "Table Editor" → Should see profiles, products, orders, etc.

### Step 3: Get API Credentials

1. Click "Settings" (gear icon) in left sidebar
2. Click "API" under Project Settings
3. Copy these values:
   - **Project URL** (looks like: https://xxxxx.supabase.co)
   - **anon public** key (long string starting with eyJ...)

### Step 4: Configure Email Authentication

1. Click "Authentication" in left sidebar
2. Click "Providers"
3. Find "Email" → Toggle ON
4. Click "Email Templates" tab
5. Select "Confirm signup" template
6. Replace with:
```html
<h2>Welcome to Atelier Ākāra</h2>
<p>Verify your email to activate your account:</p>
<p><a href="{{ .ConfirmationURL }}">Verify Email</a></p>
<p>Your unique Member ID will be assigned upon verification.</p>
```
7. Set "Redirect URL": `{{ .SiteURL }}/auth/callback.html`
8. Save

9. Select "Reset password" template
10. Replace with:
```html
<h2>Reset Your Password</h2>
<p>Click below to set a new password:</p>
<p><a href="{{ .ConfirmationURL }}">Reset Password</a></p>
<p>This link expires in 1 hour.</p>
```
11. Save

---

## Phase 2: Configure Your Files

### Step 5: Update config.js

1. Open `config.js` in your code editor
2. Replace placeholders:

```javascript
export const supabaseConfig = {
    url: 'https://YOUR_PROJECT.supabase.co',  // Paste your Project URL
    anonKey: 'eyJ...',  // Paste your anon public key
    adminUUID: 'LEAVE_EMPTY_FOR_NOW'  // Will add after first signup
};
```

3. Save file

---

## Phase 3: Deploy Website

### Option A: Deploy to Netlify (Recommended - Easiest)

1. Go to [netlify.com](https://netlify.com)
2. Sign up/Login (GitHub, GitLab, or email)
3. Click "Add new site" → "Deploy manually"
4. Drag your ENTIRE `auth-system` folder into the upload area
5. Wait for deployment (~30 seconds)
6. You'll get a URL like: `https://random-name-123.netlify.app`
7. Click "Domain settings" → "Change site name" → Choose: `atelier-akara` (if available)
8. Your site is now: `https://atelier-akara.netlify.app`

**Update Supabase with your live URL:**
1. Go back to Supabase
2. Authentication → URL Configuration
3. Set "Site URL": `https://atelier-akara.netlify.app`
4. Set "Redirect URLs": `https://atelier-akara.netlify.app/auth/callback.html`
5. Save

### Option B: Deploy to GitHub Pages

1. Create GitHub account (github.com)
2. Create new repository: "atelier-akara-site"
3. Upload all files from `auth-system` folder
4. Go to Settings → Pages
5. Source: Deploy from branch → main
6. Save
7. Your site will be: `https://yourusername.github.io/atelier-akara-site`

**Update Supabase:**
1. Set Site URL: `https://yourusername.github.io/atelier-akara-site`
2. Set Redirect: `https://yourusername.github.io/atelier-akara-site/auth/callback.html`

---

## Phase 4: Create Your Admin Account

### Step 6: Sign Up

1. Go to your live site: `https://atelier-akara.netlify.app`
2. Click "Create Identity"
3. Fill form:
   - First Name: Your name
   - Last Name: Your last name
   - Email: your.email@gmail.com
   - Password: Strong password (save this!)
   - Check terms box
4. Click "Create Identity"
5. Check your email inbox (and spam folder)
6. Click verification link in email
7. You'll be redirected and logged in

### Step 7: Get Your UUID

1. Go to Supabase → Authentication → Users
2. Find your email
3. Copy the UUID (looks like: `a1b2c3d4-1234-5678-9abc-def012345678`)

### Step 8: Set Admin Access

1. Supabase → SQL Editor → New Query
2. Paste this (replace with YOUR email):

```sql
UPDATE public.profiles
SET is_admin = TRUE
WHERE email = 'your.email@gmail.com';
```

3. Click "Run"
4. Verify: Go to Table Editor → profiles → Find your row → is_admin should be TRUE

### Step 9: Update config.js with UUID

1. Edit `config.js`
2. Add your UUID:

```javascript
export const supabaseConfig = {
    url: 'https://YOUR_PROJECT.supabase.co',
    anonKey: 'eyJ...',
    adminUUID: 'a1b2c3d4-1234-5678-9abc-def012345678'  // YOUR UUID
};
```

3. Save
4. Re-upload to Netlify (drag folder again) OR commit to GitHub

---

## Phase 5: Add Initial Products

### Step 10: Add Products via SQL

1. Supabase → SQL Editor → New Query
2. Paste:

```sql
INSERT INTO public.products (name, category, price, trade_price, description, dimensions, weight, colors)
VALUES
  ('Vetra', 'Planter', 649, 455, 'Vertical ribbed oval planter', '23 × 13 × 8 cm', '300g', ARRAY['Beige']),
  ('Vāyu', 'Planter', 699, 489, 'Diagonal lattice spherical planter', '13 × 13 × 10 cm', '250g', ARRAY['Beige', 'Black']),
  ('Sway', 'Planter', 699, 489, 'Horizontal wave spherical planter', '13 × 13 × 10 cm', '210g', ARRAY['Grey', 'Black']),
  ('Reva', 'Vase', 899, 629, 'Diagonal lattice statement vase', '24cm H × 16.4cm base', NULL, ARRAY['Beige']),
  ('Tattva', 'Vase', 999, 699, 'Diamond lattice statement vase', '22cm H × 12cm base', '200g', ARRAY['Matte Black']);
```

3. Click "Run"
4. Verify: Table Editor → products → Should see 5 products

---

## Phase 6: Test Everything

### Step 11: Test User Flow

1. Open site in Incognito/Private window
2. Click "Create Identity"
3. Sign up with different email
4. Verify email
5. Login
6. Check profile shows Member ID
7. Test checkout (fill address form)
8. Check order appears in Orders page

### Step 12: Test Admin Dashboard

1. Login with your admin account
2. Go to `/admin/dashboard.html`
3. Verify you see:
   - Stats (users, products, orders)
   - Recent orders
   - Product analytics
   - Recent activity
4. Go to `/admin/products.html`
5. Click + button
6. Add a test product
7. Verify it appears
8. Go to `/admin/orders.html` → See test order
9. Go to `/admin/users.html` → See both users

---

## Phase 7: Custom Domain (Optional)

### Step 13: Buy Domain

1. Go to [Namecheap.com](https://namecheap.com) or [GoDaddy.com](https://godaddy.com)
2. Search: `akaraatelier.com`
3. Purchase (~₹800/year)

### Step 14: Connect to Netlify

1. Netlify → Domain Settings
2. Click "Add custom domain"
3. Enter: `akaraatelier.com`
4. Follow DNS instructions
5. Add Netlify nameservers to your domain registrar
6. Wait for propagation (5-30 minutes)
7. Netlify auto-provisions SSL certificate

### Step 15: Update Supabase URLs

1. Supabase → Authentication → URL Configuration
2. Update Site URL: `https://akaraatelier.com`
3. Update Redirect: `https://akaraatelier.com/auth/callback.html`

---

## Deployment Complete! ✅

**Your live system:**
- 🌐 Website: `https://atelier-akara.netlify.app` (or your domain)
- 🔐 Login: `/auth/login.html`
- 👤 User Profile: `/user/profile.html`
- 🛒 Checkout: `/user/checkout.html`
- 🎛️ Admin Dashboard: `/admin/dashboard.html`

**Test URLs:**
- Signup: `https://your-site.com/auth/signup.html`
- Login: `https://your-site.com/auth/login.html`
- Admin: `https://your-site.com/admin/dashboard.html`

---

## Troubleshooting

**Email verification not working?**
→ Check Supabase logs: Authentication → Logs

**Admin dashboard "Access Denied"?**
→ Verify is_admin = TRUE in profiles table
→ Verify UUID matches in config.js

**Callback page doesn't work?**
→ Check redirect URL in Supabase matches deployed URL exactly

**Can't add products?**
→ Verify you're logged in as admin
→ Check browser console for errors

---

## Monitoring & Maintenance

**Daily:**
- Check Supabase Dashboard for new signups
- Monitor orders in admin dashboard

**Weekly:**
- Review product analytics
- Check for failed email verifications

**Monthly:**
- Export user data backup
- Review Supabase usage (free tier: 50K monthly active users)

---

## Cost Breakdown

**Free Forever:**
- Netlify hosting (100GB bandwidth/month)
- Supabase (50K users, 500MB database)
- SSL certificate
- Email authentication

**Optional Costs:**
- Custom domain: ₹800/year
- Supabase Pro (if you exceed limits): $25/month

---

**Total setup time: 20-30 minutes**
**Total cost: ₹0 (or ₹800/year with domain)**

**You're live! 🚀**
