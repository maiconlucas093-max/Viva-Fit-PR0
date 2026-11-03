
/* =========================================
   VIVAFIT PRO — AUTENTICAÇÃO
   Cadastro, login, recuperação e logout
   ========================================= */

(function () {
  "use strict";

  const supabase = window.vivaFitSupabase;

  if (!supabase) {
    console.error("VivaFit Pro: cliente Supabase não encontrado.");
    return;
  }

  const PRIVATE_SELECTORS = [
    ".dashboard-section",
    "#passos",
    "#gps",
    ".report-section",
    "#treinos",
    "#metas",
    "#progresso"
  ];

  let currentSession = null;
  let recoveryMode = false;

  function privateElements() {
    return document.querySelectorAll(PRIVATE_SELECTORS.join(","));
  }

  function setPrivateAccess(isLoggedIn) {
    privateElements().forEach(element => {
      element.hidden = !isLoggedIn;
    });

    document.querySelectorAll(
      'a[data-section="treinos"],' +
      'a[data-section="progresso"],' +
      'a[data-section="gps"],' +
      'a[href="#metas"],' +
      'a[href="#passos"]'
    ).forEach(link => {
      link.hidden = !isLoggedIn;
    });

    const privateNav = document.querySelector(
      '.navigation a[data-section="treinos"]'
    );

    if (!isLoggedIn && privateNav) {
      const currentHash = window.location.hash;

      if (
        currentHash === "#treinos" ||
        currentHash === "#progresso" ||
        currentHash === "#gps" ||
        currentHash === "#metas" ||
        currentHash === "#passos"
      ) {
        history.replaceState(null, "", "#inicio");
        window.dispatchEvent(new HashChangeEvent("hashchange"));
      }
    }

    updateAccountButton();
  }

  function updateAccountButton() {
    const button = document.getElementById("vfAccountButton");
    if (!button) return;

    button.textContent = currentSession
      ? "Minha conta"
      : "Entrar";
  }

  function showMessage(message, isError) {
    const status = document.getElementById("vfAuthStatus");
    if (!status) return;

    status.textContent = message;
    status.style.color = isError ? "#b42318" : "#315b22";
  }

  function createInterface() {
    const header = document.querySelector(".topbar");
    if (!header) return;

    const accountButton = document.createElement("button");
    accountButton.id = "vfAccountButton";
    accountButton.type = "button";
    accountButton.className = "btn btn-primary btn-small";
    accountButton.textContent = "Entrar";
    accountButton.style.marginLeft = "12px";
    header.appendChild(accountButton);

    const style = document.createElement("style");
    style.textContent = `
      #vfAuthOverlay {
        position: fixed;
        inset: 0;
        z-index: 10000;
        display: none;
        align-items: center;
        justify-content: center;
        padding: 20px;
        background: rgba(10, 18, 11, .72);
      }
      #vfAuthOverlay.open { display: flex; }
      #vfAuthPanel {
        width: 100%;
        max-width: 430px;
        max-height: 90vh;
        overflow-y: auto;
        padding: 28px;
        border-radius: 20px;
        background: #fff;
        color: #182019;
        box-shadow: 0 20px 60px rgba(0,0,0,.25);
      }
      #vfAuthPanel h2 { margin: 0 0 8px; }
      #vfAuthPanel p { color: #737b73; }
      #vfAuthPanel label {
        display: block;
        margin: 14px 0 6px;
        font-weight: 600;
      }
      #vfAuthPanel input {
        width: 100%;
        min-height: 46px;
        padding: 10px 12px;
        border: 1px solid #e7ebe4;
        border-radius: 10px;
        font: inherit;
      }
      #vfAuthPanel button { cursor: pointer; }
      #vfAuthPanel .vf-auth-actions {
        display: grid;
        gap: 10px;
        margin-top: 18px;
      }
      #vfAuthPanel .vf-auth-secondary {
        border: 0;
        background: transparent;
        color: #315b22;
        padding: 8px;
        font: inherit;
      }
      #vfAuthClose {
        float: right;
        border: 0;
        background: transparent;
        font-size: 24px;
      }
      #vfAuthStatus {
        min-height: 22px;
        margin-top: 14px;
        font-size: 14px;
      }
      [hidden] { display: none !important; }
    `;
    document.head.appendChild(style);

    const overlay = document.createElement("div");
    overlay.id = "vfAuthOverlay";
    overlay.innerHTML = `
      <div id="vfAuthPanel" role="dialog"
           aria-modal="true" aria-labelledby="vfAuthTitle">
        <button id="vfAuthClose" type="button"
                aria-label="Fechar">×</button>

        <h2 id="vfAuthTitle">Sua conta VivaFit</h2>
        <p id="vfAuthDescription">
          Entre ou crie sua conta para acessar sua área pessoal.
        </p>

        <form id="vfAuthForm">
          <label for="vfAuthEmail">E-mail</label>
          <input id="vfAuthEmail" type="email"
                 autocomplete="email" required>

          <label for="vfAuthPassword">Senha</label>
          <input id="vfAuthPassword" type="password"
                 autocomplete="current-password"
                 minlength="6" required>

          <div class="vf-auth-actions">
            <button class="btn btn-primary full-width"
                    id="vfAuthSubmit" type="submit">
              Entrar
            </button>
          </div>
        </form>

        <div class="vf-auth-actions" id="vfAuthOptions">
          <button class="vf-auth-secondary" id="vfAuthCreate"
                  type="button">Criar minha conta</button>
          <button class="vf-auth-secondary" id="vfAuthForgot"
                  type="button">Esqueci minha senha</button>
        </div>

        <button class="vf-auth-secondary" id="vfAuthBack"
                type="button" hidden>Voltar ao login</button>

        <button class="btn btn-secondary full-width"
                id="vfAuthLogout" type="button" hidden>
          Sair da conta
        </button>

        <p id="vfAuthStatus" role="status" aria-live="polite"></p>
      </div>
    `;

    document.body.appendChild(overlay);

    accountButton.addEventListener("click", openAccount);
    document.getElementById("vfAuthClose")
      .addEventListener("click", closeAccount);

    overlay.addEventListener("click", event => {
      if (event.target === overlay) closeAccount();
    });

    document.getElementById("vfAuthForm")
      .addEventListener("submit", submitForm);

    document.getElementById("vfAuthCreate")
      .addEventListener("click", createAccount);

    document.getElementById("vfAuthForgot")
      .addEventListener("click", forgotPassword);

    document.getElementById("vfAuthBack")
      .addEventListener("click", showLogin);

    document.getElementById("vfAuthLogout")
      .addEventListener("click", logout);

    document.addEventListener("click", event => {
      const link = event.target.closest('a[href^="#"]');
      if (!link || currentSession) return;

      const target = link.getAttribute("href");
      const protectedTargets = [
        "#treinos", "#progresso", "#gps", "#metas", "#passos"
      ];

      if (protectedTargets.includes(target)) {
        event.preventDefault();
        event.stopImmediatePropagation();
        openAccount();
        showMessage("Entre na sua conta para acessar essa área.", false);
      }
    }, true);
  }

  function openAccount() {
    const overlay = document.getElementById("vfAuthOverlay");
    if (!overlay) return;

    overlay.classList.add("open");

    if (currentSession) {
      document.getElementById("vfAuthForm").hidden = true;
      document.getElementById("vfAuthOptions").hidden = true;
      document.getElementById("vfAuthLogout").hidden = false;
      document.getElementById("vfAuthTitle").textContent = "Minha conta";
      document.getElementById("vfAuthDescription").textContent =
        currentSession.user.email;
    } else {
      showLogin();
    }
  }

  function closeAccount() {
    document.getElementById("vfAuthOverlay")
      .classList.remove("open");
  }

  function showLogin() {
    recoveryMode = false;

    document.getElementById("vfAuthTitle").textContent =
      "Sua conta VivaFit";
    document.getElementById("vfAuthDescription").textContent =
      "Entre ou crie sua conta para acessar sua área pessoal.";
    document.getElementById("vfAuthForm").hidden = false;
    document.getElementById("vfAuthOptions").hidden = false;
    document.getElementById("vfAuthLogout").hidden = true;
    document.getElementById("vfAuthBack").hidden = true;
    document.getElementById("vfAuthPassword").hidden = false;
    document.querySelector('label[for="vfAuthPassword"]').hidden = false;
    document.getElementById("vfAuthSubmit").textContent = "Entrar";
    document.getElementById("vfAuthPassword").value = "";
    showMessage("", false);
  }

  async function submitForm(event) {
    event.preventDefault();

    const email = document.getElementById("vfAuthEmail").value.trim();
    const password = document.getElementById("vfAuthPassword").value;
    const submit = document.getElementById("vfAuthSubmit");

    submit.disabled = true;

    try {
      if (recoveryMode) {
        const { error } = await supabase.auth.updateUser({
          password: password
        });

        if (error) throw error;

        showMessage("Senha atualizada. Faça login novamente.", false);
        showLogin();
        return;
      }

      const { error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) throw error;

      showMessage("Login realizado com sucesso.", false);
      closeAccount();
    } catch (error) {
      showMessage(error.message || "Não foi possível concluir.", true);
    } finally {
      submit.disabled = false;
    }
  }

  async function createAccount() {
    const email = document.getElementById("vfAuthEmail").value.trim();
    const password = document.getElementById("vfAuthPassword").value;

    if (!email || !password) {
      showMessage("Informe seu e-mail e uma senha com pelo menos 6 caracteres.", true);
      return;
    }

    const button = document.getElementById("vfAuthCreate");
    button.disabled = true;

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: window.location.origin +
            window.location.pathname
        }
      });

      if (error) throw error;

      if (data.session) {
        showMessage("Conta criada e acesso liberado.", false);
      } else {
        showMessage(
          "Cadastro iniciado. Verifique seu e-mail para confirmar a conta.",
          false
        );
      }
    } catch (error) {
      showMessage(error.message || "Não foi possível criar a conta.", true);
    } finally {
      button.disabled = false;
    }
  }

  async function forgotPassword() {
    const email = document.getElementById("vfAuthEmail").value.trim();

    if (!email) {
      showMessage("Informe seu e-mail primeiro.", true);
      return;
    }

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: window.location.origin + window.location.pathname
      });

      if (error) throw error;

      showMessage(
        "Se o e-mail estiver cadastrado, você receberá as instruções para redefinir a senha.",
        false
      );
    } catch (error) {
      showMessage(error.message || "Não foi possível enviar o e-mail.", true);
    }
  }

  function showRecovery() {
    recoveryMode = true;

    document.getElementById("vfAuthTitle").textContent =
      "Criar nova senha";
    document.getElementById("vfAuthDescription").textContent =
      "Digite sua nova senha.";
    document.getElementById("vfAuthForm").hidden = false;
    document.getElementById("vfAuthOptions").hidden = true;
    document.getElementById("vfAuthLogout").hidden = true;
    document.getElementById("vfAuthBack").hidden = false;
    document.getElementById("vfAuthPassword").hidden = false;
    document.querySelector('label[for="vfAuthPassword"]').hidden = false;
    document.getElementById("vfAuthSubmit").textContent =
      "Salvar nova senha";
    document.getElementById("vfAuthOverlay").classList.add("open");
    showMessage("", false);
  }

  async function logout() {
    const { error } = await supabase.auth.signOut();

    if (error) {
      showMessage(error.message, true);
      return;
    }

    closeAccount();
  }

  function start() {
    createInterface();

    setPrivateAccess(false);

    supabase.auth.onAuthStateChange((event, session) => {
      currentSession = session;

      if (event === "PASSWORD_RECOVERY") {
        showRecovery();
        return;
      }

      setPrivateAccess(Boolean(session));
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start);
  } else {
    start();
  }
})();
