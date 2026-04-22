import { createClient } from '@supabase/supabase-js';

const rawUrl = import.meta.env.VITE_SUPABASE_URL;
const rawKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const envUrl = typeof rawUrl === 'string' ? rawUrl.trim() : '';
const envKey = typeof rawKey === 'string' ? rawKey.trim() : '';

/** false בפרוד בלי משתני Vercel — אחרת createClient זורק והאפליקציה לא עולה (מסך שחור). */
export const isSupabaseConfigured = Boolean(envUrl && envKey);

// URL/מפתח תקניים מבחינת הספרייה (לא יקרסו ב-import). כשאין env — לא שומרים session ל-localStorage.
const FALLBACK_URL = 'https://env-not-configured.supabase.co';
const FALLBACK_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0';

if (!isSupabaseConfigured) {
  console.warn(
    '[OPSBRAIN] חסרים VITE_SUPABASE_URL ו/או VITE_SUPABASE_ANON_KEY — הוסף ב-Vercel → Environment Variables (Production) ואז Redeploy.'
  );
}

export const supabase = createClient(
  isSupabaseConfigured ? envUrl : FALLBACK_URL,
  isSupabaseConfigured ? envKey : FALLBACK_KEY,
  {
    auth: {
      persistSession: isSupabaseConfigured,
      autoRefreshToken: isSupabaseConfigured,
      detectSessionInUrl: isSupabaseConfigured,
    },
  }
);

export const uploadFile = async (bucket, path, file) => {
  const { data, error } = await supabase.storage.from(bucket).upload(path, file);
  return { data, error };
};

export const getFileUrl = (bucket, path) => {
  return supabase.storage.from(bucket).getPublicUrl(path).data.publicUrl;
};

/** Bucket פרטי — קישור חתום לזמן קצר */
export const createSignedUrl = async (bucket, path, expiresInSec = 3600) => {
  const { data, error } = await supabase.storage.from(bucket).createSignedUrl(path, expiresInSec);
  return { url: data?.signedUrl ?? null, error };
};
