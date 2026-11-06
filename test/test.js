// node test/test.js — vérifie l'orthographe sur des cas connus
const B = require("../bassistik-core.js");
const assert = require("assert");
const eq = (r, t, exp, f = B.scale) => assert.strictEqual(f(r, t).notes.join(" "), exp, r + " " + t);
eq("Ré", "Dorien", "Ré Mi Fa Sol La Si Do");
eq("Si", "Locrien", "Si Do Ré Mi Fa Sol La");
eq("Mi", "Phrygien", "Mi Fa Sol La Si Do Ré");
eq("Fa", "Lydien", "Fa Sol La Si Do Ré Mi");
eq("Si♭", "Gamme majeure", "Si♭ Do Ré Mi♭ Fa Sol La");
eq("La", "Gamme mineure harmonique", "La Si Do Ré Mi Fa Sol♯");
eq("Do", "Gamme mineure mélodique", "Do Ré Mi♭ Fa Sol La Si");
eq("La", "Pentatonique mineure", "La Do Ré Mi Sol");
eq("La", "Gamme blues", "La Do Ré Mi♭ Mi Sol");
eq("Si", "Tétrade diminuée", "Si Ré Fa La♭", B.arp);
eq("Do", "Tétrade mineure 7♭5", "Do Mi♭ Sol♭ Si♭", B.arp);
assert.strictEqual(B.parseNote("reb").name, "Ré♭");
assert.strictEqual(B.parseNote("FA#").name, "Fa♯");
assert.strictEqual(B.parentMajor("Ré", "Dorien"), "Do");
assert.strictEqual(B.parentMajor("Fa♯", "Locrien"), "Sol");
assert.strictEqual(B.diatonic("Do", "Gamme mineure mélodique", 4).map(d => d.symbol).join(" "),
  "Dom(Maj7) Rém7 Mi♭+(Maj7) Fa7 Sol7 Lam7♭5 Sim7♭5");
assert.strictEqual(B.diatonic("Mi♭", "Gamme majeure", 4).map(d => d.symbol).join(" "),
  "Mi♭Maj7 Fam7 Solm7 La♭Maj7 Si♭7 Dom7 Rém7♭5");
eq("Sol", "Altéré", "Sol La♭ La♯ Si Ré♭ Mi♭ Fa");
eq("Do", "Lydien dominant", "Do Ré Mi Fa♯ Sol La Si♭");
eq("Do", "Locrien ♮2", "Do Ré Mi♭ Fa Sol♭ La♭ Si♭");
eq("Mi", "Phrygien dominant", "Mi Fa Sol♯ La Si Do Ré");
assert.deepStrictEqual(B.parentOf("Sol", "Altéré"), { root: "La♭", scale: "Gamme mineure mélodique", degree: 7 });
assert.strictEqual(B.parentOf("Do", "Lydien dominant").root, "Sol");
assert.strictEqual(B.parentOf("Do", "Locrien ♮2").root, "Mi♭");
assert.strictEqual(B.parentOf("Mi", "Phrygien dominant").root, "La");
// toutes les gammes × 12 toniques usuelles s'écrivent sans erreur
for (const t in B.SCALES) for (let pc = 0; pc < 12; pc++) {
  const r = B.tonic(pc, B.SCALES[t].color === "minor" ? "minor" : "major");
  assert.ok(B.scale(r, t).notes, t + " sur " + r.name);
}
console.log("OK — bassistik-core " + B.VERSION);
