import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, statSync, writeFileSync } from "node:fs";
import { spawn } from "node:child_process";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { startServer } from "./serve.mjs";

const output = resolve(process.argv[2] || "dist/brigida-citadel-presentation.pdf");
const browser = process.env.CHROME_BIN || [
  "/usr/bin/chromium",
  "/usr/bin/chromium-browser",
  "/usr/bin/google-chrome"
].find((candidate) => {
  try {
    return Boolean(statSync(candidate));
  } catch {
    return false;
  }
});

if (!browser) {
  console.error("No Chromium-based browser found. Set CHROME_BIN to its executable path.");
  process.exit(1);
}

const wait = (milliseconds) => new Promise((resolveWait) => setTimeout(resolveWait, milliseconds));

async function waitForValue(readValue, description, attempts = 100) {
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    try {
      const value = await readValue();
      if (value) return value;
    } catch {
      // The browser and presentation need a brief startup window.
    }
    await wait(100);
  }
  throw new Error(`Timed out waiting for ${description}`);
}

class CdpClient {
  constructor(url) {
    this.nextId = 1;
    this.pending = new Map();
    this.socket = new WebSocket(url);
    this.socket.addEventListener("message", ({ data }) => {
      const message = JSON.parse(data);
      if (!message.id || !this.pending.has(message.id)) return;
      const { resolveMessage, rejectMessage } = this.pending.get(message.id);
      this.pending.delete(message.id);
      if (message.error) rejectMessage(new Error(message.error.message));
      else resolveMessage(message.result);
    });
  }

  async ready() {
    if (this.socket.readyState === WebSocket.OPEN) return;
    await new Promise((resolveOpen, rejectOpen) => {
      this.socket.addEventListener("open", resolveOpen, { once: true });
      this.socket.addEventListener("error", rejectOpen, { once: true });
    });
  }

  send(method, params = {}) {
    const id = this.nextId;
    this.nextId += 1;
    this.socket.send(JSON.stringify({ id, method, params }));
    return new Promise((resolveMessage, rejectMessage) => {
      this.pending.set(id, { resolveMessage, rejectMessage });
    });
  }

  close() {
    this.socket.close();
  }
}

mkdirSync(dirname(output), { recursive: true });
const profile = mkdtempSync(join(tmpdir(), "citadel-slides-chromium-"));
const server = await startServer({ listenPort: 4174, quiet: true });
const child = spawn(browser, [
  "--headless",
  "--disable-gpu",
  "--no-sandbox",
  "--disable-dev-shm-usage",
  "--remote-debugging-port=0",
  `--user-data-dir=${profile}`,
  "about:blank"
], { stdio: "ignore" });

try {
  const activePortFile = join(profile, "DevToolsActivePort");
  const [debugPort] = (await waitForValue(
    () => existsSync(activePortFile) && readFileSync(activePortFile, "utf8"),
    "Chromium debugging port"
  )).trim().split("\n");

  const target = await waitForValue(async () => {
    const response = await fetch(`http://127.0.0.1:${debugPort}/json/list`);
    const targets = await response.json();
    return targets.find((item) => item.type === "page" && item.webSocketDebuggerUrl);
  }, "Chromium page target");

  const cdp = new CdpClient(target.webSocketDebuggerUrl);
  await cdp.ready();
  await cdp.send("Page.enable");
  await cdp.send("Runtime.enable");
  await cdp.send("Page.navigate", { url: "http://127.0.0.1:4174/?print-pdf" });

  await waitForValue(async () => {
    const result = await cdp.send("Runtime.evaluate", {
      expression: "Boolean(window.deck && window.deck.isReady())",
      returnByValue: true
    });
    return result.result?.value;
  }, "Reveal.js initialization");

  await wait(500);
  await cdp.send("Emulation.setEmulatedMedia", { media: "print" });
  const pdf = await cdp.send("Page.printToPDF", {
    landscape: true,
    printBackground: true,
    preferCSSPageSize: true,
    paperWidth: 13.333333,
    paperHeight: 7.5,
    marginTop: 0,
    marginBottom: 0,
    marginLeft: 0,
    marginRight: 0
  });

  writeFileSync(output, Buffer.from(pdf.data, "base64"));
  cdp.close();
  console.log(`PDF written to ${output}`);
} finally {
  server.close();
  child.kill("SIGTERM");
  await wait(250);
  rmSync(profile, { recursive: true, force: true });
}
