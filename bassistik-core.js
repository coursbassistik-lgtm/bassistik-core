/*!
 * bassistik-core — module théorique commun des outils Bassistik
 * Notes, orthographe, gammes, modes, arpèges. Aucune dépendance.
 * Usage dans un bloc HTML Wix :
 *   <script src="https://cdn.jsdelivr.net/gh/coursbassistik-lgtm/bassistik-core@v0.1.0/bassistik-core.js"></script>
 *   BskCore.scale("Ré", "Dorien").notes  // ["Ré","Mi","Fa","Sol","La","Si","Do"]
 */
(function (root, factory) {
  if (typeof module === "object" && module.exports) module.exports = factory();
  else root.BskCore = factory();
})(typeof self !== "undefined" ? self : this, function () {
  "use strict";

  var VERSION = "0.2.0";

  /* ── Lettres et altérations ───────────────────────────────────────── */
  var LETTERS = ["Do", "Ré", "Mi", "Fa", "Sol", "La", "Si"];
  var LETTER_PC = [0, 2, 4, 5, 7, 9, 11];
  var SHARP = "♯", FLAT = "♭", DSHARP = "𝄪", DFLAT = "𝄫";
  var ACC = { "-2": DFLAT, "-1": FLAT, "0": "", "1": SHARP, "2": DSHARP };

  function mod(n, m) { return ((n % m) + m) % m; }

  /* Écrit la note située sur la lettre `letter` (0-6) et la classe de hauteur `pc` (0-11). */
  function spellOn(letter, pc) {
    var l = mod(letter, 7);
    var a = mod(pc - LETTER_PC[l], 12);
    if (a > 6) a -= 12;
    if (a < -2 || a > 2) return null; // orthographe impossible (triple altération)
    return { name: LETTERS[l] + ACC[String(a)], letter: l, pc: mod(pc, 12), acc: a };
  }

  /* Lit un nom de note souple : "Ré♭", "Reb", "RE b", "Do#", "Fa##", "Sib", "DO". */
  function parseNote(str) {
    if (typeof str !== "string") return null;
    var s = str.trim()
      .normalize("NFD").replace(/[̀-ͯ]/g, "")   // enlève les accents
      .toLowerCase()
      .replace(/𝄪/g, "##").replace(/𝄫/g, "bb")
      .replace(/♯/g, "#").replace(/♭/g, "b")
      .replace(/\s+/g, "");
    var m = s.match(/^(do|re|mi|fa|sol|la|si)(##|#|bb|b)?$/);
    if (!m) return null;
    var letter = ["do", "re", "mi", "fa", "sol", "la", "si"].indexOf(m[1]);
    var acc = { "": 0, "#": 1, "##": 2, "b": -1, "bb": -2 }[m[2] || ""];
    return spellOn(letter, LETTER_PC[letter] + acc);
  }

  /* ── Tonalités ────────────────────────────────────────────────────── */
  /* Orthographe usuelle de la tonique, par classe de hauteur, selon la couleur.
     Majeur : Ré♭, Mi♭, Fa♯ (ou Sol♭), La♭, Si♭.  Mineur : Do♯, Mi♭, Fa♯, Sol♯, Si♭. */
  var TONIC = {
    major: ["Do", "Ré♭", "Ré", "Mi♭", "Mi", "Fa", "Fa♯", "Sol", "La♭", "La", "Si♭", "Si"],
    minor: ["Do", "Do♯", "Ré", "Mi♭", "Mi", "Fa", "Fa♯", "Sol", "Sol♯", "La", "Si♭", "Si"]
  };
  function tonic(pc, color) {
    return parseNote(TONIC[color === "minor" ? "minor" : "major"][mod(pc, 12)]);
  }

  /* ── Gammes et modes ──────────────────────────────────────────────── */
  /* steps : décalage de lettre de chaque degré depuis la tonique ; semis : demi-tons.
     Les gammes symétriques (par tons, diminuées) ont une orthographe conventionnelle. */
  function S(steps, semis, color, extra) {
    var o = { steps: steps, semis: semis, color: color };
    for (var k in extra || {}) o[k] = extra[k];
    return o;
  }
  var HEPTA = [0, 1, 2, 3, 4, 5, 6];
  var SCALES = {
    "Gamme majeure":            S(HEPTA, [0, 2, 4, 5, 7, 9, 11], "major", { degrees: ["1", "2", "3", "4", "5", "6", "7"] }),
    "Gamme mineure naturelle":  S(HEPTA, [0, 2, 3, 5, 7, 8, 10], "minor", { degrees: ["1", "2", "♭3", "4", "5", "♭6", "♭7"] }),
    "Gamme mineure harmonique": S(HEPTA, [0, 2, 3, 5, 7, 8, 11], "minor", { degrees: ["1", "2", "♭3", "4", "5", "♭6", "7"] }),
    "Gamme mineure mélodique":  S(HEPTA, [0, 2, 3, 5, 7, 9, 11], "minor", { degrees: ["1", "2", "♭3", "4", "5", "6", "7"] }),
    "Ionien":     S(HEPTA, [0, 2, 4, 5, 7, 9, 11], "major", { degrees: ["1", "2", "3", "4", "5", "6", "7"], parent: 1 }),
    "Dorien":     S(HEPTA, [0, 2, 3, 5, 7, 9, 10], "minor", { degrees: ["1", "2", "♭3", "4", "5", "6", "♭7"], parent: 2 }),
    "Phrygien":   S(HEPTA, [0, 1, 3, 5, 7, 8, 10], "minor", { degrees: ["1", "♭2", "♭3", "4", "5", "♭6", "♭7"], parent: 3 }),
    "Lydien":     S(HEPTA, [0, 2, 4, 6, 7, 9, 11], "major", { degrees: ["1", "2", "3", "♯4", "5", "6", "7"], parent: 4 }),
    "Mixolydien": S(HEPTA, [0, 2, 4, 5, 7, 9, 10], "major", { degrees: ["1", "2", "3", "4", "5", "6", "♭7"], parent: 5 }),
    "Éolien":     S(HEPTA, [0, 2, 3, 5, 7, 8, 10], "minor", { degrees: ["1", "2", "♭3", "4", "5", "♭6", "♭7"], parent: 6 }),
    "Locrien":    S(HEPTA, [0, 1, 3, 5, 6, 8, 10], "diminished", { degrees: ["1", "♭2", "♭3", "4", "♭5", "♭6", "♭7"], parent: 7 }),
    /* Modes issus des mineures mélodique et harmonique (niveau avancé du Roll & Groove) */
    "Altéré":            S([0, 1, 1, 2, 4, 5, 6], [0, 1, 3, 4, 6, 8, 10], "dominant", { degrees: ["1", "♭2", "♯2", "3", "♭5", "♭6", "♭7"], from: ["Gamme mineure mélodique", 7] }),
    "Lydien dominant":   S(HEPTA, [0, 2, 4, 6, 7, 9, 10], "dominant", { degrees: ["1", "2", "3", "♯4", "5", "6", "♭7"], from: ["Gamme mineure mélodique", 4] }),
    "Locrien ♮2":        S(HEPTA, [0, 2, 3, 5, 6, 8, 10], "diminished", { degrees: ["1", "2", "♭3", "4", "♭5", "♭6", "♭7"], from: ["Gamme mineure mélodique", 6] }),
    "Phrygien dominant": S(HEPTA, [0, 1, 4, 5, 7, 8, 10], "dominant", { degrees: ["1", "♭2", "3", "4", "5", "♭6", "♭7"], from: ["Gamme mineure harmonique", 5] }),
    "Pentatonique majeure": S([0, 1, 2, 4, 5], [0, 2, 4, 7, 9], "major", { degrees: ["1", "2", "3", "5", "6"] }),
    "Pentatonique mineure": S([0, 2, 3, 4, 6], [0, 3, 5, 7, 10], "minor", { degrees: ["1", "♭3", "4", "5", "♭7"] }),
    "Gamme blues":          S([0, 2, 3, 4, 4, 6], [0, 3, 5, 6, 7, 10], "minor", { degrees: ["1", "♭3", "4", "♭5", "5", "♭7"], blueNote: 3 }),
    "Gamme par tons":       S([0, 1, 2, 3, 4, 5], [0, 2, 4, 6, 8, 10], "augmented", { degrees: ["1", "2", "3", "♯4", "♯5", "♭7"] }),
    "Diminuée ton/demi-ton":  S([0, 1, 2, 3, 3, 4, 5, 6], [0, 2, 3, 5, 6, 8, 9, 11], "diminished", { degrees: ["1", "2", "♭3", "4", "♭5", "♭6", "6", "7"] }),
    "Diminuée demi-ton/ton":  S([0, 1, 1, 2, 3, 4, 5, 6], [0, 1, 3, 4, 6, 7, 9, 10], "dominant", { degrees: ["1", "♭2", "♯2", "3", "♯4", "5", "6", "♭7"] })
  };

  /* ── Arpèges ──────────────────────────────────────────────────────── */
  var ARPS = {
    "Triade majeure":       S([0, 2, 4], [0, 4, 7], "major", { symbol: "", degrees: ["1", "3", "5"] }),
    "Triade mineure":       S([0, 2, 4], [0, 3, 7], "minor", { symbol: "m", degrees: ["1", "♭3", "5"] }),
    "Triade diminuée":      S([0, 2, 4], [0, 3, 6], "diminished", { symbol: "°", degrees: ["1", "♭3", "♭5"] }),
    "Triade augmentée":     S([0, 2, 4], [0, 4, 8], "augmented", { symbol: "+", degrees: ["1", "3", "♯5"] }),
    "Tétrade majeure":      S([0, 2, 4, 6], [0, 4, 7, 11], "major", { symbol: "Maj7", degrees: ["1", "3", "5", "7"] }),
    "Tétrade dominante":    S([0, 2, 4, 6], [0, 4, 7, 10], "dominant", { symbol: "7", degrees: ["1", "3", "5", "♭7"] }),
    "Tétrade mineure":      S([0, 2, 4, 6], [0, 3, 7, 10], "minor", { symbol: "m7", degrees: ["1", "♭3", "5", "♭7"] }),
    "Tétrade mineure 7♭5":  S([0, 2, 4, 6], [0, 3, 6, 10], "diminished", { symbol: "m7♭5", degrees: ["1", "♭3", "♭5", "♭7"] }),
    "Tétrade diminuée":     S([0, 2, 4, 6], [0, 3, 6, 9], "diminished", { symbol: "°7", degrees: ["1", "♭3", "♭5", "♭♭7"] }),
    "Tétrade mineure Maj7": S([0, 2, 4, 6], [0, 3, 7, 11], "minor", { symbol: "m(Maj7)", degrees: ["1", "♭3", "5", "7"] }),
    "Tétrade augmentée Maj7": S([0, 2, 4, 6], [0, 4, 8, 11], "augmented", { symbol: "+(Maj7)", degrees: ["1", "3", "♯5", "7"] }),
    "Tétrade augmentée 7":  S([0, 2, 4, 6], [0, 4, 8, 10], "augmented", { symbol: "+7", degrees: ["1", "3", "♯5", "♭7"] })
  };

  /* ── Construction ─────────────────────────────────────────────────── */
  function build(table, rootName, typeName) {
    var def = table[typeName];
    var r = typeof rootName === "object" && rootName ? rootName : parseNote(rootName);
    if (!def || !r) return null;
    var notes = [], ok = true;
    for (var i = 0; i < def.semis.length; i++) {
      var n = spellOn(r.letter + def.steps[i], r.pc + def.semis[i]);
      if (!n) { ok = false; break; }
      notes.push(n.name);
    }
    return {
      root: r.name, type: typeName, color: def.color,
      notes: ok ? notes : null,          // null : orthographe impossible sans triple altération
      semis: def.semis.slice(), degrees: (def.degrees || []).slice(),
      pcs: def.semis.map(function (s) { return mod(r.pc + s, 12); }),
      symbol: def.symbol != null ? r.name + def.symbol : undefined
    };
  }
  function scale(root, type) { return build(SCALES, root, type); }
  function arp(root, type) { return build(ARPS, root, type); }

  /* Triades et tétrades diatoniques d'une gamme heptatonique (empilement de tierces). */
  var ROMAN = ["I", "II", "III", "IV", "V", "VI", "VII"];
  function qualityOf(semis) {
    var key = semis.join(",");
    for (var name in ARPS) if (ARPS[name].semis.join(",") === key) return name;
    return null;
  }
  function diatonic(root, type, size) {
    var sc = scale(root, type);
    if (!sc || sc.semis.length !== 7 || !sc.notes) return null;
    size = size === 4 ? 4 : 3;
    var out = [];
    for (var d = 0; d < 7; d++) {
      var rel = [];
      for (var k = 0; k < size; k++) {
        var idx = (d + 2 * k) % 7;
        rel.push(mod(sc.semis[idx] - sc.semis[d], 12));
      }
      var q = qualityOf(rel);
      out.push({ degree: ROMAN[d], root: sc.notes[d], type: q, symbol: q ? sc.notes[d] + ARPS[q].symbol : sc.notes[d] + "?" });
    }
    return out;
  }

  /* Le mode parent : quelle gamme majeure contient ce mode ("Ré Dorien" → Do majeur). */
  function parentMajor(root, modeName) {
    var def = SCALES[modeName], r = parseNote(root);
    if (!def || !def.parent || !r) return null;
    var p = def.parent - 1;
    var majSemis = SCALES["Gamme majeure"].semis;
    return spellOn(r.letter - p, r.pc - majSemis[p]).name;
  }

  /* Gamme d'origine d'un mode hors majeur ("Do altéré" → 7e mode de Ré♭ mineure mélodique). */
  function parentOf(root, modeName) {
    var def = SCALES[modeName], r = parseNote(root);
    if (!def || !def.from || !r) return null;
    var src = SCALES[def.from[0]], d = def.from[1] - 1;
    var n = spellOn(r.letter - src.steps[d], r.pc - src.semis[d]);
    return n ? { root: n.name, scale: def.from[0], degree: def.from[1] } : null;
  }

  return {
    VERSION: VERSION,
    LETTERS: LETTERS.slice(),
    parseNote: parseNote,
    spellOn: spellOn,
    tonic: tonic,
    SCALES: SCALES,
    ARPS: ARPS,
    scale: scale,
    arp: arp,
    diatonic: diatonic,
    parentMajor: parentMajor,
    parentOf: parentOf,
    qualityOf: qualityOf
  };
});
