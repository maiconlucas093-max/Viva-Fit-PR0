
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
    affiliateUrl: "https://meli.la/2kpLNdG",
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
  affiliateUrl: "https://meli.la/1jhD3Hk",
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

const EXERCISES = [
  {
    id: "agachamento",
    name: "Agachamento livre",
    category: "Força",
    muscle: "Pernas e glúteos",
    icon: "🦵",
    image: "https://raw.githubusercontent.com/AlexMollard/Open-Exercise-Art/main/png/bodyweight-squat.png",
    video: "",
    sets: "3 séries",
    reps: "10 a 12 repetições",
    instructions: [
      "Fique em pé com os pés aproximadamente na largura dos ombros.",
      "Flexione os joelhos e leve o quadril para trás.",
      "Desça apenas até onde conseguir manter o controle.",
      "Retorne à posição inicial sem travar os joelhos."
    ],
    precautions: "Mantenha os pés apoiados e evite forçar a amplitude. Comece sem carga."
  },
  {
    id: "flexao",
    name: "Flexão de braços",
    category: "Força",
    muscle: "Peito, ombros e tríceps",
    icon: "💪",
    image: "https://raw.githubusercontent.com/AlexMollard/Open-Exercise-Art/main/png/push-up.png",
    video: "",
    sets: "3 séries",
    reps: "6 a 10 repetições",
    instructions: [
      "Apoie as mãos no chão um pouco além da largura dos ombros.",
      "Mantenha o tronco alinhado.",
      "Flexione os cotovelos e aproxime o peito do chão.",
      "Empurre o chão para retornar."
    ],
    precautions: "Se necessário, faça a versão com os joelhos apoiados. Não force os ombros."
  },
  {
    id: "prancha",
    name: "Prancha abdominal",
    category: "Core",
    muscle: "Abdômen",
    icon: "🧘",
    image: "https://raw.githubusercontent.com/AlexMollard/Open-Exercise-Art/main/png/plank.png",
    video: "",
    sets: "3 séries",
    reps: "15 a 30 segundos",
    instructions: [
      "Apoie os antebraços e as pontas dos pés no chão.",
      "Mantenha o corpo alinhado.",
      "Contraia suavemente o abdômen.",
      "Respire normalmente durante a posição."
    ],
    precautions: "Evite deixar o quadril cair ou subir demais. Interrompa se sentir dor."
  },
  {
    id: "polichinelo",
    name: "Polichinelo",
    category: "Cardio",
    muscle: "Corpo inteiro",
    icon: "🏃",
    image: "https://raw.githubusercontent.com/AlexMollard/Open-Exercise-Art/main/png/jumping-jack.png",
    video: "",
    sets: "3 séries",
    reps: "20 a 30 segundos",
    instructions: [
      "Comece em pé com os braços ao lado do corpo.",
      "Afaste os pés em um salto leve enquanto eleva os braços.",
      "Retorne à posição inicial.",
      "Repita em ritmo confortável."
    ],
    precautions: "Use uma superfície adequada. Se necessário, faça os movimentos sem saltar."
  },
  {
    id: "avanco",
    name: "Avanço alternado",
    category: "Força",
    muscle: "Pernas e glúteos",
    icon: "🦵",
    image: "https://raw.githubusercontent.com/AlexMollard/Open-Exercise-Art/main/png/reverse-lunge.png",
    video: "",
    sets: "3 séries",
    reps: "8 repetições por perna",
    instructions: [
      "Fique em pé com os pés afastados na largura do quadril.",
      "Dê um passo para trás.",
      "Flexione os joelhos de forma controlada.",
      "Empurre o chão e retorne, alternando as pernas."
    ],
    precautions: "Mantenha o equilíbrio e não force os joelhos. Use apoio se precisar."
  },
  {
    id: "ponte-gluteos",
    name: "Ponte de glúteos",
    category: "Força",
    muscle: "Glúteos",
    icon: "🍑",
    image: "https://raw.githubusercontent.com/AlexMollard/Open-Exercise-Art/main/png/glute-bridge.png",
    video: "",
    sets: "3 séries",
    reps: "12 repetições",
    instructions: [
      "Deite de costas com os joelhos flexionados.",
      "Mantenha os pés apoiados no chão.",
      "Eleve o quadril de forma controlada.",
      "Desça lentamente."
    ],
    precautions: "Evite arquear excessivamente a lombar."
  },
  {
    id: "elevacao-panturrilha",
    name: "Elevação de panturrilhas",
    category: "Força",
    muscle: "Panturrilhas",
    icon: "🦶",
    image: "https://raw.githubusercontent.com/AlexMollard/Open-Exercise-Art/main/png/standing-calf-raise.png",
    video: "",
    sets: "3 séries",
    reps: "12 a 15 repetições",
    instructions: [
      "Fique em pé com os pés paralelos.",
      "Eleve os calcanhares lentamente.",
      "Faça uma breve pausa na posição elevada.",
      "Retorne devagar ao chão."
    ],
    precautions: "Use uma parede ou apoio para manter o equilíbrio."
  },
  {
    id: "abdominal-curto",
    name: "Abdominal curto",
    category: "Core",
    muscle: "Abdômen",
    icon: "🧘",
    image: "https://raw.githubusercontent.com/AlexMollard/Open-Exercise-Art/main/png/crunch.png",
    video: "",
    sets: "3 séries",
    reps: "10 a 12 repetições",
    instructions: [
      "Deite de costas com os joelhos flexionados.",
      "Apoie as mãos suavemente junto à cabeça ou sobre o peito.",
      "Eleve um pouco os ombros contraindo o abdômen.",
      "Retorne lentamente."
    ],
    precautions: "Não puxe a cabeça com as mãos nem force o pescoço."
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
    image: "./capa-blog-corda.jpg",
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
    image: "elastico-resistencia-blog.jpg",
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
} else {
  INITIAL_ARTICLES.forEach(initialArticle => {
    const savedArticle = articles.find(
      article => article.id === initialArticle.id
    );
    
    if (savedArticle && initialArticle.image) {
      savedArticle.image = initialArticle.image;
    }
  });
}

save(VF.keys.articles, articles);

/* ---------- Biblioteca de exercícios ---------- */

function initExerciseLibrary() {
  const search = $("#exerciseSearch");
  const category = $("#exerciseCategory");
  const muscle = $("#exerciseMuscle");
  const grid = $("#exerciseLibraryGrid");
  const empty = $("#exerciseLibraryEmpty");
  const detail = $("#exerciseDetail");

  if (!search || !category || !muscle || !grid || !empty || !detail) return;

  const categories = [...new Set(EXERCISES.map(item => item.category))];
  const muscles = [...new Set(EXERCISES.map(item => item.muscle))];

  category.innerHTML =
    '<option value="">Todas as categorias</option>' +
    categories.map(value =>
      `<option value="${escapeHTML(value)}">${escapeHTML(value)}</option>`
    ).join("");

  muscle.innerHTML =
    '<option value="">Todos os grupos musculares</option>' +
    muscles.map(value =>
      `<option value="${escapeHTML(value)}">${escapeHTML(value)}</option>`
    ).join("");

  function render() {
    const term = search.value.trim().toLowerCase();

    const filtered = EXERCISES.filter(item => {
      const matchesName = item.name.toLowerCase().includes(term);
      const matchesCategory = !category.value || item.category === category.value;
      const matchesMuscle = !muscle.value || item.muscle === muscle.value;

      return matchesName && matchesCategory && matchesMuscle;
    });

    
grid.innerHTML = filtered.map(item => `
  <article class="shop-card exercise-card">
    <div class="shop-product-visual exercise-visual">
      <img
        src="${escapeHTML(item.image)}"
        alt="Ilustração de ${escapeHTML(item.name)}"
        loading="lazy"
        onerror="this.hidden=true"
      >
    </div>
    <div class="shop-product-body">
      <span class="shop-category-label">${escapeHTML(item.category)}</span>
      <h3>${escapeHTML(item.name)}</h3>
      <p>${escapeHTML(item.muscle)}</p>
      <button class="btn btn-primary" type="button"
        data-exercise-detail="${escapeHTML(item.id)}">
        Ver exercício
      </button>
    </div>
  </article>
`).join("") + `
  <p class="exercise-art-credit">
    Ilustrações: Open Exercise Art / Alex Mollard.
    <a href="https://creativecommons.org/licenses/by-sa/4.0/"
       target="_blank" rel="noopener noreferrer">
      Licença CC BY-SA 4.0
    </a>.
  </p>
`;


    empty.hidden = filtered.length > 0;
  }

  function showDetail(item) {
    if (!item) return;

    detail.hidden = false;
    detail.innerHTML = `
      <div class="panel-heading">
        <div>
          <span class="eyebrow">${escapeHTML(item.category)}</span>
          <h3>${escapeHTML(item.name)}</h3>
          <p>${escapeHTML(item.muscle)}</p>
        </div>
      </div>

      <h4>Como executar</h4>
      <ol>
        ${item.instructions.map(step => `<li>${escapeHTML(step)}</li>`).join("")}
      </ol>

      <h4>Sugestão inicial</h4>
      <p>${escapeHTML(item.sets)} · ${escapeHTML(item.reps)}</p>

      <h4>Cuidados</h4>
      <p>${escapeHTML(item.precautions)}</p>

      <label for="exerciseMinutes">Duração do treino (minutos)</label>
      <input id="exerciseMinutes" type="number" min="1" max="600" value="15">

      <button class="btn btn-primary" type="button"
        data-add-exercise="${escapeHTML(item.id)}">
        Adicionar ao treino de hoje
      </button>

      <button class="btn btn-secondary" type="button" id="closeExerciseDetail">
        Fechar detalhes
      </button>
    `;

    detail.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  search.addEventListener("input", render);
  category.addEventListener("change", render);
  muscle.addEventListener("change", render);

  grid.addEventListener("click", event => {
    const button = event.target.closest("[data-exercise-detail]");
    if (!button) return;

    const item = EXERCISES.find(exercise =>
      exercise.id === button.dataset.exerciseDetail
    );

    showDetail(item);
  });

  detail.addEventListener("click", event => {
    if (event.target.closest("#closeExerciseDetail")) {
      detail.hidden = true;
      return;
    }

    const button = event.target.closest("[data-add-exercise]");
    if (!button) return;

    const item = EXERCISES.find(exercise =>
      exercise.id === button.dataset.addExercise
    );

    const minutes = Number($("#exerciseMinutes").value);

    if (!item || !Number.isInteger(minutes) || minutes < 1 || minutes > 600) {
      showToast("Informe uma duração entre 1 e 600 minutos.");
      return;
    }

    const activity = {
      id: uid(),
      name: item.name,
      minutes,
      date: todayISO(),
      done: false,
      createdAt: new Date().toISOString()
    };

    activities.push(activity);

    if (!save(VF.keys.activities, activities)) {
      activities = activities.filter(entry => entry.id !== activity.id);
      return;
    }

    saveFitnessActivity(activity);
    renderAll();
    showToast("Exercício adicionado ao treino de hoje!");
  });

  render();
}

/* ---------- Navegação e data ---------- */

function initNavigation() {
  const toggle = $("#menuToggle");
  const nav = $("#navigation");
  
      
  
      const homeView = document.getElementById("homeView");
  const contentView = document.getElementById("contentView");
  const featuresHubView = document.getElementById("featuresHubView");
  const weeklyEvolutionView = document.getElementById("weeklyEvolutionView");
  const achievementsView = document.getElementById("achievementsView");
  const calendarView = document.getElementById("calendarView");
  const walkingEvolutionView = document.getElementById("walkingEvolutionView");
  const hydrationView = document.getElementById("hydrationView");
  const weightEvolutionView = document.getElementById("weightEvolutionView");
  const remindersView = document.getElementById("remindersView");
  const exerciseLibraryView = document.getElementById("exerciseLibraryView");
  function updateAppViews(hash = window.location.hash) {
    const showContent = hash === "#blog" || hash === "#loja";
    const showFeatures = hash === "#funcoes";
    const showWeeklyEvolution = hash === "#evolucao-semanal";
    const showAchievements = hash === "#conquistas";
    const showCalendar = hash === "#calendario";
    const showWalkingEvolution = hash === "#evolucao-caminhadas";
    const showHydration = hash === "#hidratacao";
    const showWeightEvolution = hash === "#evolucao-peso";
    const showReminders = hash === "#lembretes";
    const showExerciseLibrary = hash === "#biblioteca-exercicios";
    if (homeView) homeView.hidden = showContent || showFeatures || showWeeklyEvolution || showAchievements || showCalendar || showWalkingEvolution || showHydration || showWeightEvolution || showReminders || showExerciseLibrary;
    if (contentView) contentView.hidden = !showContent;
    if (featuresHubView) featuresHubView.hidden = !showFeatures;
    if (weeklyEvolutionView) weeklyEvolutionView.hidden = !showWeeklyEvolution;
    if (achievementsView) achievementsView.hidden = !showAchievements;
    if (calendarView) calendarView.hidden = !showCalendar;
    if (walkingEvolutionView) walkingEvolutionView.hidden = !showWalkingEvolution;
    if (hydrationView) hydrationView.hidden = !showHydration;
    if (weightEvolutionView) weightEvolutionView.hidden = !showWeightEvolution;
    if (remindersView) remindersView.hidden = !showReminders;
    if (exerciseLibraryView) exerciseLibraryView.hidden = !showExerciseLibrary;
        if (showWeightEvolution) {
      requestAnimationFrame(renderWeightEvolution);
    }
  }
  document.querySelectorAll('a[href^="#"]').forEach(link => {
    link.addEventListener("click", () => {
      updateAppViews(link.getAttribute("href"));
    });
  });

  window.addEventListener("hashchange", () => {
    updateAppViews();
  });

  updateAppViews();


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

/* ---------- Sincronização de atividades com a PROSPERA ---------- */

let fitnessUserId = null;
let fitnessSyncVersion = 0;

async function saveFitnessActivity(item) {
  if (!fitnessUserId || !window.vivaFitSupabase) return;

  const record = {
    user_id: fitnessUserId,
    external_id: String(item.id),
    activity_name: item.name,
    duration_minutes: Number(item.minutes),
    activity_date: item.date,
    completed: Boolean(item.done),
    completed_at: item.completedAt || null,
    source_app: "Viva-Fit-PRO"
  };

  const { error } = await window.vivaFitSupabase
    .from("fitness_activities")
    .upsert(record, { onConflict: "user_id,external_id" });

  if (error) {
    console.error("Erro ao sincronizar atividade:", error);
    showToast("Atividade salva no aparelho, mas não foi sincronizada.");
  }
}

async function deleteFitnessActivity(activityId) {
  if (!fitnessUserId || !window.vivaFitSupabase) return;

  const { error } = await window.vivaFitSupabase
    .from("fitness_activities")
    .delete()
    .eq("user_id", fitnessUserId)
    .eq("external_id", String(activityId));

  if (error) {
    console.error("Erro ao excluir atividade na nuvem:", error);
    showToast("Não foi possível excluir a atividade da nuvem.");
  }
}

async function loadFitnessActivities(session) {
  const version = ++fitnessSyncVersion;

  if (!session) {
    fitnessUserId = null;
    return;
  }

  const userId = session.user.id;
  fitnessUserId = userId;

  const { data, error } = await window.vivaFitSupabase
    .from("fitness_activities")
    .select("*")
    .eq("user_id", userId)
    .order("activity_date", { ascending: false });

  if (version !== fitnessSyncVersion) return;

  if (error) {
    console.error("Erro ao carregar atividades da nuvem:", error);
    showToast("Não foi possível carregar as atividades da nuvem.");
    return;
  }

  const cloudActivities = (data || []).map(item => ({
    id: item.external_id,
    name: item.activity_name,
    minutes: item.duration_minutes,
    date: item.activity_date,
    done: item.completed,
    completedAt: item.completed_at,
    createdAt: item.created_at
  }));

  const cloudIds = new Set(cloudActivities.map(item => String(item.id)));

  // Preserva atividades locais que ainda não existem na nuvem.
  const localOnly = activities.filter(
    item => !cloudIds.has(String(item.id))
  );

  if (localOnly.length) {
    const records = localOnly.map(item => ({
      user_id: userId,
      external_id: String(item.id),
      activity_name: item.name,
      duration_minutes: Number(item.minutes),
      activity_date: item.date,
      completed: Boolean(item.done),
      completed_at: item.completedAt || null,
      source_app: "Viva-Fit-PRO"
    }));

    const { error: uploadError } = await window.vivaFitSupabase
      .from("fitness_activities")
      .upsert(records, { onConflict: "user_id,external_id" });

    if (version !== fitnessSyncVersion) return;

    if (uploadError) {
      console.error("Erro ao enviar atividades locais:", uploadError);
      showToast("Algumas atividades locais ainda não foram sincronizadas.");
    }
  }

  if (version !== fitnessSyncVersion) return;

  // A nuvem prevalece quando a atividade já existe nos dois lugares.
  activities = [...cloudActivities, ...localOnly];

  save(VF.keys.activities, activities);
  renderAll();
}

async function initializeFitnessSync() {
  const client = window.vivaFitSupabase;

  if (!client) {
    console.error("Cliente Supabase do VivaFit não encontrado.");
    return;
  }

  client.auth.onAuthStateChange((_event, session) => {
    // Executa fora do callback de autenticação.
    setTimeout(() => {
      loadFitnessActivities(session);
    }, 0);
  });

  const { data, error } = await client.auth.getSession();

  if (error) {
    console.error("Erro ao verificar sessão:", error);
    return;
  }

  await loadFitnessActivities(data.session);
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
saveFitnessActivity(activities[activities.length - 1]);
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
  saveFitnessActivity(item);
  renderAll();
  showToast(item.done ? "Atividade concluída!" : "Atividade reaberta.");
});

$("#activityList").addEventListener("click", event => {
  const button = event.target.closest('[data-action="delete-activity"]');
  if (!button) return;

  if (!confirm("Deseja excluir esta atividade?")) return;

    activities = activities.filter(item => item.id !== button.dataset.id);
  save(VF.keys.activities, activities);
  deleteFitnessActivity(button.dataset.id);
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
function renderWeightEvolution() {
  const sorted = [...weights].sort((a, b) =>
    a.date.localeCompare(b.date) ||
    String(a.createdAt).localeCompare(String(b.createdAt))
  );
  
  const latest = sorted[sorted.length - 1];
  
  setText(
    "#weightEvolutionLatest",
    latest ? `${Number(latest.value).toLocaleString("pt-BR")} kg` : "—"
  );
  
  setText("#weightEvolutionCount", sorted.length);
  
  let changeText = "Aguardando registros";
  
  if (sorted.length >= 2) {
    const firstWeight = Number(sorted[0].value);
    const lastWeight = Number(latest.value);
    const change = lastWeight - firstWeight;
    
    changeText = `${change > 0 ? "+" : ""}${change.toLocaleString("pt-BR", {
      minimumFractionDigits: 1,
      maximumFractionDigits: 1
    })} kg`;
  }
  
  setText("#weightEvolutionChange", changeText);
  
  const history = $("#weightEvolutionHistory");
  
  if (history) {
    history.innerHTML = sorted.slice().reverse().slice(0, 30).map(item => `
      <div class="history-item">
        <span class="history-date">${formatDate(item.date)}</span>
        <strong class="history-value">${Number(item.value).toLocaleString("pt-BR")} kg</strong>
      </div>
    `).join("");
  }
  
  const canvas = $("#weightEvolutionChart");
  
  if (!canvas) return;
  
  const ctx = canvas.getContext("2d");
  const rect = canvas.getBoundingClientRect();
  const width = Math.max(260, rect.width);
  const height = Math.max(200, rect.height);
  const ratio = Math.min(window.devicePixelRatio || 1, 2);
  
  canvas.width = Math.round(width * ratio);
  canvas.height = Math.round(height * ratio);
  
  ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
  ctx.clearRect(0, 0, width, height);
  
  const data = sorted.slice(-12);
  
  if (!data.length) {
    ctx.fillStyle = "#8b9389";
    ctx.font = "13px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("Seus registros aparecerão aqui", width / 2, height / 2);
    setText("#weightEvolutionNote", "Registre seu peso para acompanhar sua evolução.");
    return;
  }
  
  const values = data.map(item => Number(item.value));
  let min = Math.min(...values);
  let max = Math.max(...values);
  
  if (min === max) {
    min -= 1;
    max += 1;
  } else {
    const padding = (max - min) * 0.15;
    min -= padding;
    max += padding;
  }
  
  const left = 43;
  const right = 15;
  const top = 20;
  const bottom = 37;
  const plotW = width - left - right;
  const plotH = height - top - bottom;
  
  ctx.font = "10px sans-serif";
  ctx.textAlign = "right";
  ctx.textBaseline = "middle";
  ctx.fillStyle = "#8b9389";
  
  for (let i = 0; i <= 4; i++) {
    const value = max - ((max - min) / 4) * i;
    const y = top + (plotH / 4) * i;
    
    ctx.fillText(value.toFixed(1), left - 8, y);
    
    ctx.strokeStyle = "rgba(139, 147, 137, 0.2)";
    ctx.beginPath();
    ctx.moveTo(left, y);
    ctx.lineTo(width - right, y);
    ctx.stroke();
  }
  
  const points = data.map((item, index) => ({
    x: data.length === 1 ?
      left + plotW / 2 :
      left + (plotW / (data.length - 1)) * index,
    y: top + ((max - Number(item.value)) / (max - min)) * plotH
  }));
  
  if (points.length > 1) {
    ctx.beginPath();
    ctx.strokeStyle = "#35a66f";
    ctx.lineWidth = 2.5;
    ctx.lineJoin = "round";
    
    points.forEach((point, index) => {
      if (index === 0) ctx.moveTo(point.x, point.y);
      else ctx.lineTo(point.x, point.y);
    });
    
    ctx.stroke();
  }
  
  points.forEach(point => {
    ctx.beginPath();
    ctx.fillStyle = "#35a66f";
    ctx.arc(point.x, point.y, 4, 0, Math.PI * 2);
    ctx.fill();
  });
  
  ctx.textAlign = "center";
  ctx.textBaseline = "top";
  ctx.fillStyle = "#8b9389";
  
  data.forEach((item, index) => {
    if (data.length > 6 && index % 2 !== 0) return;
    
    const x = points[index].x;
    const date = item.date.split("-").reverse().slice(0, 2).join("/");
    
    ctx.fillText(date, x, height - bottom + 12);
  });
  
  setText(
    "#weightEvolutionNote",
    data.length < 2 ?
    "Adicione mais um registro para comparar sua evolução." :
    `Exibindo os últimos ${data.length} registros. A variação compara o primeiro e o último peso registrados.`
  );
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

if (readButton) {
    const articleId = readButton.dataset.readArticle;

    if (articleId === "blog-inicio-treino") {
      window.location.href = "blog-como-comecar-treinos-em-casa.html";
    } else if (articleId === "blog-hidratacao") {
      window.location.href = "blog-rotina-de-hidratacao.html";
    } else if (articleId === "blog-corda") {
      window.location.href = "blog-corda-de-pular.html";
    } else if (articleId === "blog-resistencia") {
      window.location.href = "blog-elasticos-de-resistencia.html";
    } else if (articleId === "blog-roupa") {
      window.location.href = "blog-roupas-confortaveis-para-treinar.html";
    } else if (articleId === "blog-consistencia") {
      window.location.href = "blog-como-construir-consistencia.html";
    } else {
      openArticle(articleId);
    }
}

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

  if (/corda|pular/.test(text)) {
    return PRODUCTS.find(item => item.id === "corda-pular");
  }

  if (/hidrata|água|agua|bebida|copo/.test(text)) {
    return /copo/.test(text)
      ? PRODUCTS.find(item => item.id === "copo-fitness")
      : PRODUCTS.find(item => item.id === "garrafa-esportiva");
  }

  if (/elástico|elastico|resistência|resistencia/.test(text)) {
    return PRODUCTS.find(item => item.id === "elastico-resistencia");
  }

  if (/legging/.test(text)) {
    return PRODUCTS.find(item => item.id === "legging-fitness");
  }

  if (/roupa|vestuário|vestuario|camiseta/.test(text)) {
    return PRODUCTS.find(item => item.id === "camiseta-fitness");
  }

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
rel="noopener noreferrer sponsored nofollow">
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

function renderWeeklyFeature() {
  const today = parseLocalDate(todayISO());
  const monday = new Date(today);
  monday.setDate(today.getDate() - ((today.getDay() + 6) % 7));

  const days = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"];
  const weekActivities = [];

  for (let i = 0; i < 7; i++) {
    const date = new Date(monday);
    date.setDate(monday.getDate() + i);

    const iso = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;

    const completed = activities.filter(item =>
      item.done && item.date === iso
    );

    weekActivities.push({
      label: days[i],
      date: iso,
      count: completed.length,
      minutes: completed.reduce(
        (sum, item) => sum + Number(item.minutes || 0),
        0
      )
    });
  }

  const completedTotal = weekActivities.reduce(
    (sum, day) => sum + day.count, 0
  );

  const activeDays = weekActivities.filter(
    day => day.count > 0
  ).length;

  const totalMinutes = weekActivities.reduce(
    (sum, day) => sum + day.minutes, 0
  );

  setText("#weeklyFeatureActiveDays", `${activeDays}/7`);
  setText("#weeklyFeatureCompleted", completedTotal);
  setText("#weeklyFeatureMinutes", `${totalMinutes} min`);
  setText("#weeklyFeatureGoal", `${completedTotal} de ${settings.weekly} atividades`);

  setWidth(
    "#weeklyFeatureGoalBar",
    percentage(completedTotal, settings.weekly)
  );

  const chart = $("#weeklyFeatureChart");
  const empty = $("#weeklyFeatureEmpty");

  if (!chart || !empty) return;

  empty.hidden = completedTotal > 0;
  chart.innerHTML = "";

  if (completedTotal === 0) return;

  const maxCount = Math.max(
    1,
    ...weekActivities.map(day => day.count)
  );

  chart.innerHTML = weekActivities.map(day => {
    const height = day.count
      ? Math.max(8, day.count / maxCount * 100)
      : 0;

    return `
      <div class="weekly-feature-day">
        <span class="weekly-feature-count">${day.count}</span>
        <div class="weekly-feature-bar">
          <span class="weekly-feature-bar-fill"
            style="height: ${height}%"></span>
        </div>
        <span class="weekly-feature-label">${day.label}</span>
      </div>
    `;
  }).join("");
}

function renderAchievements() {
  const completed = activities.filter(item => item.done);
  const activeDays = getActiveDays();
  const streak = calculateStreak();

  const medals = [
    {
      icon: "🌱",
      name: "Primeiro passo",
      description: "Conclua sua primeira atividade.",
      unlocked: completed.length >= 1,
      progress: completed.length,
      target: 1
    },
    {
      icon: "🥉",
      name: "Ritmo crescente",
      description: "Conclua 5 atividades.",
      unlocked: completed.length >= 5,
      progress: completed.length,
      target: 5
    },
    {
      icon: "🥈",
      name: "Determinação",
      description: "Conclua 10 atividades.",
      unlocked: completed.length >= 10,
      progress: completed.length,
      target: 10
    },
    {
      icon: "🥇",
      name: "Foco total",
      description: "Conclua 25 atividades.",
      unlocked: completed.length >= 25,
      progress: completed.length,
      target: 25
    },
    {
      icon: "🏆",
      name: "Lenda VivaFit",
      description: "Conclua 50 atividades.",
      unlocked: completed.length >= 50,
      progress: completed.length,
      target: 50
    },
    {
      icon: "🔥",
      name: "Em sequência",
      description: "Mantenha 3 dias seguidos de atividade.",
      unlocked: streak >= 3,
      progress: streak,
      target: 3
    },
    {
      icon: "⚡",
      name: "Semana poderosa",
      description: "Mantenha 7 dias seguidos de atividade.",
      unlocked: streak >= 7,
      progress: streak,
      target: 7
    },
    {
      icon: "📅",
      name: "Sempre presente",
      description: "Atinja 7 dias diferentes de atividade.",
      unlocked: activeDays.length >= 7,
      progress: activeDays.length,
      target: 7
    }
  ];

  const unlocked = medals.filter(medal => medal.unlocked).length;

  setText("#achievementUnlockedCount", unlocked);
  setText("#achievementTotalCount", medals.length);
  setText("#achievementActivityCount", completed.length);

  const grid = $("#achievementsGrid");
  if (!grid) return;

  grid.innerHTML = medals.map(medal => `
    <article class="achievement-card ${medal.unlocked ? "is-unlocked" : "is-locked"}">
      <div class="achievement-icon">${medal.icon}</div>
      <div class="achievement-info">
        <h3>${medal.name}</h3>
        <p>${medal.description}</p>
        <small>${medal.unlocked ? "Conquistada" : `${Math.min(medal.progress, medal.target)} de ${medal.target}`}</small>
      </div>
      <span class="achievement-status">${medal.unlocked ? "✓" : "🔒"}</span>
    </article>
  `).join("");
}

/* ---------- Calendário de treinos ---------- */

let calendarCurrentDate = new Date();
let calendarSelectedISO = todayISO();

function calendarISO(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function renderCalendar() {
  const grid = $("#calendarGrid");
  if (!grid) return;
  
  const year = calendarCurrentDate.getFullYear();
  const month = calendarCurrentDate.getMonth();
  
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const startOffset = (firstDay.getDay() + 6) % 7;
  
  const monthActivities = activities.filter(item => {
    const date = parseLocalDate(item.date);
    return date.getFullYear() === year && date.getMonth() === month;
  });
  
  const activeDates = new Set(monthActivities.map(item => item.date));
  const completedDates = new Set(
    monthActivities.filter(item => item.done).map(item => item.date)
  );
  
  setText("#calendarActiveDays", activeDates.size);
  setText("#calendarActivityCount", monthActivities.length);
  setText("#calendarCompletedCount", monthActivities.filter(item => item.done).length);
  
  setText("#calendarMonthLabel", calendarCurrentDate.toLocaleDateString("pt-BR", {
    month: "long",
    year: "numeric"
  }));
  
  const cells = [];
  
  for (let i = 0; i < startOffset; i++) {
    cells.push('<div class="calendar-day is-outside"></div>');
  }
  
  for (let day = 1; day <= lastDay.getDate(); day++) {
    const date = new Date(year, month, day);
    const iso = calendarISO(date);
    const classes = ["calendar-day"];
    
    if (activeDates.has(iso)) classes.push("has-activity");
    if (completedDates.has(iso)) classes.push("has-completed");
    if (iso === calendarSelectedISO) classes.push("is-selected");
    if (iso === todayISO()) classes.push("is-today");
    
    cells.push(`
      <button type="button"
        class="${classes.join(" ")}"
        data-calendar-date="${iso}">
        <span>${day}</span>
      </button>
    `);
  }
  
  grid.innerHTML = cells.join("");
  renderCalendarDay();
}

function renderCalendarDay() {
  const title = $("#calendarSelectedDate");
  const summary = $("#calendarSelectedSummary");
  const container = $("#calendarDayActivities");
  
  if (!title || !summary || !container) return;
  
  const selectedDate = parseLocalDate(calendarSelectedISO);
  const dayActivities = activities.filter(item => item.date === calendarSelectedISO);
  const completed = dayActivities.filter(item => item.done).length;
  
  title.textContent = selectedDate.toLocaleDateString("pt-BR", {
    day: "numeric",
    month: "long",
    year: "numeric"
  });
  
  summary.textContent = dayActivities.length ?
    `${dayActivities.length} atividade(s), ${completed} concluída(s)` :
    "Nenhuma atividade registrada neste dia.";
  
  if (!dayActivities.length) {
    container.innerHTML = '<div class="empty-state">Nenhuma atividade registrada nesta data.</div>';
    return;
  }
  
  container.innerHTML = dayActivities.map(item => `
    <article class="calendar-activity-row">
      <div>
        <strong>${escapeHTML(item.name || "Atividade")}</strong>
        <span>${Number(item.minutes || 0)} minutos</span>
      </div>
      <span>${item.done ? "✓ Concluída" : "Pendente"}</span>
    </article>
  `).join("");
}

function initCalendar() {
  const previous = $("#calendarPrevMonth");
  const next = $("#calendarNextMonth");
  const grid = $("#calendarGrid");
  
    if (previous) {
    previous.addEventListener("click", () => {
      calendarCurrentDate = new Date(
        calendarCurrentDate.getFullYear(),
        calendarCurrentDate.getMonth() - 1,
        1
      );
      renderCalendar();
    });
  }
  
  if (next) {
    next.addEventListener("click", () => {
      calendarCurrentDate = new Date(
        calendarCurrentDate.getFullYear(),
        calendarCurrentDate.getMonth() + 1,
        1
      );
      renderCalendar();
    });
  }
  
  
  
  if (grid) {
    grid.addEventListener("click", event => {
      const button = event.target.closest("[data-calendar-date]");
      if (!button) return;
      
      calendarSelectedISO = button.dataset.calendarDate;
      renderCalendar();
    });
  }
}

/* ---------- Atualização geral ---------- */


/* ---------- Controle de hidratação ---------- */

const HYDRATION_KEY = "vivafit_hydration_v1";

function getHydrationData() {
  const data = load(HYDRATION_KEY, {
    goal: 2000,
    days: {}
  });

  if (!data.days || typeof data.days !== "object") {
    data.days = {};
  }

  if (!Number.isFinite(Number(data.goal))) {
    data.goal = 2000;
  }

  return data;
}

function renderHydration() {
  const data = getHydrationData();
  const today = todayISO();

  if (!Array.isArray(data.days[today])) {
    data.days[today] = [];
  }

  const records = data.days[today];
  const consumed = records.reduce(
    (total, item) => total + Number(item.amount || 0),
    0
  );

  const goal = Number(data.goal) || 2000;
  const percentage = Math.round((consumed / goal) * 100);
  const progress = Math.min(100, percentage);

  setText("#hydrationConsumed", `${consumed.toLocaleString("pt-BR")} ml`);
  setText("#hydrationGoalDisplay", `${goal.toLocaleString("pt-BR")} ml`);
  setText("#hydrationPercentage", `${percentage}%`);
  setText("#hydrationGoalInput", goal);

  const bar = $("#hydrationProgressBar");
  if (bar) {
    bar.style.width = `${progress}%`;
  }

  const message = $("#hydrationProgressMessage");
  if (message) {
    if (consumed === 0) {
      message.textContent = "Registre sua primeira ingestão de água.";
    } else if (consumed >= goal) {
      message.textContent = "Parabéns! Você atingiu sua meta diária.";
    } else {
      const remaining = goal - consumed;
      message.textContent =
        `Faltam ${remaining.toLocaleString("pt-BR")} ml para atingir sua meta.`;
    }
  }

  const history = $("#hydrationHistory");
  if (history) {
    if (records.length === 0) {
      history.innerHTML =
        '<div class="empty-state">Nenhum consumo registrado hoje.</div>';
    } else {
      history.innerHTML = [...records]
        .reverse()
        .map(item => `
          <div class="hydration-history-row">
            <strong>${Number(item.amount).toLocaleString("pt-BR")} ml</strong>
            <span>${escapeHTML(item.time || "")}</span>
          </div>
        `)
        .join("");
    }
  }

  save(HYDRATION_KEY, data);
}

function addHydration(amount) {
  const quantity = Number(amount);

  if (!Number.isFinite(quantity) || quantity <= 0 || quantity > 5000) {
    showToast("Informe uma quantidade válida de água.");
    return;
  }

  const data = getHydrationData();
  const today = todayISO();

  if (!Array.isArray(data.days[today])) {
    data.days[today] = [];
  }

  data.days[today].push({
    amount: Math.round(quantity),
    time: new Date().toLocaleTimeString("pt-BR", {
      hour: "2-digit",
      minute: "2-digit"
    })
  });

  if (save(HYDRATION_KEY, data)) {
    renderHydration();
    showToast("Consumo de água registrado!");
  }
}

function initHydration() {
  const customInput = $("#hydrationCustomAmount");
  const customButton = $("#hydrationAddCustom");
  const goalInput = $("#hydrationGoalInput");
  const saveGoalButton = $("#hydrationSaveGoal");

  $$("[data-water]").forEach(button => {
    button.addEventListener("click", () => {
      addHydration(button.dataset.water);
    });
  });

  if (customButton && customInput) {
    customButton.addEventListener("click", () => {
      addHydration(customInput.value);
      customInput.value = "";
    });
  }

  if (goalInput && saveGoalButton) {
    saveGoalButton.addEventListener("click", () => {
      const goal = Number(goalInput.value);

      if (!Number.isFinite(goal) || goal < 250 || goal > 10000) {
        showToast("A meta deve ficar entre 250 e 10.000 ml.");
        return;
      }

      const data = getHydrationData();
      data.goal = Math.round(goal);

      if (save(HYDRATION_KEY, data)) {
        renderHydration();
        showToast("Meta diária atualizada!");
      }
    });
  }

  renderHydration();
}

const REMINDERS_KEY = "vivafit_reminders_v1";
// Registra o Service Worker para notificações push
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js')
      .then(registration => {
        console.log('Service Worker registrado:', registration.scope);
      })
      .catch(error => {
        console.error('Erro ao registrar Service Worker:', error);
      });
  });
}

function getReminders() {
  const reminders = load(REMINDERS_KEY, []);
  return Array.isArray(reminders) ? reminders : [];
}

function renderReminders() {
  const list = $("#reminderList");
  if (!list) return;

  const reminders = getReminders();

  if (!reminders.length) {
    list.innerHTML = '<div class="empty-state">Nenhum lembrete cadastrado.</div>';
    return;
  }

  list.innerHTML = reminders.map(reminder => {
    const days = reminder.days.length
      ? reminder.days.map(day => ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"][day]).join(", ")
      : "Sem repetição";

    return `
      <div class="reminder-item">
        <div>
          <strong>${escapeHTML(reminder.type)}</strong>
          <p>${escapeHTML(reminder.message)}</p>
          <small>${escapeHTML(reminder.time)} · ${escapeHTML(days)}</small>
        </div>

        <div class="reminder-actions">
          <button type="button" class="btn btn-secondary"
            data-edit-reminder="${escapeHTML(reminder.id)}">
            Editar
          </button>

          <button type="button" class="btn btn-secondary"
            data-delete-reminder="${escapeHTML(reminder.id)}">
            Excluir
          </button>
        </div>
      </div>
    `;
  }).join("");
}


function initReminders() {
  const saveButton = $("#reminderSave");
  const list = $("#reminderList");
  let editingReminderId = null;
    // Ativa notificações push neste celular e salva a inscrição no Supabase.
  const pushButton = $("#enablePushNotifications");
  const pushStatus = $("#pushNotificationStatus");

  const VAPID_PUBLIC_KEY =
    "BEyzMwKtYfJZbNqY2a8C58mAIQQIt4TbddveniBiIkbM8SsQcNiDmFPa4GIG5NA4vHA4SzPm3U388lDPGgvn2lM";

  function urlBase64ToUint8Array(base64String) {
    const padding = "=".repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
      .replace(/-/g, "+")
      .replace(/_/g, "/");

    const rawData = window.atob(base64);
    const output = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      output[i] = rawData.charCodeAt(i);
    }

    return output;
  }

  if (pushButton) {
    pushButton.addEventListener("click", async () => {
      try {
        if (!("serviceWorker" in navigator) ||
            !("PushManager" in window) ||
            !("Notification" in window)) {
          throw new Error(
            "Este navegador não oferece suporte às notificações push."
          );
        }

        if (pushStatus) {
          pushStatus.textContent = "Verificando sua conta...";
        }

        const { data: sessionData, error: sessionError } =
          await window.vivaFitSupabase.auth.getSession();

        if (sessionError) throw sessionError;

        const user = sessionData.session?.user;

        if (!user) {
          throw new Error(
            "Entre na sua conta VivaFit PRO antes de ativar as notificações."
          );
        }

        if (Notification.permission === "denied") {
          throw new Error(
            "As notificações estão bloqueadas no navegador. Libere a permissão nas configurações do Chrome."
          );
        }

        if (Notification.permission !== "granted") {
          const permission = await Notification.requestPermission();

          if (permission !== "granted") {
            throw new Error("Você não autorizou as notificações.");
          }
        }

        if (pushStatus) {
          pushStatus.textContent = "Registrando este celular...";
        }

        const registration = await navigator.serviceWorker.ready;

        let subscription =
          await registration.pushManager.getSubscription();

        if (!subscription) {
          subscription = await registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey:
              urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
          });
        }

        const subscriptionData = subscription.toJSON();

        if (!subscriptionData.keys?.p256dh ||
            !subscriptionData.keys?.auth) {
          throw new Error(
            "Não foi possível obter as chaves da inscrição."
          );
        }

        const { error: saveError } = await window.vivaFitSupabase
          .from("push_subscriptions")
          .upsert({
            user_id: user.id,
            endpoint: subscription.endpoint,
            p256dh: subscriptionData.keys.p256dh,
            auth: subscriptionData.keys.auth,
            timezone:
              Intl.DateTimeFormat().resolvedOptions().timeZone ||
              "America/Sao_Paulo"
          }, {
            onConflict: "endpoint"
          });

        if (saveError) throw saveError;

        if (pushStatus) {
          pushStatus.textContent =
            "Notificações autorizadas e celular registrado com sucesso!";
        }

        showToast("Notificações ativadas neste celular!");
      } catch (error) {
        console.error("Erro ao ativar notificações push:", error);

        if (pushStatus) {
          pushStatus.textContent =
            error.message || "Não foi possível ativar as notificações.";
        }

        showToast("Não foi possível ativar as notificações.");
      }
    });
  }
  // Sincroniza os lembretes locais com o Supabase.
  async function syncReminderToSupabase(reminder, userId) {
    const client = window.vivaFitSupabase;
    
    if (!client) {
      throw new Error("Cliente Supabase não inicializado.");
    }
    
    // Cria um identificador UUID estável para o registro remoto.
    if (!reminder.remoteId) {
      reminder.remoteId = window.crypto.randomUUID();
      
      // Guarda o identificador localmente para evitar duplicações.
            const localReminders = getReminders();
      const localReminder = localReminders.find(
        item => item.id === reminder.id
      );
      
      if (localReminder) {
        localReminder.remoteId = reminder.remoteId;
        save(REMINDERS_KEY, localReminders);
      }
    }
    
    const { error } = await client
      .from("reminders")
      .upsert({
        id: reminder.remoteId,
        user_id: userId,
        type: reminder.type,
        message: reminder.message,
        reminder_time: reminder.time,
        days: reminder.days,
        active: true
      }, {
        onConflict: "id"
      });
    
    if (error) throw error;
  }
  
  async function syncExistingReminders() {
    try {
      const client = window.vivaFitSupabase;
      if (!client) return;
      
      const { data, error } = await client.auth.getSession();
      
      if (error) throw error;
      
      const user = data.session?.user;
      if (!user) return;
      
      const reminders = getReminders();
      
      for (const reminder of reminders) {
        try {
          await syncReminderToSupabase(reminder, user.id);
        } catch (error) {
          console.error(
            "Erro ao sincronizar lembrete:",
            reminder.message,
            error
          );
        }
      }
      
      console.info("Sincronização dos lembretes concluída.");
    } catch (error) {
      console.error("Erro na sincronização dos lembretes:", error);
    }
  }
  let reminderAudioContext = null;

  function unlockReminderSound() {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;

      if (!reminderAudioContext) {
        reminderAudioContext = new AudioCtx();
      }

      if (reminderAudioContext.state === "suspended") {
        reminderAudioContext.resume();
      }
    } catch (error) {
      console.warn("Áudio indisponível:", error);
    }
  }

  function playReminderSound() {
    try {
      if (!reminderAudioContext) return;

      const ctx = reminderAudioContext;

      if (ctx.state !== "running") return;

      [0, 0.35, 0.7].forEach(delay => {
        const oscillator = ctx.createOscillator();
        const gain = ctx.createGain();

        oscillator.frequency.value = 880;
        oscillator.connect(gain);
        gain.connect(ctx.destination);

        const start = ctx.currentTime + delay;

        gain.gain.setValueAtTime(0.0001, start);
        gain.gain.exponentialRampToValueAtTime(0.35, start + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.25);

        oscillator.start(start);
        oscillator.stop(start + 0.27);
      });
    } catch (error) {
      console.warn("Não foi possível tocar o alerta:", error);
    }
  }

  function checkReminders() {
    const now = new Date();

    const date = [
      now.getFullYear(),
      String(now.getMonth() + 1).padStart(2, "0"),
      String(now.getDate()).padStart(2, "0")
    ].join("-");

    const time = [
      String(now.getHours()).padStart(2, "0"),
      String(now.getMinutes()).padStart(2, "0")
    ].join(":");

    const today = now.getDay();

    getReminders().forEach(reminder => {
      if (!Array.isArray(reminder.days)) return;
      if (!reminder.days.includes(today)) return;
      if (reminder.time !== time) return;

      const firedKey = `vivafit_reminder_fired_${date}_${reminder.id}`;

      if (localStorage.getItem(firedKey)) return;

      localStorage.setItem(firedKey, "1");

      playReminderSound();

      if (navigator.vibrate) {
        navigator.vibrate([300, 150, 300, 150, 300]);
      }

      showToast("🔔 " + reminder.message);

      if ("Notification" in window &&
          Notification.permission === "granted") {
        new Notification("VivaFit PRO", {
          body: reminder.message,
          icon: "./icon-192.png"
        });
      }
    });
  }

  if (saveButton) {
    saveButton.addEventListener("click", () => {
      unlockReminderSound();

      if ("Notification" in window &&
          Notification.permission === "default") {
        Notification.requestPermission();
      }

      const type = $("#reminderType")?.value || "Personalizado";
      const messageInput = $("#reminderMessage");
      const message = messageInput?.value.trim() ||
        `Lembrete de ${type.toLowerCase()}`;
      const time = $("#reminderTime")?.value || "";
      const days = $$("[data-reminder-day]:checked")
        .map(input => Number(input.value));

      if (!time) {
        setText("#reminderStatus", "Escolha um horário para o lembrete.");
        return;
      }

      if (!days.length) {
        setText("#reminderStatus", "Selecione pelo menos um dia da semana.");
        return;
      }

      const reminders = getReminders();

      reminders.push({
        id: uid(),
        type,
        message,
        time,
        days
      });

      if (save(REMINDERS_KEY, reminders)) {
        if (messageInput) messageInput.value = "";

        $$("[data-reminder-day]").forEach(input => {
          input.checked = false;
        });

        setText("#reminderStatus", "Lembrete salvo com sucesso!");
        syncExistingReminders();
        renderReminders();
        showToast("Lembrete salvo!");
      }
    });
  }

  
  if (list) {
    list.addEventListener("click", async event => {
      const editButton = event.target.closest("[data-edit-reminder]");

if (editButton) {
  const id = editButton.dataset.editReminder;
  const reminder = getReminders().find(item => item.id === id);
  
  if (!reminder) return;
  
  editingReminderId = reminder.id;
  
  $("#reminderType").value = reminder.type;
  $("#reminderMessage").value = reminder.message;
  $("#reminderTime").value = reminder.time;
  
  $$("[data-reminder-day]").forEach(input => {
    input.checked = reminder.days.includes(Number(input.value));
  });
  
  saveButton.textContent = "Salvar alterações";
  setText("#reminderStatus", "Editando lembrete. Faça as alterações no formulário.");
  $("#reminderMessage")?.focus();
  
  return;
}

const button = event.target.closest("[data-delete-reminder]");
if (!button) return;

      const id = button.dataset.deleteReminder;
      const currentReminders = getReminders();
      const reminderToDelete = currentReminders.find(
        item => item.id === id
      );

      if (!reminderToDelete) return;

      try {
        const client = window.vivaFitSupabase;

        if (client && reminderToDelete.remoteId) {
          const { data, error } = await client.auth.getSession();

          if (error) throw error;

          const user = data.session?.user;

          if (user) {
            const { error: deleteError } = await client
              .from("reminders")
              .delete()
              .eq("id", reminderToDelete.remoteId)
              .eq("user_id", user.id);

            if (deleteError) throw deleteError;
          }
        }

        const reminders = getReminders()
          .filter(item => item.id !== id);

        if (save(REMINDERS_KEY, reminders)) {
          renderReminders();
          showToast("Lembrete excluído!");
        }
      } catch (error) {
        console.error("Erro ao excluir lembrete do Supabase:", error);
        showToast("Não foi possível excluir o lembrete da nuvem.");
      }
    });
  }


  renderReminders();

  checkReminders();
  setInterval(checkReminders, 10000);
}


function renderAll() {
  renderActivities();
  renderDashboard();
  renderWeeklyFeature();
  renderAchievements();
  renderCalendar();
  renderGoals();
    renderWeights();
  renderWeightEvolution();
  renderRecentHistory();
  renderBlog();
  renderShop();
  renderCart();
}


function init() {
  initNavigation();
  initExerciseLibrary();
  initCalendar();
  initHydration();
  initReminders();
    if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("./sw.js")
      .catch(error => {
        console.error("Erro ao registrar notificações:", error);
      });
  }
  renderAll();
initializeFitnessSync();
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

/* =========================================================
   VIVAFIT PRO — CONTADOR DE PASSOS
   Módulo independente de sensores e caminhadas.
   ========================================================= */

(() => {
  "use strict";

  const STORAGE_KEY = "vivafit_steps_v1";
  const DAILY_GOAL = 8000;
  const STEP_LENGTH_METERS = 0.75;
  const KCAL_PER_STEP = 0.04;

  const dailyNumber = document.getElementById("dailySteps");
  const dailyBar = document.getElementById("dailyStepsBar");
  const dailyGoal = document.getElementById("dailyStepsGoal");
  const dailyPercent = document.getElementById("dailyStepsPercent");
  const dailyDistance = document.getElementById("dailyStepsDistance");
  const dailyCalories = document.getElementById("dailyStepsCalories");
  const dailyStatus = document.getElementById("dailyStepsStatus");

const walkingHistory = document.getElementById("walkingHistory");

  const sessionNumber = document.getElementById("sessionSteps");
  const sessionTime = document.getElementById("sessionTime");
  const sessionDistance = document.getElementById("sessionDistance");
  const sessionCard = document.querySelector(".steps-session");

  if (!dailyNumber || !sessionNumber || !dailyStatus || !sessionCard) {
    console.warn("VivaFit: área do contador de passos não encontrada.");
    return;
  }

  function localDate() {
    const d = new Date();
    return [
      d.getFullYear(),
      String(d.getMonth() + 1).padStart(2, "0"),
      String(d.getDate()).padStart(2, "0")
    ].join("-");
  }

  function readData() {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));

      if (saved && typeof saved === "object") {
        return saved;
      }
    } catch (error) {
      console.warn("Não foi possível recuperar os passos:", error);
    }

    return {
      date: localDate(),
      steps: 0,
      goal: DAILY_GOAL,
      sessions: [],
      activeSession: null
    };
  }

  const data = readData();

  if (!Number.isFinite(data.steps) || data.steps < 0) data.steps = 0;
  if (!Number.isFinite(data.goal) || data.goal < 1) data.goal = DAILY_GOAL;
  if (!Array.isArray(data.sessions)) data.sessions = [];

  if (data.date !== localDate()) {
    data.date = localDate();
    data.steps = 0;
  }

  let dailyActive = false;
  let sensorAttached = false;
  let inPeak = false;
  let peakValue = 0;
  let peakStartedAt = 0;
  let lastStepAt = 0;

  let gravity = null;
  let session = data.activeSession || null;
  
    // Controle do rastreamento por GPS.
  let gpsWatchId = null;
  let lastGpsPosition = null;
    // =====================================
  // MAPAS INTERATIVOS DO VIVAFIT PRO
  // =====================================
  
  let sessionLeafletMap = null;
  
  
  let sessionGpsMarker = null;
  
  
  let sessionGpsRoute = null;
  
  
  function initializeGpsMaps() {
    const sessionMapElement = document.getElementById("sessionMap");
    
    
    if (typeof L === "undefined") {
      console.warn("Leaflet não foi carregado.");
      return;
    }
    
    const initialCenter = [-15.78, -47.93];
    
    const mapOptions = {
      zoomControl: true,
      scrollWheelZoom: true
    };
    
    if (sessionMapElement) {
      sessionLeafletMap = L.map(
        sessionMapElement,
        mapOptions
      ).setView(initialCenter, 5);
      
      L.tileLayer(
        "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
        {
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
          maxZoom: 19
        }
      ).addTo(sessionLeafletMap);
      
      sessionGpsRoute = L.polyline([], {
  color: "#b9f36b",
  weight: 7,
  opacity: 1,
  lineCap: "round",
  lineJoin: "round"
}).addTo(sessionLeafletMap);
    }
    
    
  }
  
  try {
  initializeGpsMaps();
} catch (error) {
  console.error("Erro ao inicializar o mapa da caminhada:", error);
}
  
// Atualiza a localização e o percurso no mapa compacto.
  function updateGpsMaps(current, addRoutePoint) {
    if (typeof L === "undefined" || !current) return;
    
    if (!session) return;
    
    if (!Array.isArray(session.gpsRoute)) {
      session.gpsRoute = [];
    }
    
    const currentPoint = [
      current.latitude,
      current.longitude
    ];
    
    // Adiciona um ponto novo ao percurso quando autorizado.
    if (addRoutePoint) {
      session.gpsRoute.push({
        latitude: current.latitude,
        longitude: current.longitude
      });
    }
    
    // Recupera todos os pontos já registrados.
    const routeCoordinates = session.gpsRoute.map(point => [
      point.latitude,
      point.longitude
    ]);
    
    // Atualiza a linha do percurso no mapa da caminhada.
    if (sessionGpsRoute) {
      sessionGpsRoute.setLatLngs(routeCoordinates);
    }
    

    
    // Cria ou atualiza o marcador no mapa compacto.
    if (sessionLeafletMap) {
      if (!sessionGpsMarker) {
        sessionGpsMarker = L.circleMarker(currentPoint, {
          radius: 8,
          color: "#ffffff",
          weight: 3,
          fillColor: "#2196f3",
          fillOpacity: 1
        }).addTo(sessionLeafletMap);
      } else {
        sessionGpsMarker.setLatLng(currentPoint);
      }
      
      sessionLeafletMap.setView(currentPoint, 17);
    }
    
    
  }
  

  
  // FIM DA INICIALIZAÇÃO DOS MAPAS

  // Uma sessão que estava rodando é pausada ao reabrir a página.
  if (session && session.status === "running") {
    session.elapsedMs += Date.now() - session.startedAt;
    session.startedAt = null;
    session.status = "paused";
  }

  function persist() {
    data.activeSession = session;

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (error) {
      console.error("Erro ao salvar o contador de passos:", error);
    }
  }

  function formatNumber(value) {
    return Math.round(value).toLocaleString("pt-BR");
  }

  function formatDistance(steps) {
    const km = steps * STEP_LENGTH_METERS / 1000;
    return km.toLocaleString("pt-BR", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }) + " km";
  }
    function formatGpsDistance(meters) {
    return (meters / 1000).toLocaleString("pt-BR", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }) + " km";
  }

  function calculateGpsDistance(lat1, lon1, lat2, lon2) {
    const radius = 6371000;
    const toRadians = value => value * Math.PI / 180;

    const dLat = toRadians(lat2 - lat1);
    const dLon = toRadians(lon2 - lon1);

    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(toRadians(lat1)) *
      Math.cos(toRadians(lat2)) *
      Math.sin(dLon / 2) ** 2;

    return 2 * radius * Math.atan2(
      Math.sqrt(a),
      Math.sqrt(1 - a)
    );
  }

  function stopGpsTracking() {
    if (gpsWatchId !== null) {
      navigator.geolocation.clearWatch(gpsWatchId);
      gpsWatchId = null;
    }

    lastGpsPosition = null;
  }


    
      function startGpsTracking() {
    if (!navigator.geolocation) {
      setSessionStatus("Este navegador não oferece suporte ao GPS.");
      return false;
    }
    
    // Evita iniciar dois rastreamentos simultaneamente.
    stopGpsTracking();
    
    // Prepara o histórico do percurso.
    if (!Array.isArray(session.gpsRoute)) {
      session.gpsRoute = [];
    }
    
    gpsWatchId = navigator.geolocation.watchPosition(
      position => {
        if (!session || session.status !== "running") return;
        
        const accuracy = position.coords.accuracy;
        
        if (!Number.isFinite(accuracy) || accuracy > 15) {
          setSessionStatus("Aguardando um sinal GPS mais preciso...");
          return;
        }
        
        const current = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          timestamp: position.timestamp
        };
        
        let addRoutePoint = false;
        
        if (!lastGpsPosition) {
          addRoutePoint = session.gpsRoute.length === 0;
        } else {
          const distance = calculateGpsDistance(
            lastGpsPosition.latitude,
            lastGpsPosition.longitude,
            current.latitude,
            current.longitude
          );
          
          const elapsed =
            (current.timestamp - lastGpsPosition.timestamp) / 1000;
          
          const speed = elapsed > 0 ? distance / elapsed : 0;
          
          if (distance >= 1.5 && speed <= 8) {
            session.gpsDistanceMeters =
              (session.gpsDistanceMeters || 0) + distance;
            
            addRoutePoint = true;
            
            updateUI();
          }
        }
        
        updateGpsMaps(current, addRoutePoint);
        
        if (addRoutePoint) {
          persist();
        }
        
        lastGpsPosition = current;
        
        setSessionStatus("GPS ativo. Distância sendo registrada.");
      },
      error => {
        console.warn("Erro no GPS:", error);
        
        setSessionStatus(
          "Não foi possível obter o GPS. Verifique a localização do aparelho."
        );
      },
      {
        enableHighAccuracy: true,
        maximumAge: 1000,
        timeout: 15000
      }
    );
    
    return true;
  }

  function sessionElapsed() {
    if (!session) return 0;

    const current = session.status === "running"
      ? Date.now() - session.startedAt
      : 0;

    return (session.elapsedMs || 0) + current;
  }

  function formatTime(milliseconds) {
    const total = Math.floor(milliseconds / 1000);
    const hours = Math.floor(total / 3600);
    const minutes = Math.floor((total % 3600) / 60);
    const seconds = total % 60;

    return [
      String(hours).padStart(2, "0"),
      String(minutes).padStart(2, "0"),
      String(seconds).padStart(2, "0")
    ].join(":");
  }
    function renderWalkingEvolution() {
    const totalSessions = document.getElementById("walkingTotalSessions");
    const totalDistance = document.getElementById("walkingTotalDistance");
    const totalSteps = document.getElementById("walkingTotalSteps");
    const totalTime = document.getElementById("walkingTotalTime");
    const chart = document.getElementById("walkingEvolutionChart");
    const history = document.getElementById("walkingEvolutionHistory");
    
    if (!totalSessions || !chart || !history) return;
    
    const sessions = Array.isArray(data.sessions) ? data.sessions : [];
    
    const distance = sessions.reduce(
      (sum, item) => sum + Number(item.distanceKm || 0), 0
    );
    
    const steps = sessions.reduce(
      (sum, item) => sum + Number(item.steps || 0), 0
    );
    
    const duration = sessions.reduce(
      (sum, item) => sum + Number(item.durationMs || 0), 0
    );
    
    totalSessions.textContent = formatNumber(sessions.length);
    totalDistance.textContent = distance.toLocaleString("pt-BR", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }) + " km";
    
    totalSteps.textContent = formatNumber(steps);
    
    const hours = Math.floor(duration / 3600000);
    const minutes = Math.floor((duration % 3600000) / 60000);
    totalTime.textContent = hours + "h " + minutes + "min";
    
    const monthly = new Map();
    const current = new Date();
    
    for (let i = 5; i >= 0; i--) {
      const monthDate = new Date(
        current.getFullYear(),
        current.getMonth() - i,
        1
      );
      
      const key = monthDate.getFullYear() + "-" +
        String(monthDate.getMonth() + 1).padStart(2, "0");
      
      monthly.set(key, {
        label: monthDate.toLocaleDateString("pt-BR", {
          month: "short"
        }),
        distance: 0
      });
    }
    
    sessions.forEach(item => {
      if (!item.date) return;
      
      const key = item.date.slice(0, 7);
      
      if (monthly.has(key)) {
        monthly.get(key).distance += Number(item.distanceKm || 0);
      }
    });
    
    const months = Array.from(monthly.values());
    const maxDistance = Math.max(
      1,
      ...months.map(item => item.distance)
    );
    
    chart.replaceChildren();
    
    if (!sessions.length) {
      chart.innerHTML = '<div class="empty-state">Conclua sua primeira caminhada para visualizar sua evolução.</div>';
    } else {
      const chartGrid = document.createElement("div");
      chartGrid.className = "walking-month-chart";
      
      months.forEach(item => {
        const column = document.createElement("div");
        column.className = "walking-month-column";
        
        const value = document.createElement("span");
        value.textContent = item.distance.toLocaleString("pt-BR", {
          maximumFractionDigits: 2
        }) + " km";
        
        const bar = document.createElement("div");
        bar.className = "walking-month-bar";
        
        const fill = document.createElement("div");
        fill.className = "walking-month-fill";
        fill.style.height = (item.distance / maxDistance * 100) + "%";
        
        const label = document.createElement("small");
        label.textContent = item.label;
        
        bar.appendChild(fill);
        column.append(value, bar, label);
        chartGrid.appendChild(column);
      });
      
      chart.appendChild(chartGrid);
    }
    
    history.replaceChildren();
    
    if (!sessions.length) {
      history.innerHTML = '<div class="empty-state">Suas caminhadas aparecerão aqui quando forem concluídas.</div>';
      return;
    }
    
    [...sessions].reverse().forEach(item => {
      const row = document.createElement("div");
      row.className = "walking-evolution-row";
      
      const date = document.createElement("strong");
      const parsedDate = item.date ?
        new Date(item.date + "T12:00:00") : null;
      
      date.textContent = parsedDate && !Number.isNaN(parsedDate.getTime()) ?
        parsedDate.toLocaleDateString("pt-BR") :
        "Caminhada registrada";
      
      const details = document.createElement("span");
      details.textContent =
        formatNumber(item.steps || 0) + " passos · " +
        Number(item.distanceKm || 0).toLocaleString("pt-BR", {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2
        }) + " km · " +
        formatTime(item.durationMs || 0);
      
      row.append(date, details);
      history.appendChild(row);
    });
  }
    function renderWalkingHistory() {
    if (!walkingHistory) return;
    renderWalkingEvolution();
    
    walkingHistory.replaceChildren();
    
    const sessions = Array.isArray(data.sessions) ?
      [...data.sessions].reverse() :
      [];
    
    if (sessions.length === 0) {
      const empty = document.createElement("div");
      empty.className = "empty-state";
      empty.textContent = "Ainda não há caminhadas concluídas.";
      walkingHistory.appendChild(empty);
      return;
    }
    
    sessions.forEach(item => {
      const row = document.createElement("div");
      row.className = "recent-row";
      
      const title = document.createElement("div");
      const date = document.createElement("strong");
      
      const parsedDate = item.date ?
        new Date(item.date + "T12:00:00") :
        null;
      
      date.textContent = parsedDate && !Number.isNaN(parsedDate.getTime()) ?
        parsedDate.toLocaleDateString("pt-BR") :
        "Caminhada registrada";
      
      const details = document.createElement("div");
      
      const steps = formatNumber(item.steps || 0);
      const distance = Number(item.distanceKm || 0).toLocaleString(
        "pt-BR",
        {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2
        }
      );
      
      const duration = formatTime(item.durationMs || 0);
      
      details.textContent =
        steps + " passos · " +
        distance + " km · " +
        duration;
      
      const route = document.createElement("div");
      const hasRoute = Array.isArray(item.gpsRoute) &&
        item.gpsRoute.length > 1;
      
      route.textContent = hasRoute ?
        "Trajeto GPS registrado" :
        "Sem trajeto GPS registrado";
      
      title.appendChild(date);
      row.appendChild(title);
      row.appendChild(details);
      row.appendChild(route);
      
      walkingHistory.appendChild(row);
    });
  }
    // Botão para limpar somente os históricos concluídos.
  const resetHistoryButton = document.getElementById("resetHistoryButton");
  
  if (resetHistoryButton) {
    resetHistoryButton.addEventListener("click", async () => {
      const confirmed = confirm(
        "Deseja apagar as atividades concluídas e o histórico de caminhadas? Os passos de hoje e uma caminhada em andamento serão preservados."
      );
      
      if (!confirmed) return;
      
      const completedActivities = activities.filter(item => item.done);
      const completedIds = completedActivities.map(item => String(item.id));
      
      // Confere diretamente a sessão atual da conta.
      const supabaseClient = window.vivaFitSupabase;
      
      if (completedIds.length && supabaseClient) {
        const { data: authData, error: authError } =
        await supabaseClient.auth.getSession();
        
        const currentUserId = authData?.session?.user?.id;
        
        if (authError || !currentUserId) {
          showToast("Não foi possível confirmar sua conta. Entre novamente e tente.");
          return;
        }
        
        fitnessUserId = currentUserId;
      }
      
      // Exclui primeiro da nuvem, quando houver atividades concluídas.
      if (completedIds.length && fitnessUserId && supabaseClient) {
        const { error } = await supabaseClient
          .from("fitness_activities")
          .delete()
          .eq("user_id", fitnessUserId)
          .in("external_id", completedIds);
        
        if (error) {
          console.error("Erro ao limpar histórico na nuvem:", error);
          showToast("Não foi possível limpar o histórico na nuvem.");
          return;
        }
      }
      
      // Mantém atividades que ainda não foram concluídas.
      activities = activities.filter(item => !item.done);
      save(VF.keys.activities, activities);
      
      // Remove somente caminhadas finalizadas.
      data.sessions = [];
      persist();
      renderWalkingHistory();
      renderAll();
      
      showToast("Históricos concluídos apagados com sucesso.");
    });
  }

  function updateUI() {
    if (data.date !== localDate()) {
      data.date = localDate();
      data.steps = 0;
      persist();
    }

    const percent = Math.min(
      100,
      Math.round(data.steps / data.goal * 100)
    );

    dailyNumber.textContent = formatNumber(data.steps);

    if (dailyBar) dailyBar.style.width = percent + "%";
    if (dailyGoal) {
      dailyGoal.textContent =
        "Meta: " + formatNumber(data.goal) + " passos";
    }
    if (dailyPercent) dailyPercent.textContent = percent + "%";

    if (dailyDistance) {
      dailyDistance.textContent = formatDistance(data.steps);
    }

    if (dailyCalories) {
      dailyCalories.textContent =
        Math.round(data.steps * KCAL_PER_STEP) + " kcal";
    }

        if (session) {
      sessionNumber.textContent = formatNumber(session.steps || 0);
      
      const gpsMeters = session.gpsDistanceMeters || 0;
      
      sessionDistance.textContent = gpsMeters > 0 ?
        formatGpsDistance(gpsMeters) :
        formatDistance(session.steps || 0);
      
      sessionTime.textContent = formatTime(sessionElapsed());
    } else {
      sessionNumber.textContent = "0";
      sessionDistance.textContent = "0,00 km";
      sessionTime.textContent = "00:00:00";
    }

    dailyButton.textContent = dailyActive
      ? "Pausar contagem diária"
      : "Ativar contagem diária";

    sessionButton.textContent = session
      ? session.status === "running"
        ? "Pausar caminhada"
        : "Continuar caminhada"
      : "Iniciar caminhada";

    finishButton.disabled = !session;
    finishButton.style.opacity = session ? "1" : ".45";
  }

  function setStatus(message) {
    dailyStatus.textContent = message;
  }

  function setSessionStatus(message) {
    sessionStatus.textContent = message;
  }

  function createButton(label) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "btn btn-primary btn-small";
    button.textContent = label;
    button.style.margin = "5px 5px 5px 0";
    button.style.cursor = "pointer";
    return button;
  }

  // Cria os controles sem precisar alterar o HTML novamente.
  const dailyButton = createButton("Ativar contagem diária");
  dailyButton.style.width = "100%";
  dailyStatus.insertAdjacentElement("afterend", dailyButton);
  
  // Botão para zerar a contagem diária.
  const resetDailyButton = createButton("↺ Zerar passos de hoje");
  resetDailyButton.className = "btn btn-secondary btn-small";
  resetDailyButton.style.width = "100%";
  resetDailyButton.style.marginTop = "10px";

  dailyButton.insertAdjacentElement("afterend", resetDailyButton);

  resetDailyButton.addEventListener("click", () => {
    // Protege os dados de uma caminhada ainda não finalizada.
    if (session) {
      setStatus("Finalize sua caminhada antes de zerar os passos diários.");
      return;
    }

    const confirmed = confirm(
      "Deseja realmente zerar os passos de hoje? Essa ação não poderá ser desfeita."
    );

    if (!confirmed) return;

    // Interrompe a contagem antes de zerar.
    dailyActive = false;
    stopSensorIfIdle();

    // Zera somente os passos do dia.
    data.steps = 0;

    persist();
    updateUI();

    setStatus("Contagem diária zerada. Você pode começar novamente!");
  });


  const sessionStatus = sessionCard.querySelector(".steps-status");
  sessionStatus.id = "sessionStepsStatus";

  const controls = document.createElement("div");
  controls.className = "steps-controls";

  const sessionButton = createButton("Iniciar caminhada");
  const finishButton = createButton("Finalizar caminhada");

  controls.append(sessionButton, finishButton);
  sessionStatus.insertAdjacentElement("afterend", controls);

  function registerStep() {
    if (!dailyActive && (!session || session.status !== "running")) {
      return;
    }

    data.steps += 1;

    if (session && session.status === "running") {
      session.steps = (session.steps || 0) + 1;
    }

    updateUI();
    persist();
  }

  // Detecta picos de movimento no acelerômetro.
  function handleMotion(event) {
    const acceleration = event.acceleration;
    const includesGravity = !acceleration ||
      acceleration.x === null ||
      acceleration.y === null ||
      acceleration.z === null;

    const source = includesGravity
      ? event.accelerationIncludingGravity
      : acceleration;

    if (!source ||
        source.x === null ||
        source.y === null ||
        source.z === null) {
      return;
    }

    const x = Number(source.x) || 0;
    const y = Number(source.y) || 0;
    const z = Number(source.z) || 0;

    let magnitude;

    if (includesGravity) {
      if (!gravity) {
        gravity = { x, y, z };
        return;
      }

      const alpha = 0.85;

      gravity.x = alpha * gravity.x + (1 - alpha) * x;
      gravity.y = alpha * gravity.y + (1 - alpha) * y;
      gravity.z = alpha * gravity.z + (1 - alpha) * z;

      const lx = x - gravity.x;
      const ly = y - gravity.y;
      const lz = z - gravity.z;

      magnitude = Math.sqrt(lx * lx + ly * ly + lz * lz);
    } else {
      magnitude = Math.sqrt(x * x + y * y + z * z);
    }

    const now = Date.now();
    const threshold = 2.0;

    if (magnitude > threshold && !inPeak) {
      inPeak = true;
      peakValue = magnitude;
      peakStartedAt = now;
    }

    if (inPeak) {
      peakValue = Math.max(peakValue, magnitude);

      const peakFinished =
        magnitude < peakValue * 0.65 &&
        now - peakStartedAt > 90;

      const peakTimedOut = now - peakStartedAt > 700;

      if (peakFinished || peakTimedOut) {
        if (now - lastStepAt > 450) {
          registerStep();
          lastStepAt = now;
        }

        inPeak = false;
      }
    }
  }

  async function startSensor() {
    if (!("DeviceMotionEvent" in window)) {
      setStatus("Este navegador não disponibiliza o sensor de movimento.");
      return false;
    }

    try {
      if (typeof DeviceMotionEvent.requestPermission === "function") {
        const permission = await DeviceMotionEvent.requestPermission();

        if (permission !== "granted") {
          setStatus("Permissão do sensor não concedida.");
          return false;
        }
      }

      if (!sensorAttached) {
        window.addEventListener("devicemotion", handleMotion);
        sensorAttached = true;
      }

      setStatus("Sensor ativo. Caminhe com o celular junto ao corpo.");
      return true;
    } catch (error) {
      console.error("Erro ao ativar sensor:", error);
      setStatus("Não foi possível ativar o sensor. Verifique as permissões.");
      return false;
    }
  }

  function stopSensorIfIdle() {
    if (dailyActive || (session && session.status === "running")) {
      return;
    }

    if (sensorAttached) {
      window.removeEventListener("devicemotion", handleMotion);
      sensorAttached = false;
    }

    gravity = null;
    inPeak = false;
  }

  dailyButton.addEventListener("click", async () => {
    if (dailyActive) {
      dailyActive = false;
      stopSensorIfIdle();
      setStatus("Contagem diária pausada.");
      updateUI();
      return;
    }

    const started = await startSensor();

    if (started) {
      dailyActive = true;
      setStatus("Contagem diária ativa. Mantenha esta página aberta.");
      updateUI();
    }
  });

  sessionButton.addEventListener("click", async () => {
    if (session && session.status === "running") {
      session.elapsedMs += Date.now() - session.startedAt;
      session.startedAt = null;
      session.status = "paused";

            stopGpsTracking();
      persist();
      stopSensorIfIdle();
      setSessionStatus("Caminhada pausada.");
      
      updateUI();
      return;
    }

    const started = await startSensor();

    if (!started) return;

    dailyActive = true;

    if (!session) {
            session = {
        date: localDate(),
        steps: 0,
        gpsDistanceMeters: 0,
        elapsedMs: 0,
        startedAt: Date.now(),
        status: "running"
      };
      
    } else {
      session.startedAt = Date.now();
      session.status = "running";
    }

    setStatus("Contagem diária ativa durante a caminhada.");
    setSessionStatus("Caminhada em andamento.");
    persist();
    updateUI();
    startGpsTracking();
  });

  finishButton.addEventListener("click", () => {
    if (!session) return;

        if (session.status === "running") {
      session.elapsedMs += Date.now() - session.startedAt;
    }
    
    stopGpsTracking();

        const finished = {
      date: session.date,
      steps: session.steps || 0,
      durationMs: session.elapsedMs || 0,
      
      distanceKm: (
        session.gpsDistanceMeters > 0 ?
        session.gpsDistanceMeters :
        (session.steps || 0) * STEP_LENGTH_METERS
      ) / 1000,
      
      gpsRoute: Array.isArray(session.gpsRoute) ?
        [...session.gpsRoute] :
        []
    };

    data.sessions.push(finished);
    session = null;

    persist();
    renderWalkingHistory();
    stopSensorIfIdle();

    setSessionStatus(
      "Caminhada finalizada: " +
      formatNumber(finished.steps) +
      " passos."
    );

    updateUI();
  });

  // Atualiza o relógio da sessão sem alterar a contagem.
  window.setInterval(() => {
    if (session && session.status === "running") {
      updateUI();
    }
  }, 1000);

    updateUI();
  renderWalkingHistory();
  persist();
  
  if (session && session.status === "paused") {
    setSessionStatus("Caminhada pausada. Você pode continuar ou finalizar.");
  } else {
    setSessionStatus("Pronto para iniciar sua caminhada.");
  }

  setStatus("Contador pronto. Toque em Ativar contagem diária.");

  console.log("VivaFit: módulo de passos carregado.");
})();

