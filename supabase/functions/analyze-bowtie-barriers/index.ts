import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ArsakInput {
  id: string;
  tittel: string;
  tiltak: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { topphendelse, beskrivelse, arsaker } = await req.json();
    if (!Array.isArray(arsaker) || arsaker.length < 2) {
      return new Response(
        JSON.stringify({ error: "Krever minst 2 årsaker for å finne felles barrierer." }),
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

    const arsakerNet: ArsakInput[] = (arsaker as any[]).map((a) => ({
      id: String(a.id || ""),
      tittel: String(a.tittel || "Uten navn").slice(0, 120),
      tiltak: String(a.tiltak || "").slice(0, 1200),
    }));

    const systemPrompt = `Du er ekspert på brann- og eksplosjonssikkerhet og bow-tie-analyser i Norge (TEK17, NS 5814).
Du får en topphendelse og en liste over årsaker (hver med egne registrerte tiltak/barrierer).

Oppgave: identifiser PREVENTIVE BARRIERER som er felles for FLERE av årsakene — altså barrierer/tiltak som forebygger at to eller flere av disse årsakene utløser topphendelsen.

Regler:
- En barriere må dekke MINST 2 årsaker for å inkluderes.
- Tekst skal være kort, konkret og handlingsorientert (maks ~80 tegn). På norsk.
- Bruk anerkjent fagterminologi (f.eks. "Automatisk slokkeanlegg (sprinkler)", "Termografering av el-anlegg", "Adgangskontroll og låste tekniske rom", "Brannvarslingsanlegg kat. 2").
- Slå sammen synonymer (f.eks. "Sprinkler" og "Vannspray" → "Automatisk slokkeanlegg") når de dekker samme funksjon.
- Returner BARE et rent JSON-objekt – ingen markdown, ingen forklaring.

Struktur:
{
  "barrierer": [
    { "tekst": "kort barrierebeskrivelse", "arsakIds": ["id1","id2", ...] }
  ]
}

Hvis ingen felles barrierer kan identifiseres, returner { "barrierer": [] }.`;

    const userContent = JSON.stringify(
      {
        topphendelse: String(topphendelse || "Uten navn"),
        beskrivelse: String(beskrivelse || ""),
        arsaker: arsakerNet,
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
      parsed = m ? JSON.parse(m[0]) : { barrierer: [] };
    }

    const validIds = new Set(arsakerNet.map((a) => a.id));
    const barrierer = Array.isArray(parsed?.barrierer)
      ? parsed.barrierer
          .map((b: any) => ({
            tekst: String(b?.tekst || "").trim().slice(0, 160),
            arsakIds: Array.isArray(b?.arsakIds)
              ? b.arsakIds.map((x: any) => String(x)).filter((x: string) => validIds.has(x))
              : [],
          }))
          .filter((b: any) => b.tekst && b.arsakIds.length >= 2)
      : [];

    return new Response(JSON.stringify({ barrierer }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("analyze-bowtie-barriers error:", e);
    return new Response(JSON.stringify({ error: (e as Error).message || "Ukjent feil" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
