// ============================================================
// JARVIS V6 — VOICE MANAGER
// Gerenciador central de voz, fala e reconhecimento
// ============================================================

import {
  initializeVoice,
  startListening,
  stopListening,
  abortListening,
  speak,
  stopSpeaking,
  processVoice,
  enableVoicePipeline,
  getVoiceStatus,
  diagnoseVoice,
  getVoiceInfo
} from "./voice.js";

import {
  getSettings,
  setVoiceSettings
} from "./settings.js";

import {
  emit
} from "./events.js";

export const VOICE_MANAGER_VERSION = "1.0.0";

// ============================================================
// ESTADO
// ============================================================

let initialized = false;
let active = false;

// ============================================================
// INICIALIZAÇÃO
// ============================================================

export function initializeVoiceManager() {
  try {
    initializeVoice();

    initialized = true;

    emit("system:ready", {
      module: "voice-manager",
      version: VOICE_MANAGER_VERSION
    });

    return {
      ok: true,
      initialized: true,
      version: VOICE_MANAGER_VERSION
    };

  } catch (error) {
    return {
      ok: false,
      initialized: false,
      error: error?.message || "Erro ao inicializar voz."
    };
  }
}

// ============================================================
// ATIVAR
// ============================================================

export function activateVoiceManager() {
  if (!initialized) {
    initializeVoiceManager();
  }

  active = true;

  enableVoicePipeline();

  emit("voice:started", {
    source: "voice-manager"
  });

  return {
    ok: true,
    active: true
  };
}

// ============================================================
// DESATIVAR
// ============================================================

export function deactivateVoiceManager() {
  active = false;

  try {
    stopListening();
    stopSpeaking();
  } catch (_) {}

  emit("voice:stopped", {
    source: "voice-manager"
  });

  return {
    ok: true,
    active: false
  };
}

// ============================================================
// ESCUTAR
// ============================================================

export function listen() {
  if (!initialized) {
    initializeVoiceManager();
  }

  active = true;

  const result = startListening();

  emit("voice:started", {
    source: "voice-manager",
    result
  });

  return result;
}

// ============================================================
// PARAR ESCUTA
// ============================================================

export function stopListen() {
  const result = stopListening();

  emit("voice:stopped", {
    source: "voice-manager",
    result
  });

  return result;
}

// ============================================================
// ABORTAR ESCUTA
// ============================================================

export function abortListen() {
  return abortListening();
}

// ============================================================
// FALAR
// ============================================================

export function talk(text, options = {}) {
  if (!text) {
    return {
      ok: false,
      error: "Texto não informado."
    };
  }

  const settings = getSettings();

  const voiceSettings = {
    ...(settings?.voice || {}),
    ...(options || {})
  };

  emit("ai:response", {
    source: "voice-manager",
    text
  });

  return speak(text, voiceSettings);
}

// ============================================================
// PARAR FALA
// ============================================================

export function stopTalk() {
  return stopSpeaking();
}

// ============================================================
// PROCESSAR VOZ
// ============================================================

export async function processVoiceInput(options = {}) {
  if (!initialized) {
    initializeVoiceManager();
  }

  active = true;

  try {
    const result = await processVoice(options);

    return {
      ok: result?.ok !== false,
      result
    };

  } catch (error) {
    return {
      ok: false,
      error: error?.message || "Erro ao processar voz."
    };
  }
}

// ============================================================
// CONFIGURAÇÕES
// ============================================================

export function configureVoice(options = {}) {
  if (!options || typeof options !== "object") {
    return {
      ok: false,
      error: "Configuração inválida."
    };
  }

  const result = setVoiceSettings(options);

  return {
    ok: result?.ok !== false,
    settings: getSettings()?.voice || {}
  };
}

// ============================================================
// ATIVA/DESATIVA VOZ AUTOMÁTICA
// ============================================================

export function setVoiceEnabled(enabled) {
  return configureVoice({
    enabled: Boolean(enabled)
  });
}

export function setAutoSpeak(enabled) {
  return configureVoice({
    autoSpeak: Boolean(enabled)
  });
}

// ============================================================
// STATUS
// ============================================================

export function getVoiceManagerStatus() {
  return {
    ok: true,
    version: VOICE_MANAGER_VERSION,
    initialized,
    active,
    voice: getVoiceStatus(),
    settings: getSettings()?.voice || {}
  };
}

// ============================================================
// DIAGNÓSTICO
// ============================================================

export function diagnoseVoiceManager() {
  let voice;

  try {
    voice = diagnoseVoice();
  } catch (error) {
    voice = {
      ok: false,
      error: error?.message || "Falha no diagnóstico da voz."
    };
  }

  return {
    ok: voice?.ok !== false,
    version: VOICE_MANAGER_VERSION,
    initialized,
    active,
    voice,
    settings: getSettings()?.voice || {}
  };
}

// ============================================================
// INFORMAÇÕES
// ============================================================

export function getVoiceManagerInfo() {
  return {
    version: VOICE_MANAGER_VERSION,

    initialized,

    active,

    voice: getVoiceInfo(),

    settings: getSettings()?.voice || {}
  };
}

// ============================================================
// TESTE
// ============================================================

export async function testVoiceManager() {
  try {
    initializeVoiceManager();

    const status = getVoiceManagerStatus();

    return {
      ok: status?.ok !== false,
      manager: true,
      status
    };

  } catch (error) {
    return {
      ok: false,
      manager: false,
      error: error?.message || "Teste de voz falhou."
    };
  }
}

// ============================================================
// AUTO-INICIALIZAÇÃO
// ============================================================

initializeVoiceManager();
