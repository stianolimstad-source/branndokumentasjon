// Brannseksjonering iht. TEK17 § 11-7.

/** Grenser for brannseksjonering (VTEK § 11-7, tabell 1). */
export const seksjoneringsGrenser: Record<string, { normalt: number; brannalarm: number; sprinkler: number; roykventilasjon: number }> = {
  "over400": { normalt: 800, brannalarm: 1200, sprinkler: 5000, roykventilasjon: 0 },
  "50-400": { normalt: 1200, brannalarm: 1800, sprinkler: 10000, roykventilasjon: 4000 },
  "under50": { normalt: 1800, brannalarm: 2700, sprinkler: Infinity, roykventilasjon: 10000 },
};

/** Sjekker om seksjonering er påkrevd basert på areal, brannenergi-kategori og aktive tiltak. */
export const isSeksjoneringRequired = (areal: string, brannenergi: string, tiltak: string): boolean => {
  const arealNum = parseFloat(areal) || 0;
  if (!brannenergi || arealNum <= 0) return false;
  const g = seksjoneringsGrenser[brannenergi];
  if (!g) return false;
  const maksAreal = g[tiltak as keyof typeof g] ?? g.normalt;
  if (maksAreal === 0) return true; // uegnet tiltak
  return arealNum > maksAreal && maksAreal !== Infinity;
};

/** Preaksepterte ytelser for seksjoneringsveggen (VTEK § 11-7). */
export const seksjoneringPreaksepterteYtelser = [
  "Takkonstruksjonen må ikke være kontinuerlig over seksjoneringsveggen på en slik måte at en kollaps på den ene siden medfører reduksjon av konstruksjonens bæreevne og brannmotstand på den andre siden.",
  "Konstruksjoner som ligger inntil seksjoneringsveggen må kunne bevege seg fritt ved temperaturendringer, uten at veggens branntekniske egenskaper reduseres.",
  "Seksjoneringsveggens avslutning mot tak og fasade må være utformet og utført for å hindre brannspredning mellom ulike seksjoner. Størst sikkerhet mot brannspredning oppnås ved å føre seksjoneringsveggen over takflaten og utenfor vegglivet, det vil si tilsvarende som for brannvegger, jf. § 11-6.",
  "Der seksjoner ligger inntil hverandre i et innvendig hjørne, må det treffes særskilte tiltak for å hindre brannspredning, jf. figur 1a og 1b.",
  "Seksjoneringsveggen må ha brannmotstand minst som angitt i tabell 2.",
  "Seksjoneringsveggen må i sin helhet bestå av materialer som tilfredsstiller klasse A2-s1,d0 [ubrennbare] og må kunne motstå mekanisk påkjenning. Isolasjonsmateriale som ikke tilfredsstiller klasse A2-s1,d0 kan likevel benyttes når det er dokumentert ved prøvning at materialet ikke blir involvert i brannen i den forutsatte brannmotstandstiden.",
  "Dersom mekanisk motstandsevne (M) ikke er dokumentert ved prøvning, må seksjoneringsveggen utføres i tunge materialer som mur, betong eller lignende.",
  "Seksjoneringsveggen må føres minimum 0,5 meter over høyeste tilstøtende tak, med mindre taket har brannmotstand minst EI 60 A2-s1,d0 [A 60].",
  "Seksjoneringsveggen må være slik utført at den blir stående selv om byggverket på den ene eller andre siden raser sammen. Alternativt kan det bygges to uavhengige seksjoneringsvegger, eller byggverkets bæresystem kan dimensjoneres for brannmotstand tilsvarende en seksjoneringsvesgg.",
  "Seksjonering ved innvendig hjørne må utføres slik at, jf. figur 1: 1) seksjoneringsveggen føres minimum 8,0 meter fram og forbi hjørnet, eller 2) seksjoneringsveggen føres minimum 5,0 meter forbi innvendig hjørne i begge fasadene.",
];
