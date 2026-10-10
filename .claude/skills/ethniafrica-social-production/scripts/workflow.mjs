#!/usr/bin/env node
// @req REQ-186
// Checkpoints and publication evidence; posting and deployment are never automatic.
import { createHash, randomUUID } from "node:crypto";
import {
  existsSync,
  mkdirSync,
  readFileSync,
  writeFileSync,
  readdirSync,
  realpathSync,
  openSync,
  closeSync,
  fsyncSync,
  renameSync,
  unlinkSync,
} from "node:fs";
import { resolve, join, relative, isAbsolute, sep } from "node:path";
import { pathToFileURL } from "node:url";

import { assessResearch, discoverCorpus, verifyProgress } from "./research.mjs";
import { inspectPackage } from "./package.mjs";
import { capturePublication } from "./history.mjs";

const AREA = ".local/productions";
const STAGES = ["brief", "research", "proof", "produce", "package", "ready"];
const NETWORKS = ["instagram", "facebook", "tiktok", "youtube", "x"];
const fail = (message) => {
  throw new Error(message);
};
const required = (value, name) =>
  typeof value === "string" && value.trim()
    ? value
    : fail(`${name} is required`);

function pieceDir(root, id) {
  if (!/^[a-z0-9][a-z0-9-]{0,95}$/.test(id)) fail("Invalid piece identifier");
  return join(resolve(root), AREA, id);
}

function filePath(root, path) {
  required(path, "Artifact path");
  const absolute = resolve(root, path);
  const rel = relative(resolve(root), absolute);
  if (isAbsolute(path) || rel === ".." || rel.startsWith(`..${sep}`))
    fail("Artifact path must stay inside the project");
  if (existsSync(absolute)) {
    const real = relative(realpathSync(root), realpathSync(absolute));
    if (real === ".." || real.startsWith(`..${sep}`))
      fail("Artifact path resolves outside the project");
  }
  return absolute;
}

function fingerprint(root, file) {
  return createHash("sha256")
    .update(readFileSync(filePath(root, file)))
    .digest("hex");
}

function snapshots(root, files) {
  if (!Array.isArray(files) || !files.length) fail("Review files are required");
  return Object.fromEntries(
    [...new Set(files)].map((file) => [file, fingerprint(root, file)])
  );
}

function current(root, files) {
  return Object.entries(files).every(([file, hash]) => {
    try {
      return fingerprint(root, file) === hash;
    } catch {
      return false;
    }
  });
}

function readStored(root, id) {
  const text = readFileSync(join(pieceDir(root, id), "suivi.md"), "utf8");
  const json = /^```json\n([\s\S]*?)\n```$/m.exec(text)?.[1];
  if (!json)
    fail(
      "Checkpoint has no complete state block; preserve it and inspect recovery"
    );
  const state = JSON.parse(json);
  if (
    state.schema !== 1 ||
    state.id !== id ||
    !Number.isInteger(state.revision) ||
    !STAGES.includes(state.stage)
  )
    fail("Unsupported or invalid checkpoint");
  return state;
}

function invalidate(state, from) {
  for (let gate = from; gate <= 3; gate++) {
    if (state.approvals[gate]) state.approvals[gate].status = "stale";
    delete state.reviews[gate];
  }
  state.waitingFor = null;
}

export function loadPiece(root, id) {
  const state = readStored(root, id);
  for (let gate = 1; gate <= 3; gate++) {
    const approval = state.approvals[gate];
    if (approval?.status === "approved" && !current(root, approval.files)) {
      invalidate(state, gate);
      state.stage = gate === 1 ? "brief" : gate === 2 ? "research" : "package";
      state.nextAction = `Changed or missing artifacts: revisit approval ${gate}`;
      break;
    }
  }
  if (
    state.design &&
    !current(root, { [state.design.file]: state.design.hash })
  ) {
    invalidate(state, 2);
    state.stage =
      state.approvals[1]?.status === "approved" ? "research" : "brief";
    state.waitingFor = "design-system";
    state.nextAction = "Ask the operator to confirm the changed design system";
  }
  if (state.approvals[2]?.status === "approved") {
    let stale = !state.research;
    if (!stale) {
      try {
        const matches = discoverCorpus(root, state.research.searchTerms).map(
          (m) => m.file
        );
        stale =
          JSON.stringify(matches) !==
          JSON.stringify(state.research.matchedFiles);
      } catch {
        stale = true;
      }
    }
    if (stale) {
      invalidate(state, 2);
      state.stage =
        state.approvals[1]?.status === "approved" ? "research" : "brief";
      state.nextAction =
        "Research coverage changed or is missing; compare the corpus before proof";
    }
  }
  if (state.approvals[3]?.status === "approved" && !state.package) {
    invalidate(state, 3);
    state.stage = "package";
    state.nextAction = "Prepare and review the verified publication package";
  }
  for (const progress of state.corpusProgress ?? []) {
    progress.evidenceCurrent = current(root, {
      [progress.evidence]: progress.evidenceHash,
    });
  }
  return state;
}

export function withPieceLock(root, id, operation) {
  const lock = join(pieceDir(root, id), ".suivi.lock");
  if (existsSync(lock)) {
    const pid = Number(readFileSync(lock, "utf8"));
    if (!Number.isInteger(pid) || pid <= 0)
      fail("Checkpoint lock needs inspection");
    try {
      process.kill(pid, 0);
      fail("Checkpoint is locked by a running process");
    } catch (error) {
      if (error.code !== "ESRCH") throw error;
    }
    unlinkSync(lock);
  }
  const lockFd = openSync(lock, "wx");
  writeFileSync(lockFd, String(process.pid));
  try {
    return operation();
  } finally {
    closeSync(lockFd);
    unlinkSync(lock);
  }
}

export function savePiece(
  root,
  state,
  expectedRevision,
  beforeReplace = () => {},
  lockHeld = false
) {
  if (!lockHeld)
    return withPieceLock(root, state.id, () =>
      savePiece(root, state, expectedRevision, beforeReplace, true)
    );
  if (existsSync(join(resolve(root), ".local/publications", state.id)))
    fail(
      "Piece is archived; complete closure or start a new piece for later changes"
    );
  const directory = pieceDir(root, state.id);
  const target = join(directory, "suivi.md");
  const temporary = join(directory, `.suivi-${randomUUID()}.tmp`);
  try {
    const revision = existsSync(target)
      ? readStored(root, state.id).revision
      : 0;
    if (revision !== expectedRevision)
      fail("Checkpoint revision changed; reload before saving");
    const next = {
      ...state,
      revision: revision + 1,
      updatedAt: new Date().toISOString(),
    };
    const approvals = [1, 2, 3]
      .map((gate) => `${gate}: ${next.approvals[gate]?.status ?? "pending"}`)
      .join("; ");
    const text = `# Production checkpoint — ${next.subject}\n\nStage: ${next.stage}\n\nWaiting for: ${next.waitingFor ?? "nothing"}\n\nApprovals: ${approvals}\n\nNext action: ${next.nextAction}\n\n${next.context}\n\n## Saved state\n\n\`\`\`json\n${JSON.stringify(next, null, 2)}\n\`\`\`\n`;
    const fd = openSync(temporary, "wx");
    try {
      writeFileSync(fd, text);
      fsyncSync(fd);
    } finally {
      closeSync(fd);
    }
    beforeReplace();
    renameSync(temporary, target);
    return next;
  } finally {
    if (existsSync(temporary)) unlinkSync(temporary);
  }
}

export function createPiece(root, id, subject, networks) {
  required(subject, "Subject");
  if (
    !Array.isArray(networks) ||
    !networks.length ||
    networks.some((n) => !NETWORKS.includes(n))
  )
    fail("Select valid networks");
  const directory = pieceDir(root, id);
  mkdirSync(join(resolve(root), AREA), { recursive: true });
  if (
    existsSync(directory) ||
    existsSync(join(resolve(root), ".local/publications", id))
  )
    fail("Piece folder or archive already exists; inspect or resume it");
  mkdirSync(directory);
  return savePiece(
    root,
    {
      schema: 1,
      id,
      subject,
      networks: [...new Set(networks)],
      intendedNetworks: [...new Set(networks)],
      cancellations: {},
      revision: 0,
      stage: "brief",
      waitingFor: null,
      approvals: {},
      reviews: {},
      design: null,
      context: "",
      corrections: [],
      publications: [],
      nextAction: "Prepare the brief and request approval 1",
    },
    0
  );
}

export function listPieces(root, query = "") {
  const directory = join(resolve(root), AREA);
  if (!existsSync(directory)) return [];
  return readdirSync(directory, { withFileTypes: true })
    .filter(
      (entry) =>
        entry.isDirectory() &&
        existsSync(join(directory, entry.name, "suivi.md"))
    )
    .map((entry) => {
      try {
        return loadPiece(root, entry.name);
      } catch (error) {
        return { id: entry.name, error: error.message };
      }
    })
    .filter((s) =>
      `${s.id} ${s.subject ?? ""}`.toLowerCase().includes(query.toLowerCase())
    );
}

export function applyEvent(root, id, event) {
  return withPieceLock(root, id, () => applyLockedEvent(root, id, event));
}
function applyLockedEvent(root, id, event) {
  if (existsSync(join(resolve(root), ".local/publications", id)))
    fail("Piece is archived; complete closure before starting a new piece");
  const state = loadPiece(root, id);
  if (event.expectedRevision !== state.revision)
    fail("Checkpoint revision changed; reload before applying the event");
  state.intendedNetworks ??= [...state.networks];
  state.cancellations ??= {};
  const approved = (gate) => {
    if (state.approvals[gate]?.status !== "approved")
      fail(`Human approval ${gate} is required`);
  };
  const designReady = () => {
    if (
      !state.design ||
      !current(root, { [state.design.file]: state.design.hash })
    )
      fail("Wait for the operator-supplied design system");
  };
  switch (event.type) {
    case "checkpoint":
      state.nextAction = required(event.nextAction, "Next action");
      if (event.context !== undefined)
        state.context = required(event.context, "Context");
      if (event.waitingFor !== undefined) {
        if (
          ![
            null,
            "design-system",
            "operator-information",
            "operator-resume",
          ].includes(event.waitingFor)
        )
          fail("Invalid waiting reason");
        if (state.waitingFor?.startsWith("approval-"))
          fail("Preserve the pending approval when checkpointing");
        state.waitingFor = event.waitingFor;
      }
      break;
    case "design":
      required(event.decision, "Operator design decision");
      state.design = {
        file: event.file,
        hash: fingerprint(root, event.file),
        decision: event.decision,
      };
      invalidate(state, 2);
      state.stage =
        state.approvals[1]?.status === "approved" ? "research" : "brief";
      state.nextAction =
        "Continue the current stage using the returned design system";
      break;
    case "review": {
      const gate = event.gate;
      if (![1, 2, 3].includes(gate)) fail("Review gate must be 1, 2 or 3");
      for (let previous = 1; previous < gate; previous++) approved(previous);
      if (gate > 1) designReady();
      const files = snapshots(root, event.files);
      if (gate > 1) files[state.design.file] = state.design.hash;
      if (gate === 2) {
        required(event.researchFile, "Research dossier");
        const research = assessResearch(root, event.researchFile);
        Object.assign(files, research.dependencies);
        state.research = {
          file: event.researchFile,
          hash: research.dependencies[event.researchFile],
          corrections: research.corrections,
          searchTerms: research.searchTerms,
          matchedFiles: research.matchedFiles,
        };
      }
      if (gate === 3) {
        if (!state.research) fail("Research dossier is required");
        const research = assessResearch(root, state.research.file, {
          forDelivery: true,
        });
        Object.assign(files, research.dependencies);
        required(event.packageDir, "Verified package directory");
        const delivery = inspectPackage(root, event.packageDir, state.networks);
        if (delivery.researchFile !== state.research.file)
          fail("Package research differs from the approved proof");
        Object.assign(files, delivery.files);
        state.package = {
          directory: event.packageDir,
          configFile: delivery.configFile,
        };
      }
      const summary = required(event.summary, "Review summary");
      invalidate(state, gate);
      state.reviews[gate] = { files, summary };
      state.stage = gate === 1 ? "brief" : gate === 2 ? "proof" : "package";
      state.waitingFor = `approval-${gate}`;
      state.nextAction = `Present the exact files and wait for human approval ${gate}`;
      break;
    }
    case "approve": {
      const gate = event.gate;
      required(event.decision, "Operator decision");
      const review = state.reviews[gate];
      if (!review || state.waitingFor !== `approval-${gate}`)
        fail("Present a current review before recording approval");
      if (!current(root, review.files))
        fail(
          "Review artifacts changed; present the new version before approval"
        );
      for (let previous = 1; previous < gate; previous++) approved(previous);
      if (gate === 2) {
        const research = assessResearch(root, state.research.file);
        if (
          JSON.stringify(research.matchedFiles) !==
          JSON.stringify(state.research.matchedFiles)
        )
          fail("Research coverage changed; present the updated proof");
      }
      if (gate === 3)
        inspectPackage(root, state.package.directory, state.networks);
      state.approvals[gate] = {
        ...review,
        status: "approved",
        decision: event.decision,
        at: new Date().toISOString(),
      };
      if (gate === 2) {
        state.corpusProposals ??= {};
        for (const correction of state.research.corrections) {
          const key = `${state.research.hash}:${correction.id}`;
          state.corpusProposals[key] = correction;
        }
      }
      delete state.reviews[gate];
      state.waitingFor = null;
      state.stage = gate === 1 ? "research" : gate === 2 ? "produce" : "ready";
      state.nextAction =
        gate === 1
          ? "Research, compare the corpus and prepare the proof"
          : gate === 2
            ? "Produce and check final media, then prepare the package"
            : "Deliver the approved package; posting requires an explicit instruction";
      break;
    }
    case "revise": {
      const routes = {
        angle: [1, "brief"],
        research: [2, "research"],
        copy: [2, "research"],
        crop: [3, "produce"],
        package: [3, "package"],
        design: [2, "research"],
      };
      const route = routes[event.kind];
      if (!route) fail("Unknown correction kind");
      const reason = required(event.reason, "Correction reason");
      invalidate(state, route[0]);
      state.stage =
        state.approvals[1]?.status === "approved" ? route[1] : "brief";
      if (event.kind === "design") {
        state.design = null;
        state.waitingFor = "design-system";
      }
      state.corrections.push({
        atRevision: state.revision + 1,
        kind: event.kind,
        reason,
        at: new Date().toISOString(),
      });
      state.nextAction = reason;
      break;
    }
    case "networks":
      required(event.reason, "Network change reason");
      if (
        !Array.isArray(event.networks) ||
        !event.networks.length ||
        event.networks.some((n) => !NETWORKS.includes(n))
      )
        fail("Select valid networks");
      state.intendedNetworks = [
        ...new Set([...state.intendedNetworks, ...event.networks]),
      ];
      for (const network of event.networks) delete state.cancellations[network];
      state.networks = [...new Set(event.networks)];
      invalidate(state, 3);
      state.stage =
        state.approvals[2]?.status === "approved"
          ? "package"
          : state.approvals[1]?.status === "approved"
            ? "research"
            : "brief";
      state.corrections.push({
        atRevision: state.revision + 1,
        kind: "networks",
        reason: event.reason,
        at: new Date().toISOString(),
      });
      state.nextAction =
        "Prepare the changed network adaptation and review final delivery";
      break;
    case "corpus-progress": {
      const correction = state.corpusProposals?.[event.proposal];
      if (!correction) fail("A corpus proposal approved at gate 2 is required");
      state.corpusProgress ??= [];
      const previous = state.corpusProgress.filter(
        (p) => p.proposal === event.proposal
      );
      if (
        previous.some((p) => !current(root, { [p.evidence]: p.evidenceHash }))
      )
        fail(
          "Corpus progress evidence changed; restore or inspect it before advancing"
        );
      const result = verifyProgress(
        root,
        { corrections: [correction] },
        {
          ...event,
          correction: correction.id,
        },
        previous
      );
      state.corpusProgress.push(result);
      break;
    }
    case "cancel-network":
      if (!state.intendedNetworks.includes(event.network))
        fail("Unknown intended network");
      if (state.publications.some((p) => p.network === event.network))
        fail("A published outcome cannot be cancelled");
      state.cancellations[event.network] = {
        reason: required(event.reason, "Operator cancellation reason"),
        at: new Date().toISOString(),
      };
      break;
    case "publication":
      approved(3);
      if (!state.networks.includes(event.network))
        fail("Network is outside the reviewed commission");
      required(event.evidence, "Publication evidence");
      if (
        !/^\d{4}-\d{2}-\d{2}$/.test(event.publishedAt) ||
        !Number.isFinite(Date.parse(event.publishedAt)) ||
        new Date(event.publishedAt).toISOString().slice(0, 10) !==
          event.publishedAt
      )
        fail("Publication date is required");
      if (event.url !== null && !/^https:\/\//.test(event.url ?? ""))
        fail("Publication URL must be HTTPS or explicitly null");
      if (state.publications.some((p) => event.url && p.url === event.url))
        fail("Publication URL already recorded");
      state.publications.push({
        atRevision: state.revision + 1,
        network: event.network,
        url: event.url,
        publishedAt: event.publishedAt,
        evidence: event.evidence,
        snapshot: capturePublication(root, state, event.network),
      });
      delete state.cancellations[event.network];
      state.nextAction =
        "Verify remaining networks and corpus work, then consolidate history and clean verified intermediates";
      break;
    default:
      fail("Unknown event type");
  }
  return savePiece(root, state, event.expectedRevision, undefined, true);
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(resolve(process.argv[1])).href
) {
  try {
    const [command, id, subject, ...networks] = process.argv.slice(2);
    const root = process.cwd();
    const result =
      command === "init"
        ? createPiece(root, id, subject, networks)
        : command === "list"
          ? listPieces(root, id)
          : command === "status"
            ? loadPiece(root, id)
            : command === "event"
              ? applyEvent(root, id, JSON.parse(readFileSync(0, "utf8")))
              : fail(
                  "Usage: workflow.mjs init ID SUBJECT NETWORK... | list [QUERY] | status ID | event ID < event.json"
                );
    console.log(JSON.stringify(result, null, 2));
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
