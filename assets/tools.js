// Course-to-Website simulation framework. Exposes window.CourseTools and helpers in CourseTools._
(function () {
"use strict";
const T = window.CourseTools || {}; window.CourseTools = T;
const C = { ink: "#14213D", ink2: "#334155", grid: "#E6EBF1", obs: "#94A3B8", obsD: "#475569", blue: "#2563EB", teal: "#0D8A7F", red: "#DC2626", amber: "#D97706", purple: "#7C3AED", green: "#15803D", muted: "#64748B", sky: "#38BDF8" };
const PI = Math.PI, rad = d => d * PI / 180, deg = r => r * 180 / PI, clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const wrap = a => { while (a > PI) a -= 2 * PI; while (a < -PI) a += 2 * PI; return a; };
let seed = 12345; const rnd = () => (seed = (seed * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff;
const gauss = () => { let u = 0, v = 0; while (u === 0) u = Math.random(); v = Math.random(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * PI * v); };

// ---------- framework ----------
function Canvas(parent, wx, wy, draw, opt = {}) {
  const cw = document.createElement("div"); cw.className = "cvwrap"; parent.appendChild(cw); const cv = document.createElement("canvas"); cw.appendChild(cv); const wm = document.createElement("div"); wm.className = "wm"; wm.setAttribute("aria-hidden", "true"); wm.innerHTML = "<span>" + ((window.WM && window.WM.corner) || "") + "</span>"; cw.appendChild(wm);
  const o = { cv, ctx: cv.getContext("2d"), w: 0, h: 0, wx, wy, s: 1, ox: 0, oy: 0, draw };
  let lastW = 0;
  function size() {
    const w = parent.clientWidth || 600; if (Math.abs(w - lastW) < 1 && o.w) return; lastW = w;
    let h = w * wy / wx; const maxH = Math.max(260, window.innerHeight * (document.body.classList.contains("presenting") ? 0.52 : 0.6)); if (h > maxH) h = maxH;
    cv.style.height = h + "px"; const d = window.devicePixelRatio || 1; cv.width = Math.round(w * d); cv.height = Math.round(h * d);
    o.ctx.setTransform(d, 0, 0, d, 0, 0); o.w = w; o.h = h;
    o.s = Math.min(w / wx, h / wy); o.ox = (w - wx * o.s) / 2; o.oy = (h - wy * o.s) / 2; if (o.ready && o.draw) o.draw();
  }
  o.X = x => o.ox + x * o.s; o.Y = y => o.h - o.oy - y * o.s; o.S = l => l * o.s;
  o.inv = (px, py) => [(px - o.ox) / o.s, (o.h - o.oy - py) / o.s];
  o.ptr = e => { const r = cv.getBoundingClientRect(); return o.inv(e.clientX - r.left, e.clientY - r.top); };
  o.clear = (bg = "#FBFCFE") => { const c = o.ctx; c.fillStyle = bg; c.fillRect(0, 0, o.w, o.h); c.save(); c.globalAlpha = 0.045; c.fillStyle = "#1F3A5F"; c.font = "600 15px \"IBM Plex Sans\",sans-serif"; c.textAlign = "center"; c.translate(o.w / 2, o.h / 2); c.rotate(-0.4); for (let y = -o.h; y < o.h; y += 90) for (let x = -o.w; x < o.w; x += 360) c.fillText((window.WM && window.WM.text) || "", x + (y / 90 % 2 ? 180 : 0), y); c.restore(); };
  o.grid = (step = 1) => { const c = o.ctx; c.strokeStyle = C.grid; c.lineWidth = 1; c.beginPath();
    for (let x = 0; x <= wx + 1e-9; x += step) { c.moveTo(o.X(x), o.Y(0)); c.lineTo(o.X(x), o.Y(wy)); }
    for (let y = 0; y <= wy + 1e-9; y += step) { c.moveTo(o.X(0), o.Y(y)); c.lineTo(o.X(wx), o.Y(y)); } c.stroke(); };
  o.line = (x1, y1, x2, y2, col = C.ink, lw = 1.5, dash) => { const c = o.ctx; c.strokeStyle = col; c.lineWidth = lw; c.setLineDash(dash || []); c.beginPath(); c.moveTo(o.X(x1), o.Y(y1)); c.lineTo(o.X(x2), o.Y(y2)); c.stroke(); c.setLineDash([]); };
  o.poly = (pts, col, lw = 1.5, dash) => { if (pts.length < 2) return; const c = o.ctx; c.strokeStyle = col; c.lineWidth = lw; c.setLineDash(dash || []); c.beginPath(); pts.forEach((p, i) => i ? c.lineTo(o.X(p[0]), o.Y(p[1])) : c.moveTo(o.X(p[0]), o.Y(p[1]))); c.stroke(); c.setLineDash([]); };
  o.dot = (x, y, r, fill, stroke) => { const c = o.ctx; c.beginPath(); c.arc(o.X(x), o.Y(y), r, 0, 2 * PI); if (fill) { c.fillStyle = fill; c.fill(); } if (stroke) { c.strokeStyle = stroke; c.lineWidth = 1.5; c.stroke(); } };
  o.circ = (x, y, r, fill, stroke, lw = 1.5, dash) => { const c = o.ctx; c.beginPath(); c.arc(o.X(x), o.Y(y), Math.max(0.5, o.S(r)), 0, 2 * PI); if (fill) { c.fillStyle = fill; c.fill(); } if (stroke) { c.setLineDash(dash || []); c.strokeStyle = stroke; c.lineWidth = lw; c.stroke(); c.setLineDash([]); } };
  o.rect = (x, y, w, h, fill, stroke) => { const c = o.ctx; if (fill) { c.fillStyle = fill; c.fillRect(o.X(x), o.Y(y + h), o.S(w), o.S(h)); } if (stroke) { c.strokeStyle = stroke; c.lineWidth = 1; c.strokeRect(o.X(x), o.Y(y + h), o.S(w), o.S(h)); } };
  o.text = (t, x, y, col = C.ink, size = 12, align = "left", bold) => { const c = o.ctx; c.fillStyle = col; c.font = `${bold ? "600 " : ""}${size}px "IBM Plex Sans",sans-serif`; c.textAlign = align; c.textBaseline = "middle"; c.fillText(t, o.X(x), o.Y(y)); };
  o.robot = (x, y, th, r = 0.25, col = C.ink, fill = "#fff") => { o.circ(x, y, r, fill, col, 2); o.line(x, y, x + r * 1.35 * Math.cos(th), y + r * 1.35 * Math.sin(th), col, 2.5); };
  o.arrow = (x1, y1, x2, y2, col, lw = 2) => { o.line(x1, y1, x2, y2, col, lw); const a = Math.atan2(o.Y(y2) - o.Y(y1), o.X(x2) - o.X(x1)); const c = o.ctx; c.fillStyle = col; c.beginPath(); c.moveTo(o.X(x2), o.Y(y2)); c.lineTo(o.X(x2) - 9 * Math.cos(a - 0.4), o.Y(y2) - 9 * Math.sin(a - 0.4)); c.lineTo(o.X(x2) - 9 * Math.cos(a + 0.4), o.Y(y2) - 9 * Math.sin(a + 0.4)); c.fill(); };
  o.ellipse = (x, y, P, n, col) => { const a = P[0], b = P[1], d = P[3]; const tr = a + d, det = a * d - b * b; const l1 = tr / 2 + Math.sqrt(Math.max(0, tr * tr / 4 - det)), l2 = tr / 2 - Math.sqrt(Math.max(0, tr * tr / 4 - det));
    const ang = Math.abs(b) < 1e-12 ? (a >= d ? 0 : PI / 2) : Math.atan2(l1 - a, b); const c = o.ctx; c.save(); c.translate(o.X(x), o.Y(y)); c.rotate(-ang); c.beginPath();
    c.ellipse(0, 0, Math.max(1, o.S(n * Math.sqrt(Math.max(l1, 0)))), Math.max(1, o.S(n * Math.sqrt(Math.max(l2, 0)))), 0, 0, 2 * PI); c.strokeStyle = col; c.lineWidth = 2; c.stroke(); c.fillStyle = col + "22"; c.fill(); c.restore(); };
  if ("ResizeObserver" in window) new ResizeObserver(size).observe(parent); window.addEventListener("resize", () => { lastW = 0; size(); });
  size(); setTimeout(() => { o.ready = true; o.draw && o.draw(); }, 0); return o;
}
function Ctl(parent) { const d = document.createElement("div"); d.className = "ctl"; parent.appendChild(d); return d; }
function slider(ctl, label, min, max, step, val, fmt, cb) {
  const l = document.createElement("label"); const i = document.createElement("input"); i.type = "range"; i.min = min; i.max = max; i.step = step; i.value = val;
  const o = document.createElement("output"); o.textContent = fmt(+val); l.append(label, i, o); ctl.appendChild(l);
  i.addEventListener("input", () => { o.textContent = fmt(+i.value); cb(+i.value); }); return { get v() { return +i.value; }, set(v) { i.value = v; o.textContent = fmt(+v); } };
}
function btn(ctl, label, cb, pri) { const b = document.createElement("button"); b.type = "button"; b.textContent = label; if (pri) b.className = "pri"; b.addEventListener("click", () => cb(b)); ctl.appendChild(b); return b; }
function sel(ctl, label, opts, cb, val) { const l = document.createElement("label"); const s = document.createElement("select"); opts.forEach(([v, t]) => { const o = document.createElement("option"); o.value = v; o.textContent = t; s.appendChild(o); }); if (val !== undefined) s.value = val; s.addEventListener("change", () => cb(s.value)); l.append(label, s); ctl.appendChild(l); return s; }
function chk(ctl, label, val, cb) { const l = document.createElement("label"); const i = document.createElement("input"); i.type = "checkbox"; i.checked = val; i.addEventListener("change", () => cb(i.checked)); l.append(i, label); ctl.appendChild(l); return i; }
function Readout(parent) { const d = document.createElement("div"); d.className = "readout"; parent.appendChild(d); return t => { d.textContent = t; }; }
function Hint(parent, t) { const d = document.createElement("div"); d.className = "hint"; d.textContent = t; parent.appendChild(d); }
function Loop(el, step) {
  let vis = false, last = 0, id = 0, on = true;
  if ("IntersectionObserver" in window) new IntersectionObserver(e => { vis = e[0].isIntersecting; if (vis) go(); }).observe(el); else vis = true;
  function f(t) { id = 0; if (!vis || !on || document.hidden) { last = 0; return; } const dt = last ? Math.min(0.05, (t - last) / 1000) : 0.016; last = t; step(dt); go(); }
  function go() { if (!id && on) id = requestAnimationFrame(f); }
  return { go, set run(v) { on = v; if (v) go(); }, get run() { return on; } };
}
// ray casting scene: segs [x1,y1,x2,y2,id], circs [x,y,r,id]
function rectSegs(x, y, w, h, id) { return [[x, y, x + w, y, id], [x + w, y, x + w, y + h, id], [x + w, y + h, x, y + h, id], [x, y + h, x, y, id]]; }
function cast(sc, ox, oy, a, max) {
  const dx = Math.cos(a), dy = Math.sin(a); let best = max, id = -1;
  for (const s of sc.segs) { const ex = s[2] - s[0], ey = s[3] - s[1]; const den = dx * ey - dy * ex; if (Math.abs(den) < 1e-12) continue;
    const px = s[0] - ox, py = s[1] - oy; const t = (px * ey - py * ex) / den, u = (px * dy - py * dx) / den; if (t > 1e-6 && t < best && u >= 0 && u <= 1) { best = t; id = s[4]; } }
  if (sc.circs) for (const c of sc.circs) { const fx = ox - c[0], fy = oy - c[1]; const b = fx * dx + fy * dy, cc = fx * fx + fy * fy - c[2] * c[2]; const disc = b * b - cc; if (disc < 0) continue; const t = -b - Math.sqrt(disc); if (t > 1e-6 && t < best) { best = t; id = c[3]; } }
  return [best, id];
}
function drawScene(o, sc, fill = "#CBD5E1") {
  if (sc.rects) sc.rects.forEach(r => o.rect(r[0], r[1], r[2], r[3], fill, C.obsD));
  if (sc.circs) sc.circs.forEach(c => o.circ(c[0], c[1], c[2], fill, C.obsD, 1));
  o.rect(0, 0, o.wx, o.wy, null, C.obsD);
}
function scene(wx, wy, rects, circs) { let segs = rectSegs(0, 0, wx, wy, 0); rects.forEach((r, i) => segs = segs.concat(rectSegs(r[0], r[1], r[2], r[3], i + 1))); return { segs, rects, circs: circs || [] }; }
function inside(sc, x, y, m = 0) { if (x < m || y < m || x > sc.wx - m || y > sc.wy - m) return true; for (const r of sc.rects) if (x > r[0] - m && x < r[0] + r[2] + m && y > r[1] - m && y < r[1] + r[3] + m) return true; for (const c of sc.circs || []) if (Math.hypot(x - c[0], y - c[1]) < c[2] + m) return true; return false; }
T._ = { C, Canvas, Ctl, slider, btn, sel, chk, Readout, Hint, Loop, cast, scene, drawScene, inside, rectSegs, gauss, rnd, clamp, wrap, rad, deg, PI };

})();

// Robotics / mobile-robot tool library (20 tools). Requires framework.js.
(function () {
"use strict";
const T = window.CourseTools; const { C, Canvas, Ctl, slider, btn, sel, chk, Readout, Hint, Loop, cast, scene, drawScene, inside, rectSegs, gauss, rnd, clamp, wrap, rad, deg, PI } = T._;
// =============== Chapter 1 ===============
T.diffdrive = function (root) {
  const WX = 8, WY = 5; let vL = 0.3, vR = 0.5, L = 0.5, r = 0.1; let st, trail;
  const reset = () => { st = { x: 2.2, y: 1.2, th: 0 }; trail = [[st.x, st.y]]; };
  reset();
  const o = Canvas(root, WX, WY, draw);
  const ctl = Ctl(root);
  slider(ctl, "Left wheel vL", -1, 1, 0.05, vL, v => v.toFixed(2) + " m/s", v => { vL = v; reset(); });
  slider(ctl, "Right wheel vR", -1, 1, 0.05, vR, v => v.toFixed(2) + " m/s", v => { vR = v; reset(); });
  slider(ctl, "Wheelbase L", 0.2, 1, 0.05, L, v => v.toFixed(2) + " m", v => { L = v; reset(); });
  const lp = Loop(root, step);
  btn(ctl, "Pause", b => { lp.run = !lp.run; b.textContent = lp.run ? "Pause" : "Play"; });
  btn(ctl, "Restart", () => { reset(); draw(); });
  sel(ctl, "Preset", [["", "choose"], ["s", "Straight"], ["p", "Spin in place"], ["v", "Pivot on left wheel"], ["c", "Circle R = 1 m"]], v => {
    const m = { s: [0.4, 0.4], p: [-0.3, 0.3], v: [0, 0.4], c: [0.4 * (1 - L / 2), 0.4 * (1 + L / 2)] }[v]; if (!m) return; vL = m[0]; vR = m[1]; ctl.querySelectorAll("input")[0].value = vL; ctl.querySelectorAll("input")[1].value = vR;
    ctl.querySelectorAll("output")[0].textContent = vL.toFixed(2) + " m/s"; ctl.querySelectorAll("output")[1].textContent = vR.toFixed(2) + " m/s"; reset(); });
  const out = Readout(root);
  Hint(root, "The robot wraps around the edges. The red star is the instantaneous centre of rotation (ICR); the dashed circle is the path it will trace.");
  function step(dt) {
    const v = (vR + vL) / 2, w = (vR - vL) / L;
    if (Math.abs(w) < 1e-6) { st.x += v * Math.cos(st.th) * dt; st.y += v * Math.sin(st.th) * dt; }
    else { const R = v / w; st.x += R * (Math.sin(st.th + w * dt) - Math.sin(st.th)); st.y -= R * (Math.cos(st.th + w * dt) - Math.cos(st.th)); st.th = wrap(st.th + w * dt); }
    let jump = false; if (st.x < 0) { st.x += WX; jump = true; } if (st.x > WX) { st.x -= WX; jump = true; } if (st.y < 0) { st.y += WY; jump = true; } if (st.y > WY) { st.y -= WY; jump = true; }
    if (jump) trail.push(null); trail.push([st.x, st.y]); if (trail.length > 1500) trail.shift(); draw();
  }
  function draw() {
    if (!st) return; o.clear(); o.grid(0.5);
    let seg = []; trail.forEach(p => { if (!p) { o.poly(seg, C.blue, 2); seg = []; } else seg.push(p); }); o.poly(seg, C.blue, 2);
    const v = (vR + vL) / 2, w = (vR - vL) / L;
    if (Math.abs(w) > 1e-4) { const R = v / w; const ix = st.x - R * Math.sin(st.th), iy = st.y + R * Math.cos(st.th); o.circ(ix, iy, Math.abs(R), null, C.red, 1, [5, 5]); o.line(st.x, st.y, ix, iy, C.red, 1, [3, 3]);
      o.ctx.fillStyle = C.red; o.ctx.font = "16px sans-serif"; o.ctx.textAlign = "center"; o.ctx.fillText("\u2605", o.X(ix), o.Y(iy) + 5); }
    const c = Math.cos(st.th), s = Math.sin(st.th);
    o.circ(st.x, st.y, L / 2 + 0.06, "#fff", C.ink, 2);
    [[-1, vR, C.teal], [1, vL, C.blue]].forEach(([sg, vv, col]) => { const wx = st.x - sg * (L / 2) * s, wy = st.y + sg * (L / 2) * c; o.line(wx - 0.1 * c, wy - 0.1 * s, wx + 0.1 * c, wy + 0.1 * s, C.ink, 6); if (Math.abs(vv) > 0.01) o.arrow(wx, wy, wx + vv * 0.8 * c, wy + vv * 0.8 * s, col, 2); });
    o.line(st.x, st.y, st.x + (L / 2) * c, st.y + (L / 2) * s, C.ink, 2.5);
    const R = Math.abs(w) < 1e-6 ? Infinity : v / w, rpm = x => (x / r * 60 / (2 * PI)).toFixed(1);
    out(`v = (vR+vL)/2 = ${v.toFixed(3)} m/s    ω = (vR−vL)/L = ${w.toFixed(3)} rad/s    R = v/ω = ${isFinite(R) ? R.toFixed(3) + " m" : "∞ (straight)"}\nWheel speeds for r = 0.1 m: right ${(vR / r).toFixed(2)} rad/s (${rpm(vR)} rpm), left ${(vL / r).toFixed(2)} rad/s (${rpm(vL)} rpm)    pose (${st.x.toFixed(2)}, ${st.y.toFixed(2)}, ${deg(st.th).toFixed(1)}°)`);
  }
};

T.frames = function (root) {
  const WX = 7, WY = 5; const p = { x: 3, y: 1.8, th: 90, dx: 0.2, dy: 0, yaw: 0, r: 1.5, a: 30 };
  const o = Canvas(root, WX, WY, draw); const ctl = Ctl(root);
  const S = (k, lab, a, b, st, f) => slider(ctl, lab, a, b, st, p[k], f, v => { p[k] = v; draw(); });
  S("x", "Robot x", 0.5, 6.5, 0.05, v => v.toFixed(2)); S("y", "Robot y", 0.5, 4.5, 0.05, v => v.toFixed(2)); S("th", "Robot θ", -180, 180, 5, v => v + "°");
  S("dx", "Mount x", -0.4, 0.4, 0.05, v => v.toFixed(2)); S("dy", "Mount y", -0.3, 0.3, 0.05, v => v.toFixed(2)); S("yaw", "Mount yaw", -180, 180, 15, v => v + "°");
  S("r", "Range", 0.3, 3, 0.05, v => v.toFixed(2) + " m"); S("a", "Bearing", -135, 135, 5, v => v + "°");
  const out = Readout(root);
  const axes = (x, y, th, len, col, lab) => { o.arrow(x, y, x + len * Math.cos(th), y + len * Math.sin(th), col, 2); o.arrow(x, y, x - len * Math.sin(th), y + len * Math.cos(th), col, 1.5); o.text(lab, x + 0.08, y - 0.15, col, 12, "left", true); };
  function draw() {
    o.clear(); o.grid(0.5); const th = rad(p.th), yw = rad(p.yaw), a = rad(p.a);
    const lx = p.r * Math.cos(a), ly = p.r * Math.sin(a);
    const bx = Math.cos(yw) * lx - Math.sin(yw) * ly + p.dx, by = Math.sin(yw) * lx + Math.cos(yw) * ly + p.dy;
    const mx = Math.cos(th) * bx - Math.sin(th) * by + p.x, my = Math.sin(th) * bx + Math.cos(th) * by + p.y;
    const sx = Math.cos(th) * p.dx - Math.sin(th) * p.dy + p.x, sy = Math.sin(th) * p.dx + Math.cos(th) * p.dy + p.y;
    axes(0.1, 0.1, 0, 0.8, C.ink2, "map");
    o.circ(p.x, p.y, 0.35, "#EEF2FF", C.ink, 2);
    axes(p.x, p.y, th, 0.6, C.blue, "base_link");
    o.rect(sx - 0.07, sy - 0.07, 0.14, 0.14, C.teal); axes(sx, sy, th + yw, 0.4, C.teal, "laser");
    o.line(sx, sy, mx, my, C.red, 1.5, [5, 4]); o.dot(mx, my, 6, C.red); o.text(`(${mx.toFixed(2)}, ${my.toFixed(2)})`, mx + 0.12, my + 0.15, C.red, 12, "left", true);
    const f = n => n.toFixed(3).padStart(7);
    const M = (t, x, y) => [[Math.cos(t), -Math.sin(t), x], [Math.sin(t), Math.cos(t), y], [0, 0, 1]].map(r => "[" + r.map(f).join(" ") + " ]").join("\n");
    out(`point in laser frame  : (${lx.toFixed(3)}, ${ly.toFixed(3)})\npoint in base_link    : (${bx.toFixed(3)}, ${by.toFixed(3)})\npoint in map          : (${mx.toFixed(3)}, ${my.toFixed(3)})\n\nbase_link ← laser                       map ← base_link\n` +
      M(yw, p.dx, p.dy).split("\n").map((l, i) => l + "     " + M(th, p.x, p.y).split("\n")[i]).join("\n"));
  }
};

// =============== Chapter 2 ===============
T.lidar = function (root) {
  const WX = 10, WY = 6;
  const sc = scene(WX, WY, [[1.2, 3.8, 1.8, 1.2], [6, 0.8, 1.2, 1.8], [7.6, 4.2, 1.6, 0.6]], [[4.6, 1.6, 0.05, 10], [8.6, 2.6, 0.3, 11]]); sc.wx = WX; sc.wy = WY;
  const p = { x: 3.2, y: 2.6, th: 0, fov: 270, res: 1, sig: 0.02, max: 8 };
  const o = Canvas(root, WX, WY, draw); const ctl = Ctl(root);
  slider(ctl, "Field of view", 60, 360, 10, p.fov, v => v + "°", v => { p.fov = v; draw(); });
  slider(ctl, "Resolution", 0.25, 6, 0.25, p.res, v => v.toFixed(2) + "°", v => { p.res = v; draw(); });
  slider(ctl, "Noise σ", 0, 0.2, 0.01, p.sig, v => v.toFixed(2) + " m", v => { p.sig = v; draw(); });
  slider(ctl, "Max range", 2, 12, 0.5, p.max, v => v + " m", v => { p.max = v; draw(); });
  slider(ctl, "Heading", -180, 180, 5, 0, v => v + "°", v => { p.th = rad(v); draw(); });
  const out = Readout(root); Hint(root, "Drag the robot. The thin pole (10 cm) and the round can show how angular resolution limits the smallest detectable object at range.");
  let drag = false;
  o.cv.addEventListener("pointerdown", e => { const [x, y] = o.ptr(e); if (Math.hypot(x - p.x, y - p.y) < 0.5) { drag = true; o.cv.setPointerCapture(e.pointerId); } });
  o.cv.addEventListener("pointermove", e => { if (!drag) return; const [x, y] = o.ptr(e); if (!inside(sc, x, y, 0.25)) { p.x = x; p.y = y; draw(); } });
  o.cv.addEventListener("pointerup", () => drag = false);
  function draw() {
    o.clear(); o.grid(1); drawScene(o, sc);
    const n = Math.floor(p.fov / p.res) + (p.fov >= 360 ? 0 : 1); let ret = 0, pole = 0, can = 0; const pts = [];
    for (let k = 0; k < n; k++) { const a = p.th - rad(p.fov) / 2 + rad(p.res) * k; let [d, id] = cast(sc, p.x, p.y, a, 50);
      if (d > p.max) { o.line(p.x, p.y, p.x + p.max * Math.cos(a), p.y + p.max * Math.sin(a), "rgba(100,116,139,.12)", 1); continue; }
      d += p.sig * gauss(); ret++; if (id === 10) pole++; if (id === 11) can++;
      const hx = p.x + d * Math.cos(a), hy = p.y + d * Math.sin(a); o.line(p.x, p.y, hx, hy, "rgba(13,138,127,.22)", 1); pts.push([hx, hy, id]); }
    pts.forEach(q => o.dot(q[0], q[1], 2.2, q[2] >= 10 ? C.red : C.teal));
    o.robot(p.x, p.y, p.th, 0.22, C.ink, "#E0F2FE");
    const dp = Math.hypot(4.6 - p.x, 1.6 - p.y), sp = dp * rad(p.res);
    out(`beams per scan: ${n}    returns: ${ret}    hits on 10 cm pole: ${pole}    hits on 0.6 m can: ${can}\nbeam spacing at the pole (${dp.toFixed(2)} m): r·Δα = ${(sp * 100).toFixed(1)} cm  ${sp > 0.1 ? "→ wider than the pole: it can be missed" : "→ narrower than the pole"}`);
  }
};

T.beam = function (root) {
  const ZM = 10; const p = { zs: 6, sh: 0.25, ls: 0.4, wh: 0.7, wsh: 0.1, wm: 0.05, wr: 0.15, z: 5 };
  const o = Canvas(root, 10, 4.2, draw); const ctl = Ctl(root);
  const S = (k, lab, a, b, st, f) => slider(ctl, lab, a, b, st, p[k], f, v => { p[k] = v; draw(); });
  S("zs", "True range z*", 1, 9.5, 0.1, v => v.toFixed(1) + " m"); S("sh", "σ hit", 0.05, 1, 0.05, v => v.toFixed(2)); S("ls", "λ short", 0.1, 2, 0.05, v => v.toFixed(2));
  S("wh", "w hit", 0, 1, 0.05, v => v.toFixed(2)); S("wsh", "w short", 0, 1, 0.05, v => v.toFixed(2)); S("wm", "w max", 0, 1, 0.05, v => v.toFixed(2)); S("wr", "w rand", 0, 1, 0.05, v => v.toFixed(2));
  S("z", "Measured z", 0, 10, 0.05, v => v.toFixed(2) + " m");
  const out = Readout(root);
  const comps = z => { const hit = Math.exp(-0.5 * ((z - p.zs) / p.sh) ** 2) / (p.sh * Math.sqrt(2 * PI)); const eta = 1 / (1 - Math.exp(-p.ls * p.zs));
    const sh = z <= p.zs ? eta * p.ls * Math.exp(-p.ls * z) : 0; const mx = z >= ZM - 0.1 ? 10 : 0; return [hit, sh, mx, 1 / ZM]; };
  function draw() {
    o.clear(); const sum = p.wh + p.wsh + p.wm + p.wr || 1; const w = [p.wh, p.wsh, p.wm, p.wr].map(x => x / sum);
    const ym = 1.6, sy = 3.6 / ym, X0 = 0.4; const X = z => X0 + z * 0.94, Y = v => 0.4 + Math.min(v, ym) * sy;
    o.line(X(0), Y(0), X(ZM), Y(0), C.muted, 1); o.line(X(0), Y(0), X(0), Y(ym), C.muted, 1);
    for (let z = 0; z <= ZM; z += 2) o.text(z + " m", X(z), 0.2, C.muted, 11, "center");
    const cols = [C.blue, C.amber, C.red, C.muted]; const pts = [[], [], [], []], mix = [];
    for (let i = 0; i <= 500; i++) { const z = i / 500 * ZM; const c = comps(z); let m = 0; c.forEach((v, k) => { pts[k].push([X(z), Y(w[k] * v)]); m += w[k] * v; }); mix.push([X(z), Y(m)]); }
    pts.forEach((pp, k) => o.poly(pp, cols[k] + "99", 1.2)); o.poly(mix, C.purple, 3);
    const c = comps(p.z); const lik = c.reduce((a, v, k) => a + w[k] * v, 0);
    o.line(X(p.z), Y(0), X(p.z), Y(Math.min(lik, ym)), C.ink, 2, [4, 3]); o.dot(X(p.z), Y(lik), 5, C.ink);
    o.text("mixture p(z | x, m)", X(0.2), Y(ym) - 0.05, C.purple, 12, "left", true);
    [["hit", C.blue], ["short", C.amber], ["max", C.red], ["rand", C.muted]].forEach((t, k) => o.text("— " + t[0], X(6.2 + k * 0.95), Y(ym) - 0.05, t[1], 11));
    out(`normalized weights: hit ${w[0].toFixed(2)}, short ${w[1].toFixed(2)}, max ${w[2].toFixed(2)}, rand ${w[3].toFixed(2)}\np(z = ${p.z.toFixed(2)} m) = ${lik.toFixed(4)}    log-likelihood = ${Math.log(lik).toFixed(2)}    (a pure Gaussian would give ${c[0].toExponential(2)})`);
  }
};

T.ogrid = function (root) {
  const WX = 8, WY = 5, R = 0.1, NX = 80, NY = 50;
  const sc = scene(WX, WY, [[1.5, 1.2, 1.2, 0.6], [4.2, 2.4, 0.4, 2.6], [5.8, 0.8, 1.2, 1], [2.2, 3.4, 0.8, 0.8]], [[6.6, 3.6, 0.3, 9]]); sc.wx = WX; sc.wy = WY;
  const wp = [[0.7, 0.6], [3.6, 0.6], [3.6, 2.2], [5.2, 2.2], [5.2, 4.3], [7.3, 4.3], [7.3, 2.6], [5.2, 2.2], [3.6, 2.2], [3.4, 4.4], [0.6, 4.4], [0.6, 2.6]];
  let L, rb, wi, tAcc; const p = { po: 0.7, pf: 0.4, sig: 0.02, truth: false };
  const reset = () => { L = new Float32Array(NX * NY); rb = { x: wp[0][0], y: wp[0][1], th: 0 }; wi = 1; tAcc = 0; };
  reset();
  const off = document.createElement("canvas"); off.width = NX; off.height = NY; const oc = off.getContext("2d"); const img = oc.createImageData(NX, NY);
  const o = Canvas(root, WX, WY, draw); const ctl = Ctl(root);
  slider(ctl, "p(occ | hit)", 0.55, 0.95, 0.05, p.po, v => v.toFixed(2), v => p.po = v);
  slider(ctl, "p(occ | pass)", 0.05, 0.45, 0.05, p.pf, v => v.toFixed(2), v => p.pf = v);
  slider(ctl, "Range noise σ", 0, 0.15, 0.01, p.sig, v => v.toFixed(2) + " m", v => p.sig = v);
  const lp = Loop(root, step);
  btn(ctl, "Pause", b => { lp.run = !lp.run; b.textContent = lp.run ? "Pause" : "Play"; });
  btn(ctl, "Clear map", () => { reset(); draw(); });
  chk(ctl, " show true walls", false, v => { p.truth = v; draw(); });
  const out = Readout(root);
  function scan() {
    const lo = Math.log(p.po / (1 - p.po)), lf = Math.log(p.pf / (1 - p.pf));
    for (let k = 0; k < 72; k++) { const a = rb.th + k * 2 * PI / 72; let [d] = cast(sc, rb.x, rb.y, a, 4); const hit = d < 4; d = Math.min(4, d + p.sig * gauss());
      let last = -1; for (let s = 0; s < d - R * 0.5; s += R * 0.5) { const i = Math.floor((rb.x + s * Math.cos(a)) / R), j = Math.floor((rb.y + s * Math.sin(a)) / R); const c = j * NX + i; if (c !== last && i >= 0 && j >= 0 && i < NX && j < NY) { L[c] = clamp(L[c] + lf, -4, 4); last = c; } }
      if (hit) { const i = Math.floor((rb.x + d * Math.cos(a)) / R), j = Math.floor((rb.y + d * Math.sin(a)) / R); if (i >= 0 && j >= 0 && i < NX && j < NY) L[j * NX + i] = clamp(L[j * NX + i] + lo, -4, 4); } }
  }
  function step(dt) {
    const g = wp[wi % wp.length]; const dx = g[0] - rb.x, dy = g[1] - rb.y, d = Math.hypot(dx, dy); rb.th = Math.atan2(dy, dx);
    if (d < 0.05) wi++; else { const s = Math.min(d, 0.7 * dt); rb.x += dx / d * s; rb.y += dy / d * s; }
    tAcc += dt; if (tAcc > 0.1) { tAcc = 0; scan(); } draw();
  }
  function draw() {
    if (!L) return; let known = 0, oc_ = 0;
    for (let j = 0; j < NY; j++) for (let i = 0; i < NX; i++) { const l = L[j * NX + i], q = ((NY - 1 - j) * NX + i) * 4; let r, g, b;
      if (l === 0) { r = 203; g = 213; b = 225; } else { known++; const pr = 1 - 1 / (1 + Math.exp(l)); if (pr > 0.65) oc_++; const v = Math.round(255 * (1 - pr)); r = g = b = v; }
      img.data[q] = r; img.data[q + 1] = g; img.data[q + 2] = b; img.data[q + 3] = 255; }
    oc.putImageData(img, 0, 0); o.clear("#fff"); o.ctx.imageSmoothingEnabled = false; o.ctx.drawImage(off, o.X(0), o.Y(WY), o.S(WX), o.S(WY));
    if (p.truth) { sc.rects.forEach(r => o.rect(r[0], r[1], r[2], r[3], null, C.red)); sc.circs.forEach(c => o.circ(c[0], c[1], c[2], null, C.red, 1)); }
    o.robot(rb.x, rb.y, rb.th, 0.15, C.blue, "#DBEAFE");
    out(`grid ${NX} × ${NY} cells at ${R * 100} cm    observed cells: ${known} (${(100 * known / (NX * NY)).toFixed(0)} %)    occupied (p > 0.65): ${oc_}\nl_occ = ${Math.log(p.po / (1 - p.po)).toFixed(2)}, l_free = ${Math.log(p.pf / (1 - p.pf)).toFixed(2)}, clamped to ±4.  Grey = unknown, white = free, black = occupied.`);
  }
};

// =============== Chapter 3 ===============
T.bayes1d = function (root) {
  const N = 20, doors = [3, 8, 14]; let bel, pos; const p = { ph: 0.8, pm: 0.8, show: true };
  const reset = () => { bel = new Array(N).fill(1 / N); pos = 5; };
  reset();
  const o = Canvas(root, 20, 6.5, draw); const ctl = Ctl(root);
  const sense = seen => { bel = bel.map((b, i) => b * ((doors.includes(i) === seen) ? p.ph : 1 - p.ph)); const s = bel.reduce((a, b) => a + b, 0); bel = bel.map(b => b / s); draw(); };
  const move = k => { const q = (1 - p.pm) / 2; bel = bel.map((_, i) => p.pm * bel[(i - k + N) % N] + q * bel[(i - k - 1 + N) % N] + q * bel[(i - k + 1 + N) % N]); pos = (pos + k + N) % N; draw(); };
  btn(ctl, "Sense (what the robot sees)", () => sense(Math.random() < p.ph ? doors.includes(pos) : !doors.includes(pos)), true);
  btn(ctl, "Move right", () => move(1)); btn(ctl, "Move left", () => move(-1));
  btn(ctl, "Sense door", () => sense(true)); btn(ctl, "Sense wall", () => sense(false)); btn(ctl, "Reset", () => { reset(); draw(); });
  slider(ctl, "p(correct reading)", 0.5, 0.99, 0.01, p.ph, v => v.toFixed(2), v => p.ph = v);
  slider(ctl, "p(exact motion)", 0.4, 1, 0.05, p.pm, v => v.toFixed(2), v => p.pm = v);
  chk(ctl, " show true robot", true, v => { p.show = v; draw(); });
  const out = Readout(root);
  function draw() {
    if (!bel) return; o.clear("#fff");
    for (let i = 0; i < N; i++) { o.rect(i + 0.05, 5, 0.9, 1.2, doors.includes(i) ? "#FCD9A8" : "#E2E8F0", C.muted); if (doors.includes(i)) o.rect(i + 0.3, 5, 0.4, 0.9, "#B45309"); o.text(i, i + 0.5, 4.7, C.muted, 10, "center"); }
    if (p.show) o.robot(pos + 0.5, 5.6, -PI / 2, 0.28, C.blue, "#DBEAFE");
    const m = Math.max(...bel); for (let i = 0; i < N; i++) { const h = bel[i] / Math.max(m, 0.2) * 3.8; o.rect(i + 0.12, 0.3, 0.76, h, bel[i] === m ? C.purple : "#A5B4FC"); }
    o.text("belief bel(x)", 0.1, 4.25, C.ink2, 12, "left", true);
    const k = bel.indexOf(m); out(`most likely cell: ${k} with probability ${m.toFixed(3)}    true cell: ${pos}    entropy: ${(-bel.reduce((a, b) => a + (b > 0 ? b * Math.log2(b) : 0), 0)).toFixed(2)} bits (uniform = ${Math.log2(N).toFixed(2)})`);
  }
};

T.odometry = function (root) {
  const p = { eR: 0.5, eb: 0, sl: 0, loops: 1, dir: "ccw" }; const Ln = 0.5, side = 4; let tru = [], k = 0;
  const o = Canvas(root, 9, 6, draw); const ctl = Ctl(root);
  const S = (key, lab, a, b, st, f) => slider(ctl, lab, a, b, st, p[key], f, v => { p[key] = v; sim(); });
  S("eR", "Right wheel radius error", -2, 2, 0.1, v => v.toFixed(1) + " %"); S("eb", "Wheelbase error", -5, 5, 0.5, v => v.toFixed(1) + " %"); S("sl", "Random slip σ", 0, 3, 0.25, v => v.toFixed(2) + " %");
  S("loops", "Loops", 1, 5, 1, v => v);
  sel(ctl, "Direction", [["ccw", "Anticlockwise"], ["cw", "Clockwise"]], v => { p.dir = v; sim(); });
  btn(ctl, "Replay", () => { k = 0; lp.run = true; }, true);
  const out = Readout(root); Hint(root, "Dashed: the square the robot believes it drove (odometry). Solid: where it really went. Try the UMBmark test: compare clockwise and anticlockwise runs.");
  const lp = Loop(root, () => { if (k < tru.length) { k = Math.min(tru.length, k + 12); draw(); } });
  function sim() {
    let x = 0, y = 0, th = 0; tru = [[0, 0]]; const turn = p.dir === "ccw" ? 1 : -1; const Lt = Ln * (1 + p.eb / 100);
    const drive = (sR, sL) => { const n = Math.max(1, Math.ceil(Math.max(Math.abs(sR), Math.abs(sL)) / 0.02));
      for (let i = 0; i < n; i++) { const dR = sR / n * (1 + p.eR / 100) * (1 + p.sl / 100 * gauss()), dL = sL / n * (1 + p.sl / 100 * gauss()); const ds = (dR + dL) / 2, dth = (dR - dL) / Lt;
        x += ds * Math.cos(th + dth / 2); y += ds * Math.sin(th + dth / 2); th += dth; if (i % 3 === 0) tru.push([x, y]); } tru.push([x, y]); };
    for (let l = 0; l < p.loops; l++) for (let s = 0; s < 4; s++) { drive(side, side); const a = turn * Ln * PI / 4; drive(a, -a); }
    k = 0; lp && (lp.run = true); draw(); o.final = [x, y, th];
  }
  function draw() {
    o.clear(); o.grid(1); const cx = 2.5, cy = p.dir === "ccw" ? 1 : 5; const sq = p.dir === "ccw" ? [[0, 0], [4, 0], [4, 4], [0, 4], [0, 0]] : [[0, 0], [4, 0], [4, -4], [0, -4], [0, 0]];
    o.poly(sq.map(q => [q[0] + cx, q[1] + cy]), C.muted, 2, [7, 5]); o.poly(tru.slice(0, k).map(q => [q[0] + cx, q[1] + cy]), C.red, 2.2);
    o.dot(cx, cy, 5, C.green); const e = tru[Math.max(0, k - 1)] || [0, 0]; o.dot(e[0] + cx, e[1] + cy, 5, C.red);
    if (o.final && k >= tru.length) { const [x, y, th] = o.final; out(`end-point error after ${p.loops} loop(s) of 16 m: ${(Math.hypot(x, y) * 100).toFixed(1)} cm   (x ${(x * 100).toFixed(1)} cm, y ${(y * 100).toFixed(1)} cm)   heading error ${deg(wrap(th)).toFixed(2)}°`); }
    else out("driving…");
  }
  sim();
};

T.mcl = function (root) {
  const WX = 10, WY = 6;
  const sc = scene(WX, WY, [[1.5, 1.5, 1, 1], [4, 3.6, 2.6, 0.6], [7.2, 1.2, 0.6, 2], [1, 4.3, 0.6, 1.2], [5.2, 0.8, 0.6, 0.6]], []); sc.wx = WX; sc.wy = WY;
  const wp = [[0.7, 0.6], [4.4, 0.4], [6.5, 2.2], [9.2, 0.7], [9.2, 5.2], [6.8, 5.2], [3.2, 3], [0.5, 3.3]];
  const NB = 16, ZM = 6; let rb, wi, P, W, tAcc, info = ""; const p = { n: 800, an: 0.1, inj: true, sig: 0.25 };
  const randPose = () => { let x, y; do { x = rnd() * WX; y = rnd() * WY; } while (inside(sc, x, y, 0.2)); return [x, y, rnd() * 2 * PI - PI]; };
  const global = () => { P = []; for (let i = 0; i < p.n; i++) P.push(randPose()); W = new Float64Array(p.n).fill(1 / p.n); };
  const reset = () => { rb = { x: 0.7, y: 0.6, th: 0 }; wi = 1; tAcc = 0; global(); };
  reset();
  const o = Canvas(root, WX, WY, draw); const ctl = Ctl(root);
  slider(ctl, "Particles", 100, 3000, 100, p.n, v => v, v => { p.n = v; global(); });
  slider(ctl, "Motion noise", 0.02, 0.4, 0.02, p.an, v => v.toFixed(2), v => p.an = v);
  slider(ctl, "Sensor σ", 0.1, 1, 0.05, p.sig, v => v.toFixed(2) + " m", v => p.sig = v);
  chk(ctl, " random particle injection", true, v => p.inj = v);
  const lp = Loop(root, step);
  btn(ctl, "Global localization", () => { global(); draw(); }, true);
  btn(ctl, "Kidnap robot", () => { const q = randPose(); rb.x = q[0]; rb.y = q[1]; wi = Math.floor(rnd() * wp.length); draw(); });
  btn(ctl, "Pause", b => { lp.run = !lp.run; b.textContent = lp.run ? "Pause" : "Play"; });
  const out = Readout(root); Hint(root, "Blue dots are particles, the black robot is the truth and the purple arrow is the estimate. 16 LiDAR beams, likelihood-field style Gaussian weighting with a random-reading floor.");
  const scanAt = (x, y, th) => { const z = []; for (let b = 0; b < NB; b++) z.push(Math.min(ZM, cast(sc, x, y, th + b * 2 * PI / NB, ZM)[0])); return z; };
  function update(dx, dy, dth) {
    const c = Math.cos(rb.th - dth), s = Math.sin(rb.th - dth); const fwd = dx * c + dy * s; // odometry in robot frame
    const z = scanAt(rb.x, rb.y, rb.th).map(v => Math.min(ZM, v + 0.03 * gauss()));
    let mx = -Infinity; const lw = new Float64Array(P.length);
    for (let i = 0; i < P.length; i++) { const q = P[i]; const f = fwd * (1 + p.an * gauss()), t = dth + p.an * (0.5 * Math.abs(dth) + 0.05) * gauss();
      q[0] += f * Math.cos(q[2] + t / 2); q[1] += f * Math.sin(q[2] + t / 2); q[2] = wrap(q[2] + t);
      if (inside(sc, q[0], q[1], 0.05)) { lw[i] = -1e9; continue; }
      let l = 0; for (let b = 0; b < NB; b += 2) { const e = z[b] - Math.min(ZM, cast(sc, q[0], q[1], q[2] + b * 2 * PI / NB, ZM)[0]); l += Math.log(0.85 * Math.exp(-0.5 * e * e / (p.sig * p.sig)) + 0.15 / ZM); }
      lw[i] = l; if (l > mx) mx = l; }
    let sum = 0; for (let i = 0; i < P.length; i++) { W[i] = Math.exp(lw[i] - mx); sum += W[i]; } for (let i = 0; i < P.length; i++) W[i] /= sum;
    let s2 = 0; for (const w of W) s2 += w * w; const neff = 1 / s2;
    const avgL = mx / (NB / 2); o.wS = o.wS === undefined ? avgL : o.wS + 0.05 * (avgL - o.wS); o.wF = o.wF === undefined ? avgL : o.wF + 0.4 * (avgL - o.wF);
    if (neff < P.length / 2) { const NP = [], M = P.length; let r = rnd() / M, cdf = W[0], i = 0; const inj = p.inj ? Math.min(0.2, Math.max(0.005, 1 - Math.exp(o.wF - o.wS))) : 0;
      for (let m = 0; m < M; m++) { if (rnd() < inj) { NP.push(randPose()); continue; } const u = r + m / M; while (u > cdf && i < M - 1) { i++; cdf += W[i]; } NP.push(P[i].slice()); }
      P = NP; W = new Float64Array(M).fill(1 / M); }
    return neff;
  }
  function est() { let x = 0, y = 0, cs = 0, sn = 0; P.forEach((q, i) => { x += W[i] * q[0]; y += W[i] * q[1]; cs += W[i] * Math.cos(q[2]); sn += W[i] * Math.sin(q[2]); }); return [x, y, Math.atan2(sn, cs)]; }
  let acc = [0, 0, 0];
  function step(dt) {
    const g = wp[wi % wp.length]; const dx = g[0] - rb.x, dy = g[1] - rb.y, d = Math.hypot(dx, dy); const ta = Math.atan2(dy, dx); const e = wrap(ta - rb.th);
    let mx = 0, my = 0, mt = 0;
    if (d < 0.1) wi++; else if (Math.abs(e) > 0.15) { mt = Math.sign(e) * Math.min(Math.abs(e), 2.5 * dt); } else { const s = Math.min(d, 0.8 * dt); mx = Math.cos(rb.th) * s; my = Math.sin(rb.th) * s; mt = e * 0.5 * dt * 4; }
    rb.x += mx; rb.y += my; rb.th = wrap(rb.th + mt); acc[0] += mx; acc[1] += my; acc[2] += mt;
    tAcc += dt; if (tAcc > 0.2) { const ne = update(acc[0], acc[1], acc[2]); acc = [0, 0, 0]; tAcc = 0; const q = est(); const err = Math.hypot(q[0] - rb.x, q[1] - rb.y);
      info = `N_eff = ${ne.toFixed(0)} / ${P.length}    position error = ${err.toFixed(2)} m    heading error = ${Math.abs(deg(wrap(q[2] - rb.th))).toFixed(1)}°    ${err < 0.3 ? "localized" : "searching"}    w_fast/w_slow = ${Math.exp(o.wF - o.wS).toFixed(2)}`; }
    draw();
  }
  function draw() {
    if (!P) return; o.clear(); o.grid(1); drawScene(o, sc);
    const c = o.ctx; c.fillStyle = "rgba(37,99,235,.45)"; for (const q of P) c.fillRect(o.X(q[0]) - 1.5, o.Y(q[1]) - 1.5, 3, 3);
    for (let b = 0; b < NB; b++) { const a = rb.th + b * 2 * PI / NB; const d = Math.min(ZM, cast(sc, rb.x, rb.y, a, ZM)[0]); o.line(rb.x, rb.y, rb.x + d * Math.cos(a), rb.y + d * Math.sin(a), "rgba(13,138,127,.25)", 1); }
    o.robot(rb.x, rb.y, rb.th, 0.2, C.ink, "#fff"); const q = est(); o.arrow(q[0], q[1], q[0] + 0.5 * Math.cos(q[2]), q[1] + 0.5 * Math.sin(q[2]), C.purple, 2.5); o.dot(q[0], q[1], 4, C.purple);
    out(info || "running…");
  }
};

T.ekf = function (root) {
  const WX = 10, WY = 7; const LM = [[2, 1.5], [5, 1], [8, 1.8], [8.5, 5], [5, 6], [1.5, 5.5], [3.5, 3.6], [6.8, 3.4]];
  const p = { sv: 0.1, sw: 0.1, sr: 0.1, sb: 3, rng: 3, on: true };
  let tr, mu, S, dr, tAcc, trails;
  const reset = () => { tr = [5, 1.2, 0]; mu = tr.slice(); S = [[0.01, 0, 0], [0, 0.01, 0], [0, 0, 0.003]]; dr = tr.slice(); tAcc = 0; trails = { t: [], e: [], d: [] }; };
  reset();
  const o = Canvas(root, WX, WY, draw); const ctl = Ctl(root);
  const Sl = (k, lab, a, b, st, f) => slider(ctl, lab, a, b, st, p[k], f, v => p[k] = v);
  Sl("sv", "Speed noise", 0.02, 0.3, 0.01, v => v.toFixed(2)); Sl("sw", "Turn noise", 0.02, 0.3, 0.01, v => v.toFixed(2));
  Sl("sr", "Range σ", 0.02, 0.5, 0.02, v => v.toFixed(2) + " m"); Sl("sb", "Bearing σ", 0.5, 15, 0.5, v => v + "°"); Sl("rng", "Sensor range", 1, 6, 0.5, v => v + " m");
  chk(ctl, " landmark updates", true, v => p.on = v); btn(ctl, "Reset", () => { reset(); draw(); });
  const out = Readout(root); Hint(root, "Black: true robot. Purple: EKF estimate with its 95 % covariance ellipse. Grey: dead reckoning with the same odometry. Green lines: landmarks observed at this step.");
  const mm = (A, B) => A.map(r => B[0].map((_, j) => r.reduce((s, v, k) => s + v * B[k][j], 0))); const tp = A => A[0].map((_, j) => A.map(r => r[j])); const ad = (A, B) => A.map((r, i) => r.map((v, j) => v + B[i][j]));
  let obs = [];
  function step(dt) {
    tAcc += dt; if (tAcc < 0.1) return; const h = tAcc; tAcc = 0;
    const v = 0.7; let w = 0.3;
    const cx = WX / 2 - mu[0], cy = WY / 2 - mu[1]; if (Math.hypot(cx, cy) > 2.6) w = clamp(1.5 * wrap(Math.atan2(cy, cx) - mu[2]), -0.8, 0.8);
    const vn = v * (1 + p.sv * gauss()), wn = w + p.sw * gauss();
    tr = [tr[0] + vn * h * Math.cos(tr[2]), tr[1] + vn * h * Math.sin(tr[2]), wrap(tr[2] + wn * h)];
    const G = [[1, 0, -v * h * Math.sin(mu[2])], [0, 1, v * h * Math.cos(mu[2])], [0, 0, 1]];
    const V = [[h * Math.cos(mu[2]), 0], [h * Math.sin(mu[2]), 0], [0, h]]; const M = [[(p.sv * v) ** 2, 0], [0, p.sw ** 2]];
    mu = [mu[0] + v * h * Math.cos(mu[2]), mu[1] + v * h * Math.sin(mu[2]), wrap(mu[2] + w * h)];
    dr = [dr[0] + v * h * Math.cos(dr[2]), dr[1] + v * h * Math.sin(dr[2]), wrap(dr[2] + w * h)];
    S = ad(mm(mm(G, S), tp(G)), mm(mm(V, M), tp(V)));
    obs = [];
    if (p.on) for (const L of LM) { const dx = L[0] - tr[0], dy = L[1] - tr[1], r = Math.hypot(dx, dy); if (r > p.rng) continue;
      const z = [r + p.sr * gauss(), wrap(Math.atan2(dy, dx) - tr[2] + rad(p.sb) * gauss())];
      const ex = L[0] - mu[0], ey = L[1] - mu[1], q = ex * ex + ey * ey, sq = Math.sqrt(q);
      const zh = [sq, wrap(Math.atan2(ey, ex) - mu[2])]; const H = [[-ex / sq, -ey / sq, 0], [ey / q, -ex / q, -1]];
      const Q = [[p.sr ** 2, 0], [0, rad(p.sb) ** 2]]; const Sm = ad(mm(mm(H, S), tp(H)), Q); const det = Sm[0][0] * Sm[1][1] - Sm[0][1] * Sm[1][0];
      const Si = [[Sm[1][1] / det, -Sm[0][1] / det], [-Sm[1][0] / det, Sm[0][0] / det]]; const K = mm(mm(S, tp(H)), Si);
      const nu = [z[0] - zh[0], wrap(z[1] - zh[1])]; mu = [0, 1, 2].map(i => mu[i] + K[i][0] * nu[0] + K[i][1] * nu[1]); mu[2] = wrap(mu[2]);
      const KH = mm(K, H); S = mm([0, 1, 2].map(i => [0, 1, 2].map(j => (i === j ? 1 : 0) - KH[i][j])), S); obs.push(L); }
    ["t", "e", "d"].forEach((k, i) => { trails[k].push([tr, mu, dr][i].slice(0, 2)); if (trails[k].length > 400) trails[k].shift(); });
    draw();
  }
  Loop(root, step);
  function draw() {
    if (!mu) return; o.clear(); o.grid(1);
    LM.forEach(L => { o.ctx.fillStyle = C.green; o.ctx.beginPath(); o.ctx.moveTo(o.X(L[0]), o.Y(L[1]) - 8); o.ctx.lineTo(o.X(L[0]) - 7, o.Y(L[1]) + 5); o.ctx.lineTo(o.X(L[0]) + 7, o.Y(L[1]) + 5); o.ctx.fill(); });
    obs.forEach(L => o.line(tr[0], tr[1], L[0], L[1], C.green, 1, [3, 3]));
    o.poly(trails.d, "#94A3B8", 1.5, [4, 3]); o.poly(trails.t, C.ink, 1.5); o.poly(trails.e, C.purple, 1.5);
    o.ellipse(mu[0], mu[1], [S[0][0], S[0][1], S[1][0], S[1][1]], 2.45, C.purple);
    o.robot(dr[0], dr[1], dr[2], 0.15, "#94A3B8"); o.robot(tr[0], tr[1], tr[2], 0.18, C.ink); o.robot(mu[0], mu[1], mu[2], 0.15, C.purple, "#EDE9FE");
    out(`EKF error ${Math.hypot(mu[0] - tr[0], mu[1] - tr[1]).toFixed(2)} m    dead-reckoning error ${Math.hypot(dr[0] - tr[0], dr[1] - tr[1]).toFixed(2)} m    σx = ${Math.sqrt(S[0][0]).toFixed(3)} m  σy = ${Math.sqrt(S[1][1]).toFixed(3)} m  σθ = ${deg(Math.sqrt(S[2][2])).toFixed(2)}°    landmarks seen: ${obs.length}`);
  }
};

// =============== Chapter 4 ===============
T.logodds = function (root) {
  const p = { po: 0.7, pf: 0.4, cl: 4 }; let l = 0, hist = [0.5], seq = [];
  const o = Canvas(root, 10, 3.6, draw); const ctl = Ctl(root);
  const obs = hit => { l = clamp(l + (hit ? Math.log(p.po / (1 - p.po)) : Math.log(p.pf / (1 - p.pf))), -p.cl, p.cl); hist.push(1 - 1 / (1 + Math.exp(l))); seq.push(hit ? "H" : "F"); if (hist.length > 41) { hist.shift(); seq.shift(); } draw(); };
  btn(ctl, "Beam ends in cell (hit)", () => obs(true), true); btn(ctl, "Beam passes through (free)", () => obs(false));
  btn(ctl, "10 hits", () => { for (let i = 0; i < 10; i++) obs(true); }); btn(ctl, "10 free", () => { for (let i = 0; i < 10; i++) obs(false); });
  btn(ctl, "Reset", () => { l = 0; hist = [0.5]; seq = []; draw(); });
  slider(ctl, "p_occ", 0.55, 0.95, 0.05, p.po, v => v.toFixed(2), v => p.po = v); slider(ctl, "p_free", 0.05, 0.45, 0.05, p.pf, v => v.toFixed(2), v => p.pf = v);
  slider(ctl, "Clamp ±", 1, 10, 0.5, p.cl, v => v.toFixed(1), v => { p.cl = v; });
  const out = Readout(root);
  function draw() {
    o.clear("#fff"); const X = i => 0.6 + i * 0.22, Y = q => 0.3 + q * 3;
    o.line(X(0), Y(0), X(40), Y(0), C.muted, 1); o.line(X(0), Y(0.5), X(40), Y(0.5), C.muted, 1, [3, 3]); o.line(X(0), Y(0.65), X(40), Y(0.65), C.red + "66", 1, [2, 4]); o.line(X(0), Y(0.196), X(40), Y(0.196), C.green + "66", 1, [2, 4]);
    o.text("1", 0.35, Y(1), C.muted, 10, "center"); o.text("0.5", 0.3, Y(0.5), C.muted, 10, "center"); o.text("0", 0.35, Y(0), C.muted, 10, "center");
    o.poly(hist.map((q, i) => [X(i), Y(q)]), C.purple, 2.5); hist.forEach((q, i) => o.dot(X(i), Y(q), 3.5, i && seq[i - 1] === "H" ? C.red : i ? C.green : C.muted));
    const pr = 1 - 1 / (1 + Math.exp(l)); const g = Math.round(255 * (1 - pr));
    o.rect(9.1, 1.2, 0.7, 0.7, `rgb(${g},${g},${g})`, C.ink); o.text("cell", 9.45, 2.1, C.muted, 11, "center");
    out(`log-odds l = ${l.toFixed(3)}    p(occupied) = ${pr.toFixed(3)}    state: ${pr > 0.65 ? "OCCUPIED" : pr < 0.196 ? "FREE" : "unknown / uncertain"}\nl_occ = +${Math.log(p.po / (1 - p.po)).toFixed(3)}, l_free = ${Math.log(p.pf / (1 - p.pf)).toFixed(3)}.  Try: 10 hits, then free readings, with a small and a large clamp.`);
  }
};
})();

(function () {
"use strict";
const T = window.CourseTools; const { C, Canvas, Ctl, slider, btn, sel, chk, Readout, Hint, Loop, cast, scene, drawScene, inside, gauss, rnd, clamp, wrap, rad, deg, PI } = T._;

// =============== Chapter 4: pose graph ===============
T.graphslam = function (root) {
  const K = 30; const p = { bias: 0.05, w: 10 }; let truth, meas, X, closed, iters;
  const build = () => { truth = []; for (let i = 0; i < K; i++) { const a = i / K * 2 * PI; truth.push([5 + 3.6 * Math.cos(a), 3.2 + 2.4 * Math.sin(a)]); }
    meas = []; for (let i = 0; i < K - 1; i++) meas.push([truth[i + 1][0] - truth[i][0] + p.bias + 0.02 * gauss(), truth[i + 1][1] - truth[i][1] + p.bias * 0.6 + 0.02 * gauss()]);
    X = [truth[0].slice()]; for (let i = 0; i < K - 1; i++) X.push([X[i][0] + meas[i][0], X[i][1] + meas[i][1]]); closed = false; iters = 0; };
  build();
  const o = Canvas(root, 10, 6.4, draw); const ctl = Ctl(root);
  slider(ctl, "Odometry bias", 0, 0.12, 0.01, p.bias, v => v.toFixed(2) + " m/step", v => { p.bias = v; build(); draw(); });
  slider(ctl, "Loop-closure weight", 1, 50, 1, p.w, v => v, v => p.w = v);
  btn(ctl, "Add loop closure and optimize", () => { closed = true; iters = 0; }, true); btn(ctl, "Reset", () => { build(); draw(); });
  const out = Readout(root); Hint(root, "Simplified pose graph: positions only, solved by Gauss–Seidel relaxation. Each odometry edge says 'the next pose is here relative to this one'; the loop edge says 'the last pose is back next to the first'.");
  Loop(root, () => { if (!closed || iters > 400) return; for (let r = 0; r < 4; r++) { iters++;
    for (let i = 1; i < K; i++) { let sx = 0, sy = 0, sw = 0; const add = (x, y, w) => { sx += w * x; sy += w * y; sw += w; };
      add(X[i - 1][0] + meas[i - 1][0], X[i - 1][1] + meas[i - 1][1], 1); if (i < K - 1) add(X[i + 1][0] - meas[i][0], X[i + 1][1] - meas[i][1], 1);
      if (i === K - 1) add(X[0][0] + (truth[K - 1][0] - truth[0][0]), X[0][1] + (truth[K - 1][1] - truth[0][1]), p.w);
      X[i] = [sx / sw, sy / sw]; } } draw(); });
  function draw() {
    o.clear(); o.grid(1); o.poly(truth.concat([truth[0]]), C.muted, 1.5, [4, 4]);
    for (let i = 0; i < K - 1; i++) o.line(X[i][0], X[i][1], X[i + 1][0], X[i + 1][1], C.blue, 2);
    o.line(X[K - 1][0], X[K - 1][1], X[0][0], X[0][1], closed ? C.red : C.red + "88", closed ? 2.5 : 1.5, closed ? null : [6, 4]);
    X.forEach((q, i) => o.dot(q[0], q[1], i === 0 ? 6 : 4, i === 0 ? C.green : C.blue));
    const err = X.reduce((a, q, i) => a + Math.hypot(q[0] - truth[i][0], q[1] - truth[i][1]), 0) / K; const gap = Math.hypot(X[K - 1][0] - X[0][0] - (truth[K - 1][0] - truth[0][0]), X[K - 1][1] - X[0][1] - (truth[K - 1][1] - truth[0][1]));
    out(`${closed ? "optimizing: iteration " + iters : "odometry only (loop not closed)"}    loop-closure residual ${(gap * 100).toFixed(1)} cm    mean pose error vs truth ${(err * 100).toFixed(1)} cm`);
  }
};

// =============== Chapter 5 ===============
function Heap(cmp) { const a = []; return { push(x) { a.push(x); let i = a.length - 1; while (i > 0) { const p = (i - 1) >> 1; if (cmp(a[i], a[p]) >= 0) break; [a[i], a[p]] = [a[p], a[i]]; i = p; } },
  pop() { const t = a[0], e = a.pop(); if (a.length) { a[0] = e; let i = 0; for (;;) { const l = 2 * i + 1, r = l + 1; let m = i; if (l < a.length && cmp(a[l], a[m]) < 0) m = l; if (r < a.length && cmp(a[r], a[m]) < 0) m = r; if (m === i) break; [a[i], a[m]] = [a[m], a[i]]; i = m; } } return t; }, get size() { return a.length; } }; }

T.planner = function (root) {
  const NX = 40, NY = 24; const g = new Uint8Array(NX * NY); let S = [3, 12], G = [36, 12];
  const preset = k => { g.fill(0); const w = (x, y) => { if (x >= 0 && y >= 0 && x < NX && y < NY) g[y * NX + x] = 1; };
    if (k === "u") { for (let y = 6; y <= 18; y++) w(26, y); for (let x = 14; x <= 26; x++) { w(x, 6); w(x, 18); } }
    else if (k === "f") { for (let c = 0; c < 5; c++) for (let y = 3; y < 20; y++) if (y !== 11 || c % 2) w(8 + c * 6, y + (c % 2 ? 1 : -1)); }
    else if (k === "m") { for (let y = 0; y < NY; y++) for (let x = 0; x < NX; x++) if (rnd() < 0.28) w(x, y); } g[S[1] * NX + S[0]] = 0; g[G[1] * NX + G[0]] = 0; };
  preset("u");
  let res = null, shown = 0; const p = { alg: "astar", conn: 8, speed: 8 };
  const o = Canvas(root, NX, NY, draw); const ctl = Ctl(root);
  sel(ctl, "Algorithm", [["dijkstra", "Dijkstra"], ["astar", "A* (octile / Manhattan)"], ["wastar", "Weighted A* (ε = 2)"], ["greedy", "Greedy best-first"]], v => { p.alg = v; run(); }, "astar");
  sel(ctl, "Moves", [["8", "8-connected"], ["4", "4-connected"]], v => { p.conn = +v; run(); }, "8");
  sel(ctl, "Map", [["u", "U-shaped trap"], ["f", "Factory racks"], ["m", "Random clutter"], ["e", "Empty"]], v => { preset(v); run(); });
  slider(ctl, "Animation speed", 1, 60, 1, p.speed, v => v, v => p.speed = v);
  btn(ctl, "Run", () => run(), true); btn(ctl, "Clear walls", () => { g.fill(0); run(); });
  const out = Readout(root); Hint(root, "Draw or erase walls by dragging on the grid. Drag the green start or the red goal. Shading shows the order in which cells were expanded.");
  function plan() {
    const N = NX * NY, gc = new Float64Array(N).fill(Infinity), par = new Int32Array(N).fill(-1), closed = new Uint8Array(N), order = [];
    const s = S[1] * NX + S[0], t = G[1] * NX + G[0]; const D = Math.SQRT2;
    const h = i => { const dx = Math.abs(i % NX - G[0]), dy = Math.abs(((i / NX) | 0) - G[1]); return p.conn === 8 ? Math.max(dx, dy) + (D - 1) * Math.min(dx, dy) : dx + dy; };
    const wh = { dijkstra: [1, 0], astar: [1, 1], wastar: [1, 2], greedy: [0, 1] }[p.alg];
    const hp = Heap((a, b) => a[0] - b[0] || a[2] - b[2]); gc[s] = 0; hp.push([wh[1] * h(s), s, h(s)]);
    const mv = p.conn === 8 ? [[1, 0, 1], [-1, 0, 1], [0, 1, 1], [0, -1, 1], [1, 1, D], [1, -1, D], [-1, 1, D], [-1, -1, D]] : [[1, 0, 1], [-1, 0, 1], [0, 1, 1], [0, -1, 1]];
    while (hp.size) { const [, c] = hp.pop(); if (closed[c]) continue; closed[c] = 1; order.push(c); if (c === t) break; const cx = c % NX, cy = (c / NX) | 0;
      for (const [dx, dy, w] of mv) { const x = cx + dx, y = cy + dy; if (x < 0 || y < 0 || x >= NX || y >= NY) continue; const n = y * NX + x; if (g[n] || closed[n]) continue;
        if (dx && dy && (g[cy * NX + x] || g[y * NX + cx])) continue; const ng = gc[c] + w; if (ng < gc[n]) { gc[n] = ng; par[n] = c; hp.push([wh[0] * ng + wh[1] * h(n), n, h(n)]); } } }
    const path = []; if (par[t] >= 0 || s === t) { let c = t; while (c !== -1) { path.push(c); c = par[c]; } path.reverse(); }
    return { order, path, cost: gc[t] };
  }
  function run() { res = plan(); shown = 0; lp.run = true; }
  const lp = Loop(root, () => { if (!res) return; if (shown < res.order.length) { shown = Math.min(res.order.length, shown + p.speed); draw(); } });
  let mode = 0, dragW = null;
  o.cv.addEventListener("pointerdown", e => { const [x, y] = o.ptr(e); const i = Math.floor(x), j = Math.floor(NY - y); if (i < 0 || j < 0 || i >= NX || j >= NY) return; o.cv.setPointerCapture(e.pointerId);
    if (i === S[0] && j === S[1]) mode = 1; else if (i === G[0] && j === G[1]) mode = 2; else { mode = 3; dragW = g[j * NX + i] ? 0 : 1; g[j * NX + i] = dragW; res = null; draw(); } });
  o.cv.addEventListener("pointermove", e => { if (!mode) return; const [x, y] = o.ptr(e); const i = Math.floor(x), j = Math.floor(NY - y); if (i < 0 || j < 0 || i >= NX || j >= NY || g[j * NX + i] && mode < 3) return;
    if (mode === 1) S = [i, j]; else if (mode === 2) G = [i, j]; else if (!(i === S[0] && j === S[1]) && !(i === G[0] && j === G[1])) g[j * NX + i] = dragW; res = null; draw(); });
  o.cv.addEventListener("pointerup", () => { if (mode) { mode = 0; run(); } });
  const cellY = j => NY - 1 - j;
  function draw() {
    o.clear("#fff"); const c = o.ctx;
    if (res) { const n = shown; for (let k = 0; k < n; k++) { const i = res.order[k]; const f = k / Math.max(1, res.order.length); o.rect(i % NX, cellY((i / NX) | 0), 1, 1, `hsl(${35 - 20 * f},90%,${80 - 18 * f}%)`); } }
    for (let i = 0; i < NX * NY; i++) if (g[i]) o.rect(i % NX, cellY((i / NX) | 0), 1, 1, "#334155");
    o.grid(1);
    if (res && shown >= res.order.length && res.path.length) o.poly(res.path.map(i => [i % NX + 0.5, cellY((i / NX) | 0) + 0.5]), C.blue, 3.5);
    o.circ(S[0] + 0.5, cellY(S[1]) + 0.5, 0.42, C.green); o.circ(G[0] + 0.5, cellY(G[1]) + 0.5, 0.42, C.red);
    if (res && shown >= res.order.length) out(res.path.length ? `${{ dijkstra: "Dijkstra", astar: "A*", wastar: "Weighted A*", greedy: "Greedy best-first" }[p.alg]}: expanded ${res.order.length} cells    path cost ${res.cost.toFixed(2)}    path cells ${res.path.length}` : `No path exists: ${res.order.length} cells expanded before the open list emptied.`);
    else out("searching… cells expanded: " + shown);
  }
  run();
};

T.rrt = function (root) {
  const OB = [[3, 0, 1, 6.5], [6.5, 3.5, 1, 6.5]]; const Sx = [0.5, 0.5], Gx = [9.5, 9.5];
  const free = (x, y) => x >= 0 && y >= 0 && x <= 10 && y <= 10 && !OB.some(o => x >= o[0] && x <= o[0] + o[2] && y >= o[1] && y <= o[1] + o[3]);
  const segFree = (a, b) => { for (let s = 0; s <= 1; s += 0.08) if (!free(a[0] + (b[0] - a[0]) * s, a[1] + (b[1] - a[1]) * s)) return false; return true; };
  const p = { alg: "star", step: 0.6 }; let N, par, cost, kids, target = 0, best = -1;
  const reset = () => { N = [Sx.slice()]; par = [-1]; cost = [0]; kids = [[]]; best = -1; target = 700; };
  reset();
  const o = Canvas(root, 10, 10, draw); const ctl = Ctl(root);
  sel(ctl, "Planner", [["rrt", "RRT"], ["star", "RRT*"]], v => { p.alg = v; reset(); draw(); }, "star");
  slider(ctl, "Step size η", 0.2, 1.5, 0.1, p.step, v => v.toFixed(1), v => { p.step = v; reset(); draw(); });
  btn(ctl, "Grow 1,500 samples", () => { target += 1500; }, true); btn(ctl, "+100", () => { target += 100; }); btn(ctl, "Reset", () => { reset(); draw(); });
  const out = Readout(root);
  const upd = (i, d) => { cost[i] += d; for (const k of kids[i]) upd(k, d); };
  function add() {
    const q = rnd() < 0.05 ? Gx : [rnd() * 10, rnd() * 10]; let ni = 0, nd = Infinity; for (let i = 0; i < N.length; i++) { const d = Math.hypot(N[i][0] - q[0], N[i][1] - q[1]); if (d < nd) { nd = d; ni = i; } }
    if (nd < 1e-9) return; const s = Math.min(1, p.step / nd); const x = [N[ni][0] + (q[0] - N[ni][0]) * s, N[ni][1] + (q[1] - N[ni][1]) * s];
    if (!free(x[0], x[1]) || !segFree(N[ni], x)) return;
    let bp = ni, bc = cost[ni] + Math.hypot(x[0] - N[ni][0], x[1] - N[ni][1]); let near = [];
    if (p.alg === "star") { const r = Math.max(p.step * 1.2, Math.min(3 * p.step, 9 * Math.sqrt(Math.log(N.length + 1) / (N.length + 1))));
      for (let i = 0; i < N.length; i++) if (Math.hypot(N[i][0] - x[0], N[i][1] - x[1]) < r) near.push(i);
      for (const i of near) { const c = cost[i] + Math.hypot(N[i][0] - x[0], N[i][1] - x[1]); if (c < bc && segFree(N[i], x)) { bc = c; bp = i; } } }
    const j = N.length; N.push(x); par.push(bp); cost.push(bc); kids.push([]); kids[bp].push(j);
    for (const i of near) { const c = bc + Math.hypot(N[i][0] - x[0], N[i][1] - x[1]); if (c < cost[i] - 1e-9 && segFree(N[i], x)) { const op = par[i]; kids[op] = kids[op].filter(k => k !== i); par[i] = j; kids[j].push(i); upd(i, c - cost[i]); } }
    if (Math.hypot(x[0] - Gx[0], x[1] - Gx[1]) < 0.5 && (best < 0 || cost[j] < cost[best])) best = j;
    if (best >= 0) { for (let i = 0; i < N.length; i++) if (Math.hypot(N[i][0] - Gx[0], N[i][1] - Gx[1]) < 0.5 && cost[i] < cost[best]) best = i; }
  }
  Loop(root, () => { if (target <= 0) return; for (let k = 0; k < 20 && target > 0; k++, target--) add(); draw(); });
  function draw() {
    o.clear(); OB.forEach(b => o.rect(b[0], b[1], b[2], b[3], "#94A3B8"));
    const col = p.alg === "star" ? "rgba(13,138,127,.45)" : "rgba(37,99,235,.45)"; const c = o.ctx; c.strokeStyle = col; c.lineWidth = 1; c.beginPath();
    for (let i = 1; i < N.length; i++) { c.moveTo(o.X(N[i][0]), o.Y(N[i][1])); c.lineTo(o.X(N[par[i]][0]), o.Y(N[par[i]][1])); } c.stroke();
    if (best >= 0) { const P = []; let i = best; while (i >= 0) { P.push(N[i]); i = par[i]; } o.poly(P, C.red, 3); }
    o.circ(Gx[0], Gx[1], 0.5, "rgba(220,38,38,.12)", C.red, 1); o.dot(Sx[0], Sx[1], 6, C.green); o.dot(Gx[0], Gx[1], 6, C.red);
    out(`${p.alg === "star" ? "RRT*" : "RRT"}: ${N.length} nodes    ${best >= 0 ? "best path cost " + cost[best].toFixed(2) + " (straight-line bound " + Math.hypot(9, 9).toFixed(2) + ")" : "goal not reached yet"}`);
  }
};

T.potential = function (root) {
  let obs, rb, tr, stuck, kick, hist; const p = { ka: 1, kr: 30, r0: 2.5, esc: false }; const GO = [9, 5];
  const reset = (pre) => { if (pre) obs = pre; rb = [1, 5]; tr = [rb.slice()]; stuck = false; kick = 0; hist = []; };
  reset([[5, 5.7, 0.6]]);
  const o = Canvas(root, 10, 10, draw); const ctl = Ctl(root);
  slider(ctl, "k_att", 0.2, 3, 0.1, p.ka, v => v.toFixed(1), v => p.ka = v); slider(ctl, "k_rep", 1, 80, 1, p.kr, v => v, v => { p.kr = v; draw(); });
  slider(ctl, "Influence ρ0", 0.5, 4, 0.1, p.r0, v => v.toFixed(1) + " m", v => { p.r0 = v; draw(); });
  chk(ctl, " random-walk escape", false, v => p.esc = v);
  btn(ctl, "Restart robot", () => { reset(); }, true);
  sel(ctl, "Scene", [["a", "Offset obstacle"], ["b", "Obstacle on the line (local minimum)"], ["c", "Narrow gap"], ["d", "U-shaped trap"]], v => reset({ a: [[5, 5.7, 0.6]], b: [[5, 5, 0.8]], c: [[5, 6.1, 0.7], [5, 3.9, 0.7]], d: [[6, 5, 0.5], [5.4, 6.2, 0.5], [5.4, 3.8, 0.5], [4.6, 6.8, 0.5], [4.6, 3.2, 0.5]] }[v]));
  const out = Readout(root); Hint(root, "Click to add an obstacle; Shift-click (or long-press) removes the nearest one.");
  const F = (x, y) => { let fx = -p.ka * (x - GO[0]), fy = -p.ka * (y - GO[1]); const n = Math.hypot(fx, fy); if (n > 3) { fx *= 3 / n; fy *= 3 / n; }
    for (const [ox, oy, r] of obs) { const dx = x - ox, dy = y - oy; const d = Math.max(0.05, Math.hypot(dx, dy) - r); if (d < p.r0) { const m = p.kr * (1 / d - 1 / p.r0) / (d * d); const dd = Math.hypot(dx, dy); fx += Math.min(m, 50) * dx / dd; fy += Math.min(m, 50) * dy / dd; } } return [fx, fy]; };
  o.cv.addEventListener("click", e => { const [x, y] = o.ptr(e); if (e.shiftKey && obs.length) { let bi = 0, bd = 1e9; obs.forEach((q, i) => { const d = Math.hypot(q[0] - x, q[1] - y); if (d < bd) { bd = d; bi = i; } }); obs.splice(bi, 1); } else obs.push([x, y, 0.5]); stuck = false; draw(); });
  Loop(root, dt => { if (Math.hypot(rb[0] - GO[0], rb[1] - GO[1]) < 0.15) { draw(); return; }
    let [fx, fy] = F(rb[0], rb[1]); if (kick > 0) { kick--; fx = hist.k[0]; fy = hist.k[1]; }
    const n = Math.hypot(fx, fy); const s = Math.min(1.2 * dt, 0.05); if (n > 1e-6) { rb = [rb[0] + fx / n * s * Math.min(1, n), rb[1] + fy / n * s * Math.min(1, n)]; }
    tr.push(rb.slice()); if (tr.length > 3000) tr.shift(); hist.push(rb.slice()); if (hist.length > 60) hist.shift();
    stuck = hist.length === 60 && Math.hypot(hist[0][0] - rb[0], hist[0][1] - rb[1]) < 0.06;
    if (stuck && p.esc && kick === 0) { const a = rnd() * 2 * PI; hist.k = [Math.cos(a) * 2, Math.sin(a) * 2]; kick = 40; hist.length = 0; }
    draw(); });
  function draw() {
    o.clear(); for (let i = 0; i <= 20; i++) for (let j = 0; j <= 20; j++) { const x = i / 2, y = j / 2; if (obs.some(q => Math.hypot(q[0] - x, q[1] - y) < q[2])) continue; const [fx, fy] = F(x, y); const n = Math.hypot(fx, fy) || 1; o.line(x, y, x + fx / n * 0.3, y + fy / n * 0.3, "rgba(100,116,139,.55)", 1); }
    obs.forEach(q => { o.circ(q[0], q[1], p.r0 + q[2], null, "rgba(220,38,38,.18)", 1, [3, 4]); o.circ(q[0], q[1], q[2], "#94A3B8", C.obsD, 1); });
    o.poly(tr, C.blue, 2.5); o.dot(1, 5, 5, C.green); o.dot(GO[0], GO[1], 7, C.red); o.circ(rb[0], rb[1], 0.18, "#DBEAFE", C.ink, 2);
    const [fx, fy] = F(rb[0], rb[1]); const reached = Math.hypot(rb[0] - GO[0], rb[1] - GO[1]) < 0.15;
    out(`${reached ? "GOAL REACHED" : stuck ? "STUCK: local minimum, attraction and repulsion cancel" : "descending the potential"}    |F| = ${Math.hypot(fx, fy).toFixed(3)}    distance to goal ${Math.hypot(rb[0] - GO[0], rb[1] - GO[1]).toFixed(2)} m`);
  }
};

T.dwa = function (root) {
  const WX = 10, WY = 7; let obs = [[3, 2.2, 0.35], [4.5, 4.5, 0.4], [6, 2.8, 0.35], [7.2, 5.2, 0.35], [5.2, 1, 0.3], [8, 3.6, 0.3], [2.4, 4.6, 0.3]];
  let goal = [9, 6], rb, trail, cands = [], best = null, clickMode = "goal";
  const p = { a: 0.8, b: 0.2, g: 0.2, vmax: 1, T: 2 }; const RR = 0.25, AV = 1.0, AW = 3.0, DT = 0.1, WM = 2.5;
  const reset = () => { rb = { x: 0.8, y: 0.8, th: rad(45), v: 0, w: 0 }; trail = [[rb.x, rb.y]]; };
  reset();
  const o = Canvas(root, WX, WY, draw); const ctl = Ctl(root);
  slider(ctl, "α heading", 0, 2, 0.05, p.a, v => v.toFixed(2), v => p.a = v); slider(ctl, "β clearance", 0, 2, 0.05, p.b, v => v.toFixed(2), v => p.b = v); slider(ctl, "γ velocity", 0, 2, 0.05, p.g, v => v.toFixed(2), v => p.g = v);
  slider(ctl, "v max", 0.2, 1.5, 0.1, p.vmax, v => v.toFixed(1) + " m/s", v => p.vmax = v); slider(ctl, "Prediction time", 0.5, 4, 0.25, p.T, v => v.toFixed(2) + " s", v => p.T = v);
  sel(ctl, "Click places", [["goal", "goal"], ["obs", "obstacle"]], v => clickMode = v);
  const lp = Loop(root, step); btn(ctl, "Restart", () => reset(), true); btn(ctl, "Pause", b => { lp.run = !lp.run; b.textContent = lp.run ? "Pause" : "Play"; });
  const out = Readout(root); Hint(root, "Grey arcs: admissible candidates from the dynamic window. Red: would collide or cannot stop in time. Green: the best-scoring arc, executed for one 0.1 s cycle.");
  o.cv.addEventListener("click", e => { const [x, y] = o.ptr(e); if (clickMode === "goal") goal = [x, y]; else obs.push([x, y, 0.3]); });
  const clr = (x, y) => { let m = 9; for (const q of obs) m = Math.min(m, Math.hypot(x - q[0], y - q[1]) - q[2] - RR); m = Math.min(m, x - RR, y - RR, WX - x - RR, WY - y - RR); return m; };
  let tacc = 0;
  function step(dt) {
    tacc += dt; if (tacc < DT) return; tacc = 0;
    if (Math.hypot(rb.x - goal[0], rb.y - goal[1]) < 0.25) { rb.v = 0; rb.w = 0; draw(); return; }
    const vs = [Math.max(0, rb.v - AV * DT), Math.min(p.vmax, rb.v + AV * DT)], ws = [Math.max(-WM, rb.w - AW * DT), Math.min(WM, rb.w + AW * DT)];
    cands = [];
    for (let i = 0; i <= 8; i++) for (let j = 0; j <= 14; j++) { const v = vs[0] + (vs[1] - vs[0]) * i / 8, w = ws[0] + (ws[1] - ws[0]) * j / 14;
      let x = rb.x, y = rb.y, th = rb.th, mc = 9; const pts = [[x, y]]; for (let t = 0; t < p.T; t += DT) { x += v * Math.cos(th) * DT; y += v * Math.sin(th) * DT; th += w * DT; pts.push([x, y]); mc = Math.min(mc, clr(x, y)); if (mc < 0) break; }
      const ok = mc > 0 && v <= Math.sqrt(2 * Math.max(0, mc) * AV) + 1e-9;
      const hd = PI - Math.abs(wrap(Math.atan2(goal[1] - y, goal[0] - x) - th));
      cands.push({ v, w, pts, ok, hd, dist: Math.min(mc, 2), vel: v }); }
    const okc = cands.filter(c => c.ok); best = null;
    if (okc.length) { const nm = k => { const m = Math.max(...okc.map(c => c[k])) || 1; return c => c[k] / m; }; const H = nm("hd"), Dn = nm("dist"), Vn = nm("vel");
      let bs = -1; okc.forEach(c => { const s = p.a * H(c) + p.b * Dn(c) + p.g * Vn(c); c.s = s; if (s > bs) { bs = s; best = c; } }); }
    if (best) { rb.v = best.v; rb.w = best.w; } else { rb.v = Math.max(0, rb.v - AV * DT); rb.w = 0; }
    rb.x += rb.v * Math.cos(rb.th) * DT; rb.y += rb.v * Math.sin(rb.th) * DT; rb.th = wrap(rb.th + rb.w * DT); trail.push([rb.x, rb.y]); draw();
  }
  function draw() {
    o.clear(); o.grid(1); obs.forEach(q => { o.circ(q[0], q[1], q[2] + RR, null, "rgba(220,38,38,.25)", 1, [3, 3]); o.circ(q[0], q[1], q[2], "#94A3B8", C.obsD, 1); });
    cands.forEach(c => o.poly(c.pts, c.ok ? "rgba(100,116,139,.35)" : "rgba(220,38,38,.35)", 1)); if (best) o.poly(best.pts, C.green, 3);
    o.poly(trail, C.blue, 2); o.ctx.fillStyle = C.red; o.ctx.font = "22px sans-serif"; o.ctx.textAlign = "center"; o.ctx.fillText("\u2605", o.X(goal[0]), o.Y(goal[1]) + 7);
    o.robot(rb.x, rb.y, rb.th, RR, C.ink, "#DBEAFE");
    out(`v = ${rb.v.toFixed(2)} m/s   ω = ${rb.w.toFixed(2)} rad/s   candidates: ${cands.length}, admissible: ${cands.filter(c => c.ok).length}   clearance ${clr(rb.x, rb.y).toFixed(2)} m   ${Math.hypot(rb.x - goal[0], rb.y - goal[1]) < 0.25 ? "GOAL REACHED" : best ? "" : "no admissible command: braking"}`);
  }
};

T.costmap = function (root) {
  const NX = 44, NY = 26, R = 0.05; const g = new Uint8Array(NX * NY); const p = { ri: 0.2, rf: 0.6, k: 5 }; let hover = null;
  for (let x = 0; x < NX; x++) { if (x < 16 || x > 23) g[13 * NX + x] = 1; } for (let y = 0; y < 6; y++) g[y * NX + 34] = 1; g[20 * NX + 8] = g[20 * NX + 9] = g[21 * NX + 8] = g[21 * NX + 9] = 1;
  const o = Canvas(root, NX, NY, draw); const ctl = Ctl(root);
  slider(ctl, "Inscribed radius", 0.1, 0.5, 0.05, p.ri, v => v.toFixed(2) + " m", v => { p.ri = v; draw(); });
  slider(ctl, "Inflation radius", 0.1, 1.5, 0.05, p.rf, v => v.toFixed(2) + " m", v => { p.rf = v; draw(); });
  slider(ctl, "cost_scaling_factor", 0.5, 20, 0.5, p.k, v => v.toFixed(1), v => { p.k = v; draw(); });
  const out = Readout(root); Hint(root, "Grid 5 cm. Click to add or remove obstacle cells; hover to read a cell's cost. The doorway is 40 cm wide.");
  o.cv.addEventListener("click", e => { const [x, y] = o.ptr(e); const i = Math.floor(x), j = Math.floor(NY - y); if (i >= 0 && j >= 0 && i < NX && j < NY) { g[j * NX + i] ^= 1; draw(); } });
  o.cv.addEventListener("pointermove", e => { const [x, y] = o.ptr(e); hover = [Math.floor(x), Math.floor(NY - y)]; draw(); });
  let cost = new Float32Array(NX * NY);
  function compute() { const obsC = []; for (let i = 0; i < NX * NY; i++) if (g[i]) obsC.push([i % NX, (i / NX) | 0]);
    for (let j = 0; j < NY; j++) for (let i = 0; i < NX; i++) { let d = 1e9; for (const q of obsC) { const dd = (q[0] - i) ** 2 + (q[1] - j) ** 2; if (dd < d) d = dd; } d = Math.sqrt(d) * R;
      cost[j * NX + i] = d === 0 ? 254 : d <= p.ri ? 253 : d <= p.rf ? 252 * Math.exp(-p.k * (d - p.ri)) : 0; } }
  function draw() {
    compute(); o.clear("#fff");
    for (let j = 0; j < NY; j++) for (let i = 0; i < NX; i++) { const c = cost[j * NX + i]; let col;
      if (c === 254) col = "#0F172A"; else if (c === 253) col = "#7C3AED"; else if (c > 0) { const t = c / 252; col = `rgb(${255},${Math.round(255 - 150 * t)},${Math.round(255 - 230 * t)})`; } else col = "#fff";
      o.rect(i, NY - 1 - j, 1, 1, col); }
    o.grid(1);
    if (hover && hover[0] >= 0 && hover[1] >= 0 && hover[0] < NX && hover[1] < NY) { o.rect(hover[0], NY - 1 - hover[1], 1, 1, null, C.blue); }
    let min = 999; for (let i = 16; i <= 23; i++) min = Math.min(min, cost[13 * NX + i]);
    const hc = hover && hover[0] >= 0 && hover[1] >= 0 && hover[0] < NX && hover[1] < NY ? cost[hover[1] * NX + hover[0]] : null;
    out(`lowest cost through the doorway: ${Math.round(min)} ${min >= 253 ? "(blocked: robot cannot pass)" : min > 128 ? "(passable but expensive: planners avoid it)" : "(open)"}${hc !== null ? `    cell under cursor: ${Math.round(hc)}` : ""}\nblack 254 lethal, purple 253 inscribed, orange gradient inflated, white free`);
  }
};

// =============== Chapter 6 ===============
T.subsumption = function (root) {
  const WX = 10, WY = 6; const sc = scene(WX, WY, [[2.5, 1.5, 1, 2.5], [6, 3.4, 2.4, 0.5], [6.5, 0.8, 0.5, 1.4], [4.5, 4.6, 0.5, 1.4]], []); sc.wx = WX; sc.wy = WY;
  const p = { L0: true, L1: true, L2: false }; let rb, goal = [8.8, 5], trail, active = "", wt = 0, wh = 0, bumps = 0;
  const reset = () => { rb = { x: 1, y: 1, th: 0.3 }; trail = []; bumps = 0; };
  reset();
  const o = Canvas(root, WX, WY, draw); const ctl = Ctl(root);
  chk(ctl, " Level 0: avoid", true, v => p.L0 = v); chk(ctl, " Level 1: wander", true, v => p.L1 = v); chk(ctl, " Level 2: go to goal", false, v => p.L2 = v);
  btn(ctl, "Reset", () => reset(), true);
  const out = Readout(root); Hint(root, "Click to move the goal. Switch layers on and off: each works on its own, and higher-priority outputs suppress lower ones. Level 0 (avoid) always wins when an obstacle is close.");
  o.cv.addEventListener("click", e => { goal = o.ptr(e); });
  const COL = { avoid: C.red, wander: C.amber, goal: C.blue, stop: C.muted };
  Loop(root, dt => {
    const rays = [-60, -35, -15, 0, 15, 35, 60].map(a => [a, cast(sc, rb.x, rb.y, rb.th + rad(a), 5)[0]]);
    const front = Math.min(...rays.filter(r => Math.abs(r[0]) <= 35).map(r => r[1]));
    let v = 0, w = 0;
    if (p.L0 && front < 0.7) { active = "avoid"; const l = rays.filter(r => r[0] > 0).reduce((a, r) => a + r[1], 0), rr = rays.filter(r => r[0] < 0).reduce((a, r) => a + r[1], 0); v = front < 0.35 ? 0 : 0.15; w = (l > rr ? 1 : -1) * 2.2; }
    else if (p.L2) { active = "goal"; const e = wrap(Math.atan2(goal[1] - rb.y, goal[0] - rb.x) - rb.th); const d = Math.hypot(goal[0] - rb.x, goal[1] - rb.y); v = d < 0.2 ? 0 : 0.7 * Math.max(0, Math.cos(e)); w = 2.5 * e; if (d < 0.2) active = "stop"; }
    else if (p.L1) { active = "wander"; wt -= dt; if (wt <= 0) { wt = 1 + 2 * rnd(); wh = (rnd() - 0.5) * 2.4; } v = 0.6; w = wh; }
    else { active = "stop"; }
    const nx = rb.x + v * Math.cos(rb.th) * dt, ny = rb.y + v * Math.sin(rb.th) * dt;
    if (inside(sc, nx, ny, 0.2)) { bumps++; rb.th = wrap(rb.th + PI * 0.6); } else { rb.x = nx; rb.y = ny; } rb.th = wrap(rb.th + w * dt);
    trail.push([rb.x, rb.y, active]); if (trail.length > 700) trail.shift(); o.rays = rays; draw(); });
  function draw() {
    o.clear(); o.grid(1); drawScene(o, sc);
    for (let i = 1; i < trail.length; i++) o.line(trail[i - 1][0], trail[i - 1][1], trail[i][0], trail[i][1], COL[trail[i][2]], 2);
    if (o.rays) o.rays.forEach(([a, d]) => { const t = rb.th + rad(a); d = Math.min(d, 1.2); o.line(rb.x, rb.y, rb.x + d * Math.cos(t), rb.y + d * Math.sin(t), "rgba(13,138,127,.35)", 1); });
    if (p.L2) { o.ctx.fillStyle = C.blue; o.ctx.font = "22px sans-serif"; o.ctx.textAlign = "center"; o.ctx.fillText("\u2605", o.X(goal[0]), o.Y(goal[1]) + 7); }
    o.robot(rb.x, rb.y, rb.th, 0.2, COL[active] || C.ink, "#fff");
    out(`active behaviour: ${{ avoid: "Level 0 AVOID (suppresses the others)", wander: "Level 1 WANDER", goal: "Level 2 GO TO GOAL", stop: "none (stopped)" }[active] || ""}    collisions: ${bumps}\ntrail colour: red avoid, amber wander, blue goal`);
  }
};

T.mission = function (root) {
  const P = { S: [1, 1], A: [2.5, 5], B: [6, 5.2], C: [9, 4], CH: [9, 0.8], WB: [6, 3.6], DET: [4.2, 2.6] };
  let rb, q, log, t, cur, flags, batt, wait, route, done;
  const plan0 = () => [["nav", "S"], ["load", "S"], ["nav", "A"], ["drop", "A"], ["nav", "B"], ["drop", "B"], ["nav", "C"], ["drop", "C"], ["nav", "S"], ["end", "S"]];
  const reset = () => { rb = P.S.slice(); q = plan0(); log = []; t = 0; cur = null; flags = {}; batt = 62; wait = 0; route = []; done = false; L("Mission received: load at S, drop at A, B, C, return to S"); };
  const L = m => { log.push(`[${t.toFixed(1).padStart(5)} s] ${m}`); if (log.length > 9) log.shift(); };
  reset();
  const o = Canvas(root, 10, 6.2, draw); const ctl = Ctl(root);
  btn(ctl, "Block the path", () => { flags.block = true; L("EVENT: obstacle blocks the corridor ahead"); });
  btn(ctl, "Station B occupied", () => { flags.bOcc = true; L("EVENT: station B reports occupied"); });
  btn(ctl, "Battery drops to 15 %", () => { batt = 15; L("EVENT: BMS state of charge 15 %"); });
  btn(ctl, "Load not confirmed", () => { flags.noLoad = true; L("EVENT: next load/unload signal will time out"); });
  btn(ctl, "Restart mission", () => reset(), true);
  const out = Readout(root);
  function next() { if (!q.length) { done = true; return; } cur = q.shift(); cur.t0 = t; cur.tries = cur.tries || 0;
    if (cur[0] === "nav") { route = [P[cur[1]]]; if (flags.block && cur[1] !== "CH") { flags.block = false; route = [P.DET, P[cur[1]]]; L(`Controller: no admissible path; global replan via detour to ${cur[1]}`); } else L(`Navigate to ${cur[1] === "CH" ? "charger" : cur[1] === "WB" ? "waiting point near B" : cur[1]}`);
      if (cur[1] === "B" && flags.bOcc) { route = [P.WB]; L("B occupied: fallback → go to waiting point, try C first"); const i = q.findIndex(x => x[0] === "drop" && x[1] === "B"); const dB = q.splice(i, 1)[0]; const iC = q.findIndex(x => x[0] === "drop" && x[1] === "C"); q.splice(iC + 1, 0, ["nav", "B"], dB); flags.bOcc = false; flags.bLater = true; cur = ["nav", "WB"]; cur.t0 = t; } }
    else if (cur[0] === "end") { L("Mission complete; report to fleet manager and release robot"); done = true; } }
  Loop(root, dt => {
    if (done) { draw(); return; } t += dt; batt = Math.max(0, batt - dt * 0.15);
    if (!cur) next();
    if (!cur) return;
    if (cur[0] === "nav") { const g = route[0]; const dx = g[0] - rb[0], dy = g[1] - rb[1], d = Math.hypot(dx, dy);
      if (d < 0.05) { route.shift(); if (!route.length) { if (cur[1] === "WB") { L("Waiting at WB; continuing with the next drop"); } if (cur[1] === "CH") { cur = ["charge", "CH"]; cur.t0 = t; L("Docked: charging"); } else cur = null; } }
      else { const s = Math.min(d, 1.4 * dt); rb[0] += dx / d * s; rb[1] += dy / d * s; } }
    else if (cur[0] === "load" || cur[0] === "drop") { if (t - cur.t0 > 1.2) { if (flags.noLoad) { cur.tries++; L(`${cur[0] === "load" ? "Load" : "Unload"} at ${cur[1]} not confirmed (try ${cur.tries}/2)`); cur.t0 = t; if (cur.tries >= 2) { flags.noLoad = false; L(`Retry limit reached: skip ${cur[1]}, alert operator`); cur = null; } }
        else { L(`${cur[0] === "load" ? "Loaded" : "Dropped"} at ${cur[1]}`); cur = null;
          if (batt < 20) { L("Battery below 20 %: insert charging task after this step"); q.unshift(["nav", "CH"]); } } } }
    else if (cur[0] === "charge") { batt = Math.min(100, batt + dt * 25); if (batt >= 80) { L("Charged to 80 %: resume mission"); cur = null; } }
    draw(); });
  function draw() {
    o.clear(); o.grid(1); o.rect(3.6, 3.2, 1.2, 2.8, "#E2E8F0", C.muted); o.rect(7, 1.6, 1, 1.8, "#E2E8F0", C.muted);
    Object.entries(P).forEach(([k, v]) => { if (k === "DET") return; o.rect(v[0] - 0.3, v[1] - 0.3, 0.6, 0.6, k === "CH" ? "#DCFCE7" : k === "WB" ? "#FEF3C7" : "#DBEAFE", C.ink2); o.text(k === "WB" ? "wait" : k === "CH" ? "charger" : k, v[0], v[1] - 0.5, C.ink2, 12, "center", true); });
    if (route.length) o.poly([rb].concat(route), C.blue, 1.5, [5, 4]);
    o.robot(rb[0], rb[1], route.length ? Math.atan2(route[0][1] - rb[1], route[0][0] - rb[0]) : 0, 0.22, C.ink, batt < 20 ? "#FEE2E2" : "#fff");
    o.rect(0.2, 5.75, 1.6, 0.25, "#fff", C.ink2); o.rect(0.2, 5.75, 1.6 * batt / 100, 0.25, batt < 20 ? C.red : C.green); o.text(`battery ${batt.toFixed(0)} %`, 2, 5.87, C.ink2, 11);
    const st = done ? "DONE" : cur ? `${cur[0].toUpperCase()} ${cur[1]}` : "…";
    out(`executive state: ${st}    remaining steps: ${q.map(x => x[0] + ":" + x[1]).join(" → ") || "none"}\n` + log.join("\n"));
  }
};

T.fleet = function (root) {
  const p = { res: false, n: 3 }; let R, t, trips, dead, events;
  const A0 = 3, A1 = 7; // one-lane aisle between x = 3 and x = 7
  const reset = () => { R = []; for (let i = 0; i < p.n; i++) R.push({ x: i % 2 ? 9.5 - i * 0.3 : 0.5 + i * 0.3, dir: i % 2 ? -1 : 1, lane: i % 2 ? 1 : 0, wait: false, col: [C.blue, C.amber, C.teal, C.purple][i], pause: i * 0.7 }); t = 0; trips = 0; dead = false; events = ""; };
  reset();
  const o = Canvas(root, 10, 4, draw); const ctl = Ctl(root);
  chk(ctl, " zone reservation for the aisle", false, v => { p.res = v; reset(); });
  slider(ctl, "Robots", 2, 4, 1, p.n, v => v, v => { p.n = v; reset(); });
  btn(ctl, "Restart", () => reset(), true);
  const out = Readout(root); Hint(root, "Robots shuttle between the left and right docks. Outside the aisle there are two lanes; inside it there is only one. Turn zone reservation on to see a robot wait at the aisle entry instead of meeting another head-on.");
  const inA = x => x > A0 && x < A1;
  Loop(root, dt => {
    if (dead) { draw(); return; } t += dt;
    for (const r of R) { if (r.pause > 0) { r.pause -= dt; continue; }
      let nx = r.x + r.dir * 1.2 * dt; r.wait = false;
      const entering = !inA(r.x) && inA(nx);
      if (entering && p.res) { const other = R.some(q => q !== r && inA(q.x)); if (other) { r.wait = true; continue; } }
      const ahead = R.filter(q => q !== r && inA(q.x) && inA(nx) && Math.sign(q.x - r.x) === r.dir && Math.abs(q.x - r.x) < 0.8);
      if (ahead.some(q => q.dir !== r.dir)) { r.wait = true; r.block = true; continue; }
      if (ahead.some(q => q.dir === r.dir)) { r.wait = true; continue; }
      r.block = false; r.x = nx;
      if (r.x > 9.6) { r.x = 9.6; r.dir = -1; r.lane = 1; r.pause = 0.6; trips++; } if (r.x < 0.4) { r.x = 0.4; r.dir = 1; r.lane = 0; r.pause = 0.6; trips++; } }
    const blocked = R.filter(r => r.block); if (blocked.length >= 2 && blocked.some(a => blocked.some(b => b !== a && b.dir !== a.dir))) { dead = true; events = "DEADLOCK: two robots face each other inside the one-lane aisle. Neither can move until one backs out."; }
    draw(); });
  function draw() {
    o.clear("#fff"); o.rect(0, 0.4, 10, 0.3, "#94A3B8"); o.rect(0, 3.3, 10, 0.3, "#94A3B8"); o.rect(A0, 2.35, A1 - A0, 0.95, "#94A3B8"); o.rect(A0, 0.7, A1 - A0, 0.95, "#94A3B8");
    if (p.res) o.rect(A0, 1.65, A1 - A0, 0.7, R.some(r => inA(r.x)) ? "rgba(21,128,61,.18)" : "rgba(21,128,61,.07)", C.green);
    o.text("one-lane aisle", 5, 2.0, C.muted, 12, "center"); o.text("dock L", 0.5, 3.0, C.muted, 11, "center"); o.text("dock R", 9.5, 3.0, C.muted, 11, "center");
    for (const r of R) { const y = inA(r.x) ? 2 : r.lane ? 2.7 : 1.3; o.robot(r.x, y, r.dir > 0 ? 0 : PI, 0.22, r.col, r.wait ? "#FEF3C7" : "#fff"); }
    out(`time ${t.toFixed(1)} s    completed trips: ${trips}    throughput ${(trips / Math.max(t, 1) * 60).toFixed(1)} trips/min\n${events || (p.res ? "Zone reservation: a robot may enter only when the aisle is free." : "No coordination: robots only avoid what is directly ahead.")}`);
  }
};

T.safety = function (root) {
  const p = { v: 1.2, tr: 0.12, tb: 0.2, a: 0.8, c: 0.1 }; let person = [3.2, 0.2];
  const o = Canvas(root, 10, 4.4, draw); const ctl = Ctl(root);
  const S = (k, lab, a, b, st, f) => slider(ctl, lab, a, b, st, p[k], f, v => { p[k] = v; draw(); });
  S("v", "Speed v", 0, 2, 0.05, v => v.toFixed(2) + " m/s"); S("tr", "Response time", 0.02, 0.3, 0.01, v => v.toFixed(2) + " s"); S("tb", "Brake onset", 0.05, 0.5, 0.01, v => v.toFixed(2) + " s");
  S("a", "Deceleration", 0.3, 2, 0.05, v => v.toFixed(2) + " m/s²"); S("c", "Allowance C", 0, 0.3, 0.01, v => v.toFixed(2) + " m");
  const out = Readout(root); Hint(root, "Drag the person (orange). Warning field shown as 1.5 × protective field + 0.5 m.");
  let drag = false;
  o.cv.addEventListener("pointerdown", e => { const [x, y] = o.ptr(e); if (Math.hypot(x - person[0], y - person[1]) < 0.4) { drag = true; o.cv.setPointerCapture(e.pointerId); } });
  o.cv.addEventListener("pointermove", e => { if (drag) { person = o.ptr(e); person[0] = clamp(person[0], 1, 9.8); person[1] = clamp(person[1], -1.6, 1.6); draw(); } });
  o.cv.addEventListener("pointerup", () => drag = false);
  const Sf = v => v * (p.tr + p.tb) + v * v / (2 * p.a) + p.c;
  function draw() {
    o.clear("#fff"); const yc = 2.2; const s = Sf(p.v), wf = 1.5 * s + 0.5, front = 1.2;
    o.ctx.save(); const poly = (L, wid, fill, st) => { const c = o.ctx; c.beginPath(); c.moveTo(o.X(front), o.Y(yc - 0.55)); c.lineTo(o.X(front + L), o.Y(yc - wid)); c.lineTo(o.X(front + L), o.Y(yc + wid)); c.lineTo(o.X(front), o.Y(yc + 0.55)); c.closePath(); c.fillStyle = fill; c.fill(); c.strokeStyle = st; c.lineWidth = 1.5; c.stroke(); };
    poly(wf, 0.9, "rgba(217,119,6,.18)", C.amber); poly(s, 0.65, "rgba(220,38,38,.25)", C.red); o.ctx.restore();
    o.rect(0.2, yc - 0.55, 1, 1.1, "#CBD5E1", C.ink); o.text("AMR", 0.7, yc, C.ink, 12, "center", true);
    const px = person[0], py = yc + person[1]; const d = px - front; const inP = d > 0 && d < s && Math.abs(person[1]) < 0.65, inW = d > 0 && d < wf && Math.abs(person[1]) < 0.9;
    o.circ(px, py, 0.18, C.amber, C.ink, 1.5);
    o.line(front, 0.5, front + s, 0.5, C.red, 2); o.text(`S = ${s.toFixed(2)} m`, front + s / 2, 0.25, C.red, 12, "center", true);
    const st = inP ? "PROTECTIVE STOP" : inW ? "WARNING: slow down" : "clear: full speed";
    o.text(st, 7.8, 4.05, inP ? C.red : inW ? C.amber : C.green, 16, "center", true);
    out(`S = v(t_r + t_b0) + v²/2a + C = ${p.v.toFixed(2)}×${(p.tr + p.tb).toFixed(2)} + ${(p.v * p.v / (2 * p.a)).toFixed(2)} + ${p.c.toFixed(2)} = ${s.toFixed(2)} m\nreaction part ${(p.v * (p.tr + p.tb)).toFixed(2)} m, braking part ${(p.v * p.v / (2 * p.a)).toFixed(2)} m    at 0.5 m/s: ${Sf(0.5).toFixed(2)} m, at 1.0: ${Sf(1).toFixed(2)} m, at 1.5: ${Sf(1.5).toFixed(2)} m`);
  }
};
})();

(function () {
"use strict";
const T = window.CourseTools;
const { C, Canvas, Ctl, slider, btn, sel, chk, Readout, Hint, Loop, gauss, clamp, wrap, rad, deg, PI } = T._;
const Npdf = (x, m, s) => Math.exp(-0.5 * ((x - m) / s) ** 2) / (s * Math.sqrt(2 * PI));

/* ---------- Chapter 1: go-to-goal feedback inverse kinematics ---------- */
T.gotogoal = function (root) {
  const p = { kr: 0.6, ka: 1.8, kb: -0.5, th0: 90 }; let st, trail;
  const o = Canvas(root, 10, 6, draw); const ctl = Ctl(root);
  const reset = () => { st = { x: 1.2, y: 1.2, th: rad(p.th0) }; trail = [[st.x, st.y]]; };
  slider(ctl, "k_rho", 0.1, 2, 0.05, p.kr, v => v.toFixed(2), v => p.kr = v);
  slider(ctl, "k_alpha", 0.2, 5, 0.1, p.ka, v => v.toFixed(1), v => p.ka = v);
  slider(ctl, "k_beta", -3, 0.5, 0.05, p.kb, v => v.toFixed(2), v => p.kb = v);
  slider(ctl, "Start heading", -180, 180, 15, p.th0, v => v + "°", v => { p.th0 = v; reset(); });
  btn(ctl, "Restart", reset, true);
  const out = Readout(root);
  Hint(root, "Goal: (8, 4) facing +x. Stability needs k_rho > 0, k_beta < 0 and k_alpha > k_rho. Set k_beta > 0 and watch the final heading go wrong.");
  const G = { x: 8, y: 4, th: 0 }; let rho = 0, al = 0, be = 0, v = 0, w = 0;
  reset();
  Loop(root, dt => {
    dt = Math.min(dt, 0.05);
    for (let k = 0; k < 2; k++) {
      const dx = G.x - st.x, dy = G.y - st.y; rho = Math.hypot(dx, dy);
      al = wrap(Math.atan2(dy, dx) - st.th); be = wrap(G.th - st.th - al);
      if (rho < 0.02) { v = 0; w = 0; break; }
      v = clamp(p.kr * rho, -1.2, 1.2); w = clamp(p.ka * al + p.kb * be, -3, 3);
      st.x += v * Math.cos(st.th) * dt / 2; st.y += v * Math.sin(st.th) * dt / 2; st.th = wrap(st.th + w * dt / 2);
    }
    trail.push([st.x, st.y]); if (trail.length > 3000) trail.shift(); draw();
  });
  function draw() {
    if (!st) return; o.clear(); o.grid(1);
    o.poly(trail, C.blue, 2); o.robot(G.x, G.y, G.th, 0.25, C.green, "#DCFCE7");
    o.robot(st.x, st.y, st.th, 0.25, C.blue, "#DBEAFE");
    out(`rho = ${rho.toFixed(2)} m   alpha = ${deg(al).toFixed(1)}°   beta = ${deg(be).toFixed(1)}°   v = ${v.toFixed(2)} m/s   omega = ${w.toFixed(2)} rad/s`);
  }
};

/* ---------- Chapter 2: error propagation of dead reckoning ---------- */
T.errprop = function (root) {
  const p = { sv: 0.02, sw: 2, w: 0.02, steps: 15 };
  const o = Canvas(root, 10, 6, draw); const ctl = Ctl(root);
  slider(ctl, "σ speed", 0, 0.1, 0.005, p.sv, v => v.toFixed(3) + " m/s", v => { p.sv = v; draw(); });
  slider(ctl, "σ turn rate", 0, 8, 0.5, p.sw, v => v.toFixed(1) + " °/s", v => { p.sw = v; draw(); });
  slider(ctl, "Turn rate ω", -0.3, 0.3, 0.02, p.w, v => v.toFixed(2) + " rad/s", v => { p.w = v; draw(); });
  slider(ctl, "Time steps (1 s)", 1, 25, 1, p.steps, v => v, v => { p.steps = v; draw(); });
  const out = Readout(root);
  Hint(root, "Σ' = G Σ Gᵀ + V M Vᵀ each second at v = 0.5 m/s. Heading noise alone makes the ellipse grow sideways much faster than along the path.");
  function draw() {
    o.clear(); o.grid(1);
    let x = 0.5, y = 2.2, th = 0; let S = [0, 0, 0, 0, 0, 0, 0, 0, 0]; const v = 0.5, sw = rad(p.sw);
    const m = (A, B) => { const R = new Array(9).fill(0); for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) for (let k = 0; k < 3; k++) R[3 * i + j] += A[3 * i + k] * B[3 * k + j]; return R; };
    const tr = A => [A[0], A[3], A[6], A[1], A[4], A[7], A[2], A[5], A[8]];
    const path = [[x, y]];
    for (let k = 0; k < p.steps; k++) {
      const G = [1, 0, -v * Math.sin(th), 0, 1, v * Math.cos(th), 0, 0, 1];
      S = m(m(G, S), tr(G));
      const c = Math.cos(th), s = Math.sin(th), a = p.sv * p.sv, b = sw * sw;
      S[0] += c * c * a; S[1] += c * s * a; S[3] += c * s * a; S[4] += s * s * a; S[8] += b;
      x += v * c; y += v * s; th += p.w; path.push([x, y]);
      o.ellipse(x, y, [S[0], S[1], S[3], S[4]], 2, C.blue);
    }
    o.poly(path, C.ink, 1.5, [5, 4]); o.robot(x, y, th, 0.18, C.navy || C.blue, "#DBEAFE");
    out(`after ${p.steps} s: σx = ${Math.sqrt(S[0]).toFixed(3)} m   σy = ${Math.sqrt(S[4]).toFixed(3)} m   σθ = ${deg(Math.sqrt(S[8])).toFixed(1)}°`);
  }
  draw();
};

/* ---------- Chapter 3: door Bayes filter ---------- */
T.doorbayes = function (root) {
  const p = { zo: 0.6, zc: 0.2, push: 0.8 }; let bel = [0.5, 0.5], hist = [];
  const o = Canvas(root, 10, 5, draw); const ctl = Ctl(root);
  slider(ctl, "p(sense open | open)", 0.5, 0.99, 0.01, p.zo, v => v.toFixed(2), v => p.zo = v);
  slider(ctl, "p(sense open | closed)", 0.01, 0.5, 0.01, p.zc, v => v.toFixed(2), v => p.zc = v);
  slider(ctl, "p(push opens closed door)", 0, 1, 0.05, p.push, v => v.toFixed(2), v => p.push = v);
  const pred = u => { if (u === "push") bel = [bel[0] + p.push * bel[1], (1 - p.push) * bel[1]]; hist.push("u=" + u); };
  const corr = z => { const a = (z ? p.zo : 1 - p.zo) * bel[0], b = (z ? p.zc : 1 - p.zc) * bel[1]; bel = [a / (a + b), b / (a + b)]; hist.push("z=" + (z ? "open" : "closed")); draw(); };
  btn(ctl, "Do nothing", () => { pred("nothing"); draw(); }); btn(ctl, "Push", () => { pred("push"); draw(); });
  btn(ctl, "Sense open", () => corr(1), true); btn(ctl, "Sense closed", () => corr(0));
  btn(ctl, "Reset", () => { bel = [0.5, 0.5]; hist = []; draw(); });
  const out = Readout(root);
  Hint(root, "Reproduce the textbook: Do nothing, Sense open (0.75), Push, Sense open (0.983). Then try Sense closed repeatedly.");
  function draw() {
    o.clear();
    [["open", bel[0], C.blue], ["closed", bel[1], C.amber]].forEach(([n, b, c], i) => {
      const x = 2 + i * 4; o.rect(x, 0.6, 2, 3.8 * b, c); o.rect(x, 0.6, 2, 3.8, null, C.muted);
      o.text(n, x + 1, 0.2, C.ink, 13, "center", true); o.text(b.toFixed(3), x + 1, 0.8 + 3.8 * b, C.ink, 13, "center");
    });
    out(`bel(open) = ${bel[0].toFixed(4)}   bel(closed) = ${bel[1].toFixed(4)}   history: ${hist.slice(-8).join(", ") || "none"}`);
  }
  draw();
};

/* ---------- Chapter 3: 1D Kalman filter ---------- */
T.kf1d = function (root) {
  const p = { R: 0.3, Q: 1.0, v: 1.0 }; let t = 0, x = 0, mu = 0, s2 = 4, lastZ = null, hist = [], acc = 0;
  const o = Canvas(root, 12, 6, draw); const ctl = Ctl(root);
  slider(ctl, "Process noise σ_R", 0.05, 2, 0.05, p.R, v => v.toFixed(2) + " m", v => p.R = v);
  slider(ctl, "Measurement noise σ_Q", 0.1, 3, 0.1, p.Q, v => v.toFixed(1) + " m", v => p.Q = v);
  btn(ctl, "Reset", () => { t = 0; x = 0; mu = 0; s2 = 4; hist = []; lastZ = null; }, true);
  const out = Readout(root); let K = 0;
  Hint(root, "A cart moves at 1 m/s on a 12 m track; a noisy position sensor fires every second. Raise σ_Q: the gain K falls and the filter trusts its prediction more.");
  Loop(root, dt => {
    acc += dt; if (acc < 0.6) { draw(); return; } acc = 0;
    x += p.v + p.R * gauss(); mu += p.v; s2 += p.R * p.R;
    const z = x + p.Q * gauss(); K = s2 / (s2 + p.Q * p.Q); mu += K * (z - mu); s2 = (1 - K) * s2; lastZ = z;
    if (x > 11.5) { x = 0.5; mu = 0.5; s2 = 1; hist = []; }
    hist.push([x, mu, z]); if (hist.length > 30) hist.shift(); draw();
  });
  function draw() {
    o.clear(); o.grid(1); o.line(0, 1, 12, 1, C.muted, 2);
    const s = Math.sqrt(s2), pts = [], pz = [];
    for (let i = 0; i <= 240; i++) { const xx = i * 0.05; pts.push([xx, 1 + Math.min(4.3, 4 * Npdf(xx, mu, s))]); pz.push([xx, 1 + Math.min(4.3, 4 * Npdf(xx, lastZ ?? -99, p.Q))]); }
    if (lastZ !== null) o.poly(pz, C.amber, 1.5, [5, 4]);
    o.poly(pts, C.blue, 2.5); o.rect(x - 0.3, 0.6, 0.6, 0.4, C.ink); o.dot(mu, 1, 5, C.blue);
    if (lastZ !== null) o.dot(lastZ, 1, 5, C.amber);
    o.text("true cart", x, 0.25, C.ink, 11, "center"); o.text("belief N(μ, σ²)", 0.2, 5.6, C.blue, 12, "left", true); o.text("measurement likelihood", 0.2, 5.2, C.amber, 12, "left", true);
    out(`true x = ${x.toFixed(2)} m   μ = ${mu.toFixed(2)} m   σ = ${s.toFixed(2)} m   K = ${K.toFixed(3)}   error = ${(mu - x).toFixed(2)} m`);
  }
};

/* ---------- Chapter 4: velocity motion model sampling ---------- */
function velSample(x, y, th, v, w, a, dt) {
  const vh = v + Math.sqrt(a[0] * v * v + a[1] * w * w) * gauss(), wh = w + Math.sqrt(a[2] * v * v + a[3] * w * w) * gauss(), gh = Math.sqrt(a[4] * v * v + a[5] * w * w) * gauss();
  if (Math.abs(wh) < 1e-6) return [x + vh * dt * Math.cos(th), y + vh * dt * Math.sin(th), th + gh * dt];
  const r = vh / wh; return [x - r * Math.sin(th) + r * Math.sin(th + wh * dt), y + r * Math.cos(th) - r * Math.cos(th + wh * dt), th + wh * dt + gh * dt];
}
T.velmodel = function (root) {
  const p = { v: 1.0, w: 0.5, a1: 0.005, a3: 0.01, a4: 0.08, n: 500 };
  const o = Canvas(root, 8, 5, draw); const ctl = Ctl(root);
  slider(ctl, "v", 0.2, 2, 0.1, p.v, v => v.toFixed(1) + " m/s", v => { p.v = v; draw(); });
  slider(ctl, "ω", -1, 1, 0.05, p.w, v => v.toFixed(2) + " rad/s", v => { p.w = v; draw(); });
  slider(ctl, "α1 (v error from v)", 0, 0.1, 0.005, p.a1, v => v.toFixed(3), v => { p.a1 = v; draw(); });
  slider(ctl, "α3 (ω error from v)", 0, 0.1, 0.005, p.a3, v => v.toFixed(3), v => { p.a3 = v; draw(); });
  slider(ctl, "α4 (ω error from ω)", 0, 0.4, 0.01, p.a4, v => v.toFixed(2), v => { p.a4 = v; draw(); });
  btn(ctl, "Resample", draw, true);
  const out = Readout(root);
  Hint(root, "Each dot is one call to sample_motion_model_velocity for dt = 2 s. Raise α4: the cloud bends into a banana because heading error grows along the arc.");
  function draw() {
    o.clear(); o.grid(1); const a = [p.a1, 0.005, p.a3, p.a4, 0.001, 0.001]; let sx = 0, sy = 0; const S = [];
    for (let i = 0; i < p.n; i++) { const s = velSample(1, 1.5, 0, p.v, p.w, a, 2); S.push(s); sx += s[0]; sy += s[1]; o.dot(s[0], s[1], 1.6, C.purple); }
    const e = velSample(1, 1.5, 0, p.v, p.w, [0, 0, 0, 0, 0, 0], 2);
    const arc = []; for (let k = 0; k <= 40; k++) { const q = velSample(1, 1.5, 0, p.v, p.w, [0, 0, 0, 0, 0, 0], 2 * k / 40); arc.push([q[0], q[1]]); }
    o.poly(arc, C.ink, 1.5, [5, 4]); o.robot(1, 1.5, 0, 0.18, C.blue, "#DBEAFE"); o.dot(e[0], e[1], 6, C.red);
    const mx = sx / p.n, my = sy / p.n; let vx = 0, vy = 0; S.forEach(s => { vx += (s[0] - mx) ** 2; vy += (s[1] - my) ** 2; });
    out(`noise-free end (${e[0].toFixed(2)}, ${e[1].toFixed(2)}) m, θ = ${deg(e[2]).toFixed(1)}°   sample mean (${mx.toFixed(2)}, ${my.toFixed(2)})   σx ${Math.sqrt(vx / p.n).toFixed(2)} m, σy ${Math.sqrt(vy / p.n).toFixed(2)} m`);
  }
  draw();
};

/* ---------- Chapter 4: odometry motion model sampling ---------- */
T.odomodel = function (root) {
  const p = { dx: 2.0, dy: 1.0, dth: 40, a1: 0.01, a2: 0.002, a3: 0.005, a4: 0.001 };
  const o = Canvas(root, 8, 5, draw); const ctl = Ctl(root);
  slider(ctl, "odometry Δx", 0.5, 4, 0.1, p.dx, v => v.toFixed(1) + " m", v => { p.dx = v; draw(); });
  slider(ctl, "odometry Δy", -1.5, 2.5, 0.1, p.dy, v => v.toFixed(1) + " m", v => { p.dy = v; draw(); });
  slider(ctl, "odometry Δθ", -90, 90, 5, p.dth, v => v + "°", v => { p.dth = v; draw(); });
  slider(ctl, "α1 (rot from rot)", 0, 0.2, 0.005, p.a1, v => v.toFixed(3), v => { p.a1 = v; draw(); });
  slider(ctl, "α3 (trans from trans)", 0, 0.1, 0.005, p.a3, v => v.toFixed(3), v => { p.a3 = v; draw(); });
  btn(ctl, "Resample", draw, true);
  const out = Readout(root);
  Hint(root, "The odometry reading is decomposed into δrot1, δtrans, δrot2; each is perturbed and recomposed from the start pose (1, 1.5, 0).");
  function draw() {
    o.clear(); o.grid(1); const x0 = 1, y0 = 1.5;
    const r1 = Math.atan2(p.dy, p.dx), tr = Math.hypot(p.dx, p.dy), r2 = rad(p.dth) - r1;
    for (let i = 0; i < 500; i++) {
      const h1 = r1 - Math.sqrt(p.a1 * r1 * r1 + p.a2 * tr * tr) * gauss();
      const ht = tr - Math.sqrt(p.a3 * tr * tr + p.a4 * (r1 * r1 + r2 * r2)) * gauss();
      o.dot(x0 + ht * Math.cos(h1), y0 + ht * Math.sin(h1), 1.6, C.purple);
    }
    o.line(x0, y0, x0 + p.dx, y0 + p.dy, C.muted, 1.5, [5, 4]);
    o.robot(x0, y0, 0, 0.18, C.blue, "#DBEAFE"); o.robot(x0 + p.dx, y0 + p.dy, rad(p.dth), 0.18, C.red, "#FEE2E2");
    out(`δrot1 = ${deg(r1).toFixed(1)}°   δtrans = ${tr.toFixed(3)} m   δrot2 = ${deg(wrap(r2)).toFixed(1)}°`);
  }
  draw();
};

/* ---------- Chapter 5: likelihood field ---------- */
T.likfield = function (root) {
  const W = 10, H = 6, res = 0.1, nx = W / res, ny = H / res; const p = { sig: 0.3, zh: 0.8, dx: 0, dy: 0, dth: 0 };
  const segs = [[0, 0, 10, 0], [10, 0, 10, 6], [10, 6, 0, 6], [0, 6, 0, 0], [3, 2, 4, 2], [4, 2, 4, 3], [4, 3, 3, 3], [3, 3, 3, 2], [6.5, 6, 6.5, 4], [7.5, 1, 9, 1], [9, 1, 9, 1.6], [9, 1.6, 7.5, 1.6], [7.5, 1.6, 7.5, 1]];
  const dseg = (x, y, s) => { const [x1, y1, x2, y2] = s, vx = x2 - x1, vy = y2 - y1; const t = clamp(((x - x1) * vx + (y - y1) * vy) / (vx * vx + vy * vy), 0, 1); return Math.hypot(x - x1 - t * vx, y - y1 - t * vy); };
  const D = new Float32Array(nx * ny); for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) { let m = 99; const x = (i + 0.5) * res, y = (j + 0.5) * res; segs.forEach(s => m = Math.min(m, dseg(x, y, s))); D[j * nx + i] = m; }
  const cast = (x, y, a) => { let best = 8; const dx = Math.cos(a), dy = Math.sin(a); segs.forEach(([x1, y1, x2, y2]) => { const ex = x2 - x1, ey = y2 - y1, den = dx * ey - dy * ex; if (Math.abs(den) < 1e-9) return; const t = ((x1 - x) * ey - (y1 - y) * ex) / den, u = ((x1 - x) * dy - (y1 - y) * dx) / den; if (t > 0 && u >= 0 && u <= 1) best = Math.min(best, t); }); return best; };
  const truth = [2, 4, rad(-20)]; const scan = []; for (let a = -120; a <= 120; a += 6) { const r = cast(truth[0], truth[1], truth[2] + rad(a)) + 0.03 * gauss(); if (r < 7.9) scan.push([rad(a), r]); }
  let img = null; const o = Canvas(root, W, H, draw); const ctl = Ctl(root);
  slider(ctl, "σ_hit", 0.05, 1, 0.05, p.sig, v => v.toFixed(2) + " m", v => { p.sig = v; draw(); });
  slider(ctl, "Pose error x", -1.5, 1.5, 0.05, p.dx, v => v.toFixed(2) + " m", v => { p.dx = v; draw(); });
  slider(ctl, "Pose error y", -1.5, 1.5, 0.05, p.dy, v => v.toFixed(2) + " m", v => { p.dy = v; draw(); });
  slider(ctl, "Pose error θ", -30, 30, 1, p.dth, v => v + "°", v => { p.dth = v; draw(); });
  const out = Readout(root);
  Hint(root, "Scan endpoints are projected from the hypothesised pose and scored by the distance to the nearest obstacle. Move the pose away from the truth and watch log p(z | x, m) fall smoothly.");
  function draw() {
    o.clear("#fff"); const ctx = o.ctx;
    if (!img || img.sig !== p.sig) { const off = document.createElement("canvas"); off.width = nx; off.height = ny; const g = off.getContext("2d"); const id = g.createImageData(nx, ny);
      for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) { const l = Math.exp(-0.5 * (D[j * nx + i] / p.sig) ** 2), k = ((ny - 1 - j) * nx + i) * 4; id.data[k] = 185; id.data[k + 1] = 28; id.data[k + 2] = 28; id.data[k + 3] = Math.round(190 * l); }
      g.putImageData(id, 0, 0); img = { off, sig: p.sig }; }
    ctx.imageSmoothingEnabled = true; ctx.drawImage(img.off, o.X(0), o.Y(H), o.S(W), o.S(H));
    segs.forEach(s => o.line(s[0], s[1], s[2], s[3], C.ink, 3));
    const px = truth[0] + p.dx, py = truth[1] + p.dy, pt = truth[2] + rad(p.dth); let ll = 0;
    scan.forEach(([a, r]) => { const ex = px + r * Math.cos(pt + a), ey = py + r * Math.sin(pt + a); const i = clamp(Math.floor(ex / res), 0, nx - 1), j = clamp(Math.floor(ey / res), 0, ny - 1); const d = (ex < 0 || ex > W || ey < 0 || ey > H) ? 3 : D[j * nx + i];
      ll += Math.log(p.zh * Npdf(d, 0, p.sig) + (1 - p.zh) / 8); o.dot(ex, ey, 4.5, C.blue, "#fff"); });
    o.robot(px, py, pt, 0.22, C.blue, "#DBEAFE");
    out(`beams = ${scan.length}   log p(z | x, m) = ${ll.toFixed(1)}   (true pose gives the maximum)`);
  }
  draw();
};
})();
