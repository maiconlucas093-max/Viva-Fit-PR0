/* =========================================
   VIVAFIT PRO — CONEXÃO SUPABASE
   ========================================= */

(function() {
  'use strict';
  
  const SUPABASE_URL =
    'https://shdnejwdoldsgyyavtop.supabase.co';
  
  const SUPABASE_PUBLISHABLE_KEY =
    'sb_publishable_CcYwrZqCgTXFKvcdzuOQ-g_A5ERw_zJ';
  
  if (!window.supabase || !window.supabase.createClient) {
    console.error(
      'VivaFit Pro: biblioteca Supabase não carregada.'
    );
    return;
  }
  
  const client = window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_PUBLISHABLE_KEY
  );
  
  window.vivaFitSupabase = client;
  
  console.info(
    'VivaFit Pro: cliente Supabase inicializado.'
  );
})();