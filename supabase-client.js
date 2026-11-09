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
    "COLE_AQUI_A_CHAVE_DO_PROSPERA";
  
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