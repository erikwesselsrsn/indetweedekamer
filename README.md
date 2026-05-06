# Kamerlid — Tweede Kamer Simulatie
## Publiceren op Netlify (stap voor stap)

---

## Mapstructuur
```
kamerlid-netlify/
├── netlify.toml                    ← Netlify-configuratie
├── netlify/
│   └── functions/
│       └── claude.js              ← Proxy (API-sleutel staat hier NIET in)
└── public/
    └── index.html                 ← Het spel (geen API-sleutel in de code)
```

---

## Stap 1 — Netlify-account aanmaken
1. Ga naar **netlify.com** en maak een gratis account aan
2. Je hebt geen creditcard nodig voor het gratis plan

---

## Stap 2 — Project uploaden

**Optie A: via de browser (eenvoudigst)**
1. Ga naar **app.netlify.com**
2. Klik op **"Add new site" → "Deploy manually"**
3. Sleep de volledige map `kamerlid-netlify` naar het uploadvenster
4. Netlify geeft je een URL zoals `https://kamerlid-abc123.netlify.app`

**Optie B: via GitHub (aanbevolen voor updates)**
1. Maak een gratis GitHub-account aan op **github.com**
2. Maak een nieuw repository aan en upload de bestanden
3. In Netlify: kies **"Import from Git"** en koppel je GitHub-repository
4. Bij elke update die je naar GitHub pusht, herstart Netlify automatisch

---

## Stap 3 — API-sleutel instellen (BELANGRIJK)

De sleutel staat **niet** in de code — je zet hem veilig in Netlify:

1. Ga in Netlify naar jouw site → **"Site configuration"**
2. Klik op **"Environment variables"**
3. Klik **"Add a variable"**
4. Vul in:
   - **Key:** `ANTHROPIC_API_KEY`
   - **Value:** jouw sleutel (`sk-ant-api03-...`)
5. Klik **"Save"**
6. Ga naar **"Deploys"** en klik **"Trigger deploy"** om de site opnieuw op te starten

De sleutel is nu alleen zichtbaar voor jou in de Netlify-console,
nooit voor spelers van het spel.

---

## Stap 4 — Spending limit instellen (aanbevolen)

Stel een maandlimiet in zodat kosten altijd beheersbaar blijven:

1. Ga naar **console.anthropic.com**
2. Navigeer naar **"Billing" → "Usage limits"**
3. Stel een maandelijkse limiet in, bijv. **€15**

Bij een volle schoolklas van 30 leerlingen die elk een volledig spel spelen
kost dat circa **€1–3 totaal**.

---

## Stap 5 — Testen

1. Open de Netlify-URL in je browser
2. Speel een week door en controleer of het dilemma en de moties laden
3. Als er een foutmelding is, controleer in Netlify onder **"Functions" → "claude"**
   of de function actief is en of de omgevingsvariabele correct is ingesteld

---

## Lokaal testen (optioneel)

Als je het spel lokaal wilt testen zonder Netlify:
1. Open `public/index.html` direct in je browser
2. Het spel detecteert automatisch dat je lokaal werkt en probeert
   rechtstreeks verbinding te maken met Anthropic
3. Voer dan tijdelijk je API-sleutel in via de browser-console:
   `state.apiKey = 'sk-ant-...'`

---

## Beveiliging samengevat

| Wat | Waar |
|-----|------|
| API-sleutel | Alleen in Netlify Environment Variables |
| Proxy-code | `netlify/functions/claude.js` (op de server) |
| Spelcode | `public/index.html` (in de browser, geen sleutel) |

De browser communiceert nooit rechtstreeks met Anthropic.
Alle API-calls gaan via jouw Netlify-server.
