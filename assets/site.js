/* AERA site — a few interactive things, all on-theme, all optional. */
(function () {
  "use strict";
  var reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

  /* ── S60 status bar: live clock ───────────────────────────── */
  var clock = $("#clock");
  (function tick() {
    if (clock) {
      var d = new Date();
      clock.textContent = String(d.getHours()).padStart(2, "0") + ":" +
        String(d.getMinutes()).padStart(2, "0");
    }
    setTimeout(tick, 15000);
  })();

  /* ── power-on flicker on the wordmark, once ───────────────── */
  if (!reduce) {
    var wm = $(".wordmark");
    if (wm) requestAnimationFrame(function () { wm.classList.add("flick"); });
  }

  /* ── the shutter, and the card it fills ─────────────────────
     Press it and you shoot: flash, click, haptic, the frame counter
     ticks and the ring around the button fills. At 24 the card is full
     — which is the free tier, exactly — and the same button formats it.
     The whole free-tier loop, in one control. */
  var flash   = $("#flash");
  var shutter = $(".shutter");
  var wrap    = $(".shutter-wrap");
  var hint    = $(".shutter-hint");
  var counter = $(".frame-counter");
  var TOTAL = 24, frames = 0, actx = null;

  function tone(from, to, dur, vol) {
    try {
      actx = actx || new (window.AudioContext || window.webkitAudioContext)();
      var t = actx.currentTime;
      var o = actx.createOscillator(), g = actx.createGain();
      o.type = "square";
      o.frequency.setValueAtTime(from, t);
      o.frequency.exponentialRampToValueAtTime(to, t + dur * 0.6);
      g.gain.setValueAtTime(vol, t);
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      o.connect(g); g.connect(actx.destination);
      o.start(t); o.stop(t + dur + 0.01);
    } catch (e) { /* audio blocked — fine */ }
  }
  function buzz(ms) { if (navigator.vibrate) navigator.vibrate(ms); }

  /* every string comes off the markup, so the page's own language owns it */
  function say(el, key, fallback) {
    return (el && el.getAttribute("data-" + key)) || fallback;
  }
  function paintShutter(which) {
    var full = frames >= TOTAL;
    if (shutter) {
      shutter.style.setProperty("--p", (frames / TOTAL * 100).toFixed(1));
      shutter.toggleAttribute("data-full", full);
      shutter.setAttribute("aria-label", full
        ? say(shutter, "label-full", "Format the card")
        : say(shutter, "label-idle", "Take a shot"));
    }
    if (hint) hint.classList.toggle("is-full", full);
    if (hint) hint.textContent = which
      ? say(hint, which, which)
      : (full ? say(hint, "full", "Card full — tap to format")
              : say(hint, "idle", "Tap to shoot"));
    if (counter) {
      counter.firstChild.textContent = String(frames).padStart(3, "0");
      counter.style.color = full ? "var(--amber)" : "";
    }
  }

  if (shutter) {
    paintShutter();
    shutter.addEventListener("click", function () {
      if (frames >= TOTAL) {                       // full → format the card
        frames = 0;
        tone(320, 120, 0.16, 0.05);
        buzz([8, 40, 8]);
        paintShutter("done");
        setTimeout(function () { paintShutter(); }, 1000);
        return;
      }
      frames++;
      if (flash && !reduce) {                      // shutter flash
        flash.classList.remove("fire"); void flash.offsetWidth; flash.classList.add("fire");
      }
      tone(1800, 220, 0.07, 0.06);
      buzz(12);
      paintShutter();
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
