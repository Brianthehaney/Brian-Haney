// Builds share.html: a self-contained, script-free copy of the wish list that renders
// in any HTML viewer (iPhone Files/Messages previews, email attachments, desktop browsers).
// Usage: node christmas-list/export-static.js <fonts-dir>
const { chromium } = require('playwright');
const fs = require('fs'), path = require('path');
const src = path.join(__dirname, 'index.html'), out = path.join(__dirname, 'share.html');
const fontsDir = process.argv[2];
const font = (pkg, file) => fs.readFileSync(path.join(fontsDir, pkg, 'files', file)).toString('base64');

(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 1100, height: 900 } });
  await p.setContent('<!doctype html><html><head><meta charset="utf-8"></head><body>' + fs.readFileSync(src, 'utf8') + '</body></html>');
  await p.waitForTimeout(400);
  const body = await p.evaluate(() => {
    const q = s => document.querySelectorAll(s);
    q('#editor,#add-btn,#status,.owner,script,link,meta,title,style').forEach(e => e.remove());
    // CSS-only filters: radio inputs + labels, driven by :has()
    const f = document.getElementById('filters');
    const chips = [...f.querySelectorAll('.chip')].map(c => c.textContent);
    const keys = ['all', 'watches', 'leather', 'wear', 'coffee', 'gear', 'stuff', 'horse'];
    const names = { all: 'All', watches: 'Watches', leather: 'Leather & style', wear: 'Clothing & shoes', coffee: 'Mugs & coffee', gear: 'Gear & home', stuff: 'Gift cards & stuffers', horse: 'Horse gifts' };
    f.innerHTML = '';
    chips.forEach(t => {
      const k = keys.find(k => t.startsWith(names[k] + ' ·'));
      const i = document.createElement('input'); i.type = 'radio'; i.name = 'filter'; i.id = 'f-' + k; i.className = 'fr'; if (k === 'all') i.checked = true; i.setAttribute('checked', k === 'all' ? '' : null); if (k !== 'all') i.removeAttribute('checked');
      const l = document.createElement('label'); l.className = 'chip'; l.htmlFor = 'f-' + k; l.textContent = t;
      f.appendChild(i); f.appendChild(l);
    });
    document.getElementById('countdown').textContent = 'Christmas morning · Dec 25';
    document.getElementById('countdown').setAttribute('data-live', '');
    document.querySelector('footer').textContent = 'Tap a store button to open the item.';
    return document.body.innerHTML.replace(/\n\s*\n/g, '\n');
  });
  const css = await p.evaluate(() => fs => fs, null).catch(() => '');
  await b.close();
  const pageCss = fs.readFileSync(src, 'utf8').match(/<style>([\s\S]*?)<\/style>/)[1];
  const cats = ['watches', 'leather', 'wear', 'coffee', 'gear', 'stuff', 'horse'];
  const filterCss = '.fr{position:absolute;opacity:0;pointer-events:none}\n' +
    'body:has(#f-all:checked) label[for="f-all"]' + cats.map(c => `,body:has(#f-${c}:checked) label[for="f-${c}"]`).join('') +
    '{background:var(--fg);color:var(--bg);border-color:var(--fg)}\n' +
    '.fr:focus-visible+label{outline:2px solid var(--accent);outline-offset:2px}\n' +
    cats.map(c => `body:has(#f-${c}:checked) .grid>[data-cat]:not([data-cat="${c}"]){display:none}`).join('\n') + '\n' +
    'body:has(#f-horse:checked) .section{border-top:0;margin-top:0;padding-top:0}\nlabel.chip{display:inline-block;text-transform:none;letter-spacing:0;color:var(--fg);font:600 13px/1 var(--body);user-select:none;-webkit-tap-highlight-color:transparent}';
  const fontCss =
    `@font-face{font-family:"Pixelify Sans";font-weight:700;font-display:swap;src:url(data:font/woff2;base64,${font('fontsource-pixelify-sans', 'pixelify-sans-latin-700-normal.woff2')}) format("woff2")}\n` +
    [400, 600, 700].map(w => `@font-face{font-family:"Figtree";font-weight:${w};font-display:swap;src:url(data:font/woff2;base64,${font('fontsource-figtree', `figtree-latin-${w}-normal.woff2`)}) format("woff2")}`).join('\n');
  const countdownJs = `<script>(function(){var e=document.getElementById("countdown");if(!e)return;var n=new Date(),y=n.getFullYear();if(n>new Date(y,11,26))y++;var d=Math.ceil((new Date(y,11,25)-new Date(n.getFullYear(),n.getMonth(),n.getDate()))/864e5);e.textContent=d<=0?"Merry Christmas!":d+(d===1?" sleep":" sleeps")+" till Christmas";})();<\/script>`;
  const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<meta name="color-scheme" content="light dark">
<title>Brian's Christmas Wish List</title>
<style>
${fontCss}
html{-webkit-text-size-adjust:100%}
body{margin:0}
img{max-width:100%}
[hidden]{display:none!important}
${pageCss}
${filterCss}
</style>
</head>
<body>
${body}
${countdownJs}
</body>
</html>
`;
  fs.writeFileSync(out, html);
  console.log('wrote', out, (html.length / 1024).toFixed(0) + ' KB');
})();
