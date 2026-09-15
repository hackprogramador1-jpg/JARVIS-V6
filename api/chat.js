// ============================================================
// JARVIS V6 — AI CORE API
// Versão: 1.0.0
// Função: conectar o cérebro à IA real
// ============================================================

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

const MODEL =
  process.env.JARVIS_MODEL ||
  "gpt-5.6-luna";


// ============================================================
// CONFIGURAÇÃO PRINCIPAL
// ============================================================

const JARVIS_SYSTEM = `
Você é JARVIS, uma inteligência artificial pessoal.

IDENTIDADE:
- Nome: JARVIS
- Sistema: JARVIS V6
- Função: assistente pessoal inteligente
- Você deve responder em português do Brasil, salvo quando o usuário pedir outro idioma.

COMPORTAMENTO:
- Seja direto, inteligente e natural.
- Entenda o contexto da conversa.
- Não invente informações.
- Quando não souber algo, diga claramente.
- Use memória e conhecimento fornecidos pelo sistema quando forem relevantes.
- Não revele chaves de API, segredos ou credenciais.
- Não finja ter acesso a recursos que ainda não foram realmente conectados.
- Diferencie informações fornecidas pelo sistema de informações que você não possui.

ARQUITETURA:
O JARVIS possui:
- Core
- Reasoning
- Decision
- Planner
- Executor
- Memory
- Knowledge
- Learning
- Context
- Tools

IMPORTANTE:
A existência desses módulos não significa que todos os recursos estejam necessariamente conectados ao dispositivo neste momento.
Nunca diga que executou uma ação no celular se o sistema não confirmou sua execução.
`;


// ============================================================
// RESPOSTA DE ERRO
// ============================================================

function errorResponse(
  res,
  status,
  message,
  details = null
) {

  return res.status(status).json({

    ok: false,

    error: message,

    details:
      process.env.NODE_ENV === "development"
        ? details
        : undefined,

    timestamp:
      new Date().toISOString()
  });
}


// ============================================================
// EXTRAIR TEXTO DA RESPONSES API
// ============================================================

function extractResponseText(data) {

  if (
    typeof data?.output_text === "string" &&
    data.output_text.trim()
  ) {

    return data.output_text.trim();
  }


  const parts = [];


  for (
    const item
    of data?.output || []
  ) {

    for (
      const content
      of item?.content || []
    ) {

      if (
        typeof content?.text === "string"
      ) {

        parts.push(
          content.text
        );

      } else if (
        typeof content?.text?.value === "string"
      ) {

        parts.push(
          content.text.value
        );
      }
    }
  }


  return parts
    .join("\n")
    .trim();
}


// ============================================================
// LIMPAR MARCADOR DE MEMÓRIA
// ============================================================

function extractMemoryMarker(text) {

  if (
    !text ||
    typeof text !== "string"
  ) {

    return {

      cleanText: text || "",

      memory: null
    };
  }


  const match =
    text.match(
      /MEMORY_TO_SAVE:\s*(.+)$/im
    );


  if (!match) {

    return {

      cleanText:
        text.trim(),

      memory: null
    };
  }


  const memory =
    match[1]
      .trim();


  const cleanText =
    text
      .replace(
        match[0],
        ""
      )
      .trim();


  return {

    cleanText,

    memory
  };
}


// ============================================================
// NORMALIZAR CONTEXTO
// ============================================================

function normalizeContext(body) {

  const memory =
    body.memory ||
    body.context?.memory ||
    null;

  const knowledge =
    body.knowledge ||
    body.context?.knowledge ||
    null;

  const brain =
    body.brain ||
    body.context?.brain ||
    null;

  const session =
    body.session ||
    body.context?.session ||
    null;


  return {

    memory,

    knowledge,

    brain,

    session,

    clientDateTime:
      body.clientDateTime ||
      null,

    clientTimeZone:
      body.clientTimeZone ||
      null
  };
}


// ============================================================
// CRIAR CONTEXTO PARA A IA
// ============================================================

function buildContextPrompt(
  context
) {

  return `
CONTEXTO DO SISTEMA JARVIS:

DATA/HORA DO CLIENTE:
${context.clientDateTime || "não informado"}

FUSO HORÁRIO:
${context.clientTimeZone || "não informado"}

MEMÓRIA:
${JSON.stringify(
  context.memory || {},
  null,
  2
)}

CONHECIMENTO:
${JSON.stringify(
  context.knowledge || {},
  null,
  2
)}

ESTADO DO CÉREBRO:
${JSON.stringify(
  context.brain || {},
  null,
  2
)}

SESSÃO:
${JSON.stringify(
  context.session || {},
  null,
  2
)}

Use essas informações somente quando forem relevantes.
`;
}


// ============================================================
// HANDLER PRINCIPAL
// ============================================================

export default async function handler(
  req,
  res
) {

  if (
    req.method !== "POST"
  ) {

    return errorResponse(
      res,
      405,
      "Método não permitido."
    );
  }


  if (!OPENAI_API_KEY) {

    return errorResponse(
      res,
      500,
      "OPENAI_API_KEY não configurada no servidor."
    );
  }


  try {

    const body =
      req.body || {};


    const message =
      typeof body.message === "string"
        ? body.message.trim()
        : "";


    if (!message) {

      return errorResponse(
        res,
        400,
        "Mensagem não informada."
      );
    }


    if (
      message.length > 12000
    ) {

      return errorResponse(
        res,
        400,
        "Mensagem muito grande."
      );
    }


    const context =
      normalizeContext(
        body
      );


    const contextPrompt =
      buildContextPrompt(
        context
      );


    const input = [

      {

        role:
          "system",

        content:
          JARVIS_SYSTEM
      },

      {

        role:
          "system",

        content:
          contextPrompt
      },

      {

        role:
          "user",

        content:
          message
      }

    ];


    const response =
      await fetch(
        "https://api.openai.com/v1/responses",
        {

          method:
            "POST",

          headers: {

            "Content-Type":
              "application/json",

            "Authorization":
              `Bearer ${OPENAI_API_KEY}`
          },

          body:
            JSON.stringify({

              model:
                MODEL,

              input,

              tools: [

                {

                  type:
                    "web_search"
                }

              ]

            })
        }
      );


    const data =
      await response.json();


    if (
      !response.ok
    ) {

      return errorResponse(
        res,
        response.status,
        "Erro retornado pela IA.",
        data
      );
    }


    const rawText =
      extractResponseText(
        data
      );


    if (!rawText) {

      return errorResponse(
        res,
        502,
        "A IA não retornou texto."
      );
    }


    const parsed =
      extractMemoryMarker(
        rawText
      );


    return res.status(200).json({

      ok: true,

      response:
        parsed.cleanText,

      memoryToSave:
        parsed.memory,

      model:
        MODEL,

      usage:
        data.usage ||
        null,

      responseId:
        data.id ||
        null,

      timestamp:
        new Date().toISOString()
    });


  } catch (error) {

    console.error(
      "JARVIS AI ERROR:",
      error
    );


    return errorResponse(
      res,
      500,
      "Erro interno ao conectar com o núcleo de IA.",
      error?.message
    );
  }
}
