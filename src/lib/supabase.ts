import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SECRET_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Note: If using SUPABASE_SECRET_KEY, this client should only be used server-side (API routes).
// If using NEXT_PUBLIC_SUPABASE_ANON_KEY, it can be used client-side but requires RLS policies.
export const supabase = createClient(supabaseUrl, supabaseKey);
