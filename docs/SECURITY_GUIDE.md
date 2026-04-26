# SECURITY GUIDE - ATELIER ĀKĀRA

## Security Features Implemented

### 1. Authentication Security
- Email verification required
- Password strength enforcement
- Brute force protection (5 attempts = 1 hour lockout)
- Session timeout (30 minutes)
- Secure password reset

### 2. Input Validation
- All inputs length-limited
- XSS prevention (sanitization)
- SQL injection prevention (RLS policies)
- File upload validation
- Image metadata removal

### 3. Network Security
- HTTPS enforced (HSTS)
- Security headers (CSP, X-Frame-Options, etc.)
- CSRF protection
- Rate limiting (client + server)

### 4. Data Protection
- Database encryption at rest
- Encrypted data in transit (TLS 1.3)
- Row Level Security (RLS)
- DPDP Act 2023 compliant
- Regular backups

### 5. Admin Security
- UUID-based admin verification
- Admin-only RLS policies
- Activity logging
- 2FA support

## Security Checklist

- [ ] All environment variables set
- [ ] HTTPS enabled
- [ ] Security headers verified
- [ ] RLS policies active
- [ ] Backup system working
- [ ] Email verification enforced
- [ ] Rate limiting active
- [ ] Input validation working
- [ ] Admin UUID configured
- [ ] Payment webhook signed

## Security Testing

Run these tests before going live:

1. **Brute Force Test**: Try 6 wrong passwords
2. **XSS Test**: Try `<script>alert('xss')</script>` in forms
3. **SQL Injection Test**: Try `' OR '1'='1` in login
4. **Admin Access Test**: Try accessing admin without auth
5. **File Upload Test**: Try uploading .exe or .php file

All should be BLOCKED.

## Security Monitoring

Daily checks:
- Review security events in admin panel
- Check failed login attempts
- Monitor unusual activity
- Review backup integrity

## Incident Response

If security breach detected:
1. Immediately disable affected accounts
2. Change all passwords
3. Rotate API keys
4. Review audit logs
5. Notify affected users
6. Contact support@akaraonline.co.in
