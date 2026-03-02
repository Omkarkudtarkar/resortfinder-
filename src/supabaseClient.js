import { createClient } from '@supabase/supabase-js';

// Replace with your actual Supabase Project URL and Anon Key
// Found in Project Settings > API
const supabaseUrl = 'https://mukltymgpootebrmqadv.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im11a2x0eW1ncG9vdGVicm1xYWR2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIzNzg0MDgsImV4cCI6MjA4Nzk1NDQwOH0.hM1OOCMKLE8mYExIxxd_30CO4lEOBzWcRMib5ueZnL4';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);