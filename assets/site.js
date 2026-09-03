/* AERA site — a few interactive things, all on-theme, all optional. */
(function () {
  "use strict";
  var reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

  /* ── status bar: card meter + live clock ──────────────────── */
  var meter = $(".meter");
  if (meter) {
    for (var i = 0; i < 16; i++) {
      var b = document.createElement("i");
      if (i >= 13) b.style.opacity = ".16";
      meter.appendChild(b);
    }
  }
  var clock = $("#clock"), dateEl = $("#date");
  var MON = ["JAN","FEB","MAR","APR","MAY","JUN","JUL","AUG","SEP","OCT","NOV","DEC"];
  (function tick() {
    var d = new Date();
    if (clock) clock.textContent =
      String(d.getHours()).padStart(2, "0") + ":" + String(d.getMinutes()).padStart(2, "0");
    if (dateEl) dateEl.textContent =
      String(d.getDate()).padStart(2, "0") + " " + MON[d.getMonth()];
    setTimeout(tick, 20000);
  })();

  /* ── power-on flicker on the wordmark, once ───────────────── */
  if (!reduce) {
    var wm = $(".wordmark");
    if (wm) requestAnimationFrame(function () { wm.classList.add("flick"); });
  }

  /* ── frame counter fills as you read (001 → 024) ──────────── */
  var fc = $(".frame-counter");
  if (fc) {
    var total = 24;
    var render = function () {
      var h = document.documentElement;
      var max = h.scrollHeight - h.clientHeight;
      var p = max > 0 ? Math.min(1, h.scrollTop / max) : 0;
      var n = Math.max(1, Math.round(p * total));
      fc.firstChild.textContent = String(n).padStart(3, "0");
    };
    render();
    addEventListener("scroll", render, { passive: true });
  }

  /* ── shutter: white flash + counter bump + a dry click ────── */
  var flash = $("#flash");
  var shutter = $(".shutter");
  var actx = null, frames = 0;
  function click() {
    try {
      actx = actx || new (window.AudioContext || window.webkitAudioContext)();
      var t = actx.currentTime;
      var o = actx.createOscillator(), g = actx.createGain();
      o.type = "square"; o.frequency.setValueAtTime(1800, t);
      o.frequency.exponentialRampToValueAtTime(220, t + 0.04);
      g.gain.setValueAtTime(0.06, t);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.06);
      o.connect(g); g.connect(actx.destination);
      o.start(t); o.stop(t + 0.07);
    } catch (e) { /* audio blocked — fine */ }
  }
  if (shutter) {
    shutter.addEventListener("click", function () {
      if (flash && !reduce) { flash.classList.remove("fire"); void flash.offsetWidth; flash.classList.add("fire"); }
      click();
      if (navigator.vibrate) navigator.vibrate(12);
      frames = Math.min(24, frames + 1);
      var lbl = shutter.querySelector("span");
      if (lbl) lbl.textContent = frames >= 24 ? "FULL" : String(frames).padStart(3, "0");
      if (frames >= 24) shutter.setAttribute("title", "Card full — that's the free tier.");
    });
  }

  /* ── spec strip: tap to reveal the detail ─────────────────── */
  $$(".spec-grid > button").forEach(function (btn) {
    btn.addEventListener("click", function () {
      var open = btn.getAttribute("aria-expanded") === "true";
      $$(".spec-grid > button").forEach(function (b) { b.setAttribute("aria-expanded", "false"); });
      btn.setAttribute("aria-expanded", open ? "false" : "true");
    });
  });

  /* ── corner brackets: a little parallax on a real pointer ─── */
  if (!reduce && matchMedia("(pointer: fine)").matches) {
    var spans = $$(".brackets span");
    if (spans.length) {
      addEventListener("pointermove", function (e) {
        var x = (e.clientX / innerWidth - 0.5) * 10;
        var y = (e.clientY / innerHeight - 0.5) * 10;
        spans.forEach(function (s, i) {
          var dir = (i === 0 || i === 2) ? -1 : 1;
          var dirY = (i < 2) ? -1 : 1;
          s.style.transform = "translate(" + (x * dir * 0.4) + "px," + (y * dirY * 0.4) + "px)";
        });
      }, { passive: true });
    }
  }

  /* ── keyboard: ↑/↓ or j/k move the menu; ←/→ page the docs ── */
  var menuLinks = $$(".menu li a");
  if (menuLinks.length) {
    var idx = -1;
    document.addEventListener("keydown", function (e) {
      if (/^(INPUT|TEXTAREA)$/.test(document.activeElement.tagName)) return;
      var k = e.key;
      if (k === "ArrowDown" || k === "j") { idx = Math.min(menuLinks.length - 1, idx + 1); }
      else if (k === "ArrowUp" || k === "k") { idx = Math.max(0, idx - 1); }
      else if (k === "Enter" && idx >= 0) { menuLinks[idx].click(); return; }
      else return;
      e.preventDefault();
      menuLinks.forEach(function (a) { a.parentElement.removeAttribute("data-active"); });
      menuLinks[idx].parentElement.setAttribute("data-active", "");
      menuLinks[idx].focus();
    });
  }
  var prev = $(".pager a.prev:not(.disabled)"), next = $(".pager a.next:not(.disabled)");
  if (prev || next) {
    document.addEventListener("keydown", function (e) {
      if (/^(INPUT|TEXTAREA)$/.test(document.activeElement.tagName)) return;
      if (e.key === "ArrowLeft" && prev) prev.click();
      if (e.key === "ArrowRight" && next) next.click();
    });
  }

  /* ── static film grain (repaints only if motion is allowed) ─ */
  var canvas = $("#grain");
  if (canvas) {
    var ctx = canvas.getContext("2d");
    var S = 130, buf = document.createElement("canvas");
    buf.width = buf.height = S;
    var bctx = buf.getContext("2d");
    function paint() {
      var img = bctx.createImageData(S, S), d = img.data;
      for (var i = 0; i < d.length; i += 4) {
        var v = (Math.random() * 255) | 0;
        d[i] = d[i + 1] = d[i + 2] = v; d[i + 3] = 255;
      }
      bctx.putImageData(img, 0, 0);
      var w = canvas.width = canvas.offsetWidth;
      var h = canvas.height = canvas.offsetHeight;
      var p = ctx.createPattern(buf, "repeat");
      ctx.clearRect(0, 0, w, h);
      ctx.fillStyle = p; ctx.fillRect(0, 0, w, h);
    }
    paint();
    addEventListener("resize", paint, { passive: true });
    if (!reduce) setInterval(function () { if (!document.hidden) paint(); }, 120);
  }
})();
