// --- CONFIG & STATE --- //
const CONFIG = {
  coresGenially: [
    "#F8F4E8",
    "#EDE7CF",
    "#D2D4C9",
    "#A0B6C1",
    "#1A0D72",
    "#2E227C",
    "#51468D",
    "#C0B9ED",
  ],
  borderColor: "#1A0D72",
  backgroundColor: "#F8F4E8",
  textColor: "#1A0D72",
  apiKey:
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJheGxybm50eHRldHhxcHhkeXl4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA2ODIwMjQsImV4cCI6MjA2NjI1ODAyNH0.wHG2BHds5mTHo9VLBsqshG5pMTBAFCUmdKJMBKDsHpU",
};
CONFIG.apiBearer = "Bearer " + CONFIG.apiKey;

const UI = {
  tela: "votacao", // 'intro', 'tutorial' 'votacao', 'sugestao', 'resultado'
  tutorialPasso: 0,
  isMobile: false,
  gradienteFundo: null,
  videoLike: null,
  videoDislike: null,
  videoEmExibicao: false,
  caixaInput: null,
  botaoEnviar: null,
  botaoCancelar: null,
  caixaJustificativaVisivel: false,
  tipoSuper: null,
  inputFavorito: null,
  inputOdiado: null,
  botaoPular: null,
  botaoSim: null,
  botaoNao: null,
  mensagemSucesso: false,
  tempoMensagemSucesso: 0,
  sugestaoInicializada: false,
};

const SUPABASE_URL = "https://baxlrnntxtetxqpxdyyx.supabase.co";
const supabaseClient = supabase.createClient(SUPABASE_URL, CONFIG.apiKey);

const STATE = {
  modoDev: false,
  traducao: null,
  idioma: "pt", // pode mudar para "en" dinamicamente se quiser
  animals: [],
  animaisCarregados: false,
  current: 0,
  offsetX: 0,
  votos: [],
  userId: null,
  countryCode: null,
  nacionalidades: null,
  comparando: false,
  porcentagemSimilaridade: 0,
  superLikeActive: false,
  superDislikeActive: false,
  superLikesCount: 0,
  superDislikesCount: 0,
  topLikes: [],
  topDislikes: [],
  topSuperLikes: [],
  topSuperDislikes: [],
  ended: false,
  paises: [],
  bandeiras: {},
  enviadoFavorito: false,
  enviadoOdiado: false,
};

let tutorialSlides;

// --- UTILS --- //
function getUserId() {
  let id = localStorage.getItem("user_id");
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem("user_id", id);
  }
  return id;
}

function fetchCountryCode() {
  fetch("https://ipapi.co/json/")
    .then((res) => res.json())
    .then((data) => {
      console.log("fetchCountryCode retornou:", data.country_code);
      STATE.countryCode = data.country_code || null;
      console.log("STATE dentro do fetch:", STATE);
    })
    .catch(() => {
      STATE.countryCode = null;
    });
}

function aplicarShadow(el, cor = "8px 12px" + CONFIG.borderColor) {
  if (el) el.style("box-shadow", cor);
}

// --- p5.js LIFECYCLE --- //
function preload() {
  let tabelaTradUrl =
    "https://docs.google.com/spreadsheets/d/e/2PACX-1vTcIXBR0jvmhQFhIrnBPwz9PVB_6NRn6zgyTdWAUJ0hWypIoMMW6hAEpOGksGMxHrbRdWqASvlj-H79/pub?output=tsv";

  STATE.traducao = loadTable(tabelaTradUrl, "tsv", "header");

  fetchPaises();

  UI.videoLike = createVideo("DesmondSuperLike.webm");
  UI.videoLike.hide();
  UI.videoLike.elt.style.zIndex = "99999";

  UI.videoDislike = createVideo(
    "https://cdn.pixabay.com/video/2023/07/02/169797-841740222_large.mp4"
  );
  UI.videoDislike.hide();
  UI.videoDislike.elt.style.zIndex = "99999";
}

function setup() {
  createCanvas(windowWidth, windowHeight);
  textAlign(CENTER, CENTER);
  textSize(32);
  rectMode(CENTER);
  UI.isMobile = windowWidth <= 1000;

  STATE.userId = getUserId();
  initializePlayerInfo();
  fetchCountryCode();

  if (STATE.modoDev) {
    UI.tela = "resultado";
    STATE.ended = true;
    fetchTopVotes();
    fetchPaises();
    fetchNacionalidades();
    fetchTopSuperVotes();
  }
  setupInputUI();
  setupPlayerInfoUI();
  criarBotoesTutorial();
  carregarAnimaisDoSupabase();

  tutorialSlides = [
    { texto: t("tuto1"), mostrarCard: true },
    { texto: t("tuto2"), mostrarCard: true, demoSwipe: "right" },
    { texto: t("tuto3"), mostrarCard: true, demoSwipe: "left" },
    { texto: t("tuto4"), mostrarCard: true, demoSuperButtons: true },
    {
      texto: t("tuto5"),
      mostrarCard: true,
      demoSuperButtons: false,
      demoSuperPopup: true,
    },
    {
      texto: t("tuto6"),
      mostrarCard: false,
      demoSuperPopup: false,
      previewStickers: true,
    },
  ];
}

function draw() {
  drawGradientBackground();

  if (!STATE.animaisCarregados) {
    push();
    fill(CONFIG.textColor);
    textSize(24);
    text("Carregando animais...", width / 2, height / 2);
    pop();
    return;
  }

  if (UI.videoEmExibicao) {
    imageMode(CORNER);
    image(UI.videoEmExibicao, 0, 0, width, height);
    return;
  }

  if (UI.tela === "tutorial") {
    desenharTutorial();
  } else if (UI.tela === "intro") {
    rectMode(CENTER);
    desenharIntro();
  } else if (UI.tela === "votacao") {
    rectMode(CENTER);
    desenharVotacao();
  } else if (UI.tela === "sugestao") {
    rectMode(CENTER);
    desenharSugestaoFinal();
  } else if (UI.tela === "resultado") {
    rectMode(CORNER);
    compararComOutros();
    desenharResultados();
  }
  if (UI.caixaJustificativaVisivel) {
    drawJustificativaBox();
  }
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}

// --- UI HELPERS --- //
function drawGradientBackground() {
  let ctx = drawingContext;
  let grad = ctx.createLinearGradient(0, 0, width, height);
  grad.addColorStop(0, CONFIG.backgroundColor);
  grad.addColorStop(1, "#5B7C8C");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, width, height);
}

function setupInputUI() {
  UI.caixaInput = createInput();
  UI.caixaInput.class("input-caixa");
  UI.caixaInput.size(400, 100);
  UI.caixaInput.position(width / 2 - 200, height / 2 - 40);
  UI.caixaInput.hide();
  UI.botaoEnviar = createButton(t("btnEnv"));
  UI.botaoEnviar.class("botao-enviar");
  UI.botaoEnviar.position(width / 2 + 120, height / 2 + 100);
  UI.botaoEnviar.mousePressed(enviarJustificativa);
  UI.botaoEnviar.hide();
  UI.botaoCancelar = createButton(t("btnCanc"));
  UI.botaoCancelar.class("botao-cancelar");
  UI.botaoCancelar.position(width / 2 - 180, height / 2 + 100);
  UI.botaoCancelar.mousePressed(cancelarJustificativa);
  UI.botaoCancelar.hide();
}

function t(key) {
  let linha = STATE.traducao.findRow(key, "KEY");
  if (linha) {
    return linha.get(STATE.idioma);
  }
  return key; // fallback se não achar
}

// --- TUTORIAL ---//

// Criar botões do tutorial (apenas uma vez no setup)
function criarBotoesTutorial() {
  UI.botaoVoltarTutorial = createButton("<<<");
  UI.botaoVoltarTutorial.class("botao-principal");
  UI.botaoVoltarTutorial.mousePressed(() => {
    if (UI.tutorialPasso > 0) UI.tutorialPasso--;
  });
  UI.botaoVoltarTutorial.hide();

  UI.botaoAvancarTutorial = createButton(">>>");
  UI.botaoAvancarTutorial.class("botao-principal");
  UI.botaoAvancarTutorial.mousePressed(avancarTutorial);
  UI.botaoAvancarTutorial.hide();
}

function desenharTutorial() {
  let passoAtual = tutorialSlides[UI.tutorialPasso];

  // Texto
  fill("#1A0D72");
  textAlign(CENTER, TOP);
  textSize(UI.isMobile ? 18 : 24);
  textWrap(WORD);
  let margemTopo = height * 0.06;
  let larguraTexto = min(width * 0.85, 850);
  text(passoAtual.texto, width / 2, margemTopo, larguraTexto);

  // Card de demonstração
  if (passoAtual.mostrarCard) {
    push();
    translate(width / 2, height * 0.5);

    let inclinacao = 0;
    let deslocamentoX = 0;

    // Variáveis para o tutorial
    const cicloMovimento = 1200; // ms (vai e volta)
    const delayEntreCiclos = 800; // ms parado no centro
    const cicloTotal = cicloMovimento + delayEntreCiclos;

    let tMillis = millis() % cicloTotal;

    let progresso;
    if (tMillis < cicloMovimento) {
      // Durante o movimento (1,2s)
      let fase = tMillis / cicloMovimento; // 0 a 1
      if (fase <= 0.5) {
        // vai do centro até o máximo (0 a 0.5)
        progresso = sin(PI * fase);
      } else {
        // volta do máximo para o centro (0.5 a 1)
        progresso = sin(PI * (1 - fase));
      }
    } else {
      // Durante o delay, parado no centro
      progresso = 0;
    }

    // Aplicar no deslocamento e inclinação conforme lado do swipe
    if (passoAtual.demoSwipe === "right") {
      deslocamentoX = progresso * 40; // só para direita
      inclinacao = map(deslocamentoX, 0, 40, 0, PI / 20);
    } else if (passoAtual.demoSwipe === "left") {
      deslocamentoX = -progresso * 40; // só para esquerda
      inclinacao = map(deslocamentoX, 0, -40, 0, -PI / 20);
    }

    rotate(inclinacao);
    translate(deslocamentoX, 0);

    // Desenhar o card normal (sem modificações)
    desenharCard({
      nameComum: t("demoNome"),
      nameCientifico: t("demoCient"),
      curiosidade: t("demoCurio"),
      tags: [t("demoTag1"), t("demoTag2"), t("demoTag3")],
      img: null,
    });

    // Desenhar botões animados POR CIMA do card se necessário
    if (passoAtual.demoSuperButtons) {
      desenharBotoesAnimadosTutorial();
    }

    if (passoAtual.demoSuperPopup) {
      mostrarCaixaJustificativa("like", true);
    }
    if (passoAtual.previewStickers) {
    }

    pop();
  }

  // Posição dos botões (responsivo)
  let botaoWidth = min(width * 0.2, 100);
  let botaoHeight = UI.isMobile ? 30 : 20;
  let yBotao = height - botaoHeight * 2;

  if (UI.tutorialPasso > 0) {
    UI.botaoVoltarTutorial.position(width * 0.2 - botaoWidth / 2, yBotao);
    UI.botaoVoltarTutorial.size(botaoWidth, botaoHeight);
    UI.botaoVoltarTutorial.show();
  }

  UI.botaoAvancarTutorial.position(width * 0.8 - botaoWidth / 2, yBotao);
  UI.botaoAvancarTutorial.size(botaoWidth, botaoHeight);
  UI.botaoAvancarTutorial.show();
}

function desenharBotoesAnimadosTutorial() {
  // Calcular tamanhos do card (replicando a lógica da função original)
  let cardWidth, cardHeight;
  if (UI.isMobile) {
    cardHeight = height * 0.6;
    cardWidth = cardHeight * 0.75;
  } else {
    cardWidth = constrain(windowWidth * 0.5, 200, 500);
    cardHeight = cardWidth * 1.1;
  }

  let btnSize = cardWidth * 0.15;

  // Calcular fator de escala animado
  const cicloBotoes = 800; // ms para um ciclo completo de pulsação
  let tBotoes = millis() % cicloBotoes;
  let faseBotoes = (tBotoes / cicloBotoes) * 2 * PI; // 0 a 2π
  let fatorEscala = 1.25 + sin(faseBotoes) * 0.25; // varia entre 1 e 1.5

  // Desenhar botões animados nas mesmas posições que o card original
  if (UI.isMobile) {
    let btnY = cardHeight / 2 + btnSize * 2;
    let spacing = btnSize * 2;

    // Botão de super dislike (esquerda)
    if (STATE.superDislikesCount < 3) {
      push();
      translate(-spacing / 2, btnY);
      scale(fatorEscala);

      stroke(CONFIG.borderColor);
      strokeWeight(4);
      fill(STATE.superDislikeActive ? "#E97474" : "#F1A3A3");
      rectMode(CENTER);
      rect(0, 0, btnSize, btnSize);

      pop();
    }

    // Botão de super like (direita)
    if (STATE.superLikesCount < 3) {
      push();
      translate(spacing / 2, btnY);
      scale(fatorEscala);

      stroke(CONFIG.borderColor);
      strokeWeight(4);
      fill(STATE.superLikeActive ? "#A0D468" : "#D0E6A5");
      rectMode(CENTER);
      rect(0, 0, btnSize, btnSize);

      pop();
    }
  } else {
    // Desktop
    let btnY = cardHeight / 2 - btnSize * 0.6;
    let btnOffsetX = cardWidth * 0.45;

    // Botão de super dislike (esquerda)
    if (STATE.superDislikesCount < 3) {
      push();
      translate(-btnOffsetX, btnY);
      scale(fatorEscala);

      stroke(CONFIG.borderColor);
      strokeWeight(4);
      fill(STATE.superDislikeActive ? "#E97474" : "#F1A3A3");
      rectMode(CENTER);
      rect(0, 0, btnSize, btnSize);

      pop();
    }

    // Botão de super like (direita)
    if (STATE.superLikesCount < 3) {
      push();
      translate(btnOffsetX, btnY);
      scale(fatorEscala);

      stroke(CONFIG.borderColor);
      strokeWeight(4);
      fill(STATE.superLikeActive ? "#A0D468" : "#D0E6A5");
      rectMode(CENTER);
      rect(0, 0, btnSize, btnSize);

      pop();
    }
  }
}

function avancarTutorial() {
  if (UI.tutorialPasso < tutorialSlides.length - 1) {
    if (UI.tutorialPasso == 4) {
      cancelarJustificativa();
    }
    UI.tutorialPasso++;
  } else {
    UI.botaoVoltarTutorial.hide();
    UI.botaoAvancarTutorial.hide();
    UI.tela = "votacao";
  }
}

// --- PLAYER INFO ---//

function desenharIntro() {
  // Calcula dimensões responsivas
  let cardWidth = min(width * 0.85, UI.isMobile ? width : 500);
  let cardHeight = min(height * 0.75, UI.isMobile ? height : 600);
  let tituloAltura = cardHeight * 0.12;
  let cx = width / 2;
  let cy = height / 2;

  push();
  translate(cx, cy);
  rectMode(CENTER);

  // Fundo do card principal
  fill(CONFIG.backgroundColor);
  stroke(CONFIG.borderColor);
  strokeWeight(4);
  rect(0, 0, cardWidth, cardHeight);

  // Faixa azul do título
  fill(CONFIG.borderColor);
  let tituloOffsetY = -cardHeight / 2 - tituloAltura / 6;
  rect(0, tituloOffsetY, cardWidth * 0.7, tituloAltura);

  // Texto do título
  noStroke();
  fill("#C0B9ED");
  textStyle(BOLD);
  let tituloSize = getAdaptiveTextSize(
    t("introTitulo"),
    cardWidth * 0.7,
    tituloAltura,
    {
      maxSizeRatio: 0.5,
      minSize: 16,
      widthUsage: 0.9,
    }
  );
  textSize(tituloSize);
  textAlign(CENTER, CENTER);
  text(t("introTitulo"), 0, tituloOffsetY);

  // Texto explicativo
  textStyle(NORMAL);
  fill(CONFIG.borderColor);
  let explicacaoSize = getAdaptiveTextSize(
    t("introTxt"),
    cardWidth * 0.85,
    cardHeight * 0.08,
    {
      maxSizeRatio: 0.4,
      minSize: 18,
      widthUsage: 0.95,
    }
  );
  textSize(explicacaoSize);
  textAlign(CENTER, TOP);
  let explicacaoY = tituloOffsetY + tituloAltura;
  text(t("introTxt"), -cardWidth * 0.01, explicacaoY, cardWidth * 0.85);

  pop();

  // --- Mostra e posiciona os campos diretamente ---
  if (!window.UI || !UI.inputNacionalidade) {
    setupPlayerInfoUI();
  }

  // Mostra elementos específicos desta tela
  UI.inputNacionalidade.show();
  UI.inputIdade.show();
  UI.botaoMasculino.show();
  UI.botaoFeminino.show();
  UI.botaoOutro.show();
  UI.botaoContinuar.show();
  aplicarShadow(UI.inputNacionalidade);
  aplicarShadow(UI.inputIdade);

  // Posiciona elementos
  posicionarCamposPlayerInfo(cardWidth, cardHeight, cx, cy);
}

function posicionarCamposPlayerInfo(cardWidth, cardHeight, cx, cy) {
  if (!window.UI) {
    console.error("Objeto UI não existe. Chame setupPlayerInfoUI() primeiro.");
    return;
  }

  if (!UI.inputNacionalidade || !UI.inputIdade || !UI.botaoMasculino) {
    console.error(
      "Elementos UI não foram criados. Chame setupPlayerInfoUI() primeiro."
    );
    return;
  }

  // Calcula posições dos campos
  let fieldWidth = cardWidth * 0.8;
  let fieldHeight = cardHeight * 0.08;

  // Garante tamanhos mínimos e máximos
  fieldWidth = constrain(fieldWidth, cardWidth * 0.3, cardWidth * 0.8);
  fieldHeight = constrain(fieldHeight, cardWidth * 0.05, cardWidth * 0.1);

  let caixaTop = cy - cardHeight / 2 + cardHeight * 0.25; // Mais espaço para título
  let caixaBottom = cy + cardHeight / 2 - cardHeight * 0.15; // Mais margem inferior

  // Distribui os campos verticalmente na área utilizável
  let areaUtil = caixaBottom - caixaTop;
  let espacoEntreCampos = areaUtil / 3; // Mais espaçamento entre elementos

  // Campo Nacionalidade
  let nacionalidadeY = caixaTop;
  UI.inputNacionalidade.position(cx - fieldWidth / 2, nacionalidadeY);
  UI.inputNacionalidade.size(fieldWidth, fieldHeight);

  // Campo Idade
  let idadeY = nacionalidadeY + espacoEntreCampos;
  UI.inputIdade.position(cx - fieldWidth / 2, idadeY);
  UI.inputIdade.size(fieldWidth, fieldHeight);
  UI.inputIdade.style("z-index", "1000");
  UI.inputIdade.style("position", "absolute");

  // Botões de Gênero (lado a lado)
  let generoY = idadeY + espacoEntreCampos;
  let buttonWidth = fieldWidth * 0.28;
  let buttonHeight = fieldHeight * 0.9;
  let buttonSpacing = fieldWidth * 0.08;

  // Centraliza os 3 botões
  let totalButtonsWidth = buttonWidth * 3 + buttonSpacing * 2;
  let startButtonX = cx - totalButtonsWidth / 2;

  UI.botaoMasculino.position(startButtonX, generoY);
  UI.botaoMasculino.size(buttonWidth, buttonHeight);
  UI.botaoMasculino.style("z-index", "1000");
  UI.botaoMasculino.style("position", "absolute");

  UI.botaoFeminino.position(
    startButtonX + buttonWidth + buttonSpacing,
    generoY
  );
  UI.botaoFeminino.size(buttonWidth, buttonHeight);
  UI.botaoFeminino.style("z-index", "1000");
  UI.botaoFeminino.style("position", "absolute");

  UI.botaoOutro.position(
    startButtonX + (buttonWidth + buttonSpacing) * 2,
    generoY
  );
  UI.botaoOutro.size(buttonWidth, buttonHeight);
  UI.botaoOutro.style("z-index", "1000");
  UI.botaoOutro.style("position", "absolute");

  // Campo "Outro" gênero (aparece apenas se selecionado)
  if (UI.generoSelecionado === "outro") {
    let outroGeneroY = generoY + buttonHeight + 10;
    UI.inputOutroGenero.position(cx - fieldWidth / 2, outroGeneroY);
    UI.inputOutroGenero.size(fieldWidth, fieldHeight);
    UI.inputOutroGenero.style("z-index", "1000");
    UI.inputOutroGenero.style("position", "absolute");
    aplicarShadow(UI.inputOutroGenero);
  }

  // Botão Continuar
  let continuarY = generoY + espacoEntreCampos * 1.5; // + (UI.generoSelecionado === "outro" ? fieldHeight + 10 : 0);
  let continuarWidth = fieldWidth * 0.4;
  let continuarHeight = fieldHeight;

  UI.botaoContinuar.position(cx - continuarWidth / 2, continuarY);
  UI.botaoContinuar.size(continuarWidth, continuarHeight);
  UI.botaoContinuar.style("z-index", "1000");
  UI.botaoContinuar.style("position", "absolute");
}

// Setup da UI para tela de informações
function setupPlayerInfoUI() {
  if (!window.UI) window.UI = {};

  const cx = width / 2;
  const cy = height / 2;
  const cardWidth = min(width * 0.85, 500);
  const cardHeight = min(height * 0.75, 600);

  // --- Campo Nacionalidade ---
  UI.inputNacionalidade = createInput();
  UI.inputNacionalidade.attribute("placeholder", t("placPais"));
  UI.inputNacionalidade.class("input-player-info");
  UI.inputNacionalidade.style("position", "absolute");
  UI.inputNacionalidade.style("z-index", "1000");
  UI.inputNacionalidade.hide();
  document.body.appendChild(UI.inputNacionalidade.elt); // garante que está no DOM

  // --- Campo Idade ---
  UI.inputIdade = createInput();
  UI.inputIdade.attribute("placeholder", t("placIdade"));
  UI.inputIdade.attribute("type", "number");
  UI.inputIdade.attribute("min", "1");
  UI.inputIdade.attribute("max", "120");
  UI.inputIdade.class("input-player-info");
  UI.inputIdade.style("position", "absolute");
  UI.inputIdade.style("z-index", "1000");
  UI.inputIdade.hide();
  document.body.appendChild(UI.inputIdade.elt);

  // --- Botões de Gênero ---
  UI.botaoMasculino = createButton(t("gen1"));
  UI.botaoMasculino.class("botao-genero");
  UI.botaoMasculino.mousePressed(() => selecionarGenero("masculino"));
  UI.botaoMasculino.style("position", "absolute");
  UI.botaoMasculino.style("z-index", "1000");
  UI.botaoMasculino.hide();
  document.body.appendChild(UI.botaoMasculino.elt);

  UI.botaoFeminino = createButton(t("gen2"));
  UI.botaoFeminino.class("botao-genero");
  UI.botaoFeminino.mousePressed(() => selecionarGenero("feminino"));
  UI.botaoFeminino.style("position", "absolute");
  UI.botaoFeminino.style("z-index", "1000");
  UI.botaoFeminino.hide();
  document.body.appendChild(UI.botaoFeminino.elt);

  UI.botaoOutro = createButton(t("gen3"));
  UI.botaoOutro.class("botao-genero");
  UI.botaoOutro.mousePressed(() => selecionarGenero("outro"));
  UI.botaoOutro.style("position", "absolute");
  UI.botaoOutro.style("z-index", "1000");
  UI.botaoOutro.hide();
  document.body.appendChild(UI.botaoOutro.elt);

  UI.inputOutroGenero = createInput();
  UI.inputOutroGenero.attribute("placeholder", t("gen3Cont"));
  UI.inputOutroGenero.class("input-player-info");
  UI.inputOutroGenero.style("position", "absolute");
  UI.inputOutroGenero.style("z-index", "1000");
  UI.inputOutroGenero.hide();
  document.body.appendChild(UI.inputOutroGenero.elt);

  UI.botaoContinuar = createButton(t("btnCont"));
  UI.botaoContinuar.class("botao-principal");
  UI.botaoContinuar.mousePressed(enviarInfoJogador);
  UI.botaoContinuar.style("position", "absolute");
  UI.botaoContinuar.style("z-index", "1000");
  UI.botaoContinuar.hide();
  document.body.appendChild(UI.botaoContinuar.elt);

  UI.generoSelecionado = null;

  // --- Buscar lista de países e inicializar autocomplete ---
  fetch("https://restcountries.com/v3.1/all?fields=name,translations")
    .then((res) => res.json())
    .then((data) => {
      const countries = data.map((c) => {
        if (STATE.idioma === "pt") {
          return c.translations?.por?.common || c.name.common;
        } else {
          return c.name.common;
        }
      });

      criarAutocomplete(UI.inputNacionalidade.elt, countries);
    })
    .catch((err) => console.error("Erro ao buscar países:", err));
}

// --- Função de autocomplete ---
function criarAutocomplete(input, arr) {
  let currentFocus;
  input.addEventListener("input", function () {
    let val = this.value;
    closeAllLists();
    if (!val) return false;
    currentFocus = -1;

    const list = document.createElement("div");
    list.setAttribute("class", "autocomplete-items");
    list.style.position = "absolute";
    list.style.backgroundColor = "white";
    list.style.border = "1px solid #d4d4d4";
    list.style.zIndex = "10000";
    list.style.maxHeight = "150px";
    list.style.overflowY = "auto";

    // posiciona abaixo do input
    const rect = input.getBoundingClientRect();
    list.style.left = rect.left + "px";
    list.style.top = rect.bottom + "px";
    list.style.width = rect.width + "px";

    document.body.appendChild(list);

    arr.forEach((item) => {
      if (item.substr(0, val.length).toUpperCase() === val.toUpperCase()) {
        const option = document.createElement("div");
        option.innerHTML =
          "<strong>" + item.substr(0, val.length) + "</strong>";
        option.innerHTML += item.substr(val.length);
        option.style.padding = "5px";
        option.addEventListener("click", function () {
          input.value = item;
          closeAllLists();
        });
        list.appendChild(option);
      }
    });
  });

  input.addEventListener("keydown", function (e) {
    const x = document.querySelector(".autocomplete-items");
    if (x) {
      let items = x.getElementsByTagName("div");
      if (e.keyCode === 40) {
        currentFocus++;
        addActive(items);
      } else if (e.keyCode === 38) {
        currentFocus--;
        addActive(items);
      } else if (e.keyCode === 13) {
        e.preventDefault();
        if (currentFocus > -1 && items) {
          items[currentFocus].click();
        }
      }
    }
  });

  function addActive(items) {
    if (!items) return false;
    removeActive(items);
    if (currentFocus >= items.length) currentFocus = 0;
    if (currentFocus < 0) currentFocus = items.length - 1;
    items[currentFocus].classList.add("autocomplete-active");
    items[currentFocus].style.backgroundColor = "#e9e9e9";
  }

  function removeActive(items) {
    for (let i = 0; i < items.length; i++) {
      items[i].classList.remove("autocomplete-active");
      items[i].style.backgroundColor = "white";
    }
  }

  function closeAllLists(elmnt) {
    const items = document.getElementsByClassName("autocomplete-items");
    for (let i = 0; i < items.length; i++) {
      if (elmnt !== items[i] && elmnt !== input) {
        items[i].parentNode.removeChild(items[i]);
      }
    }
  }

  document.addEventListener("click", function (e) {
    closeAllLists(e.target);
  });
}

// Função para selecionar gênero
function selecionarGenero(genero) {
  UI.generoSelecionado = genero;

  // Remove seleção visual de todos os botões
  UI.botaoMasculino.removeClass("genero-selecionado");
  UI.botaoFeminino.removeClass("genero-selecionado");
  UI.botaoOutro.removeClass("genero-selecionado");

  // Adiciona seleção visual ao botão escolhido
  if (genero === "masculino") {
    UI.botaoMasculino.addClass("genero-selecionado");
  } else if (genero === "feminino") {
    UI.botaoFeminino.addClass("genero-selecionado");
  } else if (genero === "outro") {
    UI.botaoOutro.addClass("genero-selecionado");
    UI.inputOutroGenero.show();
  }

  // Esconde campo "outro" se não for selecionado
  if (genero !== "outro") {
    UI.inputOutroGenero.hide();
  }

  // Reposiciona elementos para acomodar mudanças
  let cardWidth = min(width * 0.85, 500);
  let cardHeight = min(height * 0.75, 600);
  posicionarCamposPlayerInfo(cardWidth, cardHeight, width / 2, height / 2);
}

// Função para processar as informações
function enviarInfoJogador() {
  let nacionalidade = UI.inputNacionalidade.value().trim();
  let idade = UI.inputIdade.value().trim();
  let genero = UI.generoSelecionado;

  // Validações básicas
  if (!nacionalidade) {
    alert("Por favor, informe sua nacionalidade");
    return;
  }

  if (!idade) {
    alert("Por favor, informe uma idade válida");
    return;
  }

  if (!genero) {
    alert("Por favor, selecione uma opção de gênero");
    return;
  }

  // Se selecionou "outro" mas não especificou
  if (genero === "outro" && !UI.inputOutroGenero.value().trim()) {
    alert("Por favor, especifique seu gênero");
    return;
  }

  // Salva as informações no STATE global para usar nos votos
  STATE.playerInfo = {
    nacionalidade: nacionalidade,
    idade: parseInt(idade),
    genero: genero === "outro" ? UI.inputOutroGenero.value().trim() : genero,
  };

  // Log para debug
  console.log("Informações do jogador salvas:", STATE.playerInfo);

  // Esconde a tela e continua para próxima etapa
  esconderTelaPlayerInfo();

  // Chama próxima função do seu jogo
  UI.tela = "tutorial";
}

// Função para esconder a tela
function esconderTelaPlayerInfo() {
  if (!UI) return; // Proteção adicional

  UI.inputNacionalidade.hide();
  UI.inputIdade.hide();
  UI.botaoMasculino.hide();
  UI.botaoFeminino.hide();
  UI.botaoOutro.hide();
  UI.inputOutroGenero.hide();
  UI.botaoContinuar.hide();
}

// --- VOTING & CARD DRAWING --- //

async function carregarAnimaisDoSupabase() {
  // console.log("Iniciando carregarAnimaisDoSupabase...");
  STATE.animaisCarregados = false;

  const { data, error } = await supabaseClient.from("animais").select("*");
  if (error) {
    console.error("Erro ao carregar animais do Supabase:", error);
    return;
  }
  // console.log("Dados recebidos do Supabase:", data);

  const lang = STATE.idioma || "pt";

  STATE.animals = await Promise.all(
    data
      .filter(
        (a) => a[`nomeComum_${lang}`] && a[`nomeComum_${lang}`].trim() !== ""
      )
      .map(async (animal) => {
        let img = null;
        if (animal.imagemUrl) {
          try {
            img = await loadImage(animal.imagemUrl);
          } catch {
            console.warn("Falha ao carregar imagem:", animal.imagemUrl);
          }
        }
        return {
          nomeVoto: animal.nomeComum_pt || "",
          nameComum: animal[`nomeComum_${lang}`] || "",
          nameCientifico: animal.nomeCientifico || "",
          curiosidade: animal[`descricao_${lang}`] || "",
          img: img,
          tags: [
            animal[`tag1_${lang}`],
            animal[`tag2_${lang}`],
            animal[`tag3_${lang}`],
          ].filter(Boolean),
        };
      })
  );

  STATE.animaisCarregados = true;
  //console.log("Animais carregados com sucesso:", STATE.animals);
}

function getAdaptiveTextSize(text, boxWidth, boxHeight, options = {}) {
  // Opções padrão (podem ser personalizadas)
  const defaults = {
    maxSizeRatio: 0.5, // Tamanho máximo como % da altura da caixa
    minSize: 8, // Tamanho mínimo absoluto
    widthUsage: 0.85, // % da largura da caixa a usar
    lengthCurve: 15, // Fator para curva de ajuste por comprimento
    stepSize: 0.5, // Tamanho do passo para redução
  };

  // Combina opções padrão com as fornecidas
  const opts = { ...defaults, ...options };

  // Tamanho base proporcional à altura da caixa
  let baseSize = boxHeight * opts.maxSizeRatio;
  let textLength = text.length;

  // Ajuste baseado no comprimento com curva suave
  let lengthFactor = Math.max(
    0.4,
    Math.min(1.3, opts.lengthCurve / Math.sqrt(textLength))
  );
  let preliminarySize = baseSize * lengthFactor;

  // Largura disponível para o texto
  let targetWidth = boxWidth * opts.widthUsage;
  let finalSize = preliminarySize;

  // Testa se o texto cabe na largura, se não couber, reduz
  textSize(finalSize);
  while (textWidth(text) > targetWidth && finalSize > opts.minSize) {
    finalSize -= opts.stepSize;
    textSize(finalSize);
  }

  // Limites finais
  let maxSize = boxHeight * (opts.maxSizeRatio * 1.4); // 40% maior que o padrão se necessário
  return constrain(finalSize, opts.minSize, maxSize);
}

function desenharVotacao() {
  if (STATE.current >= STATE.animals.length) {
    UI.tela = "sugestao";
    return;
  }
  if (STATE.current + 1 < STATE.animals.length) {
    push();
    let next = STATE.animals[STATE.current + 1];
    translate(width / 2, height / 2);
    desenharCard(next);
    pop();
  }
  let animal = STATE.animals[STATE.current];
  push();
  translate(width / 2 + STATE.offsetX, height / 2);
  rotate(radians(STATE.offsetX * 0.05));
  desenharCard(animal);
  pop();

  let threshold = 50;
  if (abs(STATE.offsetX) > threshold) {
    push();
    let alpha = map(abs(STATE.offsetX), threshold, 200, 0, 255, true);
    let size = map(abs(STATE.offsetX), threshold, 200, 32, 96, true);
    textSize(size);
    fill(STATE.offsetX > 0 ? color(0, 200, 0, alpha) : color(255, 0, 0, alpha));
    textAlign(CENTER, CENTER);
    text(STATE.offsetX > 0 ? "❤️" : "❌", width / 2, height / 2 - 40);
    pop();
  }
}

function desenharCard(animal) {
  let cardWidth, cardHeight;
  if (UI.isMobile) {
    cardHeight = height * 0.6;
    cardWidth = cardHeight * 0.75;
    translate(0, -windowHeight * 0.05);
  } else {
    cardWidth = constrain(windowWidth * 0.5, 200, 500);
    cardHeight = cardWidth * 1.1;
  }
  let tituloAltura = cardHeight * 0.13;
  let tituloLargura = cardWidth * 0.8;
  push();
  rectMode(CORNER);
  fill(CONFIG.backgroundColor);
  stroke(CONFIG.borderColor);
  strokeWeight(4);
  let extraAltura = cardHeight * 0.13;
  rect(
    -cardWidth / 2,
    -cardHeight / 2 + tituloAltura / 2,
    cardWidth,
    cardHeight + extraAltura
  );
  pop();

  // Título
  fill(CONFIG.borderColor);
  stroke(CONFIG.borderColor);
  strokeWeight(4);
  rect(0, -cardHeight / 2 + tituloAltura / 2, tituloLargura, tituloAltura);
  noStroke();
  fill("#C0B9ED");
  textAlign(CENTER, CENTER);
  textStyle(BOLD);
  //let tituloSize = constrain(tituloAltura * 0.2, 16, 38);
  let tituloSize = getAdaptiveTextSize(
    animal.nameComum,
    tituloLargura,
    tituloAltura,
    {
      maxSizeRatio: 0.6,
      minSize: 12,
      widthUsage: 0.85,
    }
  );
  textSize(tituloSize);
  text(animal.nameComum, 0, -cardHeight / 2 + tituloAltura / 2);

  // Imagem
  if (animal.img) {
    push();
    drawingContext.shadowOffsetX = 8;
    drawingContext.shadowOffsetY = 12;
    drawingContext.shadowColor = "#1A0D72";

    imageMode(CENTER);
    let imagemAltura = cardHeight * 0.6;
    let imagemY = (-cardHeight * 0.05) / 2;
    image(animal.img, 0, imagemY, cardWidth * 0.85, imagemAltura);
    pop();
  }
  // Nome científico
  textStyle(ITALIC);
  textSize(cardHeight * 0.06);
  text(animal.nameCientifico, 0, cardHeight / 2 - cardHeight * 0.16);

  // Fun fact
  textStyle(NORMAL);
  textAlign(CENTER, TOP);
  textWrap(WORD);
  fill(CONFIG.borderColor);

  let curiosidadeY = cardHeight / 2 - cardHeight * 0.11;
  let curiosidadeWidth = cardWidth * 0.88;

  let curiosidadeHeight = cardHeight * 0.15; // ou whatever altura você quer dar para esse espaço

  let curiosidadeSize = getAdaptiveTextSize(
    animal.curiosidade || "",
    curiosidadeWidth,
    curiosidadeHeight,
    {
      maxSizeRatio: 0.3, // Como é texto corrido, pode ser menor proporcionalmente
      minSize: 12, // Mínimo legível para parágrafo
      widthUsage: 1.0, // Usa 100% da largura disponível (você já definiu 88% do card)
      lengthCurve: 20, // Curva mais suave para textos longos
    }
  );
  textSize(curiosidadeSize);
  text(animal.curiosidade || "", 0, curiosidadeY, curiosidadeWidth);
  // --- botões de super‑voto ---
  let btnSize = cardWidth * 0.15;
  if (UI.isMobile) {
    let btnY = cardHeight / 2 + btnSize * 2;
    let spacing = btnSize * 2;
    if (STATE.superDislikesCount < 3) {
      stroke(CONFIG.borderColor);
      strokeWeight(4);
      fill(STATE.superDislikeActive ? "#E97474" : "#F1A3A3");
      rect(-spacing / 2, btnY, btnSize, btnSize);
      noStroke();
      fill(CONFIG.borderColor);
      textSize(btnSize * 0.25);
      textAlign(CENTER, TOP);
      text(
        `x ${3 - STATE.superDislikesCount}`,
        -spacing / 2,
        btnY + btnSize / 2 + 4
      );
    }
    if (STATE.superLikesCount < 3) {
      stroke(CONFIG.borderColor);
      strokeWeight(4);
      fill(STATE.superLikeActive ? "#A0D468" : "#D0E6A5");
      rect(spacing / 2, btnY, btnSize, btnSize);
      noStroke();
      fill(CONFIG.borderColor);
      textSize(btnSize * 0.25);
      textAlign(CENTER, TOP);
      text(
        `x ${3 - STATE.superLikesCount}`,
        spacing / 2,
        btnY + btnSize / 2 + 4
      );
    }
  } else {
    let btnY = cardHeight / 2 - btnSize * 0.6;
    let btnOffsetX = cardWidth * 0.45;
    if (STATE.superDislikesCount < 3) {
      stroke(CONFIG.borderColor);
      strokeWeight(4);
      fill(STATE.superDislikeActive ? "#E97474" : "#F1A3A3");
      rect(-btnOffsetX, btnY, btnSize, btnSize);
      noStroke();
      fill(CONFIG.borderColor);
      textSize(btnSize * 0.25);
      textAlign(CENTER, TOP);
      text(
        `x ${3 - STATE.superDislikesCount}`,
        -btnOffsetX,
        btnY + btnSize / 2 + 4
      );
    }
    if (STATE.superLikesCount < 3) {
      stroke(CONFIG.borderColor);
      strokeWeight(4);
      fill(STATE.superLikeActive ? "#A0D468" : "#D0E6A5");
      rect(btnOffsetX, btnY, btnSize, btnSize);
      noStroke();
      fill(CONFIG.borderColor);
      textSize(btnSize * 0.25);
      textAlign(CENTER, TOP);
      text(
        `x ${3 - STATE.superLikesCount}`,
        btnOffsetX,
        btnY + btnSize / 2 + 4
      );
    }
  }
  // Tags
  if (animal.tags && animal.tags.length > 0) {
    let tagBoxW = cardWidth * 0.28;
    let tagBoxH = cardHeight * 0.08;
    let tagSpacing = tagBoxW + cardWidth * 0.04;
    let tagsY = cardHeight / 2 + tagBoxH;
    let startX = -((animal.tags.length - 1) * tagSpacing) / 2;

    textAlign(CENTER, CENTER);
    textStyle(BOLD);
    fill(CONFIG.borderColor);
    noStroke();

    animal.tags.forEach((tag, i) => {
      let tagX = startX + i * tagSpacing;

      let tagSize = getAdaptiveTextSize(tag, tagBoxW, tagBoxH, {
        maxSizeRatio: 0.4,
        minSize: 8,
        widthUsage: 0.8,
      });
      textSize(tagSize);

      fill(CONFIG.borderColor);
      rect(tagX, tagsY, tagBoxW, tagBoxH);
      fill("#C0B9ED");
      text(tag, tagX, tagsY);
    });
  }
}

function vote(direction) {
  let animalName = STATE.animals[STATE.current].nomeVoto;
  //console.log("Vote chamado. countryCode atual:", STATE.countryCode);

  if (!STATE.countryCode) {
    console.warn("País desconhecido - voto não enviado.");
    STATE.offsetX = 0;
    STATE.current++;
    return;
  }

  // Verifica se as informações do jogador existem
  if (!STATE.playerInfo) {
    console.warn(
      "Informações do jogador não encontradas - usando valores padrão."
    );
    STATE.playerInfo = {
      nacionalidade: "Não informado",
      idade: null,
      genero: "Não informado",
    };
  }

  // Prepara o corpo da requisição com as informações do jogador
  const requestBody = {
    user_id: STATE.userId,
    animal: animalName,
    vote: direction === "right" ? "like" : "dislike",
    country: STATE.countryCode,
    timestamp: new Date().toISOString(),
    // Adiciona as novas colunas
    nacionalidade: STATE.playerInfo.nacionalidade,
    idade: STATE.playerInfo.idade,
    genero: STATE.playerInfo.genero,
  };

  fetch("https://baxlrnntxtetxqpxdyyx.supabase.co/rest/v1/likes_and_dislikes", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: CONFIG.apiKey,
      Authorization: CONFIG.apiBearer,
    },
    body: JSON.stringify(requestBody),
  })
    .then((res) => {
      if (!res.ok) throw new Error("Erro ao enviar voto");
      console.log("Voto enviado com sucesso, incluindo informações do jogador");
      STATE.offsetX = 0;
      STATE.current++;
    })
    .catch((err) => {
      console.error("Erro ao enviar voto:", err);
      STATE.offsetX = 0;
      STATE.current++;
    });
}

function mouseDragged() {
  if (UI.caixaJustificativaVisivel) return;

  STATE.offsetX += mouseX - pmouseX;
}

function mouseReleased() {
  if (UI.tela !== "votacao" || UI.caixaJustificativaVisivel) return;
  if (!STATE.animaisCarregados) return;

  if (STATE.offsetX > 150) {
    vote("right");
    return;
  } else if (STATE.offsetX < -150) {
    vote("left");
    return;
  } else {
    STATE.offsetX = 0;
  }
  let cardWidth, cardHeight;
  if (UI.isMobile) {
    cardHeight = height * 0.6;
    cardWidth = cardHeight * 0.75;
  } else {
    cardWidth = constrain(windowWidth * 0.5, 200, 500);
    cardHeight = cardWidth * 1.1;
  }
  let btnSize = cardWidth * 0.15;
  let dx = mouseX - width / 2;
  let dy = mouseY - height / 2;
  if (UI.isMobile) {
    dy += windowHeight * 0.05;
  }
  if (UI.isMobile) {
    let btnY = cardHeight / 2 + btnSize * 2;
    let spacing = btnSize * 2;
    let bxDislike = -spacing / 2;
    if (
      dx >= bxDislike - btnSize / 2 &&
      dx <= bxDislike + btnSize / 2 &&
      dy >= btnY - btnSize / 2 &&
      dy <= btnY + btnSize / 2 &&
      STATE.superDislikesCount < 3
    ) {
      STATE.superDislikeActive = true;
      mostrarCaixaJustificativa("dislike");
      return;
    }
    let bxLike = spacing / 2;
    if (
      dx >= bxLike - btnSize / 2 &&
      dx <= bxLike + btnSize / 2 &&
      dy >= btnY - btnSize / 2 &&
      dy <= btnY + btnSize / 2 &&
      STATE.superLikesCount < 3
    ) {
      STATE.superLikeActive = true;
      mostrarCaixaJustificativa("like");
      return;
    }
  } else {
    let btnY = cardHeight / 2 - btnSize * 0.6;
    let btnOffsetX = cardWidth * 0.45;
    let bxDislike = -btnOffsetX;
    if (
      dx >= bxDislike - btnSize / 2 &&
      dx <= bxDislike + btnSize / 2 &&
      dy >= btnY - btnSize / 2 &&
      dy <= btnY + btnSize / 2 &&
      STATE.superDislikesCount < 3
    ) {
      STATE.superDislikeActive = true;
      mostrarCaixaJustificativa("dislike");
      return;
    }
    let bxLike = btnOffsetX;
    if (
      dx >= bxLike - btnSize / 2 &&
      dx <= bxLike + btnSize / 2 &&
      dy >= btnY - btnSize / 2 &&
      dy <= btnY + btnSize / 2 &&
      STATE.superLikesCount < 3
    ) {
      STATE.superLikeActive = true;
      mostrarCaixaJustificativa("like");
      return;
    }
  }
}

function initializePlayerInfo() {
  if (!STATE.playerInfo) {
    STATE.playerInfo = null;
  }
}

// --- SUPER VOTE JUSTIFICATION --- //

function drawJustificativaBox() {
  // Usar % da tela para tamanho do card
  let cardWidth = min(width * 0.8, 600); // máximo 600px, mas 80% da largura se for menor
  let cardHeight = min(height * 0.6, 400); // aumentei um pouco a altura para acomodar melhor
  let tituloAltura = cardHeight * 0.15; // reduzi proporção do título
  let cx = width / 2,
    cy = height / 2;

  push();
  translate(cx, cy);
  rectMode(CENTER);
  fill(CONFIG.backgroundColor);
  stroke(CONFIG.borderColor);
  strokeWeight(4);
  rect(0, 0, cardWidth, cardHeight);
  fill(CONFIG.borderColor);
  let tituloOffsetY = -cardHeight / 2 - tituloAltura / 4 + 12;
  rect(0, tituloOffsetY, cardWidth * 0.7, tituloAltura);
  noStroke();
  fill("#C0B9ED");
  textStyle(BOLD);
  // Tamanho de fonte proporcional mas com limites
  let tituloSize = constrain(tituloAltura * 0.4, 26, 38);
  textSize(tituloSize);
  textAlign(CENTER, CENTER);
  text(
    UI.tipoSuper === "like" ? "Super Like 💖" : "Super Dislike 💔",
    0,
    tituloOffsetY
  );

  // Texto do parágrafo centralizado
  textStyle(NORMAL);
  let textoSize = constrain(cardHeight * 0.06, 14, 22);
  textSize(textoSize);
  fill(CONFIG.borderColor);
  textAlign(CENTER, CENTER);
  textWrap(WORD);

  let restantes =
    UI.tipoSuper === "like"
      ? 3 - STATE.superLikesCount
      : 3 - STATE.superDislikesCount;
  let textoConfirmacao =
    (UI.tipoSuper === "like" ? t("superJusLike") : t("superJusDis")) +
    t("superAviso") +
    restantes +
    (UI.tipoSuper === "like" ? " Super Likes" : " Super Dislikes") +
    "!";

  // Área para o texto centralizada verticalmente entre título e input
  let textoY = tituloOffsetY + tituloAltura / 2 + 100;
  let textoAreaHeight = cardHeight * 0.4;
  text(textoConfirmacao, 0, textoY, cardWidth * 0.85, textoAreaHeight);

  pop();

  // Posiciona os elementos UI responsivamente dentro da caixa
  posicionarElementosJustificativa(cardWidth, cardHeight, cx, cy);
}

function posicionarElementosJustificativa(cardWidth, cardHeight, cx, cy) {
  if (!UI.caixaInput || !UI.botaoEnviar || !UI.botaoCancelar) return;

  // Input mais proporcionado
  let inputWidth = constrain(cardWidth * 0.8, 200, 350);
  let inputHeight = constrain(cardHeight * 0.15, 40, 80);

  // Posição do input na parte inferior da caixa, mas com margem
  let inputX = cx - inputWidth / 2;
  let inputY = cy + cardHeight * 0.001;

  UI.caixaInput.position(inputX, inputY);
  UI.caixaInput.size(inputWidth, inputHeight);

  // Botões posicionados lado a lado, centralizados, abaixo do input
  let buttonY = inputY + inputHeight + 50;
  let buttonWidth = 70; // largura fixa para os botões
  let espacoEntreBotoes = 60; // espaço fixo entre botões

  // Calcula posição para centralizar os dois botões
  let totalButtonWidth = buttonWidth * 2 + espacoEntreBotoes;
  let startX = cx - totalButtonWidth / 2;

  // Garante que ficam dentro da caixa
  let maxY = cy + cardHeight / 2 - 35;
  buttonY = min(buttonY, maxY);

  // Posiciona botões com tamanho controlado
  UI.botaoCancelar.position(startX, buttonY);
  UI.botaoCancelar.size(buttonWidth, 30);

  UI.botaoEnviar.position(startX + buttonWidth + espacoEntreBotoes, buttonY);
  UI.botaoEnviar.size(buttonWidth, 30);
}

function mostrarCaixaJustificativa(tipo, isDemo = false) {
  UI.tipoSuper = tipo;
  UI.caixaInput.value(isDemo ? "Digite o motivo aqui..." : "");
  UI.caixaInput.show();
  aplicarShadow(UI.caixaInput);
  UI.botaoEnviar.show();
  UI.botaoCancelar.show();
  UI.caixaJustificativaVisivel = true;

  // Se for demo, desabilitar elementos
  if (isDemo) {
    UI.caixaInput.attribute("disabled", true);
    UI.botaoEnviar.attribute("disabled", true);
    UI.botaoCancelar.attribute("disabled", true);
    // Adicionar uma classe CSS para deixar visualmente claro que está desabilitado
    UI.caixaInput.addClass("demo-disabled");
    UI.botaoEnviar.addClass("demo-disabled");
    UI.botaoCancelar.addClass("demo-disabled");
  } else {
    UI.caixaInput.removeAttribute("disabled");
    UI.botaoEnviar.removeAttribute("disabled");
    UI.botaoCancelar.removeAttribute("disabled");
    // Remover classes de demo se existirem
    UI.caixaInput.removeClass("demo-disabled");
    UI.botaoEnviar.removeClass("demo-disabled");
    UI.botaoCancelar.removeClass("demo-disabled");
  }

  // Chama o posicionamento após mostrar os elementos
  setTimeout(() => {
    let cardWidth = min(width * 0.8, 600);
    let cardHeight = min(height * 0.6, 400);
    posicionarElementosJustificativa(
      cardWidth,
      cardHeight,
      width / 2,
      height / 2
    );
  }, 10);
}

/*function enviarJustificativa() {
  // Não faz nada se estiver em modo demo
  if (UI.caixaInput.hasClass("demo-disabled")) return;

  let texto = UI.caixaInput.value().trim();
  if (texto.length === 0) return;

  let currentAnimal = STATE.animals[STATE.current];
  if (!currentAnimal) return;

  const tipoAtual = UI.tipoSuper;
  const videoAtual = tipoAtual === "like" ? UI.videoLike : UI.videoDislike;
  fetch("https://baxlrnntxtetxqpxdyyx.supabase.co/rest/v1/super_votes", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: CONFIG.apiKey,
      Authorization: CONFIG.apiBearer,
    },
    body: JSON.stringify({
      user_id: STATE.userId,
      animal: currentAnimal.nameComum,
      tipo: tipoAtual,
      motivo: texto,
      country: STATE.countryCode,
      timestamp: new Date().toISOString(),
    }),
  }).then(() => {
    if (tipoAtual === "like") {
      STATE.superLikesCount++;
      STATE.superLikeActive = false;
    } else {
      STATE.superDislikesCount++;
      STATE.superDislikeActive = false;
    }
    UI.tipoSuper = null;
    UI.caixaInput.hide();
    UI.botaoEnviar.hide();
    UI.botaoCancelar.hide();
    UI.caixaJustificativaVisivel = false;
    videoAtual.show();
    videoAtual.loop();
    UI.videoEmExibicao = videoAtual;
    setTimeout(() => {
      videoAtual.stop();
      videoAtual.hide();
      UI.videoEmExibicao = false;
      STATE.offsetX = 0;
      STATE.current++;
    }, 2500);
  });
}*/

function enviarJustificativa() {
  let texto = UI.caixaInput.value().trim();
  if (texto.length === 0) return;
  let currentAnimal = STATE.animals[STATE.current];
  if (!currentAnimal) return;
  const tipoAtual = UI.tipoSuper;

  // Seleciona o prefixo da sequência de imagens
  const prefix =
    tipoAtual === "like"
      ? "assets/Desmond Super Like_[#####]"
      : "assets/Desmond Super Dislike_[#####]";
  const totalFrames = 69;
  const fps = 30;
  const frameDuration = 1000 / fps;

  // Cria overlay <img> full screen
  const overlay = document.createElement("img");
  overlay.style.position = "fixed";
  overlay.style.left = "0";
  overlay.style.top = "0";
  overlay.style.width = "100vw";
  overlay.style.height = "100vh";
  overlay.style.objectFit = "cover";
  overlay.style.pointerEvents = "none";
  overlay.style.zIndex = "99999";
  document.body.appendChild(overlay);

  // Função para tocar a sequência frame a frame
  let idx = 1;
  overlay.src = `${prefix}${String(idx).padStart(2, "0")}.png`;
  overlay.style.display = "block";
  const interval = setInterval(() => {
    idx++;
    if (idx > totalFrames) {
      clearInterval(interval);
      overlay.style.display = "none";
      overlay.remove();
    } else {
      overlay.src = `${prefix}${String(idx).padStart(2, "0")}.png`;
    }
  }, frameDuration);

  // Envia para o Supabase
  fetch("https://baxlrnntxtetxqpxdyyx.supabase.co/rest/v1/super_votes", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: CONFIG.apiKey,
      Authorization: CONFIG.apiBearer,
    },
    body: JSON.stringify({
      user_id: STATE.userId,
      animal: currentAnimal.nameComum,
      tipo: tipoAtual,
      motivo: texto,
      country: STATE.countryCode,
      timestamp: new Date().toISOString(),
    }),
  }).then(() => {
    if (tipoAtual === "like") {
      STATE.superLikesCount++;
      STATE.superLikeActive = false;
    } else {
      STATE.superDislikesCount++;
      STATE.superDislikeActive = false;
    }
    UI.tipoSuper = null;
    UI.caixaInput.hide();
    UI.botaoEnviar.hide();
    UI.botaoCancelar.hide();
    UI.caixaJustificativaVisivel = false;
    STATE.offsetX = 0;
    STATE.current++;
  });
}

function cancelarJustificativa() {
  UI.tipoSuper = null;
  STATE.superLikeActive = false;
  STATE.superDislikeActive = false;

  // Remover classes de demo se existirem
  UI.caixaInput.removeClass("demo-disabled");
  UI.botaoEnviar.removeClass("demo-disabled");
  UI.botaoCancelar.removeClass("demo-disabled");

  UI.caixaInput.hide();
  UI.botaoEnviar.hide();
  UI.botaoCancelar.hide();
  UI.caixaJustificativaVisivel = false;
}

// Função específica para esconder caixa de demo no tutorial
function esconderCaixaJustificativaDemo() {
  cancelarJustificativa();
}

function enviarJustificativa() {
  let texto = UI.caixaInput.value().trim();
  if (texto.length === 0) return;
  let currentAnimal = STATE.animals[STATE.current];
  if (!currentAnimal) return;
  const tipoAtual = UI.tipoSuper;
  const videoAtual = tipoAtual === "like" ? UI.videoLike : UI.videoDislike;
  fetch("https://baxlrnntxtetxqpxdyyx.supabase.co/rest/v1/super_votes", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: CONFIG.apiKey,
      Authorization: CONFIG.apiBearer,
    },
    body: JSON.stringify({
      user_id: STATE.userId,
      animal: currentAnimal.nameComum,
      tipo: tipoAtual,
      motivo: texto,
      country: STATE.countryCode,
      timestamp: new Date().toISOString(),
    }),
  }).then(() => {
    if (tipoAtual === "like") {
      STATE.superLikesCount++;
      STATE.superLikeActive = false;
    } else {
      STATE.superDislikesCount++;
      STATE.superDislikeActive = false;
    }
    UI.tipoSuper = null;
    UI.caixaInput.hide();
    UI.botaoEnviar.hide();
    UI.botaoCancelar.hide();
    UI.caixaJustificativaVisivel = false;
    videoAtual.show();
    videoAtual.loop();
    UI.videoEmExibicao = videoAtual;
    setTimeout(() => {
      videoAtual.stop();
      videoAtual.hide();
      UI.videoEmExibicao = false;
      STATE.offsetX = 0;
      STATE.current++;
    }, 2500);
  });
}

function cancelarJustificativa() {
  UI.tipoSuper = null;
  STATE.superLikeActive = false;
  STATE.superDislikeActive = false;
  UI.caixaInput.hide();
  UI.botaoEnviar.hide();
  UI.botaoCancelar.hide();
  UI.caixaJustificativaVisivel = false;
}

// --- SUGESTÃO --- //

function makeBox(
  titulo,
  texto,
  inputRef,
  btnRef,
  btnLabel,
  boxW,
  boxH,
  isMobile,
  fontSize
) {
  const box = createDiv();
  box.class("caixa-sugestao");
  box.style("width", boxW + "px");

  if (isMobile) {
    box.style("height", boxH + "px");
  } else {
    box.style(
      "min-height",
      Math.max(260, Math.round(windowHeight * 0.35)) + "px"
    );
  }

  box.style("margin", isMobile ? "0 auto 24px auto" : "0 24px 0 24px");
  box.style("position", "relative");

  // Usar flex column e gap para espaçamento
  box.style("display", "flex");
  box.style("flex-direction", "column");
  box.style("align-items", "center");
  box.style("gap", "40px"); // aqui você ajusta o espaço entre os filhos

  // Faixa de título
  const title = createDiv(titulo);
  title.class("titulo");
  title.style("font-size", fontSize + 4 + "px");
  title.style("position", "relative");
  title.style("margin-bottom", "0px");
  title.style("top", -Math.round(boxH * 0.05) + "px"); // sobe 5% da altura da caixa
  box.child(title);

  // Texto explicativo
  const p = createP(texto);
  p.parent(box);
  p.style("font-size", fontSize + "px");
  p.style("margin", "0"); // limpar margin para usar gap

  // Campo de entrada
  UI[inputRef] = createInput("");
  UI[inputRef].class("input-padrao");
  UI[inputRef].style("width", "90%");
  UI[inputRef].style("font-size", fontSize + "px");
  UI[inputRef].style("margin", "0"); // limpar margin para usar gap
  aplicarShadow(UI[inputRef]);
  UI[inputRef].parent(box);

  // Botão
  UI[btnRef] = createButton(btnLabel);
  UI[btnRef].class("botao-padrao");
  UI[btnRef].style("width", "90%");
  UI[btnRef].style("font-size", fontSize + "px");
  UI[btnRef].style("margin", "0"); // limpar margin para usar gap
  UI[btnRef].parent(box);

  return box;
}

function desenharSugestaoFinal() {
  if (!UI.sugestaoInicializada) {
    const isMobile = windowWidth < 1000;
    const boxW = isMobile
      ? Math.min(windowWidth * 0.98, 400)
      : Math.min(windowWidth * 0.35, 420);
    const boxH = isMobile
      ? Math.max(windowHeight * 0.36, 220)
      : Math.max(windowHeight * 0.45, 260);
    const fontSize = isMobile ? Math.max(5, windowWidth * 0.03) : 18;

    // Cria ou reutiliza container geral para toda a UI da sugestão
    if (!UI.appContainer) {
      UI.appContainer = createDiv();
      UI.appContainer.id("app-container");
      UI.appContainer.style("width", "100vw");
      UI.appContainer.style("min-height", "100vh");
      UI.appContainer.style("position", "relative");
      UI.appContainer.parent(document.body);
    } else {
      UI.appContainer.html(""); // limpa conteúdo anterior, se houver
      UI.appContainer.show();
    }

    // --- Container principal ---
    UI.sugestaoContainer = createDiv();
    UI.sugestaoContainer.id("sugestao-container");
    UI.sugestaoContainer.style("display", isMobile ? "block" : "flex");
    UI.sugestaoContainer.style(
      "justify-content",
      isMobile ? "center" : "space-between"
    );
    UI.sugestaoContainer.style(
      "align-items",
      isMobile ? "center" : "flex-start"
    );
    UI.sugestaoContainer.style("width", "100vw");
    UI.sugestaoContainer.style("margin-top", isMobile ? "8vw" : "3vw");
    UI.sugestaoContainer.style("margin-bottom", "0");
    UI.sugestaoContainer.position(0, 0);
    UI.sugestaoContainer.parent(document.body);

    // --- Imagem esquerda (desktop) ---
    if (!isMobile) {
      const imgLeft = createImg(
        "https://static.vecteezy.com/system/resources/previews/013/492/866/non_2x/scorpion-silhouette-for-logo-or-graphic-design-element-format-png.png",
        "Imagem Esquerda"
      );
      imgLeft.style("width", "25vw");
      imgLeft.style("height", "auto");
      imgLeft.style("object-fit", "contain");
      imgLeft.style("align-self", "flex-start");
      imgLeft.parent(UI.sugestaoContainer);
    }

    // --- Coluna central (caixas) ---
    const centerColumn = createDiv();
    centerColumn.style("display", "flex");
    centerColumn.style("flex-direction", "column");
    centerColumn.style("align-items", "center");
    centerColumn.style("justify-content", "flex-start");
    centerColumn.style("width", isMobile ? "100%" : "35vw");
    centerColumn.style("margin", isMobile ? "0 auto" : "0");

    const boxFavorito = makeBox(
      t("titFav"),
      t("sugTxt"),
      "inputFavorito",
      "botaoEnviarFavorito",
      t("btnEnv"),
      boxW,
      boxH,
      isMobile,
      fontSize
    );
    UI.botaoEnviarFavorito.mousePressed(enviarFavorito);

    const boxOdiado = makeBox(
      t("titHate"),
      t("sugTxt"),
      "inputOdiado",
      "botaoEnviarOdiado",
      t("btnEnv"),
      boxW,
      boxH,
      isMobile,
      fontSize
    );
    UI.botaoEnviarOdiado.mousePressed(enviarOdiado);

    centerColumn.child(boxFavorito);
    centerColumn.child(boxOdiado);
    UI.sugestaoContainer.child(centerColumn);

    // --- Imagem direita (desktop) ---
    if (!isMobile) {
      const imgRight = createImg(
        "https://images.vexels.com/media/users/3/220564/isolated/preview/06c8212bfb06d6b7eb459cd7929481dd-silhueta-de-animal-em-pe-de-coelho.png",
        "Imagem Direita"
      );
      imgRight.style("width", "25vw");
      imgRight.style("height", "auto");
      imgRight.style("object-fit", "contain");
      imgRight.style("align-self", "flex-start");
      imgRight.parent(UI.sugestaoContainer);
    }

    // --- Botão de pular ---
    if (!UI.skipText) {
      UI.skipText = createDiv(t("btnPula"));
      UI.skipText.style("position", "fixed");
      UI.skipText.style("bottom", "12px");
      UI.skipText.style("right", "12px");
      UI.skipText.style("font-size", "12px");
      UI.skipText.style("color", "#666");
      UI.skipText.style("cursor", "pointer");
      UI.skipText.style("text-decoration", "underline");
      UI.skipText.style("z-index", "1000");
      UI.skipText.style("background", "transparent");
      UI.skipText.style("padding", "4px 8px");
      UI.skipText.mousePressed(() => {
        pularSugestaoFinal();
      });
      UI.skipText.parent(UI.appContainer);
    } else {
      UI.skipText.show();
    }

    UI.sugestaoInicializada = true;
    UI.mensagemSucesso = false;
  }
  desenharMensagemSucesso();
}

function drawBox(x, y, w, h, titulo, textoExplicativo) {
  stroke(CONFIG.borderColor);
  strokeWeight(4);
  fill(CONFIG.backgroundColor);
  rect(x, y, w, h);
  fill(CONFIG.borderColor);
  noStroke();
  rect(x, y - h / 2, w * 0.85, 50);
  fill("#C0B9ED");
  textAlign(CENTER, CENTER);
  textStyle(BOLD);
  textSize(22);
  text(titulo, x, y - h / 2);
  textStyle(NORMAL);
  fill(CONFIG.borderColor);
  textAlign(CENTER, TOP);
  textSize(18);
  text(textoExplicativo, x, y - h / 2 + 60, w * 0.85);
}

function enviarFavorito() {
  let texto = UI.inputFavorito.value().trim();
  if (texto.length === 0) return;
  fetch("https://baxlrnntxtetxqpxdyyx.supabase.co/rest/v1/sugestoes_animais", {
    method: "POST",
    headers: {
      apikey: CONFIG.apiKey,
      Authorization: CONFIG.apiBearer,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      user_id: STATE.userId,
      tipo: "favorito",
      sugestao: texto,
      timestamp: new Date().toISOString(),
    }),
  })
    .then(() => {
      STATE.enviadoFavorito = true;
      UI.mensagemSucesso = "favorito";
      UI.tempoMensagemSucesso = millis();
    })
    .catch((err) => {
      console.error("Erro ao enviar favorito:", err);
    });
}

function enviarOdiado() {
  let texto = UI.inputOdiado.value().trim();
  if (texto.length === 0) return;
  fetch("https://baxlrnntxtetxqpxdyyx.supabase.co/rest/v1/sugestoes_animais", {
    method: "POST",
    headers: {
      apikey: CONFIG.apiKey,
      Authorization: CONFIG.apiBearer,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      user_id: STATE.userId,
      tipo: "odiado",
      sugestao: texto,
      timestamp: new Date().toISOString(),
    }),
  })
    .then(() => {
      STATE.enviadoOdiado = true;
      UI.mensagemSucesso = "odiado";
      UI.tempoMensagemSucesso = millis();
    })
    .catch((err) => {
      console.error("Erro ao enviar odiado:", err);
    });
}

function desenharMensagemSucesso() {
  // Remove modal anterior se existir
  if (UI.sucessoModal) UI.sucessoModal.remove();

  if (!UI.mensagemSucesso) return;

  // Cria overlay/modal
  UI.sucessoModal = createDiv();
  UI.sucessoModal.id("modal-sucesso");
  UI.sucessoModal.style("position", "fixed");
  UI.sucessoModal.style("top", "0");
  UI.sucessoModal.style("left", "0");
  UI.sucessoModal.style("width", "100vw");
  UI.sucessoModal.style("height", "100vh");
  UI.sucessoModal.style("background", "rgba(0,0,0,0.35)");
  UI.sucessoModal.style("display", "flex");
  UI.sucessoModal.style("align-items", "center");
  UI.sucessoModal.style("justify-content", "center");
  UI.sucessoModal.style("z-index", "9999");

  // Caixa do modal
  const box = createDiv();
  box.style("background", "#F8F4E8");
  box.style("border", "8px solid #1A0D72");
  box.style("padding", "32px 32px 24px 32px");
  box.style("border-radius", "0");
  box.style("min-width", "320px");
  box.style("max-width", "90vw");
  box.style("box-shadow", "0 10px 10px #1A0D72");
  box.style("text-align", "center");
  box.style("position", "relative");
  box.parent(UI.sucessoModal);

  // Título
  const titulo = createDiv(t("sucssTit"));
  titulo.style("background", "#1A0D72");
  titulo.style("color", "#C0B9ED");
  titulo.style("font-weight", "bold");
  titulo.style("font-size", "1.3em");
  titulo.style("padding", "10px 0");
  titulo.style("margin-bottom", "18px");
  titulo.style("width", "100%");
  titulo.style("border-radius", "0");
  titulo.parent(box);

  // Texto explicativo
  let textoExplicativo = "";
  if (UI.mensagemSucesso === "favorito" && !STATE.enviadoOdiado) {
    textoExplicativo = t("sucssTxtLike");
  } else if (UI.mensagemSucesso === "odiado" && !STATE.enviadoFavorito) {
    textoExplicativo = t("sucssTxtDis");
  } else {
    textoExplicativo = t("sucssTxtComp");
  }
  const texto = createP(textoExplicativo);
  texto.style("color", "#1A0D72");
  texto.style("font-size", "1.1em");
  texto.style("margin", "0 0 18px 0");
  texto.parent(box);

  // Container para botões lado a lado
  const botoesContainer = createDiv();
  botoesContainer.style("display", "flex");
  botoesContainer.style("justify-content", "center");
  botoesContainer.style("gap", "16px");
  botoesContainer.style("flex-wrap", "wrap"); // para mobile, os botões podem quebrar linha se necessário
  botoesContainer.parent(box);

  // Botões
  if (
    (UI.mensagemSucesso === "favorito" && !STATE.enviadoOdiado) ||
    (UI.mensagemSucesso === "odiado" && !STATE.enviadoFavorito)
  ) {
    const btnSim = createButton(t("btnSim"));
    btnSim.class("botao-padrao");
    btnSim.style("flex", "1 1 40%"); // flex-grow 1, base 40%
    btnSim.style("min-width", "120px");
    btnSim.style("margin", "8px 0 0 0");
    btnSim.parent(botoesContainer);
    btnSim.mousePressed(() => {
      UI.mensagemSucesso = null;
      UI.sucessoModal.remove();
    });

    const btnNao = createButton(t("btnNao"));
    btnNao.class("botao-padrao");
    btnNao.style("flex", "1 1 40%");
    btnNao.style("min-width", "120px");
    btnNao.style("margin", "8px 0 0 0");
    btnNao.parent(botoesContainer);
    btnNao.mousePressed(() => {
      pularSugestaoFinal();
    });
  } else {
    // Fecha automaticamente após 4s
    setTimeout(() => {
      pularSugestaoFinal();
    }, 4000);
  }
}

function pularSugestaoFinal() {
  UI.mensagemSucesso = null;
  UI.sugestaoInicializada = false;
  if (UI.inputFavorito) UI.inputFavorito.remove();
  if (UI.inputOdiado) UI.inputOdiado.remove();
  if (UI.botaoEnviarFavorito) UI.botaoEnviarFavorito.remove();
  if (UI.botaoEnviarOdiado) UI.botaoEnviarOdiado.remove();
  if (UI.botaoPular) UI.botaoPular.remove();
  if (UI.sugestaoContainer) UI.sugestaoContainer.remove();
  if (UI.skipText) UI.skipText.remove();
  if (UI.sucessoModal) UI.sucessoModal.remove();
  UI.tela = "resultado";
  fetchTopVotes();
  fetchPaises();
  fetchNacionalidades();
  fetchTopSuperVotes();
}

// --- RESULTS (RESULTADOS) --- //// --- RESULTS (RESULTADOS) --- //
function desenharResultados() {
  // Detecta o tipo de dispositivo
  const isMobile = width < 768;
  const isTablet = width >= 768 && width < 1200;

  // Header principal
  desenharHeader();

  // Layout responsivo
  let startY = height * 0.15;

  if (isMobile) {
    desenharLayoutMobile(startY);
  } else if (isTablet) {
    desenharLayoutTablet(startY);
  } else {
    desenharLayoutDesktop(startY);
  }
}

// Header com título e similaridade
function desenharHeader() {
  textAlign(CENTER, CENTER);

  // Título principal
  let titleSize = width < 768 ? 24 : width < 1024 ? 32 : 40;
  textSize(titleSize);
  fill(CONFIG.borderColor);
  text(t("thankTit"), width / 2, height * 0.06);

  // Porcentagem de similaridade
  if (
    STATE.porcentagemSimilaridade !== null &&
    !isNaN(STATE.porcentagemSimilaridade)
  ) {
    let subtitleSize = width < 768 ? 16 : width < 1024 ? 20 : 24;
    textSize(subtitleSize);
    text(
      t("similar") + `${STATE.porcentagemSimilaridade.toFixed(1)}%`,
      width / 2,
      height * 0.1
    );
  }
}

// Layout Mobile - uma coluna vertical
function desenharLayoutMobile(startY) {
  let boxWidth = width * 0.9;
  let x = width * 0.05;
  let currentY = startY;

  currentY = desenharCaixaTopLikes(x, currentY, boxWidth);
  currentY += 30;

  currentY = desenharCaixaTopDislikes(x, currentY, boxWidth);
  currentY += 30;

  currentY = desenharCaixaOrigemVotos(x, currentY, boxWidth);
  currentY += 30;

  currentY = desenharCaixaNacionalidadeVotos(x, currentY, boxWidth);
  currentY += 30;

  desenharCaixaSuperVotos(x, currentY, boxWidth);
}

// Layout Tablet - duas colunas
function desenharLayoutTablet(startY) {
  let boxWidth = width * 0.44;
  let spacing = width * 0.04;
  let col1X = spacing;
  let col2X = width / 2 + spacing / 2;

  // Primeira linha - Top Likes e Top Dislikes
  let row1Height = max(
    desenharCaixaTopLikes(col1X, startY, boxWidth),
    desenharCaixaTopDislikes(col2X, startY, boxWidth)
  );

  let currentY = row1Height + 30;

  // Segunda linha - Origem e Nacionalidade
  let row2Height = max(
    desenharCaixaOrigemVotos(col1X, currentY, boxWidth),
    desenharCaixaNacionalidadeVotos(col2X, currentY, boxWidth)
  );

  currentY = row2Height + 30;

  // Terceira linha - Super Votos ocupando largura total
  desenharCaixaSuperVotos(spacing, currentY, width - spacing * 2);
}

// Layout Desktop - quatro colunas na primeira linha
function desenharLayoutDesktop(startY) {
  let numCols = 4;
  let spacing = width * 0.02;
  let boxWidth = (width - spacing * (numCols + 1)) / numCols;

  let col1X = spacing;
  let col2X = spacing + boxWidth + spacing;
  let col3X = spacing + (boxWidth + spacing) * 2;
  let col4X = spacing + (boxWidth + spacing) * 3;

  // Primeira linha - 4 caixas
  let row1Height = max(
    desenharCaixaTopLikes(col1X, startY, boxWidth),
    desenharCaixaTopDislikes(col2X, startY, boxWidth),
    desenharCaixaOrigemVotos(col3X, startY, boxWidth),
    desenharCaixaNacionalidadeVotos(col4X, startY, boxWidth)
  );

  let currentY = row1Height + 40;

  // Segunda linha - Super Votos centralizado
  let superWidth = boxWidth * 2;
  let superX = (width - superWidth) / 2;
  desenharCaixaSuperVotos(superX, currentY, superWidth);
}

// Caixa Top Likes
function desenharCaixaTopLikes(x, y, boxWidth) {
  let items = STATE.topLikes || [];
  let itemHeight = 45;
  let padding = 25;
  let boxHeight = items.length * itemHeight + padding * 2;

  // Desenha a caixa
  desenharCaixaComTitulo(x, y, boxWidth, boxHeight, t("topLike"));

  // Desenha os itens
  fill(CONFIG.textColor);
  noStroke();
  textAlign(CENTER, CENTER);

  items.forEach((item, i) => {
    let texto = `${item.animal} (${item.total} votos)`;
    let textY = y + padding + (i + 0.5) * itemHeight;

    // Calcula tamanho do texto que caiba na largura
    let maxWidth = boxWidth * 0.85;
    let fontSize = calcularTamanhoTexto(texto, maxWidth, itemHeight * 0.7);

    textSize(fontSize);
    text(texto, x + boxWidth / 2, textY);
  });

  return y + boxHeight;
}

// Caixa Top Dislikes
function desenharCaixaTopDislikes(x, y, boxWidth) {
  let items = STATE.topDislikes || [];
  let itemHeight = 45;
  let padding = 25;
  let boxHeight = items.length * itemHeight + padding * 2;

  // Desenha a caixa
  desenharCaixaComTitulo(x, y, boxWidth, boxHeight, t("topDislike"));

  // Desenha os itens
  fill(CONFIG.textColor);
  noStroke();
  textAlign(CENTER, CENTER);

  items.forEach((item, i) => {
    let texto = `${item.animal} (${item.total} votos)`;
    let textY = y + padding + (i + 0.5) * itemHeight;

    // Calcula tamanho do texto que caiba na largura
    let maxWidth = boxWidth * 0.85;
    let fontSize = calcularTamanhoTexto(texto, maxWidth, itemHeight * 0.7);

    textSize(fontSize);
    text(texto, x + boxWidth / 2, textY);
  });

  return y + boxHeight;
}

// Caixa Origem dos Votos (antiga Votos por País)
function desenharCaixaOrigemVotos(x, y, boxWidth) {
  let paises = STATE.paises || [];
  let itemHeight = 50;
  let padding = 25;
  let boxHeight = paises.length * itemHeight + padding * 2;

  // Desenha a caixa
  desenharCaixaComTitulo(x, y, boxWidth, boxHeight, t("origem"));

  // Desenha os países
  fill(CONFIG.textColor);
  noStroke();
  textAlign(LEFT, CENTER);

  paises.forEach((p, i) => {
    let codigo = p.country ? p.country.toLowerCase() : "unknown";
    let bandeira = STATE.bandeiras[codigo] || STATE.bandeiras["unknown"];
    let textY = y + padding + (i + 0.5) * itemHeight;

    // Desenha bandeira
    if (bandeira) {
      image(bandeira, x + 20, textY - 12, 32, 24);
    }

    // Desenha texto do país
    let texto = `${p.country} (${p.total})`;
    let maxWidth = boxWidth - 80; // Espaço para bandeira e margens
    let fontSize = calcularTamanhoTexto(texto, maxWidth, itemHeight * 0.6);

    textSize(fontSize);
    text(texto, x + 60, textY);
  });

  return y + boxHeight;
}

// Caixa Nacionalidade dos Votos (nova)
function desenharCaixaNacionalidadeVotos(x, y, boxWidth) {
  let nacionalidades = STATE.nacionalidades || [];
  let itemHeight = 50;
  let padding = 25;
  let boxHeight = nacionalidades.length * itemHeight + padding * 2;

  // Desenha a caixa
  desenharCaixaComTitulo(x, y, boxWidth, boxHeight, t("nacionalidades"));

  // Desenha as nacionalidades
  fill(CONFIG.textColor);
  noStroke();
  textAlign(LEFT, CENTER);

  nacionalidades.forEach((n, i) => {
    let codigo = n.nacionalidade ? n.nacionalidade.toLowerCase() : "unknown";
    let bandeira = STATE.bandeiras[codigo] || STATE.bandeiras["unknown"];
    let textY = y + padding + (i + 0.5) * itemHeight;

    // Desenha bandeira
    if (bandeira) {
      image(bandeira, x + 20, textY - 12, 32, 24);
    }

    // Desenha texto da nacionalidade
    let texto = `${n.nacionalidade} (${n.total})`;
    let maxWidth = boxWidth - 80; // Espaço para bandeira e margens
    let fontSize = calcularTamanhoTexto(texto, maxWidth, itemHeight * 0.6);

    textSize(fontSize);
    text(texto, x + 60, textY);
  });

  return y + boxHeight;
}

// Caixa Super Votos
function desenharCaixaSuperVotos(x, y, boxWidth) {
  let superLikes = STATE.topSuperLikes || [];
  let superDislikes = STATE.topSuperDislikes || [];
  let maxItems = max(superLikes.length, superDislikes.length);

  let itemHeight = 45;
  let padding = 25;
  let boxHeight = maxItems * itemHeight + padding * 2;

  // Desenha a caixa
  desenharCaixaComTitulo(x, y, boxWidth, boxHeight, t("topSuper"));

  fill(CONFIG.textColor);
  noStroke();
  textAlign(LEFT, CENTER);

  let colWidth = (boxWidth - 60) / 2; // Duas colunas

  // Super Likes (coluna esquerda)
  superLikes.forEach((item, i) => {
    let texto = `💖 ${item.animal} (${item.total})`;
    let textY = y + padding + (i + 0.5) * itemHeight;
    let fontSize = calcularTamanhoTexto(
      texto,
      colWidth * 0.9,
      itemHeight * 0.6
    );

    textSize(fontSize);
    text(texto, x + 20, textY);
  });

  // Super Dislikes (coluna direita)
  superDislikes.forEach((item, i) => {
    let texto = `💔 ${item.animal} (${item.total})`;
    let textY = y + padding + (i + 0.5) * itemHeight;
    let fontSize = calcularTamanhoTexto(
      texto,
      colWidth * 0.9,
      itemHeight * 0.6
    );

    textSize(fontSize);
    text(texto, x + colWidth + 40, textY);
  });

  return y + boxHeight;
}

// Função para calcular tamanho de texto que caiba na área
function calcularTamanhoTexto(texto, maxWidth, maxHeight) {
  let fontSize = maxHeight;
  textSize(fontSize);

  // Reduz o tamanho até caber na largura
  while (textWidth(texto) > maxWidth && fontSize > 8) {
    fontSize -= 0.5;
    textSize(fontSize);
  }

  return max(fontSize, 8); // Tamanho mínimo de 8px
}

// Função para desenhar caixa com título
function desenharCaixaComTitulo(x, y, w, h, titulo) {
  // Caixa principal
  fill(CONFIG.backgroundColor);
  stroke(CONFIG.borderColor);
  strokeWeight(4);
  rect(x, y, w, h);

  // Faixa do título
  let faixaAltura = 35;
  let faixaLargura = min(textWidth(titulo) + 30, w * 0.8);
  let faixaX = x + (w - faixaLargura) / 2;
  let faixaY = y - faixaAltura / 2;

  fill(CONFIG.borderColor);
  noStroke();
  rect(faixaX, faixaY, faixaLargura, faixaAltura);

  // Texto do título
  fill("#C0B9ED");
  textStyle(BOLD);
  textAlign(CENTER, CENTER);

  let titleSize = calcularTamanhoTexto(
    titulo,
    faixaLargura * 0.9,
    faixaAltura * 0.6
  );
  textSize(titleSize);
  text(titulo, faixaX + faixaLargura / 2, faixaY + faixaAltura / 2);
  textStyle(NORMAL);
}

// --- API HELPERS (mantidos como estavam) --- //
function compararComOutros() {
  fetch("https://baxlrnntxtetxqpxdyyx.supabase.co/rest/v1/likes_and_dislikes", {
    method: "GET",
    headers: {
      apikey: CONFIG.apiKey,
      Authorization: CONFIG.apiBearer,
    },
  })
    .then((res) => res.json())
    .then((data) => {
      let meusVotos = data.filter((v) => v.user_id === STATE.userId);
      let outros = data.filter((v) => v.user_id !== STATE.userId);
      let iguais = 0;
      meusVotos.forEach((meu) => {
        let votosAnimal = outros.filter((v) => v.animal === meu.animal);
        if (votosAnimal.length === 0) return;
        let likes = votosAnimal.filter((v) => v.vote === "like").length;
        let dislikes = votosAnimal.filter((v) => v.vote === "dislike").length;
        let maioria = likes >= dislikes ? "like" : "dislike";
        if (meu.vote === maioria) iguais++;
      });
      STATE.porcentagemSimilaridade = (iguais / meusVotos.length) * 100;
      STATE.comparando = true;
    })
    .catch((err) => console.error("Erro ao comparar votos:", err));
}

function fetchTopVotes() {
  fetch("https://baxlrnntxtetxqpxdyyx.supabase.co/rest/v1/rpc/top_likes", {
    method: "POST",
    headers: {
      apikey: CONFIG.apiKey,
      Authorization: CONFIG.apiBearer,
      "Content-Type": "application/json",
      Prefer: "return=representation",
    },
  })
    .then((res) => res.json())
    .then((data) => {
      STATE.topLikes = data;
    });
  fetch("https://baxlrnntxtetxqpxdyyx.supabase.co/rest/v1/rpc/top_dislikes", {
    method: "POST",
    headers: {
      apikey: CONFIG.apiKey,
      Authorization: CONFIG.apiBearer,
      "Content-Type": "application/json",
      Prefer: "return=representation",
    },
  })
    .then((res) => res.json())
    .then((data) => {
      STATE.topDislikes = data;
    });
}

function fetchPaises() {
  fetch(
    "https://baxlrnntxtetxqpxdyyx.supabase.co/rest/v1/rpc/unique_voters_by_country",
    {
      method: "POST",
      headers: {
        apikey: CONFIG.apiKey,
        Authorization: CONFIG.apiBearer,
      },
    }
  )
    .then((res) => res.json())
    .then((data) => {
      STATE.paises = data;
      STATE.paises.forEach((p) => {
        let code = p.country.toLowerCase();
        STATE.bandeiras[code] = loadImage(
          `https://flagcdn.com/32x24/${code}.png`
        );
      });
    })
    .catch((err) => console.error("Erro ao buscar países:", err));
}

function fetchTopSuperVotes() {
  fetch(
    "https://baxlrnntxtetxqpxdyyx.supabase.co/rest/v1/rpc/top_super_likes",
    {
      method: "POST",
      headers: {
        apikey: CONFIG.apiKey,
        Authorization: CONFIG.apiBearer,
        "Content-Type": "application/json",
        Prefer: "return=representation",
      },
      body: JSON.stringify({}),
    }
  )
    .then((res) => res.json())
    .then((data) => {
      STATE.topSuperLikes = data;
    });
  fetch(
    "https://baxlrnntxtetxqpxdyyx.supabase.co/rest/v1/rpc/top_super_dislikes",
    {
      method: "POST",
      headers: {
        apikey: CONFIG.apiKey,
        Authorization: CONFIG.apiBearer,
        "Content-Type": "application/json",
        Prefer: "return=representation",
      },
      body: JSON.stringify({}),
    }
  )
    .then((res) => res.json())
    .then((data) => {
      STATE.topSuperDislikes = data;
    });
}

function fetchNacionalidades() {
  fetch(
    "https://baxlrnntxtetxqpxdyyx.supabase.co/rest/v1/rpc/unique_voters_by_nacionalidade",
    {
      method: "POST",
      headers: {
        apikey: CONFIG.apiKey,
        Authorization: CONFIG.apiBearer,
      },
    }
  )
    .then((res) => res.json())
    .then((data) => {
      STATE.nacionalidades = data;
    })
    .catch((err) => console.error("Erro ao buscar nacionalidades:", err));
}
