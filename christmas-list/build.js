// Prerenders the wish list so every card, icon and filter is plain HTML in the file.
// Writes index.html (the published page) and share.html (a complete standalone document
// that renders anywhere, including viewers that never run JavaScript).
// Usage: node christmas-list/build.js
const { chromium } = require('playwright');
const fs = require('fs'), path = require('path');
const src = path.join(__dirname, 'index.html');

(async () => {
  const b = await chromium.launch();
  const p = await b.newPage();
  const errors = []; p.on('pageerror', e => errors.push(e.message));
  await p.setContent('<!doctype html><html><head><meta charset="utf-8"></head><body>' + fs.readFileSync(src, 'utf8') + '</body></html>');
  const body = await p.evaluate(() => window.__wishBody());
  await b.close();
  if (errors.length) throw new Error(errors.join('\n'));
  const page = body.trim() + '\n';
  fs.writeFileSync(src, page);
  const share = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<meta name="color-scheme" content="light dark">
<style>html{-webkit-text-size-adjust:100%}:root{padding-top:env(safe-area-inset-top,0px);padding-bottom:env(safe-area-inset-bottom,0px)}body{margin:0}img{max-width:100%}[hidden]{display:none!important}</style>
</head>
<body>
${page}</body>
</html>
`;
  fs.writeFileSync(path.join(__dirname, 'share.html'), share);
  console.log('index.html', (page.length / 1024).toFixed(0) + ' KB; share.html', (share.length / 1024).toFixed(0) + ' KB');
})();
