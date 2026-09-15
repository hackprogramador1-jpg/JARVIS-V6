// ============================================================
// JARVIS V6 — ACTIVE LEARNING
// Versão: 1.0.0
// Função: aprendizado, evolução e registro de conhecimento
// ============================================================

import {
  learn,
  remember,
  searchLearned,
  getMemoryStats
} from "./memory.js";

import {
  addLearned,
  addLearning,
  addKnown,
  addUnknown,
  searchKnowledge,
  promoteLearned,
  getKnowledgeStats
} from "./knowledge.js";

import {
  registerLearning,
  addBrainEvent
} from "./state.js";

const LEARNING_VERSION = "1.0.0";


// ============================================================
// UTILITÁRIOS
// ============================================================

function now() {
  return new Date().toISOString();
}

function clean(value) {
  return String(value || "").trim();
}


// ============================================================
// APRENDER UMA INFORMAÇÃO
// ============================================================

export function learnFromUser(
  text,
  options = {}
) {

  const value =
    clean(text);

  if (!value) {

    return {

      ok: false,

      error:
        "Informação vazia."
    };
  }


  const topic =
    clean(
      options.topic ||
      "geral"
    );


  const source =
    options.source ||
    "user";


  const confidence =
    typeof options.confidence === "number"
      ? options.confidence
      : 1;


  // Memória de longo prazo
  const memory =
    learn(
      value,
      {

        topic,

        source,

        confidence
      }
    );


  // Base de conhecimento
  const knowledge =
    addLearned(
      value,
      source
    );


  // Registrar evolução
  registerLearning({

    type:
      "user_learning",

    topic,

    text:
      value,

    source,

    confidence
  });


  return {

    ok: true,

    text:
      value,

    topic,

    source,

    confidence,

    memory,

    knowledge,

    timestamp:
      now()
  };
}


// ============================================================
// MARCAR ASSUNTO COMO "APRENDENDO"
// ============================================================

export function startLearning(
  topic,
  options = {}
) {

  const value =
    clean(topic);

  if (!value) {

    return {

      ok: false,

      error:
        "Tópico vazio."
    };
  }


  const result =
    addLearning(
      value
    );


  registerLearning({

    type:
      "learning_started",

    topic:
      value,

    source:
      options.source ||
      "system"
  });


  return {

    ok: true,

    topic:
      value,

    result,

    status:
      "learning",

    timestamp:
      now()
  };
}


// ============================================================
// MARCAR COMO CONHECIDO
// ============================================================

export function markAsKnown(
  topic
) {

  const value =
    clean(topic);

  if (!value) {

    return {

      ok: false,

      error:
        "Tópico vazio."
    };
  }


  const result =
    addKnown(
      value
    );


  addBrainEvent(
    "knowledge_confirmed",
    {

      topic:
        value
    }
  );


  return {

    ok: true,

    topic:
      value,

    result,

    status:
      "known",

    timestamp:
      now()
  };
}


// ============================================================
// MARCAR COMO DESCONHECIDO
// ============================================================

export function markAsUnknown(
  topic
) {

  const value =
    clean(topic);

  if (!value) {

    return {

      ok: false,

      error:
        "Tópico vazio."
    };
  }


  const result =
    addUnknown(
      value
    );


  addBrainEvent(
    "knowledge_unknown",
    {

      topic:
        value
    }
  );


  return {

    ok: true,

    topic:
      value,

    result,

    status:
      "unknown",

    timestamp:
      now()
  };
}


// ============================================================
// PROMOVER APRENDIZADO PARA CONHECIMENTO
// ============================================================

export function promoteLearning(
  topic
) {

  const value =
    clean(topic);

  if (!value) {

    return {

      ok: false,

      error:
        "Tópico vazio."
    };
  }


  const result =
    promoteLearned(
      value
    );


  addBrainEvent(
    "learning_promoted",

    {

      topic:
        value
    }
  );


  return {

    ok: true,

    topic:
      value,

    result,

    status:
      "known",

    timestamp:
      now()
  };
}


// ============================================================
// APRENDER E LEMBRAR AO MESMO TEMPO
// ============================================================

export function learnAndRemember(
  text,
  options = {}
) {

  const value =
    clean(text);

  if (!value) {

    return {

      ok: false,

      error:
        "Informação vazia."
    };
  }


  const memory =
    remember(
      value,
      {

        category:
          options.category ||
          "learning",

        source:
          options.source ||
          "learning",

        importance:
          options.importance ||
          1
      }
    );


  const learning =
    learnFromUser(
      value,
      options
    );


  return {

    ok: true,

    text:
      value,

    memory,

    learning,

    timestamp:
      now()
  };
}


// ============================================================
// PROCURAR O QUE O JARVIS JÁ APRENDEU
// ============================================================

export function findLearned(
  query
) {

  const value =
    clean(query);

  if (!value) {

    return [];
  }


  const memoryResults =
    searchLearned(
      value
    );


  const knowledgeResults =
    searchKnowledge(
      value
    );


  return {

    query:
      value,

    memory:
      memoryResults,

    knowledge:
      knowledgeResults,

    found:
      memoryResults.length +
      knowledgeResults.length,

    timestamp:
      now()
  };
}


// ============================================================
// AVALIAR CONHECIMENTO
// ============================================================

export function evaluateKnowledge(
  query
) {

  const value =
    clean(query);

  if (!value) {

    return {

      status:
        "unknown",

      confidence:
        0
    };
  }


  const results =
    findLearned(
      value
    );


  if (
    results.found === 0
  ) {

    return {

      status:
        "unknown",

      confidence:
        0,

      query:
        value
    };
  }


  const confidence =
    Math.min(
      1,
      results.found / 5
    );


  return {

    status:
      confidence >= 0.8
        ? "known"
        : "learned",

    confidence,

    query:
      value,

    results
  };
}


// ============================================================
// EVOLUÇÃO DO CÉREBRO
// ============================================================

export function getLearningStats() {

  const memory =
    getMemoryStats();

  const knowledge =
    getKnowledgeStats();


  return {

    version:
      LEARNING_VERSION,

    memory,

    knowledge,

    totalLearned:

      (
        memory?.learned ||
        0
      ) +

      (
        knowledge?.learned ||
        0
      ),

    timestamp:
      now()
  };
}


// ============================================================
// CICLO DE APRENDIZADO
// ============================================================

export function learningCycle(
  input,
  options = {}
) {

  const value =
    clean(input);

  if (!value) {

    return {

      ok: false,

      error:
        "Entrada vazia."
    };
  }


  const evaluation =
    evaluateKnowledge(
      value
    );


  // Já conhecido
  if (
    evaluation.status ===
    "known"
  ) {

    addBrainEvent(
      "knowledge_reused",

      {

        input:
          value,

        confidence:
          evaluation.confidence
      }
    );


    return {

      ok: true,

      action:
        "reuse",

      status:
        "known",

      confidence:
        evaluation.confidence,

      evaluation
    };
  }


  // Parcialmente conhecido
  if (
    evaluation.status ===
    "learned"
  ) {

    addBrainEvent(
      "knowledge_review",

      {

        input:
          value,

        confidence:
          evaluation.confidence
      }
    );


    return {

      ok: true,

      action:
        "review",

      status:
        "learned",

      confidence:
        evaluation.confidence,

      evaluation
    };
  }


  // Desconhecido
  startLearning(
    value,
    {

      source:
        options.source ||
        "learning-cycle"
    }
  );


  return {

    ok: true,

    action:
      "learn",

    status:
      "learning",

    confidence:
      0,

    topic:
      value,

    evaluation
  };
}


// ============================================================
// REGISTRAR RESULTADO DE PESQUISA COMO APRENDIZADO
// ============================================================

export function learnFromSearch(
  query,
  result,
  options = {}
) {

  const search =
    clean(query);

  const information =
    clean(result);


  if (
    !search ||
    !information
  ) {

    return {

      ok: false,

      error:
        "Consulta ou resultado vazio."
    };
  }


  const learned =
    learnFromUser(
      information,
      {

        topic:
          options.topic ||
          search,

        source:
          "web",

        confidence:
          typeof options.confidence === "number"
            ? options.confidence
            : 0.8
      }
    );


  addBrainEvent(
    "search_learning",

    {

      query:
        search,

      result:
        information
    }
  );


  return {

    ok: true,

    query:
      search,

    learned,

    timestamp:
      now()
  };
}


// ============================================================
// RESETAR APRENDIZADO DE UM TÓPICO
// ============================================================

export function forgetLearnedTopic(
  topic
) {

  const value =
    clean(topic);

  if (!value) {

    return {

      ok: false,

      error:
        "Tópico vazio."
    };
  }


  addBrainEvent(
    "learning_forget",

    {

      topic:
        value
    }
  );


  return {

    ok: true,

    topic:
      value,

    message:
      "O registro deverá ser removido pelo módulo de memória.",
    
    timestamp:
      now()
  };
}


// ============================================================
// DIAGNÓSTICO
// ============================================================

export function diagnoseLearning() {

  try {

    const stats =
      getLearningStats();


    return {

      ok: true,

      version:
        LEARNING_VERSION,

      stats,

      timestamp:
        now()
    };

  } catch (error) {

    return {

      ok: false,

      version:
        LEARNING_VERSION,

      error:
        error?.message ||
        "Erro no módulo de aprendizado.",

      timestamp:
        now()
    };
  }
}


// ============================================================
// INFORMAÇÕES
// ============================================================

export function getLearningInfo() {

  return {

    name:
      "JARVIS ACTIVE LEARNING",

    version:
      LEARNING_VERSION,

    capabilities: [

      "aprender com o usuário",

      "registrar conhecimento",

      "avaliar conhecimento",

      "iniciar aprendizado",

      "promover aprendizado",

      "aprender com pesquisas",

      "registrar evolução",

      "consultar conhecimento"
    ],

    timestamp:
      now()
  };
}
