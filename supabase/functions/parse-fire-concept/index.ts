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
    const { documentText, documentType: rawDocType } = await req.json();
    const documentType: "brannkonsept" | "tilstandsvurdering" =
      rawDocType === "tilstandsvurdering" ? "tilstandsvurdering" : "brannkonsept";

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

    const docTypeText =
      documentType === "tilstandsvurdering"
        ? "en brannteknisk tilstandsvurdering av et eksisterende bygg"
        : "et brannkonsept for et nytt eller ombygget tiltak";

    const extraTilstand =
      documentType === "tilstandsvurdering"
        ? `\n\nDokumentet er en TILSTANDSVURDERING / TILSTANDSRAPPORT av et eksisterende bygg.
- Slike rapporter har vanligvis en seksjon "Bygningsopplysninger", "Generelt om bygget", "Nøkkeldata" eller liknende — let der etter byggeår, antall etasjer, BRA/bruksareal, gnr/bnr, kommune og bygningstype.
- Det finnes ofte en seksjon "Brannteknisk tilstand", "Avvik", "Branntekniske forhold" eller "Tiltak" — bruk denne til å vurdere kapittel 3-feltene (sprinkler, brannalarm, ledesystem, rømningsveier osv.).
- Let etter byggeår og opprinnelig regelverk (BF85 = Byggeforskrift 1985, TEK97, TEK10 eller TEK17). Bygg fra før 1997 er ofte BF85; 1997–2010 er TEK97; 2010–2017 er TEK10; etter 2017 er TEK17.
- Branncellevegger angitt som B30/B60/A30/A60 indikerer ofte BF85 eller TEK97. EI 30/EI 60 indikerer TEK10/TEK17.
- For BF85: let etter "bygningsbrannklasse" A, B eller C.

I tillegg skal du hente ut alle REGISTRERTE AVVIK fra rapporten og returnere dem i feltet "avvik" (array). Hvert avvik MÅ være ett konkret forhold (ikke en hel paragraf-overskrift). Format:
{
  "sectionKey": "3_5",      // se mapping nedenfor — én av 3_1..3_14
  "kind": "tiltak",          // "tiltak" hvis rapporten sier det må utbedres / settes i stand; "fravik" hvis rapporten konkluderer at det aksepteres og dokumenteres som fravik. Default "tiltak" ved tvil.
  "grad": "tg2",             // NS 3424 tilstandsgrad: "tg0" ingen, "tg1" mindre, "tg2" vesentlige, "tg3" store/alvorlige, "tgiu" ikke undersøkt. Bruk "tg2" som default for konkrete avvik, "tg3" der rapporten beskriver alvorlige svikt.
  "beskrivelse": "..."      // 1–3 setninger som beskriver selve avviket. Aldri tom — drop avviket i stedet.
}

Mapping fra typiske paragraf-/temanavn til sectionKey:
- §11-4 / bæreevne, stabilitet → "3_1"
- §11-5 / eksplosjon → "3_2"
- §11-6 / brannspredning mellom byggverk, avstand til nabobygg → "3_3"
- §11-7 / brannseksjonering, brannvegg, seksjoneringsvegg → "3_4"
- §11-8 / brannceller, EI-vegger, branncelledører, gjennomføringer i branncellevegg → "3_5"
- §11-9 / overflater, materialer, kledning, isolasjon → "3_6"
- §11-10 / tekniske installasjoner, ventilasjon, kanalgjennomføringer, sjakter → "3_7"
- §11-11 / rømning og redning generelt, redningsinnsats → "3_8"
- §11-12 / tilrettelegging for rømning, brannalarm, ledesystem, sprinkler, slokkeanlegg → "3_9"
- §11-13 / utgang fra branncelle → "3_10"
- §11-13–§11-14 / rømningsvei, trapperom, korridor → "3_11"
- §11-15 / husdyr, husdyrrom → "3_12"
- §11-16 / manuell slokking, brannslange, håndslukker → "3_13"
- §11-17 / tilrettelegging for slokkemannskap, oppstillingsplass, stigeledning → "3_14"

For BF85-rapporter: bruk samme mapping basert på tema (f.eks. BF85 §7 om rømningsvei → "3_11", BF85 §30 om brannvegg → "3_4"). Ved tvil, velg den mest tematisk passende sectionKey.
Hvis dokumentet ikke inneholder noen avvik, returner "avvik": [].`
        : "";

    const systemPrompt = `Du er en ekspert på brannteknisk prosjektering i Norge (TEK17/VTEK17, TEK10, TEK97 og Byggeforskrift 1985 (BF85)). Du skal analysere ${docTypeText} og trekke ut relevant informasjon.

Returner BARE et JSON-objekt (ingen markdown, ingen forklaring). Bruk tomme strenger "" eller null for felter du IKKE finner eksplisitt informasjon om. IKKE GJETT — kun verdier som er direkte støttet av dokumentet.

Struktur:
{
  "oppdragsgiver": "",
  "prosjektnavn": "",
  "adresse": "",
  "gnr": "",
  "bnr": "",
  "kommune": "",
  "tiltakstype": "",
  "tiltaksbeskrivelse": "",
  "bygningstype": "",
  "areal": "",
  "etasjer": "",
  "tiltakshaver": "",
  "ansvarligSoker": "",
  "risikoklasse": "",
  "brannklasse": "",
  "prosjekteringsmetode": "",
  "avgrensning": "",
  "tilleggskrav": "",
  "bygningshoyde": "",
  "regelverk": "",
  "bygningsbrannklasse": "",
  "byggeaar": "",
  "kapittel3": {
    "tilretteleggingLedd1a": null,
    "tilretteleggingLedd2a": null,
    "tilretteleggingLedd2b": null,
    "tilretteleggingLedd3": null,
    "brannalarmTalevarsling": null,
    "slokkeBrannslange": null,
    "slokkeHandslukker": null,
    "romningsvei": "",
    "romningsveiSvalgang": null,
    "romningsveiKorridorOver30m": null,
    "romningsveiPanikkbeslag": null,
    "romningsveiKommentar": "",
    "husdyrRedningRelevant": null,
    "husdyrTyper": "",
    "husdyrRedningKommentar": "",
    "universellUtforming": null
  },
  "avvik": []
}

Verdiregler:
- bygningstype: bruk én av: Bolig, Kontor, Skole, Barnehage, Sykehus og sykehjem, Overnattingssted og hotell, Forsamlingslokale, Salgslokale, Industri, Lager, Parkeringshus og garasje med to eller flere etasjer eller plan, Barnehjem.
- risikoklasse: "RK1"..."RK6".
- brannklasse: "BKL1"..."BKL3".
- prosjekteringsmetode: "preakseptert", "analyse" eller "blanding".
- regelverk: "TEK17", "TEK10", "TEK97" eller "BF85".
- bygningsbrannklasse: "A", "B" eller "C" (kun BF85).
- byggeaar: 4-sifret årstall, f.eks. "1992".
- etasjer / areal / bygningshoyde: kun tall.
- kapittel3.romningsvei: "1" eller "2" (antall rømningsveier per branncelle/seksjon).
- Alle kapittel3-boolean-felter: true hvis dokumentet eksplisitt sier at tiltaket finnes, false hvis det eksplisitt sier at det IKKE finnes, ellers null.

Om kapittel 3:
- Returner kun inngangsvariabler (om sprinkler/brannalarm finnes osv.) — IKKE avledede krav som branncellevegg-koder, brannklasse eller EI-verdier.
- Ikke fyll ut bygningsdeler eller multi-part-tabeller.
- Ved tvil: returner null/"".${extraTilstand}

Ikke inkluder sammendrag — dette genereres separat.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-pro",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `Analyser følgende dokument og trekk ut brannteknisk informasjon:\n\n${documentText.substring(0, 100000)}` },
        ],
        temperature: 0.1,
        response_format: { type: "json_object" },
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("AI API error:", response.status, errText);
      let errorType = "ai_failed";
      let userMessage = `AI-analysen feilet (HTTP ${response.status}).`;
      if (response.status === 402) {
        errorType = "payment_required";
        userMessage = "Lovable AI er tom for kreditter. Fyll på i Lovable Cloud → Settings → Usage.";
      } else if (response.status === 429) {
        errorType = "rate_limited";
        userMessage = "AI-tjenesten er midlertidig overbelastet. Prøv igjen om et øyeblikk.";
      }
      return new Response(JSON.stringify({ error: userMessage, errorType }), {
        status: response.status === 402 || response.status === 429 ? response.status : 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const aiResult = await response.json();
    const content = aiResult.choices?.[0]?.message?.content || "";

    // Extract JSON from response (handle markdown code blocks if present)
    let jsonStr = content;
    const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (jsonMatch) {
      jsonStr = jsonMatch[1].trim();
    }

    let extracted;
    try {
      extracted = JSON.parse(jsonStr);
    } catch {
      console.error("Failed to parse AI response:", content);
      return new Response(JSON.stringify({ error: "Could not parse AI response", raw: content }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ data: extracted }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Error:", err);
    return new Response(JSON.stringify({ error: err instanceof Error ? err.message : String(err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
