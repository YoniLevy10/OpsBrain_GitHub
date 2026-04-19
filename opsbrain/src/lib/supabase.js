import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    '[OPSBRAIN] Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY (e.g. in .env.local)'
  );
}

export const supabase = createClient(supabaseUrl ?? '', supabaseAnonKey ?? '', {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});

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
