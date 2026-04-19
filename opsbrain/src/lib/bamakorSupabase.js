import { createClient } from '@supabase/supabase-js';

const bamakorUrl = import.meta.env.VITE_BAMAKOR_URL;
const bamakorKey = import.meta.env.VITE_BAMAKOR_KEY;

if (!bamakorUrl || !bamakorKey) {
  console.info('[OPSBRAIN] Bamakor: set VITE_BAMAKOR_URL and VITE_BAMAKOR_KEY for the property module (separate Supabase project).');
}

/** Separate Supabase project for Bamakor — anon key only in client code. */
export const bamakorSupabase =
  bamakorUrl && bamakorKey ? createClient(bamakorUrl, bamakorKey) : null;

export const isBamakorConfigured = !!(bamakorUrl && bamakorKey);
