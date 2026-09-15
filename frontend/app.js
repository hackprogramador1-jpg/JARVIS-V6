// ============================================================
// JARVIS V6 — FRONTEND APP
// Conexão da interface com o núcleo JARVIS
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

const $ = (selector) =>
  document.querySelector(selector);

const app = $("#jarvis-app");
const commandForm = $("#command-form");
const commandInput = $("#command-input");
const sendButton = $("#send-button");

const voiceButton = $("#voice-button");
const stopVoiceButton = $("#stop-voice-button");

const messages = $("#messages");
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
  initialized: false,
  processing: false,
  listening: false,
  speaking: false,
  currentSection: "core"
};

// ============================================================
// INICIALIZAÇÃO
// ============================================================

async function initializeApp() {
  try {
    setCoreState("INITIALIZING");
    setAssistantMessage("Inicializando núcleo JARVIS...");

    const result = initializeEngine();

    if (result?.ok === false) {
      throw new Error(
        result.error || "Falha ao inicializar engine."
      );
    }

    UI.initialized = true;

    updateSystemStatus(true);

    setCoreState("READY");

    setAssistantMessage(
      "JARVIS V6 online. Sistema pronto."
    );

    addMessage(
      "system",
      "Núcleo JARVIS V6 inicializado."
    );

    setupEvents();

    updateStatus();

  } catch (error) {
    console.error(error);

    UI.initialized = false;

    updateSystemStatus(false);

    setCoreState("ERROR");

    setAssistantMessage(
      "Falha ao inicializar o núcleo."
    );

    addMessage(
      "system",
      `Erro: ${error?.message || "desconhecido"}`
    );
  }
}

// ============================================================
// EVENTOS
// ============================================================

function setupEvents() {

  commandForm?.addEventListener(
    "submit",
    async (event) => {
      event.preventDefault();

      const input = commandInput?.value?.trim();

      if (!input) {
        return;
      }

      commandInput.value = "";

      await handleInput(input);
    }
  );

  voiceButton?.addEventListener(
    "click",
    async () => {
      await startVoice();
    }
  );

  stopVoiceButton?.addEventListener(
    "click",
    () => {
      stopVoice();
    }
  );

  closeDebug?.addEventListener(
    "click",
    () => {
      closeDebugPanel();
    }
  );

  navigation.forEach((button) => {

    button.addEventListener(
      "click",
      () => {

        const section =
          button.dataset.section;

        if (!section) {
          return;
        }

        changeSection(section);
      }
    );

  });

  // Eventos do sistema

  try {

    on(
      "system:ready",
      () => {
        updateSystemStatus(true);
      }
    );

    on(
      "system:error",
      (event) => {

        console.error(
          "JARVIS system error:",
          event
        );

        updateSystemStatus(false);
      }
    );

    on(
      "input",
      () => {
        setCoreState("ANALYZING");
      }
    );

    on(
      "thinking",
      () => {
        setCoreState("THINKING");
      }
    );

    on(
      "ai:request",
      () => {
        setCoreState("THINKING");
      }
    );

    on(
      "ai:response",
      () => {
        setCoreState("RESPONDING");
      }
    );

    on(
      "voice:started",
      () => {
        UI.listening = true;
        setCoreState("LISTENING");
      }
    );

    on(
      "voice:stopped",
      () => {
        UI.listening = false;

        if (!UI.processing) {
          setCoreState("READY");
        }
      }
    );

  } catch (error) {
    console.warn(
      "Event system indisponível:",
      error
    );
  }
}

// ============================================================
// ENTRADA PRINCIPAL
// ============================================================

async function handleInput(input) {

  if (UI.processing) {
    return;
  }

  UI.processing = true;

  setCoreState("ANALYZING");

  addMessage("user", input);

  try {

    /*
     * O engine decide internamente se deve:
     * - executar comando
     * - consultar memória
     * - pesquisar
     * - usar IA
     */

    const result =
      await processInput(input);

    const response =
      extractResponse(result);

    if (response) {

      addMessage(
        "assistant",
        response
      );

      setAssistantMessage(
        response
      );

      setCoreState("RESPONDING");

    } else {

      // Fallback para IA

      const aiResult =
        await processChat(input);

      const aiResponse =
        extractResponse(aiResult);

      if (aiResponse) {

        addMessage(
          "assistant",
          aiResponse
        );

        setAssistantMessage(
          aiResponse
        );

        setCoreState("RESPONDING");

      } else {

        setAssistantMessage(
          "Não consegui obter uma resposta."
        );

        setCoreState("READY");
      }
    }

  } catch (error) {

    console.error(error);

    const message =
      error?.message ||
      "Ocorreu um erro ao processar o comando.";

    addMessage(
      "system",
      message
    );

    setAssistantMessage(
      message
    );

    setCoreState("ERROR");

  } finally {

    UI.processing = false;

    setTimeout(() => {

      if (!UI.listening) {
        setCoreState("READY");
      }

    }, 1200);
  }
}

// ============================================================
// EXTRAIR RESPOSTA
// ============================================================

function extractResponse(result) {

  if (!result) {
    return "";
  }

  if (typeof result === "string") {
    return result;
  }

  if (typeof result.response === "string") {
    return result.response;
  }

  if (typeof result.result?.response === "string") {
    return result.result.response;
  }

  if (typeof result.result?.result === "string") {
    return result.result.result;
  }

  if (typeof result.output === "string") {
    return result.output;
  }

  if (typeof result.message === "string") {
    return result.message;
  }

  return "";
}

// ============================================================
// VOZ
// ============================================================

async function startVoice() {

  if (UI.listening) {
    return;
  }

  try {

    UI.listening = true;

    setCoreState("LISTENING");

    setAssistantMessage(
      "Estou ouvindo..."
    );

    await listen();

  } catch (error) {

    UI.listening = false;

    setCoreState("ERROR");

    addMessage(
      "system",
      error?.message ||
      "Não foi possível iniciar o microfone."
    );
  }
}

function stopVoice() {

  try {

    stopListen();

  } catch (_) {}

  try {

    stopTalk();

  } catch (_) {}

  UI.listening = false;
  UI.speaking = false;

  setCoreState("READY");

  setAssistantMessage(
    "Escuta encerrada."
  );
}

// ============================================================
// STATUS
// ============================================================

function updateStatus() {

  try {

    const status =
      getEngineStatus();

    const online =
      status?.ok !== false &&
      status?.engine?.running !== false;

    updateSystemStatus(online);

  } catch (error) {

    console.warn(
      "Erro ao atualizar status:",
      error
    );

    updateSystemStatus(false);
  }
}

function updateSystemStatus(online) {

  if (!systemStatus) {
    return;
  }

  systemStatus.classList.toggle(
    "online",
    Boolean(online)
  );

  systemStatus.classList.toggle(
    "offline",
    !online
  );

  if (systemStatusText) {

    systemStatusText.textContent =
      online
        ? "ONLINE"
        : "OFFLINE";
  }
}

// ============================================================
// CORE VISUAL
// ============================================================

function setCoreState(state) {

  if (coreState) {
    coreState.textContent =
      String(state).toUpperCase();
  }

  if (!coreOrb) {
    return;
  }

  coreOrb.dataset.state =
    String(state).toLowerCase();
}

function setAssistantMessage(text) {

  if (!assistantMessage) {
    return;
  }

  assistantMessage.textContent =
    text || "";
}

// ============================================================
// MENSAGENS
// ============================================================

function addMessage(type, text) {

  if (!messages || !text) {
    return;
  }

  const element =
    document.createElement("div");

  element.className =
    `message ${type}`;

  element.textContent =
    text;

  messages.appendChild(element);

  messages.scrollTop =
    messages.scrollHeight;
}

// ============================================================
// NAVEGAÇÃO
// ============================================================

function changeSection(section) {

  UI.currentSection =
    section;

  navigation.forEach(
    (button) => {

      button.classList.toggle(
        "active",
        button.dataset.section === section
      );

    }
  );

  switch (section) {

    case "core":

      setAssistantMessage(
        "Núcleo JARVIS ativo."
      );

      break;

    case "memory":

      setAssistantMessage(
        "Memória do JARVIS."
      );

      break;

    case "automation":

      setAssistantMessage(
        "Central de automações."
      );

      break;

    case "workflow":

      setAssistantMessage(
        "Central de workflows."
      );

      break;

    case "settings":

      setAssistantMessage(
        "Configurações do sistema."
      );

      break;

    default:

      setAssistantMessage(
        "JARVIS V6."
      );
  }
}

// ============================================================
// DIAGNÓSTICO
// ============================================================

export function openDiagnostic() {

  if (!debugPanel || !debugOutput) {
    return;
  }

  debugPanel.hidden = false;

  debugOutput.textContent =
    "Executando diagnóstico...";

  try {

    const result =
      diagnoseEngine();

    debugOutput.textContent =
      JSON.stringify(
        result,
        null,
        2
      );

  } catch (error) {

    debugOutput.textContent =
      JSON.stringify(
        {
          ok: false,
          error:
            error?.message ||
            "Falha no diagnóstico."
        },
        null,
        2
      );
  }
}

function closeDebugPanel() {

  if (debugPanel) {
    debugPanel.hidden = true;
  }
}

// ============================================================
// API GLOBAL PARA DEBUG
// ============================================================

window.JARVIS = {

  version: "6.0.0",

  input: handleInput,

  chat: processChat,

  command: processCommand,

  voice: {
    start: startVoice,
    stop: stopVoice,
    status: getVoiceManagerStatus
  },

  status: getEngineStatus,

  diagnose: openDiagnostic,

  session: getSession,

  settings: getSettings
};

// ============================================================
// INICIAR
// ============================================================

initializeApp();
