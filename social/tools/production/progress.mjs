#!/usr/bin/env node
/** Evidence-bound milestones and model routing; native agent tools perform delegation. */
import {
  readFileSync,
  writeFileSync,
  realpathSync,
  existsSync,
  renameSync,
  rmSync,
} from "node:fs";
import { resolve, isAbsolute, join } from "node:path";
import { fileURLToPath } from "node:url";
import { parseArgs } from "node:util";

import { artifact, digest, requireValue } from "./artifacts.mjs";
import {
  readFinalDelivery,
  validatePublicationKit,
} from "./publication-kit.mjs";

export const policy = JSON.parse(
  readFileSync(
    new URL(
      "../../../.claude/skills/ethniafrica-production/references/routing.json",
      import.meta.url
    ),
    "utf8"
  )
);
const STATE = "production-progress.json";
export function createState(platform, subject) {
  requireValue(
    Object.hasOwn(policy.platforms, platform),
    "Unknown production platform"
  );
  requireValue(
    typeof subject === "string" && subject.trim(),
    "Subject is required"
  );
  return {
    version: 1,
    platform,
    subject,
    completed: {},
    active: null,
    events: [],
    waiting_for: null,
  };
}

function validateState(state) {
  requireValue(
    state?.version === 1 && Object.hasOwn(policy.platforms, state.platform),
    "Unsupported state version or platform"
  );
  requireValue(
    state.completed &&
      typeof state.completed === "object" &&
      !Array.isArray(state.completed),
    "Invalid completed milestones"
  );
  requireValue(Array.isArray(state.events), "Invalid model event history");
  if (state.model_overrides) {
    for (const [role, override] of Object.entries(state.model_overrides)) {
      requireValue(
        ["planner", "executor"].includes(role) &&
          override &&
          typeof override.model === "string" &&
          override.model.trim(),
        "Invalid model override"
      );
      requireValue(
        Object.keys(override).every((key) =>
          ["model", "reasoning_effort"].includes(key)
        ),
        "Model overrides cannot change worker contracts"
      );
    }
  }
  requireValue(
    Object.keys(state.completed).every((id) =>
      policy.stages.some((s) => s.id === id)
    ),
    "Unknown completed stage"
  );
}

function validateDelivery(root, record) {
  const manifest = record.evidence.find(
    (e) => e.path.endsWith("/delivery.json") || e.path === "delivery.json"
  );
  requireValue(manifest, "Delivery milestone requires delivery.json");
  const { report } = readFinalDelivery(root, manifest.path);
  const files = report.files;
  const handoffFile = record.evidence.find(
    (e) => e.path === "delivery-handoff.json"
  );
  requireValue(
    handoffFile,
    "Resolve publication and library handoff in delivery-handoff.json"
  );
  const handoff = JSON.parse(
    readFileSync(join(root, handoffFile.path), "utf8")
  );
  const nonempty = (value) => typeof value === "string" && value.trim();
  requireValue(handoff.version === 1, "Unknown delivery handoff version");
  const thumbnail = handoff.thumbnail;
  requireValue(
    thumbnail?.status === "approved" && nonempty(thumbnail.approval_reference),
    "A reviewed thumbnail and its actual approval reference are required"
  );
  const copy = handoff.social_copy;
  requireValue(
    copy?.status === "approved" && nonempty(copy.approval_reference),
    "Approved social copy in Markdown is required; exclusion cannot complete delivery"
  );
  requireValue(
    handoff.publication_kit &&
      artifact(root, handoff.publication_kit.path).sha256 ===
        handoff.publication_kit.sha256,
    "The publication kit manifest is missing or changed"
  );
  const kit = validatePublicationKit(
    root,
    handoff.publication_kit.path,
    manifest.path
  );
  for (const [name, item] of [
    ["thumbnail.png", thumbnail],
    ["publication-copy.md", copy],
  ]) {
    requireValue(
      item.path === kit.paths[name] && item.sha256 === kit.kit.files[name],
      `Approved ${name} differs from the publication kit`
    );
  }
  const library = handoff.library;
  if (library?.status === "unregistered")
    requireValue(
      nonempty(library.evidence),
      "Unregistered status needs evidence"
    );
  else {
    requireValue(
      library?.status === "complete" &&
        nonempty(library.post_id) &&
        nonempty(library.operation_reference),
      "Registered delivery needs an actual library operation reference and post ID"
    );
    for (const [name, hash] of [
      ["video", files["video.mp4"]],
      ["thumbnail", thumbnail.sha256],
      ["social_copy", copy.sha256],
    ]) {
      const path = library[`copied_${name}_path`];
      requireValue(
        nonempty(path) && isAbsolute(path),
        `Library ${name} path must come from the actual registry lookup`
      );
      requireValue(
        digest(readFileSync(path)) === hash,
        `Library ${name} differs from the finalized export`
      );
    }
  }
}

function validateRecord(root, state, stage, record) {
  requireValue(
    Array.isArray(record.evidence) && record.evidence.length,
    "Milestone needs artifact evidence"
  );
  if (stage.approval)
    requireValue(
      typeof record.approval_reference === "string" &&
        record.approval_reference.trim(),
      `${stage.id} needs actual approval evidence`
    );
  for (const item of record.evidence)
    requireValue(
      artifact(root, item.path).sha256 === item.sha256,
      `Changed evidence: ${item.path}`
    );
  if (stage.id === "delivery") validateDelivery(root, record);
}

export function getProgress(root, state) {
  validateState(state);
  let percent = 0;
  let stage = null;
  const rows = policy.stages.map((s) => {
    if (stage) return { ...s, status: "pending" };
    const record = state.completed[s.id];
    let issue = null;
    if (record) {
      try {
        validateRecord(root, state, s, record);
      } catch (error) {
        issue = error.message;
      }
    }
    if (!record || issue) {
      stage = s;
      return { ...s, status: issue ? "stale" : "pending", issue };
    }
    percent += s.weight;
    return { ...s, status: "complete" };
  });
  return {
    percent,
    stage,
    rows,
    route: stage ? routeFor(state, stage.role) : null,
  };
}

function routeFor(state, role) {
  return {
    ...policy.platforms[state.platform][role],
    ...state.model_overrides?.[role],
  };
}

export function completeStage(
  root,
  state,
  stageId,
  paths,
  approvalReference = ""
) {
  const progress = getProgress(root, state);
  requireValue(
    progress.stage?.id === stageId,
    `Only the next stage (${progress.stage?.id ?? "none"}) can be completed`
  );
  requireValue(
    Array.isArray(paths) && paths.length,
    "Milestone needs artifact evidence"
  );
  const record = {
    evidence: paths.map((path) => artifact(root, path)),
    approval_reference: approvalReference,
    completed_at: new Date().toISOString(),
  };
  validateRecord(root, state, progress.stage, record);
  // Previously completed dependents remain in history, never silently regain validity.
  const index = policy.stages.findIndex((s) => s.id === stageId);
  const invalidated = Object.fromEntries(
    policy.stages
      .slice(index)
      .filter((s) => state.completed[s.id])
      .map((s) => [s.id, state.completed[s.id]])
  );
  if (Object.keys(invalidated).length)
    state.events.push({
      type: "invalidated",
      records: invalidated,
      at: record.completed_at,
    });
  for (const s of policy.stages.slice(index)) delete state.completed[s.id];
  state.completed[stageId] = record;
  state.active = null;
  state.waiting_for = null;
  return state;
}

export function checkGate(root, state, stageId) {
  const progress = getProgress(root, state);
  requireValue(
    !state.waiting_for,
    `Production is waiting: ${state.waiting_for}`
  );
  requireValue(
    progress.stage?.id === stageId,
    `Expected next stage ${progress.stage?.id ?? "none"}, cannot execute ${stageId}`
  );
  return progress;
}

export function startTask(
  root,
  state,
  {
    taskId,
    observedModel = null,
    modelEvidence = null,
    support = false,
    reason = null,
  }
) {
  const progress = getProgress(root, state);
  requireValue(
    !state.waiting_for || support,
    "Resolve the waiting decision before dispatching dependent work"
  );
  requireValue(
    progress.stage && typeof taskId === "string" && taskId.trim(),
    "A current stage and actual task ID are required"
  );
  requireValue(
    !observedModel ||
      (typeof modelEvidence === "string" && modelEvidence.trim()),
    "Observed models require host model evidence"
  );
  requireValue(
    !support || (typeof reason === "string" && reason.trim()),
    "Support routing needs a reason"
  );
  const route = routeFor(state, support ? "planner" : progress.stage.role);
  state.active = {
    stage: progress.stage.id,
    task_id: taskId,
    requested_model: route.model,
    observed_model: observedModel,
    model_evidence: modelEvidence,
    support,
    reason,
    at: new Date().toISOString(),
  };
  state.events.push({ type: "dispatch", ...state.active });
  return state;
}

export function dashboard(root, state) {
  const p = getProgress(root, state);
  const count = Math.floor(p.percent / 10);
  const active = state.active?.stage === p.stage?.id ? state.active : null;
  const clean = (text) => String(text).replace(/[\r\n|]/g, " ");
  const lines = [
    `**Production : ${clean(state.subject)} — ${p.percent} %**`,
    `${"■".repeat(count)}${"□".repeat(10 - count)} · jalons terminés, pas une estimation du temps restant`,
    `**Étape : ${p.stage ? clean(p.stage.label) : "Livraison terminée"}**`,
    `**Modèle demandé : ${active?.requested_model ?? p.route?.model ?? "aucun"} · modèle observé : ${active?.observed_model ?? "non confirmé"}**`,
  ];
  if (
    active?.observed_model &&
    active.observed_model !== active.requested_model
  )
    lines.push(
      "Modèle observé différent du modèle demandé : vérifier la résolution du fournisseur."
    );
  if (active?.reason)
    lines.push(`Retour au modèle de préparation : ${clean(active.reason)}`);
  if (state.waiting_for)
    lines.push(`**En attente : ${clean(state.waiting_for)}**`);
  lines.push("", "| Étape | État |", "| --- | --- |");
  for (const row of p.rows)
    lines.push(
      `| ${row.label} | ${row.status === "complete" ? "✓ Terminée" : row.status === "stale" ? "↺ À revérifier" : row.id === p.stage?.id ? (state.waiting_for ? "⏸ En attente" : "→ À poursuivre") : "À venir"} |`
    );
  for (const row of p.rows.filter((r) => r.issue))
    lines.push(`À vérifier : ${clean(row.issue)}`);
  return lines.join("\n");
}

function main() {
  const { positionals, values } = parseArgs({
    allowPositionals: true,
    options: {
      platform: { type: "string" },
      subject: { type: "string" },
      stage: { type: "string" },
      evidence: { type: "string", multiple: true },
      "approval-reference": { type: "string" },
      "task-id": { type: "string" },
      "observed-model": { type: "string" },
      "model-evidence": { type: "string" },
      support: { type: "boolean" },
      reason: { type: "string" },
      json: { type: "boolean" },
      role: { type: "string" },
      model: { type: "string" },
      "reasoning-effort": { type: "string" },
    },
  });
  const [command, project] = positionals;
  requireValue(
    project && positionals.length === 2,
    "Usage: node social/tools/production/progress.mjs init|status|gate|complete|start|wait|resume|model PROJECT [options]"
  );
  const root = realpathSync(project);
  const statePath = join(root, STATE);
  let state;
  if (command === "init") {
    requireValue(
      !existsSync(statePath),
      "Production state already exists; resume it"
    );
    state = createState(values.platform, values.subject);
  } else {
    state = JSON.parse(readFileSync(statePath, "utf8"));
    validateState(state);
    if (command === "gate") checkGate(root, state, values.stage);
    else if (command === "complete") {
      completeStage(
        root,
        state,
        values.stage,
        values.evidence,
        values["approval-reference"]
      );
    } else if (command === "start")
      startTask(root, state, {
        taskId: values["task-id"],
        observedModel: values["observed-model"],
        modelEvidence: values["model-evidence"],
        support: values.support,
        reason: values.reason,
      });
    else if (command === "wait") {
      requireValue(values.reason?.trim(), "Waiting needs a reason");
      state.waiting_for = values.reason;
    } else if (command === "resume") state.waiting_for = null;
    else if (command === "model") {
      requireValue(
        ["planner", "executor"].includes(values.role) &&
          values.model?.trim() &&
          values.reason?.trim(),
        "Model override requires role, model and actual operator authorization reference"
      );
      state.model_overrides ??= {};
      state.model_overrides[values.role] = {
        model: values.model,
        ...(values["reasoning-effort"]
          ? { reasoning_effort: values["reasoning-effort"] }
          : {}),
      };
      state.events.push({
        type: "model_override",
        role: values.role,
        ...state.model_overrides[values.role],
        reason: values.reason,
        at: new Date().toISOString(),
      });
    } else requireValue(command === "status", "Unknown progress command");
  }
  if (command === "init")
    writeFileSync(statePath, JSON.stringify(state, null, 2) + "\n", {
      flag: "wx",
    });
  else if (command !== "status" && command !== "gate") {
    const temporary = statePath + `.pending-${process.pid}`;
    try {
      writeFileSync(temporary, JSON.stringify(state, null, 2) + "\n", {
        flag: "wx",
      });
      renameSync(temporary, statePath);
    } finally {
      rmSync(temporary, { force: true });
    }
  }
  console.log(
    values.json
      ? JSON.stringify(getProgress(root, state), null, 2)
      : dashboard(root, state)
  );
}

if (
  process.argv[1] &&
  resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  try {
    main();
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
