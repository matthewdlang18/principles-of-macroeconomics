/**
 * Supabase Environment Configuration
 *
 * This file contains the Supabase credentials.
 * It is excluded from Git via .gitignore.
 *
 * In production, these values are replaced by GitHub Actions.
 */

// Replace these with your actual Supabase URL and anon key
// Using the credentials from windsurf-project/supabase.js
export const supabaseUrl = 'https://bvvkevmqnnlecghyraao.supabase.co';
export const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ2dmtldm1xbm5sZWNnaHlyYWFvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ5MDAzNDEsImV4cCI6MjA2MDQ3NjM0MX0.UY_H91jIbbZWq6A-l7XbdyF6s3rSoBVcJfawhZ2CyVg';

// Also make these available as window variables for compatibility
if (typeof window !== 'undefined') {
    window.supabaseUrl = supabaseUrl;
    window.supabaseKey = supabaseKey;

    // Log the credentials for debugging
    console.log('Supabase credentials loaded from Investment Odyssey env.js:');
    console.log('URL:', supabaseUrl);
    console.log('Key:', supabaseKey.substring(0, 10) + '...');
}
