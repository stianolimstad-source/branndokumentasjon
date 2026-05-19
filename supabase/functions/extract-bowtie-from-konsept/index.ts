import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ArsakInput {
  id: string;
  tittel: string;
  tiltak?: string;
}
interface KonsekvensInput {
  id: string;
  tekst: string;
}

/**
 * Reduserer fire_concepts.content til en kompakt tekstrepresentasjon
 * av tiltak fra kapittel 3 (§11-4 til §11-17). Vi sender bare relevante
 * felter — ikke metadata, bilder, fravik etc.
 */
function summarizeKonsept(content: Record<string, any>): string {
  if (!content || typeof content !== "object") return "";
  const skip = new Set([
    "adresse", "gnr", "bnr", "kommune", "etasjer", "areal", "kunde", "drift",
    "fravik", "bilder", "vedlegg", "scopeImage", "logo", "revisjon",
    "metadata", "innledning", "kapittel2", "kapittel4", "kapittel5", "kapittel6",
    "metode", "deltakere",
  ]);
  const lines: string[] = [];
  const walk = (obj: any, prefix = "") => {
    if (obj == null) return;
    if (Array.isArray(obj)) {
      obj.forEach((v, i) => walk(v, `${prefix}[${i}]`));
      return;
    }
    if (typeof obj === "object") {
      for (const [k, v] of Object.entries(obj)) {
        if (skip.has(k)) continue;
        walk(v, prefix ? `${prefix}.${k}` : k);
      }
      return;
    }
    // primitiv
    if (typeof obj === "boolean") {
      if (obj === true) lines.push(`${prefix}: ja`);
      return;
    }
    const s = String(obj).trim();
    if (!s || s === "0" || s === "false") return;
    if (s.length > 400) return; // unngå svære bilde/base64-felt
    lines.push(`${prefix}: ${s}`);
  };
  walk(content);
  // begrens størrelse
  return lines.slice(0, 600).join("\n");
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const body = await req.json();
    const type: "barrier" | "mitigation" = body?.type === "mitigation" ? "mitigation" : "barrier";
    const topphendelse = String(body?.topphendelse || "Uten navn");
    const beskrivelse = String(body?.beskrivelse || "");
    const konseptContent = body?.konseptContent;
    const arsaker: ArsakInput[] = Array.isArray(body?.arsaker) ? body.arsaker : [];
    const konsekvenser: KonsekvensInput[] = Array.isArray(body?.konsekvenser) ? body.konsekvenser : [];

    if (!konseptContent || typeof konseptContent !== "object") {
      return new Response(
        JSON.stringify({ error: "Ingen brannkonsept funnet for prosjektet." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }
    if (type === "barrier" && arsaker.length < 1) {
      return new Response(
        JSON.stringify({ error: "Krever minst 1 årsak." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
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

    const konseptSammendrag = summarizeKonsept(konseptContent);

    const systemPrompt = type === "barrier"
      ? `Du er ekspert på brann- og eksplosjonssikkerhet i Norge (TEK17, NS 5814) og bow-tie-analyser.

Du får:
1) En topphendelse og dens årsaker fra en ROS-analyse.
2) Et sammendrag av brannkonseptets kapittel 3 (§11-4 til §11-17) for samme prosjekt — altså de tekniske/organisatoriske tiltakene som ALLEREDE er prosjektert.

Oppgave: identifiser PREVENTIVE BARRIERER som allerede er etablert i brannkonseptet, og som virker FOREBYGGENDE mot at en eller flere av årsakene utløser topphendelsen.

Regler:
- Bruk KUN tiltak som faktisk fremkommer av konsept-sammendraget. Ikke finn opp tiltak.
- Hver barriere må knyttes til minst én årsak-id fra inputen.
- Angi paragraf-referanse i feltet "kildeRef" når mulig (f.eks. "§11-12 Brannalarmanlegg", "§11-7 Brannseksjonering", "§11-9 Materialer").
- Tekst skal være kort og handlingsorientert (maks ~80 tegn). På norsk.
- Slå sammen synonymer.
- Returner KUN et rent JSON-objekt, ingen markdown.

Struktur:
{
  "barrierer": [
    { "tekst": "kort barrierebeskrivelse", "arsakIds": ["id1","id2"], "kildeRef": "§11-x …" }
  ]
}
Hvis ingen relevante barrierer finnes i konseptet, returner { "barrierer": [] }.`
      : `Du er ekspert på brann- og eksplosjonssikkerhet i Norge (TEK17, NS 5814) og bow-tie-analyser.

Du får:
1) En topphendelse og dens konsekvenser fra en ROS-analyse.
2) Et sammendrag av brannkonseptets kapittel 3 (§11-4 til §11-17) for samme prosjekt — altså de tiltakene som ALLEREDE er prosjektert.

Oppgave: identifiser KONSEKVENSREDUSERENDE TILTAK som allerede er etablert i brannkonseptet (sprinkler, brannseksjonering, brannalarm, røykventilasjon, stigerør, branncellebegrensning, talevarsling, brannvesenets innsats osv.) og som reduserer en eller flere av de oppgitte konsekvensene ETTER at topphendelsen har inntruffet.

Regler:
- Bruk KUN tiltak som faktisk fremkommer av konsept-sammendraget. Ikke finn opp tiltak.
- Hvert tiltak må knyttes til minst én konsekvens-id (tall fra inputen).
- Angi paragraf-referanse i "kildeRef" når mulig (f.eks. "§11-12 Brannalarmanlegg", "§11-14 Slokkeanlegg", "§11-17 Slokkemannskap").
- Tekst kort og handlingsorientert (maks ~80 tegn). På norsk.
- Slå sammen synonymer.
- Returner KUN et rent JSON-objekt, ingen markdown.

Struktur:
{
  "tiltak": [
    { "tekst": "kort tiltaksbeskrivelse", "konsekvensIds": ["0","2"], "kildeRef": "§11-x …" }
  ]
}
Hvis ingen relevante tiltak finnes i konseptet, returner { "tiltak": [] }.`;

    const userPayload = type === "barrier"
      ? {
          topphendelse,
          beskrivelse,
          arsaker: arsaker.map((a) => ({
            id: String(a.id || ""),
            tittel: String(a.tittel || "").slice(0, 200),
          })),
          brannkonseptKap3: konseptSammendrag,
        }
      : {
          topphendelse,
          beskrivelse,
          konsekvenser: konsekvenser.map((k) => ({
            id: String(k.id ?? ""),
            tekst: String(k.tekst || "").slice(0, 200),
          })),
          brannkonseptKap3: konseptSammendrag,
        };

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
      const validIds = new Set(arsaker.map((a) => String(a.id)));
      const barrierer = Array.isArray(parsed?.barrierer)
        ? parsed.barrierer
            .map((b: any) => ({
              tekst: String(b?.tekst || "").trim().slice(0, 160),
              arsakIds: Array.isArray(b?.arsakIds)
                ? b.arsakIds.map((x: any) => String(x)).filter((x: string) => validIds.has(x))
                : [],
              kildeRef: b?.kildeRef ? String(b.kildeRef).slice(0, 80) : undefined,
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
              kildeRef: t?.kildeRef ? String(t.kildeRef).slice(0, 80) : undefined,
            }))
            .filter((t: any) => t.tekst && t.konsekvensIds.length >= 1)
        : [];
      return new Response(JSON.stringify({ tiltak }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
  } catch (e) {
    console.error("extract-bowtie-from-konsept error:", e);
    return new Response(JSON.stringify({ error: (e as Error).message || "Ukjent feil" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
