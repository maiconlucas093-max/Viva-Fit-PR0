/* =========================================
   VIVAFIT PRO — CONEXÃO SUPABASE COMPARTILHADA
   ========================================= */

(function() {
  "use strict";
  
  const SUPABASE_URL =
    "https://fwcfuxsvwexpuxozpkuj.supabase.co";
  
  // Copie a chave publishable do arquivo
  // supabase.js do projeto PROSPERA.
  const SUPABASE_PUBLISHABLE_KEY =
    "sb_publishable_Ba1XXaQ7tFaZg7ebr78rYg_uQas1i7D";
  
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
    "VivaFit Pro: conexão compartilhada inicializada."
  );
})();