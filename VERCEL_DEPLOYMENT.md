# DEPLOY TO VERCEL - COMPLETE GUIDE

## WHY VERCEL?
- Better free tier than Netlify
- No sudden pauses
- Faster global CDN
- Easier custom domain setup

---

## STEP 1: CREATE VERCEL ACCOUNT (2 minutes)

1. Go to: https://vercel.com/signup
2. Click: "Continue with GitHub" (recommended)
   OR
   Click: "Continue with Email"
3. Verify your email
4. ✅ Account created!

---

## STEP 2: PREPARE YOUR FILES (1 minute)

Extract the package you downloaded:
`ATELIER-AKARA-FIXED-DEPLOYMENT.tar.gz`

You should have folder: `atelier-akara-final/`

**CRITICAL: Configure Supabase first!**
1. Open: `atelier-akara-final/config.js`
2. Add your Supabase credentials:

```javascript
export const supabaseConfig = {
    url: 'https://YOUR_PROJECT.supabase.co', // YOUR ACTUAL URL
    anonKey: 'YOUR_ACTUAL_ANON_KEY', // YOUR ACTUAL KEY
    adminUUID: ''
};
```

3. Save file

---

## STEP 3: CREATE vercel.json (Configuration File)

Create file: `atelier-akara-final/vercel.json`

```json
{
  "version": 2,
  "builds": [
    {
      "src": "**/*.html",
      "use": "@vercel/static"
    },
    {
      "src": "netlify/functions/**/*.js",
      "use": "@vercel/node"
    }
  ],
  "routes": [
    {
      "src": "/(.*)",
      "dest": "/$1"
    }
  ],
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "X-Frame-Options",
          "value": "DENY"
        },
        {
          "key": "X-Content-Type-Options",
          "value": "nosniff"
        },
        {
          "key": "X-XSS-Protection",
          "value": "1; mode=block"
        },
        {
          "key": "Referrer-Policy",
          "value": "strict-origin-when-cross-origin"
        },
        {
          "key": "Permissions-Policy",
          "value": "geolocation=(), microphone=(), camera=()"
        },
        {
          "key": "Strict-Transport-Security",
          "value": "max-age=31536000; includeSubDomains; preload"
        },
        {
          "key": "Content-Security-Policy",
          "value": "default-src 'self'; script-src 'self' https://cdn.jsdelivr.net https://www.google.com/recaptcha/ https://www.gstatic.com/recaptcha/ https://checkout.razorpay.com; style-src 'self' 'unsafe-inline'; img-src 'self' data: https: blob:; connect-src 'self' https://*.supabase.co https://www.google.com/recaptcha/ https://api.razorpay.com; frame-src https://www.google.com/recaptcha/ https://api.razorpay.com; frame-ancestors 'none'"
        }
      ]
    }
  ],
  "redirects": [
    {
      "source": "/",
      "has": [
        {
          "type": "host",
          "value": "www.akaraonline.co.in"
        }
      ],
      "destination": "https://akaraonline.co.in/:path*",
      "permanent": true
    }
  ]
}
```

---

## STEP 4: DEPLOY TO VERCEL (3 minutes)

### METHOD A: Via Vercel Dashboard (Easiest)

1. Go to: https://vercel.com/new
2. Click: "Continue to Dashboard"
3. Click: "Add New..." → "Project"
4. Click: "Browse" or drag your folder
5. Drag: `atelier-akara-final/` folder
6. Project Settings:
   - **Framework Preset:** Other
   - **Root Directory:** ./
   - **Build Command:** (leave empty)
   - **Output Directory:** ./
7. Click: "Deploy"
8. Wait 30-60 seconds
9. ✅ Done! You'll get URL like: `your-site.vercel.app`

### METHOD B: Via Vercel CLI (For Developers)

1. Install Vercel CLI:
```bash
npm install -g vercel
```

2. Navigate to folder:
```bash
cd atelier-akara-final
```

3. Deploy:
```bash
vercel
```

4. Follow prompts:
   - Link to existing project? N
   - Project name: atelier-akara
   - Directory: ./
   - Override settings? N
5. ✅ Deployed!

---

## STEP 5: ADD CUSTOM DOMAIN (5 minutes)

1. In Vercel dashboard, click your project
2. Click: Settings → Domains
3. Enter: `akaraonline.co.in`
4. Click: Add

Vercel will show you DNS records to add in GoDaddy:

**A Record:**
```
Type: A
Name: @
Value: 76.76.21.21
TTL: 600
```

**CNAME Record:**
```
Type: CNAME
Name: www
Value: cname.vercel-dns.com
TTL: 600
```

5. Go to GoDaddy DNS settings
6. Delete old Netlify records
7. Add these Vercel records
8. Click Save
9. Wait 5-30 minutes for DNS propagation
10. ✅ Site live at: https://akaraonline.co.in

---

## STEP 6: ADD ENVIRONMENT VARIABLES

1. Vercel Dashboard → Your Project → Settings
2. Click: Environment Variables
3. Add these:

```
RECAPTCHA_SITE_KEY = your_site_key
RECAPTCHA_SECRET_KEY = your_secret_key
RAZORPAY_KEY_ID = your_razorpay_id
RAZORPAY_KEY_SECRET = your_razorpay_secret
```

4. Click: Save
5. Redeploy (Vercel auto-redeploys)

---

## STEP 7: CONFIGURE SUPABASE

In Supabase dashboard:
1. Authentication → URL Configuration
2. Change:
   - Site URL: `https://akaraonline.co.in`
   - Redirect URLs: `https://akaraonline.co.in/auth/callback.html`
3. Click: Save

---

## VERCEL vs NETLIFY COMPARISON:

| Feature | Netlify Free | Vercel Free |
|---------|-------------|-------------|
| Bandwidth | 100GB/month | 100GB/month |
| Build Minutes | 300/month | 6000/month |
| Sites | 1 | Unlimited |
| Functions | 125K/month | 125K/month |
| **Pausing** | ❌ Yes (your issue!) | ✅ No pausing |
| Deploy Speed | Medium | Fast |
| Custom Domain | Yes | Yes |
| SSL | Free | Free |

**Winner: Vercel** (no pausing, unlimited sites)

---

## TROUBLESHOOTING:

### Issue: 404 on all pages
**Fix:** Check vercel.json exists and routes are correct

### Issue: CSS not loading
**Fix:** Check paths in HTML files (should be `/assets/css/main.css`)

### Issue: Functions not working
**Fix:** Move functions from `netlify/functions/` to `api/` folder
   - Vercel uses `/api/` not `/netlify/functions/`

### Issue: Signup not working
**Fix:** 
1. Check config.js has Supabase credentials
2. Update Supabase redirect URLs to new Vercel domain
3. Check browser console for errors

---

## VERCEL ADVANTAGES:

✅ No surprise pauses (your Netlify issue)
✅ Better global CDN (faster)
✅ Unlimited projects
✅ Better analytics
✅ Automatic preview deployments
✅ Better developer experience
✅ Edge functions (serverless at edge)

---

## MIGRATION CHECKLIST:

- [ ] Downloaded package
- [ ] Configured Supabase in config.js
- [ ] Created vercel.json
- [ ] Deployed to Vercel
- [ ] Added custom domain
- [ ] Updated DNS in GoDaddy
- [ ] Added environment variables
- [ ] Updated Supabase redirect URLs
- [ ] Tested signup
- [ ] Tested payment (if configured)
- [ ] Run Lighthouse test

---

## COST COMPARISON:

**Netlify:**
- Free: 100GB, gets paused ❌
- Pro: $19/month

**Vercel:**
- Hobby (Free): 100GB, NO pausing ✅
- Pro: $20/month (if you need more)

**Winner: Vercel Free Tier** (same bandwidth, no pausing)

---

## FINAL NOTES:

1. Vercel is MORE generous with free tier
2. No surprise account pauses
3. Better performance (faster CDN)
4. Easier to use
5. Better for production sites

**Your site will be MORE stable on Vercel!**

---

## NEED HELP?

**Vercel Support:**
- Docs: https://vercel.com/docs
- Community: https://github.com/vercel/vercel/discussions

**Your Issues:**
- Check browser console (F12)
- Check Vercel deployment logs
- Verify Supabase connection

**Total Migration Time: 15 minutes**

✅ **RECOMMENDED: Switch to Vercel NOW!**
