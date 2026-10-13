# The Citadel campus presentation

Reveal.js presentation for Matt Brigida's Department Head campus visit at the
Tommy & Victoria Baker School of Business on October 16, 2026.

The Reveal.js presentation for the October 16, 2026 campus visit is in
[`index.html`](index.html). Reveal.js and its speaker-notes plugin are committed
under `vendor/`, so presenting and exporting do not require a network connection.

### Preview

Requires Node.js 20 or newer.

```bash
npm run serve
```

Open <http://127.0.0.1:4173>. Use the arrow keys to navigate and press `S` to
open the speaker-notes window. The notes include cumulative timing cues for a
40-minute talk plus a 3-minute question pause before the teaching and scholarship section, leaving about 17 minutes of the hour for discussion.

To simulate the interview environment, disconnect from the network and reload
the presentation. The preferred path is the local server, but the deck now also
uses classic local scripts so `index.html` can be opened directly as an emergency
fallback.

### Export to PDF

The export script uses a locally installed Chromium-based browser and starts its
own temporary presentation server:

```bash
npm run pdf
```

The result is `dist/brigida-citadel-presentation.pdf`. Set `CHROME_BIN` if the
browser is not in a standard Linux location. For a manual export, run the server,
open <http://127.0.0.1:4173/?print-pdf>, and print to PDF in landscape mode with
background graphics enabled and margins disabled.

For a high-contrast black-and-white copy intended for printing and review:

```bash
npm run pdf:review
```

The result is `dist/brigida-citadel-review.pdf`. This export temporarily applies
a grayscale print palette and does not change the dark presentation theme.

For a rehearsal copy with each slide followed by a page of its speaker notes:

```bash
npm run pdf:notes
```

The result is `dist/brigida-citadel-notes.pdf`, in the same black-and-white
palette. `npm run pdf:all` rebuilds all four PDFs.

### Validate and update Reveal.js

```bash
npm run check
npm install
npm run vendor
```

The final two commands refresh the committed local Reveal.js files from the
version pinned in `package.json`. They are unnecessary for normal presenting,
serving, or PDF export.

### Deploy to GitHub Pages

The workflow at `.github/workflows/pages.yml` builds a presentation-only `_site`
artifact and deploys it when the `master` or `main` branch is pushed. In the
GitHub repository settings, select
**GitHub Actions** as the Pages source, then push the branch. The repository has
no remote configured at present, so the workflow is prepared but has not been
published from this checkout.

Before the visit, resolve every item in [`TODO.md`](TODO.md), search the deck for
`TODO:`, rehearse to time, and test both the HTML and exported PDF offline.
