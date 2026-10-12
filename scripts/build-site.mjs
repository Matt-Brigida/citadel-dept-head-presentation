import { cpSync, mkdirSync, rmSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const site = resolve(root, "_site");

rmSync(site, { recursive: true, force: true });
mkdirSync(site, { recursive: true });

for (const item of [".nojekyll", "images", "index.html", "styles", "vendor"]) {
  cpSync(resolve(root, item), resolve(site, item), { recursive: true });
}

console.log(`Static site built at ${site}`);
