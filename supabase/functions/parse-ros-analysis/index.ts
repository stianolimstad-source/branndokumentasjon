import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { documentText } = await req.json();
    if (!documentText || typeof documentText !== "string") {
      return new Response(JSON.stringify({ error: "Missing documentText" }), {
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

    const systemPrompt = `Du er ekspert på risiko- og sårbarhetsanalyser (ROS) for brann i Norge.
Du får råtekst (CSV/Excel/PDF/Word) fra en eksisterende ROS-analyse og skal trekke ut ALLE hendelser/sårbarheter.

Returner BARE et rent JSON-objekt (ingen markdown, ingen forklaring), med denne strukturen:
{
  "metadata": { "prosjektnavn": "", "adresse": "", "oppdragsgiver": "" },
  "hendelser": [
    {
      "tittel": "",
      "sarbarhet": "",
      "hendelse": "",
      "arsak": "",
      "beskrivelseSannsynlighetFor": "",
      "beskrivelseRisikoFor": "",
      "sannsynlighet": 1,
      "konsekvens": 1,
      "tiltak": "",
      "beskrivelseEtter": "",
      "sannsynlighetEtter": 1,
      "konsekvensEtter": 1,
      "restrisiko": ""
    }
  ]
}

Mapping-regler:
- "Sårbarhet" → sarbarhet
- "Hendelse/Scenario" → hendelse
- tittel = kombiner "sarbarhet – hendelse" hvis begge finnes; ellers det som finnes.
- "Årsak" → arsak (la stå tom hvis mangler).
- "Beskrivelse av sannsynlighet" (før tiltak) → beskrivelseSannsynlighetFor
- "Beskrivelse av konsekvens" eller "Beskrivelse av risiko" (før tiltak) → beskrivelseRisikoFor
- "Sannsynlighet" (1-5) → sannsynlighet. Tekst-mapping: Svært lite sannsynlig=1, Lite sannsynlig/Liten=2, Sannsynlig/Moderat=3, Meget sannsynlig=4, Svært sannsynlig=5.
- "Konsekvens" (1-5) → konsekvens. Tekst: Ufarlig=1, En viss fare/Liten=2, Farlig/Moderat=3, Kritisk/Alvorlig=4, Katastrofal=5.
- "Forebyggende og avhjelpende tiltak" / "Tiltak" → tiltak
- "Beskrivelse av sannsynlighet og konsekvens etter tiltak" → beskrivelseEtter
- "S etter" / "Sannsynlighet etter tiltak" → sannsynlighetEtter (samme tekst-mapping). Hvis ikke oppgitt: bruk samme verdi som sannsynlighet.
- "K etter" / "Konsekvens etter tiltak" → konsekvensEtter (samme regel).
- "Restrisiko" → restrisiko
- Hvis S/K mangler: bruk 1.
- Klamp alltid alle S/K-verdier til heltall 1-5.
- Ignorer rader uten meningsfullt innhold.
- Inkluder ALLE hendelser, også 40+ hvis de finnes.`;

    const truncated = documentText.slice(0, 80000);

    const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `Trekk ut alle hendelser fra denne ROS-analysen:\n\n${truncated}` },
        ],
        response_format: { type: "json_object" },
      }),
    });

    if (!resp.ok) {
      const errText = await resp.text();
      console.error("AI gateway error:", resp.status, errText);
      return new Response(JSON.stringify({ error: `AI feilet (${resp.status})` }), {
        status: resp.status === 429 ? 429 : 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const ai = await resp.json();
    const content = ai?.choices?.[0]?.message?.content || "{}";
    let parsed: any;
    try {
      parsed = JSON.parse(content);
    } catch {
      const m = content.match(/\{[\s\S]*\}/);
      parsed = m ? JSON.parse(m[0]) : { hendelser: [] };
    }

    // Sanitize
    const hendelser = Array.isArray(parsed?.hendelser) ? parsed.hendelser : [];
    const clean = hendelser.map((h: any) => ({
      tittel: String(h?.tittel || "").slice(0, 300),
      beskrivelse: String(h?.beskrivelse || ""),
      arsak: String(h?.arsak || ""),
      sannsynlighet: Math.max(1, Math.min(5, parseInt(h?.sannsynlighet) || 1)),
      konsekvens: Math.max(1, Math.min(5, parseInt(h?.konsekvens) || 1)),
      tiltak: String(h?.tiltak || ""),
      restrisiko: String(h?.restrisiko || ""),
    }));

    const metadata = {
      prosjektnavn: String(parsed?.metadata?.prosjektnavn || ""),
      adresse: String(parsed?.metadata?.adresse || ""),
      oppdragsgiver: String(parsed?.metadata?.oppdragsgiver || ""),
    };

    return new Response(JSON.stringify({ data: { metadata, hendelser: clean } }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err: any) {
    console.error(err);
    return new Response(JSON.stringify({ error: err?.message || "Ukjent feil" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
