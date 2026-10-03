import { createReadStream, existsSync, statSync } from "node:fs";
import { createServer } from "node:http";
import { extname, join, normalize, resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const port = Number(process.env.PORT || 4173);

const mime = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".map": "application/json; charset=utf-8",
  ".pdf": "application/pdf",
  ".svg": "image/svg+xml",
  ".woff": "font/woff",
  ".woff2": "font/woff2"
};

export function startServer({ listenPort = port, quiet = false } = {}) {
  const server = createServer((request, response) => {
    const pathname = decodeURIComponent(new URL(request.url, "http://localhost").pathname);
    const relative = pathname === "/" ? "index.html" : pathname.replace(/^\/+/, "");
    const file = normalize(join(root, relative));

    if (!file.startsWith(`${root}/`) || !existsSync(file) || !statSync(file).isFile()) {
      response.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
      response.end("Not found");
      return;
    }

    response.writeHead(200, {
      "Content-Type": mime[extname(file)] || "application/octet-stream",
      "Cache-Control": "no-store"
    });
    createReadStream(file).pipe(response);
  });

  return new Promise((resolveStarted, reject) => {
    server.once("error", reject);
    server.listen(listenPort, "127.0.0.1", () => {
      if (!quiet) console.log(`Presentation: http://127.0.0.1:${listenPort}`);
      resolveStarted(server);
    });
  });
}

if (process.argv[1] === new URL(import.meta.url).pathname) {
  await startServer();
}
