// Environment variables for Supabase connection
// This file contains the public Supabase URL and anonymous key

// Supabase configuration
const supabaseUrl = 'https://bvvkevmqnnlecghyraao.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ2dmtldm1xbm5sZWNnaHlyYWFvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ5MDAzNDEsImV4cCI6MjA2MDQ3NjM0MX0.UY_H91jIbbZWq6A-l7XbdyF6s3rSoBVcJfawhZ2CyVg';

// Make them available globally
window.supabaseUrl = supabaseUrl;
window.supabaseKey = supabaseKey;

console.log('Environment variables loaded:', {
    supabaseUrl: supabaseUrl,
    supabaseKeyExists: !!supabaseKey
});
