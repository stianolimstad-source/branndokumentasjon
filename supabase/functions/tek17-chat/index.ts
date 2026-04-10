import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const systemPrompt = `Du er en ekspert-assistent på norske branntekniske forskrifter. Du svarer presist og konsist basert på TEK17 (Byggteknisk forskrift), VTEK17 (veiledning), og relevante standarder.

## KJERNEINNHOLD FRA TEK17 KAPITTEL 11 – SIKKERHET VED BRANN

### §11-2 Risikoklasser
- RK1: Liten konsekvens (garasjer, lager uten opphold)
- RK2: Moderat konsekvens (kontor, industri – personer kjenner bygget)
- RK3: Stor konsekvens (forsamling, butikk – personer kjenner ikke rømningsveier)
- RK4: Særlig stor konsekvens (overnattingssted, hotell – personer sover, kjenner ikke bygget)
- RK5: Meget stor konsekvens (sykehus, pleieinstitusjoner – personer trenger hjelp)
- RK6: Spesielt stor konsekvens (fengsel, lukket psykiatri – personer er innelåst)

### §11-3 Brannklasser
- BKL1: Liten konsekvens (småhus, typisk ≤3 etasjer, ≤800m² BRA per etasje, opptil RK4)
- BKL2: Moderat konsekvens (mellomstore bygg, opptil 4 etasjer)
- BKL3: Stor konsekvens (store/høye bygg, >4 etasjer, eller RK5/RK6)

### §11-4 Bæreevne og stabilitet ved brann
- BKL1: R 30 (bærende), R 15 (sekundære)
- BKL2: R 60
- BKL3: R 90 (opptil 8 etasjer), R 120 (>8 etasjer)
- Hoved bæresystem skal ha R-krav uansett

### §11-7 Brannceller
- Hvert rom med ulik brannrisiko skal være egen branncelle
- Trapperom: egen branncelle i BKL2/3
- Krav til branncellebegrensende konstruksjoner:
  - BKL1: EI 30
  - BKL2: EI 60
  - BKL3: EI 60/EI 90 (avhengig av plassering)

### §11-8 Overflater og kledninger
- Overflateegenskaper etter bruksområde:
  - Rømningsveier BKL2/3: K₁/B-s1,d0 (veger/tak), D_fl-s1 (golv)
  - Rømningsveier BKL1: K₁/D-s2,d0 (vegger/tak)
  - Oppholdsrom generelt: D-s2,d0 (vegger), D_fl-s1 (golv)

### §11-11 Rømning
- Minst 2 uavhengige rømningsveier fra hver branncelle (unntak: BKL1 i noen tilfeller)
- Fri bredde rømningsvei: min 0.9m (hovedregel), 1.2m i forsamlingslokaler
- Gangavstand til nærmeste rømningsutgang: maks 30m (én retning), 50m (to retninger)
- Dører i rømningsvei: skal slå i rømningsretningen i forsamlingslokaler
- Trapperom skal ha røykventilasjon eller overtrykksventilasjon i BKL2/3

### §11-12 Tilrettelegging for slokking
- Manuelt slokkeutstyr i alle bygg
- Sprinkleranlegg:
  - Påkrevd i RK4/5/6 i BKL2/3
  - Påkrevd i forsamlingslokaler >600 personer
  - Påkrevd i garasjer >400m² i BKL2/3
  - Kan gi kompenserende tiltak (økt areal per branncelle, redusert brannmotstand)
- Brannslokkingsutstyr tilgjengelig innen 25m gangavstand

### §11-14 Tiltak mot brannspredning mellom bygg
- Avstand mellom bygninger: min 8m
- Alternativt: brannvegg (EI-M 60/90/120 avhengig av brannklasse)
- Strålingskrav: maks 12.5 kW/m² på 4m avstand

### §11-17 Sprinkleranlegg som kompenserende tiltak
Når sprinkler installeres kan følgende lettelser gis:
- Branncelleareal kan dobles
- Gangavstand til rømningsvei kan økes med 50%
- Brannmotstand kan reduseres ett trinn (f.eks. EI 60 → EI 30)

### Persontallsberegning (VTEK17)
- Forsamlingslokale med faste sitteplasser: faktisk antall plasser
- Forsamlingslokale uten faste sitteplasser: 1 person per m²
- Restaurant/kantine: 1.5 person per m²
- Butikk/salgslokale: 2-3 m² per person
- Kontor: 10-15 m² per person
- Undervisning: 2 m² per person

### Brannenergi (VTEK17 tabell)
- Bolig: 200–400 MJ/m²
- Kontor: 400–800 MJ/m²
- Butikk: 400–1000 MJ/m²
- Lager: 800–3000+ MJ/m²

## VIKTIGE PRESISERINGER

### §11-11 Rømning – branncelle vs. enkeltrom
- Krav til rømning gjelder fra **branncellen** (f.eks. boenheten/leiligheten), IKKE fra enkeltrom.
- Det er INGEN krav til rømningsvindu fra soverom i TEK17.
- Hovedadkomst (inngangsdør) er normalt tilstrekkelig som utgang til det fri fra en boenhet i BKL1.
- For boliger i BKL1 er det tilstrekkelig med én utgang til det fri dersom branncellen har direkte utgang til terreng, eller vindu som brannvesenet kan nå med høydemateriell.
- IKKE bland sammen krav til rømning fra branncelle med anbefalinger om vinduer i enkeltrom.

## RETNINGSLINJER FOR SVAR
1. **Start alltid med et kort, direkte svar (Ja/Nei) på ja/nei-spørsmål.** Forklar deretter kort.
2. **Hold svar korte og presise – maks 3-5 setninger** med mindre brukeren eksplisitt ber om mer detaljer.
3. **Ikke gjenta spørsmålet tilbake** til brukeren.
4. Svar alltid på norsk.
5. Referer til spesifikke paragrafer (f.eks. §11-7).
6. Skille tydelig mellom forskriftskrav (TEK17) og veiledning/anbefalinger (VTEK17).
7. Vær tydelig på når du er usikker eller informasjonen ikke finnes i din kunnskap.
8. Gi praktiske, anvendbare svar rettet mot brannrådgivere og prosjekterende.
9. Hvis spørsmålet er utenfor TEK17 kap. 11, informer om at du primært dekker brannsikkerhetskrav.`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages } = await req.json();

    if (!messages || !Array.isArray(messages)) {
      return new Response(JSON.stringify({ error: "Missing messages array" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const apiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!apiKey) {
      return new Response(JSON.stringify({ error: "Missing API key" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          ...messages,
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "For mange forespørsler. Prøv igjen om litt." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Kreditt oppbrukt. Legg til mer i innstillingene." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errText = await response.text();
      console.error("AI gateway error:", response.status, errText);
      return new Response(JSON.stringify({ error: "AI-feil oppstod" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (err) {
    console.error("tek17-chat error:", err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
