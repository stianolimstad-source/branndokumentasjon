## Mål

Gi gruppe-administratorer mulighet til å forfremme andre medlemmer til admin, beskytte admins mot å bli fjernet av andre admins, og garantere at en gruppe alltid har minst én admin (auto-promotering ved sletting).

## Endringer

### 1. Database (migrasjon)

**RLS-oppdatering for `group_members`:**
- Legg til `UPDATE`-policy: en admin i gruppen kan oppdatere `role` for andre medlemmer (via `is_group_admin(group_id, auth.uid())`).
- Erstatt eksisterende `DELETE`-policy slik at:
  - Et medlem kan alltid forlate gruppen selv (slette egen rad), uansett rolle.
  - En admin kan slette **andre medlemmer** kun hvis målmedlemmet **ikke** er admin (admin kan ikke fjerne en annen admin).

**Trigger for å sikre minst én admin:**
- `BEFORE DELETE` trigger på `group_members`: hvis raden som slettes er admin og det ikke finnes andre admins i gruppen, finn det eldste gjenværende medlemmet (laveste `created_at`) og oppgrader til admin i samme transaksjon (`AFTER DELETE` for å se sletting). Bruker `SECURITY DEFINER`-funksjon for å omgå RLS ved auto-promotering.
- Hvis det er siste medlem i gruppen, gjør ingenting (gruppen blir tom – det håndteres allerede av eier-sletting).

### 2. Frontend (`src/pages/GruppeDetalj.tsx`)

Tab "Medlemmer":
- For admin-bruker, vis ekstra knapp ved siden av hvert ikke-admin-medlem: **"Gjør til admin"** (UPDATE `role='admin'`).
- For admin-bruker, vis **"Fjern admin"**-knapp ved siden av andre admins (kun hvis det er minst 2 admins) — lar admin nedgradere en annen admin til medlem.
- Skjul "Fjern"-knappen for medlemmer som er admin (RLS blokkerer uansett, men UI skal være konsistent).
- "Forlat gruppe"-knapp tillates også for admin (RLS tillater å slette egen rad). Etter forlatelse vil triggeren auto-promotere neste medlem hvis nødvendig.
- Vis toast med beskjed når auto-promotering har skjedd (best-effort: re-fetch og sjekk).

## Tekniske detaljer

```sql
-- Policy: admins kan oppdatere medlemsroller
CREATE POLICY "Admins can update member roles"
ON public.group_members FOR UPDATE
USING (public.is_group_admin(group_id, auth.uid()))
WITH CHECK (public.is_group_admin(group_id, auth.uid()));

-- Erstatt DELETE-policy
DROP POLICY "Users can delete group members" ON public.group_members;
CREATE POLICY "Members can leave or admins can remove non-admins"
ON public.group_members FOR DELETE
USING (
  auth.uid() = user_id
  OR (public.is_group_admin(group_id, auth.uid()) AND role <> 'admin')
);

-- Auto-promotering
CREATE OR REPLACE FUNCTION public.ensure_group_has_admin()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _next_user uuid;
BEGIN
  IF OLD.role = 'admin' THEN
    IF NOT EXISTS (SELECT 1 FROM group_members WHERE group_id = OLD.group_id AND role = 'admin') THEN
      SELECT user_id INTO _next_user FROM group_members
        WHERE group_id = OLD.group_id ORDER BY created_at ASC LIMIT 1;
      IF _next_user IS NOT NULL THEN
        UPDATE group_members SET role = 'admin'
          WHERE group_id = OLD.group_id AND user_id = _next_user;
      END IF;
    END IF;
  END IF;
  RETURN OLD;
END; $$;

CREATE TRIGGER ensure_group_has_admin_after_delete
AFTER DELETE ON public.group_members
FOR EACH ROW EXECUTE FUNCTION public.ensure_group_has_admin();
```

## Verifisering
- Admin forfremmer medlem → medlem får admin-badge.
- Admin prøver å fjerne annen admin → blokkert (RLS).
- Eneste admin forlater gruppen → eldste gjenværende medlem blir admin automatisk.
- Vanlig medlem ser ingen rolle-knapper.
