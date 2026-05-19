import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://xhworgztqdsgwhcqsfxh.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inhod29yZ3p0cWRzZ3doY3FzZnhoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkwNjQwNzEsImV4cCI6MjA5NDY0MDA3MX0.cJQVzTqGYnIAGcsRwRgiGWa9zA6yiSPlzT-k7Cak7xs';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export const isSupabaseConfigured = true;
