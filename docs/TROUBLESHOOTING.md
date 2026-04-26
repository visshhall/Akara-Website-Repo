# TROUBLESHOOTING GUIDE

## Common Issues & Solutions

### Site Not Loading

**Symptoms:** akaraonline.co.in shows error or doesn't load

**Solutions:**
1. Check DNS propagation: https://dnschecker.org
2. Verify Netlify deployment successful
3. Check browser console for errors
4. Try incognito mode (clear cache)
5. Wait 30 minutes for DNS

### Email Verification Not Working

**Symptoms:** Verification email not received

**Solutions:**
1. Check spam/junk folder
2. Verify Supabase "Site URL" is correct
3. Check "Redirect URLs" includes callback.html
4. Wait 5 minutes and try again
5. Check Zoho email is working

### Payment Failing

**Symptoms:** Payment doesn't process or fails

**Solutions:**
1. Verify Razorpay keys in Netlify env vars
2. Check Razorpay dashboard for error logs
3. Ensure webhook URL is correct
4. Try test card: 4111 1111 1111 1111
5. Check browser console for errors

### Admin Access Denied

**Symptoms:** Can't access admin panel

**Solutions:**
1. Verify is_admin = TRUE in database
2. Check adminUUID matches your UUID exactly
3. Clear browser cache
4. Try incognito mode
5. Re-upload config.js to Netlify

### Images Not Uploading

**Symptoms:** Product images fail to upload

**Solutions:**
1. Check file size (< 5MB)
2. Verify file type (JPG, PNG, WebP only)
3. Check Supabase storage bucket is public
4. Verify storage bucket exists
5. Check browser console for errors

### Orders Not Showing

**Symptoms:** Orders don't appear in admin

**Solutions:**
1. Check Supabase RLS policies enabled
2. Verify user is authenticated
3. Check browser console for errors
4. Refresh page
5. Check database directly in Supabase

## Error Messages

### "Access Denied"
- Verify admin UUID
- Check is_admin flag
- Clear cache

### "Rate Limit Exceeded"
- Wait for timeout
- Clear localStorage
- Try different browser

### "Network Error"
- Check internet connection
- Verify Supabase URL
- Check API keys

## Getting Help

1. Check this troubleshooting guide
2. Review deployment guide
3. Check browser console
4. Email: support@akaraonline.co.in
5. Include: Error message, steps to reproduce, browser used
