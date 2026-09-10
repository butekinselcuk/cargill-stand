/* Cargill Stand Gösterisi — sıfır bağımlılıklı yerel sunucu.
   Kullanım:  node server.js [port]        (varsayılan 8787)
   - Uygulamayı http://localhost:8787 adresinde yayınlar
   - media/ klasöründeki videoları /api/media ile listeler
   - Video için Range (kısmi indirme) destekler                              */
'use strict';
const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

const ROOT = __dirname;
const PORT = Number(process.argv[2]) || 8787;
const VIDEO_EXT = ['.mp4', '.webm', '.mov', '.m4v', '.ogv', '.mkv'];
const MIME = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8', '.json': 'application/json; charset=utf-8',
  '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png', '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon', '.woff2': 'font/woff2',
  '.mp4': 'video/mp4', '.webm': 'video/webm', '.mov': 'video/quicktime',
  '.m4v': 'video/x-m4v', '.ogv': 'video/ogg', '.mkv': 'video/x-matroska'
};

function safePath(reqPath) {
  const decoded = decodeURIComponent(reqPath.split('?')[0]);
  const p = path.normalize(path.join(ROOT, decoded));
  return p.startsWith(ROOT) ? p : null;
}

function listMedia() {
  const dir = path.join(ROOT, 'media');
  let out = [];
  try {
    out = fs.readdirSync(dir)
      .filter(f => VIDEO_EXT.includes(path.extname(f).toLowerCase()))
      .sort((a, b) => a.localeCompare(b, 'tr'))
      .map(f => {
        const st = fs.statSync(path.join(dir, f));
        return { name: f, size: st.size, url: 'media/' + encodeURIComponent(f) };
      });
  } catch (e) { /* klasör yoksa boş liste */ }
  return out;
}

const server = http.createServer((req, res) => {
  const u = url.parse(req.url).pathname;

  if (u === '/api/media') {
    const body = JSON.stringify(listMedia());
    res.writeHead(200, { 'Content-Type': MIME['.json'], 'Cache-Control': 'no-store' });
    return res.end(body);
  }

  let file = safePath(u === '/' ? '/index.html' : u);
  if (!file) { res.writeHead(403); return res.end('403'); }
  fs.stat(file, (err, st) => {
    if (err || st.isDirectory()) { res.writeHead(404); return res.end('404 - bulunamadi'); }
    const ext = path.extname(file).toLowerCase();
    const type = MIME[ext] || 'application/octet-stream';
    // gorseller degistirilebildigi icin sadece videolar onbelleklenir
    const cache = VIDEO_EXT.includes(ext) ? 'public, max-age=3600' : 'no-cache';
    const range = req.headers.range;
    if (range) {
      const m = /bytes=(\d*)-(\d*)/.exec(range);
      let start = m && m[1] ? parseInt(m[1], 10) : 0;
      let end = m && m[2] ? parseInt(m[2], 10) : st.size - 1;
      if (isNaN(start) || start < 0) start = 0;
      if (isNaN(end) || end >= st.size) end = st.size - 1;
      if (start > end) { res.writeHead(416, { 'Content-Range': 'bytes */' + st.size }); return res.end(); }
      res.writeHead(206, {
        'Content-Type': type, 'Content-Length': end - start + 1,
        'Content-Range': 'bytes ' + start + '-' + end + '/' + st.size,
        'Accept-Ranges': 'bytes', 'Cache-Control': cache
      });
      fs.createReadStream(file, { start, end }).pipe(res);
    } else {
      res.writeHead(200, {
        'Content-Type': type, 'Content-Length': st.size,
        'Accept-Ranges': 'bytes', 'Cache-Control': cache
      });
      fs.createReadStream(file).pipe(res);
    }
  });
});

server.on('error', e => {
  if (e.code === 'EADDRINUSE') {
    console.log('Port ' + PORT + ' zaten kullanimda - sunucu muhtemelen calisiyor.');
    process.exit(0);
  }
  console.error(e); process.exit(1);
});
server.listen(PORT, '127.0.0.1', () => {
  try { fs.writeFileSync(path.join(ROOT, '.server.pid'), String(process.pid)); } catch (e) { }
  console.log('Cargill Stand Gosterisi -> http://localhost:' + PORT);
  console.log('Kapatmak icin bu pencereyi kapatin.');
});
