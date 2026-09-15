// ============================================================
// JARVIS V6 — KNOWLEDGE ENGINE
// Versão: 1.0.0
// Função: conhecimento, aprendizado e evolução do cérebro
// ============================================================

const KNOWLEDGE_VERSION = "1.0.0";

const KNOWLEDGE_KEY =
  "JARVIS_V6_KNOWLEDGE";

const MAX_ITEMS = 2000;


// ============================================================
// ESTRUTURA
// ============================================================

const DEFAULT_KNOWLEDGE = {
  version: KNOWLEDGE_VERSION,

  known: [],

  learned: [],

  learning: [],

  unknown: [],

  updatedAt: null
};


// ============================================================
// UTILITÁRIOS
// ============================================================

function now() {
  return new Date().toISOString();
}


function createId(prefix) {

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


function normalize(value) {

  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/\s+/g, " ");
}


// ============================================================
// CARREGAR
// ============================================================

function loadKnowledge() {

  try {

    const saved =
      localStorage.getItem(
        KNOWLEDGE_KEY
      );

    if (!saved) {

      return structuredClone(
        DEFAULT_KNOWLEDGE
      );
    }

    const data =
      JSON.parse(saved);

    return {

      version:
        data.version ||
        KNOWLEDGE_VERSION,

      known:
        Array.isArray(data.known)
          ? data.known
          : [],

      learned:
        Array.isArray(data.learned)
          ? data.learned
          : [],

      learning:
        Array.isArray(data.learning)
          ? data.learning
          : [],

      unknown:
        Array.isArray(data.unknown)
          ? data.unknown
          : [],

      updatedAt:
        data.updatedAt || null
    };

  } catch (error) {

    console.error(
      "JARVIS KNOWLEDGE LOAD ERROR:",
      error
    );

    return structuredClone(
      DEFAULT_KNOWLEDGE
    );
  }
}


// ============================================================
// SALVAR
// ============================================================

function saveKnowledge(data) {

  data.updatedAt = now();

  localStorage.setItem(
    KNOWLEDGE_KEY,
    JSON.stringify(data)
  );

  return data;
}


// ============================================================
// CONHECIMENTO CONHECIDO
// ============================================================

export function addKnown(
  topic,
  options = {}
) {

  const value =
    String(topic || "").trim();

  if (!value) {
    return null;
  }

  const data =
    loadKnowledge();

  const normalized =
    normalize(value);

  const exists =
    data.known.find(
      item =>
        normalize(item.topic) ===
        normalized
    );

  if (exists) {
    return exists;
  }

  const item = {

    id:
      createId("KNOWN"),

    topic:
      value,

    source:
      options.source ||
      "system",

    confidence:
      Number.isFinite(
        Number(options.confidence)
      )
        ? Number(options.confidence)
        : 1,

    createdAt:
      now(),

    updatedAt:
      now()
  };

  data.known.push(item);

  if (
    data.known.length >
    MAX_ITEMS
  ) {

    data.known =
      data.known.slice(
        -MAX_ITEMS
      );
  }

  saveKnowledge(data);

  return item;
}


// ============================================================
// APRENDIZADO
// ============================================================

export function addLearned(
  topic,
  options = {}
) {

  const value =
    String(topic || "").trim();

  if (!value) {
    return null;
  }

  const data =
    loadKnowledge();

  const item = {

    id:
      createId("LEARNED"),

    topic:
      value,

    content:
      String(
        options.content ||
        value
      ),

    source:
      options.source ||
      "user",

    confidence:
      Number.isFinite(
        Number(options.confidence)
      )
        ? Number(options.confidence)
        : 0.7,

    createdAt:
      now(),

    updatedAt:
      now()
  };

  data.learned.push(item);

  if (
    data.learned.length >
    MAX_ITEMS
  ) {

    data.learned =
      data.learned.slice(
        -MAX_ITEMS
      );
  }

  saveKnowledge(data);

  return item;
}


// ============================================================
// COLOCAR EM APRENDIZADO
// ============================================================

export function addLearning(
  topic,
  options = {}
) {

  const value =
    String(topic || "").trim();

  if (!value) {
    return null;
  }

  const data =
    loadKnowledge();

  const normalized =
    normalize(value);

  const exists =
    data.learning.find(
      item =>
        normalize(item.topic) ===
        normalized
    );

  if (exists) {
    return exists;
  }

  const item = {

    id:
      createId("LEARNING"),

    topic:
      value,

    reason:
      String(
        options.reason ||
        "Informação insuficiente."
      ),

    createdAt:
      now(),

    updatedAt:
      now()
  };

  data.learning.push(item);

  saveKnowledge(data);

  return item;
}


// ============================================================
// MARCAR COMO DESCONHECIDO
// ============================================================

export function addUnknown(
  topic,
  options = {}
) {

  const value =
    String(topic || "").trim();

  if (!value) {
    return null;
  }

  const data =
    loadKnowledge();

  const normalized =
    normalize(value);

  const exists =
    data.unknown.find(
      item =>
        normalize(item.topic) ===
        normalized
    );

  if (exists) {
    return exists;
  }

  const item = {

    id:
      createId("UNKNOWN"),

    topic:
      value,

    reason:
      String(
        options.reason ||
        "O JARVIS não conseguiu determinar esta informação."
      ),

    createdAt:
      now(),

    updatedAt:
      now()
  };

  data.unknown.push(item);

  saveKnowledge(data);

  return item;
}


// ============================================================
// PESQUISA
// ============================================================

export function searchKnowledge(
  query,
  limit = 20
) {

  const value =
    normalize(query);

  if (!value) {
    return [];
  }

  const words =
    value
      .split(/\s+/)
      .filter(Boolean);

  const data =
    loadKnowledge();

  const all = [

    ...data.known.map(
      item => ({
        ...item,
        type: "known"
      })
    ),

    ...data.learned.map(
      item => ({
        ...item,
        type: "learned"
      })
    ),

    ...data.learning.map(
      item => ({
        ...item,
        type: "learning"
      })
    )
  ];


  return all

    .map(item => {

      const searchable =
        normalize(
          String(item.topic) +
          " " +
          String(item.content || "")
        );

      let score = 0;

      for (
        const word of words
      ) {

        if (
          searchable.includes(word)
        ) {
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
// RESOLVER DESCONHECIDO
// ============================================================

export function resolveUnknown(
  topic
) {

  const value =
    normalize(topic);

  if (!value) {
    return false;
  }

  const data =
    loadKnowledge();

  const before =
    data.unknown.length;

  data.unknown =
    data.unknown.filter(
      item =>
        normalize(item.topic) !==
        value
    );

  if (
    data.unknown.length ===
    before
  ) {
    return false;
  }

  saveKnowledge(data);

  return true;
}


// ============================================================
// CONVERTER APRENDIZADO EM CONHECIMENTO
// ============================================================

export function promoteLearned(
  learnedId,
  options = {}
) {

  const id =
    String(learnedId || "").trim();

  if (!id) {
    return null;
  }

  const data =
    loadKnowledge();

  const index =
    data.learned.findIndex(
      item =>
        item.id === id
    );

  if (index === -1) {
    return null;
  }

  const learned =
    data.learned[index];

  const known =
    addKnown(
      learned.topic,
      {
        source:
          options.source ||
          "learning",

        confidence:
          Number.isFinite(
            Number(options.confidence)
          )
            ? Number(options.confidence)
            : learned.confidence
      }
    );

  data.learned.splice(
    index,
    1
  );

  saveKnowledge(data);

  return known;
}


// ============================================================
// ESTATÍSTICAS
// ============================================================

export function getKnowledgeStats() {

  const data =
    loadKnowledge();

  return {

    version:
      KNOWLEDGE_VERSION,

    known:
      data.known.length,

    learned:
      data.learned.length,

    learning:
      data.learning.length,

    unknown:
      data.unknown.length,

    total:
      data.known.length +
      data.learned.length +
      data.learning.length,

    updatedAt:
      data.updatedAt
  };
}


// ============================================================
// OBTER CONHECIMENTO
// ============================================================

export function getKnowledge() {

  return loadKnowledge();
}


// ============================================================
// EXPORTAR
// ============================================================

export function exportKnowledge() {

  return structuredClone(
    loadKnowledge()
  );
}


// ============================================================
// LIMPAR
// ============================================================

export function clearKnowledge() {

  const data =
    loadKnowledge();

  data.known = [];

  data.learned = [];

  data.learning = [];

  data.unknown = [];

  saveKnowledge(data);

  return true;
}


// ============================================================
// SAÚDE DO MÓDULO
// ============================================================

export function diagnoseKnowledge() {

  try {

    const data =
      loadKnowledge();

    return {

      ok: true,

      version:
        KNOWLEDGE_VERSION,

      storage:
        "localStorage",

      known:
        data.known.length,

      learned:
        data.learned.length,

      learning:
        data.learning.length,

      unknown:
        data.unknown.length,

      timestamp:
        now()
    };

  } catch (error) {

    return {

      ok: false,

      version:
        KNOWLEDGE_VERSION,

      error:
        error?.message ||
        "Erro no mecanismo de conhecimento.",

      timestamp:
        now()
    };
  }
}


// ============================================================
// INFORMAÇÕES
// ============================================================

export function getKnowledgeInfo() {

  return {

    name:
      "JARVIS KNOWLEDGE ENGINE",

    version:
      KNOWLEDGE_VERSION,

    capabilities: [

      "known_knowledge",

      "learning",

      "unknown_detection",

      "knowledge_search",

      "knowledge_promotion",

      "knowledge_statistics"
    ],

    timestamp:
      now()
  };
                      }
