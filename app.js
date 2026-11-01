/* ==========================================================================
   Cargill Stand Gösterisi  —  video ⇄ saat kesintisiz döngü
   Tek sayfa, çevrimdışı çalışır. Ayarlar + videolar IndexedDB'de saklanır.
   ========================================================================== */
'use strict';

/* ---------- Saat geometrisi (saatsiz.jpeg uzerinden olculdu, 1728x2468) --
   Kadran merkezi ve disk yaricapi goruntuden olculdu; ibre olculeri
   orijinal tasarimdan (saat.jpeg) 1.92857 olcekle tasindi.               */
const CX = 861.35, CY = 1427.66;
const POSTER_W = 1728, POSTER_H = 2468;

/* ---------------------------- Depolama (IDB) ---------------------------- */
const DB_NAME = 'cargill-show', DB_VER = 1;
let dbp = null;
function db() {
  if (dbp) return dbp;
  dbp = new Promise(res => {
    let done = false;
    const finish = v => { if (!done) { done = true; if (!v) console.warn('IndexedDB kullanilamiyor - ayarlar kalici saklanmayacak'); res(v); } };
    // Sayfa dosyadan acildiginda (file://) IndexedDB hic yanit vermeyebilir;
    // uygulama bu yuzden kilitlenmesin diye kisa bir zaman asimi koyuyoruz.
    setTimeout(() => finish(null), 1500);
    try {
      const r = indexedDB.open(DB_NAME, DB_VER);
      r.onupgradeneeded = () => {
        const d = r.result;
        if (!d.objectStoreNames.contains('files')) d.createObjectStore('files', { keyPath: 'id' });
        if (!d.objectStoreNames.contains('meta')) d.createObjectStore('meta');
      };
      r.onsuccess = () => finish(r.result);
      r.onerror = () => finish(null);
      r.onblocked = () => finish(null);
    } catch (e) { finish(null); }
  });
  return dbp;
}
async function idbPut(store, val, key) {
  const d = await db(); if (!d) return;
  return new Promise((res, rej) => {
    try {
      const tx = d.transaction(store, 'readwrite');
      tx.objectStore(store).put(val, key);
      tx.oncomplete = res; tx.onerror = () => res();
    } catch (e) { res(); }
  });
}
async function idbGet(store, key) {
  const d = await db(); if (!d) return undefined;
  return new Promise((res, rej) => {
    try {
      const tx = d.transaction(store, 'readonly');
      const rq = tx.objectStore(store).get(key);
      rq.onsuccess = () => res(rq.result); rq.onerror = () => res(undefined);
    } catch (e) { res(undefined); }
  });
}
async function idbAll(store) {
  const d = await db(); if (!d) return [];
  return new Promise((res, rej) => {
    try {
      const tx = d.transaction(store, 'readonly');
      const rq = tx.objectStore(store).getAll();
      rq.onsuccess = () => res(rq.result || []); rq.onerror = () => res([]);
    } catch (e) { res([]); }
  });
}
async function idbDel(store, key) {
  const d = await db(); if (!d) return;
  return new Promise((res, rej) => {
    try {
      const tx = d.transaction(store, 'readwrite');
      tx.objectStore(store).delete(key);
      tx.oncomplete = res; tx.onerror = () => res();
    } catch (e) { res(); }
  });
}

/* ------------------------------- Durum ---------------------------------- */
const CFG_VER = 3;          // varsayilan degisince artir: eski kayitli ayar ezilir
const DEFAULTS = {
  clockSec: 5, fadeMs: 400, videoFit: 'contain', clockFit: 'contain',
  order: 'seq', audio: false, secHand: true, beam: false, smooth: true,
  // LED alani: stanttaki LED 768x1536 (dikey); LED islemcisi ekranin sol ustunden okur
  screenMode: 'tam', ledW: 768, ledH: 1536, ledX: 0, ledY: 0,
  saatAdet: 2,              // kose LED: ekran ikiye bolunur, her yuze bir saat
  sonVideo: null           // son oynayan videonun boyutu: saat cercevesi videoyla ayni olsun
};
const state = { items: [], cfg: Object.assign({}, DEFAULTS) };

const $ = s => document.querySelector(s);
const els = {
  setup: $('#setup'), player: $('#player'),
  drop: $('#drop'), fileInput: $('#fileInput'), pickBtn: $('#pickBtn'),
  list: $('#list'), listEmpty: $('#listEmpty'),
  scanBtn: $('#scanBtn'), clearBtn: $('#clearBtn'), startBtn: $('#startBtn'),
  clockOnlyBtn: $('#clockOnlyBtn'),
  status: $('#status'), preview: $('#preview'), clockNow: $('#clockNow'),
  stage: $('#stage'), poster: $('#poster'), hands: $('#hands'),
  gHour: $('#gHour'), gMin: $('#gMin'), gSec: $('#gSec'),
  beams: $('#beams'), beamMin: $('#beamMin'), beamSec: $('#beamSec'),
  layerVideo: $('#layerVideo'), layerClock: $('#layerClock'),
  vidA: $('#vidA'), vidB: $('#vidB'), tapStart: $('#tapStart'), toast: $('#toast'),
  wakeNote: $('#wakeNote'), cerceve: $('#cerceve')
};
const CFG_KEYS = ['clockSec', 'fadeMs', 'videoFit', 'clockFit', 'order', 'audio', 'secHand', 'beam', 'smooth',
  'screenMode', 'ledW', 'ledH', 'ledX', 'ledY', 'saatAdet', 'sonVideo'];
// ikinci saat: ayni sahnenin kopyasi (id'ler 'b_' onekiyle), init'te kurulur
const els2 = {};
const saatler = () => els2.cerceve ? [els, els2] : [els];
const tamSayi = (v, d, en) => { const n = Math.round(+v); return Number.isFinite(n) && n >= en ? n : d; };

function readForm() {
  const c = state.cfg;
  c.clockSec = Math.max(1, +$('#clockSec').value || 5);
  c.fadeMs = Math.max(0, +$('#fadeMs').value || 0);
  c.videoFit = $('#videoFit').value;
  c.clockFit = $('#clockFit').value;
  c.order = $('#order').value;
  c.audio = $('#audio').checked;
  c.secHand = $('#secHand').checked;
  c.beam = $('#beam').checked;
  c.smooth = $('#smooth').checked;
  c.screenMode = $('#screenMode').value;
  c.ledW = tamSayi($('#ledW').value, DEFAULTS.ledW, 16);
  c.ledH = tamSayi($('#ledH').value, DEFAULTS.ledH, 16);
  c.ledX = tamSayi($('#ledX').value, 0, 0);
  c.ledY = tamSayi($('#ledY').value, 0, 0);
  c.saatAdet = $('#saatAdet').value === '1' ? 1 : 2;
  idbPut('meta', Object.assign({}, c), 'cfg');
  showLedFields();
  applyClockOptions();
}
function writeForm() {
  const c = state.cfg;
  $('#clockSec').value = c.clockSec; $('#fadeMs').value = c.fadeMs;
  $('#videoFit').value = c.videoFit; $('#clockFit').value = c.clockFit;
  $('#order').value = c.order; $('#audio').checked = c.audio;
  $('#secHand').checked = c.secHand; $('#beam').checked = c.beam;
  $('#smooth').checked = c.smooth;
  $('#screenMode').value = c.screenMode;
  $('#ledW').value = c.ledW; $('#ledH').value = c.ledH;
  $('#ledX').value = c.ledX; $('#ledY').value = c.ledY;
  $('#saatAdet').value = String(c.saatAdet);
  showLedFields();
}

/* ------------------------------ LED alani --------------------------------
   Video ve saat, ekranin LED'e giden bolgesine BIREBIR piksel yerlesir:
   CSS pikseli = cihaz pikseli / devicePixelRatio; Windows olceklendirmesi
   (%125, %150) olsa da goruntu yeniden orneklenmez, bulaniklasmaz.        */
function showLedFields() {
  const led = $('#screenMode').value === 'led';
  $('#ledBox').hidden = !led;
  $('#videoFitField').hidden = led;
  const info = $('#ledInfo');
  if (!led || !info) return;
  const dpr = window.devicePixelRatio || 1;
  const sw = Math.round(screen.width * dpr), sh = Math.round(screen.height * dpr);
  const c = state.cfg;
  const sigar = c.ledX + c.ledW <= sw && c.ledY + c.ledH <= sh;
  const alan = c.ledW + '×' + c.ledH;
  info.classList.toggle('warn', !sigar);
  info.textContent = 'Bu bilgisayarın ekranı ' + sw + '×' + sh + ' piksel. ' + (sigar
    ? 'LED alanı ' + alan + ' sığıyor; video ve saat ölçeklenmeden yerleşir.'
    : 'LED alanı ' + alan + ' bu ekrana sığmıyor: taşan kısım görünmez. Stanttaki bilgisayarın çıkış çözünürlüğü en az bu kadar olmalı (LED işlemcisinin beklediği ayar).');
}
function layoutPlayer() {
  const led = state.cfg.screenMode === 'led';
  els.player.classList.toggle('mode-led', led);
  els.player.classList.toggle('fit-contain', !led && state.cfg.videoFit === 'contain');
  const dpr = window.devicePixelRatio || 1, c = state.cfg;
  [els.layerVideo, els.layerClock].forEach(l => {
    if (!led) { l.style.left = l.style.top = l.style.width = l.style.height = ''; return; }
    l.style.left = (c.ledX / dpr) + 'px'; l.style.top = (c.ledY / dpr) + 'px';
    l.style.width = (c.ledW / dpr) + 'px'; l.style.height = (c.ledH / dpr) + 'px';
  });
  layoutStage();
}

/* ------------------------------ Saat cizimi ------------------------------ */
function applyClockOptions() {
  saatler().forEach(setClockOpts);
  if (previewEls) setClockOpts(previewEls);
}
function setClockOpts(e) {
  if (e.gSec) e.gSec.style.display = state.cfg.secHand ? '' : 'none';
  if (e.beams) e.beams.classList.toggle('off', !state.cfg.beam);
  if (e.beamSec) e.beamSec.classList.toggle('off', !state.cfg.secHand);
}
function rot(g, deg) {
  if (g) g.setAttribute('transform', 'rotate(' + deg.toFixed(3) + ' ' + CX + ' ' + CY + ')');
}
let lastMinuteText = '';
/* Verilen saat icin ibreleri ve isik huzmelerini yerlestirir */
function paintClock(e, n) {
  const ms = state.cfg.smooth ? n.getMilliseconds() : 0;
  const sec = n.getSeconds() + ms / 1000;
  const min = n.getMinutes() + sec / 60;
  const hr = (n.getHours() % 12) + min / 60;
  const aH = hr * 30, aM = min * 6, aS = (state.cfg.smooth ? sec : n.getSeconds()) * 6;
  rot(e.gHour, aH); rot(e.gMin, aM);
  if (state.cfg.secHand) rot(e.gSec, aS);
  if (state.cfg.beam) {
    if (e.beamMin) e.beamMin.style.setProperty('--a', aM.toFixed(2) + 'deg');
    if (e.beamSec && state.cfg.secHand) e.beamSec.style.setProperty('--a', aS.toFixed(2) + 'deg');
  }
}
function tickClock() {
  const n = new Date();
  saatler().forEach(e => paintClock(e, n));
  const t = String(n.getHours()).padStart(2, '0') + ':' + String(n.getMinutes()).padStart(2, '0');
  if (t !== lastMinuteText && els.clockNow) { lastMinuteText = t; els.clockNow.textContent = t; }
}
let rafId = 0;
function clockLoop() { tickClock(); rafId = requestAnimationFrame(clockLoop); }
function startClock() { if (!rafId) clockLoop(); }

/* Sahneyi (poster + ibreler) boyutlandir. Saat, videonun ekranda kapladigi
   cerceveye oturur: ekran orani ne olursa olsun saat ile video ayni oranda.
   Iki saat secildiyse ekran sol/sag ikiye bolunur (kose LED'in iki yuzu) ve
   her yari bir saatle tamamen dolar.
   Cerceve icinde: 'Tamami gorunsun' hicbir yeri kesmez, bosluk posterin kenar
   renkleriyle dolar; 'Ekrani doldur' cerceveyi doldurur (yanlardan kirpar).   */
const AR = POSTER_W / POSTER_H;
function videoCercevesi(W, H) {
  const v = state.cfg.sonVideo;
  if (!v || !v[0] || !v[1]) return { x: 0, y: 0, w: W, h: H };
  const cover = state.cfg.screenMode !== 'led' && state.cfg.videoFit === 'cover';
  const k = cover ? Math.max(W / v[0], H / v[1]) : Math.min(W / v[0], H / v[1]);
  const w = Math.min(W, v[0] * k), h = Math.min(H, v[1] * k);
  return { x: (W - w) / 2, y: (H - h) / 2, w: w, h: h };
}
function layoutStage() {
  const host = els.layerClock;
  const LW = host.clientWidth, LH = host.clientHeight;
  if (!LW || !LH) return;
  const adet = state.cfg.saatAdet === 1 ? 1 : 2, yW = LW / adet;
  saatler().forEach((s, i) => {
    s.cerceve.style.display = i < adet ? '' : 'none';
    if (i >= adet) return;
    // iki saatte her saat kendi yarisini (LED yuzunu) tam doldurur: arada siyah bosluk kalmaz
    const c = adet === 2 ? { x: 0, y: 0, w: yW, h: LH } : videoCercevesi(yW, LH);
    saatYerlestir(s, c, i * yW);
  });
}
function saatYerlestir(s, c, ox) {
  const f = s.cerceve.style;
  f.left = (ox + c.x) + 'px'; f.top = c.y + 'px'; f.width = c.w + 'px'; f.height = c.h + 'px';
  f.right = f.bottom = 'auto';
  const W = c.w, H = c.h;
  const cover = state.cfg.clockFit === 'cover';
  let w = W, h = W / AR;
  if (cover ? (h < H) : (h > H)) { h = H; w = H * AR; }
  s.stage.style.width = w + 'px';
  s.stage.style.height = h + 'px';
  zeminDoldur(s.cerceve, W, H, w, h);
}
function ikinciSaatKur() {
  const c = els.cerceve.cloneNode(true);
  c.querySelectorAll('[id]').forEach(n => { n.id = 'b_' + n.id; });
  c.id = 'b_cerceve';
  els.layerClock.appendChild(c);
  const q = id => c.querySelector('#b_' + id);
  Object.assign(els2, {
    cerceve: c, stage: q('stage'), gHour: q('gHour'), gMin: q('gMin'), gSec: q('gSec'),
    beams: q('beams'), beamMin: q('beamMin'), beamSec: q('beamSec')
  });
}
function videoBoyutuOgren(v) {
  if (!v.videoWidth || !v.videoHeight) return;
  const s = state.cfg.sonVideo;
  if (s && s[0] === v.videoWidth && s[1] === v.videoHeight) return;
  state.cfg.sonVideo = [v.videoWidth, v.videoHeight];
  idbPut('meta', Object.assign({}, state.cfg), 'cfg');      // "sadece saat" modu da ayni cerceveyi bilsin
  layoutStage();
}

/* Saat ekrani videoyla ayni olcude (orn. LED 768x1536) TAM dolu olsun: poster
   7:10 oldugu icin kalan ust/alt (ya da sol/sag) bosluk, posterin o kenarindaki
   renklerle sutun sutun uzatilir — birlesme cizgisi gorunmez, icerik kesilmez. */
function zeminDoldur(host, W, H, w, h) {
  const x = (W - w) / 2, y = (H - h) / 2, px = v => v.toFixed(2) + 'px';
  const st = host.style;
  if (h < H - 0.5) {
    st.backgroundImage = 'url(assets/zemin-ust.png), url(assets/zemin-alt.png)';
    st.backgroundSize = px(w) + ' ' + px(y) + ', ' + px(w) + ' ' + px(H - y - h);
    st.backgroundPosition = px(x) + ' 0, ' + px(x) + ' ' + px(y + h);
  } else if (w < W - 0.5) {
    st.backgroundImage = 'url(assets/zemin-sol.png), url(assets/zemin-sag.png)';
    st.backgroundSize = px(x) + ' ' + px(h) + ', ' + px(W - x - w) + ' ' + px(h);
    st.backgroundPosition = '0 ' + px(y) + ', ' + px(x + w) + ' ' + px(y);
  } else {
    st.backgroundImage = 'none';
    return;
  }
  st.backgroundRepeat = 'no-repeat';
}

/* ---------------------------- Video listesi ------------------------------ */
const fmtSize = b => b > 1048576 ? (b / 1048576).toFixed(1) + ' MB' : Math.round(b / 1024) + ' KB';

function renderList() {
  els.list.innerHTML = '';
  state.items.forEach((it, i) => {
    const li = document.createElement('li');
    li.innerHTML =
      '<span class="idx">' + (i + 1) + '</span><span class="nm"></span>' +
      '<span class="sz">' + (it.size ? fmtSize(it.size) : '') + '</span>' +
      '<button class="ic" data-a="up" title="Yukari">&#8593;</button>' +
      '<button class="ic" data-a="down" title="Asagi">&#8595;</button>' +
      '<button class="ic" data-a="del" title="Kaldir">&#10005;</button>';
    li.querySelector('.nm').textContent = it.name;
    li.querySelectorAll('.ic').forEach(b => { b.onclick = () => itemAction(i, b.dataset.a); });
    els.list.appendChild(li);
  });
  els.listEmpty.hidden = state.items.length > 0;
  els.startBtn.disabled = state.items.length === 0;
  els.status.textContent = state.items.length
    ? state.items.length + ' video hazır · saat ' + state.cfg.clockSec + ' sn ekranda kalacak'
    : 'Başlamak için en az bir video ekleyin.';
}
async function itemAction(i, a) {
  if (a === 'del') { const it = state.items.splice(i, 1)[0]; if (it && it.id && !it.url) await idbDel('files', it.id); }
  if (a === 'up' && i > 0) state.items.splice(i - 1, 0, state.items.splice(i, 1)[0]);
  if (a === 'down' && i < state.items.length - 1) state.items.splice(i + 1, 0, state.items.splice(i, 1)[0]);
  await saveOrder(); renderList();
}
const saveOrder = () => idbPut('meta', state.items.map(i => ({ id: i.id, name: i.name, url: i.url || null })), 'order');

async function addFiles(files) {
  const vids = [].slice.call(files).filter(f => (f.type && f.type.indexOf('video/') === 0) || /\.(mp4|webm|mov|m4v|ogv|mkv)$/i.test(f.name));
  if (!vids.length) { els.status.textContent = 'Video dosyası bulunamadı.'; return; }
  for (const f of vids) {
    const id = 'v' + Date.now() + '_' + Math.random().toString(36).slice(2, 8);
    await idbPut('files', { id: id, name: f.name, size: f.size, blob: f });
    state.items.push({ id: id, name: f.name, size: f.size, blob: f });
  }
  await saveOrder(); renderList();
  els.status.textContent = vids.length + ' video eklendi.';
}

/* media/ klasorunu (yerel sunucu uzerinden) tara */
async function scanMedia() {
  try {
    const r = await fetch('api/media');
    if (!r.ok) throw new Error('yok');
    const files = await r.json();
    if (!files.length) { els.status.textContent = 'media/ klasörü boş.'; return; }
    let added = 0;
    for (const f of files) {
      if (state.items.some(i => i.url === f.url)) continue;
      state.items.push({ id: 'u_' + f.url, name: f.name, size: f.size, url: f.url });
      added++;
    }
    await saveOrder(); renderList();
    els.status.textContent = 'media/ klasöründen ' + added + ' video eklendi.';
  } catch (e) {
    els.status.textContent = 'media/ taraması yalnızca BASLAT.bat ile (yerel sunucu) çalışır.';
  }
}

async function clearAll() {
  for (const it of state.items) if (it.id && !it.url) await idbDel('files', it.id);
  state.items = []; await saveOrder(); renderList();
}

async function restore() {
  const cfg = await idbGet('meta', 'cfg');
  if (cfg) {
    CFG_KEYS.forEach(k => { if (cfg[k] !== undefined) state.cfg[k] = cfg[k]; });
    // Daha once kaydedilmis ayarlar eski surumdense, degisen varsayilanlar geri gelsin
    if (cfg.ver !== CFG_VER) { state.cfg.beam = DEFAULTS.beam; state.cfg.videoFit = DEFAULTS.videoFit; }
  }
  state.cfg.ver = CFG_VER;
  writeForm(); applyClockOptions();
  const order = (await idbGet('meta', 'order')) || [];
  const files = await idbAll('files');
  const byId = {};
  files.forEach(f => { byId[f.id] = f; });
  state.items = order.map(o => {
    if (o.url) return { id: o.id, name: o.name, url: o.url };
    const f = byId[o.id];
    return f ? { id: f.id, name: f.name, size: f.size, blob: f.blob } : null;
  }).filter(Boolean);
  renderList();
}

/* ------------------------------ OYNATICI -------------------------------- */
const player = {
  running: false, idx: -1, queue: [], urls: new Map(),
  front: null, back: null, timer: 0, watchdog: 0, wake: null
};

function srcFor(item) {
  if (item.url) return item.url;
  if (!player.urls.has(item.id)) player.urls.set(item.id, URL.createObjectURL(item.blob));
  return player.urls.get(item.id);
}
function buildQueue() {
  const q = state.items.map((_, i) => i);
  if (state.cfg.order === 'shuffle') {
    for (let i = q.length - 1; i > 0; i--) {
      const j = (Math.random() * (i + 1)) | 0;
      const t = q[i]; q[i] = q[j]; q[j] = t;
    }
  }
  player.queue = q; player.idx = -1;
}
function nextIndex() {
  player.idx++;
  if (player.idx >= player.queue.length) { buildQueue(); player.idx = 0; }
  return player.queue[player.idx];
}

function toast(msg, ms) {
  els.toast.textContent = msg; els.toast.hidden = false;
  clearTimeout(toast._t); toast._t = setTimeout(() => { els.toast.hidden = true; }, ms || 2500);
}

async function startShow() {
  readForm();
  if (!state.items.length) return;
  els.setup.hidden = true; els.player.hidden = false;
  els.player.style.setProperty('--fade', state.cfg.fadeMs + 'ms');
  els.player.classList.add('hide-cursor');
  try { await document.documentElement.requestFullscreen({ navigationUI: 'hide' }); } catch (e) { }
  await requestWakeLock();
  layoutPlayer(); startClock();
  player.running = true; player.front = els.vidA; player.back = els.vidB;
  buildQueue();
  playNextVideo();
}

/* Video olmadan yalnizca saati tam ekran gosterir (musteri onizlemesi) */
async function showClockOnly() {
  readForm();
  els.setup.hidden = true; els.player.hidden = false;
  els.player.style.setProperty('--fade', state.cfg.fadeMs + 'ms');
  els.player.classList.add('hide-cursor');
  try { await document.documentElement.requestFullscreen({ navigationUI: 'hide' }); } catch (e) { }
  await requestWakeLock();
  layoutPlayer(); startClock();
  els.layerVideo.classList.remove('on');
  els.layerClock.classList.add('on');
}

function stopShow() {
  player.running = false;
  clearTimeout(player.timer); clearTimeout(player.watchdog);
  [els.vidA, els.vidB].forEach(v => {
    try { v.pause(); } catch (e) { }
    v.removeAttribute('src'); try { v.load(); } catch (e) { }
    v.classList.remove('on');
  });
  player.urls.forEach(u => URL.revokeObjectURL(u)); player.urls.clear();
  els.layerVideo.classList.remove('on'); els.layerClock.classList.remove('on');
  els.tapStart.hidden = true;
  if (player.wake) { try { player.wake.release(); } catch (e) { } player.wake = null; }
  if (document.fullscreenElement) document.exitFullscreen().catch(() => { });
  els.player.hidden = true; els.setup.hidden = false;
  els.player.classList.remove('hide-cursor');
  layoutPreview();
}

/* --- video asamasi --- */
function playNextVideo() {
  if (!player.running) return;
  const item = state.items[nextIndex()];
  if (!item) return;
  const v = player.front;
  v.muted = !state.cfg.audio; v.volume = state.cfg.audio ? 1 : 0;
  v.loop = false;
  const s = srcFor(item);
  if (v.src !== s) { v.src = s; try { v.load(); } catch (e) { } }
  v.onended = () => showClock();
  v.onerror = () => { console.warn('video hatasi', item.name); toast('Video açılamadı: ' + item.name); showClock(); };

  let started = false, tries = 0;
  const onStarted = () => {
    if (started) return; started = true;
    els.tapStart.hidden = true;
    els.layerClock.classList.remove('on');
    els.layerVideo.classList.add('on');
    player.back.classList.remove('on'); v.classList.add('on');
    armWatchdog(v);
    preloadNext();
  };
  const go = () => {
    if (started || !player.running || player.front !== v) return;
    tries++;
    if (v.currentTime > 0.2 && v.readyState >= 1) { try { v.currentTime = 0; } catch (e) { } }
    const p = v.play();
    if (!p || !p.catch) { onStarted(); return; }
    p.then(onStarted).catch(err => {
      const name = (err && err.name) || 'Error';
      player.lastError = name + ': ' + (err && err.message);
      els.layerClock.classList.add('on');       // beklerken saat ekranda kalsin
      els.layerVideo.classList.remove('on');
      if (name === 'NotAllowedError') {
        // tarayici otomatik oynatmayi engelledi: once sessizce tekrar dene,
        // olmazsa "dokunun" ekranini goster ama arka planda denemeye devam et
        if (tries < 6) { setTimeout(go, 400); return; }
        els.tapStart.hidden = false;
        els.tapStart.onclick = () => { els.tapStart.hidden = true; tries = 0; go(); };
        setTimeout(() => { if (!started) { tries = 0; go(); } }, 3000);
        return;
      }
      console.warn('play hatasi (' + tries + '):', name, err && err.message);
      if (tries < 6) setTimeout(go, 300);        // gecici kesinti -> tekrar dene
      else showClock();                           // vazgec, saate don
    });
  };
  // ilk kare hazir olur olmaz basla
  if (v.readyState >= 2) go();
  else {
    const onReady = () => { v.removeEventListener('loadeddata', onReady); go(); };
    v.addEventListener('loadeddata', onReady);
    setTimeout(() => { if (!started) go(); }, 1200);
  }
}

/* video takilirsa / bitmezse kurtarma */
function armWatchdog(v) {
  clearTimeout(player.watchdog);
  let last = -1, stalled = 0;
  const check = () => {
    if (!player.running || player.front !== v) return;
    const t = v.currentTime;
    const dur = isFinite(v.duration) ? v.duration : 0;
    if (dur && t >= dur - 0.08 && v.paused) { showClock(); return; }
    if (Math.abs(t - last) < 0.02 && !v.paused) { stalled++; } else { stalled = 0; }
    last = t;
    if (stalled >= 8) { console.warn('video takildi, geciliyor'); showClock(); return; }
    player.watchdog = setTimeout(check, 1000);
  };
  player.watchdog = setTimeout(check, 1000);
}

function preloadNext() {
  if (!player.queue.length) return;
  const nxt = player.queue[(player.idx + 1) % player.queue.length];
  const item = state.items[nxt];
  if (!item) return;
  const b = player.back;
  const s = srcFor(item);
  if (b.src !== s) { b.src = s; try { b.load(); } catch (e) { } }
}

/* --- saat asamasi --- */
function showClock() {
  if (!player.running) return;
  clearTimeout(player.watchdog);
  const v = player.front;
  v.onended = null;
  tickClock(); layoutStage();
  els.layerClock.classList.add('on');
  els.layerVideo.classList.remove('on');
  setTimeout(() => { try { v.pause(); } catch (e) { } }, state.cfg.fadeMs + 80);
  const tmp = player.front; player.front = player.back; player.back = tmp;
  clearTimeout(player.timer);
  player.timer = setTimeout(() => playNextVideo(), Math.max(1, state.cfg.clockSec) * 1000);
}

async function requestWakeLock() {
  try {
    if ('wakeLock' in navigator) {
      player.wake = await navigator.wakeLock.request('screen');
      player.wake.addEventListener('release', () => { player.wake = null; });
      document.addEventListener('visibilitychange', async () => {
        if (document.visibilityState === 'visible' && player.running && !player.wake) {
          try { player.wake = await navigator.wakeLock.request('screen'); } catch (e) { }
        }
      });
    }
  } catch (e) { console.warn('wakeLock yok', e); }
}

/* ------------------------------ Olaylar --------------------------------- */
function keyHandler(e) {
  if (e.key === 'Escape') { if (!els.player.hidden) stopShow(); }
  else if (e.key === 'f' || e.key === 'F') {
    if (!document.fullscreenElement) document.documentElement.requestFullscreen().catch(() => { });
  } else if (player.running && !els.tapStart.hidden) {
    els.tapStart.click();
  }
}
document.onkeydown = keyHandler;
window.addEventListener('resize', () => { layoutPlayer(); layoutPreview(); showLedFields(); });
document.addEventListener('fullscreenchange', () => { layoutPlayer(); });
document.addEventListener('contextmenu', e => { if (player.running) e.preventDefault(); });

els.pickBtn.onclick = e => { e.stopPropagation(); els.fileInput.click(); };
els.drop.onclick = () => els.fileInput.click();
els.fileInput.onchange = () => { addFiles(els.fileInput.files); els.fileInput.value = ''; };
['dragenter', 'dragover'].forEach(t => els.drop.addEventListener(t, e => { e.preventDefault(); els.drop.classList.add('over'); }));
['dragleave', 'drop'].forEach(t => els.drop.addEventListener(t, e => { e.preventDefault(); els.drop.classList.remove('over'); }));
els.drop.addEventListener('drop', e => addFiles(e.dataTransfer.files));
window.addEventListener('dragover', e => e.preventDefault());
window.addEventListener('drop', e => e.preventDefault());
els.scanBtn.onclick = scanMedia;
els.clearBtn.onclick = () => { if (confirm('Tüm videolar listeden kaldırılsın mı?')) clearAll(); };
els.startBtn.onclick = startShow;
els.clockOnlyBtn.onclick = showClockOnly;
CFG_KEYS.forEach(k => {
  const el = $('#' + k);
  if (el) el.addEventListener('change', () => { readForm(); renderList(); layoutPreview(); });
});

/* --------------------------- Onizleme sahnesi ----------------------------
   Oynatici sahnesinin birebir kopyasi; id'ler 'p_' onekiyle cogaltilir.   */
let previewStage = null, previewEls = null;
function layoutPreview() {
  if (!previewStage) return;
  const W = els.preview.clientWidth, H = els.preview.clientHeight;
  let w = W, h = W / AR;
  if (h > H) { h = H; w = H * AR; }
  previewStage.style.width = w + 'px'; previewStage.style.height = h + 'px';
  previewStage.style.left = ((W - w) / 2) + 'px'; previewStage.style.top = ((H - h) / 2) + 'px';
}
function setupPreview() {
  const s = els.stage.cloneNode(true);
  s.querySelectorAll('[id]').forEach(n => { n.id = 'p_' + n.id; });
  s.id = 'previewStage';
  s.style.position = 'absolute';
  els.preview.appendChild(s);
  previewStage = s;
  previewEls = {
    gHour: s.querySelector('#p_gHour'), gMin: s.querySelector('#p_gMin'),
    gSec: s.querySelector('#p_gSec'), beams: s.querySelector('#p_beams'),
    beamMin: s.querySelector('#p_beamMin'), beamSec: s.querySelector('#p_beamSec')
  };
  setClockOpts(previewEls);
  setInterval(() => { if (!els.setup.hidden) paintClock(previewEls, new Date()); }, 60);
  layoutPreview();
}

/* ------------------------------- Baslangic ------------------------------- */
(async function init() {
  ikinciSaatKur();
  try { await restore(); } catch (e) { console.warn('geri yukleme atlandi', e); renderList(); }
  setupPreview();
  [els.vidA, els.vidB].forEach(v => v.addEventListener('loadedmetadata', () => videoBoyutuOgren(v)));
  tickClock();
  els.wakeNote.innerHTML = (location.protocol === 'http:' || location.protocol === 'https:')
    ? 'Ayarlar ve videolar bu bilgisayarda saklanır; program yeniden açıldığında liste korunur. Gösteri sırasında ekran uykuya geçmez.'
    : '<b>Not:</b> Sayfa doğrudan dosyadan açıldı (file://). Liste kalıcı saklanamaz ve ekran uykusu engellenemez — <b>BASLAT.bat</b> ile açmanız önerilir.';
  const p = new Image(); p.src = 'assets/poster.jpg';
})();
