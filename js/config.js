// config.js
const SUPABASE_URL = 'https://olxmxsaclthirllmyfhv.supabase.co/rest/v1/'; // Pon tu URL
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9seG14c2FjbHRoaXJsbG15Zmh2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE5ODkwNDQsImV4cCI6MjA5NzU2NTA0NH0.ckqoSCylEC_3CT9rrMwB4AzICr3CwthjZ5pnCiGMJz0';   // Pon tu clave anon


const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);