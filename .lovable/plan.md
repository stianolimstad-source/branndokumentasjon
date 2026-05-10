## Mål
Fjerne muligheten for at en innlogget bruker kan legge seg selv inn i en hvilken som helst gruppe (spesielt som admin). Kun gruppe-administratorer skal kunne legge til medlemmer.

## Endring (kun database)

Erstatt INSERT-policyen på `public.group_members`:

**Før:**
```
WITH CHECK: auth.uid() = user_id OR is_group_admin(group_id, auth.uid())
```

**Etter:**
```
WITH CHECK: is_group_admin(group_id, auth.uid())
```

Dette betyr:
- Kun eksisterende admins kan legge til nye medlemmer i en gruppe.
- Den første admin (gruppe-oppretter) legges fortsatt til automatisk via triggeren `auto_add_group_admin`, som kjører med SECURITY DEFINER og dermed ikke berøres av RLS — så oppretting av nye grupper fungerer som før.
- "Legg til medlem"-dialogen fungerer som før, fordi den brukes av admin.

## Hva endres ikke
- DELETE-policyen beholdes som den er (`auth.uid() = user_id OR is_group_admin(...)`), slik at brukere fortsatt kan **forlate** en gruppe selv.
- Ingen frontend-endringer nødvendig.

## Verifisering
- Opprett ny gruppe → oppretter blir automatisk admin (trigger).
- Som admin: legg til medlem via dialog → fungerer.
- Som vanlig bruker: forsøk å selv-insert i annen gruppe via direkte spørring → blokkeres av RLS.
- Forlat gruppe → fungerer fortsatt.
- Marker sikkerhetsfunnet `group_members_privilege_escalation` som løst.
