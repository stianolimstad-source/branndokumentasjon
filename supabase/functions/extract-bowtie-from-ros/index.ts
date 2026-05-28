import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface HendelseKap3 {
  id: string;
  tittel: string;
  tiltak?: string;
  beskrivelseEtter?: string;
}
interface KonsekvensInput {
  id: string;
  tekst: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const body = await req.json();
    const type: "barrier" | "mitigation" = body?.type === "mitigation" ? "mitigation" : "barrier";
    const topphendelse = String(body?.topphendelse || "Uten navn");
    const beskrivelse = String(body?.beskrivelse || "");
    const hendelserKap3: HendelseKap3[] = Array.isArray(body?.hendelserKap3) ? body.hendelserKap3 : [];
    const konsekvenser: KonsekvensInput[] = Array.isArray(body?.konsekvenser) ? body.konsekvenser : [];

    if (hendelserKap3.length < 1) {
      return new Response(
        JSON.stringify({ error: "Ingen hendelser fra kap. 3 mottatt." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const harTekst = hendelserKap3.some((h) => (h.tiltak || "").trim().length > 0);
    if (!harTekst) {
      return new Response(
        JSON.stringify(type === "barrier" ? { barrierer: [] } : { tiltak: [] }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    if (type === "mitigation" && konsekvenser.length < 1) {
      return new Response(
        JSON.stringify({ error: "Krever minst 1 konsekvens." }),
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

    const hendelserKomp = hendelserKap3.map((h) => ({
      id: String(h.id),
      tittel: String(h.tittel || "").slice(0, 200),
      tiltak: String(h.tiltak || "").slice(0, 2000),
      beskrivelseEtter: String(h.beskrivelseEtter || "").slice(0, 800),
    }));

    const systemPrompt = type === "barrier"
      ? `Du er ekspert på brann- og eksplosjonssikkerhet i Norge (TEK17, NS 5814) og bow-tie-analyser.

Du får en topphendelse i en ROS-analyse, og en liste hendelser (årsaker) fra ROS-analysens kapittel 3. Hver hendelse har et fritekst-felt "tiltak" som inneholder de tiltakene som allerede er beskrevet i ROS-analysen.

Oppgave: trekk ut FOREBYGGENDE BARRIERER fra disse tiltak-tekstene – altså tiltak som hindrer at årsaken utløser topphendelsen.

Regler:
- Bruk KUN tiltak som faktisk fremkommer i tekstene. Ikke finn opp nye.
- Splitt sammensatte tekster i enkelt-tiltak (én barriere pr. konkret tiltak).
- Hver barriere må knyttes til minst én hendelse-id ("arsakIds").
- Sett "kildeRef" til hendelsens tittel (kort, maks 60 tegn).
- Hopp over rene konsekvensreduserende tiltak (sprinkler/alarm/seksjonering/evakuering/slokkemannskap) – de hører til mitigation, ikke barrierer.
- Kort tekst, handlingsorientert (maks ~80 tegn), norsk.
- Slå sammen synonymer.
- Returner KUN rent JSON, ingen markdown:
{ "barrierer": [ { "tekst": "...", "arsakIds": ["id"], "kildeRef": "hendelsestittel" } ] }
Hvis ingen relevante barrierer finnes: { "barrierer": [] }.`
      : `Du er ekspert på brann- og eksplosjonssikkerhet i Norge (TEK17, NS 5814) og bow-tie-analyser.

Du får en topphendelse, dens konsekvenser, og en liste hendelser fra ROS-analysens kapittel 3. Hver hendelse har et fritekst-felt "tiltak" som inneholder tiltakene som er beskrevet i ROS-analysen.

Oppgave: trekk ut KONSEKVENSREDUSERENDE TILTAK fra tiltak-tekstene – altså tiltak som begrenser skadeomfanget ETTER at topphendelsen har inntruffet (sprinkler/slokkeanlegg, røykventilasjon, brannseksjonering, branncellebegrensning, brannalarm/talevarsling, slokkemannskap/innsatstid, beredskap, manuelle slokkemidler, nødbelysning osv.).

Regler:
- Bruk KUN tiltak som faktisk fremkommer i tekstene. Ikke finn opp nye.
- Splitt sammensatte tekster i enkelt-tiltak.
- Hvert tiltak må knyttes til minst én konsekvens-id (tall som streng) fra inputen.
- Sett "kildeRef" til hendelsens tittel (kort, maks 60 tegn).
- Hopp over rene forebyggende tiltak.
- Kort tekst, handlingsorientert (maks ~80 tegn), norsk.
- Slå sammen synonymer.
- Returner KUN rent JSON, ingen markdown:
{ "tiltak": [ { "tekst": "...", "konsekvensIds": ["0","1"], "kildeRef": "hendelsestittel" } ] }
Hvis ingen relevante tiltak finnes: { "tiltak": [] }.`;

    const userPayload = type === "barrier"
      ? { topphendelse, beskrivelse, hendelserKap3: hendelserKomp }
      : {
          topphendelse,
          beskrivelse,
          konsekvenser: konsekvenser.map((k) => ({ id: String(k.id ?? ""), tekst: String(k.tekst || "").slice(0, 200) })),
          hendelserKap3: hendelserKomp,
        };

    const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-2.5-pro",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: JSON.stringify(userPayload, null, 2) },
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
      parsed = m ? JSON.parse(m[0]) : {};
    }

    if (type === "barrier") {
      const validIds = new Set(hendelserKomp.map((h) => h.id));
      const barrierer = Array.isArray(parsed?.barrierer)
        ? parsed.barrierer
            .map((b: any) => ({
              tekst: String(b?.tekst || "").trim().slice(0, 160),
              arsakIds: Array.isArray(b?.arsakIds)
                ? b.arsakIds.map((x: any) => String(x)).filter((x: string) => validIds.has(x))
                : [],
              kildeRef: b?.kildeRef ? String(b.kildeRef).slice(0, 60) : undefined,
            }))
            .filter((b: any) => b.tekst && b.arsakIds.length >= 1)
        : [];
      return new Response(JSON.stringify({ barrierer }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    } else {
      const validIds = new Set(konsekvenser.map((k) => String(k.id)));
      const tiltak = Array.isArray(parsed?.tiltak)
        ? parsed.tiltak
            .map((t: any) => ({
              tekst: String(t?.tekst || "").trim().slice(0, 160),
              konsekvensIds: Array.isArray(t?.konsekvensIds)
                ? t.konsekvensIds.map((x: any) => String(x)).filter((x: string) => validIds.has(x))
                : [],
              kildeRef: t?.kildeRef ? String(t.kildeRef).slice(0, 60) : undefined,
            }))
            .filter((t: any) => t.tekst && t.konsekvensIds.length >= 1)
        : [];
      return new Response(JSON.stringify({ tiltak }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
  } catch (e) {
    console.error("extract-bowtie-from-ros error:", e);
    return new Response(JSON.stringify({ error: (e as Error).message || "Ukjent feil" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
