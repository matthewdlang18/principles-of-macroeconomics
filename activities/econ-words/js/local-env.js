/**
 * Local Environment Configuration for Econ Words Game
 * 
 * This file provides the Supabase credentials when the main env.js isn't available
 */

// Use the same credentials as the main env.js
const supabaseUrl = 'https://bvvkevmqnnlecghyraao.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ2dmtldm1xbm5sZWNnaHlyYWFvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ5MDAzNDEsImV4cCI6MjA2MDQ3NjM0MX0.UY_H91jIbbZWq6A-l7XbdyF6s3rSoBVcJfawhZ2CyVg';

// Make these available as window variables
window.supabaseUrl = supabaseUrl;
window.supabaseKey = supabaseKey;

console.log('Local environment loaded for Econ Words game');
