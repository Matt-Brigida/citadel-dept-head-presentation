import { readFileSync } from "node:fs";

const html = readFileSync(new URL("../index.html", import.meta.url), "utf8");
const slideCount = (html.match(/<section(?:\s|>)/g) || []).length;
const notesCount = (html.match(/<aside class="notes" data-markdown>/g) || []).length;
const timings = [...html.matchAll(/data-timing="(\d+)"/g)].map((match) => Number(match[1]));
const failures = [];

if (slideCount !== 21) failures.push(`expected 21 slides, found ${slideCount}`);
if (notesCount !== slideCount) failures.push(`expected ${slideCount} notes blocks, found ${notesCount}`);
if (timings.length !== slideCount) failures.push(`expected ${slideCount} numeric timing cues, found ${timings.length}`);
if (timings.reduce((sum, timing) => sum + timing, 0) !== 2400) failures.push("slide timings do not total 40 minutes");
if (html.includes("—")) failures.push("found an em dash in slides or notes");
if (!html.includes("TODO:")) failures.push("expected visible verification TODOs");
if (!html.includes("./vendor/reveal/")) failures.push("Reveal.js is not loaded locally");
if (html.includes('type="module"')) failures.push("module scripts prevent direct-file fallback");
if (!html.includes('vendor/reveal/dist/reveal.js')) failures.push("classic Reveal.js script is missing");

if (failures.length) {
  console.error(failures.map((failure) => `FAIL: ${failure}`).join("\n"));
  process.exit(1);
}

console.log(`Deck checks passed: ${slideCount} slides, ${notesCount} notes blocks, 40:00 total, local Reveal.js.`);
