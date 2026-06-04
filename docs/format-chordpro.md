# Format ChordPro — Tutorial complet

Acest document descrie cum trebuie scrisă o melodie corectă în aplicația Caiet de Cântări.
Se adresează atât oamenilor care adaugă manual cântări, cât și modelelor AI care convertesc imagini/PDF-uri.

---

## 1. Structura unui fișier de cântare

O melodie are trei componente:

1. **Titlu** — numele cântării, fără număr de ordine
2. **Tonalitate** — cheia principală în notație standard
3. **Conținut** — versurile cu acorduri, împărțite pe secțiuni

---

## 2. Markeri de secțiune

Fiecare secțiune începe cu un marker pe o linie separată, fără text după el:

| Marker | Semnificație |
|--------|--------------|
| `{verse}` | Strofă (vers) |
| `{chorus}` | Refren |
| `{bridge}` | Bridge / punte |
| `{intro}` | Intro |
| `{coda}` | Codă / final |

**Regulă:** Între secțiuni se lasă o linie goală.

```
{verse}
Linia 1 a strofei
Linia 2 a strofei

{chorus}
Linia 1 a refrenului
Linia 2 a refrenului

{verse}
Linia 1 a strofei a doua
Linia 2 a strofei a doua
```

---

## 3. Notarea acordurilor în versuri

Acordurile se inserează direct în textul versului, **înaintea literei/silabei pe care cad**, între paranteze drepte:

```
[D]Nădejdea [G]noastră [D]Cine e?
Doar [Bm]Cristos. Doar [A]Cristos.
```

### Regula de poziționare — Metoda picăturii verticale

Imaginează-ți o linie verticală care cade din **centrul** numelui acordului drept în jos până la versul de sub el. Litera pe care o atinge acea linie = locul unde se inserează `[Acord]`.

```
D        G       D
Nădejdea noastră Cine e?
```
→ `[D]Nădejdea [G]noastră [D]Cine e?`

```
     Bm            A
Doar Cristos. Doar Cristos.
```
→ `Doar [Bm]Cristos. Doar [A]Cristos.`

### Acordul cade în mijlocul unui cuvânt

Inserezi `[Acord]` exact înaintea literei respective, **fără cratimă**:

```
✓ CORECT:   mul[C#m]țumim
✗ GREȘIT:   mul-[C#m]țumim
✗ GREȘIT:   [C#m]mulțumim
```

### Acordul cade între două cuvinte

Se pune la începutul cuvântului următor:

```
✓ CORECT:   Slavă [D]Ție
```

---

## 4. Notația acordurilor

### Standard internațional
Aplicația folosește notație anglo-saxonă (nu Do-Re-Mi):

| Notă | Simbol |
|------|--------|
| Do   | C      |
| Re   | D      |
| Mi   | E      |
| Fa   | F      |
| Sol  | G      |
| La   | A      |
| Si   | B      |

### Major vs. Minor
- **Majuscul** = acord major: `D`, `G`, `A`, `E`
- **Minuscul** = acord minor (convenție românească): `d`, `g`, `a`, `e`
- **Sufix `m`** = acord minor (notație standard): `Dm`, `Gm`, `Am`, `Em`

Ambele forme sunt acceptate. **Când converteșți dintr-o imagine**, dacă în imagine scrie `e` (minuscul), convertești în `[Em]`.

### Diezi și bemoli
| Simbol | Exemplu |
|--------|---------|
| `#` = diez | `F#m`, `C#`, `G#m` |
| `b` = bemol | `Bb`, `Eb`, `Ab` |

### Acorduri complexe
```
[Am7]    — la minor cu septimă
[G/B]    — sol cu bas în si
[Dsus4]  — re sus4
[C#m]    — do diez minor
```

---

## 5. Diacritice românești

Se păstrează **întotdeauna** exact:

```
ă  â  î  ș  ț
Ă  Â  Î  Ș  Ț
```

❌ Nu înlocui `ș` cu `s`, `ă` cu `a` etc.

---

## 6. Exemplu complet corect

```
{verse}
[D]Nădejdea [G]noastră [D]Cine e?
Doar [Bm]Cristos. Doar [A]Cristos.
[D]Și sin[F#m]gura [Bm]încredere?
Doar [A]El. Doar [D]El.

{chorus}
[G]Slavă [D]Ție, [A]Doamne!
[Bm]Slavă [G]Ție [A]mereu.
[G]Doar în [D]Tine [A]e speranță,
[Bm]Slavă [A]Ție, [D]Doamne!

{verse}
[D]Nădejdea [G]noastră [D]nu ne lasă,
[Bm]Isus e [A]viu și [D]azi.
[D]El poartă [G]grija [D]casei noastre,
[Bm]Slavă [A]Lui în [D]veci!
```

---

## 7. Greșeli frecvente de evitat

### ❌ Cratimă adăugată pentru acord
```
GREȘIT:  mul-[D]țumesc
CORECT:  mul[D]țumesc
```

### ❌ Acord deplasat față de silabă
```
GREȘIT:  [D] Nădejdea noastră    (spațiu între ] și text)
CORECT:  [D]Nădejdea noastră
```

### ❌ Linie goală lipsă între secțiuni
```
GREȘIT:
{verse}
Linie vers
{chorus}
Linie refren

CORECT:
{verse}
Linie vers

{chorus}
Linie refren
```

### ❌ Text după markerul de secțiune
```
GREȘIT:  {verse} Strofa 1
CORECT:  {verse}
```

### ❌ Notație Do-Re-Mi în loc de C-D-E
```
GREȘIT:  [Re], [Mi minor], [Sol]
CORECT:  [D], [Em], [G]
```

### ❌ Diacritice lipsă
```
GREȘIT:  multumesc, credinta, viata
CORECT:  mulțumesc, credința, viața
```

---

## 8. Ordinea secțiunilor

Secțiunile se scriu în **ordinea muzicală** în care se cântă, nu în ordinea din pagină:

```
{verse}    ← strofa 1
{chorus}   ← refren
{verse}    ← strofa 2
{chorus}   ← refren
{verse}    ← strofa 3
{chorus}   ← refren
{coda}     ← final (dacă există)
```

---

## 9. Instrucțiuni specifice pentru AI

Când analizezi o imagine sau PDF cu o cântare:

1. **Identifică secțiunile** — strofe, refrene, bridge, codă — și ordinea muzicală în care se cântă.
2. **Aplică metoda picăturii verticale** — pentru fiecare acord, trasează o linie verticală din centrul simbolului până la versul de dedesubt. Inserează `[Acord]` înaintea literei atinse.
3. **Nu adăuga niciodată cratimă** în cuvinte pentru a face loc unui acord.
4. **Convertește notația românească**:
   - `e`, `a`, `d`, `g` (minuscul) → `Em`, `Am`, `Dm`, `Gm`
   - `MI MAJOR` → `E`, `mi minor` → `Em`
   - `RE MAJOR` → `D`, `re minor` → `Dm`
   - `SOL MAJOR` → `G`, `la minor` → `Am` etc.
5. **Păstrează diacriticele** românești intacte.
6. **Nu include `{title}` sau `{key}` în conținut** — acestea sunt câmpuri separate în aplicație.
7. **Returnează doar conținutul ChordPro** — fără explicații, fără markdown extra, fără JSON.

---

## 10. Tonalitatea (defaultKey)

Se scrie în notație standard, nu Do-Re-Mi:

| Câmp | Exemplu |
|------|---------|
| Major | `D`, `G`, `A`, `E`, `C`, `F`, `Bb` |
| Minor | `Em`, `Am`, `Dm`, `Bm`, `F#m`, `C#m` |

Tonalitatea reflectă **cheia reală** în care se cântă melodia.


## 11. Diferentiere strofe/refren

-strofele sunt numerotate, de exemplu 1. , 2. , 3. etc.
-refrenul este scris italic
