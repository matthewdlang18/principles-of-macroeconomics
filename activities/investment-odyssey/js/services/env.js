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
export const supabaseUrl = 'https://cldbphjfuouzxznsnqqi.supabase.co';
export const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNsZGJwaGpmdW91enh6bnNucXFpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAzMTQwMTAsImV4cCI6MjA4NTg5MDAxMH0.xzTLgQG-Dvp0jPhrqdi8meFNf0wztiAfEZ3cmZDwpRE';

// Also make these available as window variables for compatibility
if (typeof window !== 'undefined') {
    window.supabaseUrl = supabaseUrl;
    window.supabaseKey = supabaseKey;

    // Log the credentials for debugging
    console.log('Supabase credentials loaded from Investment Odyssey env.js:');
    console.log('URL:', supabaseUrl);
    console.log('Key:', supabaseKey.substring(0, 10) + '...');
}
