## Mål
Opprette en ny TypeScript-fil `src/lib/ros-sjekklister.ts` som inneholder strukturerte sjekklister fra NVE-veilederen for ROS-analyser i kraftforsyningen, vedlegg 1.

## Endringer

### 1. Ny fil: `src/lib/ros-sjekklister.ts`
- Definer typer: `Anleggstype`, `Sjekklistepunkt`, `Sjekkliste`, `SaerskiltForhold`
- Definer `SJEKKLISTER: Record<Anleggstype, Sjekkliste>` med alle 8 anleggstyper fra veilederen
- Definer `SAERSKILTE_FORHOLD: SaerskiltForhold[]` med 4 kategorier (omgivelser, personell, teknisk, tilsiktet)
- Ingen eksisterende filer endres – dette er en ren tilleggsmodul som fremtidige ROS-editor-komponenter kan importere

## Innhold (eksempelstruktur per anleggstype)
Hver `Sjekkliste` inneholder:
- `anleggstype`: enum-verdi
- `navn`: visningsnavn på norsk
- `beskrivelse`: kort omfangstekst
- `delelementer`: array av komponenter/delsystemer
- `punkter`: array av `{ delelement, hendelse, beskrivelse }`

Alle hendelser og delelementer er direkte fra NVE-veilederen vedlegg 1 som brukeren har oppgitt.
