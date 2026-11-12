/* =========================================
   VIVAFIT PRO — CONEXÃO SUPABASE
   ========================================= */

(function() {
  "use strict";
  
  const SUPABASE_URL =
    "https://izuqzshzbeaftocaydum.supabase.co";
  
  const SUPABASE_PUBLISHABLE_KEY =
    "sb_publishable_0p8LCYjx_4EUfAh6iDWfvw_VLZtJVDd";
  
  if (!window.supabase || !window.supabase.createClient) {
    console.error(
      "VivaFit Pro: biblioteca Supabase não carregada."
    );
    return;
  }
  
  const client = window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_PUBLISHABLE_KEY,
    {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true
      }
    }
  );
  
  window.vivaFitSupabase = client;
  
  console.info(
    "VivaFit Pro: conexão Supabase inicializada."
  );
})();