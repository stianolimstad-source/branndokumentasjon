// Hjelpere for å koble fravik (fra fraviksdokumentasjon) til TEK17-paragrafer.
// FravikEntry.funksjonskrav er en multiline-streng der hver linje typisk er en
// TEK17-paragrafetikett, f.eks. "§ 11-7. Brannseksjoner".

export const TEK17_PARAGRAFER: { id: string; label: string }[] = [
  { id: "11-1", label: "§ 11-1. Sikkerhet ved brann" },
  { id: "11-2", label: "§ 11-2. Risikoklasser" },
  { id: "11-3", label: "§ 11-3. Brannklasser" },
  { id: "11-4", label: "§ 11-4. Bæreevne og stabilitet" },
  { id: "11-5", label: "§ 11-5. Sikkerhet ved eksplosjon" },
  { id: "11-6", label: "§ 11-6. Tiltak mot brannspredning mellom byggverk" },
  { id: "11-7", label: "§ 11-7. Brannseksjoner" },
  { id: "11-8", label: "§ 11-8. Brannceller" },
  { id: "11-9", label: "§ 11-9. Materialer og produkters egenskaper ved brann" },
  { id: "11-10", label: "§ 11-10. Tekniske installasjoner" },
  { id: "11-11", label: "§ 11-11. Generelle krav om rømning og redning" },
  { id: "11-12", label: "§ 11-12. Tiltak for å påvirke rømnings- og redningstider" },
  { id: "11-13", label: "§ 11-13. Utgang fra branncelle" },
  { id: "11-14", label: "§ 11-14. Rømningsvei" },
  { id: "11-15", label: "§ 11-15. Tilrettelegging for redning av husdyr" },
  { id: "11-16", label: "§ 11-16. Tilrettelegging for manuell slokking" },
  { id: "11-17", label: "§ 11-17. Tilrettelegging for rednings- og slokkemannskap" },
];

export const extractParagrafIds = (funksjonskrav: string | undefined | null): string[] => {
  if (!funksjonskrav) return [];
  const found = new Set<string>();
  const re = /§\s*(11-\d+)/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(funksjonskrav)) !== null) found.add(m[1]);
  return Array.from(found);
};

export const paragrafLabelFor = (id: string): string => {
  return TEK17_PARAGRAFER.find(p => p.id === id)?.label ?? `§ ${id}`;
};
