import { cpSync, mkdirSync, rmSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const source = resolve(root, "node_modules/reveal.js");
const destination = resolve(root, "vendor/reveal");

rmSync(destination, { recursive: true, force: true });
mkdirSync(resolve(destination, "dist"), { recursive: true });
for (const file of ["reset.css", "reveal.css", "reveal.js"]) {
  cpSync(resolve(source, "dist", file), resolve(destination, "dist", file));
}
cpSync(resolve(source, "plugin/notes"), resolve(destination, "plugin/notes"), { recursive: true });
console.log("Vendored Reveal.js core and speaker-notes plugin.");
