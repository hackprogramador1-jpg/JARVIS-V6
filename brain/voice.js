// ============================================================
// JARVIS V6 — VOICE ENGINE
// Sistema de entrada e saída por voz
// ============================================================

import {
  processInput
} from "./engine.js";

import {
  getSettings
} from "./settings.js";

import {
  emit,
  EVENTS
} from "./events.js";


// ============================================================
// VERSÃO
// ============================================================

export const VOICE_VERSION = "1.0.0";


// ============================================================
// ESTADO
// ============================================================

let recognition = null;

let listening = false;

let speaking = false;

let supported = false;

let lastTranscript = "";

let lastError = null;

let onTranscriptCallback = null;

let onResponseCallback = null;


// ============================================================
// DETECTAR SUPORTE
// ============================================================

export function detectVoiceSupport() {

  const SpeechRecognition =
    window.SpeechRecognition ||
    window.webkitSpeechRecognition;

  const speechSynthesis =
    "speechSynthesis" in window;

  supported =
    Boolean(
      SpeechRecognition ||
      speechSynthesis
    );


  return {

    supported,

    recognition:
      Boolean(
        SpeechRecognition
      ),

    synthesis:
      speechSynthesis

  };
}


// ============================================================
// INICIALIZAR RECONHECIMENTO
// ============================================================

export function initializeVoice(
  options = {}
) {

  const SpeechRecognition =
    window.SpeechRecognition ||
    window.webkitSpeechRecognition;


  if (!SpeechRecognition) {

    lastError =
      "Reconhecimento de voz não é suportado neste navegador.";

    return {

      ok: false,

      error:
        lastError

    };
  }


  recognition =
    new SpeechRecognition();


  recognition.lang =
    options.language ||
    getSettings().language ||
    "pt-BR";


  recognition.continuous =
    options.continuous ??
    false;


  recognition.interimResults =
    options.interimResults ??
    true;


  recognition.maxAlternatives =
    options.maxAlternatives ||
    1;


  recognition.onstart =
    () => {

      listening =
        true;

      lastError =
        null;


      emit(
        EVENTS.VOICE_STARTED,
        {
          timestamp:
            new Date().toISOString()
        }
      );

    };


  recognition.onend =
    () => {

      listening =
        false;


      emit(
        EVENTS.VOICE_STOPPED,
        {
          timestamp:
            new Date().toISOString()
        }
      );

    };


  recognition.onerror =
    event => {

      listening =
        false;

      lastError =
        event?.error ||
        "Erro desconhecido no reconhecimento de voz.";


      emit(
        EVENTS.SYSTEM_ERROR,
        {
          source:
            "voice",

          error:
            lastError
        }
      );

    };


  recognition.onresult =
    event => {

      let finalText =
        "";

      let interimText =
        "";


      for (
        let i =
          event.resultIndex;

        i <
          event.results.length;

        i++
      ) {

        const result =
          event.results[i];


        const text =
          result[0]?.transcript ||
          "";


        if (
          result.isFinal
        ) {

          finalText +=
            text;

        } else {

          interimText +=
            text;
        }
      }


      const transcript =
        (
          finalText ||
          interimText
        ).trim();


      if (!transcript) {
        return;
      }


      lastTranscript =
        transcript;


      if (
        typeof onTranscriptCallback ===
        "function"
      ) {

        onTranscriptCallback(
          transcript,
          {
            final:
              Boolean(finalText),

            interim:
              Boolean(interimText)
          }
        );
      }


      if (finalText) {

        emit(
          EVENTS.INPUT,
          {
            input:
              finalText.trim(),

            source:
              "voice"
          }
        );

      }

    };


  supported =
    true;


  return {

    ok: true,

    recognition

  };
}


// ============================================================
// INICIAR ESCUTA
// ============================================================

export function startListening(
  options = {}
) {

  if (!recognition) {

    const initialized =
      initializeVoice(
        options
      );


    if (!initialized.ok) {

      return initialized;
    }
  }


  if (listening) {

    return {

      ok: true,

      alreadyListening:
        true

    };
  }


  try {

    recognition.start();

    return {

      ok: true,

      listening:
        true

    };

  } catch (error) {

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
// PARAR ESCUTA
// ============================================================

export function stopListening() {

  if (!recognition) {

    return {

      ok: true,

      listening:
        false

    };
  }


  try {

    recognition.stop();

  } catch (error) {

    console.warn(
      "JARVIS VOICE STOP:",
      error
    );
  }


  listening =
    false;


  return {

    ok: true,

    listening:
      false

  };
}


// ============================================================
// CANCELAR ESCUTA
// ============================================================

export function abortListening() {

  if (!recognition) {

    return {

      ok: true
    };
  }


  try {

    recognition.abort();

  } catch (error) {

    console.warn(
      "JARVIS VOICE ABORT:",
      error
    );
  }


  listening =
    false;


  return {

    ok: true,

    listening:
      false

  };
}


// ============================================================
// CONFIGURAR CALLBACK DE TRANSCRIÇÃO
// ============================================================

export function onTranscript(
  callback
) {

  if (
    typeof callback !==
    "function"
  ) {

    return {

      ok: false,

      error:
        "Callback inválido."
    };
  }


  onTranscriptCallback =
    callback;


  return {

    ok: true
  };
}


// ============================================================
// FALAR
// ============================================================

export function speak(
  text,
  options = {}
) {

  if (
    typeof text !== "string" ||
    !text.trim()
  ) {

    return {

      ok: false,

      error:
        "Texto vazio."
    };
  }


  if (
    !("speechSynthesis" in window)
  ) {

    return {

      ok: false,

      error:
        "Síntese de voz não suportada."
    };
  }


  const settings =
    getSettings();


  const voiceSettings =
    settings.voice ||
    {};


  window.speechSynthesis.cancel();


  const utterance =
    new SpeechSynthesisUtterance(
      text
    );


  utterance.lang =
    options.language ||
    settings.language ||
    "pt-BR";


  utterance.rate =
    options.rate ??
    voiceSettings.rate ??
    1;


  utterance.pitch =
    options.pitch ??
    voiceSettings.pitch ??
    1;


  utterance.volume =
    options.volume ??
    voiceSettings.volume ??
    1;


  if (
    options.voice
  ) {

    utterance.voice =
      options.voice;

  } else {

    const voices =
      window.speechSynthesis
        .getVoices();


    const preferred =
      voices.find(
        voice =>
          voice.lang
            ?.toLowerCase()
            .startsWith(
              (
                settings.language ||
                "pt-BR"
              )
                .toLowerCase()
                .split("-")[0]
            )
      );


    if (preferred) {

      utterance.voice =
        preferred;
    }
  }


  utterance.onstart =
    () => {

      speaking =
        true;
    };


  utterance.onend =
    () => {

      speaking =
        false;
    };


  utterance.onerror =
    error => {

      speaking =
        false;

      lastError =
        error?.error ||
        "Erro na síntese de voz.";
    };


  window.speechSynthesis.speak(
    utterance
  );


  return {

    ok: true,

    speaking:
      true
  };
}


// ============================================================
// PARAR FALA
// ============================================================

export function stopSpeaking() {

  if (
    "speechSynthesis" in window
  ) {

    window.speechSynthesis.cancel();
  }


  speaking =
    false;


  return {

    ok: true,

    speaking:
      false

  };
}


// ============================================================
// PROCESSAR VOZ → JARVIS
// ============================================================

export async function processVoice(
  transcript,
  options = {}
) {

  if (
    typeof transcript !== "string" ||
    !transcript.trim()
  ) {

    return {

      ok: false,

      error:
        "Transcrição vazia."
    };
  }


  lastTranscript =
    transcript.trim();


  try {

    const result =
      await processInput(
        lastTranscript,
        {
          ...options,

          source:
            "voice"
        }
      );


    if (
      result?.response
    ) {

      if (
        options.speakResponse !==
        false
      ) {

        speak(
          result.response,
          options
        );
      }


      if (
        typeof onResponseCallback ===
        "function"
      ) {

        onResponseCallback(
          result.response,
          result
        );
      }
    }


    return result;

  } catch (error) {

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
// CONFIGURAR CALLBACK DE RESPOSTA
// ============================================================

export function onResponse(
  callback
) {

  if (
    typeof callback !==
    "function"
  ) {

    return {

      ok: false,

      error:
        "Callback inválido."
    };
  }


  onResponseCallback =
    callback;


  return {

    ok: true
  };
}


// ============================================================
// ESCUTA + PROCESSAMENTO AUTOMÁTICO
// ============================================================

export function enableVoicePipeline(
  options = {}
) {

  const init =
    initializeVoice(
      options
    );


  if (!init.ok) {

    return init;
  }


  onTranscript(
    async (
      transcript,
      metadata
    ) => {

      if (
        metadata?.final !==
        true
      ) {

        return;
      }


      await processVoice(
        transcript,
        options
      );

    }
  );


  return {

    ok: true,

    pipeline:
      "active"

  };
}


// ============================================================
// STATUS
// ============================================================

export function getVoiceStatus() {

  const support =
    detectVoiceSupport();


  return {

    ok:
      support.supported,

    version:
      VOICE_VERSION,

    supported:
      support.supported,

    recognition:
      support.recognition,

    synthesis:
      support.synthesis,

    listening,

    speaking,

    lastTranscript,

    lastError

  };
}


// ============================================================
// DIAGNÓSTICO
// ============================================================

export function diagnoseVoice() {

  const status =
    getVoiceStatus();


  return {

    ok:
      status.supported,

    version:
      VOICE_VERSION,

    recognition:
      status.recognition,

    synthesis:
      status.synthesis,

    listening:
      status.listening,

    speaking:
      status.speaking,

    lastError:
      status.lastError,

    timestamp:
      new Date().toISOString()

  };
}


// ============================================================
// INFORMAÇÕES
// ============================================================

export function getVoiceInfo() {

  return {

    name:
      "JARVIS Voice Engine",

    version:
      VOICE_VERSION,

    capabilities: [

      "speech recognition",

      "speech synthesis",

      "voice pipeline",

      "voice callbacks",

      "voice diagnostics",

      "engine integration"

    ]

  };
      }
