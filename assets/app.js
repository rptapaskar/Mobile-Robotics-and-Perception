(function () {
  "use strict";
  const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const typing = e => /INPUT|TEXTAREA|SELECT/.test(e.target.tagName) || e.target.isContentEditable;

  // ---------- attribution appended to copied text ----------
  document.addEventListener("copy", e => { const sel = String(window.getSelection()); if (sel.length < 60 || typing(e)) return;
    const note = "\n\n" + ((window.WM && window.WM.rights) || "") + " Source: " + location.href.split("#")[0] + ". Reproduction without written permission is prohibited.";
    e.clipboardData.setData("text/plain", sel + note); e.preventDefault(); });

  // ---------- mobile menu ----------
  const mb = $(".menu-btn");
  if (mb) mb.addEventListener("click", () => { const o = document.body.classList.toggle("nav-open"); mb.setAttribute("aria-expanded", o); });
  $$(".side a").forEach(a => a.addEventListener("click", () => document.body.classList.remove("nav-open")));

  // ---------- tools ----------
  $$(".tool[data-tool]").forEach(el => {
    const f = window.CourseTools && window.CourseTools[el.dataset.tool];
    if (f) { try { f(el.querySelector(".tool-b")); } catch (err) { console.error(el.dataset.tool, err); } }
  });

  // ---------- search ----------
  const pop = $(".search-pop"), sbtn = $(".search-btn");
  if (pop && sbtn) {
    const inp = $("input", pop), res = $(".search-res", pop); let sel = 0;
    const open = () => { pop.hidden = false; inp.focus(); inp.select(); run(); };
    const close = () => { pop.hidden = true; };
    function run() {
      const q = inp.value.trim().toLowerCase(); res.innerHTML = ""; sel = 0; if (q.length < 2) return;
      const words = q.split(/\s+/);
      const hits = (window.SEARCH || []).map(d => { const t = d.t.toLowerCase(), x = d.x.toLowerCase(); let s = 0;
        for (const w of words) { if (t.includes(w)) s += 5; else if (x.includes(w)) s += 1; else return null; } return [s, d]; })
        .filter(Boolean).sort((a, b) => b[0] - a[0]).slice(0, 12);
      if (!hits.length) { res.innerHTML = `<li><small>No match. Try a shorter or different term, for example "kalman" or "costmap".</small></li>`; return; }
      for (const [, d] of hits) { const i = d.x.toLowerCase().indexOf(words[0]); const sn = d.x.slice(Math.max(0, i - 50), i + 110);
        const li = document.createElement("li"); li.innerHTML = `<a href="${window.REL}${d.u}">${d.t}<small>Chapter ${d.c}: ${sn.replace(/</g, "&lt;")}…</small></a>`; res.appendChild(li); }
      mark();
    }
    const mark = () => $$("a", res).forEach((a, i) => a.classList.toggle("sel", i === sel));
    sbtn.addEventListener("click", () => pop.hidden ? open() : close());
    inp.addEventListener("input", run);
    inp.addEventListener("keydown", e => { const a = $$("a", res);
      if (e.key === "ArrowDown") { sel = Math.min(sel + 1, a.length - 1); mark(); e.preventDefault(); }
      else if (e.key === "ArrowUp") { sel = Math.max(sel - 1, 0); mark(); e.preventDefault(); }
      else if (e.key === "Enter" && a[sel]) { location.href = a[sel].href; close(); }
      else if (e.key === "Escape") close(); });
    document.addEventListener("keydown", e => { if (e.key === "/" && !typing(e) && !deckOn()) { e.preventDefault(); open(); } });
    document.addEventListener("click", e => { if (!pop.hidden && !pop.contains(e.target) && e.target !== sbtn) close(); });
  }

  // ---------- TOC highlight ----------
  const tocLinks = $$(".toc a[href^='#']");
  if (tocLinks.length && "IntersectionObserver" in window) {
    const map = new Map(tocLinks.map(a => [a.getAttribute("href").slice(1), a]));
    const io = new IntersectionObserver(es => { es.forEach(e => { if (e.isIntersecting) { tocLinks.forEach(a => a.classList.remove("act")); const a = map.get(e.target.id); if (a) { a.classList.add("act"); a.scrollIntoView({ block: "nearest" }); } } }); }, { rootMargin: "-20% 0px -70% 0px" });
    $$("main .slide, main section[id]").forEach(s => io.observe(s));
  }

  // ---------- question filters ----------
  const fl = $(".filters");
  if (fl) {
    const st = { ch: "all", bl: "all" };
    const apply = () => { $$(".qgroup").forEach(g => { g.hidden = st.ch !== "all" && g.dataset.ch !== st.ch; });
      $$(".q").forEach(q => { q.hidden = st.bl !== "all" && q.dataset.bl !== st.bl; }); };
    $$("button[data-f]", fl).forEach(b => b.addEventListener("click", () => { st[b.dataset.f] = b.dataset.v;
      $$(`button[data-f=${b.dataset.f}]`, fl).forEach(x => x.classList.toggle("on", x === b)); apply(); }));
    const ta = $(".toggle-all", fl); let openAll = false;
    ta.addEventListener("click", () => { openAll = !openAll; $$("details").forEach(d => d.open = openAll); ta.textContent = openAll ? "Collapse all schemes" : "Expand all schemes"; });
  }

  // ---------- presentation deck ----------
  const deck = $(".deck"); const deckOn = () => deck && !deck.hidden;
  const chapter = +document.body.dataset.chapter;
  if (deck && chapter) {
    const stage = $(".deck-stage", deck), nEl = $(".deck-n", deck), tEl = $(".deck-topic", deck), bar = $(".deck-bar i", deck);
    $(".deck-ch", deck).textContent = (document.body.dataset.kind || "Chapter") + " " + chapter;
    const slides = [$(".ch-head"), ...$$("main .slide")].filter(Boolean);
    let cur = -1, ph = null, overview = false;
    function put(i) {
      if (cur >= 0 && ph) { ph.replaceWith(slides[cur]); ph = null; }
      cur = Math.max(0, Math.min(slides.length - 1, i)); const s = slides[cur];
      ph = document.createComment("slide"); s.replaceWith(ph); stage.innerHTML = ""; stage.appendChild(s); stage.scrollTop = 0;
      nEl.textContent = `${cur + 1} / ${slides.length}`;
      tEl.textContent = cur === 0 ? $("h1", s).textContent : s.dataset.topic || "";
      bar.style.width = ((cur + 1) / slides.length * 100) + "%";
      history.replaceState(null, "", "#" + (s.id || "present"));
      window.dispatchEvent(new Event("resize"));
    }
    function start(i) { deck.hidden = false; document.body.classList.add("presenting"); overview = false; deck.classList.remove("overview"); put(i); }
    function stop() {
      if (overview) toggleOverview();
      if (cur >= 0 && ph) { ph.replaceWith(slides[cur]); ph = null; }
      const s = slides[cur]; cur = -1; deck.hidden = true; document.body.classList.remove("presenting");
      if (document.fullscreenElement) document.exitFullscreen();
      if (s) s.scrollIntoView({ block: "start" }); window.dispatchEvent(new Event("resize"));
    }
    function toggleOverview() {
      overview = !overview; deck.classList.toggle("overview", overview);
      if (overview) {
        if (ph) { ph.replaceWith(slides[cur]); ph = null; }
        stage.innerHTML = ""; slides.forEach((s, i) => { const b = document.createElement("button"); b.className = "ov" + (i === cur ? " cur" : "");
          b.innerHTML = `<small>${i + 1}. ${i === 0 ? "Chapter title" : (s.dataset.topic || "")}</small><b>${i === 0 ? $("h1", s).textContent : $("h3", s).textContent}</b>`;
          b.onclick = () => { overview = false; deck.classList.remove("overview"); const c = cur; cur = -1; put(i); }; stage.appendChild(b); });
      } else { const c = cur; cur = -1; put(c); }
    }
    const startAtCurrent = () => { const y = window.innerHeight * 0.3; let k = 0; slides.forEach((s, i) => { if (s.getBoundingClientRect().top < y) k = i; }); start(k); };
    $(".present-btn").addEventListener("click", startAtCurrent);
    $(".deck-x", deck).addEventListener("click", stop);
    document.addEventListener("keydown", e => {
      if (typing(e)) return;
      if (!deckOn()) { if ((e.key === "p" || e.key === "P") && !e.ctrlKey && !e.metaKey) { e.preventDefault(); startAtCurrent(); } return; }
      const k = e.key;
      if (["ArrowRight", "ArrowDown", "PageDown", " ", "Enter"].includes(k) && !overview) { e.preventDefault(); put(cur + 1); }
      else if (["ArrowLeft", "ArrowUp", "PageUp", "Backspace"].includes(k) && !overview) { e.preventDefault(); put(cur - 1); }
      else if (k === "Home" && !overview) put(0);
      else if (k === "End" && !overview) put(slides.length - 1);
      else if (k === "Escape") { if (overview) toggleOverview(); else if (!document.fullscreenElement) stop(); }
      else if (k === "f" || k === "F") { if (document.fullscreenElement) document.exitFullscreen(); else deck.requestFullscreen && deck.requestFullscreen(); }
      else if (k === "o" || k === "O") toggleOverview();
      else if (k === "p" || k === "P") stop();
    });
    let tx = null; stage.addEventListener("touchstart", e => { tx = e.touches[0].clientX; }, { passive: true });
    stage.addEventListener("touchend", e => { if (tx === null || overview) return; const dx = e.changedTouches[0].clientX - tx; if (Math.abs(dx) > 70 && !e.target.closest(".tool")) put(cur + (dx < 0 ? 1 : -1)); tx = null; });
    if (location.hash === "#present") start(0);
    else if (/^#s\d+$/.test(location.hash) && new URLSearchParams(location.search).has("present")) start(slides.findIndex(s => "#" + s.id === location.hash));
  }

  // ---------- hero: live occupancy-grid mapping ----------
  const hc = $("#heroMap");
  if (hc) {
    const W = 72, H = 50, res = 0.2; // 14.4 m x 10 m
    const occ = new Uint8Array(W * H), L = new Float32Array(W * H);
    const rect = (x, y, w, h) => { for (let i = x; i < x + w; i++) for (let j = y; j < y + h; j++) occ[j * W + i] = 1; };
    rect(0, 0, W, 1); rect(0, H - 1, W, 1); rect(0, 0, 1, H); rect(W - 1, 0, 1, H);
    for (let k = 0; k < 5; k++) { rect(10 + k * 9, 8, 3, 22); }
    rect(10, 38, 22, 3); rect(40, 38, 3, 11); rect(54, 36, 10, 3); rect(58, 12, 8, 6); rect(1, 24, 6, 2);
    const free = (i, j) => i > 0 && j > 0 && i < W && j < H && !occ[j * W + i];
    const bfs = (sx, sy, gx, gy) => { const prev = new Int32Array(W * H).fill(-1); const q = [sy * W + sx]; prev[q[0]] = q[0];
      for (let h = 0; h < q.length; h++) { const c = q[h]; if (c === gy * W + gx) break; const ci = c % W, cj = (c / W) | 0;
        for (const [di, dj] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const ni = ci + di, nj = cj + dj; const n = nj * W + ni;
          if (free(ni, nj) && free(ni + 1, nj) && free(ni - 1, nj) && free(ni, nj + 1) && free(ni, nj - 1) && prev[n] < 0) { prev[n] = c; q.push(n); } } }
      if (prev[gy * W + gx] < 0) return null; const p = []; let c = gy * W + gx; while (c !== sy * W + sx) { p.push(c); c = prev[c]; } return p.reverse(); };
    const goals = [[5, 5], [66, 6], [66, 30], [48, 45], [36, 32], [5, 44], [8, 32], [30, 4]]; let gi = 0;
    let rx = 5, ry = 5, path = [], th = 0;
    const plan = (gx, gy) => { const p = bfs(Math.round(rx), Math.round(ry), gx, gy); if (p) path = p; return !!p; };
    const cast = () => { for (let k = 0; k < 90; k++) { const a = th + k / 90 * Math.PI * 2; const dx = Math.cos(a), dy = Math.sin(a);
      let last = -1; for (let s = 0; s < 45; s += 0.5) { const i = Math.floor(rx + 0.5 + dx * s), j = Math.floor(ry + 0.5 + dy * s); if (i < 0 || j < 0 || i >= W || j >= H) break; const c = j * W + i;
        if (occ[c]) { L[c] = Math.min(4, L[c] + 0.9); break; } if (c !== last) { L[c] = Math.max(-4, L[c] - 0.35); last = c; } } } };
    const ctx = hc.getContext("2d"); const img = document.createElement("canvas"); img.width = W; img.height = H; const ic = img.getContext("2d"); const id = ic.createImageData(W, H);
    function draw() {
      const w = hc.clientWidth, h = hc.clientHeight, d = devicePixelRatio || 1; if (hc.width !== Math.round(w * d)) { hc.width = Math.round(w * d); hc.height = Math.round(h * d); }
      for (let c = 0; c < W * H; c++) { const p = 1 - 1 / (1 + Math.exp(L[c])); let v = L[c] === 0 ? [226, 232, 240] : [255 * (1 - p), 255 * (1 - p), 255 * (1 - p) + (p < 0.5 ? 0 : 20)];
        id.data[c * 4] = v[0]; id.data[c * 4 + 1] = v[1]; id.data[c * 4 + 2] = v[2]; id.data[c * 4 + 3] = 255; }
      ic.putImageData(id, 0, 0); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.imageSmoothingEnabled = false; ctx.drawImage(img, 0, 0, hc.width, hc.height);
      const sx = hc.width / W, sy = hc.height / H; ctx.setTransform(sx, 0, 0, sy, 0, 0);
      ctx.strokeStyle = "rgba(37,99,235,.55)"; ctx.lineWidth = 0.25; ctx.beginPath(); ctx.moveTo(rx + 0.5, ry + 0.5); path.forEach(c => ctx.lineTo(c % W + 0.5, ((c / W) | 0) + 0.5)); ctx.stroke();
      ctx.fillStyle = "rgba(13,138,127,.14)"; ctx.beginPath(); ctx.arc(rx + 0.5, ry + 0.5, 12, 0, 7); ctx.fill();
      ctx.fillStyle = "#14213D"; ctx.beginPath(); ctx.arc(rx + 0.5, ry + 0.5, 1.3, 0, 7); ctx.fill();
      ctx.strokeStyle = "#38BDF8"; ctx.lineWidth = 0.5; ctx.beginPath(); ctx.moveTo(rx + 0.5, ry + 0.5); ctx.lineTo(rx + 0.5 + 2 * Math.cos(th), ry + 0.5 + 2 * Math.sin(th)); ctx.stroke();
    }
    function step() {
      if (!path.length) { for (let t = 0; t < goals.length && !path.length; t++) { gi = (gi + 1) % goals.length; plan(...goals[gi]); } }
      const c = path[0]; if (c === undefined) return; const gx = c % W, gy = (c / W) | 0; const dx = gx - rx, dy = gy - ry, d = Math.hypot(dx, dy);
      th += (Math.atan2(dy, dx) - th + 3 * Math.PI) % (2 * Math.PI) - Math.PI; if (d < 0.35) { path.shift(); } else { rx += dx / d * 0.35; ry += dy / d * 0.35; }
      cast();
    }
    hc.addEventListener("click", e => { const r = hc.getBoundingClientRect(); const gx = Math.floor((e.clientX - r.left) / r.width * W), gy = Math.floor((e.clientY - r.top) / r.height * H); if (free(gx, gy)) plan(gx, gy); });
    const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
    plan(...goals[1]);
    if (reduce) { for (let k = 0; k < 900; k++) step(); draw(); }
    else { let vis = true; new IntersectionObserver(e => vis = e[0].isIntersecting).observe(hc); (function f() { if (vis && !document.hidden) { step(); draw(); } requestAnimationFrame(f); })(); }
  }
})();
