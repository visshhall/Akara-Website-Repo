# CRITICAL DEPLOYMENT FIXES

## WHY YOUR SITE LOOKS BROKEN:

### 1. MISSING config.js in config/ folder
**Problem:** Config folder is empty on deployed site
**Solution:** config.js must be in BOTH root AND config/ folder

### 2. CSS Not Loading
**Problem:** auth-styles.css path incorrect
**Solution:** Move to /assets/css/ folder

### 3. Supabase Not Configured
**Problem:** No Supabase credentials entered
**Solution:** Update config.js with your actual credentials

### 4. robots.txt Malformed
**Problem:** 107 syntax errors
**Solution:** Fix robots.txt format

---

## STEP-BY-STEP FIX:

### Step 1: Fix robots.txt

Current (BROKEN):
```
User-agent: *
Allow: /
Disallow: /admin/
```

Fixed (CORRECT):
```
User-agent: *
Disallow: /admin/
Disallow: /user/
Disallow: /auth/callback.html

Sitemap: https://akaraonline.co.in/sitemap.xml
```

### Step 2: Create manifest.json for PWA

Create: /manifest.json
```json
{
  "name": "Atelier Ākāra",
  "short_name": "Ākāra",
  "description": "Contemporary home décor",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#004d4d",
  "theme_color": "#004d4d",
  "icons": [
    {
      "src": "/assets/images/icon-192.png",
      "sizes": "192x192",
      "type": "image/png"
    },
    {
      "src": "/assets/images/icon-512.png",
      "sizes": "512x512",
      "type": "image/png"
    }
  ]
}
```

### Step 3: Fix CSS Path

In ALL HTML files, change:
```html
<!-- WRONG -->
<link rel="stylesheet" href="/auth-styles.css">

<!-- CORRECT -->
<link rel="stylesheet" href="/assets/css/main.css">
```

### Step 4: Configure Supabase

1. Go to https://supabase.com
2. Get your Project URL and anon key
3. Update config.js:

```javascript
export const supabaseConfig = {
    url: 'https://YOUR_PROJECT_ID.supabase.co',
    anonKey: 'YOUR_ACTUAL_ANON_KEY_HERE'
};
```

### Step 5: Fix Signup Issue

The signup isn't working because:
1. Supabase not configured
2. Email verification redirect URL not set

Fix in Supabase dashboard:
- Go to Authentication → URL Configuration
- Site URL: https://akaraonline.co.in
- Redirect URLs: https://akaraonline.co.in/auth/callback.html

---

## COMPLETE FILE STRUCTURE FIX:

Your deployed site needs:
```
/
├── index.html
├── catalog.html
├── config.js ← MUST BE HERE
├── manifest.json ← ADD THIS
├── robots.txt ← FIX THIS
├── sitemap.xml
├── _headers
├── _redirects
├── assets/
│   ├── css/
│   │   └── main.css ← MOVE auth-styles.css HERE
│   ├── js/
│   │   └── main.js
│   └── images/
│       ├── favicon.png
│       ├── icon-192.png ← ADD
│       └── icon-512.png ← ADD
├── config/
│   └── config.js ← ALSO HERE (duplicate for imports)
├── auth/
├── user/
├── admin/
└── ... (rest of folders)
```

---

## WHY SIGNUP ISN'T WORKING:

### Issue 1: No Supabase Connection
```javascript
// In signup.html, this line fails:
const { data, error } = await supabase.auth.signUp({...});
// Because supabaseConfig.url is undefined
```

### Issue 2: Import Error
```javascript
// This fails if config.js is missing:
import { supabaseConfig } from '../config.js';
```

### Issue 3: CORS/CSP Headers
Your _headers file blocks Supabase API calls.

FIX:
```
Content-Security-Policy: default-src 'self'; 
  connect-src 'self' https://*.supabase.co https://api.razorpay.com;
```

---

## IMMEDIATE ACTION REQUIRED:

1. ✅ Create manifest.json
2. ✅ Fix robots.txt
3. ✅ Move CSS to /assets/css/
4. ✅ Update all HTML files with correct CSS path
5. ✅ Configure Supabase credentials
6. ✅ Redeploy to Netlify

---

## TEST SIGNUP AFTER FIX:

1. Open browser console (F12)
2. Go to signup page
3. Fill form and submit
4. Check console for errors:
   - "Supabase is not defined" = config.js missing
   - "Invalid API key" = wrong Supabase credentials
   - "CORS error" = _headers issue

---

## NETLIFY DEPLOYMENT CHECKLIST:

Before deploying:
- [ ] config.js exists in root
- [ ] config.js exists in config/ folder
- [ ] Supabase credentials added
- [ ] CSS moved to /assets/css/
- [ ] All HTML files updated with new CSS path
- [ ] manifest.json created
- [ ] robots.txt fixed
- [ ] PWA icons added (192x192, 512x512)

After deploying:
- [ ] Test signup
- [ ] Check browser console (no errors)
- [ ] Run Lighthouse again
- [ ] Verify CSS loads

