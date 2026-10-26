const url = import.meta.env.VITE_SUPABASE_URL;
const publishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

// Supabase's official UMD build is loaded before the app in index.html.
const createClient = window.supabase?.createClient;
export const supabase = url && publishableKey && createClient
  ? createClient(url, publishableKey)
  : null;
