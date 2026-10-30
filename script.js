
"use strict";

/* =========================================================
   VIVAFIT PRO
   Aplicativo fitness com dados locais, blog e loja.
   ========================================================= */

const VF = {
  keys: {
    activities: "vivafit_activities_v1",
    weights: "vivafit_weights_v1",
    goals: "vivafit_goals_v1",
    settings: "vivafit_settings_v1",
    articles: "vivafit_articles_v1",
    cart: "vivafit_cart_v1"
  }
};

const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

function load(key, fallback) {
  try {
    const value = localStorage.getItem(key);
    return value === null ? fallback : JSON.parse(value);
  } catch (error) {
    console.warn("Não foi possível ler os dados locais:", key, error);
    return fallback;
  }
}

function save(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (error) {
    console.error("Não foi possível salvar os dados:", error);
    showToast("Não foi possível salvar. Verifique o espaço disponível no navegador.");
    return false;
  }
}

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

function escapeHTML(value) {
  return String(value ?? "").replace(/[&<>"']/g, char => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  })[char]);
}

function todayISO() {
  const date = new Date();
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function parseLocalDate(iso) {
  const [year, month, day] = String(iso).split("-").map(Number);
  return new Date(year, month - 1, day);
}

function formatDate(iso) {
  if (!iso) return "Data não informada";
  const date = parseLocalDate(iso);
  return Number.isNaN(date.getTime())
    ? "Data inválida"
    : date.toLocaleDateString("pt-BR");
}

function money(value) {
  return Number(value || 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL"
  });
}

function showToast(message) {
  const toast = $("#toast");
  if (!toast) return;
  toast.textContent = message;
  toast.classList.add("show");
  clearTimeout(showToast.timer);
  showToast.timer = setTimeout(() => toast.classList.remove("show"), 2800);
}

function setWidth(selector, percent) {
  const element = $(selector);
  if (element) {
    element.style.width = `${Math.max(0, Math.min(100, percent))}%`;
  }
}

function setText(selector, text) {
  const element = $(selector);
  if (element) element.textContent = text;
}

function percentage(current, target) {
  return target > 0 ? Math.min(100, Math.round(current / target * 100)) : 0;
}

/* ---------- Estado inicial ---------- */

let activities = load(VF.keys.activities, []);
let weights = load(VF.keys.weights, []);
let goals = load(VF.keys.goals, []);
let settings = load(VF.keys.settings, { daily: 3, weekly: 5 });
let articles = load(VF.keys.articles, null);
let cart = load(VF.keys.cart, []);

if (!Array.isArray(activities)) activities = [];
if (!Array.isArray(weights)) weights = [];
if (!Array.isArray(goals)) goals = [];
if (!Array.isArray(cart)) cart = [];

settings = {
  daily: Math.max(1, Math.min(30, Number(settings.daily) || 3)),
  weekly: Math.max(1, Math.min(7, Number(settings.weekly) || 5))
};

/* ---------- Catálogo editável ----------

   Para usar suas fotos, coloque os arquivos na pasta images.
   Exemplo: images/garrafa-esportiva.jpg

   Altere a propriedade image de cada produto abaixo.
   Se a imagem não carregar, o sistema mostra um ícone alternativo.
*/



const PRODUCTS = [
  {
    id: "garrafa-esportiva",
    name: "Garrafa esportiva",
    category: "Hidratação",
    price: 39.90,
    icon: "💧",
    image: "images/garrafa-esportiva.jpg",
    description: "Uma companheira prática para sua rotina de hidratação.",
    keywords: ["hidratação", "água", "garrafa"]
  },
  {
    id: "legging-fitness",
    name: "Legging fitness",
    category: "Roupas fitness",
    price: 79.90,
    icon: "🩳",
    image: "Screenshot_2026-10-28-22-46-26-577_com.mercadolibre.jpg",
    affiliateUrl: "COLE_AQUI_SEU_LINK_DE_AFILIADO",
    description: "Uma peça para sua rotina de exercícios.",
    keywords: ["legging", "roupa", "vestuário"]
  },
  {
    id: "copo-fitness",
    name: "Copo fitness",
    category: "Hidratação",
    price: 24.90,
    icon: "🥤",
    image: "images/copo-fitness.jpg",
    description: "Uma opção prática para acompanhar suas bebidas.",
    keywords: ["copo", "bebida", "hidratação"]
  },
  {
    id: "corda-pular",
    name: "Corda de pular",
    category: "Treino",
    price: 34.90,
    icon: "🪢",
    image: "images/corda-pular.jpg",
    description: "Acessório versátil para exercícios e condicionamento.",
    keywords: ["cardio", "corda", "treino em casa"]
  },
  {
    id: "elastico-resistencia",
    name: "Elástico de resistência",
    category: "Treino",
    price: 29.90,
    icon: "💪",
    image: "images/elastico-resistencia.jpg",
    description: "Um acessório compacto para exercícios de resistência.",
    keywords: ["resistência", "força", "elástico"]
  },
  {
    id: "camiseta-fitness",
    name: "Camiseta fitness",
    category: "Roupas fitness",
    price: 59.90,
    icon: "👕",
    image: "images/camiseta-fitness.jpg",
    description: "Peça esportiva para compor sua roupa de treino.",
    keywords: ["roupa", "camiseta", "vestuário"]
  },
  {
    id: "toalha-esportiva",
    name: "Toalha esportiva",
    category: "Acessórios",
    price: 19.90,
    icon: "🏃",
    image: "images/toalha-esportiva.jpg",
    description: "Um acessório útil para levar à academia.",
    keywords: ["toalha", "academia", "acessórios"]
  },
  {
    id: "bolsa-treino",
    name: "Bolsa de treino",
    category: "Acessórios",
    price: 89.90,
    icon: "🎒",
    image: "images/bolsa-treino.jpg",
    description: "Organize seus acessórios para sair para treinar.",
    keywords: ["bolsa", "academia", "acessórios"]
  }
];


/* ---------- Blog inicial ---------- */

const INITIAL_ARTICLES = [
  {
    id: "blog-inicio-treino",
    title: "Como começar uma rotina de treinos em casa",
    category: "Treinos em casa",
    description: "Descubra como organizar uma rotina realista, respeitar seu ritmo e criar consistência.",
    image: "",
    date: "2026-01-10",
    content: `Começar uma rotina de exercícios não exige transformar toda a sua vida de uma vez.

1. Escolha um horário possível
Procure um período que combine com sua rotina. A regularidade costuma ser mais sustentável quando o plano é realista.

2. Comece de forma gradual
Escolha atividades adequadas à sua experiência e condição física. Se necessário, procure orientação profissional.

3. Organize seu espaço
Um local seguro e confortável ajuda a reduzir obstáculos para começar.

4. Acompanhe sua consistência
Use o VivaFit Pro para registrar as atividades concluídas e observar sua evolução ao longo do tempo.

5. Respeite seus limites
Descanso e recuperação também fazem parte de uma rotina equilibrada.

O objetivo inicial é construir um hábito sustentável, não buscar resultados imediatos a qualquer custo.`
  },
  {
    id: "blog-hidratacao",
    title: "Hidratação: como organizar sua rotina",
    category: "Hábitos saudáveis",
    description: "Ideias simples para lembrar de beber água ao longo do dia e durante as atividades.",
    image: "",
    date: "2026-01-11",
    content: `Manter uma rotina de hidratação é um hábito importante para o bem-estar.

Associe a água a momentos da rotina, como refeições, pausas e atividades físicas. Uma garrafa reutilizável pode facilitar o acesso à água, especialmente fora de casa.

As necessidades variam conforme fatores como clima, atividade e condições individuais. Não existe uma quantidade única ideal para todas as pessoas.

Observe sua rotina e siga orientações profissionais quando houver necessidades específicas.

Para organizar seus acessórios, consulte a categoria de hidratação na loja VivaFit.`
  },
  {
    id: "blog-corda",
    title: "Corda de pular: o que considerar antes de começar",
    category: "Cardio e condicionamento",
    description: "Conheça cuidados básicos, escolha do equipamento e formas de começar gradualmente.",
    image: "",
    date: "2026-01-12",
    content: `Pular corda é uma atividade que pode integrar diferentes rotinas de condicionamento físico, mas não é adequada para todas as pessoas em qualquer circunstância.

Escolha um local com espaço e superfície seguros. Verifique o comprimento da corda e use calçados adequados.

Se você está começando, procure orientação para aprender a técnica e aumente a duração gradualmente, respeitando seus limites.

Pessoas com dores, lesões ou condições de saúde específicas devem buscar orientação profissional antes de iniciar uma nova atividade.

Na loja VivaFit, você pode consultar o acessório relacionado a este conteúdo.`
  },
  {
    id: "blog-resistencia",
    title: "Como conhecer os elásticos de resistência",
    category: "Equipamentos fitness",
    description: "Entenda para que servem os elásticos e o que observar na escolha de um acessório.",
    image: "",
    date: "2026-01-13",
    content: `Elásticos de resistência são acessórios compactos usados em diferentes exercícios.

Antes de escolher um, confira o material, o nível de resistência informado pelo fabricante e as orientações de utilização.

Inspecione o produto antes de cada uso. Não utilize um elástico danificado e evite movimentos que possam fazê-lo escapar em direção ao rosto.

Para selecionar exercícios e níveis de resistência adequados, considere sua experiência e procure orientação qualificada quando necessário.

O equipamento é um complemento; sua escolha deve levar em conta segurança e finalidade de uso.`
  },
  {
    id: "blog-roupa",
    title: "Como escolher roupas confortáveis para treinar",
    category: "Roupas e acessórios",
    description: "Veja aspectos de conforto, mobilidade e cuidados com as peças esportivas.",
    image: "",
    date: "2026-01-14",
    content: `A roupa de treino deve permitir que você se movimente com conforto.

Considere o tipo de atividade, a temperatura, a liberdade de movimento e as instruções de lavagem do fabricante.

Confira a tabela de medidas antes de comprar. O nome do tamanho pode variar entre marcas, então consulte as medidas informadas para cada peça.

Não é necessário comprar um guarda-roupa inteiro para começar. Priorize peças que atendam à sua rotina.

Na loja VivaFit, você pode consultar a categoria de roupas esportivas e verificar as informações de cada produto.`
  },
  {
    id: "blog-consistencia",
    title: "Como construir consistência sem exagerar",
    category: "Motivação e disciplina",
    description: "Estratégias práticas para organizar metas realistas e acompanhar pequenos avanços.",
    image: "",
    date: "2026-01-15",
    content: `A consistência pode ser construída por meio de metas pequenas e compatíveis com sua rotina.

Planeje horários possíveis, registre suas atividades e revise seu plano quando a rotina mudar.

Evite comparar sua evolução com a de outras pessoas. Experiência, disponibilidade e condições individuais são diferentes.

Descansar e ajustar a intensidade também fazem parte de uma rotina sustentável.

Use as metas do VivaFit Pro como ferramenta de organização, e não como motivo para culpa quando precisar adaptar o planejamento.`
  }
];

if (!Array.isArray(articles)) {
  articles = INITIAL_ARTICLES;
  save(VF.keys.articles, articles);
}

/* ---------- Navegação e data ---------- */

function initNavigation() {
  const toggle = $("#menuToggle");
  const nav = $("#navigation");

  toggle.addEventListener("click", () => {
    const open = nav.classList.toggle("open");
    toggle.setAttribute("aria-expanded", String(open));
    toggle.setAttribute("aria-label", open ? "Fechar menu" : "Abrir menu");
  });

  $$(".nav-link").forEach(link => {
    link.addEventListener("click", () => {
      $$(".nav-link").forEach(item => item.classList.remove("active"));
      link.classList.add("active");
      nav.classList.remove("open");
      toggle.setAttribute("aria-expanded", "false");
    });
  });

  $("#todayLabel").textContent = new Date().toLocaleDateString("pt-BR", {
    weekday: "short",
    day: "numeric",
    month: "short"
  });

  $("#footerYear").textContent = new Date().getFullYear();
}

/* ---------- Atividades ---------- */

function todayActivities() {
  return activities.filter(item => item.date === todayISO());
}

function renderActivities() {
  const list = $("#activityList");
  const today = todayActivities();

  list.innerHTML = today.map(item => `
    <div class="activity-item ${item.done ? "is-done" : ""}">
      <input class="activity-check" type="checkbox"
        data-action="toggle-activity" data-id="${escapeHTML(item.id)}"
        ${item.done ? "checked" : ""}
        aria-label="Marcar ${escapeHTML(item.name)} como concluída">
      <div class="activity-details">
        <strong>${escapeHTML(item.name)}</strong>
        <small>${Number(item.minutes)} minutos · ${item.done ? "Concluída" : "Pendente"}</small>
      </div>
      <button class="icon-button" data-action="delete-activity"
        data-id="${escapeHTML(item.id)}" aria-label="Excluir atividade">×</button>
    </div>
  `).join("");

  $("#activityEmpty").hidden = today.length > 0;
}

$("#activityForm").addEventListener("submit", event => {
  event.preventDefault();

  const name = $("#activityName").value.trim();
  const minutes = Number($("#activityMinutes").value);

  if (!name || !Number.isFinite(minutes) || minutes < 1 || minutes > 600) {
    showToast("Informe uma atividade e uma duração válida.");
    return;
  }

  activities.push({
    id: uid(),
    name,
    minutes,
    date: todayISO(),
    done: false,
    createdAt: new Date().toISOString()
  });

  if (!save(VF.keys.activities, activities)) return;

  $("#activityName").value = "";
  $("#activityMinutes").value = "30";
  renderAll();
  showToast("Atividade adicionada!");
});

$("#activityList").addEventListener("change", event => {
  const input = event.target.closest('[data-action="toggle-activity"]');
  if (!input) return;

  const item = activities.find(activity => activity.id === input.dataset.id);
  if (!item) return;

  item.done = input.checked;
  item.completedAt = item.done ? new Date().toISOString() : null;

  save(VF.keys.activities, activities);
  renderAll();
  showToast(item.done ? "Atividade concluída!" : "Atividade reaberta.");
});

$("#activityList").addEventListener("click", event => {
  const button = event.target.closest('[data-action="delete-activity"]');
  if (!button) return;

  if (!confirm("Deseja excluir esta atividade?")) return;

  activities = activities.filter(item => item.id !== button.dataset.id);
  save(VF.keys.activities, activities);
  renderAll();
  showToast("Atividade excluída.");
});

function getActiveDays() {
  return [...new Set(
    activities.filter(item => item.done).map(item => item.date)
  )].sort();
}

function weeklyActiveDays() {
  const now = parseLocalDate(todayISO());
  const day = now.getDay();
  const mondayOffset = (day + 6) % 7;
  const monday = new Date(now);
  monday.setDate(now.getDate() - mondayOffset);

  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);

  const start = `${monday.getFullYear()}-${String(monday.getMonth() + 1).padStart(2, "0")}-${String(monday.getDate()).padStart(2, "0")}`;
  const end = `${sunday.getFullYear()}-${String(sunday.getMonth() + 1).padStart(2, "0")}-${String(sunday.getDate()).padStart(2, "0")}`;

  return getActiveDays().filter(date => date >= start && date <= end).length;
}

function calculateStreak() {
  const active = new Set(getActiveDays());
  let date = parseLocalDate(todayISO());

  // Se hoje ainda não foi registrado, permite contar a sequência iniciada ontem.
  if (!active.has(todayISO())) date.setDate(date.getDate() - 1);

  let streak = 0;
  while (streak < 366) {
    const iso = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
    if (!active.has(iso)) break;
    streak++;
    date.setDate(date.getDate() - 1);
  }

  return streak;
}

function renderDashboard() {
  const today = todayActivities();
  const done = today.filter(item => item.done);
  const minutes = done.reduce((sum, item) => sum + Number(item.minutes || 0), 0);
  const dailyPct = percentage(done.length, settings.daily);
  const weekly = weeklyActiveDays();
  const weeklyPct = percentage(weekly, settings.weekly);
  const streak = calculateStreak();
  const streakPct = percentage(streak, 7);
  const lastWeight = [...weights].sort((a, b) => b.date.localeCompare(a.date))[0];

  setText("#dailyPercent", `${dailyPct}%`);
  setWidth("#dailyBar", dailyPct);
  setText("#dailySummary", `${done.length} de ${settings.daily} atividades concluídas`);

  setText("#weeklyCount", `${weekly}/${settings.weekly}`);
  setWidth("#weeklyBar", weeklyPct);

  setText("#streakCount", `${streak} ${streak === 1 ? "dia" : "dias"}`);
  setWidth("#streakBar", streakPct);

  setText("#heroStreak", `${streak} ${streak === 1 ? "dia" : "dias"}`);
  setText("#heroWorkouts", `${activities.filter(item => item.done).length} treinos`);

  setText("#currentWeight", lastWeight ? `${Number(lastWeight.value).toLocaleString("pt-BR")} ` : "— ");
  const weightElement = $("#currentWeight");
  if (lastWeight) weightElement.innerHTML = `${escapeHTML(Number(lastWeight.value).toLocaleString("pt-BR"))} <small>kg</small>`;
  else weightElement.textContent = "— kg";

  setText("#routinePercent", `${dailyPct}%`);
  $("#routineCircle").style.setProperty("--progress", `${dailyPct}%`);
  setText("#routineDone", done.length);
  setText("#routineMinutes", `${minutes} min`);
  setText("#routineRemaining", Math.max(0, today.length - done.length));

  let message = "Toda jornada começa com um primeiro passo.";
  if (today.length && done.length === today.length) message = "Você concluiu tudo o que planejou para hoje!";
  else if (done.length) message = "Bom trabalho! Continue avançando no seu ritmo.";
  else if (today.length) message = "Você já planejou suas atividades. Vamos começar?";
  setText("#routineMessage", message);

  setText("#goalDailyValue", `${done.length} de ${settings.daily}`);
  setText("#goalDailyPct", `${dailyPct}%`);
  setWidth("#goalDailyBar", dailyPct);

  setText("#goalWeeklyValue", `${weekly} de ${settings.weekly}`);
  setText("#goalWeeklyPct", `${weeklyPct}%`);
  setWidth("#goalWeeklyBar", weeklyPct);

  $("#dailyGoalInput").value = settings.daily;
  $("#weeklyGoalInput").value = settings.weekly;
}

$("#saveDailyGoal").addEventListener("click", () => {
  const value = Number($("#dailyGoalInput").value);
  if (!Number.isInteger(value) || value < 1 || value > 30) {
    showToast("Escolha uma meta diária entre 1 e 30.");
    return;
  }
  settings.daily = value;
  save(VF.keys.settings, settings);
  renderAll();
  showToast("Meta diária atualizada.");
});

$("#saveWeeklyGoal").addEventListener("click", () => {
  const value = Number($("#weeklyGoalInput").value);
  if (!Number.isInteger(value) || value < 1 || value > 7) {
    showToast("Escolha uma meta semanal entre 1 e 7.");
    return;
  }
  settings.weekly = value;
  save(VF.keys.settings, settings);
  renderAll();
  showToast("Meta semanal atualizada.");
});

/* ---------- Objetivos pessoais ---------- */

function renderGoals() {
  const container = $("#personalGoalList");

  container.innerHTML = goals.map(goal => {
    const current = Math.max(0, Number(goal.current) || 0);
    const target = Math.max(1, Number(goal.target) || 1);
    const pct = percentage(current, target);

    return `
      <div class="personal-goal-item">
        <strong>${escapeHTML(goal.name)}</strong>
        <small>${current} de ${target} ${escapeHTML(goal.unit)} · ${pct}%</small>
        <div class="progress-track"><span class="progress-fill green-fill" style="width:${pct}%"></span></div>
        <div class="goal-progress-controls">
          <input type="number" min="0" max="1000000" value="${current}"
            aria-label="Progresso atual de ${escapeHTML(goal.name)}"
            data-goal-value="${escapeHTML(goal.id)}">
          <button class="btn btn-secondary btn-small" data-goal-save="${escapeHTML(goal.id)}">Atualizar</button>
          <button class="icon-button" data-goal-delete="${escapeHTML(goal.id)}" aria-label="Excluir objetivo">×</button>
        </div>
      </div>
    `;
  }).join("");
}

$("#personalGoalForm").addEventListener("submit", event => {
  event.preventDefault();

  const name = $("#personalGoalName").value.trim();
  const target = Number($("#personalGoalTarget").value);
  const unit = $("#personalGoalUnit").value.trim();

  if (!name || !unit || !Number.isFinite(target) || target < 1) {
    showToast("Preencha os dados do objetivo corretamente.");
    return;
  }

  goals.push({ id: uid(), name, target, unit, current: 0 });
  if (!save(VF.keys.goals, goals)) return;

  event.target.reset();
  renderGoals();
  showToast("Objetivo criado!");
});

$("#personalGoalList").addEventListener("click", event => {
  const saveButton = event.target.closest("[data-goal-save]");
  const deleteButton = event.target.closest("[data-goal-delete]");

  if (saveButton) {
    const id = saveButton.dataset.goalSave;
    const input = $(`[data-goal-value="${CSS.escape(id)}"]`);
    const value = Number(input.value);
    const goal = goals.find(item => item.id === id);

    if (!goal || !Number.isFinite(value) || value < 0 || value > 1000000) {
      showToast("Informe um progresso válido.");
      return;
    }

    goal.current = value;
    save(VF.keys.goals, goals);
    renderGoals();
    showToast("Progresso atualizado.");
  }

  if (deleteButton) {
    if (!confirm("Deseja excluir este objetivo?")) return;
    goals = goals.filter(item => item.id !== deleteButton.dataset.goalDelete);
    save(VF.keys.goals, goals);
    renderGoals();
    showToast("Objetivo excluído.");
  }
});

/* ---------- Histórico de peso e gráfico ---------- */

$("#weightDate").value = todayISO();

$("#weightForm").addEventListener("submit", event => {
  event.preventDefault();

  const value = Number($("#weightValue").value);
  const date = $("#weightDate").value;

  if (!Number.isFinite(value) || value < 1 || value > 500 || !date) {
    showToast("Informe um peso entre 1 e 500 kg e uma data válida.");
    return;
  }

  weights.push({
    id: uid(),
    value: Math.round(value * 10) / 10,
    date,
    createdAt: new Date().toISOString()
  });

  if (!save(VF.keys.weights, weights)) return;

  $("#weightValue").value = "";
  renderAll();
  showToast("Registro de peso salvo!");
});

function renderWeights() {
  const sorted = [...weights].sort((a, b) =>
    b.date.localeCompare(a.date) ||
    String(b.createdAt).localeCompare(String(a.createdAt))
  );

  setText("#weightRecords", sorted.length);
  setText("#weightLatest", sorted.length ? `${Number(sorted[0].value).toLocaleString("pt-BR")} kg` : "—");

  $("#weightHistory").innerHTML = sorted.slice(0, 30).map(item => `
    <div class="history-item">
      <span class="history-date">${formatDate(item.date)}</span>
      <strong class="history-value">${Number(item.value).toLocaleString("pt-BR")} kg</strong>
      <button class="icon-button" data-weight-delete="${escapeHTML(item.id)}" aria-label="Excluir registro de peso">×</button>
    </div>
  `).join("");

  $("#weightEmpty").hidden = sorted.length > 0;
  drawWeightChart(sorted);
}

$("#weightHistory").addEventListener("click", event => {
  const button = event.target.closest("[data-weight-delete]");
  if (!button) return;

  if (!confirm("Deseja excluir este registro de peso?")) return;

  weights = weights.filter(item => item.id !== button.dataset.weightDelete);
  save(VF.keys.weights, weights);
  renderAll();
  showToast("Registro excluído.");
});

function drawWeightChart(sortedDescending) {
  const canvas = $("#weightChart");
  const ctx = canvas.getContext("2d");
  const rect = canvas.getBoundingClientRect();
  const width = Math.max(260, rect.width);
  const height = Math.max(200, rect.height);
  const ratio = Math.min(window.devicePixelRatio || 1, 2);

  canvas.width = Math.round(width * ratio);
  canvas.height = Math.round(height * ratio);
  ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
  ctx.clearRect(0, 0, width, height);

  const data = [...sortedDescending]
    .sort((a, b) => a.date.localeCompare(b.date) ||
      String(a.createdAt).localeCompare(String(b.createdAt)))
    .slice(-12);

  if (!data.length) {
    ctx.fillStyle = "#8b9389";
    ctx.font = "13px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("Seus registros aparecerão aqui", width / 2, height / 2);
    setText("#chartNote", "Registre pelo menos dois pesos para comparar sua evolução.");
    return;
  }

  const values = data.map(item => Number(item.value));
  let min = Math.min(...values);
  let max = Math.max(...values);

  if (min === max) {
    min -= 1;
    max += 1;
  } else {
    const pad = (max - min) * .15;
    min -= pad;
    max += pad;
  }

  const left = 43, right = 15, top = 20, bottom = 37;
  const plotW = width - left - right;
  const plotH = height - top - bottom;

  ctx.font = "10px sans-serif";
  ctx.textAlign = "right";
  ctx.textBaseline = "middle";

  for (let i = 0; i <= 4; i++) {
    const y = top + plotH * i / 4;
    const value = max - (max - min) * i / 4;

    ctx.strokeStyle = "rgba(255, 255, 255, .16)";
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 5]);
    ctx.beginPath();
    ctx.moveTo(left, y);
    ctx.lineTo(width - right, y);
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.fillStyle = "#8b9389";
    ctx.fillText(value.toLocaleString("pt-BR", { maximumFractionDigits: 1 }), left - 8, y);
  }

  const points = data.map((item, index) => ({
    x: data.length === 1 ? left + plotW / 2 : left + plotW * index / (data.length - 1),
    y: top + (max - Number(item.value)) / (max - min) * plotH,
    item
  }));

  if (points.length > 1) {
    ctx.beginPath();
    points.forEach((point, index) => {
      if (index === 0) ctx.moveTo(point.x, point.y);
      else ctx.lineTo(point.x, point.y);
    });
    ctx.lineTo(points[points.length - 1].x, top + plotH);
    ctx.lineTo(points[0].x, top + plotH);
    ctx.closePath();
    ctx.fillStyle = "rgba(185, 243, 107, .14)";
    ctx.fill();

    ctx.beginPath();
    points.forEach((point, index) => {
      if (index === 0) ctx.moveTo(point.x, point.y);
      else ctx.lineTo(point.x, point.y);
    });
    ctx.strokeStyle = "#b9f36b";
    ctx.lineWidth = 2.5;
    ctx.lineJoin = "round";
    ctx.stroke();
  }

  points.forEach(point => {
    ctx.beginPath();
    ctx.arc(point.x, point.y, 4, 0, Math.PI * 2);
    ctx.fillStyle = "#b9f36b";
    ctx.fill();
    ctx.strokeStyle = "#0d140b";
    ctx.lineWidth = 2;
    ctx.stroke();
  });

  ctx.fillStyle = "#8b9389";
  ctx.font = "10px sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "top";

  const labelIndices = data.length <= 4
    ? data.map((_, i) => i)
    : [0, Math.floor((data.length - 1) / 2), data.length - 1];

  labelIndices.forEach(index => {
    const point = points[index];
    ctx.fillText(formatDate(point.item.date).slice(0, 5), point.x, top + plotH + 10);
  });

  const first = Number(data[0].value);
  const last = Number(data[data.length - 1].value);
  const difference = Math.round((last - first) * 10) / 10;

  setText("#chartNote", data.length < 2
    ? "Adicione outro registro em uma data diferente para comparar a evolução."
    : `Variação entre o primeiro e o último registro exibidos: ${difference > 0 ? "+" : ""}${difference.toLocaleString("pt-BR")} kg. A variação não indica, por si só, uma melhora ou piora na saúde.`);
}

function renderRecentHistory() {
  const activeDays = getActiveDays().slice(-7).reverse();
  const container = $("#recentHistory");

  if (!activeDays.length) {
    container.innerHTML = '<div class="empty-state">Ainda não há atividades concluídas.</div>';
    return;
  }

  container.innerHTML = activeDays.map(date => {
    const items = activities.filter(item => item.date === date && item.done);
    const minutes = items.reduce((sum, item) => sum + Number(item.minutes || 0), 0);

    return `<div class="recent-row"><span>${formatDate(date)}</span><strong>${items.length} atividades · ${minutes} min</strong></div>`;
  }).join("");
}

/* ---------- Blog e SEO de conteúdo ---------- */

function articleCategories() {
  return [...new Set(articles.map(item => item.category).filter(Boolean))].sort();
}

function renderBlog() {
  const search = ($("#blogSearch").value || "").trim().toLocaleLowerCase("pt-BR");
  const category = $("#blogCategory").value;

  const filtered = [...articles]
    .filter(item => !category || item.category === category)
    .filter(item => `${item.title} ${item.description} ${item.category}`.toLocaleLowerCase("pt-BR").includes(search))
    .sort((a, b) => String(b.date).localeCompare(String(a.date)));

  $("#blogGrid").innerHTML = filtered.map(item => `
    <article class="blog-card">
      <div class="blog-image">
        ${item.image
          ? `<img src="${escapeHTML(item.image)}" alt="${escapeHTML(item.title)}" loading="lazy" data-fallback-icon="📖">`
          : `<span aria-hidden="true">📖</span>`}
      </div>
      <div class="blog-card-body">
        <span class="category-tag">${escapeHTML(item.category)}</span>
        <h3>${escapeHTML(item.title)}</h3>
        <p>${escapeHTML(item.description)}</p>
        <div class="blog-card-footer">
          <span>${formatDate(item.date)}</span>
          <button data-read-article="${escapeHTML(item.id)}">Ler artigo →</button>
        </div>
        ${item.custom ? `<button class="text-link" data-delete-article="${escapeHTML(item.id)}" style="margin-top:12px;text-align:left">Excluir artigo</button>` : ""}
      </div>
    </article>
  `).join("");

  $("#blogEmpty").hidden = filtered.length > 0;
  updateBlogCategories();
  attachImageFallbacks($("#blogGrid"));
}

function updateBlogCategories() {
  const select = $("#blogCategory");
  const current = select.value;
  const categories = articleCategories();

  select.innerHTML = '<option value="">Todas as categorias</option>' +
    categories.map(item => `<option value="${escapeHTML(item)}">${escapeHTML(item)}</option>`).join("");

  if (categories.includes(current)) select.value = current;
}

$("#blogSearch").addEventListener("input", renderBlog);
$("#blogCategory").addEventListener("change", renderBlog);

$("#articleForm").addEventListener("submit", event => {
  event.preventDefault();

  const title = $("#articleTitle").value.trim();
  const category = $("#articleCategory").value.trim();
  const description = $("#articleDescription").value.trim();
  const image = $("#articleImage").value.trim();
  const content = $("#articleContent").value.trim();

  if (!title || !category || !description || !content) {
    showToast("Preencha os campos obrigatórios.");
    return;
  }

  articles.unshift({
    id: uid(),
    title,
    category,
    description,
    image,
    content,
    date: todayISO(),
    custom: true
  });

  if (!save(VF.keys.articles, articles)) return;

  event.target.reset();
  renderBlog();
  showToast("Artigo publicado neste dispositivo!");
});

$("#blogGrid").addEventListener("click", event => {
  const readButton = event.target.closest("[data-read-article]");
  const deleteButton = event.target.closest("[data-delete-article]");

  if (readButton) openArticle(readButton.dataset.readArticle);

  if (deleteButton) {
    if (!confirm("Deseja excluir este artigo?")) return;
    articles = articles.filter(item => item.id !== deleteButton.dataset.deleteArticle);
    save(VF.keys.articles, articles);
    renderBlog();
    showToast("Artigo excluído.");
  }
});

function relatedProduct(article) {
  const text = `${article.title} ${article.category} ${article.description}`.toLocaleLowerCase("pt-BR");

  if (/corda|pular/.test(text)) return PRODUCTS.find(item => item.id === "corda-pular");
  if (/hidrata|água|agua|bebida|copo/.test(text)) {
    return /copo/.test(text)
      ? PRODUCTS.find(item => item.id === "copo-fitness")
      : PRODUCTS.find(item => item.id === "garrafa-esportiva");
  }
  if (/elástico|elastico|resistência|resistencia/.test(text)) return PRODUCTS.find(item => item.id === "elastico-resistencia");
  if (/roupa|vestuário|vestuario|camiseta|legging/.test(text)) return PRODUCTS.find(item => item.id === "camiseta-fitness");
  return null;
}


function openArticle(id) {
  const article = articles.find(item => item.id === id);
  if (!article) return;

  const product = relatedProduct(article);
  const body = $("#modalArticleBody");

  body.innerHTML = `
    <span class="category-tag">${escapeHTML(article.category)}</span>
    <h1 id="modalArticleTitle">${escapeHTML(article.title)}</h1>
    <p class="article-meta">VivaFit Blog · ${formatDate(article.date)}</p>

    ${article.image ? `
      <img class="article-cover"
        src="${escapeHTML(article.image)}"
        alt="${escapeHTML(article.title)}"
        data-fallback-hide="true">
    ` : ""}

    <p><strong>${escapeHTML(article.description)}</strong></p>

    <div class="article-content">
      ${escapeHTML(article.content).replace(/\n/g, "<br>")}
    </div>

    ${product ? `
      <div class="article-product-link">
        <strong>Produto recomendado para você</strong>
        <p>${escapeHTML(product.name)} — ${escapeHTML(product.description)}</p>

        <a class="btn btn-primary"
          href="${escapeHTML(
            product.affiliateUrl &&
            !product.affiliateUrl.includes("COLE_AQUI")
              ? product.affiliateUrl
              : "https://lista.mercadolivre.com.br/" +
                encodeURIComponent(product.name)
          )}"
          target="_blank"
          rel="noopener noreferrer">
          Ver no Mercado Livre
        </a>
      </div>
    ` : ""}
  `;

  $("#articleBackdrop").classList.add("visible");
  document.body.style.overflow = "hidden";
  attachImageFallbacks(body);
}


function closeArticle() {
  $("#articleBackdrop").classList.remove("visible");
  document.body.style.overflow = "";
}

$("#closeArticle").addEventListener("click", closeArticle);
$("#articleBackdrop").addEventListener("click", event => {
  if (event.target === $("#articleBackdrop")) closeArticle();
});

$("#modalArticleBody").addEventListener("click", event => {
  const button = event.target.closest("[data-article-product]");
  if (!button) return;

  const productId = button.dataset.articleProduct;
  closeArticle();
  $("#shopSearch").value = "";
  $("#shopCategory").value = "";
  renderShop();
  document.querySelector("#loja").scrollIntoView({ behavior: "smooth" });
  setTimeout(() => {
    const card = $(`[data-product-card="${CSS.escape(productId)}"]`);
    if (card) card.scrollIntoView({ behavior: "smooth", block: "center" });
  }, 350);
});

document.addEventListener("keydown", event => {
  if (event.key === "Escape") {
    closeArticle();
    closeCart();
    $("#navigation").classList.remove("open");
    $("#menuToggle").setAttribute("aria-expanded", "false");
  }
});

/* ---------- Loja ---------- */

function attachImageFallbacks(root = document) {
  $$("img[data-fallback-icon]", root).forEach(img => {
    img.addEventListener("error", () => {
      const wrapper = img.parentElement;
      if (!wrapper) return;
      const icon = document.createElement("span");
      icon.setAttribute("aria-hidden", "true");
      icon.textContent = img.dataset.fallbackIcon || "🛍️";
      img.replaceWith(icon);
    }, { once: true });
  });

  $$("img[data-fallback-hide]", root).forEach(img => {
    img.addEventListener("error", () => img.remove(), { once: true });
  });
}

function productImage(product, extraClass = "") {
  if (!product.image) {
    return `<div class="shop-product-visual"><span aria-hidden="true">${escapeHTML(product.icon || "🛍️")}</span></div>`;
  }

  return `<div class="shop-product-visual">
    <img class="shop-product-image" src="${escapeHTML(product.image)}"
      alt="${escapeHTML(product.name)}" loading="lazy"
      data-fallback-icon="${escapeHTML(product.icon || "🛍️")}">
  </div>`;
}

function renderShop() {
  const search = ($("#shopSearch").value || "").trim().toLocaleLowerCase("pt-BR");
  const category = $("#shopCategory").value;
  const sort = $("#shopSort").value;

  let filtered = PRODUCTS.filter(product => {
    const matchesCategory = !category || product.category === category;
    const searchable = `${product.name} ${product.description} ${product.category} ${(product.keywords || []).join(" ")}`.toLocaleLowerCase("pt-BR");
    return matchesCategory && searchable.includes(search);
  });

  if (sort === "low") filtered.sort((a, b) => a.price - b.price);
  if (sort === "high") filtered.sort((a, b) => b.price - a.price);
  if (sort === "name") filtered.sort((a, b) => a.name.localeCompare(b.name, "pt-BR"));

  $("#shopProducts").innerHTML = filtered.map(product => `
    <article class="shop-card" data-product-card="${escapeHTML(product.id)}">
      ${productImage(product)}
      <div class="shop-product-body">
        <span class="shop-category-label">${escapeHTML(product.category)}</span>
        <h3>${escapeHTML(product.name)}</h3>
        <p>${escapeHTML(product.description)}</p>
        <div class="shop-product-bottom">
          <strong class="shop-price">${money(product.price)}</strong>
          <button class="shop-add" data-add-cart="${escapeHTML(product.id)}" aria-label="Adicionar ${escapeHTML(product.name)} ao carrinho">+</button>
        </div>
      </div>
    </article>
  `).join("");

  $("#shopEmpty").hidden = filtered.length > 0;
  updateShopCategories();
  attachImageFallbacks($("#shopProducts"));
}

function updateShopCategories() {
  const select = $("#shopCategory");
  const current = select.value;
  const categories = [...new Set(PRODUCTS.map(item => item.category))].sort();

  select.innerHTML = '<option value="">Todas as categorias</option>' +
    categories.map(item => `<option value="${escapeHTML(item)}">${escapeHTML(item)}</option>`).join("");

  if (categories.includes(current)) select.value = current;
}

$("#shopSearch").addEventListener("input", renderShop);
$("#shopCategory").addEventListener("change", renderShop);
$("#shopSort").addEventListener("change", renderShop);

$("#shopProducts").addEventListener("click", event => {
  const button = event.target.closest("[data-add-cart]");
  if (!button) return;
  addToCart(button.dataset.addCart);
});

function addToCart(id) {
  const product = PRODUCTS.find(item => item.id === id);
  if (!product) return;

  const existing = cart.find(item => item.id === id);
  if (existing) existing.quantity = Math.min(99, Number(existing.quantity) + 1);
  else cart.push({ id, quantity: 1 });

  if (!save(VF.keys.cart, cart)) return;

  renderCart();
  showToast(`${product.name} adicionado ao carrinho.`);
}

/* ---------- Carrinho ---------- */

function openCart() {
  $("#cartDrawer").classList.add("open");
  $("#cartBackdrop").classList.add("visible");
  $("#cartDrawer").setAttribute("aria-hidden", "false");
  document.body.style.overflow = "hidden";
  $("#closeCart").focus();
}

function closeCart() {
  $("#cartDrawer").classList.remove("open");
  $("#cartBackdrop").classList.remove("visible");
  $("#cartDrawer").setAttribute("aria-hidden", "true");
  if (!$("#articleBackdrop").classList.contains("visible")) {
    document.body.style.overflow = "";
  }
}

$("#openCart").addEventListener("click", openCart);
$("#closeCart").addEventListener("click", closeCart);
$("#cartBackdrop").addEventListener("click", closeCart);

function cartDetails() {
  return cart.map(entry => {
    const product = PRODUCTS.find(item => item.id === entry.id);
    if (!product) return null;

    return {
      ...product,
      quantity: Math.max(1, Math.min(99, Number(entry.quantity) || 1))
    };
  }).filter(Boolean);
}

function renderCart() {
  const details = cartDetails();
  const count = details.reduce((sum, item) => sum + item.quantity, 0);
  const total = details.reduce((sum, item) => sum + item.price * item.quantity, 0);

  setText("#cartCount", count);
  setText("#cartTotal", money(total));

  $("#cartItems").innerHTML = details.map(item => `
    <div class="cart-item">
      <div class="cart-item-image">
        ${item.image
          ? `<img src="${escapeHTML(item.image)}" alt="${escapeHTML(item.name)}" data-fallback-icon="${escapeHTML(item.icon)}">`
          : `<span aria-hidden="true">${escapeHTML(item.icon)}</span>`}
      </div>
      <div>
        <h4>${escapeHTML(item.name)}</h4>
        <small>${money(item.price)} cada</small>
        <div class="cart-qty">
          <button data-cart-minus="${escapeHTML(item.id)}" aria-label="Diminuir quantidade">−</button>
          <span>${item.quantity}</span>
          <button data-cart-plus="${escapeHTML(item.id)}" aria-label="Aumentar quantidade">+</button>
        </div>
      </div>
      <button class="cart-remove" data-cart-remove="${escapeHTML(item.id)}">Remover</button>
    </div>
  `).join("");

  $("#cartEmpty").hidden = details.length > 0;
  $("#checkoutButton").disabled = details.length === 0;
  attachImageFallbacks($("#cartItems"));
}

$("#cartItems").addEventListener("click", event => {
  const plus = event.target.closest("[data-cart-plus]");
  const minus = event.target.closest("[data-cart-minus]");
  const remove = event.target.closest("[data-cart-remove]");

  if (plus) {
    const item = cart.find(entry => entry.id === plus.dataset.cartPlus);
    if (item) item.quantity = Math.min(99, Number(item.quantity) + 1);
  }

  if (minus) {
    const item = cart.find(entry => entry.id === minus.dataset.cartMinus);
    if (item) {
      item.quantity--;
      if (item.quantity < 1) cart = cart.filter(entry => entry.id !== item.id);
    }
  }

  if (remove) {
    cart = cart.filter(entry => entry.id !== remove.dataset.cartRemove);
  }

  save(VF.keys.cart, cart);
  renderCart();
});

$("#checkoutButton").addEventListener("click", () => {
  const details = cartDetails();
  if (!details.length) {
    showToast("Seu carrinho está vazio.");
    return;
  }

  $("#cartMessage").textContent =
    "Carrinho preparado. Para concluir uma venda real, configure um provedor de pagamento, frete e processamento seguro de pedidos.";

  showToast("O checkout ainda precisa ser integrado.");
});

/* ---------- Newsletter: demonstração sem envio externo ---------- */

$("#newsletterForm").addEventListener("submit", event => {
  event.preventDefault();
  const email = $("#newsletterEmail").value.trim();

  if (!email || !$("#newsletterEmail").checkValidity()) {
    showToast("Informe um e-mail válido.");
    return;
  }

  showToast("Formulário demonstrativo: conecte um serviço de e-mail para receber inscrições.");
});

/* ---------- Atualização geral ---------- */

function renderAll() {
  renderActivities();
  renderDashboard();
  renderGoals();
  renderWeights();
  renderRecentHistory();
  renderBlog();
  renderShop();
  renderCart();
}

function init() {
  initNavigation();
  renderAll();

  // Redesenha o gráfico quando a largura disponível muda.
  let resizeTimer;
  window.addEventListener("resize", () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => drawWeightChart(
      [...weights].sort((a, b) => b.date.localeCompare(a.date))
    ), 120);
  });

  // Atualiza a data exibida se a página ficar aberta durante a virada do dia.
  setInterval(() => {
    const current = todayISO();
    if (init.lastDate !== current) {
      init.lastDate = current;
      $("#todayLabel").textContent = new Date().toLocaleDateString("pt-BR", {
        weekday: "short",
        day: "numeric",
        month: "short"
      });
      renderAll();
    }
  }, 60000);
}

init();

/* ---------- Cronômetro de treino ---------- */
(function initWorkoutTimer() {
  const TIMER_KEY = "vivafit_timer_v1";
  const dial = $("#timerDial");
  if (!dial) return;

  const display = $("#timerDisplay");
  const status = $("#timerStatus");
  const select = $("#timerActivity");
  const minutesInput = $("#timerMinutes");
  const startBtn = $("#timerStart");
  const resetBtn = $("#timerReset");
  const doneBtn = $("#timerDone");

  let totalMs = 0;      // duração total da sessão
  let remainingMs = 0;  // tempo restante (quando pausado/parado)
  let endAt = 0;        // horário final (quando rodando)
  let tick = null;
  let state = "idle";   // idle | running | paused | finished
  let wakeLock = null;

  const fmt = ms => {
    const s = Math.max(0, Math.ceil(ms / 1000));
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    const mm = String(m).padStart(2, "0");
    const ss = String(sec).padStart(2, "0");
    return h > 0 ? `${h}:${mm}:${ss}` : `${mm}:${ss}`;
  };

  const readMinutes = () => {
    const n = Math.round(Number(minutesInput.value));
    return Number.isFinite(n) && n >= 1 && n <= 600 ? n : 0;
  };

  function persist() {
    try {
      if (state === "idle" || state === "finished") localStorage.removeItem(TIMER_KEY);
      else localStorage.setItem(TIMER_KEY, JSON.stringify({
        state, totalMs, remainingMs, endAt, activityId: select.value
      }));
    } catch (e) {}
  }

  function currentRemaining() {
    return state === "running" ? Math.max(0, endAt - Date.now()) : remainingMs;
  }

  function paint() {
    const rem = currentRemaining();
    display.textContent = fmt(state === "idle" ? readMinutes() * 60000 : rem);
    const pct = totalMs > 0 && state !== "idle" ? ((totalMs - rem) / totalMs) * 100 : 0;
    dial.style.setProperty("--progress", `${pct}%`);
    dial.classList.toggle("is-running", state === "running");
    dial.classList.toggle("is-finished", state === "finished");
    status.textContent = { idle: "PRONTO", running: "EM ANDAMENTO", paused: "PAUSADO", finished: "TEMPO ESGOTADO" }[state];
    startBtn.textContent = state === "running" ? "⏸ Pausar" : state === "paused" ? "▶ Continuar" : "▶ Iniciar";
    startBtn.disabled = state === "finished";
    const locked = state === "running" || state === "paused";
    select.disabled = locked;
    minutesInput.disabled = locked;
    $$("#timerPresets button").forEach(b => { b.disabled = locked; });
    document.title = state === "running" ? `${fmt(rem)} · VivaFit Pro` : "VivaFit Pro | Seu treino, sua evolução";
  }

  function beep() {
    try {
      const Ctx = window.AudioContext || window.webkitAudioContext;
      const ctx = new Ctx();
      [0, 0.35, 0.7].forEach(delay => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.frequency.value = 880;
        osc.connect(gain); gain.connect(ctx.destination);
        const t = ctx.currentTime + delay;
        gain.gain.setValueAtTime(0.0001, t);
        gain.gain.exponentialRampToValueAtTime(0.4, t + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.28);
        osc.start(t); osc.stop(t + 0.3);
      });
      setTimeout(() => ctx.close(), 1500);
    } catch (e) {}
    if (navigator.vibrate) navigator.vibrate([300, 150, 300, 150, 300]);
  }

  async function lockScreen() {
    try { if ("wakeLock" in navigator) wakeLock = await navigator.wakeLock.request("screen"); } catch (e) {}
  }
  function unlockScreen() {
    try { if (wakeLock) wakeLock.release(); } catch (e) {}
    wakeLock = null;
  }

  function stopTick() { clearInterval(tick); tick = null; }

  function finish() {
    stopTick();
    state = "finished";
    remainingMs = 0;
    unlockScreen();
    persist();
    paint();
    beep();
    showToast("⏱ Tempo esgotado! Bom trabalho!");
    const item = activities.find(a => a.id === select.value);
    doneBtn.hidden = !(item && !item.done);
  }

  function run() {
    stopTick();
    tick = setInterval(() => {
      if (currentRemaining() <= 0) finish(); else paint();
    }, 250);
    paint();
  }

  function start() {
    if (state === "idle") {
      const m = readMinutes();
      if (!m) { showToast("Informe uma duração entre 1 e 600 minutos."); return; }
      totalMs = m * 60000;
      remainingMs = totalMs;
    }
    endAt = Date.now() + remainingMs;
    state = "running";
    doneBtn.hidden = true;
    lockScreen();
    persist();
    run();
  }

  function pause() {
    remainingMs = Math.max(0, endAt - Date.now());
    state = "paused";
    stopTick();
    unlockScreen();
    persist();
    paint();
  }

  function reset() {
    stopTick();
    state = "idle";
    totalMs = 0; remainingMs = 0; endAt = 0;
    doneBtn.hidden = true;
    unlockScreen();
    persist();
    paint();
  }

  // Lista as atividades de hoje (pendentes) no seletor, sem mexer no resto do app.
  function refreshOptions() {
    const keep = select.value;
    const pending = todayActivities().filter(a => !a.done);
    select.innerHTML = '<option value="">Treino livre</option>' + pending.map(a =>
      `<option value="${escapeHTML(a.id)}">${escapeHTML(a.name)} · ${Number(a.minutes)} min</option>`
    ).join("");
    if (pending.some(a => a.id === keep)) select.value = keep;
    if (state === "idle") paint();
  }

  startBtn.addEventListener("click", () => { state === "running" ? pause() : start(); });
  resetBtn.addEventListener("click", reset);
  minutesInput.addEventListener("input", () => { if (state === "idle") paint(); });

  select.addEventListener("change", () => {
    const item = activities.find(a => a.id === select.value);
    if (item) minutesInput.value = Number(item.minutes);
    paint();
  });

  $("#timerPresets").addEventListener("click", event => {
    const btn = event.target.closest("button[data-min]");
    if (!btn || state === "running" || state === "paused") return;
    minutesInput.value = btn.dataset.min;
    if (state === "finished") reset(); else paint();
  });

  doneBtn.addEventListener("click", () => {
    const item = activities.find(a => a.id === select.value);
    if (!item) return;
    item.done = true;
    item.completedAt = new Date().toISOString();
    save(VF.keys.activities, activities);
    doneBtn.hidden = true;
    renderAll();
    showToast("Atividade concluída!");
  });

  // Atualiza o seletor sempre que a lista de atividades mudar.
  new MutationObserver(refreshOptions).observe($("#activityList"), { childList: true });

  // Ao voltar para a aba (ou desbloquear o celular), recalcula na hora.
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState !== "visible") return;
    if (state === "running") { currentRemaining() <= 0 ? finish() : (lockScreen(), paint()); }
  });

  refreshOptions();

  // Retoma um cronômetro em andamento se a página foi recarregada.
  try {
    const saved = JSON.parse(localStorage.getItem(TIMER_KEY) || "null");
    if (saved && (saved.state === "running" || saved.state === "paused") && saved.totalMs > 0) {
      totalMs = saved.totalMs;
      remainingMs = saved.remainingMs;
      endAt = saved.endAt;
      if (saved.activityId && [...select.options].some(o => o.value === saved.activityId)) select.value = saved.activityId;
      minutesInput.value = Math.round(totalMs / 60000);
      state = saved.state;
      if (state === "running") { currentRemaining() <= 0 ? finish() : (lockScreen(), run()); }
      else paint();
      return;
    }
  } catch (e) {}
  paint();
})();

/* ---------- Barra inferior: destaca a seção que está na tela ---------- */
(function initBottomNav() {
  const links = $$("#bottomNav a");
  if (!links.length || !("IntersectionObserver" in window)) return;

  const setActive = id => links.forEach(a => a.classList.toggle("active", a.dataset.section === id));

  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => { if (entry.isIntersecting) setActive(entry.target.id); });
  }, { rootMargin: "-35% 0px -55% 0px" });

  links.forEach(a => {
    const section = document.getElementById(a.dataset.section);
    if (section) observer.observe(section);
  });
})();

/* ---------- Relatório de treino (gráficos) ---------- */
(function initReport() {
  const chartCanvas = $("#reportChart");
  if (!chartCanvas) return;

  const KCAL_PER_MIN = 7; // estimativa simples
  const COLORS = { workouts: "#ff5a5f", minutes: "#b9f36b", kcal: "#f5b83d" };
  const state = { days: 7, selected: -1, series: null };

  const isoOf = d => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

  function collect(days) {
    const list = [];
    const base = new Date();
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(base.getFullYear(), base.getMonth(), base.getDate() - i);
      const iso = isoOf(d);
      const done = activities.filter(a => a.done && a.date === iso);
      const minutes = done.reduce((sum, a) => sum + (Number(a.minutes) || 0), 0);
      list.push({ iso, date: d, workouts: done.length, minutes, kcal: minutes * KCAL_PER_MIN });
    }
    return list;
  }

  function setupCanvas(canvas) {
    const rect = canvas.getBoundingClientRect();
    const w = Math.max(100, rect.width);
    const h = Math.max(40, rect.height);
    const ratio = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(w * ratio);
    canvas.height = Math.round(h * ratio);
    const ctx = canvas.getContext("2d");
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    ctx.clearRect(0, 0, w, h);
    return { ctx, w, h };
  }

  // Curva suave sem "estourar" abaixo/acima dos pontos.
  function smoothPath(ctx, pts) {
    ctx.moveTo(pts[0].x, pts[0].y);
    for (let i = 1; i < pts.length; i++) {
      const p0 = pts[i - 1], p1 = pts[i];
      const mx = (p0.x + p1.x) / 2;
      ctx.bezierCurveTo(mx, p0.y, mx, p1.y, p1.x, p1.y);
    }
  }

  function fillGradient(ctx, color, top, bottom, alpha) {
    const g = ctx.createLinearGradient(0, top, 0, bottom);
    g.addColorStop(0, color + alpha);
    g.addColorStop(1, color + "00");
    return g;
  }

  /* ----- Minigráficos dos cartões ----- */
  function sparkArea(canvas, values, color) {
    const { ctx, w, h } = setupCanvas(canvas);
    const n = values.length;
    const max = Math.max(...values, 1);
    const top = 6, bottom = h - 4;
    const pts = values.map((v, i) => ({
      x: n === 1 ? w / 2 : 3 + (w - 6) * i / (n - 1),
      y: bottom - (bottom - top) * (v / max)
    }));
    ctx.beginPath();
    smoothPath(ctx, pts);
    ctx.lineTo(pts[n - 1].x, bottom);
    ctx.lineTo(pts[0].x, bottom);
    ctx.closePath();
    ctx.fillStyle = fillGradient(ctx, color, top, bottom, "55");
    ctx.fill();
    ctx.beginPath();
    smoothPath(ctx, pts);
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.lineJoin = "round";
    ctx.stroke();
    const last = pts[n - 1];
    ctx.beginPath();
    ctx.arc(Math.min(last.x, w - 4), last.y, 3.2, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.fill();
  }

  function sparkBars(canvas, values) {
    const { ctx, w, h } = setupCanvas(canvas);
    const n = values.length;
    const max = Math.max(...values, 1);
    const slot = (w - 4) / n;
    const bw = Math.max(2, Math.min(9, slot * 0.62));
    const bottom = h - 3;
    values.forEach((v, i) => {
      const bh = Math.max(v > 0 ? 4 : 2, (h - 10) * (v / max));
      const x = 2 + slot * i + (slot - bw) / 2;
      const g = ctx.createLinearGradient(0, bottom - bh, 0, bottom);
      g.addColorStop(0, i === n - 1 ? "#e6ff9c" : "#b9f36b");
      g.addColorStop(1, v > 0 ? "#6faa1f" : "#2a3a1c");
      ctx.fillStyle = g;
      const r = Math.min(bw / 2, 3);
      ctx.beginPath();
      ctx.moveTo(x, bottom);
      ctx.lineTo(x, bottom - bh + r);
      ctx.quadraticCurveTo(x, bottom - bh, x + r, bottom - bh);
      ctx.lineTo(x + bw - r, bottom - bh);
      ctx.quadraticCurveTo(x + bw, bottom - bh, x + bw, bottom - bh + r);
      ctx.lineTo(x + bw, bottom);
      ctx.closePath();
      ctx.fill();
    });
  }

  /* ----- Gráfico principal ----- */
  function drawMain() {
    const data = state.series;
    const { ctx, w, h } = setupCanvas(chartCanvas);
    const left = 10, right = 10, top = 14, bottom = 30;
    const plotW = w - left - right;
    const plotH = h - top - bottom;
    const n = data.length;
    const xAt = i => (n === 1 ? left + plotW / 2 : left + plotW * i / (n - 1));

    // grade tracejada
    ctx.strokeStyle = "rgba(255, 255, 255, .14)";
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 5]);
    for (let i = 0; i <= 4; i++) {
      const y = top + plotH * i / 4;
      ctx.beginPath();
      ctx.moveTo(left, y);
      ctx.lineTo(w - right, y);
      ctx.stroke();
    }
    ctx.setLineDash([]);

    // rótulos do eixo X
    ctx.fillStyle = "#8a9a83";
    ctx.font = "10px sans-serif";
    ctx.textBaseline = "top";
    const labelIdx = state.days === 7
      ? data.map((_, i) => i)
      : [0, 7, 14, 21, 29].filter(i => i < n);
    labelIdx.forEach(i => {
      const d = data[i].date;
      const text = state.days === 7
        ? d.toLocaleDateString("pt-BR", { weekday: "short" }).replace(".", "")
        : d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
      ctx.textAlign = i === 0 ? "left" : i === n - 1 ? "right" : "center";
      ctx.fillText(text, xAt(i), top + plotH + 9);
    });

    const keys = ["workouts", "minutes", "kcal"];
    const maxes = {};
    keys.forEach(k => { maxes[k] = Math.max(...data.map(d => d[k]), 0); });
    const hasData = keys.some(k => maxes[k] > 0);
    const yOf = (k, v) => top + plotH * (1 - (maxes[k] > 0 ? v / maxes[k] : 0));
    const pointsOf = k => data.map((d, i) => ({ x: xAt(i), y: yOf(k, d[k]) }));

    // áreas (kcal atrás, treinos na frente)
    ["kcal", "minutes", "workouts"].forEach(k => {
      const pts = pointsOf(k);
      ctx.beginPath();
      smoothPath(ctx, pts);
      ctx.lineTo(pts[n - 1].x, top + plotH);
      ctx.lineTo(pts[0].x, top + plotH);
      ctx.closePath();
      ctx.fillStyle = fillGradient(ctx, COLORS[k], top, top + plotH, "40");
      ctx.fill();
    });

    // linhas com brilho
    ["kcal", "minutes", "workouts"].forEach(k => {
      const pts = pointsOf(k);
      ctx.save();
      ctx.beginPath();
      smoothPath(ctx, pts);
      ctx.strokeStyle = COLORS[k];
      ctx.lineWidth = 2.2;
      ctx.lineJoin = "round";
      ctx.shadowColor = COLORS[k];
      ctx.shadowBlur = 8;
      ctx.stroke();
      ctx.restore();
    });

    // pontos de cada dia (só no período de 7 dias) e seleção
    const sel = state.selected;
    if (sel >= 0 && sel < n) {
      const x = xAt(sel);
      ctx.strokeStyle = "rgba(255, 255, 255, .35)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(x, top);
      ctx.lineTo(x, top + plotH);
      ctx.stroke();
      keys.forEach(k => {
        ctx.beginPath();
        ctx.arc(x, yOf(k, data[sel][k]), 4.5, 0, Math.PI * 2);
        ctx.fillStyle = COLORS[k];
        ctx.fill();
        ctx.strokeStyle = "#0d140b";
        ctx.lineWidth = 2;
        ctx.stroke();
      });
    } else if (state.days === 7) {
      keys.forEach(k => pointsOf(k).forEach(p => {
        ctx.beginPath();
        ctx.arc(p.x, p.y, 3, 0, Math.PI * 2);
        ctx.fillStyle = COLORS[k];
        ctx.fill();
      }));
    }

    if (!hasData) {
      ctx.fillStyle = "#8a9a83";
      ctx.font = "13px sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("Marque atividades como concluídas para ver o gráfico", w / 2, top + plotH / 2);
    }
  }

  function readout() {
    const data = state.series;
    const el = $("#reportReadout");
    const totalW = data.reduce((s, d) => s + d.workouts, 0);
    if (!totalW) { el.textContent = "Conclua atividades para ver seu relatório."; return; }
    const d = data[state.selected >= 0 ? state.selected : data.length - 1];
    const label = d.date.toLocaleDateString("pt-BR", { weekday: "short", day: "2-digit", month: "2-digit" }).replace(".", "");
    el.textContent = `${label}: ${d.workouts} ${d.workouts === 1 ? "treino" : "treinos"} · ${d.minutes} min · ≈ ${d.kcal.toLocaleString("pt-BR")} kcal`;
  }

  function render() {
    state.series = collect(state.days);
    if (state.selected >= state.series.length) state.selected = -1;
    const sum = k => state.series.reduce((s, d) => s + d[k], 0);

    setText("#repWorkouts", String(sum("workouts")));
    setText("#repMinutes", `${sum("minutes").toLocaleString("pt-BR")} min`);
    setText("#repKcal", `≈ ${sum("kcal").toLocaleString("pt-BR")}`);

    sparkArea($("#repSparkWorkouts"), state.series.map(d => d.workouts), COLORS.workouts);
    sparkBars($("#repSparkMinutes"), state.series.map(d => d.minutes));
    sparkArea($("#repSparkKcal"), state.series.map(d => d.kcal), COLORS.kcal);

    drawMain();
    readout();
  }

  // Toque / arraste no gráfico para ver o valor de cada dia.
  function pick(event) {
    if (!state.series) return;
    const rect = chartCanvas.getBoundingClientRect();
    const n = state.series.length;
    const left = 10, plotW = rect.width - 20;
    const ratio = Math.min(1, Math.max(0, (event.clientX - rect.left - left) / plotW));
    const idx = Math.round(ratio * (n - 1));
    if (idx !== state.selected) { state.selected = idx; drawMain(); readout(); }
  }
  chartCanvas.addEventListener("pointerdown", pick);
  chartCanvas.addEventListener("pointermove", event => { if (event.buttons || event.pointerType === "touch") pick(event); });

  $$(".report-tab").forEach(btn => btn.addEventListener("click", () => {
    state.days = Number(btn.dataset.days);
    state.selected = -1;
    $$(".report-tab").forEach(b => b.classList.toggle("active", b === btn));
    render();
  }));

  // Atualiza sempre que a lista de atividades mudar.
  new MutationObserver(render).observe($("#activityList"), { childList: true });

  let resizeTimer;
  window.addEventListener("resize", () => { clearTimeout(resizeTimer); resizeTimer = setTimeout(render, 150); });

  render();
})();
