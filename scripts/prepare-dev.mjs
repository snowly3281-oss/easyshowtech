import { execFileSync } from "node:child_process";
import { rmSync } from "node:fs";
import path from "node:path";

const projectRoot = process.cwd();
const devPort = Number.parseInt(process.env.PORT ?? "4321", 10);

function run(command, args) {
  try {
    return execFileSync(command, args, {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    }).trim();
  } catch {
    return "";
  }
}

function listenerPids(port) {
  return run("lsof", [`-tiTCP:${port}`, "-sTCP:LISTEN"])
    .split(/\s+/)
    .filter(Boolean)
    .map(Number)
    .filter(Number.isInteger);
}

function processInfo(pid) {
  const command = run("ps", ["-p", String(pid), "-o", "command="]);
  const cwdLine = run("lsof", [
    "-a",
    "-p",
    String(pid),
    "-d",
    "cwd",
    "-Fn",
  ])
    .split("\n")
    .find((line) => line.startsWith("n"));

  return {
    command,
    cwd: cwdLine?.slice(1) ?? "",
  };
}

function isRunning(pid) {
  try {
    process.kill(pid, 0);
    return true;
  } catch {
    return false;
  }
}

async function waitForExit(pid, timeoutMs) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    if (!isRunning(pid)) return true;
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  return !isRunning(pid);
}

async function stopExistingProjectServer(pid) {
  const info = processInfo(pid);
  const sameProject = path.resolve(info.cwd) === path.resolve(projectRoot);
  const isAstroDev = /(?:^|\s|\/)astro(?:\s|$).*?\bdev\b/.test(info.command);

  if (!sameProject || !isAstroDev) {
    throw new Error(
      [
        `Port ${devPort} is occupied by a process that does not look like this project's Astro server.`,
        `PID: ${pid}`,
        `Working directory: ${info.cwd || "unknown"}`,
        `Command: ${info.command || "unknown"}`,
        "Stop that process manually or start this project with a different PORT.",
      ].join("\n"),
    );
  }

  console.log(`Stopping the existing Coral dev server (PID ${pid})…`);
  process.kill(pid, "SIGTERM");

  if (!(await waitForExit(pid, 3_000))) {
    process.kill(pid, "SIGKILL");
    await waitForExit(pid, 1_000);
  }
}

for (const pid of listenerPids(devPort)) {
  await stopExistingProjectServer(pid);
}

const viteCache = path.join(projectRoot, "node_modules", ".vite");
rmSync(viteCache, { recursive: true, force: true });
console.log("Cleared the Vite dependency cache.");
