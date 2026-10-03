import { readFileSync } from "node:fs";

const html = readFileSync(new URL("../index.html", import.meta.url), "utf8");
const slideCount = (html.match(/<section(?:\s|>)/g) || []).length;
const notesCount = (html.match(/<aside class="notes" data-markdown>/g) || []).length;
const timings = [...html.matchAll(/data-timing="(\d+)"/g)].map((match) => Number(match[1]));
const failures = [];

if (slideCount !== 16) failures.push(`expected 16 slides, found ${slideCount}`);
if (notesCount !== slideCount) failures.push(`expected ${slideCount} notes blocks, found ${notesCount}`);
if (timings.length !== slideCount) failures.push(`expected ${slideCount} numeric timing cues, found ${timings.length}`);
if (timings.reduce((sum, timing) => sum + timing, 0) !== 1500) failures.push("slide timings do not total 25 minutes");
if (html.includes("—")) failures.push("found an em dash in slides or notes");
if (!html.includes("TODO:")) failures.push("expected visible verification TODOs");
if (!html.includes("./vendor/reveal/")) failures.push("Reveal.js is not loaded locally");

if (failures.length) {
  console.error(failures.map((failure) => `FAIL: ${failure}`).join("\n"));
  process.exit(1);
}

console.log(`Deck checks passed: ${slideCount} slides, ${notesCount} notes blocks, 25:00 total, local Reveal.js.`);
