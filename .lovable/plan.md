## Mål
Legge til en "Slett alle hendelser"-knapp i ROS-analysen som tømmer hele hendelse-listen, med bekreftelsesdialog (jf. prosjekt-sikkerhetsregel).

## Endring
**`src/pages/RosAnalyse.tsx`** — i verktøyraden over hendelse-akkordeon (linje ~419-438):
- Legg til en `Button` (variant `ghost`, rød tekst, `Trash2`-ikon) ved siden av "Lukk alle".
- Knappen er kun synlig når `content.hendelser.length > 0`.
- Klikk åpner en `AlertDialog` med tekst: "Vil du virkelig slette alle N hendelser? Handlingen kan ikke angres før du lagrer på nytt."
- Bekreftelse setter `content.hendelser = []` via `setContent`. Lagring skjer som vanlig via eksisterende lagre-knapp (ingen auto-save).

## Ikke endret
- Database, RLS, import-flyt, eller andre felter i ROS-content.
