import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://aklskduuuzuvwsgbditu.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFrbHNrZHV1dXp1dndzZ2JkaXR1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg0MTc4NjUsImV4cCI6MjA5Mzk5Mzg2NX0.lxbk-P7u6dqke3U95gNLvjqbGuibr1jWX-Ywvmfw5BI';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
