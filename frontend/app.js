// ============================================================
// JARVIS V6 — APLICATIVO DE FRONTEND
// Conexão oficial com o núcleo JARVIS V6
// ============================================================

import {
  initializeEngine,
  processInput,
  processChat,
  processCommand,
  getEngineStatus,
  diagnoseEngine
} from "../brain/engine.js";

import {
  listen,
  stopListen,
  stopTalk,
  getVoiceManagerStatus
} from "../brain/voice-manager.js";

import {
  getSession
} from "../brain/session.js";

import {
  getSettings
} from "../brain/settings.js";

import {
  on
} from "../brain/events.js";


// ============================================================
// ELEMENTOS
// ============================================================

const $ = (selector) => document.querySelector(selector);

const app = $("#jarvis-app");

const commandForm = $("#command-form");
const commandInput = $("#command-input");
const sendButton = $("#send-button");

const voiceButton = $("#voice-button");
const stopVoiceButton = $("#stop-voice-button");

const mensagens = $("#mensagens");
const assistantMessage = $("#assistant-message");

const systemStatus = $("#system-status");
const systemStatusText = $("#system-status-text");

const coreState = $("#core-state");
const coreOrb = $("#core-orb");

const debugPanel = $("#debug-panel");
const debugOutput = $("#debug-output");
const closeDebug = $("#close-debug");

const navigation = document.querySelectorAll(".nav-item");


// ============================================================
// ESTADO DA INTERFACE
// ============================================================

const UI = {
  inicializado: false,
  processando: false,
  ouvindo: false,
  falando: false,
  secaoAtual: "core"
};


// ============================================================
// UTILIDADES
// ============================================================

function setCoreState(state) {
  if (!coreState) return;

  coreState.textContent = String(state || "STANDBY").toUpperCase();

  if (coreOrb) {
    coreOrb.dataset.state = String(state || "standby").toLowerCase();
  }
}


function setAssistantMessage(text) {
  if (!assistantMessage) return;

  assistantMessage.textContent =
    text || "Sistema aguardando comando.";
}


function setSystemStatus(online, text = null) {
  if (!systemStatus) return;

  systemStatus.classList.toggle("online", online);
  systemStatus.classList.toggle("offline", !online);

  if (systemStatusText) {
    systemStatusText.textContent =
      text || (online ? "ONLINE" : "OFFLINE");
  }
}


function adicionarMensagem(tipo, texto) {
  if (!mensagens || !texto) return;

  const elemento = document.createElement("div");

  elemento.className = `message message-${tipo}`;

  elemento.textContent = texto;

  mensagens.appendChild(elemento);

  mensagens.scrollTop = mensagens.scrollHeight;
}


function mostrarProcessamento() {
  UI.processando = true;

  setCoreState("THINKING");

  setAssistantMessage("Processando comando...");

  if (sendButton) {
    sendButton.disabled = true;
  }
}


function esconderProcessamento() {
  UI.processando = false;

  if (sendButton) {
    sendButton.disabled = false;
  }
}


function extrairResposta(resultado) {
  if (!resultado) return null;

  if (typeof resultado === "string") {
    return resultado;
  }

  const candidatos = [
    resultado.response,
    resultado.resposta,
    resultado.message,
    resultado.mensagem,
    resultado.text,
    resultado.output,
    resultado.result?.response,
    resultado.result?.resposta,
    resultado.result?.message,
    resultado.result?.mensagem,
    resultado.result?.text,
    resultado.result?.output,
    resultado.data?.response,
    resultado.data?.message
  ];

  for (const candidato of candidatos) {
    if (
      typeof candidato === "string" &&
      candidato.trim()
    ) {
      return candidato.trim();
    }
  }

  return null;
}


function extrairErro(resultado) {
  if (!resultado) return null;

  const candidatos = [
    resultado.error,
    resultado.erro,
    resultado.result?.error,
    resultado.result?.erro,
    resultado.data?.error
  ];

  for (const candidato of candidatos) {
    if (
      typeof candidato === "string" &&
      candidato.trim()
    ) {
      return candidato.trim();
    }
  }

  return null;
}


// ============================================================
// INICIALIZAÇÃO
// ============================================================

async function inicializarAplicativo() {
  try {

    setCoreState("INITIALIZING");

    setSystemStatus(false, "INITIALIZING");

    setAssistantMessage("Inicializando núcleo JARVIS...");


    const resultado = await initializeEngine();


    if (resultado?.ok === false) {
      throw new Error(
        resultado.error ||
        resultado.erro ||
        "Falha ao inicializar o núcleo."
      );
    }


    UI.inicializado = true;


    setSystemStatus(true, "ONLINE");

    setCoreState("READY");

    setAssistantMessage(
      "JARVIS V6 online. Sistema pronto."
    );


    adicionarMensagem(
      "system",
      "Núcleo JARVIS V6 inicializado."
    );


    atualizarStatus();


  } catch (erro) {

    console.error(
      "Erro ao inicializar JARVIS:",
      erro
    );


    UI.inicializado = false;


    setSystemStatus(false, "OFFLINE");

    setCoreState("ERROR");

    setAssistantMessage(
      "Falha ao inicializar o núcleo JARVIS."
    );


    adicionarMensagem(
      "error",
      `ERRO: ${erro.message || erro}`
    );

  }
}


// ============================================================
// PROCESSAMENTO DE TEXTO
// ============================================================

async function processarEntrada(texto) {

  if (!texto || !texto.trim()) {
    return;
  }


  const entrada = texto.trim();


  adicionarMensagem(
    "user",
    entrada
  );


  mostrarProcessamento();


  try {

    let resultado;


    // O núcleo principal recebe primeiro o comando.
    resultado = await processInput(entrada);


    let resposta = extrairResposta(resultado);


    // Caso seja uma conversa que precise da IA,
    // enviamos diretamente para o módulo de chat.
    if (!resposta) {

      const intent =
        resultado?.intent ||
        resultado?.result?.intent ||
        resultado?.analysis?.intent;

      const route =
        resultado?.route ||
        resultado?.result?.route ||
        resultado?.analysis?.route;


      if (
        intent === "chat" ||
        route === "ai" ||
        route === "unknown" ||
        !intent
      ) {

        resultado = await processChat(entrada);

        resposta = extrairResposta(resultado);
      }
    }


    if (!resposta) {

      const erro =
        extrairErro(resultado) ||
        "Não consegui obter uma resposta do núcleo.";

      throw new Error(erro);
    }


    setCoreState("RESPONDING");

    setAssistantMessage(resposta);

    adicionarMensagem(
      "assistant",
      resposta
    );


    set
