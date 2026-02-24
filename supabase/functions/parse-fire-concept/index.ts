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

    const systemPrompt = `Du er en ekspert på brannteknisk prosjektering i Norge (TEK17/VTEK17). Du skal analysere et opplastet dokument og trekke ut relevant informasjon for et brannkonsept.

Returner BARE et JSON-objekt (ingen markdown, ingen forklaring) med følgende felter. Bruk tomme strenger "" for felter du ikke finner informasjon om. Ikke gjett – bruk kun informasjon som finnes i dokumentet.

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
  "sammendrag": ""
}

For bygningstype: bruk en av disse verdiene hvis mulig: Bolig, Kontor, Skole, Barnehage, Sykehus og sykehjem, Overnattingssted og hotell, Forsamlingslokale, Salgslokale, Industri, Lager, Parkeringshus og garasje med to eller flere etasjer eller plan, Barnehjem.

For risikoklasse: bruk format "RK1" til "RK6".
For brannklasse: bruk format "BKL1" til "BKL3".
For prosjekteringsmetode: bruk "preakseptert", "analyse" eller "blanding".
For etasjer: kun tall (f.eks. "3").
For areal: kun tall i m² (f.eks. "500").

Hvis dokumentet inneholder et sammendrag, inkluder det. Ellers generer et kort sammendrag basert på informasjonen du finner.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `Analyser følgende dokument og trekk ut brannteknisk informasjon:\n\n${documentText.substring(0, 50000)}` },
        ],
        temperature: 0.1,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("AI API error:", errText);
      return new Response(JSON.stringify({ error: "AI analysis failed" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const aiResult = await response.json();
    const content = aiResult.choices?.[0]?.message?.content || "";

    // Extract JSON from response (handle markdown code blocks)
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
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
