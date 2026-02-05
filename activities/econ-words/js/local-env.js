/**
 * Local Environment Configuration for Econ Words Game
 * 
 * This file provides the Supabase credentials when the main env.js isn't available
 */

// Use the same credentials as the main env.js
const supabaseUrl = 'https://cldbphjfuouzxznsnqqi.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNsZGJwaGpmdW91enh6bnNucXFpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAzMTQwMTAsImV4cCI6MjA4NTg5MDAxMH0.xzTLgQG-Dvp0jPhrqdi8meFNf0wztiAfEZ3cmZDwpRE';

// Make these available as window variables
window.supabaseUrl = supabaseUrl;
window.supabaseKey = supabaseKey;

console.log('Local environment loaded for Econ Words game');
