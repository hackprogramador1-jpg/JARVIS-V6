// ============================================================
// JARVIS V6 — CONTROL CENTER
// Centro de controle principal
// ============================================================

import {
  initializeEngine,
  getEngineStatus,
  restartEngine
} from "./engine.js";

import {
  initializeVoice,
  startListening,
  stopListening,
  stopSpeaking,
  getVoiceStatus
} from "./voice.js";

import {
  initializeSecurity,
  getSecurityManagerState
} from "../security/manager.js";

import {
  getSettings,
  setSetting
} from "./settings.js";

import {
  getBrainState,
  setBrainStatus
} from "./state.js";

import {
  emit,
  EVENTS
} from "./events.js";


// ============================================================
// VERSÃO
// ============================================================

export const CONTROL_VERSION = "1.0.0";


// ============================================================
// ESTADO
// ============================================================

let initialized =
  false;

let active =
  false;

let paused =
  false;

let lastAction =
  null;

let lastError =
  null;


// ============================================================
// INICIALIZAÇÃO
// ============================================================

export function initializeControl(
  owner = null
) {

  try {

    initializeSecurity(
      owner
    );

    initializeEngine(
      owner
    );

    initializeVoice();


    initialized =
      true;

    active =
      true;

    paused =
      false;

    lastError =
      null;


    emit(
      EVENTS.SYSTEM_READY,
      {
        source:
          "control",

        version:
          CONTROL_VERSION
      }
    );


    return {

      ok: true,

      active,

      paused,

      version:
        CONTROL_VERSION

    };

  } catch (error) {

    initialized =
      false;

    active =
      false;

    lastError =
      error.message;


    return {

      ok: false,

      error:
        lastError

    };
  }
}


// ============================================================
// ATIVAR JARVIS
// ============================================================

export function activate() {

  if (!initialized) {

    initializeControl();
  }


  active =
    true;

  paused =
    false;


  setBrainStatus(
    "idle"
  );


  return {

    ok: true,

    active: true,

    paused: false

  };
}


// ============================================================
// PAUSAR
// ============================================================

export function pause() {

  active =
    false;

  paused =
    true;


  stopListening();

  stopSpeaking();


  return {

    ok: true,

    active: false,

    paused: true

  };
}


// ============================================================
// RETOMAR
// ============================================================

export function resume() {

  active =
    true;

  paused =
    false;


  setBrainStatus(
    "idle"
  );


  return {

    ok: true,

    active: true,

    paused: false

  };
}


// ============================================================
// DESLIGAR
// ============================================================

export function shutdown() {

  stopListening();

  stopSpeaking();


  active =
    false;

  paused =
    false;


  setBrainStatus(
    "idle"
  );


  return {

    ok: true,

    active: false

  };
}


// ============================================================
// REINICIAR
// ============================================================

export function restart(
  owner = null
) {

  try {

    stopListening();

    stopSpeaking();


    active =
      false;


    const result =
      restartEngine(
        owner
      );


    if (
      result?.ok === false
    ) {

      throw new Error(
        result.error ||
        "Falha ao reiniciar o Engine."
      );
    }


    initializeVoice();


    active =
      true;

    paused =
      false;

    lastError =
      null;


    return {

      ok: true,

      active: true,

      restarted:
        true

    };

  } catch (error) {

    lastError =
      error.message;

    active =
      false;


    return {

      ok: false,

      error:
        lastError

    };
  }
}


// ============================================================
// ATIVAR VOZ
// ============================================================

export function enableVoice() {

  const result =
    initializeVoice();


  if (
    result?.ok === false
  ) {

    return result;
  }


  setSetting(
    "voice.enabled",
    true
  );


  return {

    ok: true,

    enabled: true

  };
}


// ============================================================
// DESATIVAR VOZ
// ============================================================

export function disableVoice() {

  stopListening();

  stopSpeaking();


  setSetting(
    "voice.enabled",
    false
  );


  return {

    ok: true,

    enabled: false

  };
}


// ============================================================
// COMEÇAR ESCUTA
// ============================================================

export function startVoice() {

  if (!active) {

    return {

      ok: false,

      error:
        "JARVIS está desativado."
    };
  }


  const settings =
    getSettings();


  if (
    settings.voice?.enabled ===
    false
  ) {

    return {

      ok: false,

      error:
        "Sistema de voz desativado."
    };
  }


  return startListening({
    language:
      settings.language,

    continuous:
      false,

    interimResults:
      true

  });
}


// ============================================================
// PARAR ESCUTA
// ============================================================

export function stopVoice() {

  return stopListening();
}


// ============================================================
// STATUS COMPLETO
// ============================================================

export function getControlStatus() {

  return {

    ok:
      initialized,

    version:
      CONTROL_VERSION,

    initialized,

    active,

    paused,

    lastAction,

    lastError,

    engine:
      getEngineStatus(),

    voice:
      getVoiceStatus(),

    security:
      getSecurityManagerState(),

    brain:
      getBrainState(),

    settings:
      getSettings()

  };
}


// ============================================================
// EXECUTAR AÇÃO
// ============================================================

export function executeControlAction(
  action
) {

  const normalized =
    String(
      action || ""
    )
      .trim()
      .toLowerCase();


  lastAction =
    normalized;


  switch (
    normalized
  ) {

    case "activate":

      return activate();


    case "pause":

      return pause();


    case "resume":

      return resume();


    case "shutdown":

      return shutdown();


    case "restart":

      return restart();


    case "voice_on":

      return enableVoice();


    case "voice_off":

      return disableVoice();


    case "listen":

      return startVoice();


    case "stop_listening":

      return stopVoice();


    default:

      return {

        ok: false,

        error:
          "Ação de controle desconhecida.",

        action:
          normalized

      };
  }
}


// ============================================================
// DIAGNÓSTICO
// ============================================================

export function diagnoseControl() {

  const status =
    getControlStatus();


  return {

    ok:
      status.ok,

    version:
      CONTROL_VERSION,

    initialized:
      status.initialized,

    active:
      status.active,

    paused:
      status.paused,

    engine:
      status.engine?.ok ??
      false,

    voice:
      status.voice?.supported ??
      false,

    security:
      status.security?.ok ??
      false,

    lastError:
      status.lastError,

    timestamp:
      new Date().toISOString()

  };
}


// ============================================================
// INFORMAÇÕES
// ============================================================

export function getControlInfo() {

  return {

    name:
      "JARVIS Control Center",

    version:
      CONTROL_VERSION,

    capabilities: [

      "activate",

      "pause",

      "resume",

      "shutdown",

      "restart",

      "voice control",

      "engine control",

      "security state",

      "system diagnostics"

    ]

  };
}
