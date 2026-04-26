// Atelier Ākāra - Supabase Configuration
// Replace these values with your actual Supabase credentials

export const supabaseConfig = {
    // Your Supabase project URL
    // Format: https://xxxxxxxxxxxxx.supabase.co
    url: 'YOUR_SUPABASE_PROJECT_URL',
    
    // Your Supabase anon/public key
    // Get from: Project Settings > API > anon public
    anonKey: 'YOUR_SUPABASE_ANON_KEY',
    
    // Your admin UUID (set after first signup)
    // Get from: auth.users table after creating your account
    // Then manually set is_admin = TRUE in profiles table
    adminUUID: 'YOUR_ADMIN_USER_UUID'
};

// Supabase client initialization
export function createSupabaseClient() {
    if (typeof supabase === 'undefined') {
        console.error('Supabase library not loaded. Include: <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>');
        return null;
    }
    
    return supabase.createClient(supabaseConfig.url, supabaseConfig.anonKey);
}

// Export for use in other files
export const ADMIN_UUID = supabaseConfig.adminUUID;
