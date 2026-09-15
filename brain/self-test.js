// ============================================================
// JARVIS V6 — SELF TEST
// Teste geral dos módulos principais
// ============================================================

import {
  getEngineStatus,
  diagnoseEngine
} from "./engine.js";

import {
  getSystemStatus,
  diagnoseSystem
} from "./system.js";

import {
  diagnoseBrain
} from "./brain.js";

import {
  diagnoseRouter
} from "./router.js";

import {
  diagnoseAI
} from "./ai.js";

import {
  diagnoseVoiceManager
} from "./voice-manager.js";

import {
  diagnoseAutomationControl
} from "./automation-control.js";

import {
  diagnoseWorkflowManager
} from "./workflow-manager.js";

import {
  diagnoseControl
} from "./control.js";

import {
  diagnoseSession
} from "./session.js";

import {
  diagnoseBrainState
} from "./state.js";

export const SELF_TEST_VERSION = "1.0.0";

// ============================================================
// TESTE
// ============================================================

export function runSelfTest() {
  const tests = {};

  function safeTest(name, callback) {
    try {
      const result = callback();

      tests[name] = {
        ok: result?.ok !== false,
        result
      };

    } catch (error) {
      tests[name] = {
        ok: false,
        error: error?.message || "Erro desconhecido."
      };
    }
  }

  safeTest("engine", getEngineStatus);
  safeTest("system", diagnoseSystem);
  safeTest("brain", diagnoseBrain);
  safeTest("router", diagnoseRouter);
  safeTest("ai", diagnoseAI);
  safeTest("voice", diagnoseVoiceManager);
  safeTest(
    "automation",
    diagnoseAutomationControl
  );
  safeTest(
    "workflow",
    diagnoseWorkflowManager
  );
  safeTest("control", diagnoseControl);
  safeTest("session", diagnoseSession);
  safeTest("brainState", diagnoseBrainState);

  const entries = Object.entries(tests);

  const passed = entries.filter(
    ([, test]) => test.ok
  ).length;

  const failed = entries.filter(
    ([, test]) => !test.ok
  ).length;

  return {
    ok: failed === 0,

    version: SELF_TEST_VERSION,

    summary: {
      total: entries.length,
      passed,
      failed
    },

    tests,

    engine: getEngineStatus()
  };
}

// ============================================================
// TESTE RÁPIDO
// ============================================================

export function quickSelfTest() {
  const result = runSelfTest();

  return {
    ok: result.ok,

    total: result.summary.total,

    passed: result.summary.passed,

    failed: result.summary.failed
  };
}

// ============================================================
// INFORMAÇÕES
// ============================================================

export function getSelfTestInfo() {
  return {
    version: SELF_TEST_VERSION,
    modules: [
      "engine",
      "system",
      "brain",
      "router",
      "ai",
      "voice",
      "automation",
      "workflow",
      "control",
      "session",
      "brainState"
    ]
  };
}
