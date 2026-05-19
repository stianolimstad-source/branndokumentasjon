import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface KonsekvensInput {
  id: string; // numeric index serialisert som string
  tekst: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { topphendelse, beskrivelse, konsekvenser } = await req.json();
    if (!Array.isArray(konsekvenser) || konsekvenser.length < 1) {
      return new Response(
        JSON.stringify({ error: "Krever minst 1 konsekvens for å foreslå konsekvensreduserende tiltak." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const apiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!apiKey) {
      return new Response(JSON.stringify({ error: "Missing LOVABLE_API_KEY" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const konsekvenserNet: KonsekvensInput[] = (konsekvenser as any[]).map((k) => ({
      id: String(k.id ?? ""),
      tekst: String(k.tekst || "Uten navn").slice(0, 200),
    }));

    const systemPrompt = `Du er ekspert på brann- og eksplosjonssikkerhet og bow-tie-analyser i Norge (TEK17, NS 5814).
Du får en topphendelse og en liste over potensielle konsekvenser av at topphendelsen inntreffer.

Oppgave: identifiser KONSEKVENSREDUSERENDE TILTAK – altså barrierer/tiltak som IKKE hindrer at topphendelsen inntreffer, men som reduserer skadeomfanget ETTER at den har inntruffet.

Eksempler på konsekvensreduserende tiltak:
- Automatisk slokkeanlegg (sprinkler) for å begrense brannspredning
- Røykventilasjon / brannventilasjon
- Branncellebegrensning, brannseksjonering (begrenser spredning)
- Tidlig deteksjon og varsling (brannalarm kat. 2)
- Talevarslingsanlegg, rømningsplan, merket rømningsvei
- Brannvesenets innsatstid og tilgjengelighet (slokkemannskap)
- Beredskapsplan, evakueringsøvelser, opplæring av personell
- Manuelle slokkemidler (brannslange, håndslukker)
- Nødbelysning, ledelys
- Brannkummer, tilgang til slokkevann
- Vannspray / kjøling av nabostrukturer for å hindre brannspredning
- Områdesperring, evakuering av nabobygg

Regler:
- Hvert tiltak skal angi hvilke av de oppgitte konsekvensene det reduserer (id-er fra inputen). Et tiltak må dekke minst 1 konsekvens.
- Hvis et tiltak reduserer flere konsekvenser, oppgi alle relevante id-er.
- Tekst skal være kort, konkret og handlingsorientert (maks ~80 tegn). På norsk.
- Bruk anerkjent fagterminologi.
- Slå sammen synonymer (f.eks. "Sprinkler" og "Vannspray innendørs" → "Automatisk slokkeanlegg (sprinkler)") når de dekker samme funksjon.
- Returner BARE et rent JSON-objekt – ingen markdown, ingen forklaring.

Struktur:
{
  "tiltak": [
    { "tekst": "kort tiltaksbeskrivelse", "konsekvensIds": ["id1","id2", ...] }
  ]
}

Hvis ingen relevante konsekvensreduserende tiltak kan foreslås, returner { "tiltak": [] }.`;

    const userContent = JSON.stringify(
      {
        topphendelse: String(topphendelse || "Uten navn"),
        beskrivelse: String(beskrivelse || ""),
        konsekvenser: konsekvenserNet,
      },
      null,
      2,
    );

    const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userContent },
        ],
        response_format: { type: "json_object" },
      }),
    });

    if (!resp.ok) {
      const errText = await resp.text();
      console.error("AI gateway error:", resp.status, errText);
      const status = resp.status === 429 ? 429 : resp.status === 402 ? 402 : 500;
      const msg =
        status === 429
          ? "AI-tjenesten er midlertidig overbelastet. Prøv igjen om litt."
          : status === 402
          ? "Tomt for AI-kreditter. Legg til kreditter i Lovable-arbeidsområdet."
          : `AI feilet (${resp.status})`;
      return new Response(JSON.stringify({ error: msg }), {
        status,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const ai = await resp.json();
    const raw = ai?.choices?.[0]?.message?.content || "{}";
    let parsed: any;
    try {
      parsed = JSON.parse(raw);
    } catch {
      const m = raw.match(/\{[\s\S]*\}/);
      parsed = m ? JSON.parse(m[0]) : { tiltak: [] };
    }

    const validIds = new Set(konsekvenserNet.map((k) => k.id));
    const tiltak = Array.isArray(parsed?.tiltak)
      ? parsed.tiltak
          .map((t: any) => ({
            tekst: String(t?.tekst || "").trim().slice(0, 160),
            konsekvensIds: Array.isArray(t?.konsekvensIds)
              ? t.konsekvensIds.map((x: any) => String(x)).filter((x: string) => validIds.has(x))
              : [],
          }))
          .filter((t: any) => t.tekst && t.konsekvensIds.length >= 1)
      : [];

    return new Response(JSON.stringify({ tiltak }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("analyze-bowtie-mitigations error:", e);
    return new Response(JSON.stringify({ error: (e as Error).message || "Ukjent feil" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
