# Kamerlid — Tweede Kamer Simulatie
## Publiceren op Netlify (stap voor stap)

---

## Mapstructuur
```
indetweedekamer/
├── netlify.toml                    ← Netlify-configuratie
├── index.html                      ← Het spel (geen sleutels in de code)
├── styles.css                      ← Opmaak
├── manifest.json                   ← PWA-manifest
├── service-worker.js               ← Offline-ondersteuning
└── netlify/
    └── functions/
        ├── claude.js               ← Proxy naar Anthropic (API-sleutel staat hier NIET in)
        └── auth.js                 ← Proxy naar Supabase-auth (sleutels staan hier NIET in)
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
3. Sleep de volledige projectmap naar het uploadvenster
4. Netlify geeft je een URL zoals `https://kamerlid-abc123.netlify.app`

**Optie B: via GitHub (aanbevolen voor updates)**
1. Maak een gratis GitHub-account aan op **github.com**
2. Maak een nieuw repository aan en upload de bestanden
3. In Netlify: kies **"Import from Git"** en koppel je GitHub-repository
4. Bij elke update die je naar GitHub pusht, herstart Netlify automatisch

---

## Stap 3 — Sleutels instellen (BELANGRIJK)

De sleutels staan **niet** in de code — je zet ze veilig in Netlify:

1. Ga in Netlify naar jouw site → **"Site configuration"**
2. Klik op **"Environment variables"**
3. Klik **"Add a variable"** en vul in:
   - **Key:** `ANTHROPIC_API_KEY` — **Value:** jouw sleutel (`sk-ant-api03-...`)
   - **Key:** `SUPABASE_ANON_KEY` — **Value:** de anon/public-sleutel van je Supabase-project (te vinden in Supabase onder Project Settings → API)
4. Klik **"Save"**
5. Ga naar **"Deploys"** en klik **"Trigger deploy"** om de site opnieuw op te starten

De sleutels zijn nu alleen zichtbaar voor jou in de Netlify-console,
nooit voor spelers van het spel.

---

## Stap 4 — Spending limit instellen (aanbevolen)

Stel een maandlimiet in zodat kosten altijd beheersbaar blijven:

1. Ga naar **console.anthropic.com**
2. Navigeer naar **"Billing" → "Usage limits"**
3. Stel een maandelijkse limiet in, bijv. **€15**

Bij een volle schoolklas van 30 leerlingen die elk een volledig spel
doorspelen (12 speelweken, model Claude Haiku 4.5) kost dat naar
schatting **€2,45 – €3,20 totaal** — zie `kamerlid-tokenschatting.md`
voor de onderbouwde berekening per AI-call.

---

## Stap 5 — Testen

1. Open de Netlify-URL in je browser
2. Speel een week door en controleer of het dilemma en de moties laden
3. Als er een foutmelding is, controleer in Netlify onder **"Functions"**
   of `claude` en `auth` beide actief zijn en of de omgevingsvariabelen
   correct zijn ingesteld

---

## Lokaal testen (optioneel)

Als je het spel lokaal wilt testen zonder Netlify:
1. Open `index.html` direct in je browser
2. Het spel detecteert automatisch dat je lokaal werkt en probeert
   rechtstreeks verbinding te maken met Anthropic
3. Voer dan tijdelijk je API-sleutel in via de browser-console:
   `state.apiKey = 'sk-ant-...'`

---

## Beveiliging samengevat

| Wat | Waar |
|-----|------|
| API-sleutels | Alleen in Netlify Environment Variables |
| Proxy-code | `netlify/functions/claude.js` en `netlify/functions/auth.js` (op de server) |
| Spelcode | `index.html` (in de browser, geen sleutels) |

De browser communiceert nooit rechtstreeks met Anthropic of Supabase.
Alle API-calls gaan via jouw Netlify-server.
