// Environment variables for Supabase connection
// This file contains the public Supabase URL and anonymous key

// Supabase configuration
const supabaseUrl = 'https://cldbphjfuouzxznsnqqi.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNsZGJwaGpmdW91enh6bnNucXFpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAzMTQwMTAsImV4cCI6MjA4NTg5MDAxMH0.xzTLgQG-Dvp0jPhrqdi8meFNf0wztiAfEZ3cmZDwpRE';

// Make them available globally
window.supabaseUrl = supabaseUrl;
window.supabaseKey = supabaseKey;

console.log('Environment variables loaded:', {
    supabaseUrl: supabaseUrl,
    supabaseKeyExists: !!supabaseKey
});
