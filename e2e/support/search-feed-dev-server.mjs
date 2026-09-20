import { createServer } from "node:http";
import { spawn } from "node:child_process";

const appPort = process.argv[2] ?? "3111";
const supabasePort = process.argv[3] ?? "54322";
const supabaseOrigin = `http://127.0.0.1:${supabasePort}`;

let nextProcess;
let unexpectedRequest;
let shuttingDown = false;

const fixtureServer = createServer((request, response) => {
  const url = new URL(request.url ?? "/", supabaseOrigin);

  if (
    ["GET", "HEAD"].includes(request.method ?? "") &&
    url.pathname.startsWith("/rest/v1/")
  ) {
    response.writeHead(200, {
      "content-type": "application/json",
      "content-range": "*/0",
    });
    response.end(request.method === "HEAD" ? undefined : "[]");
    return;
  }

  if (request.method === "GET" && url.pathname === "/auth/v1/user") {
    response.writeHead(401, { "content-type": "application/json" });
    response.end(
      JSON.stringify({ code: "session_not_found", message: "No fixture user" })
    );
    return;
  }

  unexpectedRequest = `${request.method ?? "UNKNOWN"} ${url.pathname}`;
  response.writeHead(500, { "content-type": "application/json" });
  response.end(
    JSON.stringify({ error: `Unexpected request: ${unexpectedRequest}` })
  );
  process.stderr.write(`Search-feed fixture rejected ${unexpectedRequest}\n`);
  nextProcess?.kill("SIGTERM");
});

function shutDown(exitCode, signal) {
  if (shuttingDown) return;
  shuttingDown = true;
  if (signal) nextProcess?.kill(signal);
  fixtureServer.close(() => {
    process.exit(unexpectedRequest ? 1 : exitCode);
  });
}

for (const signal of ["SIGINT", "SIGTERM"]) {
  process.on(signal, () => {
    shutDown(0, signal);
  });
}

fixtureServer.listen(Number(supabasePort), "127.0.0.1", () => {
  nextProcess = spawn(
    process.platform === "win32" ? "npm.cmd" : "npm",
    ["run", "dev", "--", "--port", appPort],
    {
      env: {
        ...process.env,
        NEXT_PUBLIC_SUPABASE_URL: supabaseOrigin,
        NEXT_PUBLIC_SUPABASE_ANON_KEY: "search-feed-fixture-anon-key",
        SUPABASE_URL: supabaseOrigin,
      },
      stdio: "inherit",
    }
  );

  nextProcess.on("exit", (code) => {
    shutDown(code ?? 1);
  });
});
