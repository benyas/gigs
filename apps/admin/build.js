const fs = require('fs');
const path = require('path');

const SRC = path.join(__dirname, 'src');
const PUBLIC = path.join(__dirname, 'public');
const PAGES = path.join(SRC, 'pages');
const JS_SRC = path.join(SRC, 'js');
const JS_DEST = path.join(PUBLIC, 'js');

function build() {
  const layout = fs.readFileSync(path.join(SRC, 'layout.html'), 'utf8');

  // Build pages
  const pages = fs.readdirSync(PAGES).filter(f => f.endsWith('.html'));
  for (const file of pages) {
    const content = fs.readFileSync(path.join(PAGES, file), 'utf8');
    // Extract title from <!-- title: ... --> comment
    const titleMatch = content.match(/<!--\s*title:\s*(.+?)\s*-->/);
    const title = titleMatch ? titleMatch[1] : 'Admin';
    const activePage = file.replace('.html', '');

    const apiUrl = process.env.API_URL || 'http://localhost:4000';
    let html = layout
      .replace('{{content}}', content)
      .replace(/\{\{title\}\}/g, title)
      .replace(/\{\{activePage\}\}/g, activePage)
      .replace(/\{\{api_url\}\}/g, apiUrl);
    fs.writeFileSync(path.join(PUBLIC, file), html);
  }

  // Build login separately (standalone, no layout) — still needs api_url replacement
  if (fs.existsSync(path.join(PAGES, 'login.html'))) {
    const loginApiUrl = process.env.API_URL || 'http://localhost:4000';
    let loginHtml = fs.readFileSync(path.join(PAGES, 'login.html'), 'utf8');
    loginHtml = loginHtml.replace(/\{\{api_url\}\}/g, loginApiUrl);
    fs.writeFileSync(path.join(PUBLIC, 'login.html'), loginHtml);
  }

  // Copy JS files
  if (!fs.existsSync(JS_DEST)) fs.mkdirSync(JS_DEST, { recursive: true });
  const jsFiles = fs.readdirSync(JS_SRC).filter(f => f.endsWith('.js'));
  for (const file of jsFiles) {
    fs.copyFileSync(path.join(JS_SRC, file), path.join(JS_DEST, file));
  }

  console.log(`Built ${pages.length} pages → public/`);
}

build();

// Watch mode
if (process.argv.includes('--watch')) {
  console.log('Watching src/ for changes...');
  const debounce = {};
  fs.watch(SRC, { recursive: true }, (event, filename) => {
    if (!filename || !filename.endsWith('.html') && !filename.endsWith('.js')) return;
    clearTimeout(debounce[filename]);
    debounce[filename] = setTimeout(() => {
      try { build(); } catch (e) { console.error('Build error:', e.message); }
    }, 100);
  });
}
