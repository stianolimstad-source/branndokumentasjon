const Personvern = () => (
  <div className="container mx-auto px-4 py-10 max-w-3xl prose prose-slate dark:prose-invert">
    <h1>Personvernerklæring</h1>
    <p><em>Sist oppdatert: 8. mai 2026</em></p>

    <h2>1. Behandlingsansvarlig</h2>
    <p>
      <strong>Olimstad Brannrådgivning AS</strong>, organisasjonsnummer
      <strong> 937 284 462</strong>, er behandlingsansvarlig for personopplysninger
      som behandles i tilknytning til tjenesten Branndokumentasjon («Tjenesten»).
    </p>

    <h2>2. Hvilke personopplysninger vi behandler</h2>
    <ul>
      <li><strong>Kontoopplysninger:</strong> navn, e-post, passord (kryptert), tittel, firma, telefon, logo</li>
      <li><strong>Innhold du legger inn:</strong> prosjekter, dokumenter, bilder, vurderinger</li>
      <li><strong>Bruksdata:</strong> innloggingstidspunkt, IP-adresse, nettleser, enhetsinformasjon, hendelseslogger</li>
      <li><strong>Supporthenvendelser:</strong> meldinger du sender til oss</li>
      <li><strong>Faktureringsdata:</strong> håndteres i sin helhet av Paddle (se punkt 4)</li>
    </ul>

    <h2>3. Formål og behandlingsgrunnlag</h2>
    <ul>
      <li>Levere og drifte Tjenesten — <em>oppfyllelse av avtale</em></li>
      <li>Brukerstøtte og kommunikasjon — <em>oppfyllelse av avtale</em></li>
      <li>Sikkerhet og forebygging av misbruk — <em>berettiget interesse</em></li>
      <li>Forbedring av Tjenesten — <em>berettiget interesse</em></li>
      <li>Lovpålagt regnskapsføring — <em>rettslig forpliktelse</em></li>
    </ul>

    <h2>4. Deling av opplysninger</h2>
    <p>Vi deler opplysninger med følgende kategorier mottakere:</p>
    <ul>
      <li>
        <strong>Paddle.com Market Limited</strong> — Merchant of Record for salg,
        abonnementshåndtering, betalinger, mva og fakturering.
      </li>
      <li>
        <strong>Supabase / Lovable Cloud</strong> — drift, hosting og database
        (databehandler).
      </li>
      <li>
        <strong>Underleverandører for AI-tjenester</strong> — kun når du aktivt
        bruker AI-funksjoner.
      </li>
      <li>
        <strong>Profesjonelle rådgivere</strong> (advokat, regnskap) ved behov.
      </li>
      <li>
        <strong>Offentlige myndigheter</strong> der vi er rettslig forpliktet.
      </li>
    </ul>

    <h2>5. Overføring utenfor EØS</h2>
    <p>
      Enkelte underleverandører kan behandle opplysninger utenfor EØS. Slik
      overføring skjer på grunnlag av EUs standardkontraktsklausuler (SCC)
      eller annen gyldig overføringsmekanisme.
    </p>

    <h2>6. Lagringstid</h2>
    <p>
      Vi lagrer opplysninger så lenge du har en aktiv konto, og inntil 90 dager
      etter sletting for å håndtere tvister og lovpålagte krav. Faktureringsdata
      hos Paddle lagres i henhold til norsk regnskapslovgivning (5 år).
    </p>

    <h2>7. Sikkerhet</h2>
    <p>
      Vi benytter tekniske og organisatoriske tiltak for å beskytte
      personopplysninger, inkludert kryptering ved overføring (TLS), kryptering
      ved lagring, tilgangsstyring (Row Level Security) og logging.
    </p>

    <h2>8. Dine rettigheter (GDPR)</h2>
    <ul>
      <li>Innsyn i egne opplysninger</li>
      <li>Korrigering av feilaktige opplysninger</li>
      <li>Sletting («retten til å bli glemt»)</li>
      <li>Begrensning av behandling</li>
      <li>Dataportabilitet</li>
      <li>Innsigelse mot behandling basert på berettiget interesse</li>
      <li>Trekke samtykke tilbake</li>
      <li>Klage til Datatilsynet (datatilsynet.no)</li>
    </ul>
    <p>Vi besvarer henvendelser senest innen én måned.</p>

    <h2>9. Informasjonskapsler (cookies)</h2>
    <p>
      Vi bruker kun nødvendige informasjonskapsler for innlogging og
      funksjonalitet. Vi bruker ikke markedsførings- eller sporingscookies.
    </p>

    <h2>10. Kontakt</h2>
    <p>
      Olimstad Brannrådgivning AS<br />
      E-post:{" "}
      <a href="mailto:stian.olimstad@xn--olimstadbrannrdgivning-15b.no">
        stian.olimstad@olimstadbrannrådgivning.no
      </a>
    </p>
  </div>
);

export default Personvern;
