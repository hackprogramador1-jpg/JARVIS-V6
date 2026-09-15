// ============================================================
// JARVIS V6 — MEMORY ENGINE
// Versão: 1.0.0
// Função: memória persistente do JARVIS
// ============================================================

const MEMORY_VERSION = "1.0.0";

const MEMORY_KEY =
  "JARVIS_V6_LONG_TERM_MEMORY";

const MAX_MEMORIES = 1000;


// ============================================================
// ESTRUTURA PADRÃO
// ============================================================

const DEFAULT_MEMORY = {
  version: MEMORY_VERSION,
  owner: null,
  memories: [],
  learned: [],
  updatedAt: null
};


// ============================================================
// ID
// ============================================================

function createId(prefix = "MEM") {

  return (
    prefix +
    "-" +
    Date.now() +
    "-" +
    Math.random()
      .toString(36)
      .slice(2, 9)
  );
}


// ============================================================
// DATA
// ============================================================

function now() {
  return new Date().toISOString();
}


// ============================================================
// CARREGAR MEMÓRIA
// ============================================================

function loadMemory() {

  try {

    const saved =
      localStorage.getItem(
        MEMORY_KEY
      );

    if (!saved) {

      return structuredClone(
        DEFAULT_MEMORY
      );
    }

    const data =
      JSON.parse(saved);

    return {

      version:
        data.version ||
        MEMORY_VERSION,

      owner:
        data.owner || null,

      memories:
        Array.isArray(data.memories)
          ? data.memories
          : [],

      learned:
        Array.isArray(data.learned)
          ? data.learned
          : [],

      updatedAt:
        data.updatedAt || null
    };

  } catch (error) {

    console.error(
      "JARVIS MEMORY LOAD ERROR:",
      error
    );

    return structuredClone(
      DEFAULT_MEMORY
    );
  }
}


// ============================================================
// SALVAR MEMÓRIA
// ============================================================

function saveMemory(data) {

  data.updatedAt = now();

  localStorage.setItem(
    MEMORY_KEY,
    JSON.stringify(data)
  );

  return data;
}


// ============================================================
// DEFINIR PROPRIETÁRIO
// ============================================================

export function setOwner(owner) {

  const data =
    loadMemory();

  const value =
    String(owner || "")
      .trim();

  if (!value) {
    return data;
  }

  data.owner = {
    name: value,
    createdAt:
      data.owner?.createdAt ||
      now(),
    updatedAt:
      now()
  };

  return saveMemory(data);
}


// ============================================================
// OBTER PROPRIETÁRIO
// ============================================================

export function getOwner() {

  const data =
    loadMemory();

  return data.owner;
}


// ============================================================
// SALVAR MEMÓRIA
// ============================================================

export function remember(
  text,
  options = {}
) {

  const value =
    String(text || "")
      .trim();

  if (!value) {
    return null;
  }

  if (value.length > 5000) {

    throw new Error(
      "A memória ultrapassa o limite permitido."
    );
  }

  const data =
    loadMemory();

  const normalized =
    value.toLowerCase();

  const duplicate =
    data.memories.find(
      item =>
        String(item.text)
          .toLowerCase() ===
        normalized
    );

  if (duplicate) {
    return duplicate;
  }

  const memory = {

    id: createId("MEM"),

    text: value,

    category:
      String(
        options.category ||
        "general"
      ),

    source:
      String(
        options.source ||
        "user"
      ),

    importance:
      Number.isFinite(
        Number(options.importance)
      )
        ? Number(options.importance)
        : 1,

    createdAt:
      now(),

    updatedAt:
      now()
  };

  data.memories.push(
    memory
  );

  // Mantém apenas as memórias mais recentes.
  if (
    data.memories.length >
    MAX_MEMORIES
  ) {

    data.memories =
      data.memories.slice(
        -MAX_MEMORIES
      );
  }

  saveMemory(data);

  return memory;
}


// ============================================================
// APRENDER
// ============================================================

export function learn(
  text,
  options = {}
) {

  const value =
    String(text || "")
      .trim();

  if (!value) {
    return null;
  }

  const data =
    loadMemory();

  const learned = {

    id: createId("LEARN"),

    text: value,

    topic:
      String(
        options.topic ||
        "general"
      ),

    source:
      String(
        options.source ||
        "user"
      ),

    confidence:
      Number.isFinite(
        Number(options.confidence)
      )
        ? Number(options.confidence)
        : 0.5,

    createdAt:
      now(),

    updatedAt:
      now()
  };

  data.learned.push(
    learned
  );

  if (
    data.learned.length >
    MAX_MEMORIES
  ) {

    data.learned =
      data.learned.slice(
        -MAX_MEMORIES
      );
  }

  saveMemory(data);

  return learned;
}


// ============================================================
// PESQUISAR MEMÓRIA
// ============================================================

export function searchMemory(
  query,
  limit = 20
) {

  const value =
    String(query || "")
      .trim()
      .toLowerCase();

  if (!value) {
    return [];
  }

  const data =
    loadMemory();

  const words =
    value.split(/\s+/)
      .filter(Boolean);

  const results =
    data.memories
      .map(memory => {

        const text =
          String(memory.text)
            .toLowerCase();

        let score = 0;

        for (const word of words) {

          if (text.includes(word)) {
            score++;
          }
        }

        return {
          ...memory,
          score
        };
      })
      .filter(
        item =>
          item.score > 0
      )
      .sort(
        (a, b) =>
          b.score - a.score
      )
      .slice(
        0,
        Math.max(
          1,
          Number(limit) || 20
        )
      );

  return results;
}


// ============================================================
// PESQUISAR APRENDIZADO
// ============================================================

export function searchLearned(
  query,
  limit = 20
) {

  const value =
    String(query || "")
      .trim()
      .toLowerCase();

  if (!value) {
    return [];
  }

  const data =
    loadMemory();

  const words =
    value.split(/\s+/)
      .filter(Boolean);

  return data.learned
    .map(item => {

      const text =
        (
          String(item.text) +
          " " +
          String(item.topic)
        )
          .toLowerCase();

      let score = 0;

      for (const word of words) {

        if (text.includes(word)) {
          score++;
        }
      }

      return {
        ...item,
        score
      };
    })
    .filter(
      item =>
        item.score > 0
    )
    .sort(
      (a, b) =>
        b.score - a.score
    )
    .slice(
      0,
      Math.max(
        1,
        Number(limit) || 20
      )
    );
}


// ============================================================
// OBTER TODA A MEMÓRIA
// ============================================================

export function getMemory() {
  return loadMemory();
}


// ============================================================
// ESTATÍSTICAS
// ============================================================

export function getMemoryStats() {

  const data =
    loadMemory();

  return {

    version:
      MEMORY_VERSION,

    owner:
      data.owner?.name ||
      null,

    memories:
      data.memories.length,

    learned:
      data.learned.length,

    total:
      data.memories.length +
      data.learned.length,

    updatedAt:
      data.updatedAt
  };
}


// ============================================================
// REMOVER MEMÓRIA
// ============================================================

export function forget(
  memoryId
) {

  const id =
    String(memoryId || "")
      .trim();

  if (!id) {
    return false;
  }

  const data =
    loadMemory();

  const before =
    data.memories.length;

  data.memories =
    data.memories.filter(
      item =>
        item.id !== id
    );

  if (
    data.memories.length ===
    before
  ) {
    return false;
  }

  saveMemory(data);

  return true;
}


// ============================================================
// REMOVER APRENDIZADO
// ============================================================

export function forgetLearned(
  learnedId
) {

  const id =
    String(learnedId || "")
      .trim();

  if (!id) {
    return false;
  }

  const data =
    loadMemory();

  const before =
    data.learned.length;

  data.learned =
    data.learned.filter(
      item =>
        item.id !== id
    );

  if (
    data.learned.length ===
    before
  ) {
    return false;
  }

  saveMemory(data);

  return true;
}


// ============================================================
// LIMPAR MEMÓRIAS
// ============================================================

export function clearMemories() {

  const data =
    loadMemory();

  data.memories = [];

  saveMemory(data);

  return true;
}


// ============================================================
// LIMPAR APRENDIZADO
// ============================================================

export function clearLearning() {

  const data =
    loadMemory();

  data.learned = [];

  saveMemory(data);

  return true;
}


// ============================================================
// EXPORTAR MEMÓRIA
// ============================================================

export function exportMemory() {

  return structuredClone(
    loadMemory()
  );
}


// ============================================================
// INICIALIZAR MEMÓRIA
// ============================================================

export function initializeMemory(
  owner = null
) {

  const data =
    loadMemory();

  if (
    owner &&
    !data.owner
  ) {

    data.owner = {

      name:
        String(owner).trim(),

      createdAt:
        now(),

      updatedAt:
        now()
    };
  }

  saveMemory(data);

  return getMemoryStats();
}


// ============================================================
// DIAGNÓSTICO
// ============================================================

export function getMemoryHealth() {

  try {

    const data =
      loadMemory();

    return {

      ok: true,

      version:
        MEMORY_VERSION,

      storage:
        "localStorage",

      readable:
        true,

      writable:
        true,

      memories:
        data.memories.length,

      learned:
        data.learned.length,

      timestamp:
        now()
    };

  } catch (error) {

    return {

      ok: false,

      version:
        MEMORY_VERSION,

      error:
        error?.message ||
        "Erro desconhecido",

      timestamp:
        now()
    };
  }
  }
