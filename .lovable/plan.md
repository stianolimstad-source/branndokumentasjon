

## Endring av kontakt-epost i footeren

**Hva som endres:**

I `src/pages/Index.tsx` (linje 321–323), footer-seksjonen nederst til høyre:

- **Fra:** `stianolimstad@gmail.com`
- **Til:** `stian.olimstad@olimstadbrannrådgivning.no`

Både `mailto:`-lenken og den synlige teksten oppdateres.

**Hva som IKKE endres:**

- `src/hooks/useCanDownload.ts` beholdes uendret (`stianolimstad@gmail.com`). Denne styrer hvilken konto som har tilgang til Word/PDF-nedlasting og er knyttet til din innloggings-epost i Lovable Cloud — ikke kontaktinfo.
- Telefon (907 01 285) og LinkedIn-lenken beholdes som de er.

**Teknisk merknad om æ/ø/å i e-postadresser:**

Domenet `olimstadbrannrådgivning.no` inneholder `å`. I HTML `mailto:`-attributtet brukes adressen direkte (moderne nettlesere håndterer dette korrekt via IDN/Punycode automatisk). Vi setter både `href="mailto:stian.olimstad@olimstadbrannrådgivning.no"` og synlig tekst likt.

