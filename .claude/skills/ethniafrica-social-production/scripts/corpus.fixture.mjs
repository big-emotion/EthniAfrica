// @req REQ-186
// The reviewed fiche bytes are recovered from version history, so fixtures
// commit the reviewed corpus the way the normal repository path does.
import { execFileSync } from "node:child_process";

export function commitCorpus(root, message = "Reviewed corpus") {
  // A caller running inside a hook may export GIT_DIR; the fixture repository
  // must never write into the real one.
  const env = Object.fromEntries(
    Object.entries(process.env).filter(([key]) => !key.startsWith("GIT_"))
  );
  const run = (...args) =>
    execFileSync(
      "git",
      [
        "-c",
        "user.name=Fixture",
        "-c",
        "user.email=fixture@example.org",
        "-c",
        "commit.gpgsign=false",
        "-c",
        "core.hooksPath=/dev/null",
        ...args,
      ],
      { cwd: root, env, stdio: "ignore" }
    );
  run("init", "-q");
  run("add", "dataset");
  run("commit", "-q", "-m", message);
}
