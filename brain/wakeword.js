// ============================================================
// JARVIS V6 — WAKE WORD ENGINE
// Sistema de palavra de ativação
// ============================================================

import {
  initializeVoice,
  startListening,
  stopListening,
  getVoiceStatus
} from "./voice.js";

import {
  processNaturalInput
} from "./natural.js";

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

export const WAKEWORD_VERSION = "1.0.0";


// ============================================================
// CONFIGURAÇÃO
// ============================================================

const DEFAULT_WAKE_WORDS = [
  "jarvis"
];


// ============================================================
// ESTADO
// ============================================================

let initialized =
  false;

let active =
  false;

let detected =
  false;

let listening =
  false;

let wakeWords = [
  ...DEFAULT_WAKE_WORDS
];

let lastPhrase =
  "";

let lastCommand =
  "";

let lastError =
  null;


// ============================================================
// NORMALIZAR
// ============================================================

function normalize(
  text
) {

  return String(
    text || ""
  )
    .toLowerCase()
    .normalize("NFD")
    .replace(
      /[\u0300-\u036f]/g,
      ""
    )
    .trim();
}


// ============================================================
// CONFIGURAR WAKE WORDS
// ============================================================

export function setWakeWords(
  words = []
) {

  if (
    !Array.isArray(words) ||
    !words.length
  ) {

    return {

      ok: false,

      error:
        "Lista de palavras de ativação inválida."
    };
  }


  wakeWords =
    words
      .map(
        word =>
          normalize(word)
      )
      .filter(Boolean);


  return {

    ok: true,

    wakeWords:
      [...wakeWords]

  };
}


// ============================================================
// OBTER WAKE WORDS
// ============================================================

export function getWakeWords() {

  return [
    ...wakeWords
  ];
}


// ============================================================
// DETECTAR WAKE WORD
// ============================================================

export function detectWakeWord(
  text
) {

  const normalized =
    normalize(text);


  if (!normalized) {

    return {

      detected: false,

      command: ""

    };
  }


  for (
    const word
    of wakeWords
  ) {

    if (
      normalized === word
    ) {

      return {

        detected: true,

        wakeWord:
          word,

        command:
          ""

      };
    }


    if (
      normalized.startsWith(
        `${word} `
      )
    ) {

      return {

        detected: true,

        wakeWord:
          word,

        command:
          normalized
            .slice(
              word.length
            )
            .trim()

      };
    }


    if (
      normalized.includes(
        ` ${word} `
      )
    ) {

      const index =
        normalized.indexOf(
          ` ${word} `
        );


      const command =
        normalized
          .slice(
            index +
            word.length +
            2
          )
          .trim();


      return {

        detected: true,

        wakeWord:
          word,

        command

      };
    }
  }


  return {

    detected: false,

    command:
      ""

  };
}


// ============================================================
// INICIALIZAR
// ============================================================

export function initializeWakeWord(
  options = {}
) {

  try {

    const settings =
      getSettings();


    if (
      Array.isArray(
        options.wakeWords
      )
    ) {

      setWakeWords(
        options.wakeWords
      );

    } else if (
      Array.isArray(
        settings.wakeWords
      )
    ) {

      setWakeWords(
        settings.wakeWords
      );
    }


    const voice =
      initializeVoice({

        language:
          options.language ||
          settings.language ||
          "pt-BR",

        continuous:
          true,

        interimResults:
          true

      });


    if (
      voice?.ok === false
    ) {

      throw new Error(
        voice.error ||
        "Falha ao inicializar voz."
      );
    }


    initialized =
      true;

    active =
      false;

    detected =
      false;

    listening =
      false;

    lastError =
      null;


    return {

      ok: true,

      wakeWords:
        getWakeWords()

    };

  } catch (error) {

    initialized =
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
// PROCESSAR FRASE
// ============================================================

export async function processWakePhrase(
  phrase,
  options = {}
) {

  if (
    typeof phrase !==
    "string" ||
    !phrase.trim()
  ) {

    return {

      ok: false,

      error:
        "Frase vazia."
    };
  }


  lastPhrase =
    phrase.trim();


  const result =
    detectWakeWord(
      lastPhrase
    );


  if (!result.detected) {

    return {

      ok: true,

      detected: false,

      command:
        ""

    };
  }


  detected =
    true;


  lastCommand =
    result.command ||
    "";


  emit(
    EVENTS.INPUT,
    {

      source:
        "wakeword",

      wakeWord:
        result.wakeWord,

      command:
        result.command

    }
  );


  // ----------------------------------------------------------
  // APENAS "JARVIS"
  // ----------------------------------------------------------

  if (
    !result.command
  ) {

    return {

      ok: true,

      detected: true,

      activated: true,

      wakeWord:
        result.wakeWord,

      command:
        ""

    };
  }


  // ----------------------------------------------------------
  // "JARVIS + COMANDO"
  // ----------------------------------------------------------

  const response =
    await processNaturalInput(
      result.command,
      options
    );


  return {

    ok:
      response?.ok !== false,

    detected: true,

    activated: true,

    wakeWord:
      result.wakeWord,

    command:
      result.command,

    response

  };
}


// ============================================================
// INICIAR WAKE WORD
// ============================================================

export function startWakeWord(
  options = {}
) {

  if (!initialized) {

    const init =
      initializeWakeWord(
        options
      );


    if (
      init?.ok === false
    ) {

      return init;
    }
  }


  if (active) {

    return {

      ok: true,

      active: true,

      alreadyActive:
        true

    };
  }


  active =
    true;

  listening =
    true;


  const voice =
    startListening({

      language:
        options.language ||
        getSettings().language ||
        "pt-BR",

      continuous:
        true,

      interimResults:
        true

    });


  if (
    voice?.ok === false
  ) {

    active =
      false;

    listening =
      false;

    lastError =
      voice.error;


    return voice;
  }


  return {

    ok: true,

    active: true,

    listening: true,

    wakeWords:
      getWakeWords()

  };
}


// ============================================================
// PARAR WAKE WORD
// ============================================================

export function stopWakeWord() {

  stopListening();


  active =
    false;

  listening =
    false;


  return {

    ok: true,

    active: false,

    listening: false

  };
}


// ============================================================
// RESETAR DETECÇÃO
// ============================================================

export function resetWakeDetection() {

  detected =
    false;

  lastPhrase =
    "";

  lastCommand =
    "";


  return {

    ok: true

  };
}


// ============================================================
// STATUS
// ============================================================

export function getWakeWordStatus() {

  const voice =
    getVoiceStatus();


  return {

    ok:
      initialized,

    version:
      WAKEWORD_VERSION,

    initialized,

    active,

    detected,

    listening,

    wakeWords:
      getWakeWords(),

    lastPhrase,

    lastCommand,

    lastError,

    voice

  };
}


// ============================================================
// DIAGNÓSTICO
// ============================================================

export function diagnoseWakeWord() {

  const status =
    getWakeWordStatus();


  return {

    ok:
      status.initialized,

    version:
      WAKEWORD_VERSION,

    initialized:
      status.initialized,

    active:
      status.active,

    listening:
      status.listening,

    wakeWords:
      status.wakeWords,

    recognitionSupported:
      status.voice?.recognition ??
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

export function getWakeWordInfo() {

  return {

    name:
      "JARVIS Wake Word Engine",

    version:
      WAKEWORD_VERSION,

    defaultWakeWord:
      "JARVIS",

    capabilities: [

      "wake word detection",

      "voice activation",

      "command extraction",

      "natural command integration",

      "continuous listening preparation",

      "diagnostics"

    ]

  };
}
