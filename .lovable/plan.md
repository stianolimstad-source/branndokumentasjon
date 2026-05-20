# Mobiltilpasning av ROS-analyse

ROS-analysen (`/ros-analyse`) er bygget som en låst todelt visning: input til venstre, forhåndsvisning til høyre, begge med fast høyde `h-[calc(100vh-117px)]` og egen scroll. På mobil stables panelene, men de beholder fast viewport-høyde — det gir to konkurrerende scroll-områder, knapper som forsvinner under tastaturet, og en topplinje som blir trang.

## Endringer (kun `src/pages/RosAnalyse.tsx`)

### 1. Topplinje (sticky header, linje 684–723)
- På mobil: vis kun ikoner for "Tilbake" og "Word"-knappen (skjul tekst med `hidden sm:inline`).
- La prosjektnavn ta plass med `truncate` og mindre tekst (`text-xs sm:text-sm`).
- Reduser horisontal padding på mobil (`px-2 sm:px-4`).

### 2. Split-screen → Tabs på mobil (linje 725–1603)
- Under `lg`-breakpoint: vis input og forhåndsvisning i `<Tabs>` ("Rediger" / "Forhåndsvisning") slik at brukeren ser ett panel av gangen.
- På `lg`+: behold dagens side-ved-side layout uendret.
- Tabs-navigasjonen plasseres sticky rett under topplinjen på mobil.

### 3. Fast høyde → naturlig flyt på mobil
- Input-panelet og preview-panelet bruker i dag `h-[calc(100vh-117px)]` + intern `overflow-y-auto`. På mobil fjernes fast høyde slik at hele siden scroller naturlig (ett scroll-område). På `lg`+ beholdes dagens oppførsel.
- Lagre-baren nederst (linje 1592) endres fra fast bunn-i-panel til normal flyt på mobil; på `lg`+ uendret.

### 4. Tetthet/overflow i input-seksjonene
- Metadata-grid (linje 731): `grid-cols-1 sm:grid-cols-2` (i dag alltid 2 kolonner → trange felter på mobil).
- Revisjonshistorikk-grid (linje 1581): `grid-cols-1 sm:grid-cols-3`.
- Reduser ytre padding på input-panelet: `p-4 sm:p-6` (linje 728).

### 5. Bow-tie kort (linje 1131–1545)
- Sjekk at de tre rutene (årsaker / topphendelse / konsekvenser) med `grid grid-cols-3` ikke sprenger mobilvisning — disse er allerede inne i et kort som blir smalt. Bytt til `grid-cols-1 md:grid-cols-3` der det forekommer (linje 1053, 1089) for å la S/K/R-feltene stable seg.

### 6. Preview-kontainer
- `RosPreview` har allerede `p-4 md:p-8` og horisontal-scroll-wrappere for tabeller — ingen endringer nødvendig der.
- Wrapper i RosAnalyse (linje 1600) får fjernet fast høyde på mobil, beholder den på `lg`+.

## Ikke berørt
- Forretningslogikk, AI-kall, datamodell, Word-eksport, RosPreview-komponenten, RosMatriks, RosKriterier.
