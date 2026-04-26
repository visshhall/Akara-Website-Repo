# COMPLETE DEPLOYMENT GUIDE - ATELIER ĀKĀRA
## From Zero to Live in 2-3 Hours

**Total Cost:** ₹799/year (domain only)
**Difficulty:** Beginner-friendly
**Time Required:** 2-3 hours first time, 30 minutes after

---

## 📋 WHAT YOU'LL NEED

Before starting, gather:
- ✅ GoDaddy account (domain: akaraonline.co.in purchased)
- ✅ Your email address (for admin account)
- ✅ Your phone number (for support)
- ✅ Computer with internet
- ✅ Chrome or Firefox browser

---

## 🚀 PHASE 1: SUPABASE DATABASE (15 min)

### Step 1: Create Account
1. Go to https://supabase.com
2. Click "Start your project" → Sign up
3. Verify email

### Step 2: Create Project  
1. Click "New Project"
2. Fill in:
   - Name: `atelier-akara`
   - Password: [CREATE STRONG PASSWORD - SAVE IT]
   - Region: Southeast Asia (Singapore)
3. Click "Create new project"
4. Wait 2-3 minutes

### Step 3: Run Database Schema
1. Click "SQL Editor" (left sidebar)
2. Click "+ New query"
3. Open file: `SUPABASE_SETUP.md` in this folder
4. Copy ALL SQL code
5. Paste in SQL Editor
6. Click "Run" or Ctrl+Enter
7. Success message should appear

### Step 4: Get Credentials
1. Click Settings (gear icon)
2. Click "API"
3. Copy and SAVE these:
   - **Project URL:** https://xxxx.supabase.co
   - **anon public:** eyJhbGc... (long key)

### Step 5: Configure Auth
1. Click "Authentication"
2. Click "URL Configuration"
3. Enter:
   - Site URL: `https://akaraonline.co.in`
   - Redirect URLs: `https://akaraonline.co.in/auth/callback.html`
4. Click "Save"

### Step 6: Create Storage
1. Click "Storage"
2. Create bucket: `product-images` (Public: YES)
3. Create bucket: `review-images` (Public: YES)  
4. Create bucket: `invoices` (Public: NO)

**✅ SUPABASE COMPLETE!**

---

## 🌐 PHASE 2: NETLIFY DEPLOYMENT (10 min)

### Step 1: Edit Config File
1. Open `config.js` in text editor
2. Replace with YOUR Supabase credentials:

```javascript
export const supabaseConfig = {
    url: 'https://YOUR_PROJECT_URL.supabase.co',
    anonKey: 'YOUR_ANON_KEY_HERE',
    adminUUID: ''  // Leave empty for now
};
```

3. Save file (Ctrl+S)

### Step 2: Deploy to Netlify
1. Go to https://netlify.com
2. Sign up/Login
3. Click "Add new site" → "Deploy manually"
4. Drag ENTIRE folder into upload area
5. Wait 30-60 seconds
6. You get URL: `random-name.netlify.app`

### Step 3: Add Custom Domain
1. Click "Domain settings"
2. Click "Add custom domain"
3. Enter: `akaraonline.co.in`
4. Netlify shows DNS instructions
5. Keep page open

**✅ NETLIFY DEPLOYED!**

---

## 🔧 PHASE 3: GODADDY DNS (10 min)

### Step 1: Access DNS
1. Login to GoDaddy
2. My Products → akaraonline.co.in
3. Click "DNS"

### Step 2: Delete Old Records
Delete any existing A or CNAME records for @ and www

### Step 3: Add New Records

**A Record:**
```
Type: A
Name: @
Value: 75.2.60.5
TTL: 600
```

**CNAME:**
```
Type: CNAME
Name: www
Value: YOUR-SITE-NAME.netlify.app
TTL: 600
```
(Replace YOUR-SITE-NAME with your actual Netlify subdomain)

### Step 4: Wait for DNS
- Takes 5-30 minutes
- Check: https://dnschecker.org
- Enter: akaraonline.co.in
- Wait for green checks

**✅ DNS CONFIGURED!**

---

## 📧 PHASE 4: EMAIL SETUP (15 min)

### Step 1: Zoho Free Account
1. Go to https://zoho.com/mail
2. Forever Free plan → Sign up
3. Add domain: `akaraonline.co.in`

### Step 2: Verify Domain (TXT Record)
In GoDaddy DNS, add:
```
Type: TXT
Name: @
Value: [Zoho gives you this]
TTL: 3600
```

### Step 3: Add MX Records
```
Type: MX | Name: @ | Value: mx.zoho.in | Priority: 10
Type: MX | Name: @ | Value: mx2.zoho.in | Priority: 20
Type: MX | Name: @ | Value: mx3.zoho.in | Priority: 50
```

### Step 4: Add SPF
```
Type: TXT
Name: @
Value: v=spf1 include:zoho.in ~all
```

### Step 5: Create Email
1. In Zoho: Create account
2. Email: `support@akaraonline.co.in`
3. Password: [STRONG PASSWORD - SAVE IT]

### Step 6: Test
Send test email to support@akaraonline.co.in
Check Zoho webmail to confirm

**✅ EMAIL WORKING!**

---

## 👤 PHASE 5: CREATE ADMIN ACCOUNT (10 min)

### Step 1: Sign Up
1. Go to: https://akaraonline.co.in/auth/signup.html
2. Fill YOUR details:
   - First Name, Last Name
   - Email (YOUR real email)
   - Phone
   - Password [SAVE IT]
3. Click "Sign Up"

### Step 2: Verify Email
1. Check inbox
2. Click verification link
3. Redirected to profile

### Step 3: Get Your UUID
1. Supabase → Authentication → Users
2. Find your email
3. Click it
4. Copy UUID (long string)

### Step 4: Make Yourself Admin
In Supabase SQL Editor:
```sql
UPDATE profiles 
SET is_admin = TRUE 
WHERE email = 'YOUR_EMAIL@example.com';
```
Click "Run"

### Step 5: Update Config
1. Edit `config.js`
2. Add your UUID:
```javascript
adminUUID: 'YOUR_UUID_HERE'
```
3. Save
4. Re-upload to Netlify (drag folder again)

### Step 6: Test Admin Access
Visit: https://akaraonline.co.in/admin/dashboard.html
Should see admin panel

**✅ ADMIN ACCOUNT CREATED!**

---

## 📦 PHASE 6: ADD PRODUCTS (15 min)

### Step 1: Access Admin
Login → Admin → Products

### Step 2: Add Product
Click "+ Add Product"

Example:
```
Name: Vetra Planter
Category: Planter
Price: ₹649
Description: [Write 2-3 paragraphs]

Bullet Points:
• Geometric design
• Drainage included
• Size: 23×13×8 cm

Upload 5 images

Variants:
Size: Medium, Large
Color: Beige, Black

Stock:
Beige M: 45
Beige L: 23
Black M: 12
```

Click "Add Product"

Repeat for all products

**✅ PRODUCTS ADDED!**

---

## 💳 PHASE 7: PAYMENT GATEWAY (Optional - 20 min)

### Step 1: Razorpay Account
1. https://razorpay.com → Sign up
2. Submit KYC (business details)
3. Wait for approval (1-2 days)

### Step 2: Get Keys
1. Dashboard → Settings → API Keys
2. Generate Test Key
3. Copy Key ID and Secret

### Step 3: Add to Netlify
Site Settings → Environment Variables
```
RAZORPAY_KEY_ID = rzp_test_xxxxx
RAZORPAY_KEY_SECRET = xxxxx
```

**✅ PAYMENTS CONFIGURED!**

---

## ✅ PHASE 8: TESTING (30 min)

### Test 1: Signup Flow
- Create test account
- Verify email works
- Check profile displays ✅

### Test 2: Product Browse
- View catalog
- Filter by category
- View product details ✅

### Test 3: Add to Cart
- Select variant
- Add to cart
- Update quantity ✅

### Test 4: Checkout
- Fill address
- Verify validation
- Complete order ✅

### Test 5: Admin Panel
- View dashboard
- Check order appears
- Update status ✅

### Test 6: Security
- Try 6 wrong passwords → Locked ✅
- Try SQL injection → Blocked ✅
- Access admin without auth → Denied ✅

### Test 7: Mobile
- Open on phone
- Check all pages
- Verify responsive ✅

### Test 8: Performance
https://pagespeed.web.dev
Target: 90+ score ✅

### Test 9: Security Headers
https://securityheaders.com
Target: A rating ✅

### Test 10: SSL
https://ssllabs.com/ssltest
Target: A+ rating ✅

**✅ ALL TESTS PASSED!**

---

## 🎉 PHASE 9: GO LIVE

### Final Checklist
- [ ] All products added with images
- [ ] Prices correct
- [ ] Legal pages updated
- [ ] Contact info correct
- [ ] Logo uploaded
- [ ] Test order successful
- [ ] Email notifications working
- [ ] Mobile tested
- [ ] Security verified

### Launch!
1. Switch Razorpay to Live mode
2. Announce on Instagram
3. Email subscribers
4. Monitor first 24 hours

**🚀 YOUR SITE IS LIVE!**

---

## 📊 POST-LAUNCH

### Daily:
- Check orders
- Respond to support (< 4 hrs)
- Monitor inventory

### Weekly:
- Review sales
- Update stock
- Backup database

### Monthly:
- Analyze trends
- Optimize SEO
- Update products

---

## 🆘 TROUBLESHOOTING

### Site not loading?
1. Check DNS: dnschecker.org
2. Wait 30 minutes
3. Clear browser cache
4. Try incognito mode

### Email not working?
1. Check spam folder
2. Verify MX records in GoDaddy
3. Wait 1 hour for propagation

### Admin access denied?
1. Verify is_admin = TRUE in database
2. Check UUID matches exactly
3. Clear cache, try incognito

### Payment failing?
1. Check Razorpay keys in Netlify
2. Verify webhook URL correct
3. Check Razorpay dashboard for errors

---

## 📞 SUPPORT

**Email:** support@akaraonline.co.in
**Docs:** All files in /docs folder
**Supabase:** https://supabase.com/docs
**Netlify:** https://docs.netlify.com

---

## 💰 COSTS SUMMARY

**One-Time:**
- Domain: ₹799/year
- Everything else: ₹0

**Monthly:**
- Hosting: ₹0 (free tier)
- Database: ₹0 (free tier)
- Email: ₹0 (free tier)
- SSL: ₹0 (free)

**Per Transaction:**
- Payment fee: 2% + ₹3

**TOTAL: ₹799/year + transaction fees**

---

**DEPLOYMENT COMPLETE!**
**Time Taken:** 2-3 hours
**Site Status:** LIVE ✅
**Security:** Enterprise-grade ✅
**Cost:** ₹799/year ✅

**Congratulations! Your e-commerce site is now LIVE!** 🎉
