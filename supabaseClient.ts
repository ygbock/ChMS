import { createClient } from '@supabase/supabase-js';

// NOTE: In a real environment, these are process.env.VITE_SUPABASE_URL and process.env.VITE_SUPABASE_ANON_KEY
const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://bkfwnspvjoeboekpcevq.supabase.co';
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJrZnduc3B2am9lYm9la3BjZXZxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjYwNzMwMzYsImV4cCI6MjA4MTY0OTAzNn0.DeExpGsM9SoV7UNSN5k7gaU4tXm53JxoWxc8lbdI5w0';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);