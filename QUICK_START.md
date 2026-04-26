# Quick Start - Get Live in 15 Minutes

## 1. Supabase (5 min)

1. Go to [supabase.com](https://supabase.com) → New Project
2. Copy ALL SQL from `SUPABASE_SETUP.md`
3. Paste in SQL Editor → Run
4. Copy: Project URL + Anon Key

## 2. Configure (2 min)

Edit `config.js`:
```javascript
url: 'YOUR_URL',
anonKey: 'YOUR_KEY',
adminUUID: ''  // Add later
```

## 3. Deploy (5 min)

**Netlify:**
1. [netlify.com](https://netlify.com) → Drag folder
2. Get URL: `https://xxx.netlify.app`

**Update Supabase:**
- Site URL: `https://xxx.netlify.app`
- Redirect: `https://xxx.netlify.app/auth/callback.html`

## 4. Create Admin (3 min)

1. Go to live site → Sign up
2. Verify email
3. Supabase → Users → Copy your UUID
4. SQL: `UPDATE profiles SET is_admin=TRUE WHERE email='you@email.com'`
5. Update `config.js` with UUID
6. Re-upload to Netlify

## Done! ✅

- Login: `/auth/login.html`
- Admin: `/admin/dashboard.html`

Full guide: See `DEPLOYMENT_GUIDE.md`
