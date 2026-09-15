// ============================================================
// JARVIS V6 — SETTINGS MANAGER
// Versão: 1.0.0
// ============================================================

export const SETTINGS_VERSION = "1.0.0";

const SETTINGS_KEY =
  "JARVIS_V6_SETTINGS";


// ============================================================
// CONFIGURAÇÕES PADRÃO
// ============================================================

const DEFAULT_SETTINGS = {

  language:
    "pt-BR",

  assistantName:
    "JARVIS",

  voice: {

    enabled:
      true,

    autoSpeak:
      true,

    rate:
      1,

    pitch:
      1,

    volume:
      1

  },

  interface: {

    theme:
      "dark",

    animations:
      true,

    particles:
      true,

    compactMode:
      false

  },

  behavior: {

    confirmations:
      true,

    proactive:
      false,

    learning:
      true,

    memory:
      true

  },

  notifications: {

    enabled:
      true,

    sounds:
      true

  },

  search: {

    enabled:
      true,

    safeMode:
      true

  }

};


// ============================================================
// CLONAR CONFIGURAÇÃO
// ============================================================

function cloneSettings(
  settings
) {

  return JSON.parse(
    JSON.stringify(
      settings
    )
  );
}


// ============================================================
// CARREGAR
// ============================================================

function loadSettings() {

  try {

    const saved =
      localStorage.getItem(
        SETTINGS_KEY
      );


    if (!saved) {

      return cloneSettings(
        DEFAULT_SETTINGS
      );
    }


    const parsed =
      JSON.parse(
        saved
      );


    return {

      ...cloneSettings(
        DEFAULT_SETTINGS
      ),

      ...parsed,

      voice: {

        ...DEFAULT_SETTINGS.voice,

        ...(parsed.voice || {})

      },

      interface: {

        ...DEFAULT_SETTINGS.interface,

        ...(parsed.interface || {})

      },

      behavior: {

        ...DEFAULT_SETTINGS.behavior,

        ...(parsed.behavior || {})

      },

      notifications: {

        ...DEFAULT_SETTINGS.notifications,

        ...(parsed.notifications || {})

      },

      search: {

        ...DEFAULT_SETTINGS.search,

        ...(parsed.search || {})

      }

    };

  } catch (error) {

    console.error(
      "JARVIS SETTINGS LOAD ERROR:",
      error
    );


    return cloneSettings(
      DEFAULT_SETTINGS
    );
  }
}


// ============================================================
// ESTADO
// ============================================================

let settings =
  loadSettings();


// ============================================================
// SALVAR
// ============================================================

function saveSettings() {

  try {

    localStorage.setItem(
      SETTINGS_KEY,
      JSON.stringify(
        settings
      )
    );

    return true;

  } catch (error) {

    console.error(
      "JARVIS SETTINGS SAVE ERROR:",
      error
    );

    return false;
  }
}


// ============================================================
// OBTER CONFIGURAÇÕES
// ============================================================

export function getSettings() {

  return cloneSettings(
    settings
  );
}


// ============================================================
// OBTER VALOR
// ============================================================

export function getSetting(
  path,
  fallback = null
) {

  if (
    typeof path !== "string" ||
    !path
  ) {

    return fallback;
  }


  const parts =
    path.split(".");


  let value =
    settings;


  for (
    const part
    of parts
  ) {

    if (
      value === null ||
      value === undefined ||
      !(part in value)
    ) {

      return fallback;
    }


    value =
      value[part];
  }


  return value;
}


// ============================================================
// DEFINIR VALOR
// ============================================================

export function setSetting(
  path,
  value
) {

  if (
    typeof path !== "string" ||
    !path
  ) {

    return {

      ok: false,

      error:
        "Caminho da configuração inválido."
    };
  }


  const parts =
    path.split(".");


  let target =
    settings;


  for (
    let i = 0;
    i < parts.length - 1;
    i++
  ) {

    const part =
      parts[i];


    if (
      typeof target[part] !==
      "object" ||
      target[part] === null
    ) {

      target[part] = {};
    }


    target =
      target[part];
  }


  target[
    parts[parts.length - 1]
  ] = value;


  saveSettings();


  return {

    ok: true,

    path,

    value

  };
}


// ============================================================
// DEFINIR VÁRIAS
// ============================================================

export function updateSettings(
  values = {}
) {

  if (
    typeof values !== "object" ||
    values === null
  ) {

    return {

      ok: false,

      error:
        "Configurações inválidas."
    };
  }


  function merge(
    target,
    source
  ) {

    for (
      const key
      of Object.keys(source)
    ) {

      const value =
        source[key];


      if (
        value &&
        typeof value === "object" &&
        !Array.isArray(value)
      ) {

        if (
          !target[key] ||
          typeof target[key] !==
          "object"
        ) {

          target[key] = {};
        }


        merge(
          target[key],
          value
        );

      } else {

        target[key] =
          value;
      }
    }
  }


  merge(
    settings,
    values
  );


  saveSettings();


  return {

    ok: true,

    settings:
      getSettings()

  };
}


// ============================================================
// RESETAR
// ============================================================

export function resetSettings() {

  settings =
    cloneSettings(
      DEFAULT_SETTINGS
    );


  saveSettings();


  return {

    ok: true,

    settings:
      getSettings()

  };
}


// ============================================================
// CONFIGURAÇÕES DE VOZ
// ============================================================

export function setVoiceSettings(
  values = {}
) {

  return updateSettings({

    voice:
      values

  });
}


// ============================================================
// CONFIGURAÇÕES DA INTERFACE
// ============================================================

export function setInterfaceSettings(
  values = {}
) {

  return updateSettings({

    interface:
      values

  });
}


// ============================================================
// CONFIGURAÇÕES DE COMPORTAMENTO
// ============================================================

export function setBehaviorSettings(
  values = {}
) {

  return updateSettings({

    behavior:
      values

  });
}


// ============================================================
// CONFIGURAÇÕES DE NOTIFICAÇÕES
// ============================================================

export function setNotificationSettings(
  values = {}
) {

  return updateSettings({

    notifications:
      values

  });
}


// ============================================================
// CONFIGURAÇÕES DE PESQUISA
// ============================================================

export function setSearchSettings(
  values = {}
) {

  return updateSettings({

    search:
      values

  });
}


// ============================================================
// EXPORTAR
// ============================================================

export function exportSettings() {

  return JSON.stringify(
    settings,
    null,
    2
  );
}


// ============================================================
// DIAGNÓSTICO
// ============================================================

export function diagnoseSettings() {

  return {

    ok: true,

    version:
      SETTINGS_VERSION,

    language:
      settings.language,

    voiceEnabled:
      settings.voice.enabled,

    autoSpeak:
      settings.voice.autoSpeak,

    theme:
      settings.interface.theme,

    animations:
      settings.interface.animations,

    learning:
      settings.behavior.learning,

    memory:
      settings.behavior.memory,

    search:
      settings.search.enabled,

    notifications:
      settings.notifications.enabled,

    timestamp:
      new Date().toISOString()

  };
}


// ============================================================
// INFORMAÇÕES
// ============================================================

export function getSettingsInfo() {

  return {

    name:
      "JARVIS Settings Manager",

    version:
      SETTINGS_VERSION,

    storage:
      "localStorage",

    capabilities: [

      "language",

      "voice",

      "interface",

      "behavior",

      "notifications",

      "search",

      "export",

      "reset"

    ]

  };
        }
