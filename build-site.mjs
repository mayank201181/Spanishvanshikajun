// Build a static HTML site from the markdown revision pack.
import { marked } from "marked";
import fs from "fs";
import path from "path";

const ROOT = process.cwd();
const OUT = path.join(ROOT, "public");
const MD_DIRS = ["", "study-guides", "question-bank/term-1", "question-bank/term-2",
  "question-bank/term-3", "question-bank/full-year", "images"];

marked.setOptions({ gfm: true, breaks: false });

const CSS = `
:root{--bg:#fff;--fg:#1f2328;--muted:#59636e;--accent:#d62828;--accent2:#1d4ed8;--border:#d0d7de;--card:#f6f8fa}
*{box-sizing:border-box}
body{margin:0;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Helvetica,Arial,sans-serif;color:var(--fg);background:#fafbfc;line-height:1.6}
.topbar{position:sticky;top:0;z-index:10;background:#d62828;color:#fff;padding:10px 16px;font-weight:700;display:flex;gap:12px;align-items:center;box-shadow:0 1px 4px rgba(0,0,0,.15)}
.topbar a{color:#fff;text-decoration:none;font-weight:600;font-size:14px;opacity:.92}
.topbar a:hover{opacity:1;text-decoration:underline}
.wrap{max-width:900px;margin:0 auto;padding:24px 16px 80px}
.content{background:var(--bg);border:1px solid var(--border);border-radius:12px;padding:28px 32px;box-shadow:0 1px 3px rgba(0,0,0,.04)}
h1,h2,h3{line-height:1.25}
h1{border-bottom:2px solid var(--border);padding-bottom:.3em}
h2{border-bottom:1px solid var(--border);padding-bottom:.25em;margin-top:1.6em}
a{color:var(--accent2)}
table{border-collapse:collapse;width:100%;margin:1em 0;display:block;overflow-x:auto}
th,td{border:1px solid var(--border);padding:7px 11px;text-align:left;vertical-align:top}
th{background:var(--card)}
tr:nth-child(even){background:#fbfcfd}
img{max-width:100%;border-radius:8px}
code{background:var(--card);padding:.15em .4em;border-radius:6px;font-size:.9em}
blockquote{margin:1em 0;padding:.5em 1em;border-left:4px solid var(--accent);background:#fff5f5;border-radius:0 8px 8px 0}
details{background:var(--card);border:1px solid var(--border);border-radius:8px;padding:.4em .9em;margin:.6em 0}
details[open]{background:#eef6ff;border-color:#9ec5ff}
summary{cursor:pointer;font-weight:600;color:var(--accent2);padding:.3em 0}
hr{border:none;border-top:1px solid var(--border);margin:1.8em 0}
.footer{text-align:center;color:var(--muted);font-size:13px;margin-top:24px}
@media(max-width:600px){.content{padding:18px 16px}}
`;

function rewriteLinks(html) {
  // .md links -> .html (handles "...md" and "...md#frag")
  return html.replace(/href="([^"]+?)\.md(#[^"]*)?"/g, 'href="$1.html$2"');
}

function page(title, bodyHtml) {
  return `<!doctype html><html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${title}</title><style>${CSS}</style></head>
<body>
<div class="topbar"><span>🇪🇸 Spanish Year 7</span>
<a href="/index.html">🏠 Home</a>
<a href="/study-guides/term-1-guide.html">T1</a>
<a href="/study-guides/term-2-guide.html">T2</a>
<a href="/study-guides/term-3-guide.html">T3</a>
<a href="/study-guides/full-year-cheatsheet.html">Cheat‑sheet</a>
</div>
<div class="wrap"><div class="content">${bodyHtml}</div>
<div class="footer">Spanish Year 7 revision pack · learn the words, then test yourself 🍀</div></div>
</body></html>`;
}

function copyDir(src, dst) {
  fs.mkdirSync(dst, { recursive: true });
  for (const e of fs.readdirSync(src, { withFileTypes: true })) {
    const s = path.join(src, e.name), d = path.join(dst, e.name);
    if (e.isDirectory()) copyDir(s, d);
    else if (/\.(jpg|jpeg|png|gif|svg)$/i.test(e.name)) fs.copyFileSync(s, d);
  }
}

// fresh output
fs.rmSync(OUT, { recursive: true, force: true });
fs.mkdirSync(OUT, { recursive: true });

let count = 0;
for (const dir of MD_DIRS) {
  const abs = path.join(ROOT, dir);
  if (!fs.existsSync(abs)) continue;
  for (const f of fs.readdirSync(abs)) {
    if (!f.endsWith(".md")) continue;
    const md = fs.readFileSync(path.join(abs, f), "utf8");
    const title = (md.match(/^#\s+(.+)$/m)?.[1] || f).replace(/[#*🇪🇸🟦🟨🟥🟩]/g, "").trim();
    const html = rewriteLinks(marked.parse(md));
    const outDir = path.join(OUT, dir);
    fs.mkdirSync(outDir, { recursive: true });
    fs.writeFileSync(path.join(outDir, f.replace(/\.md$/, ".html")), page(title, html));
    count++;
  }
}

// images
copyDir(path.join(ROOT, "images"), path.join(OUT, "images"));

// landing page = README
const readme = fs.readFileSync(path.join(ROOT, "README.md"), "utf8");
fs.writeFileSync(path.join(OUT, "index.html"),
  page("Spanish Year 7 — Revision Guide & Question Bank", rewriteLinks(marked.parse(readme))));

console.log(`Built ${count} pages + index.html into public/`);
