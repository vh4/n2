import { createBrowserClient } from "@supabase/ssr";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

/**
 * Creates a browser-side Supabase client using @supabase/ssr.
 * Single source of truth for all client-side Supabase operations.
 *
 * @returns {import('@supabase/supabase-js').SupabaseClient}
 */
export const createClient = () => {
  return createBrowserClient(
    supabaseUrl,
    supabaseKey
  );
};
