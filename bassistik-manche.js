/*!
 * bassistik-manche — explorateur de manche commun aux outils Bassistik
 * Gammes, modes et arpèges sur un manche 4, 5 ou 6 cordes, en degrés ou en notes, avec écoute.
 * Dépend de bassistik-core.js (BskCore), à charger avant.
 *
 *   var ex = BskManche.mount(document.getElementById("hote"), { root: "Ré", type: "Dorien" });
 *   ex.set({ root: "Sol♯", type: "Gamme mineure harmonique" });
 *   ex.setSuggestions("Sol♯", [{ type: "Dorien", label: "Mode du d8" }, ...]);  // onglets issus d'un tirage
 */
(function (root, factory) {
  if (typeof module === "object" && module.exports) module.exports = factory(require("./bassistik-core.js"));
  else root.BskManche = factory(root.BskCore);
})(typeof self !== "undefined" ? self : this, function (Core) {
  "use strict";
  if (!Core) throw new Error("bassistik-manche : charger bassistik-core.js avant.");

  var VERSION = "0.1.0";
  var SAMPLE_C4 = "https://static.wixstatic.com/mp3/48c5a7_c89fffe28fe94c5c9d81e02b3b08037e.wav";

  /* ── Données ─────────────────────────────────────────────────────── */
  var KEYS = ["Do", "Do♯", "Ré♭", "Ré", "Ré♯", "Mi♭", "Mi", "Fa", "Fa♯", "Sol♭", "Sol", "Sol♯", "La♭", "La", "La♯", "Si♭", "Si"];
  var FAMILIES = {
    "Gammes": ["Gamme majeure", "Gamme mineure naturelle", "Gamme mineure harmonique", "Gamme mineure mélodique",
               "Pentatonique majeure", "Pentatonique mineure", "Gamme blues", "Gamme par tons",
               "Diminuée ton/demi-ton", "Diminuée demi-ton/ton"],
    "Modes": ["Ionien", "Dorien", "Phrygien", "Lydien", "Mixolydien", "Éolien", "Locrien"],
    "Arpèges": Object.keys(Core.ARPS)
  };
  /* Accordages, de la corde grave à l'aiguë (MIDI) */
  var TUNINGS = {
    4: [{ n: "Mi", m: 28 }, { n: "La", m: 33 }, { n: "Ré", m: 38 }, { n: "Sol", m: 43 }],
    5: [{ n: "Si", m: 23 }, { n: "Mi", m: 28 }, { n: "La", m: 33 }, { n: "Ré", m: 38 }, { n: "Sol", m: 43 }],
    6: [{ n: "Si", m: 23 }, { n: "Mi", m: 28 }, { n: "La", m: 33 }, { n: "Ré", m: 38 }, { n: "Sol", m: 43 }, { n: "Do", m: 48 }]
  };
  var INLAYS = [3, 5, 7, 9, 15, 17, 19, 21];
  var MODE_RANK = ["1er", "2e", "3e", "4e", "5e", "6e", "7e"];

  function familyOf(type) {
    for (var f in FAMILIES) if (FAMILIES[f].indexOf(type) !== -1) return f;
    return null;
  }
  function isArp(type) { return familyOf(type) === "Arpèges"; }
  /* Affichage : 𝄪 et 𝄫 s'affichent mal sur certains PC, on écrit ♯♯ et ♭♭ comme les répertoires */
  function show(name) { return String(name || "").replace(/𝄪/g, "♯♯").replace(/𝄫/g, "♭♭"); }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;" }[c]; }); }

  /* ── Styles (dans le shadow DOM de chaque manche) ──────────────────── */
  var CSS = [
    ":host{display:block;}.bskx{--x-bg:var(--cream,#F7F4EC);--x-bg2:var(--cream-2,#EFEBE0);--x-ink:var(--ink,#171A22);--x-body:var(--body,#4A5260);",
    "--x-soft:var(--soft,#8A8D96);--x-line:var(--line,#E4DFD2);--x-or:#FF6B00;--x-oink:var(--o-ink,#B54B00);--x-blue:#5E7488;",
    "font-family:Montserrat,system-ui,-apple-system,'Segoe UI',Roboto,sans-serif;color:var(--x-ink);background:transparent;box-sizing:border-box;width:100%;}",
    ".bskx *{box-sizing:border-box;}",
    ".bskx-sugg{display:flex;flex-wrap:wrap;gap:6px;margin:0 0 12px;align-items:center;}",
    ".bskx-sugg-lbl{font-size:11px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:var(--x-soft);margin-right:4px;}",
    ".bskx-chip{font:inherit;font-size:13px;font-weight:600;padding:7px 12px;border:1px solid var(--x-line);background:var(--x-bg);color:var(--x-ink);cursor:pointer;border-radius:0;}",
    ".bskx-chip:hover{border-color:var(--x-ink);}",
    ".bskx-chip[aria-pressed=true]{background:var(--x-or);border-color:var(--x-or);color:#fff;}",
    ".bskx-ctrl{display:grid;grid-template-columns:repeat(auto-fit,minmax(130px,1fr));gap:8px;margin:0 0 12px;}",
    ".bskx-f{display:flex;flex-direction:column;gap:4px;min-width:0;}",
    ".bskx-f label{font-size:10.5px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:var(--x-soft);}",
    ".bskx-f select{font:inherit;font-size:14px;padding:8px 10px;border:1px solid var(--x-line);background:var(--x-bg);color:var(--x-ink);border-radius:0;width:100%;}",
    ".bskx-head{display:flex;flex-wrap:wrap;align-items:baseline;justify-content:space-between;gap:6px 16px;margin:0 0 8px;}",
    ".bskx-title{font-size:18px;font-weight:700;margin:0;}",
    ".bskx-sub{font-size:13px;color:var(--x-body);margin:0;}",
    ".bskx-formula{display:flex;flex-wrap:wrap;gap:4px;margin:0 0 12px;}",
    ".bskx-cell{display:flex;flex-direction:column;align-items:center;min-width:44px;padding:6px 6px;border:1px solid var(--x-line);background:var(--x-bg);}",
    ".bskx-cell b{font-size:14px;font-weight:700;}",
    ".bskx-cell span{font-size:11.5px;color:var(--x-body);}",
    ".bskx-cell.is-root{border-color:var(--x-or);}",
    ".bskx-cell.is-root b{color:var(--x-oink);}",
    ".bskx-cell.is-blue span{color:var(--x-blue);}",
    ".bskx-board{overflow-x:auto;-webkit-overflow-scrolling:touch;border:1px solid var(--x-line);background:var(--x-bg2);padding:6px 4px;}",
    ".bskx-board svg{display:block;}",
    ".bskx-dot{cursor:pointer;}",
    ".bskx-dot circle{fill:#fff;stroke:var(--x-ink);stroke-width:1.2;}",
    ".bskx-dot text{font-size:10.5px;font-weight:700;fill:var(--x-ink);text-anchor:middle;dominant-baseline:central;pointer-events:none;}",
    ".bskx-dot.is-root circle{fill:var(--x-or);stroke:var(--x-or);}",
    ".bskx-dot.is-root text{fill:#fff;}",
    ".bskx-dot.is-blue circle{stroke:var(--x-blue);stroke-width:2;}",
    ".bskx-dot.is-blue text{fill:var(--x-blue);}",
    ".bskx-dot.is-on circle{fill:var(--x-ink);stroke:var(--x-ink);}",
    ".bskx-dot.is-on text{fill:#fff;}",
    ".bskx-bar{display:flex;flex-wrap:wrap;align-items:center;gap:8px;margin:12px 0 0;}",
    ".bskx-play{font:inherit;font-size:14px;font-weight:700;padding:10px 18px;border:0;background:var(--x-or);color:#fff;cursor:pointer;border-radius:0;}",
    ".bskx-play[aria-pressed=true]{background:var(--x-ink);}",
    ".bskx-ghost{font:inherit;font-size:13px;font-weight:600;padding:9px 14px;border:1px solid var(--x-line);background:var(--x-bg);color:var(--x-ink);cursor:pointer;border-radius:0;}",
    ".bskx-tempo{display:flex;align-items:center;gap:8px;font-size:13px;color:var(--x-body);}",
    ".bskx-tempo input{accent-color:#FF6B00;width:110px;}",
    ".bskx-note{font-size:13px;color:var(--x-body);margin:10px 0 0;line-height:1.5;}",
    ".bskx-warn{font-size:14px;color:var(--x-oink);padding:14px;border:1px solid var(--x-line);background:var(--x-bg);}",
    ".bskx-swipe{display:none;font-size:12px;color:var(--x-soft);margin:6px 0 0;}",
    "@media (max-width:560px){.bskx-swipe{display:block;}.bskx-ctrl{grid-template-columns:1fr 1fr;}.bskx-cell{min-width:38px;}}"
  ].join("");

  /* ── Audio : échantillon de piano transposé ───────────────────────── */
  var AU = { ac: null, buf: null, loading: null };
  function audio() {
    if (!AU.ac) {
      var C = window.AudioContext || window.webkitAudioContext;
      if (!C) return null;
      AU.ac = new C();
    }
    if (AU.ac.state === "suspended") AU.ac.resume();
    if (!AU.buf && !AU.loading) {
      AU.loading = fetch(SAMPLE_C4).then(function (r) { return r.arrayBuffer(); })
        .then(function (a) { return new Promise(function (ok, ko) { AU.ac.decodeAudioData(a, ok, ko); }); })
        .then(function (b) { AU.buf = b; })
        .catch(function () { AU.loading = null; });
    }
    return AU.ac;
  }
  /* On joue une octave au-dessus du son réel de la basse : l'échantillon reste clair */
  function playMidi(midi, when, dur) {
    var ac = audio();
    if (!ac || !AU.buf) return;
    var t = when || ac.currentTime;
    var src = ac.createBufferSource(), g = ac.createGain();
    src.buffer = AU.buf;
    src.playbackRate.value = Math.pow(2, (midi + 12 - 60) / 12);
    g.gain.setValueAtTime(0.9, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + (dur || 0.9));
    src.connect(g); g.connect(ac.destination);
    src.start(t); src.stop(t + (dur || 0.9) + 0.05);
  }

  /* ── Explorateur ─────────────────────────────────────────────────── */
  function mount(host, opts) {
    opts = opts || {};
    /* Le manche vit dans un shadow DOM : les styles de la page hôte ne le touchent pas
       (polices et variables CSS, elles, se transmettent). */
    var view = host.shadowRoot || (host.attachShadow ? host.attachShadow({ mode: "open" }) : host);
    var st = {
      root: opts.root || "Do",
      type: opts.type || "Gamme majeure",
      strings: opts.strings || 4,
      labels: opts.labels || "degres",
      start: 0,
      width: 12,
      bpm: 80,
      sugg: null,
      playing: false,
      timers: []
    };

    view.innerHTML = '<style>' + CSS + '</style>' +
      '<div class="bskx">' +
        '<div class="bskx-sugg" hidden></div>' +
        '<div class="bskx-ctrl">' +
          field("Tonalité", "root", KEYS.map(function (k) { return [k, k]; })) +
          field("Famille", "fam", Object.keys(FAMILIES).map(function (k) { return [k, k]; })) +
          field("Type", "type", []) +
          field("Cordes", "strings", [["4", "4 cordes"], ["5", "5 cordes"], ["6", "6 cordes"]]) +
          field("Affichage", "labels", [["degres", "Degrés"], ["notes", "Notes"], ["muet", "Pastilles muettes"]]) +
          field("Zone", "zone", [["0", "Cases 0 à 12"], ["5", "Cases 5 à 17"], ["12", "Cases 12 à 24"]]) +
        '</div>' +
        '<div class="bskx-head"><p class="bskx-title"></p><p class="bskx-sub"></p></div>' +
        '<div class="bskx-formula"></div>' +
        '<div class="bskx-board"></div>' +
        '<p class="bskx-swipe">Fais glisser le manche pour voir les autres cases.</p>' +
        '<div class="bskx-bar">' +
          '<button type="button" class="bskx-play" aria-pressed="false">Écouter</button>' +
          '<label class="bskx-tempo">Tempo <input type="range" min="40" max="160" step="5" value="80"><span>80 bpm</span></label>' +
        '</div>' +
        '<p class="bskx-note"></p>' +
      '</div>';

    var $ = function (s) { return view.querySelector(s); };
    var sel = function (k) { return view.querySelector('select[data-k="' + k + '"]'); };

    function field(label, key, options) {
      return '<div class="bskx-f"><label>' + label + '</label><select data-k="' + key + '">' +
        options.map(function (o) { return '<option value="' + esc(o[0]) + '">' + esc(o[1]) + '</option>'; }).join("") +
        '</select></div>';
    }
    function fillTypes() {
      var fam = familyOf(st.type) || "Gammes";
      sel("fam").value = fam;
      sel("type").innerHTML = FAMILIES[fam].map(function (t) { return '<option value="' + esc(t) + '">' + esc(t) + '</option>'; }).join("");
      sel("type").value = st.type;
    }
    function syncControls() {
      sel("root").value = st.root;
      fillTypes();
      sel("strings").value = String(st.strings);
      sel("labels").value = st.labels;
      sel("zone").value = String(st.start);
    }

    function current() { return isArp(st.type) ? Core.arp(st.root, st.type) : Core.scale(st.root, st.type); }

    /* Positions visibles : pour chaque corde et chaque case, la note si elle appartient au matériau */
    function positions(m) {
      var tun = TUNINGS[st.strings], out = [];
      var first = st.start, last = Math.min(24, st.start + st.width);
      for (var s = 0; s < tun.length; s++) {
        for (var f = (first === 0 ? 0 : first); f <= last; f++) {
          var midi = tun[s].m + f, pc = midi % 12, i = m.pcs.indexOf(pc);
          if (i === -1) continue;
          out.push({ s: s, f: f, midi: midi, i: i });
        }
      }
      return out;
    }

    function render() {
      stop();
      var m = current();
      var title = $(".bskx-title"), sub = $(".bskx-sub"), formula = $(".bskx-formula"), board = $(".bskx-board"), note = $(".bskx-note");
      if (!m || !m.notes) {
        title.textContent = st.root + " " + st.type;
        sub.textContent = "";
        formula.innerHTML = "";
        board.innerHTML = '<div class="bskx-warn">Cette tonalité demanderait des triples altérations. Prends son équivalent enharmonique dans la liste.</div>';
        note.textContent = "";
        return;
      }
      var def = isArp(st.type) ? Core.ARPS[st.type] : Core.SCALES[st.type];
      title.textContent = isArp(st.type) ? "Arpège " + show(m.symbol) + " (" + st.type.replace(/^Tétrade /, "tétrade ").replace(/^Triade /, "triade ") + ")"
        : familyOf(st.type) === "Modes" ? show(m.root) + " " + st.type.toLowerCase()
        : st.type + " de " + show(m.root);
      sub.textContent = m.notes.map(show).join(" · ");

      formula.innerHTML = m.notes.map(function (n, i) {
        var cls = "bskx-cell" + (i === 0 ? " is-root" : "") + (def.blueNote === i ? " is-blue" : "");
        return '<div class="' + cls + '"><b>' + esc(show(n)) + '</b><span>' + esc(m.degrees[i] || "") + '</span></div>';
      }).join("");

      board.innerHTML = svg(m, def);
      var dots = board.querySelectorAll(".bskx-dot");
      for (var d = 0; d < dots.length; d++) dots[d].addEventListener("click", function () {
        audio(); playMidi(Number(this.getAttribute("data-midi")));
        flash(this, 350);
      });

      var info = [];
      if (def.parent) {
        var par = Core.parentMajor(st.root, st.type);
        if (par) info.push(show(m.root) + " " + st.type.toLowerCase() + " : " + MODE_RANK[def.parent - 1] + " mode de " + show(par) + " majeur. Mêmes notes, autre centre de gravité.");
      }
      if (def.blueNote != null) info.push("La blue note (" + m.degrees[def.blueNote] + ") apparaît en bleu : une note de passage, pas un appui.");
      if (isArp(st.type)) info.push("Arpège : les notes de l'accord, une par une. Repère la fondamentale en orange sur chaque corde.");
      note.textContent = info.join(" ");
      if (typeof opts.onChange === "function") opts.onChange({ root: st.root, type: st.type, strings: st.strings });
    }

    function svg(m, def) {
      var tun = TUNINGS[st.strings], n = tun.length;
      var first = st.start, last = Math.min(24, st.start + st.width);
      var openCol = first === 0;
      var fretW = 52, padL = openCol ? 70 : 34, padR = 14, padT = 30, gap = 30;
      var cols = last - first + (openCol ? 0 : 1);
      var W = padL + cols * fretW + padR, H = padT + (n - 1) * gap + 30;
      var x = function (f) {
        if (openCol && f === 0) return padL - 24;
        var k = openCol ? f : f - first + 1;
        return padL + (k - 0.5) * fretW;
      };
      var y = function (s) { return padT + (n - 1 - s) * gap; };
      var parts = ['<svg viewBox="0 0 ' + W + ' ' + H + '" style="width:100%;min-width:' + W + 'px;height:auto" role="img" aria-label="Manche">'];
      // numéros de case
      for (var f = first; f <= last; f++) {
        if (f === 0) continue;
        parts.push('<text x="' + x(f) + '" y="12" font-size="10" fill="#8A8D96" text-anchor="middle">' + f + '</text>');
      }
      // repères
      var yMid = (y(0) + y(n - 1)) / 2;
      for (f = Math.max(1, first); f <= last; f++) {
        if (INLAYS.indexOf(f) !== -1) parts.push('<circle cx="' + x(f) + '" cy="' + yMid + '" r="4" fill="#D8D2C2"/>');
        if (f === 12 || f === 24) {
          parts.push('<circle cx="' + x(f) + '" cy="' + (yMid - gap / 2) + '" r="4" fill="#D8D2C2"/>');
          parts.push('<circle cx="' + x(f) + '" cy="' + (yMid + gap / 2) + '" r="4" fill="#D8D2C2"/>');
        }
      }
      // frettes
      var fx0 = padL;
      for (var k = 0; k <= cols; k++) {
        var fxx = fx0 + k * fretW;
        var nut = openCol && k === 0;
        parts.push('<line x1="' + fxx + '" y1="' + y(n - 1) + '" x2="' + fxx + '" y2="' + y(0) + '" stroke="' + (nut ? "#171A22" : "#C9C2B0") + '" stroke-width="' + (nut ? 4 : 1.4) + '"/>');
      }
      // cordes + noms
      for (var s = 0; s < n; s++) {
        parts.push('<line x1="' + (openCol ? padL - 44 : padL) + '" y1="' + y(s) + '" x2="' + (W - padR) + '" y2="' + y(s) + '" stroke="#8D8676" stroke-width="' + (s === 0 ? 2 : 1.5) + '"/>');
        parts.push('<text x="4" y="' + y(s) + '" font-size="10" font-weight="700" fill="#8A8D96" dominant-baseline="central">' + tun[s].n + '</text>');
      }
      // pastilles
      positions(m).forEach(function (p) {
        var cls = "bskx-dot" + (p.i === 0 ? " is-root" : "") + (def.blueNote === p.i ? " is-blue" : "");
        var lbl = st.labels === "notes" ? show(m.notes[p.i]) : st.labels === "degres" ? (m.degrees[p.i] || "") : "";
        parts.push('<g class="' + cls + '" data-midi="' + p.midi + '" data-s="' + p.s + '" data-f="' + p.f + '">' +
          '<circle cx="' + x(p.f) + '" cy="' + y(p.s) + '" r="12"/>' +
          (lbl ? '<text x="' + x(p.f) + '" y="' + y(p.s) + '">' + esc(lbl) + '</text>' : '') + '</g>');
      });
      parts.push('</svg>');
      return parts.join("");
    }

    /* ── Écoute : montée puis descente sur une octave, dans la zone affichée ── */
    function path(m) {
      var pos = positions(m);
      if (!pos.length) return [];
      var roots = pos.filter(function (p) { return p.i === 0; }).sort(function (a, b) { return a.midi - b.midi; });
      if (!roots.length) return [];
      var r0 = roots[0], want = m.semis.map(function (sm) { return r0.midi + sm; }).concat([r0.midi + 12]);
      var seq = [], prev = r0;
      want.forEach(function (midi) {
        var c = pos.filter(function (p) { return p.midi === midi; });
        if (!c.length) return;
        c.sort(function (a, b) { return (Math.abs(a.f - prev.f) + Math.abs(a.s - prev.s) * 0.5) - (Math.abs(b.f - prev.f) + Math.abs(b.s - prev.s) * 0.5); });
        seq.push(c[0]); prev = c[0];
      });
      return seq.concat(seq.slice(0, -1).reverse());
    }
    function flash(g, ms) {
      g.classList.add("is-on");
      st.timers.push(setTimeout(function () { g.classList.remove("is-on"); }, ms));
    }
    function stop() {
      st.timers.forEach(clearTimeout); st.timers = [];
      st.playing = false;
      var b = view.querySelector(".bskx-play");
      if (b) { b.setAttribute("aria-pressed", "false"); b.textContent = "Écouter"; }
      var on = view.querySelectorAll(".bskx-dot.is-on");
      for (var i = 0; i < on.length; i++) on[i].classList.remove("is-on");
    }
    function play() {
      var ac = audio();
      if (!ac) return;
      var go = function () {
        var m = current();
        if (!m || !m.notes) return;
        var seq = path(m), beat = 60 / st.bpm;
        if (!seq.length) return;
        st.playing = true;
        var b = view.querySelector(".bskx-play");
        b.setAttribute("aria-pressed", "true"); b.textContent = "Arrêter";
        var t0 = ac.currentTime + 0.08;
        seq.forEach(function (p, k) {
          playMidi(p.midi, t0 + k * beat, Math.min(1.2, beat * 1.4));
          st.timers.push(setTimeout(function () {
            var g = view.querySelector('.bskx-dot[data-s="' + p.s + '"][data-f="' + p.f + '"]');
            if (g) flash(g, beat * 900);
          }, (0.08 + k * beat) * 1000));
        });
        st.timers.push(setTimeout(stop, (0.08 + seq.length * beat) * 1000 + 300));
      };
      if (AU.buf) go(); else if (AU.loading) AU.loading.then(go);
    }

    /* ── Événements ── */
    sel("root").addEventListener("change", function () { st.root = this.value; render(); markSugg(); });
    sel("fam").addEventListener("change", function () { st.type = FAMILIES[this.value][0]; fillTypes(); render(); markSugg(); });
    sel("type").addEventListener("change", function () { st.type = this.value; render(); markSugg(); });
    sel("strings").addEventListener("change", function () { st.strings = Number(this.value); render(); });
    sel("labels").addEventListener("change", function () { st.labels = this.value; render(); });
    sel("zone").addEventListener("change", function () { st.start = Number(this.value); render(); });
    $(".bskx-play").addEventListener("click", function () { if (st.playing) stop(); else play(); });
    var tempo = $(".bskx-tempo input");
    tempo.addEventListener("input", function () { st.bpm = Number(this.value); $(".bskx-tempo span").textContent = this.value + " bpm"; });

    /* ── Suggestions issues d'un tirage ── */
    function markSugg() {
      var chips = view.querySelectorAll(".bskx-chip");
      for (var i = 0; i < chips.length; i++) {
        var on = chips[i].getAttribute("data-type") === st.type && chips[i].getAttribute("data-root") === st.root;
        chips[i].setAttribute("aria-pressed", on ? "true" : "false");
      }
    }
    function setSuggestions(rootName, items, label) {
      var box = $(".bskx-sugg");
      items = (items || []).filter(function (it) { return it && familyOf(it.type); });
      if (!items.length) { box.hidden = true; box.innerHTML = ""; return; }
      box.hidden = false;
      box.innerHTML = '<span class="bskx-sugg-lbl">' + esc(label || "Ton tirage") + '</span>' + items.map(function (it) {
        return '<button type="button" class="bskx-chip" data-root="' + esc(rootName) + '" data-type="' + esc(it.type) + '">' + esc(show(rootName) + " · " + (it.label || it.type)) + '</button>';
      }).join("");
      var chips = box.querySelectorAll(".bskx-chip");
      for (var i = 0; i < chips.length; i++) chips[i].addEventListener("click", function () {
        set({ root: this.getAttribute("data-root"), type: this.getAttribute("data-type") });
      });
      set({ root: rootName, type: items[0].type });
    }
    function set(o) {
      o = o || {};
      if (o.root && KEYS.indexOf(o.root) !== -1) st.root = o.root;
      else if (o.root) { var p = Core.parseNote(o.root); if (p && KEYS.indexOf(p.name) !== -1) st.root = p.name; }
      if (o.type && familyOf(o.type)) st.type = o.type;
      if (o.strings && TUNINGS[o.strings]) st.strings = o.strings;
      syncControls(); render(); markSugg();
    }

    syncControls();
    render();
    return { set: set, setSuggestions: setSuggestions, stop: stop, state: function () { return { root: st.root, type: st.type, strings: st.strings }; } };
  }

  return { VERSION: VERSION, KEYS: KEYS.slice(), FAMILIES: FAMILIES, TUNINGS: TUNINGS, mount: mount, familyOf: familyOf };
});
