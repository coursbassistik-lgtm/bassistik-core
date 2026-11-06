# bassistik-core

Module théorique commun aux outils pédagogiques de [Bassistik](https://www.bassistik-live.com) : notes et orthographe, gammes, modes, arpèges, accords diatoniques. Une seule source de vérité pour Roll & Groove, les répertoires de gammes et d'arpèges, Penta Lab et les outils d'harmonie.

## Utilisation dans un bloc HTML Wix

```html
<script src="https://cdn.jsdelivr.net/gh/coursbassistik-lgtm/bassistik-core@v0.2.0/bassistik-core.js"></script>
<script>
  BskCore.scale("Ré", "Dorien").notes;            // ["Ré","Mi","Fa","Sol","La","Si","Do"]
  BskCore.arp("Si", "Tétrade diminuée").notes;    // ["Si","Ré","Fa","La♭"]
  BskCore.diatonic("Do", "Gamme mineure mélodique", 4).map(d => d.symbol);
  BskCore.parentMajor("Ré", "Dorien");            // "Do"
</script>
```

Toujours viser un **tag de version** (`@v0.2.0`) : un outil en ligne ne change jamais sans qu'on le décide.

## Contenu

| Fonction | Rôle |
|---|---|
| `parseNote("reb")` | lit un nom de note souple (accents, `#`/`b`, majuscules) |
| `spellOn(lettre, pc)` | écrit une hauteur sur une lettre donnée (orthographe correcte des degrés) |
| `tonic(pc, "major"\|"minor")` | orthographe usuelle d'une tonique (Mi♭ majeur, Do♯ mineur…) |
| `scale(tonique, type)` | 17 gammes et modes, orthographiés degré par degré |
| `arp(tonique, type)` | 12 arpèges, dont m(Maj7), +(Maj7), +7 |
| `diatonic(tonique, type, 3\|4)` | triades ou tétrades diatoniques d'une gamme à 7 notes |
| `parentMajor(tonique, mode)` | gamme majeure parente d'un mode |

## Tests

```
node test/test.js
```

## Publier une version

1. Modifier, lancer les tests.
2. Monter `VERSION` dans `bassistik-core.js`.
3. Créer le tag `vX.Y.Z` sur GitHub : jsDelivr le sert immédiatement.
