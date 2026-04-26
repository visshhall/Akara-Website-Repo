// Atelier Ākāra - Security Utilities
// Zero-Space Protocol & Input Sanitization

/**
 * Zero-Space Protocol: Remove all leading/trailing whitespace
 * Prevents blank spaces from being counted as valid data
 */
export function sanitizeInput(value) {
    if (typeof value !== 'string') return value;
    return value.trim();
}

/**
 * Sanitize all form fields in a form element
 */
export function sanitizeForm(formElement) {
    const formData = new FormData(formElement);
    const sanitized = {};
    
    for (let [key, value] of formData.entries()) {
        sanitized[key] = sanitizeInput(value);
    }
    
    return sanitized;
}

/**
 * Validate email format
 */
export function isValidEmail(email) {
    const sanitized = sanitizeInput(email);
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(sanitized) && sanitized.length > 0;
}

/**
 * Validate password strength
 * Requirements: min 8 chars, 1 uppercase, 1 lowercase, 1 number
 */
export function validatePassword(password) {
    const sanitized = sanitizeInput(password);
    
    const checks = {
        length: sanitized.length >= 8,
        uppercase: /[A-Z]/.test(sanitized),
        lowercase: /[a-z]/.test(sanitized),
        number: /[0-9]/.test(sanitized)
    };
    
    const strength = Object.values(checks).filter(Boolean).length;
    
    return {
        isValid: Object.values(checks).every(Boolean),
        strength: strength <= 2 ? 'weak' : strength === 3 ? 'medium' : 'strong',
        checks
    };
}

/**
 * Validate Indian phone number
 * Accepts: 10 digits, optional +91 prefix
 */
export function isValidPhone(phone) {
    const sanitized = sanitizeInput(phone);
    const phoneRegex = /^(\+91)?[6-9]\d{9}$/;
    return phoneRegex.test(sanitized.replace(/\s/g, ''));
}

/**
 * Validate Indian pincode
 */
export function isValidPincode(pincode) {
    const sanitized = sanitizeInput(pincode);
    const pincodeRegex = /^[1-9][0-9]{5}$/;
    return pincodeRegex.test(sanitized);
}

/**
 * Validate name (no numbers or special chars except hyphens, apostrophes)
 */
export function isValidName(name) {
    const sanitized = sanitizeInput(name);
    const nameRegex = /^[a-zA-Z\s'-]+$/;
    return nameRegex.test(sanitized) && sanitized.length > 0;
}

/**
 * Validate required field (not empty after trim)
 */
export function isRequired(value) {
    const sanitized = sanitizeInput(value);
    return sanitized.length > 0;
}

/**
 * Comprehensive form validation
 */
export function validateFormData(data, rules) {
    const errors = {};
    
    for (let field in rules) {
        const value = data[field];
        const fieldRules = rules[field];
        
        // Check required
        if (fieldRules.required && !isRequired(value)) {
            errors[field] = `${fieldRules.label || field} is required`;
            continue;
        }
        
        // Skip other checks if field is empty and not required
        if (!isRequired(value) && !fieldRules.required) continue;
        
        // Check email
        if (fieldRules.type === 'email' && !isValidEmail(value)) {
            errors[field] = 'Invalid email address';
        }
        
        // Check phone
        if (fieldRules.type === 'phone' && !isValidPhone(value)) {
            errors[field] = 'Invalid phone number';
        }
        
        // Check pincode
        if (fieldRules.type === 'pincode' && !isValidPincode(value)) {
            errors[field] = 'Invalid pincode';
        }
        
        // Check name
        if (fieldRules.type === 'name' && !isValidName(value)) {
            errors[field] = 'Invalid name format';
        }
        
        // Check min length
        if (fieldRules.minLength && sanitizeInput(value).length < fieldRules.minLength) {
            errors[field] = `Minimum ${fieldRules.minLength} characters required`;
        }
        
        // Check max length
        if (fieldRules.maxLength && sanitizeInput(value).length > fieldRules.maxLength) {
            errors[field] = `Maximum ${fieldRules.maxLength} characters allowed`;
        }
        
        // Check password
        if (fieldRules.type === 'password') {
            const validation = validatePassword(value);
            if (!validation.isValid) {
                errors[field] = 'Password must be 8+ characters with uppercase, lowercase, and number';
            }
        }
    }
    
    return {
        isValid: Object.keys(errors).length === 0,
        errors
    };
}

/**
 * Display validation errors in form
 */
export function displayErrors(errors) {
    // Clear previous errors
    document.querySelectorAll('.field-error').forEach(el => el.remove());
    
    // Display new errors
    for (let field in errors) {
        const input = document.querySelector(`[name="${field}"]`);
        if (input) {
            const errorDiv = document.createElement('div');
            errorDiv.className = 'field-error';
            errorDiv.style.cssText = 'color: #fecaca; font-size: 0.85rem; margin-top: 0.25rem;';
            errorDiv.textContent = errors[field];
            input.parentElement.appendChild(errorDiv);
            input.style.borderColor = '#ef4444';
        }
    }
}

/**
 * Clear all errors
 */
export function clearErrors() {
    document.querySelectorAll('.field-error').forEach(el => el.remove());
    document.querySelectorAll('.form-input').forEach(input => {
        input.style.borderColor = '';
    });
}

/**
 * Prevent XSS by escaping HTML
 */
export function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

/**
 * Generate secure random string
 */
export function generateSecureId(length = 8) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    const array = new Uint8Array(length);
    crypto.getRandomValues(array);
    
    for (let i = 0; i < length; i++) {
        result += chars[array[i] % chars.length];
    }
    
    return result;
}

/**
 * Auto-apply trim to all inputs on form submission
 */
export function initializeFormSecurity(formElement) {
    formElement.addEventListener('submit', function(e) {
        // Trim all text inputs
        const inputs = formElement.querySelectorAll('input[type="text"], input[type="email"], input[type="tel"], textarea');
        inputs.forEach(input => {
            input.value = input.value.trim();
        });
    });
    
    // Also trim on blur for immediate feedback
    const inputs = formElement.querySelectorAll('input[type="text"], input[type="email"], input[type="tel"], textarea');
    inputs.forEach(input => {
        input.addEventListener('blur', function() {
            this.value = this.value.trim();
        });
    });
}

/**
 * Check if user is authenticated
 */
export async function isAuthenticated(supabase) {
    const { data: { session } } = await supabase.auth.getSession();
    return session !== null;
}

/**
 * Check if user email is verified
 */
export async function isEmailVerified(supabase) {
    const { data: { user } } = await supabase.auth.getUser();
    return user && user.email_confirmed_at !== null;
}

/**
 * Check if user is admin
 */
export async function isAdmin(supabase, adminUUID) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;
    
    const { data: profile } = await supabase
        .from('profiles')
        .select('is_admin')
        .eq('id', user.id)
        .single();
    
    return profile && profile.is_admin === true && user.id === adminUUID;
}

/**
 * Redirect if not authenticated
 */
export async function requireAuth(supabase, redirectUrl = '/auth/login.html') {
    const authenticated = await isAuthenticated(supabase);
    if (!authenticated) {
        window.location.href = redirectUrl;
        return false;
    }
    return true;
}

/**
 * Redirect if not verified
 */
export async function requireVerification(supabase) {
    const verified = await isEmailVerified(supabase);
    if (!verified) {
        alert('Please verify your email before accessing this page. Check your inbox for the verification link.');
        await supabase.auth.signOut();
        window.location.href = '/auth/login.html';
        return false;
    }
    return true;
}

/**
 * Redirect if not admin
 */
export async function requireAdmin(supabase, adminUUID) {
    const admin = await isAdmin(supabase, adminUUID);
    if (!admin) {
        alert('Access denied. Admin privileges required.');
        window.location.href = '/auth/login.html';
        return false;
    }
    return true;
}
